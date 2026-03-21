export const SUBSCRIPTION_PLANS = {
  lite: {
    name: 'Lite',
    monthlyPriceIdr: 99_000,
    annualPriceIdr: 990_000,
    monthlyCredits: 20,
    dailyGenerationLimit: 3,
    tier: 'basic' as const,
    features: ['Priority queue (1.5x)', 'Basic analytics'],
  },
  pro: {
    name: 'Pro',
    monthlyPriceIdr: 199_000,
    annualPriceIdr: 1_990_000,
    monthlyCredits: 50,
    dailyGenerationLimit: 10,
    tier: 'pro' as const,
    features: ['Priority queue (2x)', 'All video formats', '3 style variants', '1 revision/video', 'Advanced analytics'],
  },
  agency: {
    name: 'Agency',
    monthlyPriceIdr: 499_000,
    annualPriceIdr: 4_990_000,
    monthlyCredits: 150,
    dailyGenerationLimit: 30,
    tier: 'agency' as const,
    features: ['Priority queue (3x)', 'White-label', 'Bulk generation (20 files)', 'API access', '5 team seats', 'Dedicated support'],
  },
} as const;

export type PlanKey = keyof typeof SUBSCRIPTION_PLANS;
export type BillingCycle = 'monthly' | 'annual';

export const VIDEO_CREDIT_COSTS: Record<string, number> = {
  '15': 0.5,
  '30': 1.0,
  '60': 2.0,
  '120': 4.5,
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
  return VIDEO_CREDIT_COSTS[key] ?? Math.ceil(durationSeconds / 30) * 1.0;
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
