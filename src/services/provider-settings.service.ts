import { redis } from '@/config/redis';
import { PROVIDER_CONFIG, VideoProviderConfig, ImageProviderConfig } from '@/config/providers';

const PROVIDER_KEY = 'admin:provider_settings';

export class ProviderSettingsService {
  static async getDynamicSettings() {
    try {
      const data = await redis.get(PROVIDER_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Return defaults if Redis fails
    }
    return { video: {}, image: {} }; // Empty overrides returns default sorting
  }

  static async updateSettings(settings: { video?: Record<string, { priority: number; enabled?: boolean }>; image?: Record<string, { priority: number; enabled?: boolean }> }) {
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
