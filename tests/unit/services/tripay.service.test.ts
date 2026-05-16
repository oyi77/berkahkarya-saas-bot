import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import crypto from "crypto";

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
const mockAxiosGet = jest.fn<any>();
jest.mock("axios", () => ({
  default: { post: mockAxiosPost, get: mockAxiosGet },
  post: mockAxiosPost,
  get: mockAxiosGet,
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
const mockGetPackagesAsync = jest.fn<any>();
const mockGetSubscriptionPlansAsync = jest.fn<any>();
jest.mock("@/config/pricing", () => ({
  getPackagesAsync: mockGetPackagesAsync,
  getSubscriptionPlansAsync: mockGetSubscriptionPlansAsync,
  PlanKey: {},
  BillingCycle: {},
}));

// ── ReferralService mock ──
jest.mock("@/services/referral.service", () => ({
  ReferralService: {
    processCommissions: jest.fn<any>().mockResolvedValue(undefined),
  },
}));

// ── SubscriptionService mock ──
jest.mock("@/services/subscription.service", () => ({
  SubscriptionService: {
    createSubscription: jest.fn<any>().mockResolvedValue(undefined),
  },
}));

// ── AnalyticsService mock ──
jest.mock("@/services/analytics.service", () => ({
  AnalyticsService: {
    trackPurchase: jest.fn<any>().mockResolvedValue(undefined),
  },
}));

// ── Environment ──
process.env.TRIPAY_API_KEY = "test-api-key";
process.env.TRIPAY_PRIVATE_KEY = "test-private-key";
process.env.TRIPAY_MERCHANT_CODE = "TEST_MERCH";
process.env.TRIPAY_ENVIRONMENT = "sandbox";
process.env.WEBHOOK_URL = "https://test.example.com";

import { TripayService } from "@/services/tripay.service";

// ── Helpers ──

function makePackage() {
  return {
    id: "starter",
    name: "Starter Flow",
    priceIdr: 49000,
    credits: 5,
    bonus: 1,
    totalCredits: 6,
  };
}

function makeTransaction(overrides: Record<string, any> = {}) {
  return {
    orderId: "TRP-1234567890-123456789-ABC123",
    userId: BigInt(123456789),
    type: "topup",
    packageName: "starter",
    amountIdr: BigInt(49000),
    creditsAmount: BigInt(6),
    status: "pending",
    ...overrides,
  };
}

describe("TripayService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSubscriptionPlansAsync.mockResolvedValue({});
  });

  // ─────────────────────────── createTransaction ───────────────────

  describe("createTransaction()", () => {
    it("returns success with orderId and paymentUrl on valid package", async () => {
      mockGetPackagesAsync.mockResolvedValue([makePackage()]);
      mockAxiosPost.mockResolvedValue({
        data: {
          success: true,
          data: {
            reference: "REF-TRP-001",
            method: "BRIVA",
            checkout_url: "https://tripay.co.id/checkout/REF-TRP-001",
          },
        },
      });
      mockPrismaTransaction.create.mockResolvedValue({});

      const result = await TripayService.createTransaction({
        userId: BigInt(123456789),
        packageId: "starter",
        username: "testuser",
      });

      expect(result.success).toBe(true);
      expect(result.orderId).toMatch(/^TRP-/);
      expect(result.paymentUrl).toBe("https://tripay.co.id/checkout/REF-TRP-001");
      expect(result.reference).toBe("REF-TRP-001");
    });

    it("creates a pending transaction record in the database", async () => {
      mockGetPackagesAsync.mockResolvedValue([makePackage()]);
      mockAxiosPost.mockResolvedValue({
        data: {
          success: true,
          data: { reference: "REF-TRP-001", method: "BRIVA", checkout_url: "https://tripay.co.id" },
        },
      });
      mockPrismaTransaction.create.mockResolvedValue({});

      await TripayService.createTransaction({
        userId: BigInt(123456789),
        packageId: "starter",
        username: "testuser",
      });

      expect(mockPrismaTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            gateway: "tripay",
            status: "pending",
            amountIdr: 49000,
            creditsAmount: 6,
          }),
        }),
      );
    });

    it("returns failure when Tripay API reports success=false", async () => {
      mockGetPackagesAsync.mockResolvedValue([makePackage()]);
      mockAxiosPost.mockResolvedValue({
        data: { success: false, message: "Invalid merchant code" },
      });

      const result = await TripayService.createTransaction({
        userId: BigInt(123456789),
        packageId: "starter",
        username: "testuser",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid merchant code");
    });

    it("returns failure for unknown package ID", async () => {
      mockGetPackagesAsync.mockResolvedValue([makePackage()]);

      const result = await TripayService.createTransaction({
        userId: BigInt(123456789),
        packageId: "nonexistent",
        username: "testuser",
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid package/i);
    });

    it("returns failure when axios throws a network error", async () => {
      mockGetPackagesAsync.mockResolvedValue([makePackage()]);
      mockAxiosPost.mockRejectedValue({ message: "Network Error" });

      const result = await TripayService.createTransaction({
        userId: BigInt(123456789),
        packageId: "starter",
        username: "testuser",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  // ─────────────────────────── handleCallback ──────────────────────

  describe("handleCallback()", () => {
    it("marks transaction as success and grants credits on PAID status", async () => {
      const transaction = makeTransaction();
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaUser.update.mockResolvedValue({});
      mockPrismaUser.findUnique.mockResolvedValue({ username: "testuser", createdAt: new Date() });
      mockPrismaTransaction.update.mockResolvedValue({});

      const result = await TripayService.handleCallback({
        merchant_ref: transaction.orderId,
        status: "PAID",
      });

      expect(result.success).toBe(true);
      expect(mockPrismaTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orderId: transaction.orderId,
            status: { not: "success" },
          }),
          data: expect.objectContaining({ status: "success" }),
        }),
      );
    });

    it("grants credits to user on PAID status", async () => {
      const transaction = makeTransaction();
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaUser.update.mockResolvedValue({});
      mockPrismaUser.findUnique.mockResolvedValue({ username: "u", createdAt: new Date() });
      mockPrismaTransaction.update.mockResolvedValue({});

      await TripayService.handleCallback({
        merchant_ref: transaction.orderId,
        status: "PAID",
      });

      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { telegramId: transaction.userId },
          data: expect.objectContaining({
            creditBalance: { increment: 6 },
          }),
        }),
      );
    });

    it("marks transaction as expired on EXPIRED status", async () => {
      const transaction = makeTransaction();
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.updateMany.mockResolvedValue({ count: 1 });

      const result = await TripayService.handleCallback({
        merchant_ref: transaction.orderId,
        status: "EXPIRED",
      });

      expect(result.success).toBe(true);
      expect(mockPrismaTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "expired" }),
        }),
      );
    });

    it("marks transaction as failed on FAILED status", async () => {
      const transaction = makeTransaction();
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.updateMany.mockResolvedValue({ count: 1 });

      const result = await TripayService.handleCallback({
        merchant_ref: transaction.orderId,
        status: "FAILED",
      });

      expect(result.success).toBe(true);
      expect(mockPrismaTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "failed" }),
        }),
      );
    });

    it("returns failure when transaction not found", async () => {
      mockPrismaTransaction.findUnique.mockResolvedValue(null);

      const result = await TripayService.handleCallback({
        merchant_ref: "TRP-NONEXISTENT",
        status: "PAID",
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/not found/i);
    });

    it("returns 'Already processed' when updateMany count is 0 (idempotent)", async () => {
      const transaction = makeTransaction({ status: "success" });
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.updateMany.mockResolvedValue({ count: 0 });

      const result = await TripayService.handleCallback({
        merchant_ref: transaction.orderId,
        status: "PAID",
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatch(/already processed/i);
    });

    it("maps REFUND status to 'refunded' and reverses credits", async () => {
      const transaction = makeTransaction({ status: "pending" });
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      // First updateMany is for marking refunded (not-success path)
      mockPrismaTransaction.updateMany
        .mockResolvedValueOnce({ count: 1 }) // main update
        .mockResolvedValueOnce({ count: 1 }); // refund credit reversal
      mockPrismaUser.findUnique.mockResolvedValue({ creditBalance: 10 });
      mockPrismaUser.update.mockResolvedValue({});

      const result = await TripayService.handleCallback({
        merchant_ref: transaction.orderId,
        status: "REFUND",
      });

      expect(result.success).toBe(true);
    });
  });

  // ─────────────────────────── signature verification ──────────────

  describe("generateSignature (internal, via createTransaction)", () => {
    it("uses HMAC-SHA256 with private key for payload signature", async () => {
      mockGetPackagesAsync.mockResolvedValue([makePackage()]);
      mockAxiosPost.mockResolvedValue({
        data: {
          success: true,
          data: { reference: "REF", method: "BRIVA", checkout_url: "https://tripay.co.id" },
        },
      });
      mockPrismaTransaction.create.mockResolvedValue({});

      await TripayService.createTransaction({
        userId: BigInt(123456789),
        packageId: "starter",
        username: "testuser",
      });

      const [, payload] = mockAxiosPost.mock.calls[0] as any[];
      const { merchant_ref, amount, signature } = payload;

      const expectedSig = crypto
        .createHmac("sha256", "test-private-key")
        .update("TEST_MERCH" + merchant_ref + amount)
        .digest("hex");

      expect(signature).toBe(expectedSig);
    });
  });
});
