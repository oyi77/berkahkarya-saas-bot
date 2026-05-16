/**
 * Daily Activity Report Worker
 * Sends activity report to Telegram at 00:00 WIB (UTC+7)
 */

import { Telegraf } from "telegraf";
import { prisma } from "@/config/database";
import { format, subDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { logger } from "@/utils/logger";
import { getConfig } from "@/config/env";
import cron from "node-cron";

export function startDailyReportWorker(bot: Telegraf) {
  const ADMIN_CHAT_ID = getConfig().ADMIN_CHAT_ID || "6077091585";

  // Schedule: Every day at 00:00 WIB (which is 17:00 UTC previous day)
  // Cron: "0 17 * * *" for UTC (00:00 WIB = 17:00 UTC)
  const job = cron.schedule("0 17 * * *", async () => {
    try {
      await generateAndSendReport(bot, ADMIN_CHAT_ID);
    } catch (error) {
      logger.error("❌ Daily report worker error:", error);
    }
  });

  logger.info("✅ Daily report worker started (00:00 WIB)");
  return job;
}

async function generateAndSendReport(bot: Telegraf, chatId: string) {
  try {
    const yesterday = subDays(new Date(), 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch statistics
    const [
      totalUsers,
      newUsers,
      activeUsers,
      videosYesterday,
      successfulVideos,
      transactionsYesterday,
      topUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        where: { createdAt: { gte: yesterday, lt: today } },
        select: { telegramId: true, username: true, firstName: true },
      }),
      prisma.user.findMany({
        where: { lastActivityAt: { gte: yesterday, lt: today } },
        select: { telegramId: true, username: true, firstName: true },
      }),
      prisma.video.count({
        where: { createdAt: { gte: yesterday, lt: today } },
      }),
      prisma.video.count({
        where: {
          createdAt: { gte: yesterday, lt: today },
          status: "completed",
        },
      }),
      prisma.transaction.aggregate({
        where: {
          createdAt: { gte: yesterday, lt: today },
          status: "success",
        },
        _sum: { amountIdr: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { videos: { _count: "desc" } },
        select: {
          telegramId: true,
          username: true,
          firstName: true,
          tier: true,
          creditBalance: true,
          _count: { select: { videos: true } },
        },
      }),
    ]);

    const dateStr = format(yesterday, "dd MMMM yyyy", { locale: idLocale });
    const successRate =
      videosYesterday > 0
        ? Math.round((successfulVideos / videosYesterday) * 100)
        : 0;

    let message = `📊 *LAPORAN AKTIVITAS HARIAN*\n`;
    message += `📅 ${dateStr}\n`;
    message += `${"=".repeat(40)}\n\n`;

    // Statistics
    message += `*📈 STATISTIK UMUM*\n`;
    message += `👥 Total Users: *${totalUsers}*\n`;
    message += `📹 Videos Generated: *${videosYesterday}* (✅ ${successfulVideos} sukses - ${successRate}%)\n`;
    message += `💰 Revenue: *Rp ${(transactionsYesterday._sum.amountIdr || 0).toLocaleString("id-ID")}*\n`;
    message += `👤 New Users: *${newUsers.length}*\n`;
    message += `🔥 Active Users: *${activeUsers.length}*\n\n`;

    // New users
    if (newUsers.length > 0) {
      message += `*🆕 PENGGUNA BARU (${newUsers.length})*\n`;
      newUsers.slice(0, 10).forEach((user, i) => {
        const name = user.username ? `@${user.username}` : user.firstName;
        message += `${i + 1}. ${name}\n`;
      });
      if (newUsers.length > 10) {
        message += `... dan ${newUsers.length - 10} lainnya\n`;
      }
      message += `\n`;
    }

    // Active users
    if (activeUsers.length > 0) {
      message += `*🔥 PENGGUNA AKTIF (${activeUsers.length})*\n`;
      activeUsers.slice(0, 10).forEach((user, i) => {
        const name = user.username ? `@${user.username}` : user.firstName;
        message += `${i + 1}. ${name}\n`;
      });
      if (activeUsers.length > 10) {
        message += `... dan ${activeUsers.length - 10} lainnya\n`;
      }
      message += `\n`;
    }

    // Top users all-time
    if (topUsers.length > 0) {
      message += `*⭐ TOP 5 USERS (ALL TIME)*\n`;
      topUsers.forEach((user, i) => {
        const name = user.username ? `@${user.username}` : user.firstName;
        message += `${i + 1}. ${name} - ${user._count.videos} videos (${user.tier})\n`;
      });
      message += `\n`;
    }

    message += `${"=".repeat(40)}\n`;
    message += `🕐 Laporan otomatis setiap jam 00:00 WIB\n`;
    message += `🤖 Powered by BerkahKarya Bot`;

    await bot.telegram.sendMessage(chatId, message, { parse_mode: "Markdown" });
    logger.info(`✅ Daily report sent to ${chatId}`);
  } catch (error) {
    logger.error("❌ Failed to generate/send report:", error);
  }
}
