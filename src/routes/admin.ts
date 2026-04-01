/**
 * Admin Dashboard - Web Interface
 *
 * Serves a web UI for bot management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";
import { prisma } from "@/config/database";
import { getQueueStats, addNotificationJob } from "@/config/queue";
import { PaymentSettingsService } from "@/services/payment-settings.service";
import { MetricsService } from "@/services/metrics.service";
import { redis } from "@/config/redis";
import { PROVIDER_CONFIG } from "@/config/providers";
import { GamificationService, BADGES } from "@/services/gamification.service";
import { retentionQueue } from "@/workers/retention.worker";
import { HOOK_VARIATIONS } from "@/services/campaign.service";
import { CREDIT_PACKAGES_V3, SUBSCRIPTION_PLANS_V3, UNIT_COSTS, REFERRAL_COMMISSIONS_V3 } from "@/config/pricing";
import { INDUSTRY_TEMPLATES, DURATION_PRESETS } from "@/config/hpas-engine";
import { ProviderSettingsService } from "@/services/provider-settings.service";
import { getOmniRouteService } from "@/services/omniroute.service";
import { UserService } from "@/services/user.service";
import { t } from "@/i18n/translations";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

const LOGIN_RATE_LIMIT_MAX = 5;
const LOGIN_RATE_LIMIT_WINDOW = 15 * 60; // 15 minutes in seconds

/** Pixel/analytics IDs passed to all EJS views */
function trackingVars() {
  return {
    fbPixelId: process.env.FACEBOOK_PIXEL_ID || "",
    ga4Id: process.env.GA4_TRACKING_ID || "",
    ttPixelId: process.env.TIKTOK_PIXEL_ID || "",
  };
}

/** Timing-safe string comparison to prevent timing attacks */
function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to keep constant time, then return false
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/** HMAC-SHA256 token derived from ADMIN_PASSWORD — not trivially reversible unlike base64 */
function makeAdminToken(password: string): string {
  return crypto.createHmac('sha256', 'openclaw-admin-v1').update(password).digest('hex');
}

async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!ADMIN_PASSWORD) {
    return reply.status(503).send({ error: "Admin password not configured" });
  }

  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString();
    const [, password] = decoded.split(":");
    if (password && timingSafeCompare(password, ADMIN_PASSWORD)) return;
  }

  const cookie = (request.headers.cookie || "")
    .split(";")
    .find((c) => c.trim().startsWith("admin_token="));
  if (cookie) {
    const token = cookie.split("=")[1]?.trim();
    if (token && timingSafeCompare(token, makeAdminToken(ADMIN_PASSWORD))) return;
  }

  reply
    .status(401)
    .header("WWW-Authenticate", 'Basic realm="Admin"')
    .send({ error: "Unauthorized" });
}

/**
 * Register admin routes
 */
export async function adminRoutes(server: FastifyInstance): Promise<void> {
  server.addHook("onRequest", async (request, reply) => {
    const url = request.url;
    // Exclude login page and login POST from auth
    if (url === "/admin/login" || url.startsWith("/admin/login?")) {
      return;
    }
    const isAdminRoute =
      url === "/admin" ||
      url === "/admin/dashboard" ||
      url === "/admin/pricing" ||
      url === "/admin/prompts" ||
      url === "/admin/settings" ||
      url === "/admin/users" ||
      url.startsWith("/api/stats") ||
      url.startsWith("/api/analytics") ||
      url.startsWith("/api/users") ||
      url.startsWith("/api/transactions") ||
      url.startsWith("/api/videos") ||
      url.startsWith("/api/broadcast") ||
      url.startsWith("/api/config") ||
      url.startsWith("/api/payment-settings") ||
      url.startsWith("/api/pricing") ||
      url.startsWith("/api/provider-costs") ||
      url.startsWith("/api/admin-prompts") ||
      url.startsWith("/api/token-stats") ||
      url.startsWith("/api/token-usage") ||
      url.startsWith("/api/profit-report") ||
      url.startsWith("/api/settings/") ||
      url.startsWith("/api/admin/") ||
      url.startsWith("/api/referral/") ||
      (url.startsWith("/api/system/") && url !== "/api/system/health");
    if (isAdminRoute) {
      await verifyAdmin(request, reply);
    }
  });

  // Login page (no auth required)
  server.get("/admin/login", async (_request, reply) => {
    return reply.view("admin/login.ejs");
  });

  // Admin dashboard (with auth) - redirect to dashboard if already logged in
  server.get("/admin", async (request, reply) => {
    const cookie = (request.headers.cookie || "")
      .split(";")
      .find((c) => c.trim().startsWith("admin_token="));
    if (cookie) {
      const token = cookie.split("=")[1]?.trim();
      if (token && timingSafeCompare(token, makeAdminToken(ADMIN_PASSWORD))) {
        return reply.redirect("/admin/dashboard");
      }
    }
    return reply.redirect("/admin/login");
  });

  // Login POST endpoint (no auth required)
  server.post("/admin/login", async (request, reply) => {
    // Origin check — reject cross-origin login submissions
    const origin = request.headers.origin as string | undefined;
    if (origin) {
      const siteUrl = process.env.WEBHOOK_URL || process.env.WEB_APP_URL || "";
      const expectedOrigin = siteUrl ? new URL(siteUrl).origin : null;
      if (expectedOrigin && origin !== expectedOrigin) {
        return reply.status(403).send({ error: "Forbidden" });
      }
    }

    // IP-based brute-force rate limiting (5 attempts per 15 min)
    const ip = (request.headers["x-forwarded-for"] as string || request.ip || "unknown")
      .split(",")[0].trim();
    const rateLimitKey = `admin_login:${ip}`;
    const attempts = await redis.get(rateLimitKey);
    if (attempts && parseInt(attempts) >= LOGIN_RATE_LIMIT_MAX) {
      return reply.status(429).send({ error: "Too many login attempts. Try again in 15 minutes." });
    }

    const { password } = request.body as { password: string };
    if (password && timingSafeCompare(password, ADMIN_PASSWORD)) {
      await redis.del(rateLimitKey);
      const token = makeAdminToken(ADMIN_PASSWORD);
      const secureSuffix = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      return reply
        .header(
          "Set-Cookie",
          `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400${secureSuffix}`,
        )
        .send({ success: true });
    }

    // Record failed attempt
    const pipe = redis.pipeline();
    pipe.incr(rateLimitKey);
    pipe.expire(rateLimitKey, LOGIN_RATE_LIMIT_WINDOW);
    await pipe.exec();

    return reply.status(401).send({ error: "Wrong password" });
  });

  // API: Get stats
  server.get("/api/stats", async () => {
    const [users, transactions, videos, queueStats] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.video.count(),
      getQueueStats(),
    ]);

    const revenue = await prisma.transaction.aggregate({
      where: { status: "success" },
      _sum: { amountIdr: true },
    });

    const metricsToday = await MetricsService.getAll();
    const trialDaily = metricsToday.metrics?.generation_trial_daily || 0;
    const trialWelcome = metricsToday.metrics?.generation_trial_welcome || 0;

    return {
      users,
      transactions,
      videos,
      revenue: Number(revenue._sum.amountIdr || 0),
      queue: queueStats,
      trialStats: {
        daily: trialDaily,
        welcome: trialWelcome,
        total: trialDaily + trialWelcome
      }
    };
  });

  // API: List users
  server.get("/api/users", async (request, _reply) => {
    const query = request.query as { limit?: string; offset?: string; isBanned?: string; tier?: string };
    const limit = Math.min(Math.max(1, parseInt(query.limit || "50") || 50), 200);
    const offset = Math.max(0, parseInt(query.offset || "0") || 0);

    const where: any = {};
    if (query.isBanned === 'true') where.isBanned = true;
    else if (query.isBanned === 'false') where.isBanned = false;
    if (query.tier) where.tier = query.tier.toLowerCase();

    const users = await prisma.user.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      select: {
        telegramId: true,
        username: true,
        firstName: true,
        tier: true,
        creditBalance: true,
        isBanned: true,
        createdAt: true,
        lastActivityAt: true,
      },
    });

    return users;
  });

  // API: Get user by ID
  server.get("/api/users/:id", async (request, reply) => {
    const params = request.params as { id: string };
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: BigInt(params.id) },
        include: {
          transactions: { take: 10, orderBy: { createdAt: "desc" } },
          videos: { take: 10, orderBy: { createdAt: "desc" } },
        },
      });

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      return user;
    } catch (error: any) {
      return reply.status(400).send({ error: "Invalid user ID" });
    }
  });

  // API: Grant credits
  server.post("/api/users/:id/credits", async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as { amount: number; reason: string };

    if (!body.amount || body.amount <= 0) {
      return reply.status(400).send({ error: "Invalid amount" });
    }

    try {
      const user = await prisma.user.update({
        where: { telegramId: BigInt(params.id) },
        data: {
          creditBalance: { increment: body.amount },
        },
      });

      return { success: true, newBalance: user.creditBalance };
    } catch (error: any) {
      return reply.status(404).send({ error: "User not found or invalid ID" });
    }
  });

  // API: Ban/Unban user
  server.post("/api/users/:id/ban", async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as { banned: boolean; reason?: string };

    try {
      const user = await prisma.user.update({
        where: { telegramId: BigInt(params.id) },
        data: {
          isBanned: body.banned,
          banReason: body.reason,
          bannedAt: body.banned ? new Date() : null,
        },
      });

      return { success: true, isBanned: user.isBanned };
    } catch (error: any) {
      return reply.status(404).send({ error: "User not found or invalid ID" });
    }
  });

  // API: List transactions
  server.get("/api/transactions", async (request, _reply) => {
    const query = request.query as { status?: string; limit?: string };
    const limit = Math.min(Math.max(1, parseInt(query.limit || "50") || 50), 200);

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { telegramId: true, username: true, firstName: true },
        },
      },
    });

    return transactions;
  });

  // API: List videos
  server.get("/api/videos", async (request, _reply) => {
    const query = request.query as { status?: string; limit?: string };
    const limit = Math.min(Math.max(1, parseInt(query.limit || "50") || 50), 200);

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const videos = await prisma.video.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { telegramId: true, username: true, firstName: true },
        },
      },
    });

    return videos;
  });

  // API: Broadcast message
  server.post("/api/broadcast", async (request, reply) => {
    const body = request.body as { message: string; tier?: string };

    if (!body.message) {
      return reply.status(400).send({ error: "Message required" });
    }

    const where: any = { isBanned: false };
    if (body.tier) {
      where.tier = body.tier;
    }

    const users = await prisma.user.findMany({
      where,
      select: { telegramId: true },
    });

    await addNotificationJob({
      type: "broadcast",
      message: body.message,
      users: users.map((u) => u.telegramId.toString()),
    });

    return { success: true, recipientCount: users.length };
  });

  // API: Get config
  server.get("/api/config", async () => {
    return {
      botToken: "***REDACTED***",
      botUsername: process.env.BOT_USERNAME,
      environment: process.env.NODE_ENV,
      features: {
        videoGeneration: process.env.FEATURE_VIDEO_GENERATION === "true",
        payment: process.env.FEATURE_PAYMENT === "true",
        referral: process.env.FEATURE_REFERRAL === "true",
      },
    };
  });

  // API: Get payment settings
  server.get("/api/payment-settings", async () => {
    const flat = await PaymentSettingsService.getAllSettings();
    const defaultGateway = await PaymentSettingsService.getDefaultGateway();
    // Return structured settings: { midtrans: { enabled: true }, tripay: { enabled: true }, ... }
    const gateways = ['midtrans', 'tripay', 'duitku'];
    const settings: Record<string, { enabled: boolean }> = {};
    for (const gw of gateways) {
      settings[gw] = { enabled: flat[`${gw}_enabled`] !== 'false' };
    }
    return { settings, defaultGateway };
  });

  // API: Update payment settings
  server.post("/api/payment-settings", async (request, reply) => {
    const body = request.body as {
      action: string;
      gateway?: string;
      value?: string;
    };

    try {
      if (body.action === "set_default") {
        await PaymentSettingsService.setDefaultGateway(body.gateway!);
        return { success: true };
      }

      if (body.action === "toggle_gateway") {
        const isEnabled = await PaymentSettingsService.isGatewayEnabled(
          body.gateway!,
        );
        await PaymentSettingsService.setGatewayEnabled(
          body.gateway!,
          !isEnabled,
        );
        return { success: true, enabled: !isEnabled };
      }

      return { error: "Unknown action" };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // ── Pricing Management APIs ──

  server.get("/api/pricing/:category", async (request) => {
    const { category } = request.params as { category: string };
    // Return array format for frontend table rendering
    return prisma.pricingConfig.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });
  });

  server.post("/api/pricing", async (request, reply) => {
    const { category, key, value } = request.body as {
      category: string;
      key: string;
      value: any;
    };
    if (!category || !key || value === undefined) {
      return reply
        .status(400)
        .send({ error: "category, key, and value required" });
    }
    await PaymentSettingsService.setPricingConfig(category, key, value);
    PaymentSettingsService.clearPricingCache();
    return { success: true };
  });

  server.delete("/api/pricing", async (request, reply) => {
    const { category, key } = request.body as { category: string; key: string };
    if (!category || !key) {
      return reply.status(400).send({ error: "category and key required" });
    }
    await PaymentSettingsService.deletePricingConfig(category, key);
    PaymentSettingsService.clearPricingCache();
    return { success: true };
  });

  server.get("/api/provider-costs", async () => {
    const costs =
      await PaymentSettingsService.getAllPricingByCategory("provider_cost");
    const margin = await PaymentSettingsService.getMarginPercent();
    return { costs, marginPercent: margin };
  });

  server.get("/api/pricing-overview", async () => {
    const [
      packages,
      subscriptions,
      videoCosts,
      imageCosts,
      providerCosts,
      global,
      unitCosts,
    ] = await Promise.all([
      PaymentSettingsService.getAllPricingByCategory("package"),
      PaymentSettingsService.getAllPricingByCategory("subscription"),
      PaymentSettingsService.getAllPricingByCategory("video_credit"),
      PaymentSettingsService.getAllPricingByCategory("image_credit"),
      PaymentSettingsService.getAllPricingByCategory("provider_cost"),
      PaymentSettingsService.getAllPricingByCategory("global"),
      PaymentSettingsService.getAllPricingByCategory("unit_cost"),
    ]);
    return {
      packages,
      subscriptions,
      videoCosts,
      imageCosts,
      providerCosts,
      global,
      unitCosts,
    };
  });

  // ── Pricing Recommendation (admin tool) ──
  // Calculates minimum credit price per action based on actual API costs + target margin
  server.get("/api/pricing-recommendation", async () => {
    const USD_TO_IDR = Number(process.env.USD_TO_IDR_RATE) || 16000;
    const margin = await PaymentSettingsService.getMarginPercent();
    const providerCosts = await PaymentSettingsService.getAllPricingByCategory("provider_cost");
    const unitCosts = await PaymentSettingsService.getAllPricingByCategory("unit_cost");

    // Average video provider cost per scene (across all enabled providers)
    const videoCosts = Object.values(providerCosts).map((v: any) => v?.costUsd || v || 0).filter((c: number) => c > 0);
    const avgVideoSceneCostUsd = videoCosts.length > 0 ? videoCosts.reduce((a: number, b: number) => a + b, 0) / videoCosts.length : 0.04;
    const maxVideoSceneCostUsd = videoCosts.length > 0 ? Math.max(...videoCosts) : 0.08;

    // Vision/optimization overhead per generation
    const visionOverheadUsd = 0.006;  // Gemini Vision analysis
    const optimizerOverheadUsd = 0.001; // Prompt optimizer per scene
    const voOverheadUsd = 0.001;  // VO script generation

    // Calculate min price per action (in units, at target margin)
    const calcMinUnits = (totalCostUsd: number) => {
      const costIdr = totalCostUsd * USD_TO_IDR;
      // 1 unit = (cheapest package price / total units) = ~880 IDR/unit (at 499k/85 credits * 10)
      const idrPerUnit = 880;
      const minUnits = Math.ceil((costIdr / idrPerUnit) / (1 - margin / 100));
      return minUnits;
    };

    const recommendations = {
      VIDEO_15S: {
        current: (unitCosts as any)?.VIDEO_15S || UNIT_COSTS.VIDEO_15S,
        apiCostUsd: (5 * avgVideoSceneCostUsd) + optimizerOverheadUsd * 5 + voOverheadUsd,
        apiCostUsdMax: (5 * maxVideoSceneCostUsd) + optimizerOverheadUsd * 5 + voOverheadUsd,
        minUnits: calcMinUnits((5 * maxVideoSceneCostUsd) + optimizerOverheadUsd * 5 + voOverheadUsd),
        description: '15s video (5 scenes)',
      },
      VIDEO_30S: {
        current: (unitCosts as any)?.VIDEO_30S || UNIT_COSTS.VIDEO_30S,
        apiCostUsd: (7 * avgVideoSceneCostUsd) + optimizerOverheadUsd * 7 + voOverheadUsd,
        apiCostUsdMax: (7 * maxVideoSceneCostUsd) + optimizerOverheadUsd * 7 + voOverheadUsd,
        minUnits: calcMinUnits((7 * maxVideoSceneCostUsd) + optimizerOverheadUsd * 7 + voOverheadUsd),
        description: '30s video (7 scenes)',
      },
      VIDEO_60S: {
        current: (unitCosts as any)?.VIDEO_60S || UNIT_COSTS.VIDEO_60S,
        apiCostUsd: (7 * avgVideoSceneCostUsd * 2) + optimizerOverheadUsd * 7 + voOverheadUsd,
        apiCostUsdMax: (7 * maxVideoSceneCostUsd * 2) + optimizerOverheadUsd * 7 + voOverheadUsd,
        minUnits: calcMinUnits((7 * maxVideoSceneCostUsd * 2) + optimizerOverheadUsd * 7 + voOverheadUsd),
        description: '60s video (7 scenes, 2x duration)',
      },
      IMAGE_UNIT: {
        current: (unitCosts as any)?.IMAGE_UNIT || UNIT_COSTS.IMAGE_UNIT,
        apiCostUsd: 0.003 + optimizerOverheadUsd,
        apiCostUsdMax: 0.04 + visionOverheadUsd + optimizerOverheadUsd,
        minUnits: calcMinUnits(0.04 + visionOverheadUsd + optimizerOverheadUsd),
        description: 'Single image (worst case: img2img + vision)',
      },
      CLONE_STYLE: {
        current: (unitCosts as any)?.CLONE_STYLE || UNIT_COSTS.CLONE_STYLE,
        apiCostUsd: visionOverheadUsd + (7 * avgVideoSceneCostUsd) + voOverheadUsd,
        apiCostUsdMax: visionOverheadUsd + (7 * maxVideoSceneCostUsd) + voOverheadUsd,
        minUnits: calcMinUnits(visionOverheadUsd + (7 * maxVideoSceneCostUsd) + voOverheadUsd),
        description: 'Clone style (vision + 7-scene video)',
      },
      CAMPAIGN_5_VIDEO: {
        current: (unitCosts as any)?.CAMPAIGN_5_VIDEO || UNIT_COSTS.CAMPAIGN_5_VIDEO,
        apiCostUsd: 5 * ((7 * avgVideoSceneCostUsd) + voOverheadUsd),
        apiCostUsdMax: 5 * ((7 * maxVideoSceneCostUsd) + voOverheadUsd),
        minUnits: calcMinUnits(5 * ((7 * maxVideoSceneCostUsd) + voOverheadUsd)),
        description: 'Campaign 5 scenes',
      },
    };

    return {
      usdToIdr: USD_TO_IDR,
      targetMarginPercent: margin,
      recommendations,
    };
  });

  // ── Pricing Dashboard ──

  server.get("/admin/pricing", async (_request, reply) => {
    return reply.view("admin/pricing.ejs", trackingVars());
  });

  // ── Prompt Management Dashboard ──

  server.get("/admin/prompts", async (_request, reply) => {
    return reply.view("admin/prompts.ejs", trackingVars());
  });

  server.get("/admin/settings", async (_request, reply) => {
    return reply.redirect("/admin/dashboard#settings");
  });

  server.get("/admin/users", async (_request, reply) => {
    return reply.redirect("/admin/dashboard#users");
  });

  // API: Get all admin prompts (global, visible to all users)
  server.get("/api/admin-prompts", async (request: any) => {
    const niche = (request.query as any).niche;
    const prompts = await prisma.savedPrompt.findMany({
      where: {
        userId: BigInt(0), // userId=0 means admin/global prompt
        ...(niche ? { niche } : {}),
      },
      orderBy: [
        { niche: "asc" },
        { usageCount: "desc" },
        { createdAt: "desc" },
      ],
    });
    return prompts.map((p: any) => ({
      id: p.id,
      niche: p.niche,
      title: p.title,
      prompt: p.prompt,
      successRate: p.usageCount,
      createdAt: p.createdAt,
    }));
  });

  // API: Create admin prompt
  server.post("/api/admin-prompts", async (request: any, reply) => {
    const { niche, title, prompt } = request.body as any;
    if (!niche || !title || !prompt) {
      return reply.status(400).send({ error: "niche, title, prompt required" });
    }
    const created = await prisma.savedPrompt.create({
      data: {
        userId: BigInt(0),
        niche: niche.toLowerCase(),
        title: title.slice(0, 100),
        prompt,
        source: "admin",
      },
    });
    return { ok: true, id: Number(created.id) };
  });

  // API: Update admin prompt
  server.put("/api/admin-prompts/:id", async (request: any, reply) => {
    const id = parseInt(request.params.id);
    if (!Number.isInteger(id) || id <= 0) return reply.status(400).send({ error: "Invalid id" });
    const { title, prompt, niche } = request.body as any;
    try {
      await prisma.savedPrompt.update({
        where: { id },
        data: {
          ...(title ? { title } : {}),
          ...(prompt ? { prompt } : {}),
          ...(niche ? { niche } : {}),
        },
      });
      return { ok: true };
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });

  // API: Delete admin prompt
  server.delete("/api/admin-prompts/:id", async (request: any, reply) => {
    const id = parseInt(request.params.id);
    if (!Number.isInteger(id) || id <= 0) return reply.status(400).send({ error: "Invalid id" });
    try {
      await prisma.savedPrompt.delete({ where: { id } });
      return { ok: true };
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });

  // ── Stats Overview (7-day charts) ──

  server.get("/api/stats/overview", async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const revenueChart: { date: string; revenue: number }[] = [];
    const usersChart: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const [rev, newUsers] = await Promise.all([
        prisma.transaction.aggregate({
          where: { status: "success", createdAt: { gte: dayStart, lt: dayEnd } },
          _sum: { amountIdr: true },
        }),
        prisma.user.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
      ]);
      const label = dayStart.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
      revenueChart.push({ date: label, revenue: Number(rev._sum.amountIdr || 0) });
      usersChart.push({ date: label, count: newUsers });
    }
    const [totalUsers, totalRevenue, todayRevenue, totalVideos, queueStats] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.aggregate({ where: { status: "success" }, _sum: { amountIdr: true } }),
      prisma.transaction.aggregate({ where: { status: "success", createdAt: { gte: today } }, _sum: { amountIdr: true } }),
      prisma.video.count(),
      getQueueStats(),
    ]);
    const usersByTier = await prisma.$queryRaw`SELECT tier, COUNT(*)::int as count FROM users GROUP BY tier` as any[];
    const videosByStatus = await prisma.$queryRaw`SELECT status, COUNT(*)::int as count FROM videos GROUP BY status` as any[];
    const tierMap: Record<string, number> = {};
    for (const t of usersByTier) tierMap[t.tier] = t.count;
    const statusMap: Record<string, number> = {};
    for (const v of videosByStatus) statusMap[v.status] = v.count;
    return {
      users: { total: totalUsers, byTier: tierMap },
      revenue: { total: Number(totalRevenue._sum.amountIdr || 0), today: Number(todayRevenue._sum.amountIdr || 0) },
      videos: { total: totalVideos, byStatus: statusMap },
      queue: queueStats,
      charts: { revenue: revenueChart, newUsers: usersChart },
    };
  });

  // ── User Search ──

  server.get("/api/users/search", async (request) => {
    const { q, limit = "20" } = request.query as { q?: string; limit?: string };
    if (!q) return [];
    return prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: parseInt(limit),
      select: {
        telegramId: true, username: true, firstName: true,
        tier: true, creditBalance: true, isBanned: true, createdAt: true, lastActivityAt: true,
      },
    });
  });

  // ── Change User Tier ──

  server.patch("/api/users/:id/tier", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { tier } = request.body as { tier: string };
    const validTiers = ["free", "basic", "lite", "pro", "agency"];
    if (!tier || !validTiers.includes(tier.toLowerCase())) return reply.status(400).send({ error: "Invalid tier" });
    try {
      const user = await prisma.user.update({
        where: { telegramId: BigInt(id) },
        data: { tier: tier.toLowerCase() },
      });
      return { success: true, tier: user.tier };
    } catch (error: any) {
      return reply.status(404).send({ error: "User not found or invalid ID" });
    }
  });

  // ── System Health ──

  server.get("/api/system/health", async () => {
    const checks: Record<string, any> = {};
    try { await prisma.$queryRaw`SELECT 1`; checks.database = { status: "ok" }; }
    catch (e: any) { checks.database = { status: "error", message: e.message }; }
    try { await redis.ping(); checks.redis = { status: "ok" }; }
    catch (e: any) { checks.redis = { status: "error", message: e.message }; }
    try {
      const token = process.env.BOT_TOKEN;
      if (token) {
        const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        const data = await res.json() as any;
        checks.webhook = {
          status: data.ok ? "ok" : "error",
          url: data.result?.url,
          pendingUpdates: data.result?.pending_update_count,
          lastError: data.result?.last_error_message,
        };
      }
    } catch (e: any) { checks.webhook = { status: "error", message: e.message }; }
    return {
      status: Object.values(checks).every((c: any) => c.status === "ok") ? "healthy" : "degraded",
      checks,
      environment: process.env.NODE_ENV,
      version: "3.0.0",
      uptime: process.uptime(),
    };
  });

  // ── Token Usage Stats ──

  server.get("/api/token-stats", async (request) => {
    const { days = "7" } = request.query as { days?: string };
    const daysCapped = Math.min(Math.max(1, parseInt(days) || 7), 90);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getTokenStats } = require("../services/token-tracker.service");
    return getTokenStats(daysCapped);
  });

  server.get("/api/token-usage", async (request) => {
    const { limit = "50", provider, service } = request.query as {
      limit?: string; provider?: string; service?: string;
    };
    const where: any = {};
    if (provider) where.provider = provider;
    if (service) where.service = service;
    return prisma.tokenUsage.findMany({
      where,
      take: Math.min(Math.max(1, parseInt(limit) || 50), 200),
      orderBy: { createdAt: "desc" },
      select: {
        id: true, provider: true, model: true, service: true,
        promptTokens: true, completionTokens: true, totalTokens: true,
        costUsd: true, costIdr: true, createdAt: true,
      },
    });
  });

  // ── Analytics Dashboard ──

  server.get("/admin/dashboard", async (_request, reply) => {
    return reply.view("admin/analytics.ejs", trackingVars());
  });

  // API: Analytics data (today's metrics, active users, provider health, top niches, recent errors)
  server.get("/api/analytics", async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      metricsData,
      todayGenerations,
      todaySuccessful,
      todayRevenue,
      activeUsers24h,
      topNiches,
      recentErrors,
      providerHealthRows,
      queueStats,
    ] = await Promise.all([
      MetricsService.getAll(),
      prisma.video.count({ where: { createdAt: { gte: today } } }),
      prisma.video.count({
        where: { createdAt: { gte: today }, status: "completed" },
      }),
      prisma.transaction.aggregate({
        where: { status: "success", createdAt: { gte: today } },
        _sum: { amountIdr: true },
      }),
      prisma.user.count({
        where: {
          lastActivityAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.video.groupBy({
        by: ["niche"],
        _count: { niche: true },
        where: { createdAt: { gte: today } },
        orderBy: { _count: { niche: "desc" } },
        take: 10,
      }),
      prisma.video.findMany({
        where: {
          status: "failed",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: {
          jobId: true,
          errorMessage: true,
          niche: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.providerHealth.findMany(),
      getQueueStats(),
    ]);

    // Build circuit breaker states from Redis
    const cbStates: Record<string, any> = {};
    const providerKeys = Object.keys(PROVIDER_CONFIG.video);
    for (const key of providerKeys) {
      try {
        const raw = await redis.get(`cb:${key}`);
        if (raw) {
          cbStates[key] = JSON.parse(raw);
        } else {
          cbStates[key] = { state: "closed", failureCount: 0 };
        }
      } catch (_) {
        cbStates[key] = { state: "unknown", failureCount: 0 };
      }
    }

    const successRate =
      todayGenerations > 0
        ? Math.round((todaySuccessful / todayGenerations) * 100)
        : 0;

    return {
      today: {
        generations: todayGenerations,
        successful: todaySuccessful,
        successRate,
        revenue: Number(todayRevenue._sum.amountIdr || 0),
      },
      activeUsers24h,
      topNiches: topNiches.map((n) => ({
        niche: n.niche,
        count: n._count.niche,
      })),
      providerHealth: cbStates,
      providerHealthDB: providerHealthRows,
      recentErrors,
      metrics: metricsData,
      queue: queueStats,
    };
  });
  // ── v3.0 Admin API Endpoints ───────────────────────────────────────────────

  /** GET /api/v3/gamification/leaderboard */
  server.get('/api/v3/gamification/leaderboard', async () => {
    const leaderboard = await GamificationService.getWeeklyLeaderboard();
    return { leaderboard, formattedMessage: GamificationService.formatLeaderboardMessage(leaderboard) };
  });

  /** GET /api/v3/gamification/badges */
  server.get('/api/v3/gamification/badges', async () => {
    const badgeCounts = await (prisma as any).userBadge.groupBy({
      by: ['badgeId'],
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
    });
    return {
      badges: Object.values(BADGES),
      stats: badgeCounts,
    };
  });

  /** GET /api/v3/retention/stats */
  server.get('/api/v3/retention/stats', async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const stats = await (prisma as any).retentionLog.groupBy({
      by: ['triggerType'],
      _count: { id: true },
      where: { sentAt: { gte: sevenDaysAgo } },
      orderBy: { _count: { id: 'desc' } },
    });
    const total = await (prisma as any).retentionLog.count({ where: { sentAt: { gte: sevenDaysAgo } } });
    return { stats, total, period: '7d' };
  });

  /** POST /api/v3/retention/trigger — Manual trigger for testing */
  server.post('/api/v3/retention/trigger', async (request: any, reply) => {
    const { type } = request.body as { type: string };
    if (!type) return reply.status(400).send({ error: 'type required' });
    try {
      await retentionQueue.add('run_checks', { type });
      return { queued: true, type };
    } catch (error: any) {
      return reply.status(500).send({ error: 'Failed to queue retention check' });
    }
  });

  /** GET /api/v3/users/:id/gamification */
  server.get('/api/v3/users/:id/gamification', async (request: any, reply) => {
    try {
      const userId = BigInt(request.params.id);
      const [summary, streak, badges] = await Promise.all([
        GamificationService.getUserGamificationSummary(userId),
        (prisma as any).userStreak.findUnique({ where: { userId } }),
        (prisma as any).userBadge.findMany({ where: { userId } }),
      ]);
      return { summary, streak, badges };
    } catch (error: any) {
      return reply.status(404).send({ error: "User not found or invalid ID" });
    }
  });

  /** GET /api/v3/campaign/hooks — List available hook variations */
  server.get('/api/v3/campaign/hooks', async () => {
    return { hooks: HOOK_VARIATIONS };
  });

  /** GET /api/v3/pricing — v3 pricing info */
  server.get('/api/v3/pricing', async () => {
    return { packages: CREDIT_PACKAGES_V3, subscriptions: SUBSCRIPTION_PLANS_V3, unitCosts: UNIT_COSTS, referralRates: REFERRAL_COMMISSIONS_V3 };
  });

  /** GET /api/v3/hpas/industries — List HPAS industry templates */
  server.get('/api/v3/hpas/industries', async () => {
    return {
      industries: Object.keys(INDUSTRY_TEMPLATES),
      presets: Object.values(DURATION_PRESETS).map((p) => ({
        id: p.id, name: p.name, totalSeconds: p.totalSeconds, creditCost: p.creditCost, scenesIncluded: p.scenesIncluded,
      })),
    };
  });

  // ── v3.0 Real-time & Management ───────────────────────────────────────────

  /** GET /api/admin/sse — Real-time event stream */
  server.get("/api/admin/sse", async (request, reply) => {
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");

    try {
      // ioredis: create a new subscriber instance (duplicate() is node-redis v4, not ioredis)
      const Redis = (await import('ioredis')).default;
      const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
      });

      // Send initial ping
      reply.raw.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

      subscriber.subscribe("admin_events", (err) => {
        if (err) {
          reply.raw.write(`data: ${JSON.stringify({ type: "error", message: "Subscribe failed" })}\n\n`);
        }
      });

      subscriber.on("message", (_channel: string, message: string) => {
        try { reply.raw.write(`data: ${message}\n\n`); } catch {}
      });

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try { reply.raw.write(`: heartbeat\n\n`); } catch {}
      }, 30000);

      request.raw.on("close", () => {
        clearInterval(heartbeat);
        try { subscriber.disconnect(); } catch {}
      });
    } catch (error: any) {
      reply.raw.write(`data: ${JSON.stringify({ type: "error", message: "SSE connection failed" })}\n\n`);
      reply.raw.end();
    }
  });

  /** GET /api/admin/settings/providers — Dynamic provider overrides */
  server.get("/api/admin/settings/providers", async () => {
    const overrides = await ProviderSettingsService.getDynamicSettings();
    return { overrides };
  });

  /** POST /api/admin/settings/providers — Update dynamic provider overrides */
  server.post("/api/admin/settings/providers", async (request, reply) => {
    const body = request.body as any;
    if (!body || typeof body !== "object") {
      return reply.status(400).send({ error: "Invalid settings object" });
    }
    
    await ProviderSettingsService.updateSettings(body);
    
    // Log the event for the SSE stream
    await redis.publish("admin_events", JSON.stringify({ 
      type: "settings_updated", 
      category: "providers",
      timestamp: new Date().toISOString()
    }));

    return { success: true };
  });

  // ── Admin AI Chat ──────────────────────────────────────────────────────────
  const adminChatRateMap = new Map<string, { count: number; resetAt: number }>();

  server.post("/api/admin/ai-chat", async (request, reply) => {
    const ip = request.ip;
    const now = Date.now();
    const limit = adminChatRateMap.get(ip);
    if (limit && limit.resetAt > now) {
      if (limit.count >= 10) {
        return reply.status(429).send({ error: "Rate limit: 10 messages per minute" });
      }
      limit.count++;
    } else {
      adminChatRateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    }

    const { message } = request.body as { message?: string };
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return reply.status(400).send({ error: "Message is required" });
    }
    if (message.length > 2000) {
      return reply.status(400).send({ error: "Message too long (max 2000 chars)" });
    }

    // Gather live system context for the AI
    let systemContext = "";
    try {
      const [stats, providerOverrides, exchangeRate, profitData] = await Promise.all([
        prisma.user.count().then(async (userCount) => {
          const videoCount = await prisma.video.count();
          const txCount = await prisma.transaction.count({ where: { status: "success" } });
          return { userCount, videoCount, txCount };
        }),
        ProviderSettingsService.getDynamicSettings(),
        redis.get("admin:exchange_rate"),
        prisma.transaction.aggregate({
          where: { status: "success", createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
          _sum: { amountIdr: true },
          _count: true,
        }),
      ]);

      systemContext = `
LIVE SYSTEM CONTEXT (as of ${new Date().toISOString()}):
- Total users: ${stats.userCount}
- Total videos generated: ${stats.videoCount}
- Successful transactions: ${stats.txCount}
- Last 30d revenue: Rp ${Number(profitData._sum.amountIdr || 0).toLocaleString()} (${profitData._count} transactions)
- USD/IDR rate: ${exchangeRate || process.env.USD_TO_IDR_RATE || '16000'}
- Provider overrides: ${JSON.stringify(providerOverrides || {})}

ARCHITECTURE:
- Stack: Node.js + Telegraf + Fastify + Prisma + BullMQ + Redis
- Video pipeline: 9-tier provider fallback (BytePlus > XAI > LaoZhang > EvoLink > Hypereal > SiliconFlow > Fal.ai > Kie.ai > Remotion)
- Payment: Midtrans + Tripay + DuitKu gateways
- Pricing: Dynamic from DB (PricingConfig table), 1 Credit = 10 Units
- AI Chat: OmniRoute proxy to multiple LLM providers

You are an expert system administrator and architect for this platform. Give specific, actionable advice. Reference actual config values and stats when relevant.`;
    } catch {
      systemContext = "System context unavailable.";
    }

    const omni = getOmniRouteService();
    const sessionId = `admin_chat_${ip}`;

    // Only inject system context on the first message of the session
    const isFirstMessage = !(omni as any).conversationHistory?.has(sessionId);
    const fullMessage = isFirstMessage
      ? systemContext + "\n\nADMIN QUESTION: " + message.trim()
      : message.trim();
    const result = await omni.chat(sessionId, fullMessage);

    if (!result.success) {
      return reply.status(500).send({ error: "AI is temporarily unavailable" });
    }

    return { reply: result.content, model: result.model };
  });

  // Clean up admin chat rate limits
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of adminChatRateMap) {
      if (val.resetAt <= now) adminChatRateMap.delete(key);
    }
  }, 300_000);

  /** GET /api/settings/landing — Landing page config */
  server.get("/api/settings/landing", async () => {
    const data = await redis.get("admin:landing_config");
    return data ? JSON.parse(data) : { headline: '', subheadline: '', ctaText: '', heroImageUrl: '' };
  });

  /** POST /api/settings/landing — Update landing page config */
  server.post("/api/settings/landing", async (request, reply) => {
    const body = request.body as any;
    if (!body || typeof body !== "object") {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const config = {
      headline: body.headline || '',
      subheadline: body.subheadline || '',
      ctaText: body.ctaText || '',
      heroImageUrl: body.heroImageUrl || '',
      updatedAt: new Date().toISOString(),
    };
    await redis.set("admin:landing_config", JSON.stringify(config));
    await redis.publish("admin_events", JSON.stringify({
      type: "settings_updated", category: "landing",
      timestamp: new Date().toISOString()
    }));
    return { success: true };
  });

  /** GET /api/settings/exchange-rate */
  server.get("/api/settings/exchange-rate", async () => {
    const stored = await redis.get("admin:exchange_rate");
    return { rate: stored ? Number(stored) : (Number(process.env.USD_TO_IDR_RATE) || 16000) };
  });

  /** POST /api/settings/exchange-rate */
  server.post("/api/settings/exchange-rate", async (request, reply) => {
    const { rate } = request.body as any;
    if (!rate || isNaN(Number(rate)) || Number(rate) < 1000) {
      return reply.status(400).send({ error: "Invalid rate (must be > 1000)" });
    }
    await redis.set("admin:exchange_rate", String(Number(rate)));
    // Also update the env var in-memory so all services use the new rate
    process.env.USD_TO_IDR_RATE = String(Number(rate));
    return { success: true, rate: Number(rate) };
  });

  /** GET /api/settings/pixels */
  server.get("/api/settings/pixels", async () => {
    const stored = await redis.get("admin:pixel_config");
    if (stored) return JSON.parse(stored);
    return {
      fbPixelId: process.env.FACEBOOK_PIXEL_ID || '',
      ga4Id: process.env.GA4_TRACKING_ID || '',
      ttPixelId: process.env.TIKTOK_PIXEL_ID || '',
    };
  });

  /** POST /api/settings/pixels */
  server.post("/api/settings/pixels", async (request, reply) => {
    const body = request.body as any;
    if (!body || typeof body !== 'object') {
      return reply.status(400).send({ error: "Invalid payload" });
    }

    // Validate pixel IDs to prevent XSS injection
    const PIXEL_ID_REGEX = /^[a-zA-Z0-9_-]*$/;
    for (const [key, val] of Object.entries({ fbPixelId: body.fbPixelId, ga4Id: body.ga4Id, ttPixelId: body.ttPixelId })) {
      if (val && typeof val === 'string' && !PIXEL_ID_REGEX.test(val)) {
        return reply.status(400).send({ error: `Invalid ${key}: only alphanumeric characters, hyphens, and underscores are allowed` });
      }
    }

    const config = {
      fbPixelId: body.fbPixelId || '',
      ga4Id: body.ga4Id || '',
      ttPixelId: body.ttPixelId || '',
    };
    await redis.set("admin:pixel_config", JSON.stringify(config));
    // Update in-memory env vars so views pick up changes immediately
    process.env.FACEBOOK_PIXEL_ID = config.fbPixelId;
    process.env.GA4_TRACKING_ID = config.ga4Id;
    process.env.TIKTOK_PIXEL_ID = config.ttPixelId;
    return { success: true };
  });

  /** POST /api/settings/seed-pricing — Seed pricing DB from static config (idempotent) */
  server.post("/api/settings/seed-pricing", async () => {
    const { PACKAGES, SUBSCRIPTION_PLANS, UNIT_COSTS } = await import('@/config/pricing.js');
    let seeded = 0;

    // Seed credit packages
    for (const pkg of PACKAGES) {
      await prisma.pricingConfig.upsert({
        where: { category_key: { category: 'package', key: pkg.id } },
        update: {},
        create: { category: 'package', key: pkg.id, value: pkg as any },
      });
      seeded++;
    }

    // Seed subscription plans
    for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
      await prisma.pricingConfig.upsert({
        where: { category_key: { category: 'subscription', key } },
        update: { value: plan as any },
        create: { category: 'subscription', key, value: plan as any },
      });
      seeded++;
    }

    // Seed video credit costs
    for (const [key, units] of Object.entries(UNIT_COSTS)) {
      await prisma.pricingConfig.upsert({
        where: { category_key: { category: 'video_credit', key: key.toLowerCase() } },
        update: {},
        create: { category: 'video_credit', key: key.toLowerCase(), value: { units, credits: units / 10 } as any },
      });
      seeded++;
    }

    // Seed global margin
    await prisma.pricingConfig.upsert({
      where: { category_key: { category: 'global', key: 'margin_percent' } },
      update: {},
      create: { category: 'global', key: 'margin_percent', value: 30 as any },
    });
    seeded++;

    PaymentSettingsService.clearPricingCache();
    return { success: true, seeded };
  });

  /** GET /api/settings/referral — Referral conversion rates */
  server.get("/api/settings/referral", async () => {
    const sellRate = await PaymentSettingsService.get('referral_sell_rate');
    const buyRate = await PaymentSettingsService.get('referral_buy_rate');
    return {
      sellRate: sellRate ? parseInt(sellRate) : 3000,
      buyRate: buyRate ? parseInt(buyRate) : 6000,
    };
  });

  /** POST /api/settings/referral — Update referral conversion rates */
  server.post("/api/settings/referral", async (request, reply) => {
    const body = request.body as { sellRate?: number; buyRate?: number };
    if (!body || (body.sellRate === undefined && body.buyRate === undefined)) {
      return reply.status(400).send({ error: 'sellRate or buyRate required' });
    }
    if (body.sellRate !== undefined) {
      if (body.sellRate <= 0) return reply.status(400).send({ error: 'sellRate must be positive' });
      await PaymentSettingsService.set('referral_sell_rate', String(body.sellRate), 'Referral commission → credits conversion rate (IDR/credit)');
    }
    if (body.buyRate !== undefined) {
      if (body.buyRate <= 0) return reply.status(400).send({ error: 'buyRate must be positive' });
      await PaymentSettingsService.set('referral_buy_rate', String(body.buyRate), 'Average credit buy rate used for referral calculations (IDR/credit)');
    }
    return { success: true };
  });

  /** GET /api/profit-report — Revenue, costs, and profit breakdown */
  server.get("/api/profit-report", async (request) => {
    const { period = '30' } = request.query as any;
    const days = Math.min(Math.max(1, parseInt(period as string) || 30), 365);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [revenue, costs] = await Promise.all([
      prisma.transaction.aggregate({
        where: { status: 'success', createdAt: { gte: since } },
        _sum: { amountIdr: true },
        _count: true,
      }),
      prisma.tokenUsage.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { costUsd: true, costIdr: true },
        _count: true,
      }),
    ]);

    let dailyRevenue: any[] = [];
    let dailyCosts: any[] = [];
    try {
      dailyRevenue = await prisma.$queryRaw`
        SELECT DATE(created_at) as date,
               COALESCE(SUM(amount_idr), 0)::float as revenue_idr,
               COUNT(*)::int as transactions
        FROM transactions
        WHERE status = 'success' AND created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      dailyCosts = await prisma.$queryRaw`
        SELECT DATE(created_at) as date,
               COALESCE(SUM(cost_idr), 0)::float as cost_idr,
               COALESCE(SUM(cost_usd), 0)::float as cost_usd,
               COUNT(*)::int as api_calls
        FROM token_usage
        WHERE created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
    } catch { /* raw queries may fail on some DB configs */ }

    const totalRevenueIdr = Number(revenue._sum.amountIdr || 0);
    const totalCostIdr = Number(costs._sum.costIdr || 0);

    return {
      period: days,
      revenue: { totalIdr: totalRevenueIdr, transactions: revenue._count },
      costs: { totalUsd: Number(costs._sum.costUsd || 0), totalIdr: totalCostIdr, apiCalls: costs._count },
      profit: {
        totalIdr: totalRevenueIdr - totalCostIdr,
        marginPercent: totalRevenueIdr > 0 ? Math.round((totalRevenueIdr - totalCostIdr) / totalRevenueIdr * 100) : 0,
      },
      daily: { revenue: dailyRevenue, costs: dailyCosts },
    };
  });

  /** GET /api/transactions/transfers — P2P Transfer logs */
  server.get("/api/transactions/transfers", async () => {
    return prisma.transaction.findMany({
      where: { type: "transfer" },
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { username: true, firstName: true } },
      },
    });
  });

  /** GET /api/referral/pending-cashouts — List all pending cashout transactions for admin */
  server.get("/api/referral/pending-cashouts", async () => {
    return prisma.transaction.findMany({
      where: { type: "referral_cashout", status: "pending" },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            telegramId: true,
            username: true,
            firstName: true,
          },
        },
      },
    });
  });

  /** POST /api/referral/complete-cashout — Mark a pending cashout as completed and notify the user */
  server.post("/api/referral/complete-cashout", async (request, reply) => {
    const { transactionId } = request.body as { transactionId: string };
    if (!transactionId) {
      return reply.status(400).send({ error: "transactionId is required" });
    }

    const transaction = await prisma.transaction.findFirst({
      where: { orderId: transactionId, type: "referral_cashout", status: "pending" },
    });

    if (!transaction) {
      return reply.status(404).send({ error: "Pending cashout transaction not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { orderId: transactionId },
        data: { status: "success", paidAt: new Date() },
      });

      await tx.commission.updateMany({
        where: { referrerId: transaction.userId, status: "pending_cashout" },
        data: { status: "withdrawn" },
      });
    });

    // Notify the user via Telegram DM
    const user = await prisma.user.findUnique({
      where: { telegramId: transaction.userId },
      select: { language: true },
    });
    const lang = user?.language || 'id';
    const amount = Number(transaction.amountIdr).toLocaleString("id-ID");
    await UserService.sendMessage(
      transaction.userId,
      t('referral.cashout_completed', lang, { amount }),
      { parse_mode: 'Markdown' },
    );

    return { success: true, transactionId, amount: Number(transaction.amountIdr) };
  });
}