import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { Subscription } from '@prisma/client';
import { getSubscriptionPlansAsync, PlanKey, BillingCycle } from '@/config/pricing';
import { Telegraf } from 'telegraf';
import { t } from '@/i18n/translations';

export class SubscriptionService {
  /** Optional reference to the running Telegraf bot instance for sending proactive messages. */
  private static botInstance: Telegraf | null = null;

  /**
   * Register the bot instance so the service can send proactive messages.
   * Call this once during startup (e.g. in index.ts after bot creation).
   */
  static setBotInstance(bot: Telegraf): void {
    this.botInstance = bot;
  }

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

    const creditsToGrant = billingCycle === 'annual'
      ? (planConfig.monthlyCredits || 0) * 12
      : (planConfig.monthlyCredits || 0);

    await prisma.user.update({
      where: { telegramId },
      data: {
        tier: planConfig.tier || (plan as string === 'pro' ? 'pro' : (plan as string === 'agency' ? 'agency' : 'basic')),
        creditBalance: { increment: creditsToGrant },
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

  /**
   * Renew subscription after payment confirmation.
   * Called ONLY from payment webhook handlers — never from auto-renewal cron.
   */
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

    const creditsToGrant = sub.billingCycle === 'annual'
      ? (planConfig.monthlyCredits || 0) * 12
      : (planConfig.monthlyCredits || 0);

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
        creditBalance: { increment: creditsToGrant },
        creditExpiresAt: newEnd,
      },
    });

    logger.info(`Subscription renewed: ${plan}/${sub.billingCycle} for user ${sub.userId} (+${creditsToGrant} credits)`);
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

    // Subscriptions that expired without cancelAtPeriodEnd: attempt auto-renewal if enabled,
    // otherwise expire and notify user to re-subscribe manually.
    const dueForRenewal = await prisma.subscription.findMany({
      where: {
        status: 'active',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: { lte: now },
      },
    });

    let autoRenewed = 0;
    let renewalFailed = 0;

    for (const sub of dueForRenewal) {
      try {
        const user = await prisma.user.findUnique({
          where: { telegramId: sub.userId },
          select: { telegramId: true, autoRenewal: true, creditBalance: true, language: true },
        });

        if (user?.autoRenewal === true) {
          const plans = await getSubscriptionPlansAsync();
          const planConfig = plans[sub.plan as PlanKey];
          const creditsNeeded = sub.billingCycle === 'annual'
            ? (planConfig?.monthlyCredits || 0) * 12
            : (planConfig?.monthlyCredits || 0);

          if (Number(user.creditBalance) >= creditsNeeded) {
            // Deduct credits for the renewal period then extend subscription
            await prisma.user.update({
              where: { telegramId: sub.userId },
              data: { creditBalance: { decrement: creditsNeeded } },
            });
            await this.renewSubscription(sub.id);
            autoRenewed++;
            logger.info(`Auto-renewed subscription ${sub.id} for user ${sub.userId} (-${creditsNeeded} credits)`);

            // Notify user of successful renewal
            if (this.botInstance) {
              try {
                const renewed = await prisma.subscription.findUnique({ where: { id: sub.id } });
                const lang = user.language || 'id';
                const endDate = renewed?.currentPeriodEnd
                  ? new Date(renewed.currentPeriodEnd).toLocaleDateString()
                  : '';
                await this.botInstance.telegram.sendMessage(
                  sub.userId.toString(),
                  t('subscription.auto_renewed', lang, { plan: sub.plan, endDate }),
                  { parse_mode: 'Markdown' },
                );
              } catch (notifyErr) {
                logger.warn(`Failed to send auto-renewal success notification to ${sub.userId}:`, notifyErr);
              }
            }
          } else {
            // Insufficient balance — cancel auto-renewal and notify
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { cancelAtPeriodEnd: true },
            });
            renewalFailed++;
            logger.warn(`Auto-renewal failed (insufficient balance) for sub ${sub.id} user ${sub.userId}`);

            if (this.botInstance) {
              try {
                const lang = user.language || 'id';
                await this.botInstance.telegram.sendMessage(
                  sub.userId.toString(),
                  t('subscription.renewal_failed', lang, { plan: sub.plan }),
                  {
                    parse_mode: 'Markdown',
                    reply_markup: {
                      inline_keyboard: [
                        [
                          { text: t('menu.top_up', lang), callback_data: 'topup' },
                        ],
                      ],
                    },
                  },
                );
              } catch (notifyErr) {
                logger.warn(`Failed to send auto-renewal failure notification to ${sub.userId}:`, notifyErr);
              }
            }
          }
        } else {
          // No auto-renewal: expire and notify user to re-subscribe manually.
          // Credits are NOT auto-granted — that would be giving away free credits.
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'expired' },
          });
          await prisma.user.update({
            where: { telegramId: sub.userId },
            data: { tier: 'free', creditExpiresAt: null },
          });
          logger.info(`Subscription expired (renewal needed): ${sub.plan} for user ${sub.userId}`);
        }
      } catch (err) {
        logger.error(`Failed to process renewal for sub ${sub.id} (user ${sub.userId}):`, err);
      }
    }

    if (autoRenewed > 0 || renewalFailed > 0) {
      logger.info(`Auto-renewal: ${autoRenewed} renewed, ${renewalFailed} failed (insufficient balance)`);
    }

    logger.info(`Processed ${expiredCancelled.length} cancelled + ${dueForRenewal.length} expired subscriptions`);
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
