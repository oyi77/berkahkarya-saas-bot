import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockRedis = {
  get: jest.fn<any>(),
  set: jest.fn<any>(),
  setex: jest.fn<any>(),
  incr: jest.fn<any>(),
};

const mockPrisma = {
  pricingConfig: {
    findUnique: jest.fn<any>(),
    upsert: jest.fn<any>(),
  },
};

jest.mock('@/config/redis', () => ({ redis: mockRedis }));
jest.mock('@/config/database', () => ({ prisma: mockPrisma }));

import { ProviderSettingsService } from '@/services/provider-settings.service';

describe('ProviderSettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads versioned cache first when version key exists', async () => {
    const settings = { video: { xai: { priority: 1, enabled: true } }, image: {} };

    mockRedis.get
      .mockResolvedValueOnce('9')
      .mockResolvedValueOnce(JSON.stringify(settings));

    const result = await ProviderSettingsService.getDynamicSettings();

    expect(mockRedis.get).toHaveBeenNthCalledWith(1, 'admin:provider_settings:version');
    expect(mockRedis.get).toHaveBeenNthCalledWith(2, 'admin:provider_settings:v9');
    expect(result).toEqual(settings);
  });

  it('falls back to legacy cache key when versioned entry misses', async () => {
    const settings = { video: { byteplus: { priority: 2, enabled: false } }, image: {} };

    mockRedis.get
      .mockResolvedValueOnce('3')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify(settings));

    const result = await ProviderSettingsService.getDynamicSettings();

    expect(mockRedis.get).toHaveBeenNthCalledWith(3, 'admin:provider_settings');
    expect(result).toEqual(settings);
  });

  it('writes versioned + legacy TTL cache on update', async () => {
    const settings = { video: { laozhang: { priority: 4, enabled: true } }, image: {} };

    mockPrisma.pricingConfig.upsert.mockResolvedValue({});
    mockRedis.incr.mockResolvedValue(42);
    mockRedis.setex.mockResolvedValue('OK');

    await ProviderSettingsService.updateSettings(settings);

    expect(mockPrisma.pricingConfig.upsert).toHaveBeenCalledTimes(1);
    expect(mockRedis.incr).toHaveBeenCalledWith('admin:provider_settings:version');
    expect(mockRedis.setex).toHaveBeenCalledWith(
      'admin:provider_settings:v42',
      300,
      JSON.stringify(settings),
    );
    expect(mockRedis.setex).toHaveBeenCalledWith(
      'admin:provider_settings',
      300,
      JSON.stringify(settings),
    );
  });
});
