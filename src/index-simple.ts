/**
 * Simple Bot Test - No handlers, no middleware
 */

import { config } from 'dotenv';
config();

import { Telegraf } from 'telegraf';
import { logger } from '@/utils/logger';

const bot = new Telegraf(process.env.BOT_TOKEN!);

async function main() {
  try {
    logger.info('🧪 Simple bot test starting...');

    // Simple command handler
    bot.command('ping', (ctx) => {
      logger.info('Ping received!');
      ctx.reply('🏓 PONG!');
    });

    logger.info('✅ About to call bot.launch()...');
    await bot.launch();
    logger.info('✅ Bot launch completed');

  } catch (error) {
    logger.error('❌ Bot launch failed:', error);
    process.exit(1);
  }
}

main();
