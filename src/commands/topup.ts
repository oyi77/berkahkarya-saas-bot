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
import { SubscriptionService } from '@/services/subscription.service';
import {
  EXTRA_CREDIT_PACKAGES,
  getCreditPriceIdr,
  getExtraCreditPackagePrice,
} from '@/config/pricing';
import { prisma } from '@/config/database';
import axios from 'axios';
import crypto from 'crypto';

const formatIdr = (amount: number): string =>
  new Intl.NumberFormat('id-ID').format(amount);

const DUITKU_BASE_URL = process.env.DUITKU_ENVIRONMENT === 'production'
  ? 'https://passport.duitku.com'
  : 'https://sandbox.duitku.com';
const MERCHANT_CODE = process.env.DUITKU_MERCHANT_CODE || '';
const API_KEY = process.env.DUITKU_API_KEY || '';

// Telegram Stars pricing (1 Star ≈ $0.013 USD)
export const STARS_PACKAGES = [
  { credits: 1, stars: 15 },
  { credits: 5, stars: 70 },
  { credits: 10, stars: 130 },
  { credits: 25, stars: 300 },
] as const;

// Payment gateways are loaded dynamically from PaymentSettingsService.getEnabledGateways()
// Admin can enable/disable gateways via /admin command

/**
 * Handle /topup command
 */
export async function topupCommand(ctx: BotContext): Promise<void> {
  try {
    const user = ctx.from;
    if (!user) return;

    const telegramId = BigInt(user.id);
    const dbUser = await UserService.findByTelegramId(telegramId);
    if (!dbUser) {
      await ctx.reply('❌ Please /start first to use this feature.');
      return;
    }

    const subscribed = await SubscriptionService.isSubscribed(telegramId);
    const tier = String(dbUser.tier ?? 'free');
    const pricePerCredit = getCreditPriceIdr(tier);

    let message =
      `💰 *Top Up Credits*\n\n` +
      `Current Balance: ${dbUser.creditBalance} credits\n\n`;

    if (subscribed) {
      message += `✅ *Subscriber Pricing* — Rp ${formatIdr(pricePerCredit)}/credit\n\n`;
    } else {
      message +=
        `💲 *Standard Pricing* — Rp ${formatIdr(pricePerCredit)}/credit\n` +
        `_Subscribe to save 50%!_\n\n`;
    }

    message += '*Extra Credit Packages:*\n';
    for (const pkg of EXTRA_CREDIT_PACKAGES) {
      const price = getExtraCreditPackagePrice(pkg.credits, tier);
      message += `• ${pkg.credits} credit${pkg.credits > 1 ? 's' : ''} — Rp ${formatIdr(price)}\n`;
    }

    const extraButtons = EXTRA_CREDIT_PACKAGES.map(pkg => {
      const price = getExtraCreditPackagePrice(pkg.credits, tier);
      return [{
        text: `${pkg.credits} credit${pkg.credits > 1 ? 's' : ''} — Rp ${formatIdr(price)}`,
        callback_data: `topup_extra_${pkg.credits}`,
      }];
    });

    const upsellRow = !subscribed
      ? [[{ text: '💡 Subscribe to save 50%!', callback_data: 'open_subscription' }]]
      : [];

    const packages = PaymentService.getPackages();
    const packageButtons = packages.map(pkg => [{
      text: `${pkg.name} — Rp ${pkg.price.toLocaleString('id-ID')} (${pkg.totalCredits} credits)`,
      callback_data: `topup_pkg_${pkg.id}`,
    }]);

    message += '\n*Bulk Packages:*';

    const starsRow = [
      [{ text: '⭐ Pay with Telegram Stars', callback_data: 'topup_stars_menu' }],
    ];

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [...extraButtons, ...upsellRow, ...packageButtons, ...starsRow],
      },
    });
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

    let transaction: any;
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

export async function handleTopupExtraCredit(ctx: BotContext, credits: number): Promise<void> {
  try {
    const user = ctx.from;
    if (!user) return;

    await ctx.answerCbQuery('Creating payment...');

    const telegramId = BigInt(user.id);
    const dbUser = await UserService.findByTelegramId(telegramId);
    if (!dbUser) {
      await ctx.editMessageText('❌ User not found. Please /start first.');
      return;
    }

    const tier = String(dbUser.tier ?? 'free');
    const amount = credits * getCreditPriceIdr(tier);
    const orderId = `OC-${Date.now()}-${telegramId}`;

    const signature = crypto.createHash('md5')
      .update(MERCHANT_CODE + orderId + amount + API_KEY)
      .digest('hex');

    await prisma.transaction.create({
      data: {
        orderId,
        userId: telegramId,
        type: 'topup',
        packageName: `extra_${credits}`,
        amountIdr: amount,
        creditsAmount: credits,
        gateway: 'duitku',
        status: 'pending',
      },
    });

    const response = await axios.post(
      `${DUITKU_BASE_URL}/webapi/api/merchant/v2/inquiry`,
      {
        merchantCode: MERCHANT_CODE,
        paymentAmount: amount,
        paymentMethod: 'VC',
        merchantOrderId: orderId,
        productDetails: `Extra Credits — ${credits} credit${credits > 1 ? 's' : ''}`,
        customerVaName: user.username || user.first_name || 'Customer',
        email: 'customer@email.com',
        phoneNumber: '08123456789',
        callbackUrl: `${process.env.WEBHOOK_URL || 'http://localhost:3000'}/webhook/duitku`,
        returnUrl: `${process.env.WEBHOOK_URL || 'http://localhost:3000'}/payment/finish`,
        signature,
        expiryPeriod: 60,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const paymentUrl: string = response.data.paymentUrl;

    await ctx.editMessageText(
      `💳 *Extra Credits Payment*\n\n` +
      `Amount: Rp ${formatIdr(amount)}\n` +
      `Credits: ${credits}\n` +
      `Order: \`${orderId}\`\n\n` +
      `Click below to complete payment.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 Pay Now', url: paymentUrl }],
            [{ text: '✅ I\'ve Paid', callback_data: `check_payment_${orderId}` }],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('Error creating extra credit payment:', error);
    await ctx.editMessageText('❌ Failed to create payment. Please try again.');
  }
}

/**
 * Show Telegram Stars package selection menu
 */
export async function handleStarsMenu(ctx: BotContext): Promise<void> {
  try {
    await ctx.answerCbQuery();

    const buttons = STARS_PACKAGES.map(pkg => [{
      text: `${pkg.credits} credit${pkg.credits > 1 ? 's' : ''} — ${pkg.stars} ⭐`,
      callback_data: `topup_stars_${pkg.credits}`,
    }]);

    buttons.push([{ text: '◀️ Back', callback_data: 'topup' }]);

    await ctx.editMessageText(
      `⭐ *Pay with Telegram Stars*\n\n` +
      `Select a package:\n\n` +
      STARS_PACKAGES.map(pkg =>
        `• ${pkg.credits} credit${pkg.credits > 1 ? 's' : ''} = ${pkg.stars} Stars`
      ).join('\n') +
      `\n\n_Stars are Telegram's native currency. Pay instantly from your Stars balance._`,
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons },
      }
    );
  } catch (error) {
    logger.error('Error showing stars menu:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

/**
 * Send Telegram Stars invoice for a specific credit package
 */
export async function handleStarsInvoice(ctx: BotContext, credits: number): Promise<void> {
  try {
    await ctx.answerCbQuery('Creating invoice...');

    const pkg = STARS_PACKAGES.find(p => p.credits === credits);
    if (!pkg) {
      await ctx.reply('❌ Invalid package.');
      return;
    }

    const userId = ctx.from?.id;
    if (!userId) return;

    await (ctx as any).replyWithInvoice({
      title: 'Video Credits',
      description: `${pkg.credits} AI Video Generation Credit${pkg.credits > 1 ? 's' : ''} for @berkahkarya_saas_bot`,
      payload: `stars_${pkg.credits}_${userId}`,
      currency: 'XTR',
      prices: [{ label: `${pkg.credits} Credit${pkg.credits > 1 ? 's' : ''}`, amount: pkg.stars }],
      provider_token: '',
    });
  } catch (error) {
    logger.error('Error sending stars invoice:', error);
    await ctx.reply('❌ Failed to create Stars invoice. Please try again.');
  }
}
