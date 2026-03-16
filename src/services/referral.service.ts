/**
 * Referral & MLM Service
 * 
 * Handles multi-tier commissions and activity-based eligibility
 */

import { prisma } from '@/config/database';
import { COMMISSIONS } from '@/config/packages';
import { logger } from '@/utils/logger';
import { addDays, isAfter } from 'date-fns';

export class ReferralService {
  /**
   * Process MLM commissions for a new transaction
   */
  static async processCommissions(transactionId: string, amount: number, buyerTelegramId: bigint) {
    try {
      const buyer = await prisma.user.findUnique({
        where: { telegramId: buyerTelegramId }
      });

      if (!buyer || !buyer.referredBy) return;

      // Tier 1: Direct Referrer
      const directReferrer = await prisma.user.findUnique({
        where: { uuid: buyer.referredBy }
      });

      if (directReferrer && await this.isEligible(directReferrer.telegramId)) {
        await this.createCommission(
          directReferrer.telegramId,
          buyer.telegramId,
          amount * COMMISSIONS.DIRECT_REFERRAL,
          1
        );

        // Tier 2: Indirect Referrer (Referrer of the Referrer)
        if (directReferrer.referredBy) {
          const indirectReferrer = await prisma.user.findUnique({
            where: { uuid: directReferrer.referredBy }
          });

          if (indirectReferrer && await this.isEligible(indirectReferrer.telegramId)) {
            await this.createCommission(
              indirectReferrer.telegramId,
              buyer.telegramId,
              amount * COMMISSIONS.INDIRECT_REFERRAL,
              2
            );
          }
        }
      }
    } catch (error) {
      logger.error('Error processing MLM commissions:', error);
    }
  }

  /**
   * Check if a user is eligible for commissions (Activity Policy)
   * Must have a transaction/activity within the last 30 days
   */
  static async isEligible(telegramId: bigint): Promise<boolean> {
    const lastTransaction = await prisma.transaction.findFirst({
      where: { 
        userId: telegramId,
        status: 'completed'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastTransaction) return false;

    const expiryDate = addDays(new Date(lastTransaction.createdAt), COMMISSIONS.ACTIVITY_WINDOW_DAYS);
    return isAfter(expiryDate, new Date());
  }

  /**
   * Record commission in DB
   */
  private static async createCommission(referrerId: bigint, referredId: bigint, amount: number, tier: number) {
    await prisma.commission.create({
      data: {
        referrerId,
        referredId,
        amount,
        tier,
        status: 'available',
        availableAt: new Date(),
      }
    });
    
    logger.info(`Commission issued: IDR ${amount} to ${referrerId} (Tier ${tier})`);
  }
}
