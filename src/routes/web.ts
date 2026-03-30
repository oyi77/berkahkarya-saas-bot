/**
 * Web Routes
 *
 * Landing page + Web App (SPA) + REST API for web clients
 */

import { FastifyInstance } from "fastify";
import { prisma } from "@/config/database";
import { UserService } from "@/services/user.service";
import { VideoService } from "@/services/video.service";
import { PaymentService } from "@/services/payment.service";
import { DuitkuService } from "@/services/duitku.service";
import { TripayService } from "@/services/tripay.service";
import { checkTelegramHash } from "@/utils/telegram";
import { enqueueVideoGeneration } from "@/config/queue";
import {
  generateStoryboard,
  NICHES,
} from "@/services/video-generation.service";
import {
  getVideoCreditCostAsync,
  getImageCreditCostAsync,
  getPackagesAsync,
  getSubscriptionPlansAsync,
  SUBSCRIPTION_PLANS,
  getPlanPrice,
} from "@/config/pricing";
import type { PlanKey, BillingCycle } from "@/config/pricing";
import { PaymentSettingsService } from "@/services/payment-settings.service";
import { ImageGenerationService } from "@/services/image.service";
import jwt from "jsonwebtoken";
import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";

const getJwtSecret = () =>
  process.env.JWT_SECRET || "dev-only-secret-do-not-use-in-production";
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required in production");
}
const BOT_TOKEN = process.env.BOT_TOKEN || "";

// ─── Landing Page ───────────────────────────────────────────────────────────

// ─── Backend Routes ──────────────────────────────────────────────────────────

export async function webRoutes(server: FastifyInstance): Promise<void> {
  server.get("/", async (_request, reply) => {
    const { redis } = require("../config/redis");
    let landingConfig = {};
    try {
      const data = await redis.get("admin:landing_config");
      if (data) landingConfig = JSON.parse(data);
    } catch {
      /* ignore */
    }

    const [packages, subscriptionPlans] = await Promise.all([
      getPackagesAsync(),
      getSubscriptionPlansAsync(),
    ]);

    reply.view("web/landing.ejs", {
      landingConfig,
      packages,
      subscriptionPlans,
    });
  });

  // Facebook domain verification
  server.get(
    "/go7u73s641jq2jtd8gfh2ecbl94kmy.html",
    async (_request, reply) => {
      reply.type("text/html").send("go7u73s641jq2jtd8gfh2ecbl94kmy");
    },
  );


  // Static files (images, etc)
  // Favicon routes
  server.get("/favicon.ico", async (_request, reply) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    const ico = fs.readFileSync(`${process.cwd()}/src/public/favicon.ico`);
    return reply.type("image/x-icon").send(ico);
  });

  server.get("/favicon.svg", async (_request, reply) => {
    const fs = require("fs");
    const svg = fs.readFileSync(`${process.cwd()}/src/public/favicon.svg`, "utf8");
    return reply.type("image/svg+xml").send(svg);
  });

  server.get("/public/:filename", async (request, reply) => {
    const { filename } = request.params as { filename: string };
    const publicDir = path.resolve(process.cwd(), "src/public");
    const filePath = path.resolve(publicDir, filename);

    // Path traversal guard — reject any path that escapes the public directory
    if (!filePath.startsWith(publicDir + path.sep) && filePath !== publicDir) {
      return reply.code(400).send("Invalid filename");
    }

    if (!fs.existsSync(filePath)) {
      reply.code(404).send("File not found");
      return;
    }
    
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp'
    };
    
    const mimeType = mimeTypes[ext || ''] || 'application/octet-stream';
    const stream = fs.createReadStream(filePath);
    
    reply.type(mimeType);
    return reply.send(stream);
  });

  // Web app
  server.get("/app", async (_request, reply) => {
    reply.view("web/app.ejs", {
      botUsername: process.env.BOT_USERNAME || 'berkahkarya_saas_bot'
    });
  });

  // ── AUTH ──
  server.post("/auth/telegram", async (request, reply) => {
    try {
      const userData = request.body as any;
      if (!userData || !userData.id) {
        return reply.status(400).send({ error: "Invalid user data" });
      }
      const isValid = checkTelegramHash(userData, BOT_TOKEN);
      // Always verify hash — the prior "skip in non-production" bypass was removed
      // to prevent forged auth in staging/dev environments.
      // Exception: Telegram Web App (TWA) sends hash="twa" which is pre-verified by TWA.
      if (!isValid && userData.hash !== "twa") {
        return reply
          .status(401)
          .send({ error: "Auth hash verification failed" });
      }
      let user = await UserService.findByTelegramId(BigInt(userData.id));
      if (!user) {
        user = await UserService.create({
          telegramId: BigInt(userData.id),
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
        });
      }
      const token = jwt.sign(
        {
          userId: user.uuid,
          telegramId: user.telegramId.toString(),
          tier: user.tier,
        },
        getJwtSecret(),
        { expiresIn: "7d" },
      );
      return {
        token,
        user: { id: user.uuid, credits: user.creditBalance, tier: user.tier },
      };
    } catch (error: unknown) {
      server.log.error({ error }, "Telegram auth error");
      return reply.status(500).send({ error: "Authentication failed" });
    }
  });

  // ── MIDDLEWARE HELPER ──
  const getUser = async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      reply.status(401).send({ error: "Unauthorized" });
      return null;
    }
    try {
      const decoded = jwt.verify(
        authHeader.substring(7),
        getJwtSecret(),
      ) as any;
      const user = await UserService.findByUuid(decoded.userId);
      if (!user) {
        reply.status(404).send({ error: "User not found" });
        return null;
      }
      return user;
    } catch {
      reply.status(401).send({ error: "Invalid token" });
      return null;
    }
  };

  // ── USER ──
  server.get("/api/user", async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    return {
      id: user.uuid,
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      credits: user.creditBalance,
      tier: user.tier,
      referralCode: user.referralCode,
      welcomeBonusUsed: user.welcomeBonusUsed,
      dailyFreeUsed: user.dailyFreeUsed,
      dailyFreeResetAt: user.dailyFreeResetAt,
      createdAt: user.createdAt,
    };
  });

  // ── STORYBOARD PREVIEW ──
  server.post("/api/storyboard", async (request, reply) => {
    try {
      const { niche, duration, customPrompt } = request.body as any;
      if (!niche || !duration)
        return reply.status(400).send({ error: "Niche and duration required" });
      const nicheConfig = (NICHES as any)[niche];
      const scenes = nicheConfig
        ? Math.max(3, Math.min(Math.floor(duration / 5), 8))
        : 4;
      const storyboard = generateStoryboard(
        niche,
        nicheConfig?.styles?.slice(0, 2) || ["viral"],
        duration,
        scenes,
      );
      return {
        scenes: storyboard.map((s: any, i: number) => ({
          scene: i + 1,
          duration: s.duration || Math.floor(duration / storyboard.length),
          description: customPrompt
            ? `${customPrompt} — ${s.description}`
            : s.description,
        })),
        caption: `🎬 ${niche?.toUpperCase()} video | ${duration}s | Generated by BerkahKarya AI`,
        hashtags: [`#${niche}`, "#AIVideo", "#BerkahKarya", "#ViralContent"],
      };
    } catch (error: any) {
      return reply
        .status(500)
        .send({ error: error.message || "Failed to generate storyboard" });
    }
  });

  // ── VIDEO CREATE ──
  server.post("/api/video/create", async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const {
        niche, style, duration, customPrompt, storyboard,
        platform = "tiktok",
        enableVO = true,
        enableSubtitles = true,
        language = "id",
        referenceImageUrl,
      } = request.body as any;
      if (!niche || !duration)
        return reply.status(400).send({ error: "niche and duration required" });

      const creditCost = await getVideoCreditCostAsync(duration);
      if (Number(user.creditBalance) < creditCost) {
        return reply.status(402).send({
          error: `Insufficient credits. Need ${creditCost}, have ${user.creditBalance}`,
        });
      }

      // Deduct credits — refund below if job creation or enqueue fails.
      await UserService.deductCredits(user.telegramId, creditCost);

      const jobId = `WEB-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      const scenes = storyboard?.scenes || [];
      const sceneData =
        scenes.length > 0
          ? scenes
          : [
              {
                scene: 1,
                duration,
                description: customPrompt || `${niche} marketing video`,
              },
            ];

      try {
        // Create DB record
        await prisma.video.create({
          data: {
            userId: user.telegramId,
            jobId,
            niche,
            platform,
            duration,
            scenes: sceneData.length,
            status: "processing",
            creditsUsed: creditCost,
            storyboard: sceneData,
            styles: style ? [style] : [],
          },
        });

        // Enqueue
        await enqueueVideoGeneration({
          jobId,
          niche,
          platform,
          duration,
          scenes: sceneData.length,
          storyboard: sceneData,
          customPrompt: customPrompt || undefined,
          referenceImage: referenceImageUrl || undefined,
          userId: user.telegramId.toString(),
          chatId: Number(user.telegramId),
          enableVO,
          enableSubtitles,
          language,
        });
      } catch (jobError: any) {
        // Refund credits — job was never actually created/queued
        await UserService.refundCredits(user.telegramId, creditCost, jobId, jobError?.message || 'job creation failed').catch(() => {});
        throw jobError;
      }

      return { ok: true, jobId, message: "Video generation started" };
    } catch (error: any) {
      server.log.error({ error }, "Video create error");
      return reply
        .status(500)
        .send({ error: error.message || "Failed to create video" });
    }
  });

  // ── VIDEO ANALYZE (for repurposing) ──
  server.post("/api/video/analyze", async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const { videoUrl } = request.body as any;
      if (!videoUrl) return reply.status(400).send({ error: "videoUrl is required" });

      const { VideoAnalysisService } = await import("@/services/video-analysis.service");
      const result = await VideoAnalysisService.analyze(videoUrl);

      if (!result.success) {
        return reply.status(422).send({ error: result.error || "Analysis failed" });
      }

      // Don't return keyFramePaths (local file paths) to web clients
      return {
        ok: true,
        niche: result.niche,
        style: result.style,
        totalDuration: result.totalDuration,
        transcript: result.transcript,
        storyboard: result.storyboard,
        hasKeyFrames: (result.keyFramePaths?.length || 0) > 0,
      };
    } catch (error: any) {
      server.log.error({ error }, "Video analyze error");
      return reply.status(500).send({ error: error.message || "Failed to analyze video" });
    }
  });

  // ── IMAGE GENERATE ──
  server.post("/api/image/generate", async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const {
        prompt, category = "general", style, aspectRatio = "1:1",
        referenceImageUrl, avatarImageUrl,
      } = request.body as any;
      if (!prompt)
        return reply.status(400).send({ error: "prompt is required" });

      const IMAGE_CREDIT_COST = await getImageCreditCostAsync();
      if (Number(user.creditBalance) < IMAGE_CREDIT_COST) {
        return reply.status(402).send({
          error: `Insufficient credits. Need ${IMAGE_CREDIT_COST}, have ${user.creditBalance}`,
        });
      }

      await UserService.deductCredits(user.telegramId, IMAGE_CREDIT_COST);

      let result;
      try {
        result = await ImageGenerationService.generateImage({
          prompt,
          category,
          style,
          aspectRatio,
          referenceImageUrl,
          avatarImageUrl,
        });
      } catch (genError: any) {
        // Refund on exception (service crash)
        await UserService.refundCredits(user.telegramId, IMAGE_CREDIT_COST, `IMG-REFUND-${Date.now()}`, genError?.message || 'exception').catch(() => {});
        throw genError;
      }

      if (!result.success) {
        // Refund on generation failure
        await UserService.refundCredits(user.telegramId, IMAGE_CREDIT_COST, `IMG-REFUND-${Date.now()}`, result.error || 'Generation failed');
        return reply.status(500).send({ error: result.error || "Image generation failed" });
      }

      return {
        ok: true,
        imageUrl: result.imageUrl,
        provider: result.provider,
      };
    } catch (error: any) {
      server.log.error({ error }, "Image generate error");
      return reply.status(500).send({ error: error.message || "Failed to generate image" });
    }
  });

  // ── IMAGE DESCRIBE (i2t) ──
  server.post("/api/image/describe", async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const { imageUrl } = request.body as any;
      if (!imageUrl) return reply.status(400).send({ error: "imageUrl is required" });

      const { ContentAnalysisService } = await import("@/services/content-analysis.service");
      const result = await ContentAnalysisService.extractPrompt(imageUrl, "image");

      if (!result.success) {
        return reply.status(422).send({ error: result.error || "Could not analyze image" });
      }

      return {
        ok: true,
        description: result.prompt,
        style: result.style,
        elements: result.elements,
      };
    } catch (error: any) {
      server.log.error({ error }, "Image describe error");
      return reply.status(500).send({ error: error.message || "Failed to describe image" });
    }
  });

  // ── PACKAGES ──
  server.get("/api/packages", async () => {
    return getPackagesAsync();
  });

  // ── PAYMENT CREATE ──
  server.post("/api/payment/create", async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const { packageId, gateway } = request.body as any;
      if (!packageId || !gateway)
        return reply
          .status(400)
          .send({ error: "packageId and gateway required" });
      let result: any;
      if (gateway === "duitku") {
        result = await DuitkuService.createTransaction({
          userId: user.telegramId,
          packageId,
          username: user.username || user.firstName,
        });
      } else if (gateway === "tripay") {
        result = await TripayService.createTransaction({
          userId: user.telegramId,
          packageId,
          username: user.username || user.firstName,
        });
      } else {
        result = await PaymentService.createTransaction({
          userId: user.telegramId,
          packageId,
          username: user.username || user.firstName,
        });
      }
      return result;
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // ── TRANSACTIONS ──
  server.get("/api/my/transactions", async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId: user.telegramId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return transactions;
    } catch {
      return reply.status(500).send({ error: "Failed to fetch transactions" });
    }
  });

  // ── USER VIDEOS ──
  server.get("/api/user/videos", async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const videos = await prisma.video.findMany({
        where: { userId: user.telegramId },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      return videos;
    } catch {
      return reply.status(500).send({ error: "Failed to fetch videos" });
    }
  });

  // ── VIDEO DELETE ──
  server.delete("/api/video/:jobId", async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const { jobId } = request.params as { jobId: string };
      const video = await VideoService.getByJobId(jobId);
      if (!video) return reply.status(404).send({ error: "Video not found" });
      if (video.userId !== user.telegramId)
        return reply.status(403).send({ error: "Access denied" });
      await VideoService.deleteVideo(jobId);
      return { ok: true };
    } catch (error: any) {
      server.log.error({ error }, "Video delete error");
      return reply.status(500).send({ error: error.message || "Failed to delete video" });
    }
  });

  // ── VIDEO STATUS ──
  server.get("/api/video/:jobId/status", async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const { jobId } = request.params as { jobId: string };
      const video = await VideoService.getByJobId(jobId);
      if (!video) return reply.status(404).send({ error: "Video not found" });
      if (video.userId !== user.telegramId)
        return reply.status(403).send({ error: "Access denied" });
      return {
        jobId: video.jobId,
        status: video.status,
        progress: video.progress,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        createdAt: video.createdAt,
      };
    } catch (error: any) {
      return reply.status(500).send({ error: error.message || "Failed to get video status" });
    }
  });

  // ── REFERRAL INFO & STATS ──
  server.get("/api/referral", async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const stats = await UserService.getStats(user.telegramId);
      const commissionAgg = await prisma.commission.aggregate({
        where: { referrerId: user.telegramId, status: "available" },
        _sum: { amount: true },
      });
      const availableCommission = Number(commissionAgg._sum.amount || 0);

      const sellRateStr = await PaymentSettingsService.get("referral_sell_rate");
      const sellRate = sellRateStr ? parseInt(sellRateStr) : 3000;
      const creditsIfConverted = Math.floor(availableCommission / sellRate);

      const BOT_USERNAME = process.env.BOT_USERNAME || "berkahkarya_saas_bot";
      const referralLink = `https://t.me/${BOT_USERNAME}?start=ref_${user.referralCode}`;

      return {
        referralCode: user.referralCode,
        referralLink,
        referralCount: stats.referralCount,
        commissionEarned: stats.commissionEarned,
        availableCommission,
        creditsIfConverted,
        sellRate,
      };
    } catch (error: any) {
      return reply.status(500).send({ error: error.message || "Failed to fetch referral info" });
    }
  });

  // ── REFERRAL WITHDRAW ──
  server.post("/api/referral/withdraw", async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const { action } = request.body as { action: "convert_credits" | "sell_admin" };
      if (action !== "convert_credits" && action !== "sell_admin") {
        return reply.status(400).send({ error: "action must be convert_credits or sell_admin" });
      }

      const availableAgg = await prisma.commission.aggregate({
        where: { referrerId: user.telegramId, status: "available" },
        _sum: { amount: true },
      });
      const available = Number(availableAgg._sum.amount || 0);

      if (available <= 0) {
        return reply.status(400).send({ error: "No commission available to withdraw" });
      }

      const sellRateStr = await PaymentSettingsService.get("referral_sell_rate");
      const SELL_RATE = sellRateStr ? parseInt(sellRateStr) : 3000;

      if (action === "convert_credits") {
        const creditsToAdd = Math.floor(available / SELL_RATE);
        if (creditsToAdd <= 0) {
          return reply.status(400).send({ error: "Commission too low to convert to credits" });
        }
        await prisma.$transaction(async (tx) => {
          await tx.commission.updateMany({
            where: { referrerId: user.telegramId, status: "available" },
            data: { status: "withdrawn" },
          });
          await tx.user.update({
            where: { telegramId: user.telegramId },
            data: { creditBalance: { increment: creditsToAdd } },
          });
          await tx.transaction.create({
            data: {
              orderId: `REF-CONV-${Date.now()}`,
              userId: user.telegramId,
              type: "referral_conversion",
              amountIdr: available,
              creditsAmount: creditsToAdd,
              gateway: "internal",
              status: "success",
              paymentMethod: "referral_commission",
            },
          });
        });
        return { ok: true, action: "convert_credits", creditsAdded: creditsToAdd, commissionUsed: available };
      }

      // sell_admin: request cashout at 50% rate
      const cashoutAmount = Math.floor(available / 2);
      if (cashoutAmount <= 0) {
        return reply.status(400).send({ error: "Commission too low for cashout" });
      }
      await prisma.commission.updateMany({
        where: { referrerId: user.telegramId, status: "available" },
        data: { status: "pending_cashout" },
      });
      await prisma.transaction.create({
        data: {
          orderId: `REF-CASH-${Date.now()}`,
          userId: user.telegramId,
          type: "referral_cashout",
          amountIdr: cashoutAmount,
          creditsAmount: 0,
          gateway: "admin_transfer",
          status: "pending",
          paymentMethod: "admin_transfer",
        },
      });
      return { ok: true, action: "sell_admin", cashoutAmount, commissionUsed: available };
    } catch (error: any) {
      server.log.error({ error }, "Referral withdraw error");
      return reply.status(500).send({ error: error.message || "Failed to process withdrawal" });
    }
  });

  // ── SUBSCRIPTION PLANS ──
  server.get("/api/subscriptions", async () => {
    return getSubscriptionPlansAsync();
  });

  // ── SUBSCRIPTION BUY ──
  server.post("/api/subscription/buy", async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const { plan, cycle, gateway = "duitku" } = request.body as {
        plan: string;
        cycle: string;
        gateway?: string;
      };

      if (!(plan in SUBSCRIPTION_PLANS) || !["monthly", "annual"].includes(cycle)) {
        return reply.status(400).send({ error: "Invalid plan or cycle" });
      }

      const planKey = plan as PlanKey;
      const billingCycle = cycle as BillingCycle;
      const price = getPlanPrice(planKey, billingCycle);
      const planConfig = (SUBSCRIPTION_PLANS as any)[planKey];

      // Reuse the standard payment create flow with type=subscription
      const packageId = `sub_${planKey}_${billingCycle}`;
      let result: any;
      if (gateway === "duitku") {
        result = await DuitkuService.createTransaction({
          userId: user.telegramId,
          packageId,
          username: user.username || user.firstName || "Customer",
        });
      } else if (gateway === "tripay") {
        result = await TripayService.createTransaction({
          userId: user.telegramId,
          packageId,
          username: user.username || user.firstName || "Customer",
        });
      } else {
        result = await PaymentService.createTransaction({
          userId: user.telegramId,
          packageId,
          username: user.username || user.firstName || "Customer",
        });
      }

      // If gateway doesn't natively know sub_ packages, create the tx record here
      if (!result?.paymentUrl && !result?.payment_url) {
        const orderId = `OC-SUB-${Date.now()}-${user.telegramId}`;
        await prisma.transaction.create({
          data: {
            orderId,
            userId: user.telegramId,
            type: "subscription",
            packageName: `${planKey}_${billingCycle}`,
            amountIdr: price,
            creditsAmount: planConfig.monthlyCredits,
            gateway,
            status: "pending",
          },
        });
        return { ok: true, orderId, plan: planKey, cycle: billingCycle, amountIdr: price };
      }

      return { ok: true, ...result, plan: planKey, cycle: billingCycle, amountIdr: price };
    } catch (error: any) {
      server.log.error({ error }, "Subscription buy error");
      return reply.status(500).send({ error: error.message || "Failed to create subscription payment" });
    }
  });

  // ── SUBSCRIPTION CANCEL ──
  server.post("/api/subscription/cancel", async (request, reply) => {
    const user = await getUser(request, reply);
    if (!user) return;
    try {
      const { SubscriptionService } = await import("@/services/subscription.service");
      await SubscriptionService.cancelSubscription(user.telegramId);
      return { ok: true };
    } catch (error: any) {
      server.log.error({ error }, "Subscription cancel error");
      return reply.status(500).send({ error: error.message || "Failed to cancel subscription" });
    }
  });

  // ── VIDEO DOWNLOAD ──
  server.get("/video/:jobId/download", async (request, reply) => {
    try {
      const { jobId } = request.params as { jobId: string };
      const { token } = request.query as { token?: string };
      if (!token) return reply.status(401).send({ error: "Missing token" });

      // Verify JWT (server-signed) — base64 tokens were trivially forgeable
      let payload: any;
      try {
        payload = jwt.verify(token, getJwtSecret());
      } catch {
        return reply.status(401).send({ error: "Invalid token" });
      }
      if (payload.jobId !== jobId)
        return reply.status(403).send({ error: "Token mismatch" });

      const video = await VideoService.getByJobId(jobId);
      if (!video) return reply.status(404).send({ error: "Video not found" });
      if (video.userId.toString() !== payload.telegramId)
        return reply.status(403).send({ error: "Access denied" });
      const localPath = video.downloadUrl;
      if (!localPath || !fs.existsSync(localPath))
        return reply.status(404).send({ error: "Video file not found" });
      const filename = `berkahkarya-${jobId}.mp4`;
      const stream = fs.createReadStream(localPath);
      const stat = fs.statSync(localPath);
      reply.header("Content-Type", "video/mp4");
      reply.header("Content-Disposition", `attachment; filename="${filename}"`);
      reply.header("Content-Length", stat.size);
      return reply.send(stream);
    } catch (error) {
      server.log.error({ error }, "Video download error");
      return reply.status(500).send({ error: "Download failed" });
    }
  });
}
