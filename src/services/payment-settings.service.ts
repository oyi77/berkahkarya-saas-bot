/**
 * Payment Settings Service
 * 
 * Manages payment gateway settings including default gateway
 */

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

export class PaymentSettingsService {
  static readonly KEYS = {
    DEFAULT_GATEWAY: 'default_gateway',
    MIDTRANS_ENABLED: 'midtrans_enabled',
    TRIPAY_ENABLED: 'tripay_enabled',
    DUITKU_ENABLED: 'duitku_enabled',
  } as const;

  static readonly GATEWAYS = {
    midtrans: 'Midtrans',
    tripay: 'Tripay',
    duitku: 'Duitku',
  } as const;

  /**
   * Get a setting value
   */
  static async get(key: string): Promise<string | null> {
    const setting = await prisma.paymentSettings.findUnique({
      where: { key },
    });
    return setting?.value || null;
  }

  /**
   * Set a setting value
   */
  static async set(key: string, value: string, description?: string, updatedBy?: bigint): Promise<void> {
    await prisma.paymentSettings.upsert({
      where: { key },
      update: { value, description, updatedBy },
      create: { key, value, description, updatedBy },
    });
    logger.info(`Payment setting updated: ${key} = ${value}`);
  }

  /**
   * Get default gateway
   */
  static async getDefaultGateway(): Promise<string> {
    const gateway = await this.get(this.KEYS.DEFAULT_GATEWAY);
    return gateway || 'midtrans';
  }

  /**
   * Set default gateway
   */
  static async setDefaultGateway(gateway: string, updatedBy?: bigint): Promise<void> {
    if (!Object.keys(this.GATEWAYS).includes(gateway)) {
      throw new Error(`Invalid gateway: ${gateway}`);
    }
    await this.set(
      this.KEYS.DEFAULT_GATEWAY,
      gateway,
      `Default payment gateway (${this.GATEWAYS[gateway as keyof typeof this.GATEWAYS]})`,
      updatedBy
    );
  }

  /**
   * Check if gateway is enabled
   */
  static async isGatewayEnabled(gateway: string): Promise<boolean> {
    const key = `${gateway}_enabled` as typeof this.KEYS.TRIPAY_ENABLED;
    const enabled = await this.get(key);
    return enabled !== 'false';
  }

  /**
   * Enable/disable gateway
   */
  static async setGatewayEnabled(gateway: string, enabled: boolean, updatedBy?: bigint): Promise<void> {
    const key = `${gateway}_enabled` as typeof this.KEYS.TRIPAY_ENABLED;
    await this.set(key, enabled ? 'true' : 'false', `${gateway} enabled`, updatedBy);
  }

  /**
   * Get all payment settings for admin display
   */
  static async getAllSettings(): Promise<Record<string, string>> {
    const settings = await prisma.paymentSettings.findMany();
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  }

  /**
   * Initialize default settings
   */
  static async initializeDefaults(): Promise<void> {
    const defaultGateway = await this.get(this.KEYS.DEFAULT_GATEWAY);
    if (!defaultGateway) {
      await this.set(this.KEYS.DEFAULT_GATEWAY, 'duitku', 'Default payment gateway');
    }

    const midtransEnabled = await this.get(this.KEYS.MIDTRANS_ENABLED);
    if (!midtransEnabled) {
      await this.set(this.KEYS.MIDTRANS_ENABLED, 'false', 'Midtrans disabled');
    }

    const tripayEnabled = await this.get(this.KEYS.TRIPAY_ENABLED);
    if (!tripayEnabled) {
      await this.set(this.KEYS.TRIPAY_ENABLED, 'false', 'Tripay disabled');
    }

    const duitkuEnabled = await this.get(this.KEYS.DUITKU_ENABLED);
    if (!duitkuEnabled) {
      await this.set(this.KEYS.DUITKU_ENABLED, 'true', 'Duitku enabled');
    }

    logger.info('Payment settings initialized');
  }

  /**
   * Get enabled gateways for user selection
   */
  static async getEnabledGateways(): Promise<Array<{ id: string; name: string; description: string }>> {
    const gateways = [];

    if (await this.isGatewayEnabled('midtrans')) {
      gateways.push({ id: 'midtrans', name: '💳 Midtrans', description: 'Credit Card, GOPAY, etc' });
    }
    if (await this.isGatewayEnabled('duitku')) {
      gateways.push({ id: 'duitku', name: '🏦 Duitku (VA)', description: 'Bank Transfer, E-Wallet' });
    }
    if (await this.isGatewayEnabled('tripay')) {
      gateways.push({ id: 'tripay', name: '🔷 Tripay', description: 'Various Payment Methods' });
    }

    return gateways;
  }

  // ── Dynamic Pricing (PricingConfig table) ──

  private static pricingCache = new Map<string, { value: any; expiresAt: number }>();
  private static CACHE_TTL = 60000; // 60 seconds

  private static getCached(cacheKey: string): any | null {
    const entry = this.pricingCache.get(cacheKey);
    if (entry && Date.now() < entry.expiresAt) return entry.value;
    this.pricingCache.delete(cacheKey);
    return null;
  }

  private static setCache(cacheKey: string, value: any): void {
    this.pricingCache.set(cacheKey, { value, expiresAt: Date.now() + this.CACHE_TTL });
  }

  static clearPricingCache(): void {
    this.pricingCache.clear();
  }

  static async getPricingConfig(category: string, key: string): Promise<any | null> {
    const cacheKey = `${category}:${key}`;
    const cached = this.getCached(cacheKey);
    if (cached !== null) return cached;

    const row = await prisma.pricingConfig.findUnique({
      where: { category_key: { category, key } },
    });
    const value = row?.value || null;
    if (value !== null) this.setCache(cacheKey, value);
    return value;
  }

  static async setPricingConfig(category: string, key: string, value: any, updatedBy?: bigint): Promise<void> {
    const existing = await prisma.pricingConfig.findUnique({
      where: { category_key: { category, key } },
    });

    if (existing) {
      await prisma.auditLog.create({
        data: {
          action: 'pricing_update',
          entityType: 'pricing_config',
          entityId: `${category}:${key}`,
          oldValue: existing.value as any,
          newValue: value,
          userId: updatedBy || null,
        },
      });
    }

    await prisma.pricingConfig.upsert({
      where: { category_key: { category, key } },
      update: { value, updatedBy },
      create: { category, key, value, updatedBy },
    });

    this.pricingCache.delete(`${category}:${key}`);
  }

  static async deletePricingConfig(category: string, key: string): Promise<void> {
    await prisma.pricingConfig.deleteMany({
      where: { category, key },
    });
    this.pricingCache.delete(`${category}:${key}`);
  }

  static async getAllPricingByCategory(category: string): Promise<Record<string, any>> {
    const rows = await prisma.pricingConfig.findMany({ where: { category } });
    return rows.reduce((acc: Record<string, any>, r) => {
      acc[r.key] = r.value;
      return acc;
    }, {});
  }

  static async getMarginPercent(): Promise<number> {
    const config = await this.getPricingConfig('global', 'margin_percent');
    // Handle both legacy {value: 30} format and direct number format
    if (typeof config === 'number') return config;
    return (config as any)?.value ?? 30;
  }

  static async getProviderCostUsd(providerKey: string): Promise<number> {
    const config = await this.getPricingConfig('provider_cost', providerKey);
    return (config as any)?.costUsd ?? 0;
  }

  static async getImageCreditCost(provider?: string): Promise<number> {
    const config = await this.getPricingConfig('image_credit', 'default');
    const baseCost = (config as any)?.credits ?? 0.2;

    if (provider) {
      const providerCost = await this.getProviderCostUsd(provider);
      if (providerCost > 0) {
        const margin = await this.getMarginPercent();
        return Math.max(Number((providerCost * (1 + margin / 100)).toFixed(2)), 0.1);
      }
    }
    return baseCost;
  }

  /** Normalize any legacy {value: N} scalar wrappers to plain numbers in the DB */
  static async normalizeLegacyScalars(): Promise<void> {
    const scalars: Array<{ category: string; key: string }> = [
      { category: 'global', key: 'margin_percent' },
    ];
    for (const { category, key } of scalars) {
      const row = await prisma.pricingConfig.findUnique({
        where: { category_key: { category, key } },
      });
      if (!row) continue;
      const v = row.value as any;
      if (typeof v === 'object' && v !== null && typeof v.value === 'number') {
        await prisma.pricingConfig.update({
          where: { category_key: { category, key } },
          data: { value: v.value },
        });
        this.pricingCache.delete(`${category}:${key}`);
      }
    }
  }

  static async initializePricingDefaults(): Promise<void> {
    const count = await prisma.pricingConfig.count();
    if (count > 0) {
      // Existing data — still run normalization to fix legacy formats
      await this.normalizeLegacyScalars();
      return;
    }

    const defaults: Array<{ category: string; key: string; value: any }> = [
      // Global
      { category: 'global', key: 'margin_percent', value: 30 },
      // Image credit
      { category: 'image_credit', key: 'default', value: { credits: 0.2 } },
      // Video credits
      { category: 'video_credit', key: '15', value: { credits: 0.5 } },
      { category: 'video_credit', key: '30', value: { credits: 1.0 } },
      { category: 'video_credit', key: '60', value: { credits: 2.0 } },
      { category: 'video_credit', key: '120', value: { credits: 4.5 } },
      // Provider costs (USD per generation)
      { category: 'provider_cost', key: 'geminigen', value: { costUsd: 0.02 } },
      { category: 'provider_cost', key: 'falai', value: { costUsd: 0.03 } },
      { category: 'provider_cost', key: 'siliconflow', value: { costUsd: 0.01 } },
      { category: 'provider_cost', key: 'nvidia', value: { costUsd: 0.01 } },
      { category: 'provider_cost', key: 'gemini', value: { costUsd: 0.00 } },
      { category: 'provider_cost', key: 'laozhang', value: { costUsd: 0.04 } },
      { category: 'provider_cost', key: 'evolink', value: { costUsd: 0.03 } },
      // Packages
      { category: 'package', key: 'starter', value: { name: 'Starter Flow', nameId: 'Paket Starter', priceIdr: 49000, credits: 5, bonus: 1, description: 'Perfect for trying out' } },
      { category: 'package', key: 'growth', value: { name: 'Growth Machine', nameId: 'Paket Growth', priceIdr: 149000, credits: 18, bonus: 4, description: 'Most popular', isPopular: true } },
      { category: 'package', key: 'business', value: { name: 'Business Kingdom', nameId: 'Paket Bisnis', priceIdr: 499000, credits: 70, bonus: 15, description: 'Best value for teams' } },
      // Subscriptions
      { category: 'subscription', key: 'lite', value: { name: 'Lite', monthlyPriceIdr: 99000, annualPriceIdr: 990000, monthlyCredits: 20, dailyGenerationLimit: 3 } },
      { category: 'subscription', key: 'pro', value: { name: 'Pro', monthlyPriceIdr: 199000, annualPriceIdr: 1990000, monthlyCredits: 50, dailyGenerationLimit: 10 } },
      { category: 'subscription', key: 'agency', value: { name: 'Agency', monthlyPriceIdr: 499000, annualPriceIdr: 4990000, monthlyCredits: 150, dailyGenerationLimit: 30 } },
    ];

    await prisma.pricingConfig.createMany({
      data: defaults,
      skipDuplicates: true,
    });
  }
}
