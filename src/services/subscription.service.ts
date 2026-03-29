import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { Subscription } from '@prisma/client';
import { getSubscriptionPlansAsync, PlanKey, BillingCycle } from '@/config/pricing';

export class SubscriptionService {

  static async createSubscription(
    telegramId: bigint,
    plan: PlanKey,
    billingCycle: BillingCycle,
    _transactionId: string
  ): Promise<Subscription> {
    const plans = await getSubscriptionPlansAsync();
    const planConfig = plans[plan];
    
    if (!planConfig) {
      throw new Error(`Plan configuration not found for: ${plan}`);
    }

    const now = new Date();
    const periodEnd = new Date(now);

    if (billingCycle === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    await prisma.subscription.updateMany({
      where: { userId: telegramId, status: 'active' },
      data: { status: 'cancelled', cancelledAt: now },
    });

    const subscription = await prisma.subscription.create({
      data: {
        userId: telegramId,
        plan,
        billingCycle,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    await prisma.user.update({
      where: { telegramId },
      data: {
        tier: planConfig.tier || (plan as string === 'pro' ? 'pro' : (plan as string === 'agency' ? 'agency' : 'basic')),
        creditBalance: { increment: planConfig.monthlyCredits },
        creditExpiresAt: periodEnd,
      },
    });

    logger.info(`Subscription created: ${plan}/${billingCycle} for user ${telegramId}`);
    return subscription;
  }

  static async cancelSubscription(telegramId: bigint): Promise<void> {
    await prisma.subscription.updateMany({
      where: { userId: telegramId, status: 'active' },
      data: { cancelAtPeriodEnd: true },
    });
    logger.info(`Subscription cancellation scheduled for user ${telegramId}`);
  }

  static async renewSubscription(subscriptionId: bigint): Promise<void> {
    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub || sub.status !== 'active') return;

    const plan = sub.plan as PlanKey;
    const plans = await getSubscriptionPlansAsync();
    const planConfig = plans[plan];
    if (!planConfig) return;

    const newStart = new Date(sub.currentPeriodEnd);
    const newEnd = new Date(newStart);
    if (sub.billingCycle === 'annual') {
      newEnd.setFullYear(newEnd.getFullYear() + 1);
    } else {
      newEnd.setMonth(newEnd.getMonth() + 1);
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        currentPeriodStart: newStart,
        currentPeriodEnd: newEnd,
      },
    });

    await prisma.user.update({
      where: { telegramId: sub.userId },
      data: {
        creditBalance: planConfig.monthlyCredits,
        creditExpiresAt: newEnd,
      },
    });

    logger.info(`Subscription renewed: ${plan} for user ${sub.userId}`);
  }

  static async getActiveSubscription(telegramId: bigint): Promise<Subscription | null> {
    return prisma.subscription.findFirst({
      where: { userId: telegramId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async isSubscribed(telegramId: bigint): Promise<boolean> {
    const sub = await this.getActiveSubscription(telegramId);
    return sub !== null && new Date(sub.currentPeriodEnd) > new Date();
  }

  static async checkExpiredSubscriptions(): Promise<number> {
    const now = new Date();

    const expiredCancelled = await prisma.subscription.findMany({
      where: {
        status: 'active',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: { lte: now },
      },
    });

    for (const sub of expiredCancelled) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      });
      await prisma.user.update({
        where: { telegramId: sub.userId },
        data: { tier: 'free', creditBalance: 0, creditExpiresAt: null },
      });
      logger.info(`Subscription expired for user ${sub.userId}`);
    }

    const dueForRenewal = await prisma.subscription.findMany({
      where: {
        status: 'active',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: { lte: now },
      },
    });

    for (const sub of dueForRenewal) {
      // Manual renewal for now
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      });
      await prisma.user.update({
        where: { telegramId: sub.userId },
        data: { tier: 'free', creditBalance: 0, creditExpiresAt: null },
      });
      logger.info(`Subscription expired (requires manual renewal) for user ${sub.userId}`);
    }

    logger.info(`Processed ${expiredCancelled.length} cancelled + ${dueForRenewal.length} manual-renewal subscriptions`);
    return expiredCancelled.length + dueForRenewal.length;
  }

  static async getDailyGenerationCount(telegramId: bigint): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.video.count({
      where: {
        userId: telegramId,
        createdAt: { gte: today },
      },
    });
  }

  static async canGenerate(telegramId: bigint): Promise<{ allowed: boolean; reason?: string }> {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return { allowed: false, reason: 'User not found' };

    const sub = await this.getActiveSubscription(telegramId);
    if (!sub) {
      if (Number(user.creditBalance) <= 0) {
        return { allowed: false, reason: 'No credits. Use /topup to purchase.' };
      }
      return { allowed: true };
    }

    const plan = sub.plan as PlanKey;
    const plans = await getSubscriptionPlansAsync();
    const planConfig = plans[plan];
    if (!planConfig) return { allowed: true };

    const dailyCount = await this.getDailyGenerationCount(telegramId);
    const dailyLimit = planConfig.dailyGenerationLimit || 10;

    if (dailyCount >= dailyLimit) {
      return {
        allowed: false,
        reason: `Daily limit reached (${dailyLimit}/${planConfig.name} plan). Try again tomorrow or upgrade.`,
      };
    }

    if (Number(user.creditBalance) <= 0) {
      return { allowed: false, reason: 'No credits remaining. Use /topup for extra credits.' };
    }

    return { allowed: true };
  }
}
