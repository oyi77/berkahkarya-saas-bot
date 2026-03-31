/**
 * OpenClaw Bot - Main Entry Point
 *
 * AI Video Marketing SaaS Platform - Telegram Bot
 * Version: 3.0.0
 */

import { config } from "dotenv";
config();

import { validateEnv } from "@/config/env";
validateEnv();

import { Telegraf } from "telegraf";
import Fastify from "fastify";
import path from "path";
import fastifyView from "@fastify/view";
import ejs from "ejs";
import { logger } from "@/utils/logger";
import { setupCommands } from "@/commands";
import { setupHandlers } from "@/handlers";
import { setupMiddleware } from "@/middleware";
import { healthCheckRoutes } from "@/routes/health";
import { webhookRoutes } from "@/routes/webhook";
import { adminRoutes } from "@/routes/admin";
import { webRoutes } from "@/routes/web";
import { PaymentService } from "@/services/payment.service";
import { initializeDatabase } from "@/config/database";
import { initializeRedis } from "@/config/redis";
import { initializeQueue } from "@/config/queue";
import { startVideoWorker } from "@/workers/video-generation.worker";
import {
  cleanupStuckVideos,
  setCleanupTelegram,
} from "@/workers/cleanup.worker";
import { startDailyReportWorker } from "@/workers/daily-report.worker";
import cron from "node-cron";
import { retentionQueue } from "@/workers/retention.worker";
import { UserService } from "@/services/user.service";
import { SubscriptionService } from "@/services/subscription.service";
import { setAlertTelegram, sendAdminAlert as sendGroupAlert } from "@/services/admin-alert.service";
import { PaymentSettingsService } from "@/services/payment-settings.service";
import axios from "axios";

// Set global axios defaults — all HTTP calls get 30s timeout by default
axios.defaults.timeout = 30_000;
axios.defaults.headers.common["User-Agent"] = "BerkahKarya-Bot/3.0";

// Validate environment variables
const requiredEnvVars = ["BOT_TOKEN", "DATABASE_URL", "REDIS_URL"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN!);
// Allow services to send proactive DMs
UserService.setBotInstance(bot);
PaymentService.setBotInstance(bot);

// Global BigInt serializer patch (Prisma returns BigInt for telegramId)
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

// Initialize Fastify server
const server = Fastify({
  logger: false,
});

async function main() {
  const port = parseInt(process.env.PORT || "3000");

  try {
    logger.info("🚀 Starting OpenClaw Bot v3.0.0...");

    // Initialize database
    logger.info("📦 Initializing database...");
    await initializeDatabase();
    logger.info("✅ Database connected");

    // Seed pricing defaults (first run only)
    await PaymentSettingsService.initializePricingDefaults().catch(err => logger.error('Failed to initialize pricing defaults', { error: err.message }));
    logger.info("✅ Pricing config ready");

    // Initialize Redis
    logger.info("💾 Initializing Redis...");
    await initializeRedis();
    logger.info("✅ Redis connected");

    // Initialize queue
    logger.info("📋 Initializing queue...");
    await initializeQueue();
    logger.info("✅ Queue initialized");

    // Start video generation worker
    try {
      startVideoWorker(bot);
      logger.info("✅ Video generation worker started");
    } catch (workerErr) {
      logger.warn(
        "⚠️ Video worker failed to start, falling back to direct async:",
        workerErr,
      );
    }

    // Start daily report worker (sends activity report at 00:00 WIB)
    try {
      startDailyReportWorker(bot);
      logger.info("✅ Daily report worker started");
    } catch (reportErr) {
      logger.warn("⚠️ Daily report worker failed to start:", reportErr);
    }

    // Retention cron: push check jobs every 6 hours
    try {
      cron.schedule("0 */6 * * *", async () => {
        logger.info("⏰ Running scheduled retention check...");
        await retentionQueue.add("scheduled_check", { type: "all", triggeredBy: "cron" });
      });
      logger.info("✅ Retention cron scheduled (every 6h)");
    } catch (cronErr) {
      logger.warn("⚠️ Retention cron failed to start:", cronErr);
    }

    // Subscription renewal cron: run daily at 00:05 WIB (17:05 UTC)
    try {
      cron.schedule("5 17 * * *", async () => {
        logger.info("⏰ Running subscription renewal/expiry check...");
        const count = await SubscriptionService.checkExpiredSubscriptions();
        if (count > 0) logger.info(`✅ Processed ${count} subscription(s)`);
      });
      logger.info("✅ Subscription renewal cron scheduled (daily 00:05 WIB)");
    } catch (cronErr) {
      logger.warn("⚠️ Subscription cron failed to start:", cronErr);
    }

    // Credit expiry cron: run daily at 00:00 WIB (17:00 UTC)
    try {
      cron.schedule("0 17 * * *", async () => {
        logger.info("⏰ Running credit expiry check...");
        const count = await UserService.expireStaleCredits(bot.telegram);
        if (count > 0) logger.info(`✅ Expired credits for ${count} user(s)`);
      });
      logger.info("✅ Credit expiry cron scheduled (daily 00:00 WIB)");
    } catch (cronErr) {
      logger.warn("⚠️ Credit expiry cron failed to start:", cronErr);
    }

    // Refund retry cron: process failed refunds every 5 minutes
    try {
      cron.schedule("*/5 * * * *", async () => {
        const count = await UserService.processRefundRetries();
        if (count > 0) logger.info(`✅ Processed ${count} refund retry(s)`);
      });
      logger.info("✅ Refund retry cron scheduled (every 5 min)");
    } catch (cronErr) {
      logger.warn("⚠️ Refund retry cron failed to start:", cronErr);
    }

    // Set telegram instance for cleanup notifications, admin alerts, and run startup cleanup
    setCleanupTelegram(bot.telegram);
    setAlertTelegram(bot.telegram);
    if (process.env.ADMIN_ALERT_CHAT_ID) {
      sendGroupAlert('info', 'Bot Started', { version: 'v3.0', env: process.env.NODE_ENV || 'development' });
    }
    try {
      const stuckCount = await cleanupStuckVideos(bot.telegram);
      if (stuckCount > 0) {
        logger.info(`✅ Startup cleanup: resolved ${stuckCount} stuck videos`);
      }
    } catch (cleanupErr) {
      logger.warn("⚠️ Startup stuck video cleanup failed:", cleanupErr);
    }

    // Setup middleware
    logger.info("🔧 Setting up middleware...");
    setupMiddleware(bot);

    // Setup commands
    logger.info("⌨️  Setting up commands...");
    setupCommands(bot);

    // Setup handlers
    logger.info("👋 Setting up handlers...");
    setupHandlers(bot);

    // Setup routes
    logger.info("🌟 Setting up view engine...");
    await server.register(fastifyView, {
      engine: { ejs },
      root: path.join(process.cwd(), "src", "views"),
      viewExt: "ejs",
    });

    // ── Security headers (onRequest so they're set before any response) ──
    server.addHook('onRequest', async (_request, reply) => {
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('X-Frame-Options', 'DENY');
      reply.header('X-XSS-Protection', '1; mode=block');
    });

    // ── CORS (onRequest to avoid conflicts with SSE/raw responses) ──
    const corsOrigin = process.env.CORS_ORIGIN || process.env.WEBHOOK_URL || process.env.WEB_APP_URL || '';
    server.addHook('onRequest', async (request, reply) => {
      const origin = request.headers.origin;
      if (origin && corsOrigin) {
        const allowedOrigins = corsOrigin.split(',').map((o: string) => o.trim());
        if (allowedOrigins.includes(origin)) {
          reply.header('Access-Control-Allow-Origin', origin);
          reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          reply.header('Access-Control-Allow-Credentials', 'true');
          reply.header('Vary', 'Origin');
        }
      }
    });

    // Handle CORS preflight
    server.options('/*', async (request, reply) => {
      const origin = request.headers.origin;
      if (origin && corsOrigin) {
        const allowedOrigins = corsOrigin.split(',').map((o: string) => o.trim());
        if (allowedOrigins.includes(origin)) {
          reply.header('Access-Control-Allow-Origin', origin);
          reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          reply.header('Access-Control-Allow-Credentials', 'true');
          reply.header('Access-Control-Max-Age', '86400');
        }
      }
      return reply.status(204).send();
    });

    logger.info("🌐 Setting up routes...");
    await server.register(healthCheckRoutes);
    await server.register(webhookRoutes, { bot });
    await server.register(adminRoutes);
    await server.register(webRoutes);
    logger.info("✅ Routes registered");

    // Start Fastify server FIRST (non-blocking)
    logger.info(`🌐 Starting HTTP server on port ${port}...`);
    server
      .listen({ port, host: "0.0.0.0" })
      .then(() => {
        logger.info(`✅ HTTP server listening on http://0.0.0.0:${port}`);
      })
      .catch((err) => {
        logger.error("❌ Failed to start HTTP server:", err);
      });

    // Start bot
    const webhookUrl = process.env.WEBHOOK_URL;
    const forcePolling = process.env.FORCE_POLLING === "true";

    if (!forcePolling && process.env.NODE_ENV === "production" && webhookUrl) {
      // In production, set Telegram webhook to point at our Fastify route
      const webhookSecret = process.env.WEBHOOK_SECRET || "";
      const fullUrl = `${webhookUrl}/webhook/telegram`;
      await bot.telegram.setWebhook(fullUrl, {
        secret_token: webhookSecret,
      });
      logger.info(`🤖 Bot webhook set: ${fullUrl}`);
    } else {
      if (forcePolling) {
        logger.info("🤖 FORCE_POLLING enabled - starting with polling mode...");
      } else {
        logger.info("🤖 Starting bot with polling...");
      }

      try {
        // Delete any existing webhook first
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await bot.launch();
        logger.info("✅ Bot polling started successfully");
      } catch (error: any) {
        logger.error("❌ Bot launch failed:", error);
        logger.warn(
          "Bot will continue without polling - check Telegram API conflicts",
        );
      }
    }

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      try { await bot.stop(signal); } catch (_) { /* ignore stop errors */ }
      try { await server.close(); } catch (_) { /* ignore close errors */ }
      logger.info("👋 Goodbye!");
      process.exit(0);
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));

    // Admin alert for unhandled errors
    const adminIds =
      process.env.ADMIN_TELEGRAM_IDS?.split(",")
        .map((id) => id.trim())
        .filter(Boolean) || [];
    const sendAdminAlert = async (msg: string) => {
      for (const adminId of adminIds) {
        try {
          await bot.telegram.sendMessage(
            adminId,
            `🚨 *Bot Error Alert*\n\n${msg}`,
            { parse_mode: "Markdown" },
          );
        } catch (_) {
          /* silent */
        }
      }
    };

    process.on("unhandledRejection", (reason: any) => {
      const msg = reason?.message || String(reason);
      logger.error("unhandledRejection:", msg);
      if (!msg.includes("Bot is not running") && !msg.includes("SIGTERM")) {
        sendAdminAlert(`Unhandled rejection:\n\`${msg.slice(0, 300)}\``);
        sendGroupAlert('critical', 'Unhandled Rejection', { error: msg.slice(0, 300) });
      }
    });

    process.on("uncaughtException", (err) => {
      logger.error("uncaughtException:", err);
      sendAdminAlert(`Uncaught exception:\n\`${err.message.slice(0, 300)}\``);
      sendGroupAlert('critical', 'Uncaught Exception', { error: err.message.slice(0, 300) });
    });
  } catch (error) {
    logger.error("Failed to start bot:", error);
    process.exit(1);
  }
}

main();
