/**
 * Static & Dynamic Pricing Engine
 * 
 * Centralizing all prices, durations, and credit costs.
 * v3.0 logic: 1 Credit = 10 Units.
 */

import { PaymentSettingsService } from "@/services/payment-settings.service";

// ── Shared Constants ──────────────────────────────────────────────────────────

export type PlanKey = 'lite' | 'pro' | 'agency';
export type BillingCycle = 'monthly' | 'annual';

// Use UNIT_COSTS as the primary source of truth for all modules
// Adjusted 2026-03-31: video/campaign prices raised to maintain >50% margin
export const UNIT_COSTS = {
  VIDEO_15S: 8,    // 0.8 Credits (was 0.5)
  VIDEO_30S: 15,   // 1.5 Credits (was 1.0) — margin 60% vs 40%
  VIDEO_60S: 30,   // 3.0 Credits (was 2.0)
  VIDEO_120S: 65,  // 6.5 Credits (was 4.5)
  IMAGE_UNIT: 2,   // 0.2 Credits (unchanged — 98% margin)
  IMAGE_SET_7_SCENE: 15, // 1.5 Credits (unchanged — 98% margin)
  CLONE_STYLE: 8,  // 0.8 Credits (was 0.5) — uses vision + gen
  CAMPAIGN_5_VIDEO: 60,  // 6.0 Credits (was 4.0) — margin 50% vs 25%
  CAMPAIGN_10_VIDEO: 110, // 11.0 Credits (was 7.5) — margin 50%
};

// Aliases for transition
export const VIDEO_UNIT_COSTS = UNIT_COSTS;
export const IMAGE_UNIT_COST = UNIT_COSTS.IMAGE_UNIT;
export const CREDIT_TO_UNIT = 10;

// ── Subscription Tiers & Credits ──────────────────────────────────────────────

export const SUBSCRIPTION_PLANS = {
  lite: {
    name: 'Lite',
    tier: 'basic',
    monthlyCredits: 20,
    dailyGenerationLimit: 3,
    monthlyPriceIdr: 99000,
    annualPriceIdr: 990000,
    features: ['20 Credits/month', '3 Daily limit', 'Standard support'],
  },
  pro: {
    name: 'Pro',
    tier: 'pro',
    monthlyCredits: 50,
    dailyGenerationLimit: 10,
    monthlyPriceIdr: 199000,
    annualPriceIdr: 1990000,
    features: ['50 Credits/month', '10 Daily limit', 'Priority support', 'Viral research'],
  },
  agency: {
    name: 'Agency',
    tier: 'agency',
    monthlyCredits: 150,
    dailyGenerationLimit: 30,
    monthlyPriceIdr: 499000,
    annualPriceIdr: 4990000,
    features: ['150 Credits/month', '30 Daily limit', 'White-labeling', 'API Access'],
  },
};

// Legacy alias
export const SUBSCRIPTION_PLANS_V3 = SUBSCRIPTION_PLANS;

// ── Credit Packages ──────────────────────────────────────────────────────────

export const PACKAGES = [
  { id: 'starter', name: 'Starter Flow', priceIdr: 49000, credits: 5, bonus: 1, totalCredits: 6 },
  { id: 'growth', name: 'Growth Machine', priceIdr: 149000, credits: 18, bonus: 4, totalCredits: 22, isPopular: true },
  { id: 'business', name: 'Business Kingdom', priceIdr: 499000, credits: 70, bonus: 15, totalCredits: 85 },
];

export const EXTRA_CREDIT_PACKAGES = [
  { id: '1credit', credits: 1, priceIdr: 15000, name: '1 Credit' },
  { id: '5credits', credits: 5, priceIdr: 65000, name: '5 Credits' },
];

// Legacy alias
export const CREDIT_PACKAGES_V3 = PACKAGES;

// ── Helpers ──────────────────────────────────────────────────────────────────

export const creditsToUnits = (credits: number) => Math.round(credits * 10);
export const unitsToCredits = (units: number) => units / 10;

export function getPlanPrice(plan: PlanKey, cycle: BillingCycle): number {
  const planConfig = SUBSCRIPTION_PLANS[plan];
  if (!planConfig) return 0;
  return cycle === 'monthly' ? planConfig.monthlyPriceIdr : planConfig.annualPriceIdr;
}

/**
 * Get the cost of a video in Credits (v3.0)
 * Fallback to static if DB config is missing
 */
export function getVideoCreditCost(durationSeconds: number): number {
  if (durationSeconds <= 15) return 0.8;
  if (durationSeconds <= 30) return 1.5;
  if (durationSeconds <= 60) return 3.0;
  if (durationSeconds <= 120) return 6.5;
  // Custom duration tiered pricing
  return getCustomDurationCreditCost(durationSeconds);
}

/** Tiered pricing for custom durations: 0.035/s first 60s, 0.030/s 61-300s, 0.025/s 300+s */
export function getCustomDurationCreditCost(durationSeconds: number): number {
  let cost = 0;
  if (durationSeconds <= 60) {
    cost = durationSeconds * 0.035;
  } else if (durationSeconds <= 300) {
    cost = 60 * 0.035 + (durationSeconds - 60) * 0.030;
  } else {
    cost = 60 * 0.035 + 240 * 0.030 + (durationSeconds - 300) * 0.025;
  }
  return Math.max(0.5, Math.round(cost * 10) / 10);
}

// ── Asynchronous Pricing Engine (Dynamic Override) ──────────────────────────

export async function getVideoCreditCostAsync(durationSeconds: number): Promise<number> {
  let key = '120';
  if (durationSeconds <= 15) key = '15';
  else if (durationSeconds <= 30) key = '30';
  else if (durationSeconds <= 60) key = '60';

  const config = await PaymentSettingsService.getPricingConfig('video_credit', key);
  if (config && typeof config === 'object' && 'credits' in config) {
    return (config as any).credits;
  }
  return durationSeconds <= 15 ? 0.5 : (durationSeconds <= 30 ? 1.0 : (durationSeconds <= 60 ? 2.0 : 4.5));
}

export async function getImageCreditCostAsync(provider?: string): Promise<number> {
  return PaymentSettingsService.getImageCreditCost(provider);
}

export async function getPackagesAsync() {
  const dbPackages = await PaymentSettingsService.getAllPricingByCategory('package');
  if (Object.keys(dbPackages).length > 0) {
    return Object.entries(dbPackages).map(([id, config]: [string, any]) => {
      const credits = config.credits || config.credit || 0;
      const bonus = config.bonus || 0;
      return {
        id,
        name: config.name || id,
        priceIdr: config.priceIdr || config.price || 0,
        credits,
        bonus,
        totalCredits: credits + bonus,
        description: config.description,
        isPopular: config.isPopular,
      };
    });
  }
  return PACKAGES;
}

export async function getSubscriptionPlansAsync(): Promise<Record<string, any>> {
  const dbPlans = await PaymentSettingsService.getAllPricingByCategory('subscription');
  if (Object.keys(dbPlans).length > 0) return dbPlans;
  return SUBSCRIPTION_PLANS;
}

export async function getUnitCostAsync(key: keyof typeof UNIT_COSTS): Promise<number> {
  const config = await PaymentSettingsService.getPricingConfig('unit_cost', key);
  if (config && typeof config === 'object' && 'value' in config) {
    return (config as any).value;
  }
  return UNIT_COSTS[key];
}

export async function getReferralCommissionsAsync(): Promise<Record<string, number>> {
  const defaults = { TIER_1: 0.15, TIER_2: 0.05, TIER_3: 0.02 };
  const dbComms = await PaymentSettingsService.getAllPricingByCategory('referral_commission');
  return { ...defaults, ...dbComms };
}

// Legacy alias for admin route
export const REFERRAL_COMMISSIONS_V3 = { TIER_1: 0.15, TIER_2: 0.05, TIER_3: 0.02 };

/**
 * Main persistent keyboard (Reply Keyboard)
 */
/**
 * Main persistent keyboard (Reply Keyboard)
 */
export const MAIN_MENU_KEYBOARD = [
  [{ text: '🎬 Create Video' }, { text: '🖼️ Generate Image' }, { text: '💬 Chat AI' }],
  [{ text: '📚 Prompt Library' }, { text: '🔥 Trending' }, { text: '🎁 Daily Prompt' }],
  [{ text: '📁 My Videos' }, { text: '🧬 Fingerprint' }, { text: '⭐ Subscription' }],
  [{ text: '💰 Top Up' }, { text: '👤 Profile' }, { text: '👥 Referral' }],
  [{ text: '⚙️ Settings' }, { text: '🆘 Support' }, { text: '📖 Help' }],
];
