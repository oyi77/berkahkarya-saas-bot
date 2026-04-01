/**
 * Admin API integration tests
 *
 * Verifies that every admin API endpoint enforces authentication and returns
 * the expected response shape when valid credentials are supplied.
 */

import request from 'supertest';
import fastify from 'fastify';
import crypto from 'crypto';

const TEST_ADMIN_PASSWORD = 'test-admin-password';
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
process.env.NODE_ENV = 'test';

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../../src/config/env', () => ({
  getConfig: jest.fn().mockReturnValue({
    NODE_ENV: 'test',
    ADMIN_PASSWORD: 'test-admin-password',
    BOT_TOKEN: 'test-token:AAtest',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-jwt-secret-for-e2e',
    WEBHOOK_SECRET: 'test-webhook-secret',
    BOT_USERNAME: 'testbot',
    WEBHOOK_URL: 'https://example.com',
    WEB_APP_URL: 'https://example.com',
    FACEBOOK_PIXEL_ID: '',
    GA4_TRACKING_ID: '',
    TIKTOK_PIXEL_ID: '',
  }),
  getConfigForAdmin: jest.fn().mockReturnValue({}),
}));

jest.mock('../../src/config/redis', () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
    publish: jest.fn(),
    pipeline: jest.fn().mockReturnValue({
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
  },
}));

jest.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      count: jest.fn().mockResolvedValue(42),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ telegramId: BigInt(1), creditBalance: 100, isBanned: false }),
    },
    transaction: {
      count: jest.fn().mockResolvedValue(10),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amountIdr: 0 } }),
    },
    video: {
      count: jest.fn().mockResolvedValue(5),
      findMany: jest.fn().mockResolvedValue([]),
    },
    paymentSettings: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({}),
    },
    pricingConfig: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    providerHealth: { findMany: jest.fn().mockResolvedValue([]) },
    $queryRaw: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../src/config/queue', () => ({
  videoQueue: { add: jest.fn() },
  paymentQueue: { add: jest.fn() },
  notificationQueue: { add: jest.fn() },
  billingQueue: { add: jest.fn() },
  cleanupQueue: { add: jest.fn() },
  addNotificationJob: jest.fn(),
  getQueueStats: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 }),
}));

jest.mock('../../src/workers/retention.worker', () => ({
  retentionQueue: { add: jest.fn() },
  RetentionWorker: jest.fn(),
}));

jest.mock('../../src/services/metrics.service', () => ({
  MetricsService: {
    getAll: jest.fn().mockResolvedValue({ metrics: { generation_trial_daily: 0, generation_trial_welcome: 0 } }),
  },
}));

jest.mock('../../src/services/provider-settings.service', () => ({
  ProviderSettingsService: {
    getDynamicSettings: jest.fn().mockResolvedValue({ video: {}, image: {} }),
    getSortedVideoProviders: jest.fn().mockResolvedValue([]),
    getSortedImageProviders: jest.fn().mockResolvedValue([]),
    updateProviderOverride: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../src/services/payment-settings.service', () => ({
  PaymentSettingsService: {
    getAllSettings: jest.fn().mockResolvedValue({}),
    getDefaultGateway: jest.fn().mockResolvedValue('midtrans'),
    isGatewayEnabled: jest.fn().mockResolvedValue(true),
    setGatewayEnabled: jest.fn().mockResolvedValue(undefined),
    setDefaultGateway: jest.fn().mockResolvedValue(undefined),
    getAllPricingByCategory: jest.fn().mockResolvedValue([]),
    setPricingConfig: jest.fn().mockResolvedValue(undefined),
    deletePricingConfig: jest.fn().mockResolvedValue(undefined),
    clearPricingCache: jest.fn(),
    getMarginPercent: jest.fn().mockResolvedValue(30),
    get: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('../../src/services/omniroute.service', () => ({
  getOmniRouteService: jest.fn().mockReturnValue({
    chat: jest.fn().mockResolvedValue({ success: true, content: 'hi' }),
  }),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function adminBasicAuth(password = TEST_ADMIN_PASSWORD): string {
  return `Basic ${Buffer.from(`admin:${password}`).toString('base64')}`;
}

function makeAdminToken(password: string): string {
  return crypto.createHmac('sha256', 'openclaw-admin-v1').update(password).digest('hex');
}

// ── Tests ──────────────────────────────────────────────────────────────────

let adminRoutes: (server: any) => Promise<void>;
let isolatedPrisma: any;

describe('Admin API Endpoints', () => {
  let app: any;

  beforeAll(async () => {
    process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

    await new Promise<void>((resolve) => {
      jest.isolateModules(async () => {
        ({ adminRoutes } = require('../../src/routes/admin'));
        ({ prisma: isolatedPrisma } = require('../../src/config/database'));
        resolve();
      });
    });

    app = fastify({ logger: false });
    app.decorateReply('view', function (this: any, _template: string, _data: any) {
      return this.send('<html>mock</html>');
    });
    await app.register(adminRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Auth guard shared examples ──

  const authGuardedRoutes: Array<{ method: 'get' | 'post' | 'delete'; path: string }> = [
    { method: 'get', path: '/api/stats' },
    { method: 'get', path: '/api/users' },
    { method: 'get', path: '/api/config' },
    { method: 'get', path: '/api/pricing-overview' },
    { method: 'get', path: '/api/referral/pending-cashouts' },
  ];

  describe('authentication guard', () => {
    authGuardedRoutes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} returns 401 without credentials`, async () => {
        const res = await (request(app.server) as any)[method](path);
        expect(res.status).toBe(401);
      });
    });
  });

  // ── GET /api/stats ──

  describe('GET /api/stats', () => {
    it('returns user, transaction, and video counts', async () => {
      const res = await request(app.server)
        .get('/api/stats')
        .set('Authorization', adminBasicAuth());
      expect(res.status).toBe(200);
      expect(typeof res.body.users).toBe('number');
      expect(typeof res.body.transactions).toBe('number');
      expect(typeof res.body.videos).toBe('number');
    });

    it('returns revenue as a number', async () => {
      const res = await request(app.server)
        .get('/api/stats')
        .set('Authorization', adminBasicAuth());
      expect(typeof res.body.revenue).toBe('number');
    });

    it('returns trialStats object with daily and welcome keys', async () => {
      const res = await request(app.server)
        .get('/api/stats')
        .set('Authorization', adminBasicAuth());
      expect(res.body.trialStats).toBeDefined();
      expect(typeof res.body.trialStats.daily).toBe('number');
      expect(typeof res.body.trialStats.welcome).toBe('number');
    });
  });

  // ── GET /api/users ──

  describe('GET /api/users', () => {
    it('returns an array of users', async () => {
      // telegramId must be a plain number/string — BigInt is not JSON-serializable
      isolatedPrisma.user.findMany.mockResolvedValueOnce([
        { telegramId: 1001, username: 'alice', tier: 'free', creditBalance: 5 },
      ]);
      const res = await request(app.server)
        .get('/api/users')
        .set('Authorization', adminBasicAuth());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('respects limit query param (max 200)', async () => {
      isolatedPrisma.user.findMany.mockResolvedValueOnce([]);
      const res = await request(app.server)
        .get('/api/users?limit=300')
        .set('Authorization', adminBasicAuth());
      expect(res.status).toBe(200);
    });
  });

  // ── GET /api/config ──

  describe('GET /api/config', () => {
    it('returns config object', async () => {
      const res = await request(app.server)
        .get('/api/config')
        .set('Authorization', adminBasicAuth());
      expect(res.status).toBe(200);
      expect(typeof res.body).toBe('object');
    });
  });

  // ── GET /api/pricing-overview ──

  describe('GET /api/pricing-overview', () => {
    it('returns pricing sections: packages, subscriptions, videoCosts, imageCosts', async () => {
      const res = await request(app.server)
        .get('/api/pricing-overview')
        .set('Authorization', adminBasicAuth());
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('packages');
      expect(res.body).toHaveProperty('subscriptions');
      expect(res.body).toHaveProperty('videoCosts');
      expect(res.body).toHaveProperty('imageCosts');
    });
  });

  // ── GET /api/referral/pending-cashouts ──

  describe('GET /api/referral/pending-cashouts', () => {
    it('returns an array (even when empty)', async () => {
      isolatedPrisma.transaction.findMany.mockResolvedValueOnce([]);
      const res = await request(app.server)
        .get('/api/referral/pending-cashouts')
        .set('Authorization', adminBasicAuth());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── POST /api/referral/complete-cashout ──

  describe('POST /api/referral/complete-cashout', () => {
    it('returns 401 without credentials', async () => {
      const res = await request(app.server)
        .post('/api/referral/complete-cashout')
        .send({ orderId: 'REF-CASH-123' });
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/payment-settings ──

  describe('GET /api/payment-settings', () => {
    it('returns settings and defaultGateway', async () => {
      const res = await request(app.server)
        .get('/api/payment-settings')
        .set('Authorization', adminBasicAuth());
      expect(res.status).toBe(200);
      expect(res.body.settings).toBeDefined();
      expect(typeof res.body.defaultGateway).toBe('string');
    });
  });

  // ── GET /api/admin/settings/providers ──

  describe('GET /api/admin/settings/providers', () => {
    it('returns provider overrides object', async () => {
      const res = await request(app.server)
        .get('/api/admin/settings/providers')
        .set('Authorization', adminBasicAuth());
      expect(res.status).toBe(200);
      expect(res.body.overrides).toBeDefined();
    });
  });

  // ── Cookie-based auth ──

  describe('cookie-based authentication', () => {
    it('accepts valid admin_token cookie on protected routes', async () => {
      const token = makeAdminToken(TEST_ADMIN_PASSWORD);
      const res = await request(app.server)
        .get('/api/stats')
        .set('Cookie', `admin_token=${token}`);
      expect(res.status).not.toBe(401);
    });

    it('rejects tampered admin_token cookie', async () => {
      const res = await request(app.server)
        .get('/api/stats')
        .set('Cookie', 'admin_token=tampered-value');
      expect(res.status).toBe(401);
    });
  });
});
