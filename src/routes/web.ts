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
import { getVideoCreditCost } from "@/config/pricing";
import jwt from "jsonwebtoken";
import * as fs from "fs";
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
    reply.view("web/landing.ejs");
  });

  // Facebook domain verification
  server.get(
    "/go7u73s641jq2jtd8gfh2ecbl94kmy.html",
    async (_request, reply) => {
      reply.type("text/html").send("go7u73s641jq2jtd8gfh2ecbl94kmy");
    },
  );

  // Web app
  server.get("/app", async (_request, reply) => {
    reply.view("web/app.ejs");
  });

  // ── AUTH ──
  server.post("/auth/telegram", async (request, reply) => {
    try {
      const userData = request.body as any;
      if (!userData || !userData.id) {
        return reply.status(400).send({ error: "Invalid user data" });
      }
      const isValid = checkTelegramHash(userData, BOT_TOKEN);
      if (
        !isValid &&
        process.env.NODE_ENV === "production" &&
        userData.hash !== "twa"
      ) {
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
      const { niche, style, duration, customPrompt, storyboard } =
        request.body as any;
      if (!niche || !duration)
        return reply.status(400).send({ error: "niche and duration required" });

      const creditCost = getVideoCreditCost(duration);
      if (Number(user.creditBalance) < creditCost) {
        return reply.status(402).send({
          error: `Insufficient credits. Need ${creditCost}, have ${user.creditBalance}`,
        });
      }

      // Deduct credits
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

      // Create DB record
      await prisma.video.create({
        data: {
          userId: user.telegramId,
          jobId,
          niche,
          platform: "tiktok",
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
        platform: "tiktok",
        duration,
        scenes: sceneData.length,
        storyboard: sceneData,
        customPrompt: customPrompt || undefined,
        userId: user.telegramId.toString(),
        chatId: Number(user.telegramId),
      });

      return { ok: true, jobId, message: "Video generation started" };
    } catch (error: any) {
      server.log.error({ error }, "Video create error");
      return reply
        .status(500)
        .send({ error: error.message || "Failed to create video" });
    }
  });

  // ── PACKAGES ──
  server.get("/api/packages", async () => {
    return PaymentService.getPackages();
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

  // ── VIDEO DOWNLOAD ──
  server.get("/video/:jobId/download", async (request, reply) => {
    try {
      const { jobId } = request.params as { jobId: string };
      const { token } = request.query as { token?: string };
      if (!token) return reply.status(401).send({ error: "Missing token" });
      let decoded: string;
      try {
        decoded = Buffer.from(token, "base64").toString("utf-8");
      } catch {
        return reply.status(401).send({ error: "Invalid token" });
      }
      const [tokenUserId, tokenJobId] = decoded.split(":");
      if (!tokenUserId || tokenJobId !== jobId)
        return reply.status(403).send({ error: "Token mismatch" });
      const video = await VideoService.getByJobId(jobId);
      if (!video) return reply.status(404).send({ error: "Video not found" });
      if (video.userId.toString() !== tokenUserId)
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
