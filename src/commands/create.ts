/**
 * Create Command
 * 
 * Handles video creation flow
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';
import { VideoService } from '@/services/video.service';

/**
 * Handle /create command
 */
export async function createCommand(ctx: BotContext): Promise<void> {
  try {
    const user = ctx.from;
    if (!user) return;

    // Check user exists and has credits
    const dbUser = await UserService.findByTelegramId(BigInt(user.id));
    if (!dbUser) {
      await ctx.reply('❌ Please /start first to use this feature.');
      return;
    }

    if (Number(dbUser.creditBalance) < 0.5) {
      await ctx.reply(
        `❌ Insufficient credits.\n\n` +
        `Current balance: ${dbUser.creditBalance}\n` +
        `Minimum required: 0.5 credits\n\n` +
        `Use /topup to add more credits.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '💰 Top Up Now', callback_data: 'topup' }],
            ],
          },
        }
      );
      return;
    }

    // Show niche selection
    const niches = VideoService.getNiches();

    await ctx.reply(
      `🎬 **Create New Video**\n\n` +
      `Current credits: ${dbUser.creditBalance}\n\n` +
      `Step 1: Select your niche`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: niches.map(niche => [
            { text: niche.name, callback_data: `niche_${niche.id}` },
          ]),
        },
      }
    );
  } catch (error) {
    logger.error('Error in create command:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

/**
 * Handle niche selection
 */
export async function handleNicheSelection(ctx: BotContext, nicheId: string): Promise<void> {
  try {
    if (!ctx.session) return;
    
    ctx.session.videoCreation = { niche: nicheId };
    await ctx.answerCbQuery('Niche selected!');

    const platforms = VideoService.getPlatforms();

    await ctx.editMessageText(
      `🎬 **Create New Video**\n\n` +
      `Niche: ${nicheId}\n\n` +
      `Step 2: Select platform`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: platforms.map(p => [
            { text: `${p.id.toUpperCase()} (${p.aspectRatio})`, callback_data: `platform_${p.id}` },
          ]),
        },
      }
    );
  } catch (error) {
    logger.error('Error handling niche selection:', error);
    await ctx.answerCbQuery('Error. Please try again.');
  }
}

/**
 * Handle platform selection
 */
export async function handlePlatformSelection(ctx: BotContext, platformId: string): Promise<void> {
  try {
    if (!ctx.session) return;
    
    ctx.session.videoCreation = { ...ctx.session.videoCreation, platform: platformId };
    await ctx.answerCbQuery('Platform selected!');

    await ctx.editMessageText(
      `🎬 **Create New Video**\n\n` +
      `Niche: ${ctx.session.videoCreation.niche}\n` +
      `Platform: ${platformId}\n\n` +
      `Step 3: Select duration`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '15s (0.5 credits)', callback_data: 'duration_15' },
              { text: '30s (1 credit)', callback_data: 'duration_30' },
            ],
            [
              { text: '60s (2 credits)', callback_data: 'duration_60' },
            ],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('Error handling platform selection:', error);
    await ctx.answerCbQuery('Error. Please try again.');
  }
}

/**
 * Handle duration selection and start generation
 */
export async function handleDurationSelection(ctx: BotContext, duration: number): Promise<void> {
  try {
    const user = ctx.from;
    if (!user || !ctx.session) return;

    const { niche, platform } = ctx.session.videoCreation || {};
    if (!niche || !platform) {
      await ctx.answerCbQuery('Please start over with /create');
      return;
    }

    // Check credits
    const creditCost = VideoService.getCreditCost(duration);
    const hasCredits = await UserService.hasEnoughCredits(BigInt(user.id), creditCost);

    if (!hasCredits) {
      await ctx.editMessageText(
        `❌ Insufficient credits.\n\n` +
        `Required: ${creditCost} credits\n` +
        `Use /topup to add more credits.`
      );
      return;
    }

    await ctx.answerCbQuery('Starting video generation...');

    // Deduct credits
    await UserService.deductCredits(BigInt(user.id), creditCost);

    // Create video job
    const video = await VideoService.createJob({
      userId: BigInt(user.id),
      niche,
      platform,
      duration,
      scenes: duration <= 15 ? 3 : duration <= 30 ? 5 : 8,
    });

    await ctx.editMessageText(
      `🎬 **Video Generation Started!**\n\n` +
      `Job ID: \`${video.jobId}\`\n` +
      `Niche: ${niche}\n` +
      `Platform: ${platform}\n` +
      `Duration: ${duration}s\n` +
      `Credits used: ${creditCost}\n\n` +
      `⏳ Estimated time: 2-5 minutes\n\n` +
      `You'll be notified when it's ready!`,
      { parse_mode: 'Markdown' }
    );

    // Clear session
    ctx.session.videoCreation = undefined;

    // TODO: Queue actual video generation job
    // For now, simulate completion after 10 seconds
    setTimeout(async () => {
      try {
        await VideoService.setOutput(video.jobId, {
          videoUrl: 'https://example.com/video.mp4',
          downloadUrl: 'https://example.com/video.mp4',
          thumbnailUrl: 'https://example.com/thumb.jpg',
        });
        
        // Notify user
        // await ctx.reply(`✅ Video ready! ${video.jobId}`);
      } catch (e) {
        logger.error('Error simulating video completion:', e);
      }
    }, 10000);

  } catch (error) {
    logger.error('Error handling duration selection:', error);
    await ctx.answerCbQuery('Error. Please try again.');
  }
}
