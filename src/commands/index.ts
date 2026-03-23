/**
 * Commands Module
 * 
 * Registers all bot commands
 */

import { Telegraf } from 'telegraf';
import { BotContext } from '@/types';
import { logger } from '@/utils/logger';

// Import command handlers
import { startCommand } from './start';
import { helpCommand } from './help';
import { createCommand } from './create';
import { topupCommand } from './topup';
import { referralCommand } from './referral';
import { profileCommand } from './profile';
import { settingsCommand } from './settings';
import { videosCommand } from './videos';
import { subscriptionCommand } from './subscription';
import { supportCommand } from './support';
import { reportTodayCommand, creativeIdeasCommand } from './ads';
import { chatCommand } from './grok';
import { socialCommand } from './social';
import { promptsCommand, dailyCommand, trendingCommand, fingerprintCommand } from './prompts';

// Admin commands
import { adminBroadcastCommand } from './admin/broadcast';
import { adminSystemStatusCommand } from './admin/systemStatus';
import { adminGrantCreditsCommand } from './admin/grantCredits';
import { paymentSettingsCommand } from './admin/paymentSettings';

/**
 * Setup all bot commands
 */
export function setupCommands(bot: Telegraf<BotContext>): void {
  logger.info('Registering bot commands...');

  // User commands
  bot.command('start', startCommand);
  bot.command('help', helpCommand);
  bot.command('create', createCommand);
  bot.command('menu', startCommand); // Show main menu with all features
  bot.command('dashboard', startCommand); // Alias for menu
  bot.command('topup', topupCommand);
  bot.command('referral', referralCommand);
  bot.command('profile', profileCommand);
  bot.command('settings', settingsCommand);
  bot.command('videos', videosCommand);
  bot.command('subscription', subscriptionCommand);
  bot.command('support', supportCommand);
  // AI chat (OmniRoute — cheapest/free model)
  bot.command('chat', chatCommand);
  bot.command('ask', chatCommand);  // Alias
  bot.command('social', socialCommand);  // Social media accounts & publish
  // Prompt library commands
  bot.command('prompts', promptsCommand);
  bot.command('prompt', promptsCommand);   // Alias
  bot.command('daily', dailyCommand);
  bot.command('trending', trendingCommand);
  bot.command('fingerprint', fingerprintCommand);
  // Ads commands - disabled for now, focus on content generation
  // bot.command('report_today', reportTodayCommand);
  // bot.command('creative_ideas', creativeIdeasCommand);

  // Admin commands (with middleware check)
  bot.command('broadcast', adminBroadcastCommand);
  bot.command('system_status', adminSystemStatusCommand);
  bot.command('grant_credits', adminGrantCreditsCommand);
  bot.command('payment_settings', paymentSettingsCommand);
  bot.command('admin', paymentSettingsCommand); // Alias

  // Set bot commands menu - show all features accessible
  bot.telegram.setMyCommands([
    { command: 'start', description: '🏠 Start bot & main menu' },
    { command: 'prompts', description: '📚 Browse 40+ prompt templates' },
    { command: 'trending', description: '🔥 Prompt trending minggu ini' },
    { command: 'daily', description: '🎁 Mystery prompt gratis harian' },
    { command: 'create', description: '🎬 Buat video baru' },
    { command: 'chat', description: '💬 Chat dengan AI' },
    { command: 'fingerprint', description: '🧬 Lihat style preference kamu' },
    { command: 'videos', description: '📁 My videos' },
    { command: 'topup', description: '💰 Top up credits' },
    { command: 'subscription', description: '⭐ Subscription plans' },
    { command: 'referral', description: '👥 Referral & affiliate' },
    { command: 'profile', description: '👤 My profile' },
    { command: 'settings', description: '⚙️ Settings' },
    { command: 'support', description: '🆘 Get help' },
    { command: 'help', description: '📖 Panduan lengkap' },
  ]);

  logger.info('Bot commands registered successfully');
}
