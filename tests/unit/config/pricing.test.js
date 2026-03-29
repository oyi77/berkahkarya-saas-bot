"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Mock PaymentSettingsService
const mockGetPricingConfig = globals_1.jest.fn();
const mockGetAllPricingByCategory = globals_1.jest.fn();
globals_1.jest.mock("@/services/payment-settings.service", () => ({
    PaymentSettingsService: {
        getPricingConfig: mockGetPricingConfig,
        getAllPricingByCategory: mockGetAllPricingByCategory,
        getImageCreditCost: globals_1.jest.fn().mockResolvedValue(1.0),
    },
}));
const pricing_1 = require("@/config/pricing");
(0, globals_1.describe)("Pricing Async Wrappers", () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)("getVideoCreditCostAsync()", () => {
        (0, globals_1.it)("should return dynamic value from DB if available", async () => {
            mockGetPricingConfig.mockResolvedValue({ credits: 5.5 });
            const cost = await (0, pricing_1.getVideoCreditCostAsync)(30);
            (0, globals_1.expect)(cost).toBe(5.5);
            (0, globals_1.expect)(mockGetPricingConfig).toHaveBeenCalledWith("video_credit", "30");
        });
        (0, globals_1.it)("should fallback to hardcoded if DB returns null", async () => {
            mockGetPricingConfig.mockResolvedValue(null);
            const cost = await (0, pricing_1.getVideoCreditCostAsync)(30);
            (0, globals_1.expect)(cost).toBe(1.0); // Hardcoded value for 30s
        });
    });
    (0, globals_1.describe)("getPackagesAsync()", () => {
        (0, globals_1.it)("should return dynamic packages from DB", async () => {
            const mockPkgs = {
                "custom_pkg": { name: "Custom", priceIdr: 10000, credits: 10, bonus: 2 }
            };
            mockGetAllPricingByCategory.mockResolvedValue(mockPkgs);
            const pkgs = await (0, pricing_1.getPackagesAsync)();
            (0, globals_1.expect)(pkgs).toHaveLength(1);
            (0, globals_1.expect)(pkgs[0]).toEqual(globals_1.expect.objectContaining({
                id: "custom_pkg",
                name: "Custom",
                priceIdr: 10000,
            }));
        });
        (0, globals_1.it)("should fallback to hardcoded packages if DB is empty", async () => {
            mockGetAllPricingByCategory.mockResolvedValue({});
            const pkgs = await (0, pricing_1.getPackagesAsync)();
            (0, globals_1.expect)(pkgs.length).toBeGreaterThan(0);
            (0, globals_1.expect)(pkgs[0].id).toBe("starter");
        });
    });
    (0, globals_1.describe)("getSubscriptionPlansAsync()", () => {
        (0, globals_1.it)("should return dynamic plans from DB", async () => {
            const mockPlans = { "pro_v2": { name: "Pro V2", monthlyPriceIdr: 100 } };
            mockGetAllPricingByCategory.mockResolvedValue(mockPlans);
            const plans = await (0, pricing_1.getSubscriptionPlansAsync)();
            (0, globals_1.expect)(plans).toEqual(mockPlans);
        });
        (0, globals_1.it)("should fallback to hardcoded plans if DB is empty", async () => {
            mockGetAllPricingByCategory.mockResolvedValue({});
            const plans = await (0, pricing_1.getSubscriptionPlansAsync)();
            (0, globals_1.expect)(plans).toEqual(pricing_1.SUBSCRIPTION_PLANS);
        });
    });
    (0, globals_1.describe)("getUnitCostAsync()", () => {
        (0, globals_1.it)("should return dynamic unit cost", async () => {
            mockGetPricingConfig.mockResolvedValue({ value: 10.0 });
            const cost = await (0, pricing_1.getUnitCostAsync)("VIDEO_15S");
            (0, globals_1.expect)(cost).toBe(10.0);
        });
        (0, globals_1.it)("should fallback to hardcoded unit cost", async () => {
            mockGetPricingConfig.mockResolvedValue(null);
            const cost = await (0, pricing_1.getUnitCostAsync)("VIDEO_15S");
            (0, globals_1.expect)(cost).toBeGreaterThan(0);
        });
    });
    (0, globals_1.describe)("getReferralCommissionsAsync()", () => {
        (0, globals_1.it)("should merge dynamic commissions with default values", async () => {
            mockGetAllPricingByCategory.mockResolvedValue({ TIER_1: 0.5 });
            const comms = await (0, pricing_1.getReferralCommissionsAsync)();
            (0, globals_1.expect)(comms.TIER_1).toBe(0.5);
            (0, globals_1.expect)(comms.TIER_2).toBeDefined(); // Still exists from defaults
        });
    });
});
//# sourceMappingURL=pricing.test.js.map