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

      // Welcome back message
      await ctx.reply(
        `👋 Welcome back, ${user.first_name}!\n\n` +
        `💰 Credits: ${existingUser.creditBalance}\n` +
        `⭐ Tier: ${existingUser.tier.toUpperCase()}\n\n` +
        `Ready to create some amazing videos? 🎬`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎬 Create Video', callback_data: 'create_video' }],
              [{ text: '🖼️ Generate Image', callback_data: 'image_generate' }],
              [{ text: '📋 Main Menu', callback_data: 'main_menu' }],
            ],
            keyboard: [
              [{ text: '🎬 Create Video' }, { text: '💰 Top Up' }],
              [{ text: '📁 My Videos' }, { text: '👤 Profile' }],
              [{ text: '👥 Referral' }, { text: '⚙️ Settings' }],
            ],
            resize_keyboard: true,
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
              [{ text: '🎬 Create Video' }],
              [{ text: '❓ How it works' }],
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
