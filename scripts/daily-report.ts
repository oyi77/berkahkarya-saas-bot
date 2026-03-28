/**
 * Daily Activity Report - Sends to Telegram at 00:00 WIB
 * Reports: Total users, videos generated, revenue, new users, active users
 */

import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { format, subDays } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.BOT_TOKEN || "";
const ADMIN_CHAT_ID = "6077091585"; // Kumpulan Materi

interface UserStats {
  telegramId: bigint;
  username: string;
  firstName: string;
  tier: string;
  videoCount: number;
  lastVideoAt: Date | null;
  creditBalance: number;
}

async function getYesterdayStats() {
  const now = new Date();
  const yesterday = subDays(now, 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Total users
  const totalUsers = await prisma.user.count();

  // New users yesterday
  const newUsers = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: yesterday,
        lt: today,
      },
    },
    select: {
      telegramId: true,
      username: true,
      firstName: true,
    },
  });

  // Active users yesterday (had activity)
  const activeUsers = await prisma.user.findMany({
    where: {
      lastActivityAt: {
        gte: yesterday,
        lt: today,
      },
    },
    select: {
      telegramId: true,
      username: true,
      firstName: true,
    },
  });

  // Videos generated yesterday
  const videosYesterday = await prisma.video.findMany({
    where: {
      createdAt: {
        gte: yesterday,
        lt: today,
      },
    },
    select: {
      userId: true,
      status: true,
      createdAt: true,
    },
  });

  // Transactions yesterday
  const transactionsYesterday = await prisma.transaction.aggregate({
    where: {
      createdAt: {
        gte: yesterday,
        lt: today,
      },
      status: "success",
    },
    _sum: {
      amountIdr: true,
    },
  });

  // Top users by video count (yesterday)
  const topUsers = await prisma.user.findMany({
    take: 5,
    orderBy: {
      videos: {
        _count: "desc",
      },
    },
    select: {
      telegramId: true,
      username: true,
      firstName: true,
      tier: true,
      creditBalance: true,
      _count: {
        select: {
          videos: true,
        },
      },
    },
  });

  return {
    totalUsers,
    newUsers,
    activeUsers,
    videosYesterday,
    transactionsYesterday,
    topUsers,
  };
}

async function sendTelegramReport(stats: any) {
  const yesterday = subDays(new Date(), 1);
  const dateStr = format(yesterday, "dd MMMM yyyy", { locale: require("date-fns/locale/id") });

  let message = `📊 *LAPORAN AKTIVITAS HARIAN*\n`;
  message += `📅 ${dateStr}\n\n`;

  message += `*📈 STATISTIK UMUM*\n`;
  message += `👥 Total Users: *${stats.totalUsers}*\n`;
  message += `📹 Videos Generated: *${stats.videosYesterday.length}*\n`;
  message += `💰 Revenue: Rp *${stats.transactionsYesterday._sum.amountIdr?.toLocaleString("id-ID") || "0"}*\n`;
  message += `👤 New Users: *${stats.newUsers.length}*\n`;
  message += `🔥 Active Users: *${stats.activeUsers.length}*\n\n`;

  if (stats.newUsers.length > 0) {
    message += `*🆕 PENGGUNA BARU*\n`;
    stats.newUsers.forEach((user: any, i: number) => {
      message += `${i + 1}. @${user.username || user.firstName}\n`;
    });
    message += `\n`;
  }

  if (stats.activeUsers.length > 0) {
    message += `*🔥 PENGGUNA AKTIF*\n`;
    stats.activeUsers.forEach((user: any, i: number) => {
      message += `${i + 1}. @${user.username || user.firstName}\n`;
    });
    message += `\n`;
  }

  if (stats.topUsers.length > 0) {
    message += `*⭐ TOP USERS (ALL TIME)*\n`;
    stats.topUsers.forEach((user: any, i: number) => {
      message += `${i + 1}. @${user.username || user.firstName} - ${user._count.videos} videos (${user.tier})\n`;
    });
    message += `\n`;
  }

  message += `---\n`;
  message += `🕐 Laporan otomatis setiap jam 00:00 WIB`;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: ADMIN_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    });
    console.log(`✅ Daily report sent to ${ADMIN_CHAT_ID}`);
  } catch (error: any) {
    console.error("❌ Failed to send report:", error.response?.data || error.message);
  }
}

async function main() {
  try {
    console.log("📊 Generating daily report...");
    const stats = await getYesterdayStats();
    await sendTelegramReport(stats);
  } catch (error) {
    console.error("❌ Report failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
