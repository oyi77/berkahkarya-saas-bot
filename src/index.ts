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

    // Initialize Redis
    logger.info('💾 Initializing Redis...');
    await initializeRedis();
    logger.info('✅ Redis connected');

    // Initialize queue
    logger.info('📋 Initializing queue...');
    await initializeQueue();
    logger.info('✅ Queue initialized');

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

    // Start bot FIRST, then server in background
    if (process.env.NODE_ENV === 'production') {
      // Use webhook in production
      const webhookUrl = process.env.WEBHOOK_URL;
      if (webhookUrl) {
        await bot.launch({
          webhook: {
            domain: webhookUrl,
            port,
          },
        });
        logger.info(`🤖 Bot started with webhook: ${webhookUrl}`);
      } else {
        logger.error('WEBHOOK_URL is required in production');
        process.exit(1);
      }
    } else {
      // Use polling in development
      logger.info('🤖 Starting bot with polling...');

      try {
        // Clear any existing sessions by consuming updates
        const botToken = process.env.BOT_TOKEN || '';
        
        // Try to get and acknowledge all pending updates
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?timeout=1`);
        } catch (e) {
          // Ignore errors from this preliminary call
        }
        
        await bot.telegram.deleteWebhook();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await bot.launch();
        logger.info('✅ Bot polling started successfully');
      } catch (error: any) {
        logger.error('❌ Bot launch failed:', error);
        
        // Try one more time after waiting
        await new Promise(resolve => setTimeout(resolve, 5000));
        try {
          await bot.telegram.deleteWebhook();
          await bot.launch();
          logger.info('✅ Bot polling started on second try');
        } catch (retryError) {
          logger.error('❌ All retries failed');
        }
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

  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main();
