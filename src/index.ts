/**
 * OpenClaw Bot - Main Entry Point
 * 
 * AI Video Marketing SaaS Platform - Telegram Bot
 * Version: 3.0.0
 */

import { config } from 'dotenv';
config();

import { Telegraf } from 'telegraf';
import Fastify from 'fastify';
import { logger } from '@/utils/logger';
import { setupCommands } from '@/commands';
import { setupHandlers } from '@/handlers';
import { setupMiddleware } from '@/middleware';
import { healthCheckRoutes } from '@/routes/health';
import { webhookRoutes } from '@/routes/webhook';
import { adminRoutes } from '@/routes/admin';
import { webRoutes } from '@/routes/web';
import { initializeDatabase } from '@/config/database';
import { initializeRedis } from '@/config/redis';
import { initializeQueue } from '@/config/queue';
import { startVideoWorker } from '@/workers/video-generation.worker';
import { cleanupStuckVideos, setCleanupTelegram } from '@/workers/cleanup.worker';
import { UserService } from '@/services/user.service';
import { PaymentSettingsService } from '@/services/payment-settings.service';

// Validate environment variables
const requiredEnvVars = [
  'BOT_TOKEN',
  'DATABASE_URL',
  'REDIS_URL',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN!);

// Allow UserService to send proactive DMs (low-credit warnings, etc.)
UserService.setBotInstance(bot);

// Initialize Fastify server
const server = Fastify({
  logger: false,
});

async function main() {
  const port = parseInt(process.env.PORT || '3000');

  try {
    logger.info('🚀 Starting OpenClaw Bot v3.0.0...');

    // Initialize database
    logger.info('📦 Initializing database...');
    await initializeDatabase();
    logger.info('✅ Database connected');

    // Seed pricing defaults (first run only)
    await PaymentSettingsService.initializePricingDefaults().catch(() => {});
    logger.info('✅ Pricing config ready');

    // Initialize Redis
    logger.info('💾 Initializing Redis...');
    await initializeRedis();
    logger.info('✅ Redis connected');

    // Initialize queue
    logger.info('📋 Initializing queue...');
    await initializeQueue();
    logger.info('✅ Queue initialized');

    // Start video generation worker
    try {
      startVideoWorker(bot);
      logger.info('✅ Video generation worker started');
    } catch (workerErr) {
      logger.warn('⚠️ Video worker failed to start, falling back to direct async:', workerErr);
    }

    // Set telegram instance for cleanup notifications and run startup cleanup
    setCleanupTelegram(bot.telegram);
    try {
      const stuckCount = await cleanupStuckVideos(bot.telegram);
      if (stuckCount > 0) {
        logger.info(`✅ Startup cleanup: resolved ${stuckCount} stuck videos`);
      }
    } catch (cleanupErr) {
      logger.warn('⚠️ Startup stuck video cleanup failed:', cleanupErr);
    }

    // Setup middleware
    logger.info('🔧 Setting up middleware...');
    setupMiddleware(bot);

    // Setup commands
    logger.info('⌨️  Setting up commands...');
    setupCommands(bot);

    // Setup handlers
    logger.info('👋 Setting up handlers...');
    setupHandlers(bot);

    // Setup routes
    logger.info('🌐 Setting up routes...');
    await server.register(healthCheckRoutes);
    await server.register(webhookRoutes, { bot });
    await server.register(adminRoutes);
    await server.register(webRoutes);
    logger.info('✅ Routes registered');

    // Start Fastify server FIRST (non-blocking)
    logger.info(`🌐 Starting HTTP server on port ${port}...`);
    server.listen({ port, host: '0.0.0.0' }).then(() => {
      logger.info(`✅ HTTP server listening on http://0.0.0.0:${port}`);
    }).catch(err => {
      logger.error('❌ Failed to start HTTP server:', err);
    });

    // Start bot
    const webhookUrl = process.env.WEBHOOK_URL;
    if (process.env.NODE_ENV === 'production' && webhookUrl) {
      // In production, set Telegram webhook to point at our Fastify route
      const webhookSecret = process.env.WEBHOOK_SECRET || '';
      const fullUrl = `${webhookUrl}/webhook/telegram`;
      await bot.telegram.setWebhook(fullUrl, {
        secret_token: webhookSecret,
      });
      logger.info(`🤖 Bot webhook set: ${fullUrl}`);
    } else {
      logger.info('🤖 Starting bot with polling...');

      try {
        // Delete any existing webhook first
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        await new Promise(resolve => setTimeout(resolve, 1000));

        await bot.launch();
        logger.info('✅ Bot polling started successfully');
      } catch (error: any) {
        logger.error('❌ Bot launch failed:', error);
        logger.warn('Bot will continue without polling - check Telegram API conflicts');
      }
    }

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      bot.stop(signal);
      await server.close();
      logger.info('👋 Goodbye!');
      process.exit(0);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));

    // Admin alert for unhandled errors
    const adminIds = process.env.ADMIN_TELEGRAM_IDS?.split(',').map(id => id.trim()).filter(Boolean) || [];
    const sendAdminAlert = async (msg: string) => {
      for (const adminId of adminIds) {
        try {
          await bot.telegram.sendMessage(adminId, `🚨 *Bot Error Alert*\n\n${msg}`, { parse_mode: 'Markdown' });
        } catch (_) { /* silent */ }
      }
    };

    process.on('unhandledRejection', (reason: any) => {
      const msg = reason?.message || String(reason);
      logger.error('unhandledRejection:', msg);
      // Only alert for non-shutdown errors
      if (!msg.includes('Bot is not running') && !msg.includes('SIGTERM')) {
        sendAdminAlert(`Unhandled rejection:\n\`${msg.slice(0, 300)}\``);
      }
    });

    process.on('uncaughtException', (err) => {
      logger.error('uncaughtException:', err);
      sendAdminAlert(`Uncaught exception:\n\`${err.message.slice(0, 300)}\``);
    });

  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main();
