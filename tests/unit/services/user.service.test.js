"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const mockPrismaUser = {
    findUnique: globals_1.jest.fn(),
    create: globals_1.jest.fn(),
    update: globals_1.jest.fn(),
    count: globals_1.jest.fn(),
};
const mockPrismaTransaction = {
    create: globals_1.jest.fn(),
    aggregate: globals_1.jest.fn(),
};
const mockPrismaVideo = {
    count: globals_1.jest.fn(),
};
const mockPrismaCommission = {
    aggregate: globals_1.jest.fn(),
};
const mockPrisma = {
    user: mockPrismaUser,
    transaction: mockPrismaTransaction,
    video: mockPrismaVideo,
    commission: mockPrismaCommission,
    $transaction: globals_1.jest.fn(),
};
globals_1.jest.mock("@/config/database", () => ({
    prisma: mockPrisma,
}));
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/config/redis", () => ({
    redis: {
        get: globals_1.jest.fn(),
        set: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/i18n/translations", () => ({
    t: globals_1.jest.fn((key) => `[translated:${key}]`),
}));
const user_service_1 = require("@/services/user.service");
const logger_1 = require("@/utils/logger");
function makeUser(overrides = {}) {
    return {
        telegramId: BigInt(123456789),
        uuid: "uuid-abc-123",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        tier: "free",
        creditBalance: 3,
        referralCode: "REF-TEST-ABCD",
        referredBy: null,
        language: "id",
        notificationsEnabled: true,
        isBanned: false,
        banReason: null,
        bannedAt: null,
        lastActivityAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
(0, globals_1.describe)("UserService", () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)("findByTelegramId()", () => {
        (0, globals_1.it)("should return user when found", async () => {
            const user = makeUser();
            mockPrismaUser.findUnique.mockResolvedValue(user);
            const result = await user_service_1.UserService.findByTelegramId(BigInt(123456789));
            (0, globals_1.expect)(result).toEqual(user);
            (0, globals_1.expect)(mockPrismaUser.findUnique).toHaveBeenCalledWith({
                where: { telegramId: BigInt(123456789) },
            });
        });
        (0, globals_1.it)("should return null when user not found", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);
            const result = await user_service_1.UserService.findByTelegramId(BigInt(999));
            (0, globals_1.expect)(result).toBeNull();
        });
    });
    (0, globals_1.describe)("findByUuid()", () => {
        (0, globals_1.it)("should return user when found by UUID", async () => {
            const user = makeUser();
            mockPrismaUser.findUnique.mockResolvedValue(user);
            const result = await user_service_1.UserService.findByUuid("uuid-abc-123");
            (0, globals_1.expect)(result).toEqual(user);
            (0, globals_1.expect)(mockPrismaUser.findUnique).toHaveBeenCalledWith({
                where: { uuid: "uuid-abc-123" },
            });
        });
        (0, globals_1.it)("should return null when UUID not found", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);
            const result = await user_service_1.UserService.findByUuid("nonexistent");
            (0, globals_1.expect)(result).toBeNull();
        });
    });
    (0, globals_1.describe)("findByReferralCode()", () => {
        (0, globals_1.it)("should return user when referral code matches", async () => {
            const user = makeUser();
            mockPrismaUser.findUnique.mockResolvedValue(user);
            const result = await user_service_1.UserService.findByReferralCode("REF-TEST-ABCD");
            (0, globals_1.expect)(result).toEqual(user);
            (0, globals_1.expect)(mockPrismaUser.findUnique).toHaveBeenCalledWith({
                where: { referralCode: "REF-TEST-ABCD" },
            });
        });
        (0, globals_1.it)("should return null for invalid referral code", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);
            const result = await user_service_1.UserService.findByReferralCode("INVALID");
            (0, globals_1.expect)(result).toBeNull();
        });
    });
    (0, globals_1.describe)("create()", () => {
        (0, globals_1.it)("should create user with all fields", async () => {
            const createdUser = makeUser({ referredBy: "uuid-referrer" });
            mockPrismaUser.findUnique.mockResolvedValue(null);
            mockPrismaUser.create.mockResolvedValue(createdUser);
            const result = await user_service_1.UserService.create({
                telegramId: BigInt(123456789),
                username: "testuser",
                firstName: "Test",
                lastName: "User",
                referredBy: "uuid-referrer",
                language: "id",
            });
            (0, globals_1.expect)(result).toEqual(createdUser);
            (0, globals_1.expect)(mockPrismaUser.create).toHaveBeenCalled();
            (0, globals_1.expect)(logger_1.logger.info).toHaveBeenCalledWith(globals_1.expect.stringContaining("Created new user"));
        });
        (0, globals_1.it)("should create user with minimal fields and defaults", async () => {
            const createdUser = makeUser({
                username: undefined,
                lastName: undefined,
                referredBy: undefined,
                language: "id",
            });
            mockPrismaUser.findUnique.mockResolvedValue(null);
            mockPrismaUser.create.mockResolvedValue(createdUser);
            const result = await user_service_1.UserService.create({
                telegramId: BigInt(123456789),
                firstName: "Test",
            });
            (0, globals_1.expect)(result).toEqual(createdUser);
            const createCall = mockPrismaUser.create.mock.calls[0][0];
            (0, globals_1.expect)(createCall.data.tier).toBe("free");
            (0, globals_1.expect)(createCall.data.creditBalance).toBe(3);
            (0, globals_1.expect)(createCall.data.language).toBe("id");
            (0, globals_1.expect)(createCall.data.notificationsEnabled).toBe(true);
        });
        (0, globals_1.it)("should use provided language over default", async () => {
            const createdUser = makeUser({ language: "en" });
            mockPrismaUser.findUnique.mockResolvedValue(null);
            mockPrismaUser.create.mockResolvedValue(createdUser);
            await user_service_1.UserService.create({
                telegramId: BigInt(123456789),
                firstName: "Test",
                language: "en",
            });
            const createCall = mockPrismaUser.create.mock.calls[0][0];
            (0, globals_1.expect)(createCall.data.language).toBe("en");
        });
    });
    (0, globals_1.describe)("update()", () => {
        (0, globals_1.it)("should update user fields", async () => {
            const updatedUser = makeUser({ username: "newname" });
            mockPrismaUser.update.mockResolvedValue(updatedUser);
            const result = await user_service_1.UserService.update(BigInt(123456789), {
                username: "newname",
            });
            (0, globals_1.expect)(result).toEqual(updatedUser);
            (0, globals_1.expect)(mockPrismaUser.update).toHaveBeenCalledWith({
                where: { telegramId: BigInt(123456789) },
                data: globals_1.expect.objectContaining({ username: "newname" }),
            });
        });
        (0, globals_1.it)("should set updatedAt on update", async () => {
            mockPrismaUser.update.mockResolvedValue(makeUser());
            await user_service_1.UserService.update(BigInt(123456789), { tier: "pro" });
            const updateCall = mockPrismaUser.update.mock.calls[0][0];
            (0, globals_1.expect)(updateCall.data.updatedAt).toBeInstanceOf(Date);
        });
    });
    (0, globals_1.describe)("updateActivity()", () => {
        (0, globals_1.it)("should update lastActivityAt", async () => {
            mockPrismaUser.update.mockResolvedValue(makeUser());
            await user_service_1.UserService.updateActivity(BigInt(123456789));
            (0, globals_1.expect)(mockPrismaUser.update).toHaveBeenCalledWith({
                where: { telegramId: BigInt(123456789) },
                data: { lastActivityAt: globals_1.expect.any(Date) },
            });
        });
    });
    (0, globals_1.describe)("addCredits()", () => {
        (0, globals_1.it)("should increment credit balance", async () => {
            const updatedUser = makeUser({ creditBalance: 13 });
            mockPrismaUser.update.mockResolvedValue(updatedUser);
            const result = await user_service_1.UserService.addCredits(BigInt(123456789), 10);
            (0, globals_1.expect)(result.creditBalance).toBe(13);
            (0, globals_1.expect)(mockPrismaUser.update).toHaveBeenCalledWith({
                where: { telegramId: BigInt(123456789) },
                data: { creditBalance: { increment: 10 } },
            });
        });
        (0, globals_1.it)("should handle zero amount", async () => {
            mockPrismaUser.update.mockResolvedValue(makeUser());
            await user_service_1.UserService.addCredits(BigInt(123456789), 0);
            (0, globals_1.expect)(mockPrismaUser.update).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                data: { creditBalance: { increment: 0 } },
            }));
        });
    });
    (0, globals_1.describe)("grantCredits()", () => {
        (0, globals_1.it)("should log reason and call addCredits", async () => {
            const updatedUser = makeUser({ creditBalance: 8 });
            mockPrismaUser.update.mockResolvedValue(updatedUser);
            const result = await user_service_1.UserService.grantCredits(BigInt(123456789), 5, "referral bonus");
            (0, globals_1.expect)(result.creditBalance).toBe(8);
            (0, globals_1.expect)(logger_1.logger.info).toHaveBeenCalledWith(globals_1.expect.stringContaining("referral bonus"));
            (0, globals_1.expect)(mockPrismaUser.update).toHaveBeenCalledWith({
                where: { telegramId: BigInt(123456789) },
                data: { creditBalance: { increment: 5 } },
            });
        });
    });
    (0, globals_1.describe)("deductCredits()", () => {
        (0, globals_1.it)("should deduct credits when balance is sufficient", async () => {
            const user = makeUser({ creditBalance: 5 });
            const updatedUser = makeUser({ creditBalance: 4 });
            mockPrismaUser.findUnique.mockResolvedValue(user);
            mockPrismaUser.update.mockResolvedValue(updatedUser);
            const result = await user_service_1.UserService.deductCredits(BigInt(123456789), 1);
            (0, globals_1.expect)(result.creditBalance).toBe(4);
            (0, globals_1.expect)(mockPrismaUser.update).toHaveBeenCalledWith({
                where: { telegramId: BigInt(123456789) },
                data: { creditBalance: { decrement: 1 } },
            });
        });
        (0, globals_1.it)("should throw when user not found", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);
            await (0, globals_1.expect)(user_service_1.UserService.deductCredits(BigInt(999), 1)).rejects.toThrow("Insufficient credits");
        });
        (0, globals_1.it)("should throw when credits are insufficient", async () => {
            const user = makeUser({ creditBalance: 0 });
            mockPrismaUser.findUnique.mockResolvedValue(user);
            await (0, globals_1.expect)(user_service_1.UserService.deductCredits(BigInt(123456789), 5)).rejects.toThrow("Insufficient credits");
        });
        (0, globals_1.it)("should throw when deducting more than available", async () => {
            const user = makeUser({ creditBalance: 2 });
            mockPrismaUser.findUnique.mockResolvedValue(user);
            await (0, globals_1.expect)(user_service_1.UserService.deductCredits(BigInt(123456789), 3)).rejects.toThrow("Insufficient credits");
        });
        (0, globals_1.it)("should allow deducting exact balance", async () => {
            const user = makeUser({ creditBalance: 3 });
            const updatedUser = makeUser({ creditBalance: 0 });
            mockPrismaUser.findUnique.mockResolvedValue(user);
            mockPrismaUser.update.mockResolvedValue(updatedUser);
            const result = await user_service_1.UserService.deductCredits(BigInt(123456789), 3);
            (0, globals_1.expect)(result.creditBalance).toBe(0);
        });
    });
    (0, globals_1.describe)("refundCredits()", () => {
        (0, globals_1.it)("should refund credits in a transaction", async () => {
            mockPrisma.$transaction.mockResolvedValue([]);
            await user_service_1.UserService.refundCredits(BigInt(123456789), 2, "job-abc", "processing failed");
            (0, globals_1.expect)(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
            const operations = mockPrisma.$transaction.mock.calls[0][0];
            (0, globals_1.expect)(operations).toHaveLength(2);
        });
        (0, globals_1.it)("should pass two operations to transaction", async () => {
            mockPrisma.$transaction.mockResolvedValue([]);
            await user_service_1.UserService.refundCredits(BigInt(123456789), 2, "job-xyz", "timeout");
            const operations = mockPrisma.$transaction.mock.calls[0][0];
            (0, globals_1.expect)(operations).toHaveLength(2);
        });
    });
    (0, globals_1.describe)("hasEnoughCredits()", () => {
        (0, globals_1.it)("should return true when user has enough credits", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(makeUser({ creditBalance: 5 }));
            const result = await user_service_1.UserService.hasEnoughCredits(BigInt(123456789), 3);
            (0, globals_1.expect)(result).toBe(true);
        });
        (0, globals_1.it)("should return true when credits equal required amount", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(makeUser({ creditBalance: 3 }));
            const result = await user_service_1.UserService.hasEnoughCredits(BigInt(123456789), 3);
            (0, globals_1.expect)(result).toBe(true);
        });
        (0, globals_1.it)("should return false when credits are insufficient", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(makeUser({ creditBalance: 1 }));
            const result = await user_service_1.UserService.hasEnoughCredits(BigInt(123456789), 5);
            (0, globals_1.expect)(result).toBe(false);
        });
        (0, globals_1.it)("should return false when user not found", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);
            const result = await user_service_1.UserService.hasEnoughCredits(BigInt(999), 1);
            (0, globals_1.expect)(result).toBe(false);
        });
    });
    (0, globals_1.describe)("generateReferralCode()", () => {
        (0, globals_1.it)("should generate a code with REF- prefix", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);
            const code = await user_service_1.UserService.generateReferralCode("TestUser");
            (0, globals_1.expect)(code).toMatch(/^REF-/);
        });
        (0, globals_1.it)("should include sanitized name in code", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);
            const code = await user_service_1.UserService.generateReferralCode("JohnDoe");
            (0, globals_1.expect)(code).toMatch(/^REF-JOHNDOE-/);
        });
        (0, globals_1.it)("should strip non-alphanumeric characters from name", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);
            const code = await user_service_1.UserService.generateReferralCode("John-Doe!@#");
            (0, globals_1.expect)(code).toMatch(/^REF-JOHNDOE-/);
        });
        (0, globals_1.it)("should truncate name to 8 characters", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);
            const code = await user_service_1.UserService.generateReferralCode("VeryLongUserName");
            (0, globals_1.expect)(code).toMatch(/^REF-VERYLONG-/);
        });
        (0, globals_1.it)("should fallback to USER when name is empty after sanitization", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);
            const code = await user_service_1.UserService.generateReferralCode("!@#$%");
            (0, globals_1.expect)(code).toMatch(/^REF-USER-/);
        });
        (0, globals_1.it)("should retry when code collision occurs", async () => {
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(makeUser())
                .mockResolvedValueOnce(null);
            const code = await user_service_1.UserService.generateReferralCode("Test");
            (0, globals_1.expect)(code).toMatch(/^REF-TEST-/);
            (0, globals_1.expect)(mockPrismaUser.findUnique).toHaveBeenCalledTimes(2);
        });
        (0, globals_1.it)("should fallback to UUID-based code after 10 collisions", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(makeUser());
            const code = await user_service_1.UserService.generateReferralCode("Test");
            (0, globals_1.expect)(code).toMatch(/^REF-[A-Z0-9]{8}$/);
            (0, globals_1.expect)(mockPrismaUser.findUnique).toHaveBeenCalledTimes(10);
        });
    });
    (0, globals_1.describe)("ban()", () => {
        (0, globals_1.it)("should ban user with reason", async () => {
            const bannedUser = makeUser({
                isBanned: true,
                banReason: "spam",
                bannedAt: new Date(),
            });
            mockPrismaUser.update.mockResolvedValue(bannedUser);
            const result = await user_service_1.UserService.ban(BigInt(123456789), "spam");
            (0, globals_1.expect)(result.isBanned).toBe(true);
            (0, globals_1.expect)(result.banReason).toBe("spam");
            (0, globals_1.expect)(mockPrismaUser.update).toHaveBeenCalledWith({
                where: { telegramId: BigInt(123456789) },
                data: {
                    isBanned: true,
                    banReason: "spam",
                    bannedAt: globals_1.expect.any(Date),
                },
            });
        });
    });
    (0, globals_1.describe)("unban()", () => {
        (0, globals_1.it)("should unban user and clear reason", async () => {
            const unbannedUser = makeUser({
                isBanned: false,
                banReason: null,
                bannedAt: null,
            });
            mockPrismaUser.update.mockResolvedValue(unbannedUser);
            const result = await user_service_1.UserService.unban(BigInt(123456789));
            (0, globals_1.expect)(result.isBanned).toBe(false);
            (0, globals_1.expect)(result.banReason).toBeNull();
            (0, globals_1.expect)(result.bannedAt).toBeNull();
        });
    });
    (0, globals_1.describe)("getDailyGenerationCount()", () => {
        (0, globals_1.it)("should count videos created today", async () => {
            mockPrismaVideo.count.mockResolvedValue(5);
            const count = await user_service_1.UserService.getDailyGenerationCount(BigInt(123456789));
            (0, globals_1.expect)(count).toBe(5);
            (0, globals_1.expect)(mockPrismaVideo.count).toHaveBeenCalledWith({
                where: {
                    userId: BigInt(123456789),
                    createdAt: { gte: globals_1.expect.any(Date) },
                },
            });
        });
        (0, globals_1.it)("should return 0 when no videos today", async () => {
            mockPrismaVideo.count.mockResolvedValue(0);
            const count = await user_service_1.UserService.getDailyGenerationCount(BigInt(123456789));
            (0, globals_1.expect)(count).toBe(0);
        });
    });
    (0, globals_1.describe)("canGenerate()", () => {
        (0, globals_1.it)("should return allowed=true when under daily limit", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(makeUser({ tier: "free" }));
            mockPrismaVideo.count.mockResolvedValue(1);
            const result = await user_service_1.UserService.canGenerate(BigInt(123456789));
            (0, globals_1.expect)(result.allowed).toBe(true);
            (0, globals_1.expect)(result.remaining).toBe(1);
            (0, globals_1.expect)(result.limit).toBe(2);
        });
        (0, globals_1.it)("should return allowed=false when at daily limit", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(makeUser({ tier: "free" }));
            mockPrismaVideo.count.mockResolvedValue(2);
            const result = await user_service_1.UserService.canGenerate(BigInt(123456789));
            (0, globals_1.expect)(result.allowed).toBe(false);
            (0, globals_1.expect)(result.remaining).toBe(0);
        });
        (0, globals_1.it)("should return allowed=false when user not found", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);
            const result = await user_service_1.UserService.canGenerate(BigInt(999));
            (0, globals_1.expect)(result.allowed).toBe(false);
            (0, globals_1.expect)(result.remaining).toBe(0);
            (0, globals_1.expect)(result.limit).toBe(0);
        });
        (0, globals_1.it)("should use correct limit for pro tier", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(makeUser({ tier: "pro" }));
            mockPrismaVideo.count.mockResolvedValue(5);
            const result = await user_service_1.UserService.canGenerate(BigInt(123456789));
            (0, globals_1.expect)(result.limit).toBe(10);
            (0, globals_1.expect)(result.remaining).toBe(5);
        });
        (0, globals_1.it)("should use correct limit for agency tier", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(makeUser({ tier: "agency" }));
            mockPrismaVideo.count.mockResolvedValue(0);
            const result = await user_service_1.UserService.canGenerate(BigInt(123456789));
            (0, globals_1.expect)(result.limit).toBe(30);
            (0, globals_1.expect)(result.remaining).toBe(30);
        });
        (0, globals_1.it)("should default to free limit for unknown tier", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(makeUser({ tier: "unknown" }));
            mockPrismaVideo.count.mockResolvedValue(0);
            const result = await user_service_1.UserService.canGenerate(BigInt(123456789));
            (0, globals_1.expect)(result.limit).toBe(2);
        });
        (0, globals_1.it)("should default to free limit when tier is null", async () => {
            mockPrismaUser.findUnique.mockResolvedValue(makeUser({ tier: null }));
            mockPrismaVideo.count.mockResolvedValue(0);
            const result = await user_service_1.UserService.canGenerate(BigInt(123456789));
            (0, globals_1.expect)(result.limit).toBe(2);
        });
    });
    (0, globals_1.describe)("getStats()", () => {
        (0, globals_1.it)("should return aggregated stats", async () => {
            const user = makeUser();
            mockPrismaUser.findUnique.mockResolvedValue(user);
            mockPrismaVideo.count.mockResolvedValue(42);
            mockPrismaTransaction.aggregate.mockResolvedValue({
                _sum: { amountIdr: 500000 },
            });
            mockPrismaUser.count.mockResolvedValue(7);
            mockPrismaCommission.aggregate.mockResolvedValue({
                _sum: { amount: 25000 },
            });
            const stats = await user_service_1.UserService.getStats(BigInt(123456789));
            (0, globals_1.expect)(stats.videosCreated).toBe(42);
            (0, globals_1.expect)(stats.totalSpent).toBe(500000);
            (0, globals_1.expect)(stats.referralCount).toBe(7);
            (0, globals_1.expect)(stats.commissionEarned).toBe(25000);
        });
        (0, globals_1.it)("should handle null aggregates gracefully", async () => {
            const user = makeUser();
            mockPrismaUser.findUnique.mockResolvedValue(user);
            mockPrismaVideo.count.mockResolvedValue(0);
            mockPrismaTransaction.aggregate.mockResolvedValue({
                _sum: { amountIdr: null },
            });
            mockPrismaUser.count.mockResolvedValue(0);
            mockPrismaCommission.aggregate.mockResolvedValue({
                _sum: { amount: null },
            });
            const stats = await user_service_1.UserService.getStats(BigInt(123456789));
            (0, globals_1.expect)(stats.totalSpent).toBe(0);
            (0, globals_1.expect)(stats.commissionEarned).toBe(0);
        });
    });
    (0, globals_1.describe)("setBotInstance()", () => {
        (0, globals_1.it)("should not throw when setting bot instance", () => {
            const mockBot = { telegram: { sendMessage: globals_1.jest.fn() } };
            (0, globals_1.expect)(() => user_service_1.UserService.setBotInstance(mockBot)).not.toThrow();
        });
    });
});
//# sourceMappingURL=user.service.test.js.map