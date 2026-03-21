/**
 * Admin Dashboard - Web Interface
 * 
 * Serves a web UI for bot management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/config/database';
import { getQueueStats, addNotificationJob } from '@/config/queue';
import { PaymentSettingsService } from '@/services/payment-settings.service';
import { MetricsService } from '@/services/metrics.service';
import { redis } from '@/config/redis';
import { PROVIDER_CONFIG } from '@/config/providers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!ADMIN_PASSWORD) {
    return reply.status(503).send({ error: 'Admin password not configured' });
  }

  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [, password] = decoded.split(':');
    if (password === ADMIN_PASSWORD) return;
  }

  const cookie = (request.headers.cookie || '').split(';').find(c => c.trim().startsWith('admin_token='));
  if (cookie) {
    const token = cookie.split('=')[1]?.trim();
    if (token === Buffer.from(ADMIN_PASSWORD).toString('base64')) return;
  }

  const query = request.query as Record<string, string>;
  if (query.token === ADMIN_PASSWORD) return;

  reply.status(401).header('WWW-Authenticate', 'Basic realm="Admin"').send({ error: 'Unauthorized' });
}

/**
 * Register admin routes
 */
export async function adminRoutes(server: FastifyInstance): Promise<void> {

  server.addHook('onRequest', async (request, reply) => {
    const url = request.url;
    const isAdminRoute = url === '/admin' || url === '/admin/dashboard' || url === '/admin/pricing' ||
      url.startsWith('/api/stats') || url.startsWith('/api/analytics') ||
      url.startsWith('/api/users') || url.startsWith('/api/transactions') ||
      url.startsWith('/api/videos') || url.startsWith('/api/broadcast') ||
      url.startsWith('/api/config') || url.startsWith('/api/payment-settings') ||
      url.startsWith('/api/pricing') || url.startsWith('/api/provider-costs');
    if (isAdminRoute) {
      await verifyAdmin(request, reply);
    }
  });

  server.get('/admin', async (request, reply) => {
    return reply.type('text/html').send(generateDashboardHTML());
  });

  server.post('/admin/login', async (request, reply) => {
    const { password } = request.body as { password: string };
    if (password === ADMIN_PASSWORD) {
      const token = Buffer.from(ADMIN_PASSWORD).toString('base64');
      return reply
        .header('Set-Cookie', `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`)
        .send({ success: true });
    }
    return reply.status(401).send({ error: 'Wrong password' });
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
      botToken: '***REDACTED***',
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
    const settings = await PaymentSettingsService.getAllSettings();
    const defaultGateway = await PaymentSettingsService.getDefaultGateway();
    return { settings, defaultGateway };
  });

  // API: Update payment settings
  server.post('/api/payment-settings', async (request, reply) => {
    const body = request.body as { action: string; gateway?: string; value?: string };

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

  // ── Pricing Management APIs ──

  server.get('/api/pricing/:category', async (request) => {
    const { category } = request.params as { category: string };
    return PaymentSettingsService.getAllPricingByCategory(category);
  });

  server.post('/api/pricing', async (request, reply) => {
    const { category, key, value } = request.body as { category: string; key: string; value: any };
    if (!category || !key || value === undefined) {
      return reply.status(400).send({ error: 'category, key, and value required' });
    }
    await PaymentSettingsService.setPricingConfig(category, key, value);
    PaymentSettingsService.clearPricingCache();
    return { success: true };
  });

  server.delete('/api/pricing', async (request, reply) => {
    const { category, key } = request.body as { category: string; key: string };
    if (!category || !key) {
      return reply.status(400).send({ error: 'category and key required' });
    }
    await PaymentSettingsService.deletePricingConfig(category, key);
    PaymentSettingsService.clearPricingCache();
    return { success: true };
  });

  server.get('/api/provider-costs', async () => {
    const costs = await PaymentSettingsService.getAllPricingByCategory('provider_cost');
    const margin = await PaymentSettingsService.getMarginPercent();
    return { costs, marginPercent: margin };
  });

  server.get('/api/pricing-overview', async () => {
    const [packages, subscriptions, videoCosts, imageCosts, providerCosts, global] = await Promise.all([
      PaymentSettingsService.getAllPricingByCategory('package'),
      PaymentSettingsService.getAllPricingByCategory('subscription'),
      PaymentSettingsService.getAllPricingByCategory('video_credit'),
      PaymentSettingsService.getAllPricingByCategory('image_credit'),
      PaymentSettingsService.getAllPricingByCategory('provider_cost'),
      PaymentSettingsService.getAllPricingByCategory('global'),
    ]);
    return { packages, subscriptions, videoCosts, imageCosts, providerCosts, global };
  });

  // ── Pricing Dashboard ──

  server.get('/admin/pricing', async (request, reply) => {
    return reply.type('text/html').send(generatePricingDashboardHTML());
  });

  // ── Analytics Dashboard ──

  server.get('/admin/dashboard', async (request, reply) => {
    return reply.type('text/html').send(generateAnalyticsDashboardHTML());
  });

  // API: Analytics data (today's metrics, active users, provider health, top niches, recent errors)
  server.get('/api/analytics', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      metricsData,
      todayGenerations,
      todaySuccessful,
      todayRevenue,
      activeUsers24h,
      topNiches,
      recentErrors,
      providerHealthRows,
      queueStats,
    ] = await Promise.all([
      MetricsService.getAll(),
      prisma.video.count({ where: { createdAt: { gte: today } } }),
      prisma.video.count({ where: { createdAt: { gte: today }, status: 'completed' } }),
      prisma.transaction.aggregate({
        where: { status: 'success', createdAt: { gte: today } },
        _sum: { amountIdr: true },
      }),
      prisma.user.count({
        where: { lastActivityAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.video.groupBy({
        by: ['niche'],
        _count: { niche: true },
        where: { createdAt: { gte: today } },
        orderBy: { _count: { niche: 'desc' } },
        take: 10,
      }),
      prisma.video.findMany({
        where: { status: 'failed', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        select: { jobId: true, errorMessage: true, niche: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.providerHealth.findMany(),
      getQueueStats(),
    ]);

    // Build circuit breaker states from Redis
    const cbStates: Record<string, any> = {};
    const providerKeys = Object.keys(PROVIDER_CONFIG.video);
    for (const key of providerKeys) {
      try {
        const raw = await redis.get(`cb:${key}`);
        if (raw) {
          cbStates[key] = JSON.parse(raw);
        } else {
          cbStates[key] = { state: 'closed', failureCount: 0 };
        }
      } catch (_) {
        cbStates[key] = { state: 'unknown', failureCount: 0 };
      }
    }

    const successRate = todayGenerations > 0
      ? Math.round((todaySuccessful / todayGenerations) * 100)
      : 0;

    return {
      today: {
        generations: todayGenerations,
        successful: todaySuccessful,
        successRate,
        revenue: Number(todayRevenue._sum.amountIdr || 0),
      },
      activeUsers24h,
      topNiches: topNiches.map(n => ({ niche: n.niche, count: n._count.niche })),
      providerHealth: cbStates,
      providerHealthDB: providerHealthRows,
      recentErrors,
      metrics: metricsData,
      queue: queueStats,
    };
  });
}

/**
 * Generate dashboard HTML (legacy admin page)
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
    <h1 class="text-3xl font-bold mb-8">OpenClaw SaaS Bot - Admin</h1>
    <p class="mb-4">
      <a href="/admin/dashboard" class="text-blue-400 underline">Go to Analytics Dashboard</a>
      &nbsp;|&nbsp;
      <a href="/admin/pricing" class="text-blue-400 underline">Pricing Management</a>
    </p>

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

/**
 * Generate the full Analytics Dashboard HTML.
 * Single-page dashboard showing today's metrics, active users,
 * provider health, top niches, and recent errors.
 * Protected by the same admin password as the rest of admin routes.
 */
function generateAnalyticsDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenClaw Analytics Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    h2 { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #94a3b8; }
    .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
    .grid { display: grid; gap: 16px; margin-bottom: 24px; }
    .grid-4 { grid-template-columns: repeat(4, 1fr); }
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 768px) { .grid-4, .grid-3 { grid-template-columns: repeat(2, 1fr); } .grid-2 { grid-template-columns: 1fr; } }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }
    .card-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .card-value { font-size: 28px; font-weight: 700; }
    .card-value.green { color: #4ade80; }
    .card-value.blue { color: #60a5fa; }
    .card-value.yellow { color: #facc15; }
    .card-value.red { color: #f87171; }
    .card-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; padding: 8px 12px; border-bottom: 1px solid #334155; }
    td { padding: 8px 12px; border-bottom: 1px solid #1e293b; font-size: 14px; }
    tr:hover { background: #1e293b; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
    .badge-green { background: #065f46; color: #6ee7b7; }
    .badge-red { background: #7f1d1d; color: #fca5a5; }
    .badge-yellow { background: #713f12; color: #fde68a; }
    .badge-gray { background: #374151; color: #9ca3af; }
    .refresh-btn { background: #334155; border: 1px solid #475569; color: #e2e8f0; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .refresh-btn:hover { background: #475569; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .nav { display: flex; gap: 12px; margin-bottom: 16px; }
    .nav a { color: #60a5fa; text-decoration: none; font-size: 14px; }
    .nav a:hover { text-decoration: underline; }
    #loading { text-align: center; padding: 48px; color: #64748b; }
    .error-msg { font-size: 13px; color: #f87171; word-break: break-all; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .timestamp { font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>OpenClaw Analytics Dashboard</h1>
        <div class="subtitle">Real-time operational metrics and system health</div>
      </div>
      <div>
        <span id="last-updated" class="timestamp"></span>
        <button class="refresh-btn" onclick="loadAll()">Refresh</button>
      </div>
    </div>

    <div class="nav">
      <a href="/admin">Admin Panel</a>
      <a href="/admin/dashboard">Analytics</a>
      <a href="/admin/pricing">Pricing</a>
    </div>

    <div id="loading">Loading analytics...</div>
    <div id="content" style="display:none">

      <!-- Today's Metrics -->
      <h2>Today's Metrics</h2>
      <div class="grid grid-4">
        <div class="card">
          <div class="card-label">Generations</div>
          <div class="card-value blue" id="m-generations">-</div>
          <div class="card-sub" id="m-gen-sub"></div>
        </div>
        <div class="card">
          <div class="card-label">Success Rate</div>
          <div class="card-value green" id="m-success-rate">-</div>
          <div class="card-sub" id="m-success-sub"></div>
        </div>
        <div class="card">
          <div class="card-label">Revenue Today</div>
          <div class="card-value yellow" id="m-revenue">-</div>
        </div>
        <div class="card">
          <div class="card-label">Active Users (24h)</div>
          <div class="card-value blue" id="m-active-users">-</div>
        </div>
      </div>

      <!-- Queue Status -->
      <h2>Queue Status</h2>
      <div class="grid grid-4">
        <div class="card">
          <div class="card-label">Video Queue</div>
          <div class="card-value" id="q-video">-</div>
          <div class="card-sub" id="q-video-sub"></div>
        </div>
        <div class="card">
          <div class="card-label">Payment Queue</div>
          <div class="card-value" id="q-payment">-</div>
        </div>
        <div class="card">
          <div class="card-label">Notification Queue</div>
          <div class="card-value" id="q-notification">-</div>
        </div>
        <div class="card">
          <div class="card-label">Cleanup Queue</div>
          <div class="card-value" id="q-cleanup">-</div>
        </div>
      </div>

      <!-- Provider Health + Top Niches -->
      <div class="grid grid-2">
        <div class="card">
          <h2>Provider Health</h2>
          <table>
            <thead><tr><th>Provider</th><th>State</th><th>Failures</th></tr></thead>
            <tbody id="provider-table"></tbody>
          </table>
        </div>
        <div class="card">
          <h2>Top Niches (Today)</h2>
          <table>
            <thead><tr><th>Niche</th><th>Count</th><th>Share</th></tr></thead>
            <tbody id="niche-table"></tbody>
          </table>
        </div>
      </div>

      <!-- Recent Errors -->
      <div class="card" style="margin-top:16px">
        <h2>Recent Errors (24h)</h2>
        <table>
          <thead><tr><th>Time</th><th>Job ID</th><th>Niche</th><th>Error</th></tr></thead>
          <tbody id="error-table"></tbody>
        </table>
        <div id="no-errors" style="display:none;padding:16px;text-align:center;color:#64748b">No errors in the last 24 hours</div>
      </div>

      <!-- Redis Metrics -->
      <div class="card" style="margin-top:16px">
        <h2>Redis Metrics (Raw)</h2>
        <pre id="redis-metrics" style="font-size:13px;color:#94a3b8;overflow-x:auto;white-space:pre-wrap"></pre>
      </div>

    </div>
  </div>

  <script>
    function cbBadge(state) {
      if (state === 'closed') return '<span class="badge badge-green">CLOSED</span>';
      if (state === 'open') return '<span class="badge badge-red">OPEN</span>';
      if (state === 'half-open') return '<span class="badge badge-yellow">HALF-OPEN</span>';
      return '<span class="badge badge-gray">' + state.toUpperCase() + '</span>';
    }

    function fmtTime(iso) {
      try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
      catch { return '-'; }
    }

    async function loadAll() {
      try {
        const res = await fetch('/api/analytics');
        if (res.status === 401) { window.location.href = '/admin'; return; }
        const d = await res.json();

        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';

        // Today's metrics
        document.getElementById('m-generations').textContent = d.today.generations;
        document.getElementById('m-gen-sub').textContent = d.today.successful + ' successful';
        document.getElementById('m-success-rate').textContent = d.today.successRate + '%';
        document.getElementById('m-success-sub').textContent = d.today.successful + ' / ' + d.today.generations;
        document.getElementById('m-revenue').textContent = 'Rp ' + d.today.revenue.toLocaleString('id-ID');
        document.getElementById('m-active-users').textContent = d.activeUsers24h;

        // Queue
        var q = d.queue;
        document.getElementById('q-video').textContent = q.video.waiting + ' waiting';
        document.getElementById('q-video-sub').textContent = q.video.active + ' active, ' + q.video.failed + ' failed';
        document.getElementById('q-payment').textContent = q.payment.waiting + ' waiting';
        document.getElementById('q-notification').textContent = q.notification.waiting + ' waiting';
        document.getElementById('q-cleanup').textContent = (q.cleanup ? q.cleanup.completed : 0) + ' completed';

        // Provider health
        var ph = d.providerHealth || {};
        var rows = '';
        for (var key in ph) {
          var p = ph[key];
          rows += '<tr><td>' + key + '</td><td>' + cbBadge(p.state || 'closed') + '</td><td>' + (p.failureCount || 0) + '</td></tr>';
        }
        document.getElementById('provider-table').innerHTML = rows || '<tr><td colspan="3" style="color:#64748b">No provider data</td></tr>';

        // Top niches
        var total = d.topNiches.reduce(function(s, n) { return s + n.count; }, 0);
        var nicheRows = '';
        d.topNiches.forEach(function(n) {
          var pct = total > 0 ? Math.round((n.count / total) * 100) : 0;
          nicheRows += '<tr><td>' + n.niche + '</td><td>' + n.count + '</td><td>' + pct + '%</td></tr>';
        });
        document.getElementById('niche-table').innerHTML = nicheRows || '<tr><td colspan="3" style="color:#64748b">No data today</td></tr>';

        // Recent errors
        if (d.recentErrors && d.recentErrors.length > 0) {
          var errRows = '';
          d.recentErrors.forEach(function(e) {
            errRows += '<tr><td class="timestamp">' + fmtTime(e.createdAt) + '</td><td style="font-family:monospace;font-size:12px">' + (e.jobId || '-') + '</td><td>' + (e.niche || '-') + '</td><td class="error-msg" title="' + (e.errorMessage || '').replace(/"/g, '&quot;') + '">' + (e.errorMessage || 'Unknown error') + '</td></tr>';
          });
          document.getElementById('error-table').innerHTML = errRows;
          document.getElementById('no-errors').style.display = 'none';
        } else {
          document.getElementById('error-table').innerHTML = '';
          document.getElementById('no-errors').style.display = 'block';
        }

        // Redis metrics
        var m = d.metrics && d.metrics.metrics ? d.metrics.metrics : {};
        document.getElementById('redis-metrics').textContent = JSON.stringify(m, null, 2);

        document.getElementById('last-updated').textContent = 'Updated: ' + new Date().toLocaleTimeString();
      } catch (err) {
        console.error('Failed to load analytics:', err);
        document.getElementById('loading').textContent = 'Failed to load analytics. Check auth.';
      }
    }

    loadAll();
    setInterval(loadAll, 30000);
  </script>
</body>
</html>`;
}

/**
 * Generate the Pricing Management Dashboard HTML.
 * Admin page for managing credit packages, subscriptions,
 * provider costs, and global pricing settings.
 */
function generatePricingDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenClaw Pricing Management</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    h2 { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #94a3b8; }
    .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .nav { display: flex; gap: 12px; margin-bottom: 16px; }
    .nav a { color: #60a5fa; text-decoration: none; font-size: 14px; }
    .nav a.active { color: #e2e8f0; font-weight: 600; }
    .nav a:hover { text-decoration: underline; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; padding: 8px 12px; border-bottom: 1px solid #334155; }
    td { padding: 8px 12px; border-bottom: 1px solid #1e293b; font-size: 14px; vertical-align: middle; }
    tr:hover { background: rgba(51, 65, 85, 0.3); }
    input[type="text"], input[type="number"] {
      background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 6px 10px;
      border-radius: 6px; font-size: 13px; width: 100%;
    }
    input[type="text"]:focus, input[type="number"]:focus { outline: none; border-color: #60a5fa; }
    select {
      background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 6px 10px;
      border-radius: 6px; font-size: 13px;
    }
    .btn { padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; border: none; font-weight: 500; }
    .btn-primary { background: #3b82f6; color: #fff; }
    .btn-primary:hover { background: #2563eb; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-danger:hover { background: #b91c1c; }
    .btn-success { background: #16a34a; color: #fff; }
    .btn-success:hover { background: #15803d; }
    .btn-secondary { background: #334155; color: #e2e8f0; border: 1px solid #475569; }
    .btn-secondary:hover { background: #475569; }
    .btn-group { display: flex; gap: 6px; }
    .global-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .global-field { display: flex; flex-direction: column; gap: 6px; }
    .global-field label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .toast {
      position: fixed; bottom: 24px; right: 24px; padding: 12px 24px; border-radius: 8px;
      font-size: 14px; z-index: 9999; transition: opacity 0.3s; opacity: 0;
    }
    .toast.show { opacity: 1; }
    .toast.success { background: #065f46; color: #6ee7b7; border: 1px solid #047857; }
    .toast.error { background: #7f1d1d; color: #fca5a5; border: 1px solid #991b1b; }
    #loading { text-align: center; padding: 48px; color: #64748b; }
    @media (max-width: 768px) { .global-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Pricing Management</h1>
        <div class="subtitle">Manage credit packages, subscriptions, and provider costs</div>
      </div>
    </div>

    <div class="nav">
      <a href="/admin">Admin Panel</a>
      <a href="/admin/dashboard">Analytics</a>
      <a href="/admin/pricing" class="active">Pricing</a>
    </div>

    <div id="loading">Loading pricing data...</div>
    <div id="content" style="display:none">

      <!-- Section 1: Global Settings -->
      <div class="card">
        <h2>Global Settings</h2>
        <div class="global-grid">
          <div class="global-field">
            <label>Margin Percent (%)</label>
            <input type="number" id="global-margin" step="0.1" min="0" />
          </div>
          <div class="global-field">
            <label>Default Image Credit Cost</label>
            <input type="number" id="global-image-cost" step="1" min="0" />
          </div>
        </div>
        <div style="margin-top:16px">
          <button class="btn btn-primary" onclick="saveGlobalSettings()">Save Global Settings</button>
        </div>
      </div>

      <!-- Section 2: Credit Packages -->
      <div class="card">
        <h2>Credit Packages</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price (IDR)</th>
              <th>Credits</th>
              <th>Bonus</th>
              <th>Popular</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="packages-table"></tbody>
        </table>
        <div style="margin-top:12px">
          <button class="btn btn-secondary" onclick="addPackageRow()">+ Add Package</button>
        </div>
      </div>

      <!-- Section 3: Subscription Plans -->
      <div class="card">
        <h2>Subscription Plans</h2>
        <table>
          <thead>
            <tr>
              <th>Plan Key</th>
              <th>Name</th>
              <th>Monthly (IDR)</th>
              <th>Yearly (IDR)</th>
              <th>Monthly Credits</th>
              <th>Daily Limit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="subscriptions-table"></tbody>
        </table>
        <div style="margin-top:12px">
          <button class="btn btn-secondary" onclick="addSubscriptionRow()">+ Add Plan</button>
        </div>
      </div>

      <!-- Section 4: Provider Costs -->
      <div class="card">
        <h2>Provider Costs</h2>
        <table>
          <thead>
            <tr>
              <th>Provider Key</th>
              <th>Cost (USD)</th>
              <th>Calculated Credit Cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="provider-costs-table"></tbody>
        </table>
        <div style="margin-top:12px">
          <button class="btn btn-secondary" onclick="addProviderCostRow()">+ Add Provider</button>
        </div>
      </div>

      <!-- Section 5: Video/Image Credit Costs -->
      <div class="card">
        <h2>Video Credit Costs</h2>
        <table>
          <thead>
            <tr>
              <th>Duration (seconds)</th>
              <th>Credits</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="video-costs-table"></tbody>
        </table>
        <div style="margin-top:12px">
          <button class="btn btn-secondary" onclick="addVideoCostRow()">+ Add Duration</button>
        </div>
      </div>

      <div class="card">
        <h2>Image Credit Costs</h2>
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Credits</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="image-costs-table"></tbody>
        </table>
        <div style="margin-top:12px">
          <button class="btn btn-secondary" onclick="addImageCostRow()">+ Add Image Cost</button>
        </div>
      </div>

    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    var pricingData = {};
    var currentMargin = 30;

    function showToast(msg, type) {
      var t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast show ' + (type || 'success');
      setTimeout(function() { t.className = 'toast'; }, 3000);
    }

    async function apiCall(method, url, body) {
      try {
        var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        var res = await fetch(url, opts);
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
      } catch (err) {
        showToast(err.message, 'error');
        throw err;
      }
    }

    async function loadAll() {
      try {
        var res = await fetch('/api/pricing-overview');
        if (res.status === 401) { window.location.href = '/admin'; return; }
        pricingData = await res.json();

        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';

        // Global settings
        var g = pricingData.global || {};
        currentMargin = g.margin_percent !== undefined ? g.margin_percent : 30;
        document.getElementById('global-margin').value = currentMargin;
        document.getElementById('global-image-cost').value = g.default_image_credit_cost || 1;

        // Packages
        renderPackages(pricingData.packages || {});

        // Subscriptions
        renderSubscriptions(pricingData.subscriptions || {});

        // Provider costs
        renderProviderCosts(pricingData.providerCosts || {});

        // Video costs
        renderCostTable(pricingData.videoCosts || {}, 'video-costs-table', 'video_credit');

        // Image costs
        renderCostTable(pricingData.imageCosts || {}, 'image-costs-table', 'image_credit');

      } catch (err) {
        console.error('Failed to load pricing:', err);
        document.getElementById('loading').textContent = 'Failed to load pricing data. Check auth.';
      }
    }

    async function saveGlobalSettings() {
      var margin = parseFloat(document.getElementById('global-margin').value);
      var imgCost = parseInt(document.getElementById('global-image-cost').value);
      try {
        await apiCall('POST', '/api/pricing', { category: 'global', key: 'margin_percent', value: margin });
        await apiCall('POST', '/api/pricing', { category: 'global', key: 'default_image_credit_cost', value: imgCost });
        currentMargin = margin;
        showToast('Global settings saved');
        renderProviderCosts(pricingData.providerCosts || {});
      } catch (_) {}
    }

    // ── Packages ──
    function renderPackages(pkgs) {
      var tbody = document.getElementById('packages-table');
      var rows = '';
      for (var key in pkgs) {
        var p = typeof pkgs[key] === 'object' ? pkgs[key] : {};
        rows += packageRow(key, p);
      }
      tbody.innerHTML = rows;
    }

    function packageRow(key, p) {
      return '<tr data-key="' + key + '" data-category="package">'
        + '<td><input type="text" class="pk-id" value="' + esc(key) + '" /></td>'
        + '<td><input type="text" class="pk-name" value="' + esc(p.name || '') + '" /></td>'
        + '<td><input type="number" class="pk-price" value="' + (p.price || 0) + '" /></td>'
        + '<td><input type="number" class="pk-credits" value="' + (p.credits || 0) + '" /></td>'
        + '<td><input type="number" class="pk-bonus" value="' + (p.bonus || 0) + '" /></td>'
        + '<td><select class="pk-popular"><option value="false"' + (!p.popular ? ' selected' : '') + '>No</option><option value="true"' + (p.popular ? ' selected' : '') + '>Yes</option></select></td>'
        + '<td><div class="btn-group">'
        + '<button class="btn btn-primary" onclick="savePackage(this)">Save</button>'
        + '<button class="btn btn-danger" onclick="deleteRow(this, \'package\')">Delete</button>'
        + '</div></td></tr>';
    }

    function addPackageRow() {
      var tbody = document.getElementById('packages-table');
      tbody.insertAdjacentHTML('beforeend', packageRow('new_package', {}));
    }

    async function savePackage(btn) {
      var tr = btn.closest('tr');
      var key = tr.querySelector('.pk-id').value.trim();
      var val = {
        name: tr.querySelector('.pk-name').value.trim(),
        price: parseInt(tr.querySelector('.pk-price').value),
        credits: parseInt(tr.querySelector('.pk-credits').value),
        bonus: parseInt(tr.querySelector('.pk-bonus').value),
        popular: tr.querySelector('.pk-popular').value === 'true',
      };
      await apiCall('POST', '/api/pricing', { category: 'package', key: key, value: val });
      showToast('Package "' + key + '" saved');
      tr.setAttribute('data-key', key);
    }

    // ── Subscriptions ──
    function renderSubscriptions(subs) {
      var tbody = document.getElementById('subscriptions-table');
      var rows = '';
      for (var key in subs) {
        var s = typeof subs[key] === 'object' ? subs[key] : {};
        rows += subscriptionRow(key, s);
      }
      tbody.innerHTML = rows;
    }

    function subscriptionRow(key, s) {
      return '<tr data-key="' + key + '" data-category="subscription">'
        + '<td><input type="text" class="sub-key" value="' + esc(key) + '" /></td>'
        + '<td><input type="text" class="sub-name" value="' + esc(s.name || '') + '" /></td>'
        + '<td><input type="number" class="sub-monthly" value="' + (s.monthlyPrice || 0) + '" /></td>'
        + '<td><input type="number" class="sub-yearly" value="' + (s.yearlyPrice || 0) + '" /></td>'
        + '<td><input type="number" class="sub-credits" value="' + (s.monthlyCredits || 0) + '" /></td>'
        + '<td><input type="number" class="sub-daily" value="' + (s.dailyLimit || 0) + '" /></td>'
        + '<td><div class="btn-group">'
        + '<button class="btn btn-primary" onclick="saveSubscription(this)">Save</button>'
        + '<button class="btn btn-danger" onclick="deleteRow(this, \'subscription\')">Delete</button>'
        + '</div></td></tr>';
    }

    function addSubscriptionRow() {
      var tbody = document.getElementById('subscriptions-table');
      tbody.insertAdjacentHTML('beforeend', subscriptionRow('new_plan', {}));
    }

    async function saveSubscription(btn) {
      var tr = btn.closest('tr');
      var key = tr.querySelector('.sub-key').value.trim();
      var val = {
        name: tr.querySelector('.sub-name').value.trim(),
        monthlyPrice: parseInt(tr.querySelector('.sub-monthly').value),
        yearlyPrice: parseInt(tr.querySelector('.sub-yearly').value),
        monthlyCredits: parseInt(tr.querySelector('.sub-credits').value),
        dailyLimit: parseInt(tr.querySelector('.sub-daily').value),
      };
      await apiCall('POST', '/api/pricing', { category: 'subscription', key: key, value: val });
      showToast('Subscription "' + key + '" saved');
      tr.setAttribute('data-key', key);
    }

    // ── Provider Costs ──
    function renderProviderCosts(costs) {
      var tbody = document.getElementById('provider-costs-table');
      var rows = '';
      for (var key in costs) {
        var cost = typeof costs[key] === 'number' ? costs[key] : (costs[key] && costs[key].cost ? costs[key].cost : 0);
        var creditCost = Math.ceil(cost * (1 + currentMargin / 100) * 100) / 100;
        rows += '<tr data-key="' + key + '" data-category="provider_cost">'
          + '<td><input type="text" class="pc-key" value="' + esc(key) + '" /></td>'
          + '<td><input type="number" class="pc-cost" step="0.001" value="' + cost + '" oninput="updateCalcCost(this)" /></td>'
          + '<td class="pc-calc" style="color:#facc15">' + creditCost.toFixed(2) + '</td>'
          + '<td><div class="btn-group">'
          + '<button class="btn btn-primary" onclick="saveProviderCost(this)">Save</button>'
          + '<button class="btn btn-danger" onclick="deleteRow(this, \'provider_cost\')">Delete</button>'
          + '</div></td></tr>';
      }
      tbody.innerHTML = rows;
    }

    function updateCalcCost(input) {
      var tr = input.closest('tr');
      var cost = parseFloat(input.value) || 0;
      var calc = Math.ceil(cost * (1 + currentMargin / 100) * 100) / 100;
      tr.querySelector('.pc-calc').textContent = calc.toFixed(2);
    }

    function addProviderCostRow() {
      var tbody = document.getElementById('provider-costs-table');
      tbody.insertAdjacentHTML('beforeend',
        '<tr data-key="" data-category="provider_cost">'
        + '<td><input type="text" class="pc-key" value="" placeholder="provider_key" /></td>'
        + '<td><input type="number" class="pc-cost" step="0.001" value="0" oninput="updateCalcCost(this)" /></td>'
        + '<td class="pc-calc" style="color:#facc15">0.00</td>'
        + '<td><div class="btn-group">'
        + '<button class="btn btn-primary" onclick="saveProviderCost(this)">Save</button>'
        + '<button class="btn btn-danger" onclick="deleteRow(this, \'provider_cost\')">Delete</button>'
        + '</div></td></tr>'
      );
    }

    async function saveProviderCost(btn) {
      var tr = btn.closest('tr');
      var key = tr.querySelector('.pc-key').value.trim();
      var cost = parseFloat(tr.querySelector('.pc-cost').value);
      await apiCall('POST', '/api/pricing', { category: 'provider_cost', key: key, value: cost });
      showToast('Provider cost "' + key + '" saved');
      tr.setAttribute('data-key', key);
    }

    // ── Video/Image Credit Costs ──
    function renderCostTable(costs, tableId, category) {
      var tbody = document.getElementById(tableId);
      var rows = '';
      for (var key in costs) {
        var val = typeof costs[key] === 'number' ? costs[key] : 0;
        rows += '<tr data-key="' + key + '" data-category="' + category + '">'
          + '<td><input type="text" class="cc-key" value="' + esc(key) + '" /></td>'
          + '<td><input type="number" class="cc-val" value="' + val + '" /></td>'
          + '<td><div class="btn-group">'
          + '<button class="btn btn-primary" onclick="saveCostRow(this, \\'' + category + '\\')">Save</button>'
          + '<button class="btn btn-danger" onclick="deleteRow(this, \\'' + category + '\\')">Delete</button>'
          + '</div></td></tr>';
      }
      tbody.innerHTML = rows;
    }

    function addVideoCostRow() { addCostRow('video-costs-table', 'video_credit'); }
    function addImageCostRow() { addCostRow('image-costs-table', 'image_credit'); }

    function addCostRow(tableId, category) {
      var tbody = document.getElementById(tableId);
      tbody.insertAdjacentHTML('beforeend',
        '<tr data-key="" data-category="' + category + '">'
        + '<td><input type="text" class="cc-key" value="" placeholder="key" /></td>'
        + '<td><input type="number" class="cc-val" value="0" /></td>'
        + '<td><div class="btn-group">'
        + '<button class="btn btn-primary" onclick="saveCostRow(this, \\'' + category + '\\')">Save</button>'
        + '<button class="btn btn-danger" onclick="deleteRow(this, \\'' + category + '\\')">Delete</button>'
        + '</div></td></tr>'
      );
    }

    async function saveCostRow(btn, category) {
      var tr = btn.closest('tr');
      var key = tr.querySelector('.cc-key').value.trim();
      var val = parseInt(tr.querySelector('.cc-val').value);
      await apiCall('POST', '/api/pricing', { category: category, key: key, value: val });
      showToast('Cost "' + key + '" saved');
      tr.setAttribute('data-key', key);
    }

    // ── Shared ──
    async function deleteRow(btn, category) {
      var tr = btn.closest('tr');
      var key = tr.getAttribute('data-key') || tr.querySelector('input').value.trim();
      if (!key || key === 'new_package' || key === 'new_plan') {
        tr.remove();
        return;
      }
      if (!confirm('Delete "' + key + '" from ' + category + '?')) return;
      try {
        await apiCall('DELETE', '/api/pricing', { category: category, key: key });
        showToast('Deleted "' + key + '"');
        tr.remove();
      } catch (_) {}
    }

    function esc(s) {
      return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    loadAll();
  </script>
</body>
</html>`;
}
