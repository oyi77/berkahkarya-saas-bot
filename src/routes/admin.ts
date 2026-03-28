/**
 * Admin Dashboard - Web Interface
 *
 * Serves a web UI for bot management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
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

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!ADMIN_PASSWORD) {
    return reply.status(503).send({ error: "Admin password not configured" });
  }

  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString();
    const [, password] = decoded.split(":");
    if (password === ADMIN_PASSWORD) return;
  }

  const cookie = (request.headers.cookie || "")
    .split(";")
    .find((c) => c.trim().startsWith("admin_token="));
  if (cookie) {
    const token = cookie.split("=")[1]?.trim();
    if (token === Buffer.from(ADMIN_PASSWORD).toString("base64")) return;
  }

  const query = request.query as Record<string, string>;
  if (query.token === ADMIN_PASSWORD) return;

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
      url.startsWith("/api/token-usage");
    if (isAdminRoute) {
      await verifyAdmin(request, reply);
    }
  });

  // Login page (no auth required)
  server.get("/admin/login", async (request, reply) => {
    return reply.view("admin/login.ejs");
  });

  // Admin dashboard (with auth) - redirect to dashboard if already logged in
  server.get("/admin", async (request, reply) => {
    const cookie = (request.headers.cookie || "")
      .split(";")
      .find((c) => c.trim().startsWith("admin_token="));
    if (cookie) {
      const token = cookie.split("=")[1]?.trim();
      if (token === Buffer.from(ADMIN_PASSWORD).toString("base64")) {
        return reply.redirect("/admin/dashboard");
      }
    }
    return reply.redirect("/admin/login");
  });

  // Login POST endpoint (no auth required)
  server.post("/admin/login", async (request, reply) => {
    const { password } = request.body as { password: string };
    if (password === ADMIN_PASSWORD) {
      const token = Buffer.from(ADMIN_PASSWORD).toString("base64");
      return reply
        .header(
          "Set-Cookie",
          `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
        )
        .send({ success: true });
    }
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

    return {
      users,
      transactions,
      videos,
      revenue: Number(revenue._sum.amountIdr || 0),
      queue: queueStats,
    };
  });

  // API: List users
  server.get("/api/users", async (request, _reply) => {
    const query = request.query as { limit?: string; offset?: string };
    const limit = parseInt(query.limit || "50");
    const offset = parseInt(query.offset || "0");

    const users = await prisma.user.findMany({
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
  });

  // API: Grant credits
  server.post("/api/users/:id/credits", async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as { amount: number; reason: string };

    if (!body.amount || body.amount <= 0) {
      return reply.status(400).send({ error: "Invalid amount" });
    }

    const user = await prisma.user.update({
      where: { telegramId: BigInt(params.id) },
      data: {
        creditBalance: { increment: body.amount },
      },
    });

    return { success: true, newBalance: user.creditBalance };
  });

  // API: Ban/Unban user
  server.post("/api/users/:id/ban", async (request, _reply) => {
    const params = request.params as { id: string };
    const body = request.body as { banned: boolean; reason?: string };

    const user = await prisma.user.update({
      where: { telegramId: BigInt(params.id) },
      data: {
        isBanned: body.banned,
        banReason: body.reason,
        bannedAt: body.banned ? new Date() : null,
      },
    });

    return { success: true, isBanned: user.isBanned };
  });

  // API: List transactions
  server.get("/api/transactions", async (request, _reply) => {
    const query = request.query as { status?: string; limit?: string };
    const limit = parseInt(query.limit || "50");

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
    const limit = parseInt(query.limit || "50");

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
    const settings = await PaymentSettingsService.getAllSettings();
    const defaultGateway = await PaymentSettingsService.getDefaultGateway();
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
    return PaymentSettingsService.getAllPricingByCategory(category);
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
    ] = await Promise.all([
      PaymentSettingsService.getAllPricingByCategory("package"),
      PaymentSettingsService.getAllPricingByCategory("subscription"),
      PaymentSettingsService.getAllPricingByCategory("video_credit"),
      PaymentSettingsService.getAllPricingByCategory("image_credit"),
      PaymentSettingsService.getAllPricingByCategory("provider_cost"),
      PaymentSettingsService.getAllPricingByCategory("global"),
    ]);
    return {
      packages,
      subscriptions,
      videoCosts,
      imageCosts,
      providerCosts,
      global,
    };
  });

  // ── Pricing Dashboard ──

  server.get("/admin/pricing", async (request, reply) => {
    return reply.view("admin/pricing.ejs");
  });

  // ── Prompt Management Dashboard ──

  server.get("/admin/prompts", async (request, reply) => {
    return reply.view("admin/prompts.ejs");
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
    const validTiers = ["FREE", "STARTER", "PRO", "ENTERPRISE"];
    if (!validTiers.includes(tier)) return reply.status(400).send({ error: "Invalid tier" });
    const user = await prisma.user.update({
      where: { telegramId: BigInt(id) },
      data: { tier: tier as any },
    });
    return { success: true, tier: user.tier };
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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getTokenStats } = require("../services/token-tracker.service");
    return getTokenStats(parseInt(days));
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
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      select: {
        id: true, provider: true, model: true, service: true,
        promptTokens: true, completionTokens: true, totalTokens: true,
        costUsd: true, costIdr: true, createdAt: true,
      },
    });
  });

  // ── Analytics Dashboard ──

  server.get("/admin/dashboard", async (request, reply) => {
    return reply.view("admin/analytics.ejs");
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
    await retentionQueue.add('run_checks', { type });
    return { queued: true, type };
  });

  /** GET /api/v3/users/:id/gamification */
  server.get('/api/v3/users/:id/gamification', async (request: any, reply) => {
    const userId = BigInt(request.params.id);
    const [summary, streak, badges] = await Promise.all([
      GamificationService.getUserGamificationSummary(userId),
      (prisma as any).userStreak.findUnique({ where: { userId } }),
      (prisma as any).userBadge.findMany({ where: { userId } }),
    ]);
    return { summary, streak, badges };
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
}