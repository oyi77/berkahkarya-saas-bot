import { redis } from '@/config/redis';
import { prisma } from '@/config/database';
import { PROVIDER_CONFIG, VideoProviderConfig, ImageProviderConfig } from '@/config/providers';

const PROVIDER_KEY = 'admin:provider_settings';

export class ProviderSettingsService {
  static async getDynamicSettings() {
    try {
      // Redis cache first
      const cached = await redis.get(PROVIDER_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Fall through to DB
    }
    try {
      // DB fallback (persistent store)
      const dbRow = await prisma.pricingConfig.findUnique({
        where: { category_key: { category: 'provider', key: 'settings' } },
      });
      if (dbRow) {
        const settings = dbRow.value as { video?: Record<string, { priority: number; enabled?: boolean }>; image?: Record<string, { priority: number; enabled?: boolean }> };
        // Warm Redis cache (no TTL — DB is source of truth)
        await redis.set(PROVIDER_KEY, JSON.stringify(settings));
        return settings;
      }
    } catch {
      // Return defaults if both Redis and DB fail
    }
    return { video: {}, image: {} }; // Empty overrides returns default sorting
  }

  static async updateSettings(settings: { video?: Record<string, { priority: number; enabled?: boolean }>; image?: Record<string, { priority: number; enabled?: boolean }> }) {
    // Persist to DB (survives restarts)
    await prisma.pricingConfig.upsert({
      where: { category_key: { category: 'provider', key: 'settings' } },
      create: { category: 'provider', key: 'settings', value: settings, updatedBy: BigInt(0) },
      update: { value: settings, updatedBy: BigInt(0) },
    });
    // Keep Redis as cache (no TTL)
    await redis.set(PROVIDER_KEY, JSON.stringify(settings));
  }

  static async getSortedVideoProviders(): Promise<Array<{ key: string } & VideoProviderConfig>> {
    const overrides = await this.getDynamicSettings();
    const activeOverrides = overrides.video || {};

    return Object.entries(PROVIDER_CONFIG.video)
      .map(([key, config]) => {
        const override = activeOverrides[key];
        return {
          key,
          ...config,
          priority: override?.priority ?? config.priority,
          enabled: override?.enabled ?? true, // Allow soft disabling
        };
      })
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  static async getSortedImageProviders(): Promise<Array<{ key: string } & ImageProviderConfig>> {
    const overrides = await this.getDynamicSettings();
    const activeOverrides = overrides.image || {};

    return Object.entries(PROVIDER_CONFIG.image)
      .map(([key, config]) => {
        const override = activeOverrides[key];
        return {
          key,
          ...config,
          priority: override?.priority ?? config.priority,
          enabled: override?.enabled ?? true, // Allow soft disabling
        };
      })
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);
  }
}
