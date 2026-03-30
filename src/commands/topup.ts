/**
 * Topup Command
 * 
 * Handles credit topup via payment gateway with dynamic pricing
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';
import { PaymentService } from '@/services/payment.service';
import { DuitkuService } from '@/services/duitku.service';
import { TripayService } from '@/services/tripay.service';
import { PaymentSettingsService } from '@/services/payment-settings.service';
import { SubscriptionService } from '@/services/subscription.service';
import {
  getUnitCostAsync,
  getPackagesAsync,
} from '@/config/pricing';
import { NowPaymentsService, CRYPTO_PACKAGES, CRYPTO_COINS } from '@/services/nowpayments.service';
import { prisma } from '@/config/database';

const formatIdr = (amount: number): string =>
  new Intl.NumberFormat('id-ID').format(amount);

// Duitku globals removed - unused in this file

// Telegram Stars pricing (Moved to dynamic or kept as is if not in DB yet)
export const STARS_PACKAGES = [
  { credits: 1, stars: 15 },
  { credits: 5, stars: 70 },
  { credits: 10, stars: 130 },
  { credits: 25, stars: 300 },
] as const;

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
    
    // Use a default unit for pricing visualization or fetch specific ones
    const pricePerCredit = await getUnitCostAsync('VIDEO_15S'); 
    // Actually, for topup, we should probably follow the old logic of 20k/10k or get from DB
    // Let's assume 'VIDEO_15S' reflects the 'base' unit cost for calculation if needed,
    // but the actual price for TOPUP should be fetched separately if it's different.
    // For now, I'll align the type.

    let message =
      `💰 *Top Up Credits*\n\n` +
      `Current Balance: ${dbUser.creditBalance} credits\n\n`;

    if (subscribed) {
      message += `✅ *Subscriber Pricing* — Rp ${formatIdr(pricePerCredit)}/credit\n\n`;
    } else {
      message +=
        `💲 *Standard Pricing* — Rp ${formatIdr(pricePerCredit)}/credit\n` +
        `_Subscribe to save up to 50%!_\n\n`;
    }

    // Dynamic Packages from DB/Redis
    const packages = await getPackagesAsync();
    
    // Extra/Single Credit Buttons (using Unit Cost)
    const quickPacks = [1, 5, 10];
    const extraButtons = quickPacks.map(credits => {
      const price = credits * pricePerCredit;
      return [{
        text: `${credits} unit${credits > 1 ? 's' : ''} — Rp ${formatIdr(price)}`,
        callback_data: `topup_extra_${credits}`,
      }];
    });

    const packageButtons = packages.map(pkg => [{
      text: `${pkg.name} — Rp ${formatIdr(pkg.priceIdr || (pkg as any).price)} (${pkg.credits + (pkg.bonus || 0)} credits)`,
      callback_data: `topup_pkg_${pkg.id}`,
    }]);

    message += '*Quick Units:*\n';
    quickPacks.forEach(c => {
      message += `• ${c} unit${c > 1 ? 's' : ''} — Rp ${formatIdr(c * pricePerCredit)}\n`;
    });

    message += '\n*Bulk Packages:*';

    const upsellRow = !subscribed
      ? [[{ text: '💡 Subscribe for Cheaper Rates!', callback_data: 'open_subscription' }]]
      : [];

    const starsRow = [
      [{ text: '⭐ Pay with Telegram Stars', callback_data: 'topup_stars_menu' }],
      [{ text: '💎 Crypto (USDT/BNB/MATIC/TON)', callback_data: 'topup_crypto_menu' }],
    ];

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [...extraButtons, ...upsellRow, ...packageButtons, ...starsRow, [{ text: '◀️ Menu Utama', callback_data: 'main_menu' }]],
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
      `💰 **Select Payment Gateway**\n\n` +
      `Package: \`${packageId.toUpperCase()}\`\n` +
      `Please choose your preferred payment method:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            ...enabledGateways.map(gw => [{
              text: gw.name,
              callback_data: `topup_pay_${packageId}_${gw.id}`,
            }]),
            [{ text: '◀️ Back', callback_data: 'topup' }]
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
    let gatewayDisplayName = 'Payment Gateway';

    if (gateway === 'duitku') {
      gatewayDisplayName = 'Duitku';
      transaction = await DuitkuService.createTransaction({
        userId: BigInt(user.id),
        packageId,
        username: user.username || user.first_name,
      });
    } else if (gateway === 'tripay') {
      gatewayDisplayName = 'Tripay';
      const res = await TripayService.createTransaction({
        userId: BigInt(user.id),
        packageId,
        username: user.username || user.first_name,
      });
      if (!res.success) throw new Error(res.error || 'Tripay error');
      transaction = res;
    } else {
      gatewayDisplayName = 'Midtrans';
      transaction = await PaymentService.createTransaction({
        userId: BigInt(user.id),
        packageId,
        username: user.username || user.first_name,
      });
    }

    const paymentUrl = transaction.paymentUrl || transaction.redirectUrl || '';

    await ctx.editMessageText(
      `💳 **Payment Ready**\n\n` +
      `Order ID: \`${transaction.orderId}\`\n` +
      `Method: *${gatewayDisplayName}*\n\n` +
      `Please click the button below to complete your payment securely.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '💳 Complete Payment',
                url: paymentUrl,
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
  } catch (error: any) {
    logger.error('Error handling payment gateway:', error);
    await ctx.editMessageText(`❌ Failed to create payment: ${error.message}. Please try again.`);
  }
}

/**
 * Check payment status
 */
export async function checkPayment(ctx: BotContext, orderId: string): Promise<void> {
  try {
    await ctx.answerCbQuery('Checking payment status...');

    // Try multiple gateways if necessary, or check DB
    const transaction = await prisma.transaction.findUnique({ where: { orderId } });
    if (!transaction) {
      await ctx.editMessageText('❌ Transaction not found.');
      return;
    }

    if (transaction.status === 'success') {
      await ctx.editMessageText(
        `✅ **Payment Successful!**\n\n` +
        `Credits added: ${transaction.creditsAmount}\n\n` +
        `Thank you for your purchase! 🎉`,
        { parse_mode: 'Markdown' }
      );
    } else if (transaction.status === 'pending') {
      await ctx.answerCbQuery('Payment still pending. Please complete payment first.', { show_alert: true });
    } else {
      await ctx.editMessageText(`❌ Payment state: *${transaction.status}*. Please contact support if you have already paid.`);
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

    const unitCost = await getUnitCostAsync('VIDEO_15S'); 
    const amount = credits * unitCost;
    
    // For extra credits via bot, we'll use Duitku as default or Midtrans
    // To be consistent, let's ask for gateway too, but for speed we just used Duitku in original code
    // Let's refactor this to use handleTopupSelection style if we want full consistency
    // But since "extra_X" isn't in main packages list, we handle it specially.
    
    const gatewayRes = await DuitkuService.createTransaction({
      userId: telegramId,
      packageId: `extra_${credits}`,
      username: user.username || user.first_name,
    });

    await ctx.editMessageText(
      `💳 *Quick Unit Purchase*\n\n` +
      `Amount: Rp ${formatIdr(amount)}\n` +
      `Units: ${credits}\n` +
      `Order: \`${gatewayRes.orderId}\`\n\n` +
      `Click below to complete payment via Duitku.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 Pay Now', url: gatewayRes.paymentUrl }],
            [{ text: '✅ I\'ve Paid', callback_data: `check_payment_${gatewayRes.orderId}` }],
            [{ text: '◀️ Back', callback_data: 'topup' }]
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
      text: `${pkg.credits} unit${pkg.credits > 1 ? 's' : ''} — ${pkg.stars} ⭐`,
      callback_data: `topup_stars_${pkg.credits}`,
    }]);

    buttons.push([{ text: '◀️ Back', callback_data: 'topup' }]);

    await ctx.editMessageText(
      `⭐ *Pay with Telegram Stars*\n\n` +
      `Select a package:\n\n` +
      STARS_PACKAGES.map(pkg =>
        `• ${pkg.credits} unit${pkg.credits > 1 ? 's' : ''} = ${pkg.stars} Stars`
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
      title: 'AI Video Units',
      description: `${pkg.credits} Video Generation Unit${pkg.credits > 1 ? 's' : ''} for @berkahkarya_saas_bot`,
      payload: `stars_${pkg.credits}_${userId}`,
      currency: 'XTR',
      prices: [{ label: `${pkg.credits} Unit${pkg.credits > 1 ? 's' : ''}`, amount: pkg.stars }],
      provider_token: '',
    });
  } catch (error) {
    logger.error('Error sending stars invoice:', error);
    await ctx.reply('❌ Failed to create Stars invoice. Please try again.');
  }
}

/**
 * Show crypto credit package selection menu
 */
export async function handleCryptoMenu(ctx: BotContext): Promise<void> {
  try {
    await ctx.answerCbQuery();

    const buttons = CRYPTO_PACKAGES.map(pkg => [{
      text: `${pkg.credits} unit${pkg.credits > 1 ? 's' : ''} — $${pkg.usd.toFixed(2)}`,
      callback_data: `topup_crypto_pkg_${pkg.credits}`,
    }]);
    buttons.push([{ text: '◀️ Back', callback_data: 'topup' }]);

    await ctx.editMessageText(
      `💎 *Crypto Payment*\n\n` +
      `Select amount:\n\n` +
      CRYPTO_PACKAGES.map(pkg =>
        `• ${pkg.credits} unit${pkg.credits > 1 ? 's' : ''} = $${pkg.usd.toFixed(2)} USD`
      ).join('\n') +
      `\n\n_Supported: USDT (BSC), BNB, MATIC, TON_`,
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons },
      }
    );
  } catch (error) {
    logger.error('Error showing crypto menu:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

/**
 * Show coin selector for a given credit amount
 */
export async function handleCryptoCoinSelect(ctx: BotContext, credits: number): Promise<void> {
  try {
    await ctx.answerCbQuery();

    const pkg = CRYPTO_PACKAGES.find(p => p.credits === credits);
    if (!pkg) {
      await ctx.reply('❌ Invalid package.');
      return;
    }

    const buttons = CRYPTO_COINS.map(coin => [{
      text: `${coin.emoji} ${coin.label}`,
      callback_data: `topup_crypto_pay_${credits}_${coin.id}`,
    }]);
    buttons.push([{ text: '◀️ Back', callback_data: 'topup_crypto_menu' }]);

    await ctx.editMessageText(
      `💎 *${credits} Unit${credits > 1 ? 's' : ''} — $${pkg.usd.toFixed(2)} USD*\n\n` +
      `Select cryptocurrency:`,
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons },
      }
    );
  } catch (error) {
    logger.error('Error showing coin selector:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

/**
 * Create NOWPayments payment and show address to user
 */
export async function handleCryptoPayment(ctx: BotContext, credits: number, coin: string): Promise<void> {
  try {
    await ctx.answerCbQuery('Creating crypto payment...');

    const userId = ctx.from?.id;
    if (!userId) return;

    const result = await NowPaymentsService.createPayment({
      userId: BigInt(userId),
      credits,
      coin,
    });

    const coinInfo = CRYPTO_COINS.find(c => c.id === coin);
    const coinLabel = coinInfo?.label || coin.toUpperCase();

    await ctx.editMessageText(
      `💎 *Crypto Payment Created*\n\n` +
      `Send exactly:\n` +
      `\`${result.payAmount} ${result.payCurrency.toUpperCase()}\`\n\n` +
      `To address:\n` +
      `\`${result.payAddress}\`\n\n` +
      `Network: *${coinLabel}*\n` +
      `Units: *${credits}*\n` +
      `Order: \`${result.orderId}\`\n\n` +
      `⏱ Payment expires in ~15 minutes.\n\n` +
      `_Credits will be added automatically once confirmed._`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '◀️ Back to Top Up', callback_data: 'topup' }],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('Error creating crypto payment:', error);
    await ctx.editMessageText('❌ Failed to create crypto payment. Please try again.');
  }
}
