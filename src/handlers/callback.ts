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
  handleDurationSelection 
} from '@/commands/create';

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

    // Unknown callback
    logger.warn('Unknown callback:', data);
    await ctx.answerCbQuery('Unknown action');

  } catch (error) {
    logger.error('Error in callback handler:', error);
    await ctx.answerCbQuery('Error processing request');
  }
}
