/**
 * Settings Command
 * 
 * Handles /settings command
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';

/**
 * Handle /settings command
 */
export async function settingsCommand(ctx: BotContext): Promise<void> {
  try {
    await ctx.reply(
      '⚙️ *Settings*\n\n' +
      'Configure your preferences:\n\n' +
      '*Language:* Bahasa Indonesia\n' +
      '*Notifications:* Enabled\n' +
      '*Auto-renewal:* Disabled\n\n' +
      'What would you like to change?',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🌐 Change Language', callback_data: 'settings_language' }],
            [{ text: '🔔 Notifications', callback_data: 'settings_notifications' }],
            [{ text: '🔄 Auto-renewal', callback_data: 'settings_autorenewal' }],
          ],
        },
      }
    );

    ctx.session.state = 'SETTINGS_LANGUAGE';
  } catch (error) {
    logger.error('settingsCommand error:', error);
    try {
      await ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi atau hubungi /support.');
    } catch { /* ignore */ }
  }
}
