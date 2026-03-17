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
      await this.set(this.KEYS.MIDTRANS_ENABLED, 'true', 'Midtrans enabled');
    }

    const tripayEnabled = await this.get(this.KEYS.TRIPAY_ENABLED);
    if (!tripayEnabled) {
      await this.set(this.KEYS.TRIPAY_ENABLED, 'false', 'Tripay enabled');
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
}
