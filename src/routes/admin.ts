/**
 * Admin Dashboard - Web Interface
 * 
 * Serves a web UI for bot management
 */

import { FastifyInstance } from 'fastify';
import { prisma } from '@/config/database';
import { getQueueStats, addNotificationJob } from '@/config/queue';

/**
 * Register admin routes
 */
export async function adminRoutes(server: FastifyInstance): Promise<void> {
  
  // Admin dashboard HTML
  server.get('/admin', async (request, reply) => {
    const html = generateDashboardHTML();
    return reply.type('text/html').send(html);
  });

  // API: Get stats
  server.get('/api/stats', async () => {
    const [users, transactions, videos, queueStats] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.video.count(),
      getQueueStats(),
    ]);

    const revenue = await prisma.transaction.aggregate({
      where: { status: 'success' },
      _sum: { amountIdr: true },
    });

    return {
      users,
      transactions,
      videos,
      revenue: Number(revenue._sum.amountIdr || 0),
      queue: queueStats,
    };
  });

  // API: List users
  server.get('/api/users', async (request, reply) => {
    const query = request.query as { limit?: string; offset?: string };
    const limit = parseInt(query.limit || '50');
    const offset = parseInt(query.offset || '0');

    const users = await prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: {
        telegramId: true,
        username: true,
        firstName: true,
        tier: true,
        creditBalance: true,
        isBanned: true,
        createdAt: true,
        lastActivityAt: true,
      },
    });

    return users;
  });

  // API: Get user by ID
  server.get('/api/users/:id', async (request, reply) => {
    const params = request.params as { id: string };
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(params.id) },
      include: {
        transactions: { take: 10, orderBy: { createdAt: 'desc' } },
        videos: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return user;
  });

  // API: Grant credits
  server.post('/api/users/:id/credits', async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as { amount: number; reason: string };

    if (!body.amount || body.amount <= 0) {
      return reply.status(400).send({ error: 'Invalid amount' });
    }

    const user = await prisma.user.update({
      where: { telegramId: BigInt(params.id) },
      data: {
        creditBalance: { increment: body.amount },
      },
    });

    return { success: true, newBalance: user.creditBalance };
  });

  // API: Ban/Unban user
  server.post('/api/users/:id/ban', async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as { banned: boolean; reason?: string };

    const user = await prisma.user.update({
      where: { telegramId: BigInt(params.id) },
      data: {
        isBanned: body.banned,
        banReason: body.reason,
        bannedAt: body.banned ? new Date() : null,
      },
    });

    return { success: true, isBanned: user.isBanned };
  });

  // API: List transactions
  server.get('/api/transactions', async (request, reply) => {
    const query = request.query as { status?: string; limit?: string };
    const limit = parseInt(query.limit || '50');

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { telegramId: true, username: true, firstName: true },
        },
      },
    });

    return transactions;
  });

  // API: List videos
  server.get('/api/videos', async (request, reply) => {
    const query = request.query as { status?: string; limit?: string };
    const limit = parseInt(query.limit || '50');

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const videos = await prisma.video.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { telegramId: true, username: true, firstName: true },
        },
      },
    });

    return videos;
  });

  // API: Broadcast message
  server.post('/api/broadcast', async (request, reply) => {
    const body = request.body as { message: string; tier?: string };
    
    if (!body.message) {
      return reply.status(400).send({ error: 'Message required' });
    }

    const where: any = { isBanned: false };
    if (body.tier) {
      where.tier = body.tier;
    }

    const users = await prisma.user.findMany({
      where,
      select: { telegramId: true },
    });

    await addNotificationJob({
      type: 'broadcast',
      message: body.message,
      users: users.map(u => u.telegramId.toString()),
    });

    return { success: true, recipientCount: users.length };
  });

  // API: Get config
  server.get('/api/config', async () => {
    return {
      botToken: process.env.BOT_TOKEN?.slice(0, 20) + '...',
      botUsername: process.env.BOT_USERNAME,
      environment: process.env.NODE_ENV,
      features: {
        videoGeneration: process.env.FEATURE_VIDEO_GENERATION === 'true',
        payment: process.env.FEATURE_PAYMENT === 'true',
        referral: process.env.FEATURE_REFERRAL === 'true',
      },
    };
  });

  // API: Get payment settings
  server.get('/api/payment-settings', async () => {
    const { PaymentSettingsService } = await import('@/services/payment-settings.service');
    const settings = await PaymentSettingsService.getAllSettings();
    const defaultGateway = await PaymentSettingsService.getDefaultGateway();
    return { settings, defaultGateway };
  });

  // API: Update payment settings
  server.post('/api/payment-settings', async (request, reply) => {
    const body = request.body as { action: string; gateway?: string; value?: string };
    const { PaymentSettingsService } = await import('@/services/payment-settings.service');
    
    try {
      if (body.action === 'set_default') {
        await PaymentSettingsService.setDefaultGateway(body.gateway!);
        return { success: true };
      }
      
      if (body.action === 'toggle_gateway') {
        const isEnabled = await PaymentSettingsService.isGatewayEnabled(body.gateway!);
        await PaymentSettingsService.setGatewayEnabled(body.gateway!, !isEnabled);
        return { success: true, enabled: !isEnabled };
      }
      
      return { error: 'Unknown action' };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
}

/**
 * Generate dashboard HTML
 */
function generateDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenClaw SaaS Bot - Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">🤖 OpenClaw SaaS Bot - Admin</h1>
    
    <div class="grid grid-cols-4 gap-4 mb-8">
      <div class="bg-gray-800 p-6 rounded-lg">
        <div class="text-gray-400 text-sm">Users</div>
        <div id="stat-users" class="text-3xl font-bold">-</div>
      </div>
      <div class="bg-gray-800 p-6 rounded-lg">
        <div class="text-gray-400 text-sm">Revenue</div>
        <div id="stat-revenue" class="text-3xl font-bold">-</div>
      </div>
      <div class="bg-gray-800 p-6 rounded-lg">
        <div class="text-gray-400 text-sm">Videos</div>
        <div id="stat-videos" class="text-3xl font-bold">-</div>
      </div>
      <div class="bg-gray-800 p-6 rounded-lg">
        <div class="text-gray-400 text-sm">Queue</div>
        <div id="stat-queue" class="text-3xl font-bold">-</div>
      </div>
    </div>

    <div class="bg-gray-800 p-6 rounded-lg">
      <h2 class="text-xl font-bold mb-4">Recent Users</h2>
      <table class="w-full">
        <thead>
          <tr class="text-left text-gray-400">
            <th class="pb-2">User</th>
            <th class="pb-2">Tier</th>
            <th class="pb-2">Credits</th>
            <th class="pb-2">Status</th>
          </tr>
        </thead>
        <tbody id="users-table"></tbody>
      </table>
    </div>
  </div>

  <script>
    async function loadStats() {
      const res = await fetch('/api/stats');
      const data = await res.json();
      document.getElementById('stat-users').textContent = data.users;
      document.getElementById('stat-revenue').textContent = 'Rp ' + data.revenue.toLocaleString('id-ID');
      document.getElementById('stat-videos').textContent = data.videos;
      document.getElementById('stat-queue').textContent = data.queue.video.waiting;
    }

    async function loadUsers() {
      const res = await fetch('/api/users?limit=10');
      const users = await res.json();
      const tbody = document.getElementById('users-table');
      tbody.innerHTML = users.map(u => '<tr class="border-t border-gray-700"><td class="py-2">' + u.firstName + '</td><td>' + u.tier + '</td><td>' + u.creditBalance + '</td><td>' + (u.isBanned ? 'Banned' : 'Active') + '</td></tr>').join('');
    }

    loadStats();
    loadUsers();
    setInterval(loadStats, 30000);
  </script>
</body>
</html>`;
}
