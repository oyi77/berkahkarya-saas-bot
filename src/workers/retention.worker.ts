/**
 * Retention Worker
 * 
 * Automated trigger system for 5 user types:
 * - Type 1: Deposit but no use
 * - Type 2: Used free trial, no deposit
 * - Type 3: Used once, stopped
 * - Type 4: Active but no referral
 * - Type 5: Churned (30+ days inactive)
 * 
 * Anti-spam rules enforced per Master Doc v3.0 Part 8.6
 */

import { Worker, Job, Queue } from 'bullmq';
import { bullmqRedis } from '@/config/redis';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import type { Telegram } from 'telegraf';

export const retentionQueue = new Queue('retention', { connection: bullmqRedis });

// ── Anti-Spam Config ──────────────────────────────────────────────────────────

const ANTI_SPAM = {
  MAX_PER_CATEGORY_PER_3_DAYS: 1,
  MAX_PER_DAY: 2,
  SEND_HOUR_START: 8,  // 08:00 WIB
  SEND_HOUR_END: 20,   // 20:00 WIB
  STOP_AFTER_CHURN_DAYS: 60,
};

// ── Message Templates ─────────────────────────────────────────────────────────

const MESSAGES = {
  // Type 1: Deposit no use
  deposit_2h: (name: string) =>
    `Hai ${name}! 👋\n\nCredit kamu sudah masuk. Yuk langsung generate konten pertama kamu!\n\nSatu foto produk → video iklan profesional dalam 60 detik. 🎬`,
  deposit_24h: (name: string) =>
    `${name}, sayang banget creditmu nganggur 😅\n\nTinggal kirim 1 foto produk, AI yang urus sisanya. Mau coba sekarang?`,
  deposit_72h: (name: string) =>
    `${name}, gue mau kasih mini-tutorial:\n\n*3 langkah generate konten:*\n1. Tap Generate Konten\n2. Upload foto produk\n3. Terima hasilnya!\n\nSepraktis itu 🚀`,
  deposit_7d: (name: string) =>
    `${name}, ini pesan terakhir dari gue 🙏\n\nCreditmu masih ada dan siap dipakai. Kalau ada yang kurang jelas, balas pesan ini ya!`,

  // Type 2: Free trial, no deposit
  free_1h: (name: string) =>
    `${name}, tadi hasilnya gimana? 😊\n\nKalau mau generate lagi, paket paling terjangkau cuma Rp 25.000 (1 credit). Bisa untuk image set 7 scene + 1 video!\n\n👉 Tap /topup`,
  free_24h: (name: string) =>
    `${name}! 100+ UMKM sudah pakai BK Vilona bulan ini 📊\n\n_"Kontennya bagus, hemat waktu banget"_ — owner kafe Surabaya\n_"Video-nya langsung viral di TikTok"_ — toko fashion Jakarta\n\nMau bergabung? Mulai dari Rp 25.000 👉 /topup`,
  free_3d: (name: string) =>
    `${name}, spesial buat kamu yang udah coba! 🎁\n\nDiskon Rp 10.000 untuk paket pertama (Rp 99.000 → Rp 89.000)\nBerlaku 24 jam aja.\n\n👉 /topup`,
  free_7d: (name: string) =>
    `${name}, ini pesan terakhir dari gue.\n\nKalau berubah pikiran, kita selalu siap bantu. Sampai ketemu! 👋`,

  // Type 3: Used once, stopped
  used_3d: (name: string) =>
    `${name}, video yang kemarin udah di-post belum? 📱\n\nUser yang post rutin 3-5x/minggu rata-rata engagement-nya 3x lebih tinggi. Mau buat konten baru?`,
  used_7d: (name: string) =>
    `${name}! Tips: buat 5 variasi video dengan hook berbeda, test mana yang paling banyak klik 📈\n\nFitur Campaign Builder di BK Vilona bisa bantu kamu. Mau coba?`,
  used_14d: (name: string) =>
    `${name}, ada fitur Campaign Builder nih — generate 5-10 video sekaligus dengan hook berbeda untuk A/B testing iklan! 📦\n\nCocok banget untuk kamu yang mau scale konten. /create`,
  used_21d: (name: string) =>
    `${name}, khusus buat kamu yang sudah pernah pakai 🎁\n\nDiskon 50% untuk 1x generate. Berlaku 48 jam.\n\nTap /create dan masukkan kode: COMEBACK50`,

  // Type 4: Active no affiliate
  active_3rd_gen: (name: string) =>
    `${name}, tau gak bisa dapat credit gratis? 💰\n\nDaftarkan teman-temanmu ke BK Vilona, setiap kali mereka isi saldo, kamu dapat 15% komisi otomatis!\n\n👉 /referral`,
  active_5th_gen: (name: string) =>
    `${name}, kamu aktif banget nih! 🔥\n\nShare BK Vilona ke teman-teman UMKM kamu. Mereka dapat tools powerful, kamu dapat passive income 15% dari setiap deposit mereka.\n\n👉 /referral`,
  active_10th_gen: (name: string) =>
    `${name}! User lain yang rajin refer bisa dapat Rp 500k+ credit per bulan 💎\n\nGratis, tinggal share link. /referral`,

  // Type 5: Churned
  churn_30d: (name: string) =>
    `Hai ${name}! Lama gak jumpa 😊\n\nBK Vilona baru rilis fitur Campaign Builder dan Clone Style! Generate 5-10 video sekaligus atau tiru gaya visual brand besar.\n\nSpecial comeback offer: paket Starter Rp 99k → Rp 69k. Berlaku 72 jam. /topup`,
  churn_60d: (name: string) =>
    `${name}, ini pesan terakhir dari kami.\n\nSemoga bisnis kamu makin berkembang ya! Kalau mau balik, kami selalu di sini 🙏\n\nTap /start kapan saja.`,

  // Type 6: Subscription expiring
  sub_expiring_3d: (name: string) =>
    `⭐ ${name}, langganan kamu akan berakhir dalam 3 hari!\n\nPerpanjang sekarang supaya kredit bulananmu tetap aktif dan tidak kehilangan akses fitur premium.\n\n👉 /topup`,
  sub_expiring_1d: (name: string) =>
    `⚠️ ${name}, langganan kamu berakhir besok!\n\nKredit yang belum dipakai akan hangus setelah langganan berakhir. Perpanjang sekarang!\n\n👉 /topup`,
};

// ── Scheduler ────────────────────────────────────────────────────────────────

export class RetentionScheduler {

  /**
   * Run all retention checks
   * Call this every hour via cron
   */
  static async runAllChecks(bot: { telegram: Telegram }): Promise<void> {
    const now = new Date();
    const wibHour = (now.getUTCHours() + 7) % 24;

    // Only send messages during allowed hours
    if (wibHour < ANTI_SPAM.SEND_HOUR_START || wibHour >= ANTI_SPAM.SEND_HOUR_END) {
      logger.info('[retention] Outside send window, skipping');
      return;
    }

    await Promise.allSettled([
      this.checkType1DepositNoUse(bot),
      this.checkType2FreeNoDeposit(bot),
      this.checkType3UsedOnce(bot),
      this.checkType4ActiveNoAffiliate(bot),
      this.checkType5Churned(bot),
      this.checkType6SubscriptionExpiring(bot),
    ]);
  }

  /**
   * Type 6: Subscription expiring in 1 or 3 days
   */
  static async checkType6SubscriptionExpiring(bot: { telegram: Telegram }): Promise<void> {
    const now = new Date();
    const triggers = [
      { daysAhead: 3, msgKey: 'sub_expiring_3d' as const },
      { daysAhead: 1, msgKey: 'sub_expiring_1d' as const },
    ];

    for (const trigger of triggers) {
      const targetDate = new Date(now.getTime() + trigger.daysAhead * 24 * 60 * 60 * 1000);
      const targetStart = new Date(targetDate);
      targetStart.setHours(0, 0, 0, 0);
      const targetEnd = new Date(targetDate);
      targetEnd.setHours(23, 59, 59, 999);

      const subs = await prisma.subscription.findMany({
        where: {
          status: 'active',
          currentPeriodEnd: { gte: targetStart, lte: targetEnd },
        },
        include: { user: { select: { id: true, telegramId: true, firstName: true, notificationsEnabled: true } } },
        take: 50,
      });

      for (const sub of subs) {
        if (!sub.user?.notificationsEnabled) continue;
        if (await this.canSend(sub.user.id, 'subscription')) {
          await this.sendMessage(bot, sub.user.telegramId, MESSAGES[trigger.msgKey](sub.user.firstName));
          await this.logSent(sub.user.id, 'subscription');
        }
      }
    }
  }

  /**
   * Type 1: Deposited but never generated
   */
  static async checkType1DepositNoUse(bot: { telegram: Telegram }): Promise<void> {
    const triggers = [
      { hoursAgo: 2, msgKey: 'deposit_2h' as const },
      { hoursAgo: 24, msgKey: 'deposit_24h' as const },
      { hoursAgo: 72, msgKey: 'deposit_72h' as const },
      { hoursAgo: 168, msgKey: 'deposit_7d' as const }, // 7 days
    ];

    for (const trigger of triggers) {
      const cutoff = new Date(Date.now() - trigger.hoursAgo * 60 * 60 * 1000);
      const cutoffPrev = new Date(Date.now() - (trigger.hoursAgo + 1) * 60 * 60 * 1000);

      const users = await prisma.user.findMany({
        where: {
          creditBalance: { gt: 0 },
          videos: { none: {} },
          notificationsEnabled: true,
          isBanned: false,
          createdAt: { gte: cutoffPrev, lt: cutoff },
        },
        take: 50,
      });

      for (const user of users) {
        if (await this.canSend(user.id, 'deposit')) {
          await this.sendMessage(bot, user.telegramId, MESSAGES[trigger.msgKey](user.firstName));
          await this.logSent(user.id, 'deposit');
        }
      }
    }
  }

  /**
   * Type 2: Used free trial, no deposit
   */
  static async checkType2FreeNoDeposit(bot: { telegram: Telegram }): Promise<void> {
    const triggers = [
      { hoursAgo: 1, msgKey: 'free_1h' as const },
      { hoursAgo: 24, msgKey: 'free_24h' as const },
      { hoursAgo: 72, msgKey: 'free_3d' as const },
      { hoursAgo: 168, msgKey: 'free_7d' as const },
    ];

    for (const trigger of triggers) {
      const cutoff = new Date(Date.now() - trigger.hoursAgo * 60 * 60 * 1000);
      const cutoffPrev = new Date(Date.now() - (trigger.hoursAgo + 1) * 60 * 60 * 1000);

      const users = await prisma.user.findMany({
        where: {
          welcomeBonusUsed: true,
          transactions: { none: {} },
          notificationsEnabled: true,
          isBanned: false,
          createdAt: { gte: cutoffPrev, lt: cutoff },
        },
        take: 50,
      });

      for (const user of users) {
        if (await this.canSend(user.id, 'free_trial')) {
          await this.sendMessage(bot, user.telegramId, MESSAGES[trigger.msgKey](user.firstName));
          await this.logSent(user.id, 'free_trial');
        }
      }
    }
  }

  /**
   * Type 3: Used once, stopped
   */
  static async checkType3UsedOnce(bot: { telegram: Telegram }): Promise<void> {
    const triggers = [
      { daysAgo: 3, msgKey: 'used_3d' as const },
      { daysAgo: 7, msgKey: 'used_7d' as const },
      { daysAgo: 14, msgKey: 'used_14d' as const },
      { daysAgo: 21, msgKey: 'used_21d' as const },
    ];

    for (const trigger of triggers) {
      const cutoff = new Date(Date.now() - trigger.daysAgo * 24 * 60 * 60 * 1000);
      const cutoffPrev = new Date(Date.now() - (trigger.daysAgo + 1) * 24 * 60 * 60 * 1000);

      const users = await prisma.user.findMany({
        where: {
          videos: { some: {} },
          notificationsEnabled: true,
          isBanned: false,
          lastActivityAt: { gte: cutoffPrev, lt: cutoff },
        },
        take: 50,
      });

      for (const user of users) {
        if (await this.canSend(user.id, 'inactive')) {
          await this.sendMessage(bot, user.telegramId, MESSAGES[trigger.msgKey](user.firstName));
          await this.logSent(user.id, 'inactive');
        }
      }
    }
  }

  /**
   * Type 4: Active but not using referral
   * Triggered at 3rd, 5th, 10th generate
   */
  static async checkType4ActiveNoAffiliate(bot: { telegram: Telegram }): Promise<void> {
    const checkPoints = [3, 5, 10];

    for (const count of checkPoints) {
      // Use Prisma ORM instead of raw SQL to avoid column name mismatch
      const usersWithVideoCount = await prisma.user.findMany({
        where: {
          notificationsEnabled: true,
          isBanned: false,
          commissions: { none: {} },  // No referral commissions earned
        },
        select: { id: true, telegramId: true, firstName: true, _count: { select: { videos: { where: { status: { in: ['completed', 'done'] } } } } } },
        take: 100,
      });

      const users = usersWithVideoCount.filter(u => u._count.videos === count).slice(0, 30);
      const msgKey = count === 3 ? 'active_3rd_gen' : count === 5 ? 'active_5th_gen' : 'active_10th_gen';

      for (const user of users) {
        if (await this.canSend(user.id, 'affiliate')) {
          await this.sendMessage(bot, user.telegramId, MESSAGES[msgKey](user.firstName));
          await this.logSent(user.id, 'affiliate');
        }
      }
    }
  }

  /**
   * Type 5: Churned users (30+ days inactive)
   */
  static async checkType5Churned(bot: { telegram: Telegram }): Promise<void> {
    const triggers = [
      { daysAgo: 30, msgKey: 'churn_30d' as const },
      { daysAgo: 60, msgKey: 'churn_60d' as const },
    ];

    for (const trigger of triggers) {
      const cutoff = new Date(Date.now() - trigger.daysAgo * 24 * 60 * 60 * 1000);
      const cutoffPrev = new Date(Date.now() - (trigger.daysAgo + 1) * 24 * 60 * 60 * 1000);

      const users = await prisma.user.findMany({
        where: {
          videos: { some: {} },
          notificationsEnabled: true,
          isBanned: false,
          lastActivityAt: { gte: cutoffPrev, lt: cutoff },
        },
        take: 30,
      });

      for (const user of users) {
        if (await this.canSend(user.id, 'churn')) {
          await this.sendMessage(bot, user.telegramId, MESSAGES[trigger.msgKey](user.firstName));
          await this.logSent(user.id, 'churn');
        }
      }
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private static async canSend(userId: bigint, category: string): Promise<boolean> {
    // Atomic check using Redis setnx to prevent race condition
    const lockKey = `retention_lock:${userId}:${category}`;
    try {
      const { redis } = await import('../config/redis.js');
      const locked = await redis.set(lockKey, '1', 'EX', 10, 'NX');
      if (locked !== 'OK') return false; // Another call is already processing
    } catch {
      // Redis unavailable — refuse to send to prevent double-send
      return false;
    }

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [categoryCount, dayCount] = await Promise.all([
      (prisma as any).retentionLog.count({
        where: { userId, triggerType: category, sentAt: { gte: threeDaysAgo } },
      }),
      (prisma as any).retentionLog.count({
        where: { userId, sentAt: { gte: oneDayAgo } },
      }),
    ]);

    return categoryCount < ANTI_SPAM.MAX_PER_CATEGORY_PER_3_DAYS &&
           dayCount < ANTI_SPAM.MAX_PER_DAY;
  }

  private static async logSent(userId: bigint, triggerType: string): Promise<void> {
    await (prisma as any).retentionLog.create({
      data: { userId, triggerType },
    });
  }

  private static async sendMessage(
    bot: { telegram: Telegram },
    telegramId: bigint,
    message: string
  ): Promise<void> {
    try {
      await bot.telegram.sendMessage(Number(telegramId), message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🎬 Generate Sekarang', callback_data: 'generate_start' },
              { text: '🔕 Unsubscribe', callback_data: 'notif_unsubscribe' },
            ],
          ],
        },
      });
    } catch (err: any) {
      if (err.message?.includes('bot was blocked')) {
        logger.debug(`[retention] User ${telegramId} blocked bot`);
      } else {
        logger.error(`[retention] Failed to send to ${telegramId}:`, err.message);
      }
    }
  }
}

// ── BullMQ Worker ─────────────────────────────────────────────────────────────

export function createRetentionWorker(bot: { telegram: Telegram }) {
  return new Worker(
    'retention',
    async (job: Job) => {
      if (job.name === 'run_checks') {
        await RetentionScheduler.runAllChecks(bot);
      }
    },
    {
      connection: bullmqRedis,
      concurrency: 1,
    }
  );
}

export default RetentionScheduler;
