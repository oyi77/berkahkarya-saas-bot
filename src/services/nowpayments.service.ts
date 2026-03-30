/**
 * NOWPayments Service
 *
 * Handles crypto payment creation and webhook processing via NOWPayments API.
 * Supports USDT (BSC), BNB, MATIC, TON.
 */

import axios from 'axios';
import { prisma } from '@/config/database';
import { getSubscriptionPlansAsync } from '@/config/pricing';
import { ReferralService } from '@/services/referral.service';
import { logger } from '@/utils/logger';

const BASE_URL = 'https://api.nowpayments.io/v1';
const API_KEY = process.env.NOWPAYMENTS_API_KEY || '';

// USD pricing per credit package
// Note: NOWPayments minimum is ~$19 USD, so all packages must meet this threshold
export const CRYPTO_PACKAGES = [
  { credits: 10,  usd: 20.00 },  // ~Rp 320K — Starter crypto
  { credits: 30,  usd: 50.00 },  // ~Rp 800K — Growth crypto
  { credits: 75,  usd: 100.00 }, // ~Rp 1.6M — Scale crypto
  { credits: 200, usd: 250.00 }, // ~Rp 4M   — Enterprise crypto
] as const;

export const CRYPTO_COINS = [
  { id: 'usdtbsc', label: 'USDT (BSC)', emoji: '💵' },
  { id: 'bnbbsc', label: 'BNB (BSC)', emoji: '🔶' },
  { id: 'matic', label: 'MATIC (Polygon)', emoji: '🟣' },
  { id: 'ton', label: 'TON', emoji: '💎' },
] as const;

export interface NowPaymentResult {
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  expirationEstimate: string;
  orderId: string;
}

export class NowPaymentsService {
  /**
   * Create a crypto payment via NOWPayments API
   */
  static async createPayment(params: {
    userId: bigint;
    credits: number;
    coin: string;
  }): Promise<NowPaymentResult> {
    const pkg = CRYPTO_PACKAGES.find(p => p.credits === params.credits);
    if (!pkg) throw new Error('Invalid credit package');

    const validCoin = CRYPTO_COINS.find(c => c.id === params.coin);
    if (!validCoin) throw new Error('Invalid coin');

    const orderId = `CRYPTO-${Date.now()}-${params.userId}`;

    // Create payment on NOWPayments
    const response = await axios.post(
      `${BASE_URL}/payment`,
      {
        price_amount: pkg.usd,
        price_currency: 'usd',
        pay_currency: params.coin,
        order_id: orderId,
        order_description: `${params.credits} credits for @berkahkarya_saas_bot`,
        ipn_callback_url: `${process.env.WEBHOOK_URL || 'http://localhost:3000'}/webhook/nowpayments`,
      },
      {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;

    // Record pending transaction in DB
    await prisma.transaction.create({
      data: {
        orderId,
        userId: params.userId,
        type: 'topup',
        packageName: `crypto_${params.credits}`,
        amountIdr: 0,
        creditsAmount: params.credits,
        gateway: 'nowpayments',
        status: 'pending',
        gatewayTransactionId: String(data.payment_id),
        metadata: {
          coin: params.coin,
          payAddress: data.pay_address,
          payAmount: data.pay_amount,
          priceUsd: pkg.usd,
        },
      },
    });

    return {
      paymentId: String(data.payment_id),
      payAddress: data.pay_address,
      payAmount: data.pay_amount,
      payCurrency: data.pay_currency,
      expirationEstimate: data.expiration_estimate_date,
      orderId,
    };
  }

  /**
   * Handle NOWPayments IPN webhook callback
   */
  static async handleWebhook(body: any): Promise<{ success: boolean; message: string }> {
    const { payment_status, order_id, payment_id } = body;

    logger.info(`NOWPayments webhook: order=${order_id} status=${payment_status} payment_id=${payment_id}`);

    if (!order_id) {
      return { success: false, message: 'Missing order_id' };
    }

    const transaction = await prisma.transaction.findUnique({
      where: { orderId: order_id },
    });

    if (!transaction) {
      logger.warn(`NOWPayments webhook: transaction not found for order ${order_id}`);
      return { success: false, message: 'Transaction not found' };
    }

    if (payment_status === 'finished' || payment_status === 'confirmed') {
      // Atomic guard: only one concurrent webhook wins this update
      const updateResult = await prisma.transaction.updateMany({
        where: { orderId: order_id, status: { not: 'success' } },
        data: {
          status: 'success',
          paidAt: new Date(),
          gatewayTransactionId: String(payment_id),
        },
      });

      if (updateResult.count === 0) {
        return { success: true, message: 'Already processed' };
      }

      const credits = Number(transaction.creditsAmount);

      // Determine and update user tier
      let newTier = 'free';
      const plans = await getSubscriptionPlansAsync();
      const plan = plans[transaction.packageName];
      if (plan && plan.tier) {
        newTier = plan.tier;
      }
      await prisma.user.update({
        where: { telegramId: transaction.userId },
        data: {
          creditBalance: { increment: credits },
          tier: newTier as any,
        },
      });

      // Process referral commissions — read USD amount from metadata
      const meta = transaction.metadata as any;
      const amountUsd = meta?.priceUsd ? Number(meta.priceUsd) : 0;
      if (amountUsd > 0) {
        try {
          await ReferralService.processCommissions(order_id, amountUsd, transaction.userId);
        } catch (refErr) {
          logger.warn('NOWPayments: referral commission error (non-fatal):', refErr);
        }
      }

      logger.info(`NOWPayments: ${credits} credits added for user ${transaction.userId} (order ${order_id})`);
      return { success: true, message: 'Credits added' };
    }

    if (payment_status === 'failed' || payment_status === 'expired' || payment_status === 'refunded') {
      await prisma.transaction.update({
        where: { orderId: order_id },
        data: { status: 'failed' },
      });
      return { success: true, message: `Payment ${payment_status}` };
    }

    // Other statuses (waiting, confirming, sending) — just log
    logger.info(`NOWPayments: intermediate status ${payment_status} for order ${order_id}`);
    return { success: true, message: 'Status noted' };
  }
}
