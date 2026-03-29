"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const payment_service_1 = require("@/services/payment.service");
const pricing_1 = require("@/config/pricing");
const database_1 = require("@/config/database");
// Mock Redis/Service dependencies if needed, but we focus on logic propagation
globals_1.jest.mock("@/config/redis", () => ({
    redis: {
        get: globals_1.jest.fn(),
        set: globals_1.jest.fn(),
        del: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)("System-Wide Synchronization Integration", () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)("should propagate pricing changes from Admin Settings to Payment Service", async () => {
        // 1. Simulate Admin updating a package price
        const customPackage = {
            name: "Flash Sale Pack",
            priceIdr: 1000,
            credits: 100,
            bonus: 50,
        };
        // Mock the DB response that PaymentSettingsService would return
        globals_1.jest.spyOn(database_1.prisma.pricingConfig, "findMany").mockResolvedValue([
            {
                id: 1,
                category: "package",
                key: "flash_sale",
                value: customPackage,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        ]);
        // 2. Verify getPackagesAsync reflects the change
        const packages = await (0, pricing_1.getPackagesAsync)();
        const flashPkg = packages.find((p) => p.id === "flash_sale");
        (0, globals_1.expect)(flashPkg).toBeDefined();
        (0, globals_1.expect)(flashPkg?.priceIdr).toBe(1000);
        (0, globals_1.expect)(flashPkg?.credits).toBe(100);
        // 3. Verify PaymentService creates transaction with the new price
        // Note: PaymentService.createTransaction calls getPackages internally
        const mockMidtransToken = { data: { token: "t123", redirect_url: "u123" } };
        globals_1.jest.spyOn(require("axios"), "post").mockResolvedValue(mockMidtransToken);
        globals_1.jest.spyOn(database_1.prisma.transaction, "create").mockResolvedValue({ orderId: "ord1" });
        const tx = await payment_service_1.PaymentService.createTransaction({
            userId: BigInt(123),
            packageId: "flash_sale",
            username: "test",
        });
        (0, globals_1.expect)(tx.orderId).toBeDefined();
        // Verify Prisma create was called with the Correct (Dynamic) price
        (0, globals_1.expect)(database_1.prisma.transaction.create).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            data: globals_1.expect.objectContaining({
                packageName: "flash_sale",
                amountIdr: 1000,
                creditsAmount: 150, // 100 + 50 bonus
            })
        }));
    });
    (0, globals_1.it)("should propagate subscription plan changes to the logic engine", async () => {
        // 1. Simulate Admin updating a subscription plan limit
        const customProPlan = {
            name: "Ultra Pro",
            monthlyCredits: 500,
            dailyGenerationLimit: 999,
            tier: "pro",
        };
        globals_1.jest.spyOn(database_1.prisma.pricingConfig, "findMany").mockResolvedValue([
            {
                id: 2,
                category: "subscription",
                key: "pro",
                value: customProPlan,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        ]);
        // 2. Verify getSubscriptionPlansAsync reflects the change
        const plans = await (0, pricing_1.getSubscriptionPlansAsync)();
        (0, globals_1.expect)(plans.pro.dailyGenerationLimit).toBe(999);
        (0, globals_1.expect)(plans.pro.name).toBe("Ultra Pro");
    });
});
//# sourceMappingURL=sync-verification.test.js.map