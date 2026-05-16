import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  publish: jest.fn(),
  rpush: jest.fn(),
  expire: jest.fn(),
};

const mockBlpopRedis = {
  blpop: jest.fn(),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  chatEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockLogger = {
  warn: jest.fn(),
};

jest.mock('@/config/redis', () => ({ redis: mockRedis }));
jest.mock('@/config/database', () => ({ prisma: mockPrisma }));
jest.mock('@/utils/logger', () => ({ logger: mockLogger }));
jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockBlpopRedis),
}));

import { InterceptService } from '@/services/intercept.service';

describe('InterceptService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns cached interception flag without DB hit', async () => {
    mockRedis.get.mockImplementationOnce(async () => '1');

    const result = await InterceptService.isIntercepted(BigInt(123));

    expect(result).toBe(true);
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('loads interception flag from DB and caches it', async () => {
    mockRedis.get.mockImplementationOnce(async () => null);
    mockPrisma.user.findUnique.mockImplementationOnce(async () => ({ isIntercepted: false }));
    mockRedis.set.mockImplementationOnce(async () => 'OK');

    const result = await InterceptService.isIntercepted(BigInt(999));

    expect(result).toBe(false);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { telegramId: BigInt(999) },
      select: { isIntercepted: true },
    });
    expect(mockRedis.set).toHaveBeenCalledWith('intercept-flag:999', '0', 'EX', 60);
  });

  it('invalidates intercept cache for a user', async () => {
    mockRedis.del.mockImplementationOnce(async () => 1);

    await InterceptService.invalidateCache(BigInt(42));

    expect(mockRedis.del).toHaveBeenCalledWith('intercept-flag:42');
  });

  it('logs event and publishes to user chat channel', async () => {
    mockPrisma.chatEvent.create.mockImplementationOnce(async () => ({ id: BigInt(1) }));
    mockRedis.publish.mockImplementationOnce(async () => 1);

    await InterceptService.logEvent(BigInt(101), 'generation_started', 'Job started', { jobId: 'job-1' });

    expect(mockPrisma.chatEvent.create).toHaveBeenCalledWith({
      data: {
        userId: BigInt(101),
        eventType: 'generation_started',
        content: 'Job started',
        metadata: { jobId: 'job-1' },
      },
    });
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'chat-events:101',
      expect.stringContaining('generation_started'),
    );
  });

  it('does not throw when event logging fails', async () => {
    mockPrisma.chatEvent.create.mockImplementationOnce(async () => {
      throw new Error('db down');
    });

    await expect(
      InterceptService.logEvent(BigInt(101), 'generation_started', 'Job started'),
    ).resolves.toBeUndefined();

    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('waitForMedia returns parsed payload from blocking pop', async () => {
    mockBlpopRedis.blpop.mockImplementationOnce(async () => [
      'intercept-media:job-123',
      JSON.stringify({ mediaUrl: 'https://cdn.example.com/a.mp4', mediaType: 'video' }),
    ]);

    const result = await InterceptService.waitForMedia('job-123', 10);

    expect(mockBlpopRedis.blpop).toHaveBeenCalledWith('intercept-media:job-123', 10);
    expect(result).toEqual({ mediaUrl: 'https://cdn.example.com/a.mp4', mediaType: 'video' });
  });

  it('waitForMedia returns null on timeout', async () => {
    mockBlpopRedis.blpop.mockImplementationOnce(async () => null);

    const result = await InterceptService.waitForMedia('job-timeout', 1);

    expect(result).toBeNull();
  });

  it('waitForMedia returns null for invalid JSON payload', async () => {
    mockBlpopRedis.blpop.mockImplementationOnce(async () => ['intercept-media:bad', 'not-json']);

    const result = await InterceptService.waitForMedia('bad', 1);

    expect(result).toBeNull();
  });

  it('deliverMedia pushes payload and applies cleanup TTL', async () => {
    mockRedis.rpush.mockImplementationOnce(async () => 1);
    mockRedis.expire.mockImplementationOnce(async () => 1);

    await InterceptService.deliverMedia('job-deliver', 'https://cdn.example.com/b.mp4', 'video');

    expect(mockRedis.rpush).toHaveBeenCalledWith(
      'intercept-media:job-deliver',
      JSON.stringify({ mediaUrl: 'https://cdn.example.com/b.mp4', mediaType: 'video' }),
    );
    expect(mockRedis.expire).toHaveBeenCalledWith('intercept-media:job-deliver', 300);
  });

  it('getRecentEvents reads ascending ordered events with limit', async () => {
    const rows = [{ id: BigInt(1), userId: BigInt(7), eventType: 'x', content: 'y' }];
    mockPrisma.chatEvent.findMany.mockImplementationOnce(async () => rows);

    const result = await InterceptService.getRecentEvents(BigInt(7), 25);

    expect(mockPrisma.chatEvent.findMany).toHaveBeenCalledWith({
      where: { userId: BigInt(7) },
      orderBy: { createdAt: 'asc' },
      take: 25,
    });
    expect(result).toEqual(rows);
  });
});
