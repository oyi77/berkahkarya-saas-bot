/**
 * Handlers Module
 *
 * Registers all event handlers
 */

import { Telegraf } from 'telegraf';
import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';
import { prisma } from '@/config/database';
import { STARS_PACKAGES } from '@/commands/topup';

// Import handlers
import { messageHandler } from './message';
import { callbackHandler } from './callback';
import { errorHandler } from './error';

/**
 * Setup all event handlers
 */
export function setupHandlers(bot: Telegraf<BotContext>): void {
  logger.info('Registering event handlers...');

  // Telegram Stars: answer pre-checkout query
  bot.on('pre_checkout_query', async (ctx) => {
    try {
      await ctx.answerPreCheckoutQuery(true);
    } catch (error) {
      logger.error('Error answering pre_checkout_query:', error);
    }
  });

  // Telegram Stars: handle successful payment
  bot.on('successful_payment', async (ctx) => {
    try {
      const payment = (ctx.message as any).successful_payment;
      if (!payment) return;

      const payload = payment.invoice_payload as string;
      if (!payload.startsWith('stars_')) return;

      const parts = payload.split('_');
      const credits = parseInt(parts[1], 10);
      const userId = BigInt(parts[2]);

      const pkg = STARS_PACKAGES.find(p => p.credits === credits);
      if (!pkg) {
        logger.error(`Stars payment: invalid credits ${credits} in payload ${payload}`);
        return;
      }

      // Record transaction
      const orderId = `STARS-${Date.now()}-${userId}`;
      await prisma.transaction.create({
        data: {
          orderId,
          userId,
          type: 'topup',
          packageName: `stars_${credits}`,
          amountIdr: 0,
          creditsAmount: credits,
          gateway: 'stars',
          status: 'success',
          gatewayTransactionId: payment.telegram_payment_charge_id || null,
          paidAt: new Date(),
        },
      });

      // Add credits
      await UserService.addCredits(userId, credits);

      logger.info(`Stars payment success: ${credits} credits for user ${userId}`);

      await ctx.reply(
        `✅ *Payment Successful!*\n\n` +
        `${credits} credit${credits > 1 ? 's' : ''} added to your account.\n` +
        `Paid: ${pkg.stars} ⭐ Telegram Stars\n\n` +
        `Thank you for your purchase! 🎉`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      logger.error('Error handling successful_payment:', error);
      await ctx.reply('❌ Payment received but failed to add credits. Please contact support.');
    }
  });

  // Message handler
  bot.on('message', messageHandler);

  // Callback query handler
  bot.on('callback_query', callbackHandler);

  // Error handler
  bot.catch(errorHandler);

  logger.info('Event handlers registered successfully');
}
