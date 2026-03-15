/**
 * User Service
 * 
 * Handles all user-related database operations
 */

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { User, Prisma } from '@prisma/client';

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
        language: 'id',
        notificationsEnabled: true,
      },
    });

    logger.info(`Created new user: ${user.telegramId} (${user.username || 'no username'})`);
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
   * Deduct credits from user
   */
  static async deductCredits(telegramId: bigint, amount: number): Promise<User> {
    const user = await this.findByTelegramId(telegramId);
    if (!user || Number(user.creditBalance) < amount) {
      throw new Error('Insufficient credits');
    }

    return prisma.user.update({
      where: { telegramId },
      data: {
        creditBalance: {
          decrement: amount,
        },
      },
    });
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
   * Get user stats
   */
  static async getStats(telegramId: bigint): Promise<{
    videosCreated: number;
    totalSpent: number;
    referralCount: number;
    commissionEarned: number;
  }> {
    const [videos, transactions, referrals, commissions] = await Promise.all([
      prisma.video.count({ where: { userId: telegramId } }),
      prisma.transaction.aggregate({
        where: { userId: telegramId, status: 'success' },
        _sum: { amountIdr: true },
      }),
      prisma.user.count({ where: { referredBy: (await this.findByTelegramId(telegramId))?.uuid } }),
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
