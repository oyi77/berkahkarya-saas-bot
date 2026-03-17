/**
 * Topup Command
 * 
 * Handles credit topup via payment gateway
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';
import { PaymentService } from '@/services/payment.service';
import { DuitkuService } from '@/services/duitku.service';
import { PaymentSettingsService } from '@/services/payment-settings.service';

// Available payment gateways
const GATEWAYS = [
  { id: 'midtrans', name: '💳 Midtrans', description: 'Credit Card, GOPAY, etc' },
  { id: 'duitku', name: '🏦 Duitku (VA)', description: 'Bank Transfer, E-Wallet' },
  { id: 'tripay', name: '🔷 Tripay', description: 'Various Payment Methods' },
];

/**
 * Handle /topup command
 */
export async function topupCommand(ctx: BotContext): Promise<void> {
  try {
    const user = ctx.from;
    if (!user) return;

    const dbUser = await UserService.findByTelegramId(BigInt(user.id));
    if (!dbUser) {
      await ctx.reply('❌ Please /start first to use this feature.');
      return;
    }

    const packages = PaymentService.getPackages();

    await ctx.reply(
      `💰 **Top Up Credits**\n\n` +
      `Current Balance: ${dbUser.creditBalance} credits\n\n` +
      `Select a package:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: packages.map(pkg => [
            {
              text: `${pkg.name} - Rp ${pkg.price.toLocaleString('id-ID')} (${pkg.totalCredits} credits)`,
              callback_data: `topup_pkg_${pkg.id}`,
            },
          ]),
        },
      }
    );
  } catch (error) {
    logger.error('Error in topup command:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

/**
 * Handle topup package selection - ask for gateway
 */
export async function handleTopupSelection(ctx: BotContext, packageId: string): Promise<void> {
  try {
    const user = ctx.from;
    if (!user) return;

    await ctx.answerCbQuery('Processing...');

    const defaultGateway = await PaymentSettingsService.getDefaultGateway();
    const enabledGateways = await PaymentSettingsService.getEnabledGateways();

    if (enabledGateways.length === 1) {
      await handlePaymentGateway(ctx, packageId, enabledGateways[0].id);
      return;
    }

    await ctx.editMessageText(
      `💰 **Select Package: ${packageId.toUpperCase()}**\n\n` +
      `Now select payment gateway:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            ...enabledGateways.map(gw => [{
              text: gw.name,
              callback_data: `topup_pay_${packageId}_${gw.id}`,
            }]),
          ],
        },
      }
    );
  } catch (error) {
    logger.error('Error handling topup selection:', error);
    await ctx.editMessageText('❌ Failed to process. Please try again.');
  }
}

/**
 * Handle payment gateway selection and create transaction
 */
export async function handlePaymentGateway(ctx: BotContext, packageId: string, gateway: string): Promise<void> {
  try {
    const user = ctx.from;
    if (!user) return;

    await ctx.answerCbQuery('Creating payment...');

    let transaction;
    const gatewayName = gateway === 'duitku' ? 'Duitku' : 'Midtrans';

    if (gateway === 'duitku') {
      // Use Duitku
      transaction = await DuitkuService.createTransaction({
        userId: BigInt(user.id),
        packageId,
        username: user.username || user.first_name,
      });
    } else {
      // Use Midtrans (default)
      transaction = await PaymentService.createTransaction({
        userId: BigInt(user.id),
        packageId,
        username: user.username || user.first_name,
      });
    }

    await ctx.editMessageText(
      `💳 **Payment Ready**\n\n` +
      `Order ID: \`${transaction.orderId}\`\n\n` +
      `Payment via: ${gatewayName}\n\n` +
      `Click the button below to complete payment.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '💳 Pay Now',
                url: transaction.paymentUrl || transaction.redirectUrl || '',
              },
            ],
            [
              {
                text: '✅ I\'ve Paid',
                callback_data: `check_payment_${transaction.orderId}`,
              },
            ],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('Error handling payment gateway:', error);
    await ctx.editMessageText('❌ Failed to create payment. Please try again.');
  }
}

/**
 * Check payment status
 */
export async function checkPayment(ctx: BotContext, orderId: string): Promise<void> {
  try {
    await ctx.answerCbQuery('Checking payment status...');

    const status = await PaymentService.getTransactionStatus(orderId);

    if (!status) {
      await ctx.editMessageText('❌ Transaction not found.');
      return;
    }

    if (status.status === 'success') {
      await ctx.editMessageText(
        `✅ **Payment Successful!**\n\n` +
        `Credits added: ${status.credits}\n\n` +
        `Thank you for your purchase! 🎉`,
        { parse_mode: 'Markdown' }
      );
    } else if (status.status === 'pending') {
      await ctx.answerCbQuery('Payment still pending. Please complete payment first.', { show_alert: true });
    } else {
      await ctx.editMessageText(`❌ Payment ${status.status}. Please try again.`);
    }
  } catch (error) {
    logger.error('Error checking payment:', error);
    await ctx.answerCbQuery('Failed to check status. Please try again.');
  }
}
