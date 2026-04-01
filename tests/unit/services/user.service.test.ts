import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockPrismaUser = {
  findUnique: jest.fn<any>(),
  create: jest.fn<any>(),
  update: jest.fn<any>(),
  updateMany: jest.fn<any>(),
  count: jest.fn<any>(),
};

const mockPrismaTransaction = {
  create: jest.fn<any>(),
  aggregate: jest.fn<any>(),
};

const mockPrismaVideo = {
  count: jest.fn<any>(),
};

const mockPrismaCommission = {
  aggregate: jest.fn<any>(),
};

const mockPrisma = {
  user: mockPrismaUser,
  transaction: mockPrismaTransaction,
  video: mockPrismaVideo,
  commission: mockPrismaCommission,
  $transaction: jest.fn<any>(),
  $executeRaw: jest.fn<any>().mockResolvedValue(0),
};

jest.mock("@/config/database", () => ({
  prisma: mockPrisma,
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/config/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock("@/i18n/translations", () => ({
  t: jest.fn((key: string) => `[translated:${key}]`),
}));

import { UserService } from "@/services/user.service";
import { logger } from "@/utils/logger";

function makeUser(overrides: Record<string, unknown> = {}) {
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

describe("UserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findByTelegramId()", () => {
    it("should return user when found", async () => {
      const user = makeUser();
      mockPrismaUser.findUnique.mockResolvedValue(user);

      const result = await UserService.findByTelegramId(BigInt(123456789));

      expect(result).toEqual(user);
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { telegramId: BigInt(123456789) },
      });
    });

    it("should return null when user not found", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const result = await UserService.findByTelegramId(BigInt(999));

      expect(result).toBeNull();
    });
  });

  describe("findByUuid()", () => {
    it("should return user when found by UUID", async () => {
      const user = makeUser();
      mockPrismaUser.findUnique.mockResolvedValue(user);

      const result = await UserService.findByUuid("uuid-abc-123");

      expect(result).toEqual(user);
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { uuid: "uuid-abc-123" },
      });
    });

    it("should return null when UUID not found", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const result = await UserService.findByUuid("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findByReferralCode()", () => {
    it("should return user when referral code matches", async () => {
      const user = makeUser();
      mockPrismaUser.findUnique.mockResolvedValue(user);

      const result = await UserService.findByReferralCode("REF-TEST-ABCD");

      expect(result).toEqual(user);
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { referralCode: "REF-TEST-ABCD" },
      });
    });

    it("should return null for invalid referral code", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const result = await UserService.findByReferralCode("INVALID");

      expect(result).toBeNull();
    });
  });

  describe("create()", () => {
    it("should create user with all fields", async () => {
      const createdUser = makeUser({ referredBy: "uuid-referrer" });
      mockPrismaUser.findUnique.mockResolvedValue(null);
      mockPrismaUser.create.mockResolvedValue(createdUser);

      const result = await UserService.create({
        telegramId: BigInt(123456789),
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        referredBy: "uuid-referrer",
        language: "id",
      });

      expect(result).toEqual(createdUser);
      expect(mockPrismaUser.create).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Created new user"),
      );
    });

    it("should create user with minimal fields and defaults", async () => {
      const createdUser = makeUser({
        username: undefined,
        lastName: undefined,
        referredBy: undefined,
        language: "id",
      });
      mockPrismaUser.findUnique.mockResolvedValue(null);
      mockPrismaUser.create.mockResolvedValue(createdUser);

      const result = await UserService.create({
        telegramId: BigInt(123456789),
        firstName: "Test",
      });

      expect(result).toEqual(createdUser);
      const createCall = mockPrismaUser.create.mock.calls[0][0] as any;
      expect(createCall.data.tier).toBe("free");
      expect(createCall.data.creditBalance).toBe(0);
      expect(createCall.data.language).toBe("id");
      expect(createCall.data.notificationsEnabled).toBe(true);
    });

    it("should use provided language over default", async () => {
      const createdUser = makeUser({ language: "en" });
      mockPrismaUser.findUnique.mockResolvedValue(null);
      mockPrismaUser.create.mockResolvedValue(createdUser);

      await UserService.create({
        telegramId: BigInt(123456789),
        firstName: "Test",
        language: "en",
      });

      const createCall = mockPrismaUser.create.mock.calls[0][0] as any;
      expect(createCall.data.language).toBe("en");
    });
  });

  describe("update()", () => {
    it("should update user fields", async () => {
      const updatedUser = makeUser({ username: "newname" });
      mockPrismaUser.update.mockResolvedValue(updatedUser);

      const result = await UserService.update(BigInt(123456789), {
        username: "newname",
      });

      expect(result).toEqual(updatedUser);
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { telegramId: BigInt(123456789) },
        data: expect.objectContaining({ username: "newname" }),
      });
    });

    it("should set updatedAt on update", async () => {
      mockPrismaUser.update.mockResolvedValue(makeUser());

      await UserService.update(BigInt(123456789), { tier: "pro" });

      const updateCall = mockPrismaUser.update.mock.calls[0][0] as any;
      expect(updateCall.data.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("updateActivity()", () => {
    it("should update lastActivityAt", async () => {
      mockPrismaUser.update.mockResolvedValue(makeUser());

      await UserService.updateActivity(BigInt(123456789));

      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { telegramId: BigInt(123456789) },
        data: { lastActivityAt: expect.any(Date) },
      });
    });
  });

  describe("addCredits()", () => {
    it("should increment credit balance", async () => {
      const updatedUser = makeUser({ creditBalance: 13 });
      mockPrismaUser.update.mockResolvedValue(updatedUser);

      const result = await UserService.addCredits(BigInt(123456789), 10);

      expect(result.creditBalance).toBe(13);
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { telegramId: BigInt(123456789) },
        data: { creditBalance: { increment: 10 } },
      });
    });

    it("should handle zero amount", async () => {
      mockPrismaUser.update.mockResolvedValue(makeUser());

      await UserService.addCredits(BigInt(123456789), 0);

      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { creditBalance: { increment: 0 } },
        }),
      );
    });
  });

  describe("grantCredits()", () => {
    it("should log reason and call addCredits", async () => {
      const updatedUser = makeUser({ creditBalance: 8 });
      mockPrismaUser.update.mockResolvedValue(updatedUser);

      const result = await UserService.grantCredits(
        BigInt(123456789),
        5,
        "referral bonus",
      );

      expect(result.creditBalance).toBe(8);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("referral bonus"),
      );
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { telegramId: BigInt(123456789) },
        data: { creditBalance: { increment: 5 } },
      });
    });
  });

  describe("deductCredits()", () => {
    it("should deduct credits when balance is sufficient", async () => {
      // Atomic pattern: updateMany WHERE balance >= amount → count=1 means success
      // Then findUnique is called to return the updated user
      const updatedUser = makeUser({ creditBalance: 4 });
      mockPrismaUser.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaUser.findUnique.mockResolvedValue(updatedUser);

      const result = await UserService.deductCredits(BigInt(123456789), 1);

      expect(result.creditBalance).toBe(4);
      expect(mockPrismaUser.updateMany).toHaveBeenCalledWith({
        where: {
          telegramId: BigInt(123456789),
          creditBalance: { gte: 1 },
        },
        data: { creditBalance: { decrement: 1 } },
      });
    });

    it("should throw when balance is insufficient (count=0)", async () => {
      // count=0 means the WHERE condition (balance >= amount) was not met
      mockPrismaUser.updateMany.mockResolvedValue({ count: 0 });

      await expect(UserService.deductCredits(BigInt(123456789), 5)).rejects.toThrow(
        "Insufficient credits",
      );
    });

    it("should throw when user not found (count=0)", async () => {
      mockPrismaUser.updateMany.mockResolvedValue({ count: 0 });

      await expect(UserService.deductCredits(BigInt(999), 1)).rejects.toThrow(
        "Insufficient credits",
      );
    });

    it("should throw when deducting more than available", async () => {
      mockPrismaUser.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        UserService.deductCredits(BigInt(123456789), 3),
      ).rejects.toThrow("Insufficient credits");
    });

    it("should allow deducting exact balance", async () => {
      const updatedUser = makeUser({ creditBalance: 0 });
      mockPrismaUser.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaUser.findUnique.mockResolvedValue(updatedUser);

      const result = await UserService.deductCredits(BigInt(123456789), 3);

      expect(result.creditBalance).toBe(0);
    });
  });

  describe("refundCredits()", () => {
    it("should refund credits in a transaction", async () => {
      mockPrisma.$transaction.mockResolvedValue([]);

      await UserService.refundCredits(
        BigInt(123456789),
        2,
        "job-abc",
        "processing failed",
      );

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      const operations = mockPrisma.$transaction.mock.calls[0][0] as any[];
      expect(operations).toHaveLength(2);
    });

    it("should pass two operations to transaction", async () => {
      mockPrisma.$transaction.mockResolvedValue([]);

      await UserService.refundCredits(
        BigInt(123456789),
        2,
        "job-xyz",
        "timeout",
      );

      const operations = mockPrisma.$transaction.mock.calls[0][0] as any[];
      expect(operations).toHaveLength(2);
    });
  });

  describe("hasEnoughCredits()", () => {
    it("should return true when user has enough credits", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(
        makeUser({ creditBalance: 5 }),
      );

      const result = await UserService.hasEnoughCredits(BigInt(123456789), 3);

      expect(result).toBe(true);
    });

    it("should return true when credits equal required amount", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(
        makeUser({ creditBalance: 3 }),
      );

      const result = await UserService.hasEnoughCredits(BigInt(123456789), 3);

      expect(result).toBe(true);
    });

    it("should return false when credits are insufficient", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(
        makeUser({ creditBalance: 1 }),
      );

      const result = await UserService.hasEnoughCredits(BigInt(123456789), 5);

      expect(result).toBe(false);
    });

    it("should return false when user not found", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const result = await UserService.hasEnoughCredits(BigInt(999), 1);

      expect(result).toBe(false);
    });
  });

  describe("generateReferralCode()", () => {
    it("should generate a code with REF- prefix", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const code = await UserService.generateReferralCode("TestUser");

      expect(code).toMatch(/^REF-/);
    });

    it("should include sanitized name in code", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const code = await UserService.generateReferralCode("JohnDoe");

      expect(code).toMatch(/^REF-JOHNDOE-/);
    });

    it("should strip non-alphanumeric characters from name", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const code = await UserService.generateReferralCode("John-Doe!@#");

      expect(code).toMatch(/^REF-JOHNDOE-/);
    });

    it("should truncate name to 8 characters", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const code = await UserService.generateReferralCode("VeryLongUserName");

      expect(code).toMatch(/^REF-VERYLONG-/);
    });

    it("should fallback to USER when name is empty after sanitization", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const code = await UserService.generateReferralCode("!@#$%");

      expect(code).toMatch(/^REF-USER-/);
    });

    it("should retry when code collision occurs", async () => {
      mockPrismaUser.findUnique
        .mockResolvedValueOnce(makeUser())
        .mockResolvedValueOnce(null);

      const code = await UserService.generateReferralCode("Test");

      expect(code).toMatch(/^REF-TEST-/);
      expect(mockPrismaUser.findUnique).toHaveBeenCalledTimes(2);
    });

    it("should fallback to UUID-based code after 10 collisions", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(makeUser());

      const code = await UserService.generateReferralCode("Test");

      expect(code).toMatch(/^REF-[A-Z0-9]{8}$/);
      expect(mockPrismaUser.findUnique).toHaveBeenCalledTimes(10);
    });
  });

  describe("ban()", () => {
    it("should ban user with reason", async () => {
      const bannedUser = makeUser({
        isBanned: true,
        banReason: "spam",
        bannedAt: new Date(),
      });
      mockPrismaUser.update.mockResolvedValue(bannedUser);

      const result = await UserService.ban(BigInt(123456789), "spam");

      expect(result.isBanned).toBe(true);
      expect(result.banReason).toBe("spam");
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { telegramId: BigInt(123456789) },
        data: {
          isBanned: true,
          banReason: "spam",
          bannedAt: expect.any(Date),
        },
      });
    });
  });

  describe("unban()", () => {
    it("should unban user and clear reason", async () => {
      const unbannedUser = makeUser({
        isBanned: false,
        banReason: null,
        bannedAt: null,
      });
      mockPrismaUser.update.mockResolvedValue(unbannedUser);

      const result = await UserService.unban(BigInt(123456789));

      expect(result.isBanned).toBe(false);
      expect(result.banReason).toBeNull();
      expect(result.bannedAt).toBeNull();
    });
  });

  describe("getDailyGenerationCount()", () => {
    it("should count videos created today", async () => {
      mockPrismaVideo.count.mockResolvedValue(5);

      const count = await UserService.getDailyGenerationCount(
        BigInt(123456789),
      );

      expect(count).toBe(5);
      expect(mockPrismaVideo.count).toHaveBeenCalledWith({
        where: {
          userId: BigInt(123456789),
          createdAt: { gte: expect.any(Date) },
        },
      });
    });

    it("should return 0 when no videos today", async () => {
      mockPrismaVideo.count.mockResolvedValue(0);

      const count = await UserService.getDailyGenerationCount(
        BigInt(123456789),
      );

      expect(count).toBe(0);
    });
  });

  describe("canGenerate()", () => {
    it("should return allowed=true when under daily limit", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(makeUser({ tier: "free" }));
      mockPrismaVideo.count.mockResolvedValue(1);

      const result = await UserService.canGenerate(BigInt(123456789));

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
      expect(result.limit).toBe(2);
    });

    it("should return allowed=false when at daily limit", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(makeUser({ tier: "free" }));
      mockPrismaVideo.count.mockResolvedValue(2);

      const result = await UserService.canGenerate(BigInt(123456789));

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should return allowed=false when user not found", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const result = await UserService.canGenerate(BigInt(999));

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(0);
    });

    it("should use correct limit for pro tier", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(makeUser({ tier: "pro" }));
      mockPrismaVideo.count.mockResolvedValue(5);

      const result = await UserService.canGenerate(BigInt(123456789));

      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(5);
    });

    it("should use correct limit for agency tier", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(makeUser({ tier: "agency" }));
      mockPrismaVideo.count.mockResolvedValue(0);

      const result = await UserService.canGenerate(BigInt(123456789));

      expect(result.limit).toBe(30);
      expect(result.remaining).toBe(30);
    });

    it("should default to free limit for unknown tier", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(
        makeUser({ tier: "unknown" }),
      );
      mockPrismaVideo.count.mockResolvedValue(0);

      const result = await UserService.canGenerate(BigInt(123456789));

      expect(result.limit).toBe(2);
    });

    it("should default to free limit when tier is null", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(makeUser({ tier: null }));
      mockPrismaVideo.count.mockResolvedValue(0);

      const result = await UserService.canGenerate(BigInt(123456789));

      expect(result.limit).toBe(2);
    });
  });

  describe("getStats()", () => {
    it("should return aggregated stats", async () => {
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

      const stats = await UserService.getStats(BigInt(123456789));

      expect(stats.videosCreated).toBe(42);
      expect(stats.totalSpent).toBe(500000);
      expect(stats.referralCount).toBe(7);
      expect(stats.commissionEarned).toBe(25000);
    });

    it("should handle null aggregates gracefully", async () => {
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

      const stats = await UserService.getStats(BigInt(123456789));

      expect(stats.totalSpent).toBe(0);
      expect(stats.commissionEarned).toBe(0);
    });
  });

  describe("setBotInstance()", () => {
    it("should not throw when setting bot instance", () => {
      const mockBot = { telegram: { sendMessage: jest.fn() } } as any;

      expect(() => UserService.setBotInstance(mockBot)).not.toThrow();
    });
  });
});
