import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from "@jest/globals";

// Mock PaymentSettingsService
const mockGetPricingConfig = jest.fn();
const mockGetAllPricingByCategory = jest.fn();

jest.mock("@/services/payment-settings.service", () => ({
  PaymentSettingsService: {
    getPricingConfig: mockGetPricingConfig,
    getAllPricingByCategory: mockGetAllPricingByCategory,
    getImageCreditCost: jest.fn().mockResolvedValue(1.0),
  },
}));

import {
  getVideoCreditCostAsync,
  getPackagesAsync,
  getSubscriptionPlansAsync,
  getUnitCostAsync,
  getReferralCommissionsAsync,
  SUBSCRIPTION_PLANS,
} from "@/config/pricing";

describe("Pricing Async Wrappers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getVideoCreditCostAsync()", () => {
    it("should return dynamic value from DB if available", async () => {
      mockGetPricingConfig.mockResolvedValue({ credits: 5.5 });
      const cost = await getVideoCreditCostAsync(30);
      expect(cost).toBe(5.5);
      expect(mockGetPricingConfig).toHaveBeenCalledWith("video_credit", "30");
    });

    it("should fallback to hardcoded if DB returns null", async () => {
      mockGetPricingConfig.mockResolvedValue(null);
      const cost = await getVideoCreditCostAsync(30);
      expect(cost).toBe(1.5); // Fallback via getVideoCreditCost(30)
    });
  });

  describe("getPackagesAsync()", () => {
    it("should return dynamic packages from DB", async () => {
      const mockPkgs = {
        "custom_pkg": { name: "Custom", priceIdr: 10000, credits: 10, bonus: 2 }
      };
      mockGetAllPricingByCategory.mockResolvedValue(mockPkgs);

      const pkgs = await getPackagesAsync();
      expect(pkgs).toHaveLength(1);
      expect(pkgs[0]).toEqual(expect.objectContaining({
        id: "custom_pkg",
        name: "Custom",
        priceIdr: 10000,
      }));
    });

    it("should fallback to hardcoded packages if DB is empty", async () => {
      mockGetAllPricingByCategory.mockResolvedValue({});
      const pkgs = await getPackagesAsync();
      expect(pkgs.length).toBeGreaterThan(0);
      expect(pkgs[0].id).toBe("starter");
    });
  });

  describe("getSubscriptionPlansAsync()", () => {
    it("should return dynamic plans from DB", async () => {
      const mockPlans = { "pro_v2": { name: "Pro V2", monthlyPriceIdr: 100 } };
      mockGetAllPricingByCategory.mockResolvedValue(mockPlans);

      const plans = await getSubscriptionPlansAsync();
      expect(plans).toEqual(mockPlans);
    });

    it("should fallback to hardcoded plans if DB is empty", async () => {
      mockGetAllPricingByCategory.mockResolvedValue({});
      const plans = await getSubscriptionPlansAsync();
      expect(plans).toEqual(SUBSCRIPTION_PLANS);
    });
  });

  describe("getUnitCostAsync()", () => {
    it("should return dynamic unit cost", async () => {
      mockGetPricingConfig.mockResolvedValue({ value: 10.0 });
      const cost = await getUnitCostAsync("VIDEO_15S");
      expect(cost).toBe(10.0);
    });

    it("should fallback to hardcoded unit cost", async () => {
      mockGetPricingConfig.mockResolvedValue(null);
      const cost = await getUnitCostAsync("VIDEO_15S");
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe("getReferralCommissionsAsync()", () => {
    it("should merge dynamic commissions with default values", async () => {
      mockGetAllPricingByCategory.mockResolvedValue({ TIER_1: 0.5 });
      const comms = await getReferralCommissionsAsync();
      expect(comms.TIER_1).toBe(0.5);
      expect(comms.TIER_2).toBeDefined(); // Still exists from defaults
    });
  });
});
