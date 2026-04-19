import request from 'supertest';
import fastify from 'fastify';

const TEST_ADMIN_PASSWORD = 'test-admin-password';
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const mockInvalidateCache = jest.fn().mockResolvedValue(undefined);
const mockGetRecentEvents = jest.fn().mockResolvedValue([
  {
    id: BigInt(1),
    userId: BigInt(123),
    eventType: 'user_message',
    content: 'hello',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
]);
const mockDeliverMedia = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../src/services/intercept.service.js', () => ({
  InterceptService: {
    invalidateCache: mockInvalidateCache,
    getRecentEvents: mockGetRecentEvents,
    deliverMedia: mockDeliverMedia,
  },
}));

jest.mock('../../../src/config/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    publish: jest.fn().mockResolvedValue(1),
    multi: jest.fn().mockReturnValue({
      del: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
  },
}));

const mockUserFindMany = jest.fn().mockResolvedValue([
  {
    telegramId: BigInt(123),
    firstName: 'John',
    username: 'john',
    tier: 'pro',
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
]);
const mockUserUpdate = jest.fn().mockResolvedValue({ isIntercepted: true });

jest.mock('../../../src/config/database', () => ({
  prisma: {
    user: {
      count: jest.fn().mockResolvedValue(0),
      findMany: mockUserFindMany,
      findUnique: jest.fn().mockResolvedValue(null),
      update: mockUserUpdate,
    },
    transaction: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amountIdr: 0 } }),
    },
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

describe('Admin interception routes', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindMany.mockResolvedValue([
      {
        telegramId: BigInt(123),
        firstName: 'John',
        username: 'john',
        tier: 'pro',
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    mockUserUpdate.mockResolvedValue({ isIntercepted: true });
    mockGetRecentEvents.mockResolvedValue([
      {
        id: BigInt(1),
        userId: BigInt(123),
        eventType: 'user_message',
        content: 'hello',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
  });

  it('lists intercepted users with stringified telegramId', async () => {
    const res = await request(app.server)
      .get('/api/intercept/users')
      .set('Authorization', adminBasicAuth());

    expect(res.status).toBe(200);
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isIntercepted: true } }),
    );
    expect(res.body[0]).toMatchObject({ telegramId: '123', firstName: 'John' });
  });

  it('toggles intercept flag and invalidates cache', async () => {
    const res = await request(app.server)
      .post('/api/intercept/toggle')
      .set('Authorization', adminBasicAuth())
      .send({ telegramId: '123', enabled: true });

    expect(res.status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { telegramId: BigInt(123) },
      data: { isIntercepted: true },
    });
    expect(mockInvalidateCache).toHaveBeenCalledWith(BigInt(123));
  });

  it('returns 400 when toggling intercept without telegramId', async () => {
    const res = await request(app.server)
      .post('/api/intercept/toggle')
      .set('Authorization', adminBasicAuth())
      .send({ enabled: true });

    expect(res.status).toBe(400);
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(mockInvalidateCache).not.toHaveBeenCalled();
  });

  it('returns mapped recent events with string IDs', async () => {
    const res = await request(app.server)
      .get('/api/intercept/events/123')
      .set('Authorization', adminBasicAuth());

    expect(res.status).toBe(200);
    expect(mockGetRecentEvents).toHaveBeenCalledWith(BigInt(123), 100);
    expect(res.body[0]).toMatchObject({
      id: '1',
      userId: '123',
      eventType: 'user_message',
    });
  });

  it('delivers media to waiting interception job', async () => {
    const payload = {
      jobId: 'job-1',
      mediaUrl: 'https://cdn.example.com/out.mp4',
      mediaType: 'video',
    };

    const res = await request(app.server)
      .post('/api/intercept/deliver')
      .set('Authorization', adminBasicAuth())
      .send(payload);

    expect(res.status).toBe(200);
    expect(mockDeliverMedia).toHaveBeenCalledWith(
      payload.jobId,
      payload.mediaUrl,
      payload.mediaType,
    );
  });

  it('returns 400 when deliver payload is incomplete', async () => {
    const res = await request(app.server)
      .post('/api/intercept/deliver')
      .set('Authorization', adminBasicAuth())
      .send({ jobId: 'job-1' });

    expect(res.status).toBe(400);
    expect(mockDeliverMedia).not.toHaveBeenCalled();
  });
});
