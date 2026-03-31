import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// ── Prisma mock ──
const mockPrismaTransaction = {
  create: jest.fn<any>(),
  findUnique: jest.fn<any>(),
  updateMany: jest.fn<any>(),
  update: jest.fn<any>(),
};

const mockPrismaUser = {
  update: jest.fn<any>(),
  findUnique: jest.fn<any>(),
};

const mockPrisma = {
  transaction: mockPrismaTransaction,
  user: mockPrismaUser,
};

jest.mock("@/config/database", () => ({
  prisma: mockPrisma,
}));

// ── axios mock ──
const mockAxiosPost = jest.fn<any>();
jest.mock("axios", () => ({
  default: { post: mockAxiosPost },
  post: mockAxiosPost,
}));

// ── Logger mock ──
jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// ── Pricing mock ──
const mockGetSubscriptionPlansAsync = jest.fn<any>();
jest.mock("@/config/pricing", () => ({
  getSubscriptionPlansAsync: mockGetSubscriptionPlansAsync,
}));

// ── ReferralService mock ──
jest.mock("@/services/referral.service", () => ({
  ReferralService: {
    processCommissions: jest.fn<any>().mockResolvedValue(undefined),
  },
}));

// ── AnalyticsService mock ──
jest.mock("@/services/analytics.service", () => ({
  AnalyticsService: {
    trackPurchase: jest.fn<any>().mockResolvedValue(undefined),
  },
}));

// ── Environment ──
process.env.NOWPAYMENTS_API_KEY = "test-nowpayments-key";
process.env.WEBHOOK_URL = "https://test.example.com";
process.env.USD_TO_IDR_RATE = "16000";

import { NowPaymentsService, CRYPTO_PACKAGES, CRYPTO_COINS } from "@/services/nowpayments.service";

// ── Helpers ──

function makeNowPaymentsApiResponse() {
  return {
    data: {
      payment_id: 9876543,
      pay_address: "0xABCDEF123456",
      pay_amount: 50.05,
      pay_currency: "usdtbsc",
      expiration_estimate_date: "2026-04-02T00:00:00Z",
    },
  };
}

function makeTransaction(overrides: Record<string, any> = {}) {
  return {
    orderId: "CRYPTO-1234567890-123456789-ABC123",
    userId: BigInt(123456789),
    type: "topup",
    packageName: "crypto_30",
    amountIdr: BigInt(800000),
    creditsAmount: BigInt(30),
    status: "pending",
    gatewayTransactionId: "9876543",
    ...overrides,
  };
}

describe("NowPaymentsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSubscriptionPlansAsync.mockResolvedValue({});
  });

  // ─────────────────────────── CRYPTO_PACKAGES & CRYPTO_COINS ──────

  describe("exported constants", () => {
    it("CRYPTO_PACKAGES has at least one entry with credits and usd fields", () => {
      expect(CRYPTO_PACKAGES.length).toBeGreaterThan(0);
      CRYPTO_PACKAGES.forEach((pkg) => {
        expect(pkg).toHaveProperty("credits");
        expect(pkg).toHaveProperty("usd");
        expect(pkg.usd).toBeGreaterThanOrEqual(19); // NOWPayments minimum
      });
    });

    it("CRYPTO_COINS has id, label, and emoji fields", () => {
      expect(CRYPTO_COINS.length).toBeGreaterThan(0);
      CRYPTO_COINS.forEach((coin) => {
        expect(coin).toHaveProperty("id");
        expect(coin).toHaveProperty("label");
        expect(coin).toHaveProperty("emoji");
      });
    });
  });

  // ─────────────────────────── createPayment ───────────────────────

  describe("createPayment()", () => {
    it("returns payment details on success with valid package and coin", async () => {
      mockAxiosPost.mockResolvedValue(makeNowPaymentsApiResponse());
      mockPrismaTransaction.create.mockResolvedValue({});

      const result = await NowPaymentsService.createPayment({
        userId: BigInt(123456789),
        credits: 30,
        coin: "usdtbsc",
      });

      expect(result.paymentId).toBe("9876543");
      expect(result.payAddress).toBe("0xABCDEF123456");
      expect(result.payAmount).toBe(50.05);
      expect(result.payCurrency).toBe("usdtbsc");
      expect(result.orderId).toMatch(/^CRYPTO-/);
    });

    it("creates a pending transaction record in the database", async () => {
      mockAxiosPost.mockResolvedValue(makeNowPaymentsApiResponse());
      mockPrismaTransaction.create.mockResolvedValue({});

      await NowPaymentsService.createPayment({
        userId: BigInt(123456789),
        credits: 30,
        coin: "usdtbsc",
      });

      expect(mockPrismaTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: BigInt(123456789),
            gateway: "nowpayments",
            status: "pending",
            creditsAmount: 30,
            type: "topup",
          }),
        }),
      );
    });

    it("throws for an invalid credit amount not in CRYPTO_PACKAGES", async () => {
      await expect(
        NowPaymentsService.createPayment({
          userId: BigInt(123456789),
          credits: 999,
          coin: "usdtbsc",
        }),
      ).rejects.toThrow("Invalid credit package");
    });

    it("throws for an invalid coin not in CRYPTO_COINS", async () => {
      await expect(
        NowPaymentsService.createPayment({
          userId: BigInt(123456789),
          credits: 30,
          coin: "dogecoin",
        }),
      ).rejects.toThrow("Invalid coin");
    });

    it("converts USD amount to IDR using USD_TO_IDR_RATE env variable", async () => {
      mockAxiosPost.mockResolvedValue(makeNowPaymentsApiResponse());
      mockPrismaTransaction.create.mockResolvedValue({});

      await NowPaymentsService.createPayment({
        userId: BigInt(123456789),
        credits: 30,
        coin: "usdtbsc",
      });

      const pkg = CRYPTO_PACKAGES.find((p) => p.credits === 30)!;
      const expectedIdr = Math.round(pkg.usd * 16000);

      expect(mockPrismaTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ amountIdr: expectedIdr }),
        }),
      );
    });
  });

  // ─────────────────────────── handleWebhook ───────────────────────

  describe("handleWebhook()", () => {
    it("returns failure when order_id is missing from webhook body", async () => {
      const result = await NowPaymentsService.handleWebhook({
        payment_status: "finished",
        payment_id: 123,
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/missing order_id/i);
    });

    it("returns failure when transaction is not found", async () => {
      mockPrismaTransaction.findUnique.mockResolvedValue(null);

      const result = await NowPaymentsService.handleWebhook({
        payment_status: "finished",
        order_id: "CRYPTO-NONEXISTENT",
        payment_id: 123,
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/not found/i);
    });

    it("grants credits and marks transaction success on 'finished' status", async () => {
      const transaction = makeTransaction();
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaUser.update.mockResolvedValue({});
      mockPrismaUser.findUnique.mockResolvedValue({ username: "u", createdAt: new Date() });
      mockPrismaTransaction.update.mockResolvedValue({});

      const result = await NowPaymentsService.handleWebhook({
        payment_status: "finished",
        order_id: transaction.orderId,
        payment_id: 9876543,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Credits added");
      expect(mockPrismaTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orderId: transaction.orderId,
            status: { not: "success" },
          }),
          data: expect.objectContaining({ status: "success" }),
        }),
      );
      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ creditBalance: { increment: 30 } }),
        }),
      );
    });

    it("grants credits on 'confirmed' status (equivalent to finished)", async () => {
      const transaction = makeTransaction();
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaUser.update.mockResolvedValue({});
      mockPrismaUser.findUnique.mockResolvedValue({ username: "u", createdAt: new Date() });
      mockPrismaTransaction.update.mockResolvedValue({});

      const result = await NowPaymentsService.handleWebhook({
        payment_status: "confirmed",
        order_id: transaction.orderId,
        payment_id: 9876543,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Credits added");
    });

    it("returns 'Already processed' when transaction was already marked success", async () => {
      const transaction = makeTransaction({ status: "success" });
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.updateMany.mockResolvedValue({ count: 0 });

      const result = await NowPaymentsService.handleWebhook({
        payment_status: "finished",
        order_id: transaction.orderId,
        payment_id: 9876543,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Already processed");
      // Credits should not be granted again
      expect(mockPrismaUser.update).not.toHaveBeenCalled();
    });

    it("marks transaction as failed on 'failed' status", async () => {
      const transaction = makeTransaction();
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.update.mockResolvedValue({});

      const result = await NowPaymentsService.handleWebhook({
        payment_status: "failed",
        order_id: transaction.orderId,
        payment_id: 9876543,
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatch(/failed/);
      expect(mockPrismaTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId: transaction.orderId },
          data: { status: "failed" },
        }),
      );
    });

    it("marks transaction as failed on 'expired' status", async () => {
      const transaction = makeTransaction();
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.update.mockResolvedValue({});

      const result = await NowPaymentsService.handleWebhook({
        payment_status: "expired",
        order_id: transaction.orderId,
        payment_id: 9876543,
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatch(/expired/);
    });

    it("reverses credits on 'refunded' status when transaction was success", async () => {
      const transaction = makeTransaction();
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaUser.findUnique.mockResolvedValue({ creditBalance: 40 });
      mockPrismaUser.update.mockResolvedValue({});

      const result = await NowPaymentsService.handleWebhook({
        payment_status: "refunded",
        order_id: transaction.orderId,
        payment_id: 9876543,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Payment refunded");
      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creditBalance: { decrement: 30 },
          }),
        }),
      );
    });

    it("acknowledges intermediate statuses (waiting, confirming) without modifying DB credits", async () => {
      const transaction = makeTransaction();
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);

      const result = await NowPaymentsService.handleWebhook({
        payment_status: "waiting",
        order_id: transaction.orderId,
        payment_id: 9876543,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Status noted");
      expect(mockPrismaUser.update).not.toHaveBeenCalled();
    });
  });
});
