/**
 * OpenClaw Bot - Main Entry Point (FIXED - No Server Listen)
 * 
 * AI Video Marketing SaaS Platform - Telegram Bot
 * Version: 3.0.0 - FIXING POLLING ISSUE
 */

import { config } from 'dotenv';
config();

import { Telegraf } from 'telegraf';
import { logger } from '@/utils/logger';
import { setupCommands } from '@/commands';
import { setupHandlers } from '@/handlers';
import { setupMiddleware } from '@/middleware';
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

async function main() {
  try {
    logger.info('🚀 Starting OpenClaw Bot v3.0.0 (FIXED VERSION)...');

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

    // NO SERVER - Just bot polling
    logger.info('🤖 Starting bot with polling ONLY (no HTTP server)...');

    try {
      logger.info('✅ About to call bot.launch()...');
      await bot.launch();
      logger.info('✅ Bot polling stopped (shutdown)');
    } catch (error) {
      logger.error('❌ Bot launch failed:', error);
      throw error;
    }

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      bot.stop(signal);
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
