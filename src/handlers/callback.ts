/**
 * Callback Handler
 * 
 * Handles all callback queries (inline button clicks)
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { handleTopupSelection, checkPayment } from '@/commands/topup';
import { 
  handleNicheSelection, 
  handlePlatformSelection, 
  handleDurationSelection,
  createCommand 
} from '@/commands/create';
import { videosCommand } from '@/commands/videos';
import { VideoService } from '@/services/video.service';

/**
 * Handle storyboard selection
 */
async function handleStoryboardRequest(ctx: BotContext, niche: string) {
  try {
    const storyboard = VideoService.generateStoryboard({ 
      niche, 
      duration: 30 
    });

    let message = `📋 *Storyboard: ${niche.toUpperCase()}*\n\n`;
    
    storyboard.scenes.forEach(s => {
      message += `🎬 *Scene ${s.scene} (${s.duration}s)*\n`;
      message += `Type: ${s.type}\n`;
      message += `Desc: ${s.description}\n\n`;
    });

    message += `📝 *Caption:*\n_${storyboard.caption}_\n\n`;
    message += `💰 *Cost: 1.0 Credits*`;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Create Video Now', callback_data: `confirm_create_${niche}` }],
          [{ text: '◀️ Back to Selection', callback_data: 'storyboard_create' }],
        ]
      }
    });
  } catch (error) {
    logger.error('Storyboard error:', error);
    await ctx.answerCbQuery('Error generating storyboard');
  }
}

/**
 * Handle callback queries
 */
export async function callbackHandler(ctx: BotContext): Promise<void> {
  try {
    const callbackQuery = ctx.callbackQuery;
    
    if (!callbackQuery || !('data' in callbackQuery)) {
      return;
    }

    const data = callbackQuery.data;

    logger.debug('Callback received:', { userId: ctx.from?.id, data });

    // Route to appropriate handler based on callback data prefix

    // Topup handlers
    if (data.startsWith('topup_')) {
      const packageId = data.replace('topup_', '');
      await handleTopupSelection(ctx, packageId);
      return;
    }

    if (data.startsWith('check_payment_')) {
      const orderId = data.replace('check_payment_', '');
      await checkPayment(ctx, orderId);
      return;
    }

    // Video creation handlers
    if (data.startsWith('niche_')) {
      const nicheId = data.replace('niche_', '');
      await handleNicheSelection(ctx, nicheId);
      return;
    }

    if (data.startsWith('platform_')) {
      const platformId = data.replace('platform_', '');
      await handlePlatformSelection(ctx, platformId);
      return;
    }

    if (data.startsWith('duration_')) {
      const duration = parseInt(data.replace('duration_', ''), 10);
      await handleDurationSelection(ctx, duration);
      return;
    }

    // Brief skip
    if (data === 'brief_skip') {
      await ctx.editMessageText(
        '⏭️ Brief skipped\n\n' +
        '✅ Confirm video creation:\n\n' +
        'Estimated credits: 1.0\n\n' +
        'Proceed?',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Yes, Create!', callback_data: 'confirm_create' },
                { text: '❌ Cancel', callback_data: 'cancel_create' },
              ],
            ],
          },
        }
      );
      return;
    }

    if (data === 'confirm_create') {
      await ctx.editMessageText(
        '🎬 Creating your video...\n\n' +
        '⏳ Estimated time: 2-5 minutes\n\n' +
        'You will be notified when it\'s ready!'
      );
      ctx.session.state = 'CREATE_VIDEO_PROCESSING';
      return;
    }

    if (data === 'cancel_create') {
      await ctx.editMessageText(
        '❌ Video creation cancelled.\n\n' +
        'Use /create to start again.'
      );
      ctx.session.state = 'DASHBOARD';
      return;
    }

    // Payment method handlers (placeholder - will use Midtrans)
    if (data.startsWith('payment_')) {
      const [_, method, packageId] = data.split('_');
      
      await ctx.editMessageText(
        `💳 Processing ${method} payment...\n\n` +
        'In sandbox mode - this would redirect to Midtrans payment page.',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Simulate Success', callback_data: `simulate_success_${packageId}` },
              ],
            ],
          },
        }
      );
      return;
    }

    if (data.startsWith('simulate_success_')) {
      const packageId = data.replace('simulate_success_', '');
      
      const credits: Record<string, number> = {
        starter: 6,
        growth: 18,
        scale: 75,
        enterprise: 260,
      };

      await ctx.editMessageText(
        `✅ Payment Successful! (Simulated)\n\n` +
        `Credits added: ${credits[packageId] || 0}\n\n` +
        'Thank you for your purchase! 🎉'
      );
      return;
    }

    // Share referral
    if (data === 'share_referral') {
      await ctx.answerCbQuery('Share feature coming soon!');
      return;
    }

    // Create video - redirect to /create flow
    if (data === 'create_video') {
      await ctx.deleteMessage().catch(() => {});
      await createCommand(ctx);
      return;
    }

    // Image generation handlers
    if (data === 'image_generate') {
      await ctx.editMessageText(
        '🖼️ *Image Generation*\n\n' +
        'Select workflow:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛍️ Product Photo', callback_data: 'img_product' }],
              [{ text: '🍔 F&B Food', callback_data: 'img_fnb' }],
              [{ text: '🏠 Real Estate', callback_data: 'img_realestate' }],
              [{ text: '🚗 Car/Automotive', callback_data: 'img_car' }],
              [{ text: '◀️ Back to Menu', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    // Clone/Remake Video
    if (data === 'clone_video') {
      await ctx.editMessageText(
        '🔄 *Clone/Remake Video*\n\n' +
        'Send me a video to recreate with similar style.\n\n' +
        'Or paste a video URL from:\n' +
        '• TikTok\n' +
        '• Instagram Reels\n' +
        '• YouTube Shorts',
        { parse_mode: 'Markdown' }
      );
      ctx.session.state = 'CLONE_VIDEO_WAITING';
      return;
    }

    // Clone/Remake Image
    if (data === 'clone_image') {
      await ctx.editMessageText(
        '🔄 *Clone/Remake Image*\n\n' +
        'Send me an image to recreate with similar style.\n\n' +
        'I\'ll analyze the image and generate a similar one.',
        { parse_mode: 'Markdown' }
      );
      ctx.session.state = 'CLONE_IMAGE_WAITING';
      return;
    }

    // Storyboard Creator
    if (data === 'storyboard_create') {
      await ctx.editMessageText(
        '📋 *Storyboard Creator*\n\n' +
        'I\'ll help you create a video storyboard.\n\n' +
        'Select your content type:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛍️ Product Promo', callback_data: 'sb_product' }],
              [{ text: '🍔 F&B Content', callback_data: 'sb_fnb' }],
              [{ text: '🏠 Real Estate Tour', callback_data: 'sb_realestate' }],
              [{ text: '🚗 Car Showcase', callback_data: 'sb_car' }],
              [{ text: '◀️ Back to Menu', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    if (data === 'sb_product') return handleStoryboardRequest(ctx, 'product');
    if (data === 'sb_fnb') return handleStoryboardRequest(ctx, 'fnb');
    if (data === 'sb_realestate') return handleStoryboardRequest(ctx, 'realestate');
    if (data === 'sb_car') return handleStoryboardRequest(ctx, 'car');

    // Viral/Trend Research
    if (data === 'viral_research') {
      await ctx.editMessageText(
        '📈 *Viral/Trend Research*\n\n' +
        'Analyzing trending content across platforms...\n\n' +
        'Select niche to discover what\'s working:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔥 All Trends (Viral)', callback_data: 'trend_viral' }],
              [{ text: '🍔 F&B / Restaurant', callback_data: 'trend_fnb' }],
              [{ text: '🏠 Real Estate', callback_data: 'trend_realestate' }],
              [{ text: '🛍️ E-commerce', callback_data: 'trend_ecom' }],
              [{ text: '◀️ Back to Menu', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    if (data.startsWith('trend_')) {
      const niche = data.replace('trend_', '');
      await ctx.editMessageText(
        `📈 *Viral Research: ${niche.toUpperCase()}*\n\n` +
        `✅ Analysis complete.\n\n` +
        `*Trending Patterns:* \n` +
        `• Quick cuts, beat-matching\n` +
        `• ASMR audio layer\n` +
        `• Text-to-speech overlay (Female voice)\n\n` +
        `*Suggested Storyboard:*`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Generate Viral Storyboard', callback_data: `sb_${niche === 'viral' ? 'product' : (niche === 'ecom' ? 'product' : niche)}` }],
              [{ text: '◀️ Back', callback_data: 'viral_research' }],
            ],
          },
        }
      );
      return;
    }

    // Video/Image to Prompt (Disassemble)
    if (data === 'disassemble') {
      await ctx.editMessageText(
        '🔍 *Video/Image to Prompt*\n\n' +
        'I\'ll analyze your media and extract the prompt used to create it.\n\n' +
        'Send me a video or image:',
        { parse_mode: 'Markdown' }
      );
      ctx.session.state = 'DISASSEMBLE_WAITING';
      return;
    }

    // Main menu
    if (data === 'main_menu') {
      await ctx.editMessageText(
        '🎬 *OpenClaw Video Studio*\n\n' +
        'What would you like to do?',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎬 Create Video', callback_data: 'create_video' }],
              [{ text: '🖼️ Generate Image', callback_data: 'image_generate' }],
              [{ text: '🔄 Clone Video', callback_data: 'clone_video' }],
              [{ text: '📋 Storyboard Creator', callback_data: 'storyboard_create' }],
              [{ text: '🔄 Clone Image', callback_data: 'clone_image' }],
              [{ text: '📈 Viral Research', callback_data: 'viral_research' }],
              [{ text: '🔍 Disassemble Prompt', callback_data: 'disassemble' }],
            ],
          },
        }
      );
      return;
    }

    // Videos menu handlers
    if (data === 'videos_favorites') {
      await ctx.editMessageText(
        '⭐ *Favorite Videos*\n\n' +
        'Your favorite videos will appear here.\n\n' +
        'No favorites yet.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Back', callback_data: 'videos_back' }],
            ],
          },
        }
      );
      return;
    }

    if (data === 'videos_trash') {
      await ctx.editMessageText(
        '🗑️ *Trash*\n\n' +
        'Deleted videos (restorable for 7 days).\n\n' +
        'Trash is empty.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Back', callback_data: 'videos_back' }],
            ],
          },
        }
      );
      return;
    }

    if (data === 'videos_back') {
      await videosCommand(ctx);
      return;
    }

    // Unknown callback
    logger.warn('Unknown callback:', data);
    await ctx.answerCbQuery('Unknown action');

  } catch (error) {
    logger.error('Error in callback handler:', error);
    await ctx.answerCbQuery('Error processing request');
  }
}
