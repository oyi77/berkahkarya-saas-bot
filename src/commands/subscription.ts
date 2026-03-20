import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';
import { SubscriptionService } from '@/services/subscription.service';
import {
  SUBSCRIPTION_PLANS,
  PlanKey,
  BillingCycle,
  getPlanPrice,
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

export async function subscriptionCommand(ctx: BotContext): Promise<void> {
  try {
    const user = ctx.from;
    if (!user) return;

    const telegramId = BigInt(user.id);
    const dbUser = await UserService.findByTelegramId(telegramId);
    if (!dbUser) {
      await ctx.reply('❌ Please /start first to use this feature.');
      return;
    }

    const activeSub = await SubscriptionService.getActiveSubscription(telegramId);
    const isActive = activeSub !== null && new Date(activeSub.currentPeriodEnd) > new Date();

    let statusText = '';
    if (isActive) {
      const planConfig = SUBSCRIPTION_PLANS[activeSub.plan as PlanKey];
      const daysLeft = Math.ceil(
        (new Date(activeSub.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      statusText =
        `📌 *Current Plan:* ${planConfig?.name ?? activeSub.plan} (${activeSub.billingCycle})\n` +
        `💳 Credits remaining: ${dbUser.creditBalance}\n` +
        `📅 Renews in: ${daysLeft} day${daysLeft !== 1 ? 's' : ''}\n\n`;
    } else {
      statusText = `📌 *Current Plan:* Free\n💳 Credits: ${dbUser.creditBalance}\n\n`;
    }

    const planKeys = Object.keys(SUBSCRIPTION_PLANS) as PlanKey[];
    let plansText = '*Available Plans:*\n\n';
    for (const key of planKeys) {
      const plan = SUBSCRIPTION_PLANS[key];
      plansText +=
        `*${plan.name}* — ${plan.monthlyCredits} credits/mo\n` +
        `Monthly: Rp ${formatIdr(plan.monthlyPriceIdr)} | Annual: Rp ${formatIdr(plan.annualPriceIdr)} _(Save 2 months!)_\n` +
        plan.features.map(f => `  • ${f}`).join('\n') + '\n\n';
    }

    plansText +=
      '*Enterprise* — Custom\n' +
      '• Unlimited credits & integrations\n' +
      '• Dedicated account manager';

    const planRows = planKeys.map(key => {
      const plan = SUBSCRIPTION_PLANS[key];
      return [
        { text: `${plan.name} /mo Rp ${formatIdr(plan.monthlyPriceIdr)}`, callback_data: `subscribe_${key}_monthly` },
        { text: `${plan.name} /yr Rp ${formatIdr(plan.annualPriceIdr)}`, callback_data: `subscribe_${key}_annual` },
      ];
    });

    await ctx.reply(`⭐ *Subscription Plans*\n\n${statusText}${plansText}`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          ...planRows,
          [{ text: '📞 Contact for Enterprise', url: 'https://t.me/openclaw_support' }],
          ...(isActive
            ? [[{ text: '❌ Cancel Subscription', callback_data: 'cancel_subscription' }]]
            : []),
        ],
      },
    });
  } catch (error) {
    logger.error('Error in subscription command:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

export async function handleSubscriptionPurchase(
  ctx: BotContext,
  plan: PlanKey,
  cycle: BillingCycle
): Promise<void> {
  try {
    const user = ctx.from;
    if (!user) return;

    await ctx.answerCbQuery('Creating payment...');

    const price = getPlanPrice(plan, cycle);
    const planConfig = SUBSCRIPTION_PLANS[plan];
    const telegramId = BigInt(user.id);
    const orderId = `OC-${Date.now()}-${telegramId}`;

    const signature = crypto.createHash('md5')
      .update(MERCHANT_CODE + orderId + price + API_KEY)
      .digest('hex');

    await prisma.transaction.create({
      data: {
        orderId,
        userId: telegramId,
        type: 'subscription',
        packageName: `${plan}_${cycle}`,
        amountIdr: price,
        creditsAmount: planConfig.monthlyCredits,
        gateway: 'duitku',
        status: 'pending',
      },
    });

    const response = await axios.post(
      `${DUITKU_BASE_URL}/webapi/api/merchant/v2/inquiry`,
      {
        merchantCode: MERCHANT_CODE,
        paymentAmount: price,
        paymentMethod: 'VC',
        merchantOrderId: orderId,
        productDetails: `${planConfig.name} Subscription (${cycle}) — ${planConfig.monthlyCredits} credits/mo`,
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
      `💳 *${planConfig.name} Subscription (${cycle})*\n\n` +
      `Amount: Rp ${formatIdr(price)}\n` +
      `Credits: ${planConfig.monthlyCredits}/month\n` +
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
    logger.error('Error creating subscription payment:', error);
    await ctx.editMessageText('❌ Failed to create payment. Please try again.');
  }
}

export async function handleCancelSubscription(ctx: BotContext): Promise<void> {
  try {
    const user = ctx.from;
    if (!user) return;

    await ctx.answerCbQuery('Processing...');
    await SubscriptionService.cancelSubscription(BigInt(user.id));

    await ctx.editMessageText(
      '✅ *Subscription Cancellation*\n\n' +
      'Your subscription will end at the current billing period.\n' +
      'You will keep access and credits until then.\n\n' +
      'Use /subscription to re-subscribe anytime.',
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    await ctx.editMessageText('❌ Failed to cancel. Please try again.');
  }
}
