import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockTelegram = {
  sendMessage: jest.fn(),
  sendPhoto: jest.fn(),
  sendVideo: jest.fn(),
};

const mockRedisSet = jest.fn();
const mockVideoUpdateStatus = jest.fn();
const mockVideoUpsertForInterception = jest.fn();
const mockRefundCredits = jest.fn();
const mockIsIntercepted = jest.fn();
const mockLogEvent = jest.fn();
const mockWaitForMedia = jest.fn();

let capturedProcessor: ((job: any) => Promise<void>) | null = null;

jest.mock('bullmq', () => {
  class Worker {
    constructor(_name: string, processor: (job: any) => Promise<void>) {
      capturedProcessor = processor;
    }

    on(): this {
      return this;
    }
  }

  return { Worker, Job: class {} };
});

jest.mock('@/config/redis', () => ({
  redis: { set: mockRedisSet },
  bullmqRedis: {},
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/config/env', () => ({
  getConfig: jest.fn(() => ({ VIDEO_DIR: '/tmp/intercept-worker-tests', REDIS_URL: 'redis://localhost:6379' })),
}));

jest.mock('@/utils/correlation', () => ({
  runWithCorrelation: (fn: () => Promise<void>) => fn(),
}));

jest.mock('@/services/admin-alert.service', () => ({ sendAdminAlert: jest.fn() }));

jest.mock('@/services/video.service', () => ({
  VideoService: {
    updateStatus: mockVideoUpdateStatus,
    upsertForInterception: mockVideoUpsertForInterception,
    getByJobId: jest.fn(),
  },
}));

jest.mock('@/services/user.service', () => ({
  UserService: {
    refundCredits: mockRefundCredits,
  },
}));

jest.mock('@/services/intercept.service.js', () => ({
  InterceptService: {
    isIntercepted: mockIsIntercepted,
    logEvent: mockLogEvent,
    waitForMedia: mockWaitForMedia,
  },
}));

jest.mock('@/config/pricing', () => ({
  getVideoCreditCostAsync: jest.fn(async () => 10),
}));

jest.mock('@/utils/errors', () => ({ actionableError: (msg: string) => msg }));
jest.mock('@/services/geminigen.service', () => ({ GeminiGenService: {} }));
jest.mock('@/services/video-fallback.service', () => ({ generateVideoWithFallback: jest.fn() }));
jest.mock('@/services/ai-config.service', () => ({ AIConfigService: {} }));
jest.mock('@/services/video-post-processing.service', () => ({ VideoPostProcessing: {} }));
jest.mock('@/services/audio-vo.service', () => ({ AudioVOService: {} }));
jest.mock('@/services/quality-check.service', () => ({ QualityCheckService: {} }));
jest.mock('@/services/watermark.service', () => ({ WatermarkService: {} }));
jest.mock('@/services/gamification.service', () => ({ GamificationService: {} }));
jest.mock('@/config/database', () => ({ prisma: {} }));
jest.mock('@/config/languages', () => ({ getAILabel: jest.fn(), getLangConfig: jest.fn() }));
jest.mock('@/i18n/translations', () => ({ t: jest.fn() }));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
}));

function buildJob(overrides: Partial<any> = {}): any {
  return {
    id: 'bull-job-1',
    data: {
      jobId: 'job-1',
      niche: 'retail',
      platform: 'tiktok',
      duration: 15,
      scenes: 1,
      storyboard: [{ scene: 1, duration: 15, description: 'scene' }],
      userId: '123',
      chatId: 777,
      creditCost: 8,
      ...overrides,
    },
  };
}

async function bootWorkerAndGetProcessor(): Promise<(job: any) => Promise<void>> {
  capturedProcessor = null;
  let startVideoWorker: any;

  await new Promise<void>((resolve) => {
    jest.isolateModules(() => {
      ({ startVideoWorker } = require('../../../src/workers/video-generation.worker'));
      resolve();
    });
  });

  startVideoWorker({ telegram: mockTelegram });

  if (!capturedProcessor) {
    throw new Error('Worker processor was not captured');
  }

  return capturedProcessor as (job: any) => Promise<void>;
}

describe('video-generation.worker interception branch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refunds and notifies user when interception wait times out', async () => {
    mockIsIntercepted.mockImplementationOnce(async () => true);
    mockWaitForMedia.mockImplementationOnce(async () => null);
    mockRedisSet.mockImplementationOnce(async () => 'OK');
    mockVideoUpdateStatus.mockImplementationOnce(async () => undefined);
    mockRefundCredits.mockImplementationOnce(async () => undefined);
    mockTelegram.sendMessage.mockImplementationOnce(async () => ({}));

    const processor = await bootWorkerAndGetProcessor();
    await processor(buildJob());

    expect(mockVideoUpdateStatus).toHaveBeenCalledWith('job-1', 'failed', 'Generation timed out');
    expect(mockRedisSet).toHaveBeenCalledWith('refund-lock:job-1', '1', 'EX', 3600, 'NX');
    expect(mockRefundCredits).toHaveBeenCalledWith(BigInt(123), 8, 'job-1', 'Generation timed out');
    expect(mockTelegram.sendMessage).toHaveBeenCalledWith(
      777,
      '❌ Video generation failed. Your credits have been refunded. Please try again.',
    );
  });

  it('delivers intercepted image media and logs completion event', async () => {
    mockIsIntercepted.mockImplementationOnce(async () => true);
    mockWaitForMedia.mockImplementationOnce(async () => ({ mediaUrl: 'https://cdn.example.com/intercept.jpg', mediaType: 'image' }));
    mockVideoUpsertForInterception.mockImplementationOnce(async () => undefined);
    mockTelegram.sendPhoto.mockImplementationOnce(async () => ({}));
    mockLogEvent.mockImplementation(async () => undefined);

    const processor = await bootWorkerAndGetProcessor();
    await processor(buildJob());

    expect(mockVideoUpsertForInterception).toHaveBeenCalledWith(
      'job-1',
      BigInt(123),
      'https://cdn.example.com/intercept.jpg',
    );
    expect(mockTelegram.sendPhoto).toHaveBeenCalled();
    expect(mockLogEvent).toHaveBeenCalledWith(
      BigInt(123),
      'media_delivered',
      expect.stringContaining('Admin delivered image'),
      expect.objectContaining({ jobId: 'job-1', mediaUrl: 'https://cdn.example.com/intercept.jpg' }),
    );
    expect(mockRefundCredits).not.toHaveBeenCalled();
  });
});
