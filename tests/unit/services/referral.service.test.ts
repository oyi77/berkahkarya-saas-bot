import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";

const mockPrismaUser = {
  findUnique: jest.fn() as jest.MockedFunction<any>,
};

const mockPrismaTransaction = {
  findFirst: jest.fn() as jest.MockedFunction<any>,
};

const mockPrismaCommission = {
  create: jest.fn() as jest.MockedFunction<any>,
};

const mockPrisma = {
  user: mockPrismaUser,
  transaction: mockPrismaTransaction,
  commission: mockPrismaCommission,
};

jest.mock("@/config/database", () => ({
  prisma: mockPrisma,
}));

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock("@/utils/logger", () => ({
  logger: mockLogger,
}));

const mockAddDays = jest.fn() as jest.MockedFunction<any>;
const mockIsAfter = jest.fn() as jest.MockedFunction<any>;

jest.mock("date-fns", () => ({
  addDays: mockAddDays,
  isAfter: mockIsAfter,
}));

jest.mock("@/config/packages", () => ({
  COMMISSIONS: {
    DIRECT_REFERRAL: 0.15,
    INDIRECT_REFERRAL: 0.05,
    RESELLER_DISCOUNT: 0.3,
    ACTIVITY_WINDOW_DAYS: 30,
  },
}));

import { ReferralService } from "@/services/referral.service";

const BUYER_TELEGRAM_ID = BigInt(123456789);
const DIRECT_REFERRER_TELEGRAM_ID = BigInt(987654321);
const INDIRECT_REFERRER_TELEGRAM_ID = BigInt(555666777);
const TRANSACTION_ID = "TX-123456";
const TRANSACTION_AMOUNT = 100000;

function makeUser(overrides: Record<string, unknown> = {}) {
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

function makeDirectReferrer(overrides: Record<string, unknown> = {}) {
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

function makeIndirectReferrer(overrides: Record<string, unknown> = {}) {
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

describe("ReferralService", () => {
  let isEligibleSpy: jest.SpiedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAddDays.mockImplementation((date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    });
    mockIsAfter.mockReturnValue(true);
    isEligibleSpy = jest
      .spyOn(ReferralService, "isEligible")
      .mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("processCommissions()", () => {
    it("should process tier 1 commission for direct referrer", async () => {
      const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
      const directReferrer = makeDirectReferrer();

      mockPrismaUser.findUnique
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(directReferrer);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        TRANSACTION_AMOUNT,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { telegramId: BUYER_TELEGRAM_ID },
      });

      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { uuid: "uuid-direct-referrer" },
      });

      expect(mockPrismaCommission.create).toHaveBeenCalledWith({
        data: {
          referrerId: DIRECT_REFERRER_TELEGRAM_ID,
          referredId: BUYER_TELEGRAM_ID,
          amount: TRANSACTION_AMOUNT * 0.15,
          tier: 1,
          status: "available",
          availableAt: expect.any(Date),
        },
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Commission issued"),
      );
    });

    it("should process both tier 1 and tier 2 commissions when indirect referrer exists", async () => {
      const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
      const directReferrer = makeDirectReferrer({
        referredBy: "uuid-indirect-referrer",
      });
      const indirectReferrer = makeIndirectReferrer();

      mockPrismaUser.findUnique
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(directReferrer)
        .mockResolvedValueOnce(indirectReferrer);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        TRANSACTION_AMOUNT,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          referrerId: DIRECT_REFERRER_TELEGRAM_ID,
          amount: TRANSACTION_AMOUNT * 0.15,
          tier: 1,
        }),
      });

      expect(mockPrismaCommission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          referrerId: INDIRECT_REFERRER_TELEGRAM_ID,
          amount: TRANSACTION_AMOUNT * 0.05,
          tier: 2,
        }),
      });

      expect(mockPrismaCommission.create).toHaveBeenCalledTimes(2);
    });

    it("should not process commissions when buyer has no referrer", async () => {
      const buyer = makeUser({ referredBy: null });

      mockPrismaUser.findUnique.mockResolvedValueOnce(buyer);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        TRANSACTION_AMOUNT,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it("should not process commissions when buyer not found", async () => {
      mockPrismaUser.findUnique.mockResolvedValueOnce(null);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        TRANSACTION_AMOUNT,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).not.toHaveBeenCalled();
    });

    it("should not process tier 1 commission when direct referrer not found", async () => {
      const buyer = makeUser({ referredBy: "uuid-nonexistent" });

      mockPrismaUser.findUnique
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(null);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        TRANSACTION_AMOUNT,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).not.toHaveBeenCalled();
    });

    it("should not process tier 1 commission when direct referrer is ineligible", async () => {
      isEligibleSpy.mockResolvedValueOnce(false);

      const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
      const directReferrer = makeDirectReferrer();

      mockPrismaUser.findUnique
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(directReferrer);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        TRANSACTION_AMOUNT,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).not.toHaveBeenCalled();
    });

    it("should not process tier 2 commission when indirect referrer not found", async () => {
      const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
      const directReferrer = makeDirectReferrer({
        referredBy: "uuid-nonexistent",
      });

      mockPrismaUser.findUnique
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(directReferrer)
        .mockResolvedValueOnce(null);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        TRANSACTION_AMOUNT,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaCommission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tier: 1,
        }),
      });
    });

    it("should not process tier 2 commission when indirect referrer is ineligible", async () => {
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

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        TRANSACTION_AMOUNT,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaCommission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          referrerId: DIRECT_REFERRER_TELEGRAM_ID,
          tier: 1,
        }),
      });
    });

    it("should handle database errors gracefully", async () => {
      const dbError = new Error("Database connection failed");
      mockPrismaUser.findUnique.mockRejectedValueOnce(dbError);

      await expect(
        ReferralService.processCommissions(
          TRANSACTION_ID,
          TRANSACTION_AMOUNT,
          BUYER_TELEGRAM_ID,
        ),
      ).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error processing MLM commissions:",
        dbError,
      );
    });

    it("should calculate correct commission amounts for different transaction values", async () => {
      const testCases = [
        { amount: 50000, expectedDirect: 7500, expectedIndirect: 2500 },
        { amount: 100000, expectedDirect: 15000, expectedIndirect: 5000 },
        { amount: 499000, expectedDirect: 74850, expectedIndirect: 24950 },
        { amount: 1000000, expectedDirect: 150000, expectedIndirect: 50000 },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        isEligibleSpy = jest
          .spyOn(ReferralService, "isEligible")
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

        await ReferralService.processCommissions(
          TRANSACTION_ID,
          testCase.amount,
          BUYER_TELEGRAM_ID,
        );

        expect(mockPrismaCommission.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            amount: testCase.expectedDirect,
            tier: 1,
          }),
        });

        expect(mockPrismaCommission.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            amount: testCase.expectedIndirect,
            tier: 2,
          }),
        });
      }
    });

    it("should handle zero transaction amount", async () => {
      const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
      const directReferrer = makeDirectReferrer();

      mockPrismaUser.findUnique
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(directReferrer);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        0,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 0,
          tier: 1,
        }),
      });
    });

    it("should prevent self-referral by checking referredBy UUID", async () => {
      const buyer = makeUser({ referredBy: "uuid-buyer-123" });

      mockPrismaUser.findUnique
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(null);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        TRANSACTION_AMOUNT,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).not.toHaveBeenCalled();
    });
  });

  describe("isEligible()", () => {
    beforeEach(() => {
      isEligibleSpy.mockRestore();
    });

    it("should return true when user is within grace period after registration", async () => {
      const recentDate = new Date();
      const user = makeUser({
        telegramId: DIRECT_REFERRER_TELEGRAM_ID,
        createdAt: recentDate,
      });

      mockPrismaUser.findUnique.mockResolvedValueOnce(user);
      mockIsAfter.mockReturnValueOnce(true);

      const result = await ReferralService.isEligible(
        DIRECT_REFERRER_TELEGRAM_ID,
      );

      expect(result).toBe(true);
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { telegramId: DIRECT_REFERRER_TELEGRAM_ID },
      });
    });

    it("should return true when user has recent successful transaction", async () => {
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

      const result = await ReferralService.isEligible(
        DIRECT_REFERRER_TELEGRAM_ID,
      );

      expect(result).toBe(true);
      expect(mockPrismaTransaction.findFirst).toHaveBeenCalledWith({
        where: {
          userId: DIRECT_REFERRER_TELEGRAM_ID,
          status: "success",
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return false when user not found", async () => {
      mockPrismaUser.findUnique.mockResolvedValueOnce(null);

      const result = await ReferralService.isEligible(BigInt(999999));

      expect(result).toBe(false);
    });

    it("should return false when user has no transactions and grace period expired", async () => {
      const oldDate = new Date("2020-01-01");
      const user = makeUser({
        telegramId: DIRECT_REFERRER_TELEGRAM_ID,
        createdAt: oldDate,
      });

      mockPrismaUser.findUnique.mockResolvedValueOnce(user);
      mockIsAfter.mockReturnValueOnce(false);
      mockPrismaTransaction.findFirst.mockResolvedValueOnce(null);

      const result = await ReferralService.isEligible(
        DIRECT_REFERRER_TELEGRAM_ID,
      );

      expect(result).toBe(false);
    });

    it("should return false when last transaction is outside activity window", async () => {
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

      const result = await ReferralService.isEligible(
        DIRECT_REFERRER_TELEGRAM_ID,
      );

      expect(result).toBe(false);
    });

    it("should check only successful transactions", async () => {
      const user = makeUser({
        telegramId: DIRECT_REFERRER_TELEGRAM_ID,
        createdAt: new Date("2020-01-01"),
      });

      mockPrismaUser.findUnique.mockResolvedValueOnce(user);
      mockIsAfter.mockReturnValueOnce(false);
      mockPrismaTransaction.findFirst.mockResolvedValueOnce(null);

      await ReferralService.isEligible(DIRECT_REFERRER_TELEGRAM_ID);

      expect(mockPrismaTransaction.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "success",
          }),
        }),
      );
    });

    it("should use ACTIVITY_WINDOW_DAYS from config", async () => {
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

      await ReferralService.isEligible(DIRECT_REFERRER_TELEGRAM_ID);

      expect(mockAddDays).toHaveBeenCalledWith(expect.any(Date), 30);
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent commission processing", async () => {
      const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
      const directReferrer = makeDirectReferrer();

      mockPrismaUser.findUnique.mockResolvedValue(buyer);
      mockPrismaUser.findUnique.mockResolvedValueOnce(directReferrer);

      const promises = [
        ReferralService.processCommissions(
          TRANSACTION_ID,
          TRANSACTION_AMOUNT,
          BUYER_TELEGRAM_ID,
        ),
        ReferralService.processCommissions(
          TRANSACTION_ID,
          TRANSACTION_AMOUNT,
          BUYER_TELEGRAM_ID,
        ),
      ];

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it("should handle very large transaction amounts", async () => {
      const largeAmount = 999999999;
      const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
      const directReferrer = makeDirectReferrer();

      mockPrismaUser.findUnique
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(directReferrer);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        largeAmount,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: largeAmount * 0.15,
        }),
      });
    });

    it("should handle negative transaction amounts gracefully", async () => {
      const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
      const directReferrer = makeDirectReferrer();

      mockPrismaUser.findUnique
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(directReferrer);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        -1000,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: -150,
        }),
      });
    });

    it("should handle decimal transaction amounts", async () => {
      const decimalAmount = 99.99;
      const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
      const directReferrer = makeDirectReferrer();

      mockPrismaUser.findUnique
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(directReferrer);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        decimalAmount,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: decimalAmount * 0.15,
        }),
      });
    });

    it("should create commission with correct status and availableAt", async () => {
      const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
      const directReferrer = makeDirectReferrer();

      mockPrismaUser.findUnique
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(directReferrer);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        TRANSACTION_AMOUNT,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "available",
          availableAt: expect.any(Date),
        }),
      });
    });

    it("should log commission details correctly", async () => {
      const buyer = makeUser({ referredBy: "uuid-direct-referrer" });
      const directReferrer = makeDirectReferrer();

      mockPrismaUser.findUnique
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(directReferrer);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        TRANSACTION_AMOUNT,
        BUYER_TELEGRAM_ID,
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`IDR ${TRANSACTION_AMOUNT * 0.15}`),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Tier 1"),
      );
    });

    it("should process tier 3 commission when third-level referrer exists", async () => {
      const buyer = makeUser({ referredBy: "uuid-tier1-referrer" });
      const tier1Referrer = makeDirectReferrer({
        referredBy: "uuid-tier2-referrer",
      });
      const tier2Referrer = makeIndirectReferrer({
        referredBy: "uuid-tier3-referrer",
      });
      const tier3Referrer = makeIndirectReferrer();

      mockPrismaUser.findUnique
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(tier1Referrer)
        .mockResolvedValueOnce(tier2Referrer)
        .mockResolvedValueOnce(tier3Referrer);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        TRANSACTION_AMOUNT,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          referrerId: BigInt(555666777),
          referredId: BUYER_TELEGRAM_ID,
          amount: TRANSACTION_AMOUNT * 0.02,
          tier: 3,
        }),
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Commission issued"),
      );
    });

    it("should not process tier 3 commission when third-level referrer is ineligible", async () => {
      isEligibleSpy.mockResolvedValueOnce(false);
      const buyer = makeUser({ referredBy: "uuid-tier1-referrer" });
      const tier1Referrer = makeDirectReferrer({
        referredBy: "uuid-tier2-referrer",
      });
      const tier2Referrer = makeIndirectReferrer({
        referredBy: "uuid-tier3-referrer",
      });
      const tier3Referrer = makeIndirectReferrer();

      mockPrismaUser.findUnique
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(tier1Referrer)
        .mockResolvedValueOnce(tier2Referrer)
        .mockResolvedValueOnce(tier3Referrer);

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        TRANSACTION_AMOUNT,
        BUYER_TELEGRAM_ID,
      );

      expect(mockPrismaCommission.create).not.toHaveBeenCalledWith(
        expect.objectContaining({
          tier: 3,
        }),
      );
    });

    it("should handle circular referral chain (A -> B -> A)", async () => {
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

      await ReferralService.processCommissions(
        TRANSACTION_ID,
        TRANSACTION_AMOUNT,
        BigInt(111),
      );

      expect(mockPrismaCommission.create).toHaveBeenCalledTimes(1);
    });
  });
});
