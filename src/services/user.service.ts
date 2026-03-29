/**
 * User Service
 * 
 * Handles all user-related database operations
 */

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { redis } from '@/config/redis';
import { t } from '@/i18n/translations';
import { User, Prisma } from '@prisma/client';
import { Telegraf } from 'telegraf';

export class UserService {
  /**
   * Find user by Telegram ID
   */
  static async findByTelegramId(telegramId: bigint): Promise<User | null> {
    return prisma.user.findUnique({
      where: { telegramId },
    });
  }

  /**
   * Find user by UUID
   */
  static async findByUuid(uuid: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { uuid },
    });
  }

  /**
   * Create new user
   */
  static async create(data: {
    telegramId: bigint;
    username?: string;
    firstName: string;
    lastName?: string;
    referredBy?: string;
    language?: string;
    // UTM Parameters (Full Funnel Tracking)
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    lpVariant?: string;
    // Attribution IDs
    fbc?: string;
    fbp?: string;
    ttclid?: string;
  }): Promise<User> {
    // Generate referral code
    const referralCode = await this.generateReferralCode(data.username || data.firstName);

    const user = await prisma.user.create({
      data: {
        telegramId: data.telegramId,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        tier: 'free',
        creditBalance: 3, // 3 free trial credits
        referralCode,
        referredBy: data.referredBy,
        language: data.language || 'id',
        notificationsEnabled: true,
        // UTM Parameters
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmContent: data.utmContent,
        lpVariant: data.lpVariant,
        // Attribution IDs
        fbc: data.fbc,
        fbp: data.fbp,
        ttclid: data.ttclid,
      },
    });

    logger.info(`Created new user: ${user.telegramId} (${user.username || 'no username'}) [LP: ${data.lpVariant || 'direct'}]`);
    return user;
  }

  /**
   * Update user
   */
  static async update(telegramId: bigint, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { telegramId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update last activity
   */
  static async updateActivity(telegramId: bigint): Promise<void> {
    await prisma.user.update({
      where: { telegramId },
      data: { lastActivityAt: new Date() },
    });
  }

  /**
   * Add credits to user
   */
  static async addCredits(telegramId: bigint, amount: number): Promise<User> {
    return prisma.user.update({
      where: { telegramId },
      data: {
        creditBalance: {
          increment: amount,
        },
      },
    });
  }

  /**
   * Grant credits to user (alias for addCredits)
   */
  static async grantCredits(userId: bigint, amount: number, reason: string): Promise<User> {
    // Log the grant reason for audit purposes
    logger.info(`Granting ${amount} credits to user ${userId}. Reason: ${reason}`);
    
    // Add the credits
    return this.addCredits(userId, amount);
  }

  /** Optional reference to the running Telegraf bot instance for sending DMs. */
  private static botInstance: Telegraf | null = null;

  /**
   * Register the bot instance so the service can send proactive messages.
   * Call this once during startup (e.g. in index.ts after bot creation).
   */
  static setBotInstance(bot: Telegraf): void {
    this.botInstance = bot;
  }

  /**
   * Deduct credits from user
   */
  static async deductCredits(telegramId: bigint, amount: number): Promise<User> {
    const user = await this.findByTelegramId(telegramId);
    if (!user || Number(user.creditBalance) < amount) {
      throw new Error('Insufficient credits');
    }

    const updated = await prisma.user.update({
      where: { telegramId },
      data: {
        creditBalance: {
          decrement: amount,
        },
      },
    });

    // Fire-and-forget low credit warning
    const remaining = Number(updated.creditBalance);
    if (remaining > 0 && remaining < 1) {
      this.sendLowCreditWarning(telegramId, remaining, user.language || 'id').catch(() => {});
    }

    return updated;
  }

  /**
   * Send a low-credit warning via Telegram DM.
   * Throttled to once per 24 hours per user via Redis.
   */
  private static async sendLowCreditWarning(
    telegramId: bigint,
    remaining: number,
    lang: string,
  ): Promise<void> {
    if (!this.botInstance) return;

    const redisKey = `low_credit_warned:${telegramId.toString()}`;
    const alreadyWarned = await redis.get(redisKey);
    if (alreadyWarned) return;

    // Set flag with 24h TTL (86400 seconds)
    await redis.set(redisKey, '1', 'EX', 86400);

    const message = t('credits.low_warning', lang, {
      remaining: remaining.toFixed(1),
    });

    await this.botInstance.telegram.sendMessage(
      telegramId.toString(),
      message,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: t('menu.top_up', lang), callback_data: 'topup' },
              { text: t('menu.subscribe', lang), callback_data: 'open_subscription' },
            ],
          ],
        },
      },
    );

    logger.info(`Low credit warning sent to user ${telegramId} (${remaining} remaining)`);
  }

  /**
   * Refund credits to user
   */
  static async refundCredits(telegramId: bigint, amount: number, jobId: string, _reason: string): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({
        where: { telegramId },
        data: { creditBalance: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          orderId: `REFUND-${jobId}`,
          userId: telegramId,
          type: 'refund',
          packageName: 'refund',
          amountIdr: 0,
          creditsAmount: amount,
          gateway: 'system',
          status: 'success',
        },
      }),
    ]);
  }

  /**
   * Check if user has enough credits
   */
  static async hasEnoughCredits(telegramId: bigint, amount: number): Promise<boolean> {
    const user = await this.findByTelegramId(telegramId);
    return user !== null && Number(user.creditBalance) >= amount;
  }

  /**
   * Generate unique referral code
   */
  static async generateReferralCode(name: string): Promise<string> {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const sanitizeName = (n: string) => n.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    
    const base = sanitizeName(name) || 'USER';
    
    for (let attempt = 0; attempt < 10; attempt++) {
      const random = Array.from({ length: 4 }, () => 
        charset[Math.floor(Math.random() * charset.length)]
      ).join('');
      
      const code = `REF-${base}-${random}`;
      
      const existing = await prisma.user.findUnique({
        where: { referralCode: code },
      });
      
      if (!existing) {
        return code;
      }
    }
    
    // Fallback to UUID-based
    const random = Array.from({ length: 8 }, () => 
      charset[Math.floor(Math.random() * charset.length)]
    ).join('');
    return `REF-${random}`;
  }

  /**
   * Find user by referral code
   */
  static async findByReferralCode(code: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { referralCode: code },
    });
  }

  /**
   * Ban user
   */
  static async ban(telegramId: bigint, reason: string): Promise<User> {
    return prisma.user.update({
      where: { telegramId },
      data: {
        isBanned: true,
        banReason: reason,
        bannedAt: new Date(),
      },
    });
  }

  /**
   * Unban user
   */
  static async unban(telegramId: bigint): Promise<User> {
    return prisma.user.update({
      where: { telegramId },
      data: {
        isBanned: false,
        banReason: null,
        bannedAt: null,
      },
    });
  }

  /**
   * Get the number of videos the user has generated today (UTC).
   */
  static async getDailyGenerationCount(telegramId: bigint): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    return prisma.video.count({
      where: {
        userId: telegramId,
        createdAt: { gte: startOfDay },
      },
    });
  }

  /**
   * Check whether the user is allowed to generate another video today.
   * Returns the allowed flag, remaining count, and daily limit for the tier.
   */
  static async canGenerate(telegramId: bigint): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const user = await this.findByTelegramId(telegramId);
    if (!user) {
      return { allowed: false, remaining: 0, limit: 0 };
    }

    // Daily limits per tier
    const DAILY_LIMITS: Record<string, number> = {
      free: 2,
      basic: 3,
      lite: 3,
      pro: 10,
      agency: 30,
    };

    const tier = user.tier || 'free';
    const limit = DAILY_LIMITS[tier] ?? 2;
    const used = await this.getDailyGenerationCount(telegramId);
    const remaining = Math.max(0, limit - used);

    return { allowed: remaining > 0, remaining, limit };
  }

  /**
   * Get user stats
   */
  static async getStats(telegramId: bigint): Promise<{
    videosCreated: number;
    totalSpent: number;
    referralCount: number;
    commissionEarned: number;
  }> {
    const user = await this.findByTelegramId(telegramId);
    if (!user) {
      return { videosCreated: 0, totalSpent: 0, referralCount: 0, commissionEarned: 0 };
    }

    const [videos, transactions, referrals, commissions] = await Promise.all([
      prisma.video.count({ where: { userId: telegramId } }),
      prisma.transaction.aggregate({
        where: { userId: telegramId, status: 'success' },
        _sum: { amountIdr: true },
      }),
      prisma.user.count({ 
        where: { 
          referredBy: user.uuid 
        } 
      }),
      prisma.commission.aggregate({
        where: { referrerId: telegramId },
        _sum: { amount: true },
      }),
    ]);

    return {
      videosCreated: videos,
      totalSpent: Number(transactions._sum.amountIdr || 0),
      referralCount: referrals,
      commissionEarned: Number(commissions._sum.amount || 0),
    };
  }
}
