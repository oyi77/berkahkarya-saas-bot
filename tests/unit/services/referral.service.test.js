"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const mockPrismaUser = {
    findUnique: globals_1.jest.fn(),
};
const mockPrismaTransaction = {
    findFirst: globals_1.jest.fn(),
};
const mockPrismaCommission = {
    create: globals_1.jest.fn(),
};
const mockPrisma = {
    user: mockPrismaUser,
    transaction: mockPrismaTransaction,
    commission: mockPrismaCommission,
};
globals_1.jest.mock("@/config/database", () => ({
    prisma: mockPrisma,
}));
const mockLogger = {
    info: globals_1.jest.fn(),
    error: globals_1.jest.fn(),
    warn: globals_1.jest.fn(),
};
globals_1.jest.mock("@/utils/logger", () => ({
    logger: mockLogger,
}));
const mockAddDays = globals_1.jest.fn();
const mockIsAfter = globals_1.jest.fn();
globals_1.jest.mock("date-fns", () => ({
    addDays: mockAddDays,
    isAfter: mockIsAfter,
}));
globals_1.jest.mock("@/config/packages", () => ({
    COMMISSIONS: {
        DIRECT_REFERRAL: 0.15,
        INDIRECT_REFERRAL: 0.05,
        RESELLER_DISCOUNT: 0.3,
        ACTIVITY_WINDOW_DAYS: 30,
    },
}));
const referral_service_1 = require("@/services/referral.service");
const BUYER_TELEGRAM_ID = BigInt(123456789);
const DIRECT_REFERRER_TELEGRAM_ID = BigInt(987654321);
const INDIRECT_REFERRER_TELEGRAM_ID = BigInt(555666777);
const TRANSACTION_ID = "TX-123456";
const TRANSACTION_AMOUNT = 100000;
function makeUser(overrides = {}) {
    return {
        telegramId: BUYER_TELEGRAM_ID,
        uuid: "uuid-buyer-123",
        username: "buyer",
        firstName: "Buyer",
        lastName: "User",
        referredBy: null,
        createdAt: new Date("2024-01-01"),
        ...overrides,
    };
}
function makeDirectReferrer(overrides = {}) {
    return {
        telegramId: DIRECT_REFERRER_TELEGRAM_ID,
        uuid: "uuid-direct-referrer",
        username: "directreferrer",
        firstName: "Direct",
        lastName: "Referrer",
        referredBy: null,
        createdAt: new Date("2024-01-01"),
        ...overrides,
    };
}
function makeIndirectReferrer(overrides = {}) {
    return {
        telegramId: INDIRECT_REFERRER_TELEGRAM_ID,
        uuid: "uuid-indirect-referrer",
        username: "indirectreferrer",
        firstName: "Indirect",
        lastName: "Referrer",
        referredBy: null,
        createdAt: new Date("2024-01-01"),
        ...overrides,
    };
}
(0, globals_1.describe)("ReferralService", () => {
    let isEligibleSpy;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        mockAddDays.mockImplementation((date, days) => {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        });
        mockIsAfter.mockReturnValue(true);
        isEligibleSpy = globals_1.jest
            .spyOn(referral_service_1.ReferralService, "isEligible")
            .mockResolvedValue(true);
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("processCommissions()", () => {
        (0, globals_1.it)("should process tier 1 commission for direct referrer", async () => {
            const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
            const directReferrer = makeDirectReferrer();
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(buyer)
                .mockResolvedValueOnce(directReferrer);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaUser.findUnique).toHaveBeenCalledWith({
                where: { telegramId: BUYER_TELEGRAM_ID },
            });
            (0, globals_1.expect)(mockPrismaUser.findUnique).toHaveBeenCalledWith({
                where: { uuid: "uuid-direct-referrer" },
            });
            (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledWith({
                data: {
                    referrerId: DIRECT_REFERRER_TELEGRAM_ID,
                    referredId: BUYER_TELEGRAM_ID,
                    amount: TRANSACTION_AMOUNT * 0.15,
                    tier: 1,
                    status: "available",
                    availableAt: globals_1.expect.any(Date),
                },
            });
            (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith(globals_1.expect.stringContaining("Commission issued"));
        });
        (0, globals_1.it)("should process both tier 1 and tier 2 commissions when indirect referrer exists", async () => {
            const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
            const directReferrer = makeDirectReferrer({
                referredBy: "uuid-indirect-referrer",
            });
            const indirectReferrer = makeIndirectReferrer();
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(buyer)
                .mockResolvedValueOnce(directReferrer)
                .mockResolvedValueOnce(indirectReferrer);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledWith({
                data: globals_1.expect.objectContaining({
                    referrerId: DIRECT_REFERRER_TELEGRAM_ID,
                    amount: TRANSACTION_AMOUNT * 0.15,
                    tier: 1,
                }),
            });
            (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledWith({
                data: globals_1.expect.objectContaining({
                    referrerId: INDIRECT_REFERRER_TELEGRAM_ID,
                    amount: TRANSACTION_AMOUNT * 0.05,
                    tier: 2,
                }),
            });
            (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledTimes(2);
        });
        (0, globals_1.it)("should not process commissions when buyer has no referrer", async () => {
            const buyer = makeUser({ referredBy: null });
            mockPrismaUser.findUnique.mockResolvedValueOnce(buyer);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaCommission.create).not.toHaveBeenCalled();
            (0, globals_1.expect)(mockLogger.info).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should not process commissions when buyer not found", async () => {
            mockPrismaUser.findUnique.mockResolvedValueOnce(null);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaCommission.create).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should not process tier 1 commission when direct referrer not found", async () => {
            const buyer = makeUser({ referredBy: "uuid-nonexistent" });
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(buyer)
                .mockResolvedValueOnce(null);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaCommission.create).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should not process tier 1 commission when direct referrer is ineligible", async () => {
            isEligibleSpy.mockResolvedValueOnce(false);
            const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
            const directReferrer = makeDirectReferrer();
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(buyer)
                .mockResolvedValueOnce(directReferrer);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaCommission.create).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should not process tier 2 commission when indirect referrer not found", async () => {
            const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
            const directReferrer = makeDirectReferrer({
                referredBy: "uuid-nonexistent",
            });
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(buyer)
                .mockResolvedValueOnce(directReferrer)
                .mockResolvedValueOnce(null);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledTimes(1);
            (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledWith({
                data: globals_1.expect.objectContaining({
                    tier: 1,
                }),
            });
        });
        (0, globals_1.it)("should not process tier 2 commission when indirect referrer is ineligible", async () => {
            isEligibleSpy.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
            const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
            const directReferrer = makeDirectReferrer({
                referredBy: "uuid-indirect-referrer",
            });
            const indirectReferrer = makeIndirectReferrer();
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(buyer)
                .mockResolvedValueOnce(directReferrer)
                .mockResolvedValueOnce(indirectReferrer);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledTimes(1);
            (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledWith({
                data: globals_1.expect.objectContaining({
                    referrerId: DIRECT_REFERRER_TELEGRAM_ID,
                    tier: 1,
                }),
            });
        });
        (0, globals_1.it)("should handle database errors gracefully", async () => {
            const dbError = new Error("Database connection failed");
            mockPrismaUser.findUnique.mockRejectedValueOnce(dbError);
            await (0, globals_1.expect)(referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BUYER_TELEGRAM_ID)).resolves.not.toThrow();
            (0, globals_1.expect)(mockLogger.error).toHaveBeenCalledWith("Error processing MLM commissions:", dbError);
        });
        (0, globals_1.it)("should calculate correct commission amounts for different transaction values", async () => {
            const testCases = [
                { amount: 50000, expectedDirect: 7500, expectedIndirect: 2500 },
                { amount: 100000, expectedDirect: 15000, expectedIndirect: 5000 },
                { amount: 499000, expectedDirect: 74850, expectedIndirect: 24950 },
                { amount: 1000000, expectedDirect: 150000, expectedIndirect: 50000 },
            ];
            for (const testCase of testCases) {
                globals_1.jest.clearAllMocks();
                isEligibleSpy = globals_1.jest
                    .spyOn(referral_service_1.ReferralService, "isEligible")
                    .mockResolvedValue(true);
                const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
                const directReferrer = makeDirectReferrer({
                    referredBy: "uuid-indirect-referrer",
                });
                const indirectReferrer = makeIndirectReferrer();
                mockPrismaUser.findUnique
                    .mockResolvedValueOnce(buyer)
                    .mockResolvedValueOnce(directReferrer)
                    .mockResolvedValueOnce(indirectReferrer);
                await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, testCase.amount, BUYER_TELEGRAM_ID);
                (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledWith({
                    data: globals_1.expect.objectContaining({
                        amount: testCase.expectedDirect,
                        tier: 1,
                    }),
                });
                (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledWith({
                    data: globals_1.expect.objectContaining({
                        amount: testCase.expectedIndirect,
                        tier: 2,
                    }),
                });
            }
        });
        (0, globals_1.it)("should handle zero transaction amount", async () => {
            const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
            const directReferrer = makeDirectReferrer();
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(buyer)
                .mockResolvedValueOnce(directReferrer);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, 0, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledWith({
                data: globals_1.expect.objectContaining({
                    amount: 0,
                    tier: 1,
                }),
            });
        });
        (0, globals_1.it)("should prevent self-referral by checking referredBy UUID", async () => {
            const buyer = makeUser({ referredBy: "uuid-buyer-123" });
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(buyer)
                .mockResolvedValueOnce(null);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaCommission.create).not.toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)("isEligible()", () => {
        (0, globals_1.beforeEach)(() => {
            isEligibleSpy.mockRestore();
        });
        (0, globals_1.it)("should return true when user is within grace period after registration", async () => {
            const recentDate = new Date();
            const user = makeUser({
                telegramId: DIRECT_REFERRER_TELEGRAM_ID,
                createdAt: recentDate,
            });
            mockPrismaUser.findUnique.mockResolvedValueOnce(user);
            mockIsAfter.mockReturnValueOnce(true);
            const result = await referral_service_1.ReferralService.isEligible(DIRECT_REFERRER_TELEGRAM_ID);
            (0, globals_1.expect)(result).toBe(true);
            (0, globals_1.expect)(mockPrismaUser.findUnique).toHaveBeenCalledWith({
                where: { telegramId: DIRECT_REFERRER_TELEGRAM_ID },
            });
        });
        (0, globals_1.it)("should return true when user has recent successful transaction", async () => {
            const oldDate = new Date("2020-01-01");
            const user = makeUser({
                telegramId: DIRECT_REFERRER_TELEGRAM_ID,
                createdAt: oldDate,
            });
            const recentTransaction = {
                id: "tx-recent",
                createdAt: new Date(),
                status: "success",
            };
            mockPrismaUser.findUnique.mockResolvedValueOnce(user);
            mockIsAfter.mockReturnValueOnce(false).mockReturnValueOnce(true);
            mockPrismaTransaction.findFirst.mockResolvedValueOnce(recentTransaction);
            const result = await referral_service_1.ReferralService.isEligible(DIRECT_REFERRER_TELEGRAM_ID);
            (0, globals_1.expect)(result).toBe(true);
            (0, globals_1.expect)(mockPrismaTransaction.findFirst).toHaveBeenCalledWith({
                where: {
                    userId: DIRECT_REFERRER_TELEGRAM_ID,
                    status: "success",
                },
                orderBy: { createdAt: "desc" },
            });
        });
        (0, globals_1.it)("should return false when user not found", async () => {
            mockPrismaUser.findUnique.mockResolvedValueOnce(null);
            const result = await referral_service_1.ReferralService.isEligible(BigInt(999999));
            (0, globals_1.expect)(result).toBe(false);
        });
        (0, globals_1.it)("should return false when user has no transactions and grace period expired", async () => {
            const oldDate = new Date("2020-01-01");
            const user = makeUser({
                telegramId: DIRECT_REFERRER_TELEGRAM_ID,
                createdAt: oldDate,
            });
            mockPrismaUser.findUnique.mockResolvedValueOnce(user);
            mockIsAfter.mockReturnValueOnce(false);
            mockPrismaTransaction.findFirst.mockResolvedValueOnce(null);
            const result = await referral_service_1.ReferralService.isEligible(DIRECT_REFERRER_TELEGRAM_ID);
            (0, globals_1.expect)(result).toBe(false);
        });
        (0, globals_1.it)("should return false when last transaction is outside activity window", async () => {
            const oldDate = new Date("2020-01-01");
            const user = makeUser({
                telegramId: DIRECT_REFERRER_TELEGRAM_ID,
                createdAt: oldDate,
            });
            const oldTransaction = {
                id: "tx-old",
                createdAt: new Date("2023-01-01"),
                status: "success",
            };
            mockPrismaUser.findUnique.mockResolvedValueOnce(user);
            mockIsAfter.mockReturnValueOnce(false).mockReturnValueOnce(false);
            mockPrismaTransaction.findFirst.mockResolvedValueOnce(oldTransaction);
            const result = await referral_service_1.ReferralService.isEligible(DIRECT_REFERRER_TELEGRAM_ID);
            (0, globals_1.expect)(result).toBe(false);
        });
        (0, globals_1.it)("should check only successful transactions", async () => {
            const user = makeUser({
                telegramId: DIRECT_REFERRER_TELEGRAM_ID,
                createdAt: new Date("2020-01-01"),
            });
            mockPrismaUser.findUnique.mockResolvedValueOnce(user);
            mockIsAfter.mockReturnValueOnce(false);
            mockPrismaTransaction.findFirst.mockResolvedValueOnce(null);
            await referral_service_1.ReferralService.isEligible(DIRECT_REFERRER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaTransaction.findFirst).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                where: globals_1.expect.objectContaining({
                    status: "success",
                }),
            }));
        });
        (0, globals_1.it)("should use ACTIVITY_WINDOW_DAYS from config", async () => {
            const user = makeUser({
                telegramId: DIRECT_REFERRER_TELEGRAM_ID,
                createdAt: new Date("2020-01-01"),
            });
            const transaction = {
                id: "tx-1",
                createdAt: new Date(),
                status: "success",
            };
            mockPrismaUser.findUnique.mockResolvedValueOnce(user);
            mockIsAfter.mockReturnValueOnce(false);
            mockPrismaTransaction.findFirst.mockResolvedValueOnce(transaction);
            await referral_service_1.ReferralService.isEligible(DIRECT_REFERRER_TELEGRAM_ID);
            (0, globals_1.expect)(mockAddDays).toHaveBeenCalledWith(globals_1.expect.any(Date), 30);
        });
    });
    (0, globals_1.describe)("Edge Cases", () => {
        (0, globals_1.it)("should handle concurrent commission processing", async () => {
            const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
            const directReferrer = makeDirectReferrer();
            mockPrismaUser.findUnique.mockResolvedValue(buyer);
            mockPrismaUser.findUnique.mockResolvedValueOnce(directReferrer);
            const promises = [
                referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BUYER_TELEGRAM_ID),
                referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BUYER_TELEGRAM_ID),
            ];
            await (0, globals_1.expect)(Promise.all(promises)).resolves.not.toThrow();
        });
        (0, globals_1.it)("should handle very large transaction amounts", async () => {
            const largeAmount = 999999999;
            const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
            const directReferrer = makeDirectReferrer();
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(buyer)
                .mockResolvedValueOnce(directReferrer);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, largeAmount, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledWith({
                data: globals_1.expect.objectContaining({
                    amount: largeAmount * 0.15,
                }),
            });
        });
        (0, globals_1.it)("should handle negative transaction amounts gracefully", async () => {
            const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
            const directReferrer = makeDirectReferrer();
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(buyer)
                .mockResolvedValueOnce(directReferrer);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, -1000, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledWith({
                data: globals_1.expect.objectContaining({
                    amount: -150,
                }),
            });
        });
        (0, globals_1.it)("should handle decimal transaction amounts", async () => {
            const decimalAmount = 99.99;
            const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
            const directReferrer = makeDirectReferrer();
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(buyer)
                .mockResolvedValueOnce(directReferrer);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, decimalAmount, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledWith({
                data: globals_1.expect.objectContaining({
                    amount: decimalAmount * 0.15,
                }),
            });
        });
        (0, globals_1.it)("should create commission with correct status and availableAt", async () => {
            const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
            const directReferrer = makeDirectReferrer();
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(buyer)
                .mockResolvedValueOnce(directReferrer);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledWith({
                data: globals_1.expect.objectContaining({
                    status: "available",
                    availableAt: globals_1.expect.any(Date),
                }),
            });
        });
        (0, globals_1.it)("should log commission details correctly", async () => {
            const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
            const directReferrer = makeDirectReferrer();
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(buyer)
                .mockResolvedValueOnce(directReferrer);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BUYER_TELEGRAM_ID);
            (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith(globals_1.expect.stringContaining(`IDR ${TRANSACTION_AMOUNT * 0.15}`));
            (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith(globals_1.expect.stringContaining("Tier 1"));
        });
        (0, globals_1.it)("should handle circular referral chain (A -> B -> A)", async () => {
            const buyerA = makeUser({
                telegramId: BigInt(111),
                uuid: "uuid-a",
                referredBy: "uuid-b",
            });
            const referrerB = {
                telegramId: BigInt(222),
                uuid: "uuid-b",
                referredBy: "uuid-a",
            };
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(buyerA)
                .mockResolvedValueOnce(referrerB)
                .mockResolvedValueOnce(null);
            await referral_service_1.ReferralService.processCommissions(TRANSACTION_ID, TRANSACTION_AMOUNT, BigInt(111));
            (0, globals_1.expect)(mockPrismaCommission.create).toHaveBeenCalledTimes(1);
        });
    });
});
//# sourceMappingURL=referral.service.test.js.map