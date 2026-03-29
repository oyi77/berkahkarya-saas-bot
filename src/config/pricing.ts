export const SUBSCRIPTION_PLANS = {
  lite: {
    name: 'Lite',
    monthlyPriceIdr: 99_000,
    annualPriceIdr: 990_000,
    monthlyCredits: 10,
    dailyGenerationLimit: 5,
    tier: 'basic' as const,
    features: ['Priority queue', 'Basic analytics'],
  },
  pro: {
    name: 'Pro',
    monthlyPriceIdr: 249_000,
    annualPriceIdr: 2_490_000,
    monthlyCredits: 30,
    dailyGenerationLimit: 10,
    tier: 'pro' as const,
    features: ['Priority queue 2x', 'Campaign Builder', 'Clone Style', 'No watermark', 'Advanced analytics'],
  },
  agency: {
    name: 'Agency',
    monthlyPriceIdr: 599_000,
    annualPriceIdr: 5_990_000,
    monthlyCredits: 100,
    dailyGenerationLimit: 30,
    tier: 'agency' as const,
    features: ['Priority queue 3x', 'White-label', 'API access', 'Batch generation', 'Dedicated support'],
  },
} as const;

export type PlanKey = keyof typeof SUBSCRIPTION_PLANS;
export type BillingCycle = 'monthly' | 'annual';

export const VIDEO_CREDIT_COSTS: Record<string, number> = {
  '5': 0.2,
  '10': 0.4,
  '15': 0.5,
  '20': 0.7,
  '25': 0.9,
  '30': 1.0,
  '35': 1.2,
  '40': 1.4,
  '45': 1.5,
  '50': 1.7,
  '55': 1.9,
  '60': 2.0,
};

export const EXTRA_CREDIT_PRICING = {
  subscriber: { pricePerCreditIdr: 10_000, label: 'Subscriber Price' },
  nonSubscriber: { pricePerCreditIdr: 20_000, label: 'Standard Price' },
} as const;

export const EXTRA_CREDIT_PACKAGES = [
  { id: 'extra_1', credits: 1 },
  { id: 'extra_5', credits: 5 },
  { id: 'extra_10', credits: 10 },
  { id: 'extra_25', credits: 25 },
] as const;

export const COMMISSIONS = {
  DIRECT_REFERRAL: 0.15,
  INDIRECT_REFERRAL: 0.05,
  ACTIVITY_WINDOW_DAYS: 30,
} as const;

export const FREE_TRIAL_CREDITS = 3;

export function getVideoCreditCost(durationSeconds: number): number {
  const key = String(durationSeconds);
  return VIDEO_CREDIT_COSTS[key] ?? Math.ceil(durationSeconds / 5) * (2.0 / 12);
}

export function isSubscriber(tier: string): boolean {
  return tier !== 'free';
}

export function getCreditPriceIdr(tier: string): number {
  return isSubscriber(tier)
    ? EXTRA_CREDIT_PRICING.subscriber.pricePerCreditIdr
    : EXTRA_CREDIT_PRICING.nonSubscriber.pricePerCreditIdr;
}

export function getPlanPrice(plan: PlanKey, cycle: BillingCycle): number {
  const p = SUBSCRIPTION_PLANS[plan];
  return cycle === 'annual' ? p.annualPriceIdr : p.monthlyPriceIdr;
}

export function getExtraCreditPackagePrice(credits: number, tier: string): number {
  return credits * getCreditPriceIdr(tier);
}

// ── Async DB-backed pricing (reads from PricingConfig, falls back to hardcoded) ──

import { PaymentSettingsService } from '@/services/payment-settings.service';

export async function getVideoCreditCostAsync(durationSeconds: number): Promise<number> {
  const config = await PaymentSettingsService.getPricingConfig('video_credit', String(durationSeconds));
  if (config && typeof (config as any).credits === 'number') {
    return (config as any).credits;
  }
  return getVideoCreditCost(durationSeconds);
}

export async function getImageCreditCostAsync(provider?: string): Promise<number> {
  return PaymentSettingsService.getImageCreditCost(provider);
}

export async function getPackagesAsync(): Promise<Array<{ id: string; name: string; priceIdr: number; credits: number; bonus: number; description?: string; isPopular?: boolean }>> {
  const dbPackages = await PaymentSettingsService.getAllPricingByCategory('package');
  if (Object.keys(dbPackages).length > 0) {
    return Object.entries(dbPackages).map(([id, config]: [string, any]) => ({
      id,
      name: config.name || id,
      priceIdr: config.priceIdr || 0,
      credits: config.credits || 0,
      bonus: config.bonus || 0,
      description: config.description,
      isPopular: config.isPopular,
    }));
  }
  // Fallback to hardcoded
  return [
    { id: 'starter', name: 'Starter Flow', priceIdr: 49000, credits: 5, bonus: 1 },
    { id: 'growth', name: 'Growth Machine', priceIdr: 149000, credits: 18, bonus: 4, isPopular: true },
    { id: 'business', name: 'Business Kingdom', priceIdr: 499000, credits: 70, bonus: 15 },
  ];
}

export async function getSubscriptionPlansAsync(): Promise<Record<string, any>> {
  const dbPlans = await PaymentSettingsService.getAllPricingByCategory('subscription');
  if (Object.keys(dbPlans).length > 0) return dbPlans;
  return SUBSCRIPTION_PLANS;
}

// ── v3.0 Credit System (1 Credit = 10 Units) ──────────────────────────────────
// Added: March 2026 — Master Document v3.0

export const CREDIT_TO_UNIT = 10;

export const UNIT_COSTS = {
  IMAGE_SET_7_SCENE: 1.5,
  VIDEO_15S: 2.5,
  VIDEO_30S: 3.5,
  VIDEO_60S: 6.0,
  CLONE_STYLE: 0.5,
  CAMPAIGN_5_VIDEO: 15.0,
  CAMPAIGN_10_VIDEO: 25.0,
} as const;

// ── Credit Packages (One-time purchase, credits never expire) ─────────────────
// Cost basis: ~IDR 150-500/video via BytePlus/SiliconFlow/Fal.ai (NOT Kling)
// Target margin: 85-93% gross margin
export const CREDIT_PACKAGES_V3 = [
  { id: 'coba',       name: 'Coba Dulu',    credits: 1,   units: 10,   priceIdr: 25_000,    pricePerUnit: 2500, savingPct: 0,  isPopular: false },
  { id: 'growth',     name: 'Growth Pack',  credits: 15,  units: 150,  priceIdr: 249_000,   pricePerUnit: 1660, savingPct: 34, isPopular: true  },
  { id: 'business',   name: 'Business Pack',credits: 50,  units: 500,  priceIdr: 699_000,   pricePerUnit: 1398, savingPct: 44, isPopular: false },
  { id: 'agency_pkg', name: 'Agency Pack',  credits: 150, units: 1500, priceIdr: 1_799_000, pricePerUnit: 1199, savingPct: 52, isPopular: false },
] as const;

// ── Subscription Plans (Monthly credits auto-renew) ───────────────────────────
export const SUBSCRIPTION_PLANS_V3 = {
  lite: {
    name: 'Lite',
    monthlyPriceIdr: 99_000,
    annualPriceIdr: 990_000,
    monthlyCredits: 10,
    features: ['Priority queue', 'Basic analytics'],
  },
  pro: {
    name: 'Pro',
    monthlyPriceIdr: 249_000,
    annualPriceIdr: 2_490_000,
    monthlyCredits: 30,
    features: ['Priority queue 2x', 'Campaign Builder', 'Clone Style', 'No watermark', 'Advanced analytics'],
  },
  agency_sub: {
    name: 'Agency',
    monthlyPriceIdr: 599_000,
    annualPriceIdr: 5_990_000,
    monthlyCredits: 100,
    features: ['Priority queue 3x', 'White-label', 'API access', 'Batch generation', 'Dedicated support'],
  },
} as const;

export function creditsToUnits(credits: number): number { return credits * CREDIT_TO_UNIT; }
export function unitsToCredits(units: number): number { return units / CREDIT_TO_UNIT; }
export function getUnitCost(action: keyof typeof UNIT_COSTS): number { return UNIT_COSTS[action]; }
export function creditCostForAction(action: keyof typeof UNIT_COSTS): number { return UNIT_COSTS[action] / CREDIT_TO_UNIT; }

export const REFERRAL_COMMISSIONS_V3 = {
  TIER_1: 0.15,
  TIER_2: 0.05,
  TIER_3: 0.03,
  ACTIVITY_WINDOW_DAYS: 30,
  MIN_PAYOUT_IDR: 50_000,
  PENDING_DAYS: 7,
} as const;
