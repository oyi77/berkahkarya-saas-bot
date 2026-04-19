import request from 'supertest';
import fastify from 'fastify';

const TEST_ADMIN_PASSWORD = 'test-admin-password';
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const mockMultiExec = jest.fn().mockResolvedValue([]);
const mockMultiDel = jest.fn().mockReturnThis();
const mockMulti = jest.fn().mockReturnValue({
  del: mockMultiDel,
  exec: mockMultiExec,
});
const mockPublish = jest.fn().mockResolvedValue(1);

jest.mock('../../../src/config/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    publish: mockPublish,
    multi: mockMulti,
  },
}));

jest.mock('../../../src/config/database', () => ({
  prisma: {
    user: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null) },
    transaction: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]), aggregate: jest.fn().mockResolvedValue({ _sum: { amountIdr: 0 } }) },
    video: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
    paymentSettings: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null) },
    pricingConfig: { findMany: jest.fn().mockResolvedValue([]) },
    providerHealth: { findMany: jest.fn().mockResolvedValue([]) },
    $queryRaw: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../../src/config/queue', () => ({
  videoQueue: { add: jest.fn() },
  paymentQueue: { add: jest.fn() },
  notificationQueue: { add: jest.fn() },
  billingQueue: { add: jest.fn() },
  cleanupQueue: { add: jest.fn() },
  addNotificationJob: jest.fn(),
  getQueueStats: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 }),
}));

jest.mock('../../../src/workers/retention.worker', () => ({
  retentionQueue: { add: jest.fn() },
  RetentionWorker: jest.fn(),
}));

jest.mock('../../../src/config/env', () => ({
  getConfig: jest.fn().mockReturnValue({
    NODE_ENV: 'test',
    ADMIN_PASSWORD: TEST_ADMIN_PASSWORD,
    BOT_TOKEN: 'test-token:AAtest',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-jwt-secret',
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

function adminBasicAuth(password = TEST_ADMIN_PASSWORD): string {
  return `Basic ${Buffer.from(`admin:${password}`).toString('base64')}`;
}

let adminRoutes: (server: any) => Promise<void>;

describe('Admin provider CB reset', () => {
  let app: any;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      jest.isolateModules(async () => {
        ({ adminRoutes } = require('../../../src/routes/admin'));
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

  it('uses atomic multi-del and publishes reset event', async () => {
    const res = await request(app.server)
      .post('/api/admin/providers/xai/reset-cb')
      .set('Authorization', adminBasicAuth());

    expect(res.status).toBe(200);
    expect(mockMulti).toHaveBeenCalledTimes(1);
    expect(mockMultiDel).toHaveBeenCalledWith('cb:xai');
    expect(mockMultiDel).toHaveBeenCalledWith('provider:history:xai:success');
    expect(mockMultiDel).toHaveBeenCalledWith('provider:history:xai:failure');
    expect(mockMultiExec).toHaveBeenCalledTimes(1);
    expect(mockPublish).toHaveBeenCalledWith(
      'admin_events',
      expect.stringContaining('provider_cb_reset'),
    );
  });
});
