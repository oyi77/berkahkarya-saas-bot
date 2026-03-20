/**
 * Start Command
 * 
 * Handles /start command - entry point for new users
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';

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
      // Check for referral code in deep link
      const msg = ctx.message as { text?: string } | undefined;
      const startPayload = msg?.text?.split(' ')[1];
      let referredBy = null;
      
      if (startPayload?.startsWith('ref_')) {
        const refCode = startPayload.replace('ref_', '');
        const referrer = await UserService.findByReferralCode(refCode);
        if (referrer) {
          referredBy = referrer.uuid;
        }
      }

      // Create new user
      const newUser = await UserService.create({
        telegramId: BigInt(user.id),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        referredBy: referredBy || undefined,
      });

      // New user onboarding
      await ctx.reply(
        `🎉 Welcome to OpenClaw, ${user.first_name}!\n\n` +
        `I'm your AI video marketing assistant. I can help you create stunning videos for your business in minutes!\n\n` +
        `🎁 You received:\n` +
        `✨ 3 free trial credits\n` +
        `🔗 Referral code: ${newUser.referralCode}\n\n` +
        `Here's what you can do:\n` +
        `🎬 Create marketing videos from photos\n` +
        `📱 Export for TikTok, IG, YouTube\n` +
        `👥 Earn credits by referring friends\n\n` +
        `Let's get started! 🚀`,
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
    }

    // Update session state
    if (ctx.session) {
      ctx.session.state = 'DASHBOARD';
      ctx.session.lastActivity = new Date();
    }

  } catch (error) {
    logger.error('Error in start command:', error);
    await ctx.reply('❌ Something went wrong. Please try again later.');
  }
}
