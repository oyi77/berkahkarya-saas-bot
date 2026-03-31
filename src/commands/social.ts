/**
 * Social Command — Manage social media accounts and publish content
 */

import { BotContext } from '@/types';
import { PostAutomationService } from '@/services/postautomation.service';
import { logger } from '@/utils/logger';
import { t } from '@/i18n/translations';

/**
 * Handle /social command — show connected accounts or connect new ones
 */
export async function socialCommand(ctx: BotContext): Promise<void> {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply(t('social.unable_identify_user', 'id'));
      return;
    }

    const accounts = await PostAutomationService.getUserAccounts(BigInt(userId));

    if (accounts.length === 0) {
      await ctx.reply(
        '🔗 *Social Media Accounts*\n\n' +
        'Connect your social media accounts to publish videos directly from the bot.\n\n' +
        'Select a platform to connect:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📱 TikTok', callback_data: 'connect_account_tiktok' }],
              [{ text: '📷 Instagram', callback_data: 'connect_account_instagram' }],
              [{ text: '📘 Facebook', callback_data: 'connect_account_facebook' }],
              [{ text: '🐦 Twitter/X', callback_data: 'connect_account_twitter' }],
              [{ text: '📺 YouTube', callback_data: 'connect_account_youtube' }],
            ],
          },
        }
      );
      return;
    }

    // Show connected accounts with options
    const platformEmoji: Record<string, string> = {
      tiktok: '📱', instagram: '📷', facebook: '📘', twitter: '🐦', youtube: '📺',
    };

    let message = '🔗 *Your Social Media Accounts*\n\n';
    const keyboard: any[][] = [];

    for (const acc of accounts) {
      const emoji = platformEmoji[acc.platform.toLowerCase()] || '📱';
      message += `${emoji} ${acc.platform.toUpperCase()}: ${acc.username}\n`;
      keyboard.push([{
        text: `❌ Disconnect ${acc.platform} (${acc.username})`,
        callback_data: `disconnect_account_${acc.id}`,
      }]);
    }

    message += '\n*Actions:*';
    keyboard.push([{ text: '➕ Connect New Account', callback_data: 'manage_accounts' }]);
    keyboard.push([{ text: '🎬 Create Video to Publish', callback_data: 'create_video_new' }]);

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard },
    });
  } catch (error) {
    logger.error('Error in social command:', error);
    await ctx.reply(t('error.generic', 'id'));
  }
}
