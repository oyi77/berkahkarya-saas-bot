/**
 * Payment Packages Configuration
 * 
 * Strategy: 
 * 1. High perceived value for top tier
 * 2. High margin for ad-hoc credits
 * 3. HPP Consideration: ~IDR 6000/60s Grok spent
 */

export const PACKAGES = [
  {
    id: 'starter',
    name: '🎬 Starter Flow',
    price: 49000,
    credits: 6,
    description: 'Up to 6 minutes of HQ Video',
    features: [
      '6 Credits (IDR 8,166/min)',
      '15s - 60s Videos',
      'Basic AI Storyboard',
      'All platforms',
    ],
    isPopular: false
  },
  {
    id: 'growth',
    name: '🚀 Growth Machine',
    price: 149000,
    credits: 22,
    description: 'Best for small businesses',
    features: [
      '22 Credits (IDR 6,772/min)',
      'Viral Research Access',
      'PostBridge Distribution (2 accounts)',
      'Priority Queue',
    ],
    isPopular: true
  },
  {
    id: 'scale',
    name: '👑 Business Kingdom',
    price: 499000,
    credits: 85,
    description: 'Dominate all channels',
    features: [
      '85 Credits (IDR 5,870/min)',
      'Full Viral Research',
      'PostBridge Distribution (10 accounts)',
      'Clone/Remake Unlimited',
    ],
    isPopular: false
  }
];

export const ADHOC_CREDITS = [
  { id: '1credit', credits: 1, price: 15000 }, // Expensive per-unit (IDR 15k vs ~6k in subs)
  { id: '5credits', credits: 5, price: 65000 },
];

export const COMMISSIONS = {
  DIRECT_REFERRAL: 0.15, // Tier 1: 15%
  INDIRECT_REFERRAL: 0.05, // Tier 2: 5% (MLM Structure)
  RESELLER_DISCOUNT: 0.30, // 30% for reseller package holders
  ACTIVITY_WINDOW_DAYS: 30, // User must have a transaction within 30 days to keep referral earnings active
};

// v3.0 re-export
export { CREDIT_PACKAGES_V3, SUBSCRIPTION_PLANS_V3, UNIT_COSTS, CREDIT_TO_UNIT } from './pricing';
