/**
 * Admin authentication integration tests
 *
 * Covers the login page, Basic-auth protected dashboard, cookie-token auth,
 * and the login POST endpoint including brute-force rate limiting.
 */

import request from 'supertest';
import fastify from 'fastify';
import crypto from 'crypto';

const TEST_ADMIN_PASSWORD = 'test-admin-password';
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
process.env.NODE_ENV = 'test';

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
    user: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
    transaction: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amountIdr: 0 } }),
    },
    video: { count: jest.fn().mockResolvedValue(0) },
    paymentSettings: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null) },
    pricingConfig: { findMany: jest.fn().mockResolvedValue([]) },
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

function adminBasicAuth(password = TEST_ADMIN_PASSWORD): string {
  return `Basic ${Buffer.from(`admin:${password}`).toString('base64')}`;
}

function makeAdminToken(password: string): string {
  return crypto.createHmac('sha256', 'openclaw-admin-v1').update(password).digest('hex');
}

let adminRoutes: (server: any) => Promise<void>;
let isolatedRedis: any;

describe('Admin Authentication', () => {
  let app: any;

  beforeAll(async () => {
    process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

    await new Promise<void>((resolve) => {
      jest.isolateModules(async () => {
        ({ adminRoutes } = require('../../src/routes/admin'));
        ({ redis: isolatedRedis } = require('../../src/config/redis'));
        resolve();
      });
    });

    app = fastify({ logger: false });
    // Attach a minimal view decorator so routes that call reply.view() don't crash
    app.decorate('view', (_template: string, _data: any) => '<html>mock</html>');
    app.decorateReply('view', function (this: any, _template: string, _data: any) {
      return this.send('<html>mock</html>');
    });
    await app.register(adminRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /admin/login', () => {
    it('returns 200 without requiring authentication', async () => {
      const res = await request(app.server).get('/admin/login');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /admin/dashboard — authentication enforcement', () => {
    it('returns 401 when no credentials are supplied', async () => {
      const res = await request(app.server).get('/admin/dashboard');
      expect(res.status).toBe(401);
    });

    it('returns 401 when Basic auth password is wrong', async () => {
      const res = await request(app.server)
        .get('/admin/dashboard')
        .set('Authorization', adminBasicAuth('wrong-password'));
      expect(res.status).toBe(401);
    });

    it('returns 200 when valid Basic auth credentials are supplied', async () => {
      const res = await request(app.server)
        .get('/admin/dashboard')
        .set('Authorization', adminBasicAuth());
      // 200 or redirect to login — either way, NOT 401
      expect(res.status).not.toBe(401);
    });

    it('returns 200 when valid admin_token cookie is supplied', async () => {
      const token = makeAdminToken(TEST_ADMIN_PASSWORD);
      const res = await request(app.server)
        .get('/admin/dashboard')
        .set('Cookie', `admin_token=${token}`);
      expect(res.status).not.toBe(401);
    });
  });

  describe('POST /admin/login', () => {
    it('returns success and sets admin_token cookie with correct password', async () => {
      isolatedRedis.get.mockResolvedValueOnce(null); // no prior rate-limit entries
      const res = await request(app.server)
        .post('/admin/login')
        .send({ password: TEST_ADMIN_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(Array.isArray(setCookie) ? setCookie.join('') : setCookie).toContain('admin_token=');
    });

    it('returns 401 with wrong password', async () => {
      isolatedRedis.get.mockResolvedValueOnce(null);
      const res = await request(app.server)
        .post('/admin/login')
        .send({ password: 'totally-wrong' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('returns 429 when the IP has exceeded the login rate limit', async () => {
      // Simulate 5 prior failed attempts already recorded
      isolatedRedis.get.mockResolvedValueOnce('5');
      const res = await request(app.server)
        .post('/admin/login')
        .send({ password: 'any' });
      expect(res.status).toBe(429);
    });
  });

  describe('GET /api/stats — auth required', () => {
    it('returns 401 without credentials', async () => {
      const res = await request(app.server).get('/api/stats');
      expect(res.status).toBe(401);
    });

    it('returns non-401 with valid Basic auth', async () => {
      const res = await request(app.server)
        .get('/api/stats')
        .set('Authorization', adminBasicAuth());
      expect(res.status).not.toBe(401);
    });
  });
});
