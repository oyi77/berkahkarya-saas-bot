export const COMMISSIONS = {
  DIRECT_REFERRAL: 0.15, // Tier 1: 15%
  INDIRECT_REFERRAL: 0.05, // Tier 2: 5% (MLM Structure)
  RESELLER_DISCOUNT: 0.30, // 30% for reseller package holders
  ACTIVITY_WINDOW_DAYS: 30, // User must have a transaction within 30 days to keep referral earnings active
};

// v3.0 re-export
export { CREDIT_PACKAGES_V3, SUBSCRIPTION_PLANS_V3, UNIT_COSTS, CREDIT_TO_UNIT } from './pricing';
