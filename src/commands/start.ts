/**
 * Start Command
 * 
 * Handles /start command - entry point for new users
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';
import { t } from '@/i18n/translations';
import { LANGUAGE_LIST, LANG_PAGE_SIZE } from '@/config/languages';

/**
 * Handle /start command
 */
export async function startCommand(ctx: BotContext): Promise<void> {
  try {
    const user = ctx.from;
    
    if (!user) {
      await ctx.reply('❌ Unable to identify user. Please try again.');
      return;
    }

    logger.info(`User started bot: ${user.id} (${user.username || 'no username'})`);

    // Check if user exists in database
    const existingUser = await UserService.findByTelegramId(BigInt(user.id));

    if (existingUser) {
      // Update activity
      await UserService.updateActivity(BigInt(user.id));
      
      // Check if banned
      if (existingUser.isBanned) {
        await ctx.reply(
          `❌ Your account has been restricted.\n\n` +
          `Reason: ${existingUser.banReason || 'No reason provided'}\n\n` +
          `Contact support if you believe this is an error.`
        );
        return;
      }

      // Set persistent reply keyboard with complete menu
      await ctx.reply(
        `👋 Welcome back, ${user.first_name}!\n\n` +
        `💰 Credits: ${existingUser.creditBalance}\n` +
        `⭐ Tier: ${existingUser.tier.toUpperCase()}`,
        {
          reply_markup: {
            keyboard: [
              [{ text: '🎬 Create Video' }, { text: '🖼️ Generate Image' }],
              [{ text: '💬 Chat AI' }, { text: '📁 My Videos' }],
              [{ text: '💰 Top Up' }, { text: '⭐ Subscription' }],
              [{ text: '👤 Profile' }, { text: '👥 Referral' }],
              [{ text: '⚙️ Settings' }, { text: '🆘 Support' }],
            ],
            resize_keyboard: true,
          },
        }
      );

      // Show inline feature menu (must be separate — Telegram only allows one reply_markup type per message)
      await ctx.reply(
        `🎬 *OpenClaw Video Studio*\n\n` +
        `What would you like to do?`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🎬 Create Video', callback_data: 'create_video' },
                { text: '🖼️ Generate Image', callback_data: 'image_generate' },
              ],
              [{ text: '💬 Chat with AI', callback_data: 'open_chat' }],
              [
                { text: '🔄 Clone Video', callback_data: 'clone_video' },
                { text: '🔄 Clone Image', callback_data: 'clone_image' },
              ],
              [
                { text: '📋 Storyboard', callback_data: 'storyboard_create' },
                { text: '📈 Viral Research', callback_data: 'viral_research' },
              ],
              [
                { text: '🔍 Disassemble', callback_data: 'disassemble' },
                { text: '🔗 Social Accounts', callback_data: 'manage_accounts' },
              ],
              [
                { text: '💰 Top Up', callback_data: 'topup' },
                { text: '⭐ Subscription', callback_data: 'open_subscription' },
              ],
              [
                { text: '📁 My Videos', callback_data: 'videos_list' },
                { text: '👤 Profile', callback_data: 'open_profile' },
              ],
              [
                { text: '👥 Referral', callback_data: 'open_referral' },
                { text: '🆘 Help', callback_data: 'open_help' },
              ],
            ],
          },
        }
      );
    } else {
      // New user — show language selection before creating account
      // Check for referral code in deep link and preserve it in session
      const msg = ctx.message as { text?: string } | undefined;
      const startPayload = msg?.text?.split(' ')[1];

      if (ctx.session) {
        ctx.session.state = 'ONBOARDING_LANGUAGE';
        ctx.session.lastActivity = new Date();
        ctx.session.stateData = { startPayload: startPayload || null };
      }

      // Build first page of language buttons (2 per row, first 8 popular)
      const pageItems = LANGUAGE_LIST.slice(0, LANG_PAGE_SIZE);
      const langButtons: Array<Array<{ text: string; callback_data: string }>> = [];
      for (let i = 0; i < pageItems.length; i += 2) {
        const row: Array<{ text: string; callback_data: string }> = [];
        for (let j = i; j < Math.min(i + 2, pageItems.length); j++) {
          const lang = pageItems[j];
          row.push({
            text: `${lang.flag} ${lang.label}`,
            callback_data: `onboard_lang_${lang.code}`,
          });
        }
        langButtons.push(row);
      }

      // "More languages" button if there are more than one page
      if (LANGUAGE_LIST.length > LANG_PAGE_SIZE) {
        langButtons.push([{ text: '🌐 More languages...', callback_data: 'onboard_lang_more_1' }]);
      }

      await ctx.reply(
        `🌐 *Welcome to OpenClaw!*\n\n` +
        `Please select your preferred language.\n` +
        `This will be used for the bot interface, voice over, subtitles, and captions.`,
        {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: langButtons },
        }
      );
      return;
    }

    // Update session state (returning users only — new users handled after language pick)
    if (ctx.session) {
      ctx.session.state = 'DASHBOARD';
      ctx.session.lastActivity = new Date();
    }

  } catch (error) {
    logger.error('Error in start command:', error);
    await ctx.reply('❌ Something went wrong. Please try again later.');
  }
}
