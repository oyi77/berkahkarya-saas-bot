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
process.env.DUITKU_MERCHANT_CODE = "TEST_DK";
process.env.DUITKU_API_KEY = "test-dk-apikey";
process.env.DUITKU_ENVIRONMENT = "sandbox";
process.env.WEBHOOK_URL = "https://test.example.com";

import { DuitkuService } from "@/services/duitku.service";

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
    orderId: "OC-1234567890-123456789-ABC123",
    userId: BigInt(123456789),
    type: "topup",
    packageName: "starter",
    amountIdr: BigInt(49000),
    creditsAmount: BigInt(6),
    status: "pending",
    ...overrides,
  };
}

/** Build a valid Duitku callback signature using MD5(merchantCode+amount+orderId+apiKey) */
function buildValidSignature(
  merchantCode: string,
  amount: string,
  orderId: string,
  apiKey: string,
): string {
  return crypto
    .createHash("md5")
    .update(merchantCode + amount + orderId + apiKey)
    .digest("hex");
}

describe("DuitkuService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSubscriptionPlansAsync.mockResolvedValue({});
  });

  // ─────────────────────────── createTransaction ───────────────────

  describe("createTransaction()", () => {
    it("returns orderId and paymentUrl on success", async () => {
      mockGetPackagesAsync.mockResolvedValue([makePackage()]);
      mockPrismaTransaction.create.mockResolvedValue({});
      mockAxiosPost.mockResolvedValue({
        data: {
          reference: "DK-REF-001",
          paymentUrl: "https://sandbox.duitku.com/pay/DK-REF-001",
          vaNumber: "88881234567890",
          statusCode: "00",
          statusMessage: "SUCCESS",
        },
      });

      const result = await DuitkuService.createTransaction({
        userId: BigInt(123456789),
        packageId: "starter",
        username: "testuser",
      });

      expect(result.orderId).toMatch(/^OC-/);
      expect(result.paymentUrl).toBe("https://sandbox.duitku.com/pay/DK-REF-001");
      expect(result.vaNumber).toBe("88881234567890");
    });

    it("creates a pending transaction record before calling the API", async () => {
      mockGetPackagesAsync.mockResolvedValue([makePackage()]);
      mockPrismaTransaction.create.mockResolvedValue({});
      mockAxiosPost.mockResolvedValue({
        data: { paymentUrl: "https://sandbox.duitku.com", reference: "REF" },
      });

      await DuitkuService.createTransaction({
        userId: BigInt(123456789),
        packageId: "starter",
      });

      expect(mockPrismaTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            gateway: "duitku",
            status: "pending",
            amountIdr: 49000,
            creditsAmount: 6,
          }),
        }),
      );
    });

    it("throws when package ID is not found", async () => {
      mockGetPackagesAsync.mockResolvedValue([makePackage()]);

      await expect(
        DuitkuService.createTransaction({
          userId: BigInt(123456789),
          packageId: "nonexistent",
        }),
      ).rejects.toThrow("Invalid package");
    });

    it("throws 'Failed to create payment' when Duitku API call fails", async () => {
      mockGetPackagesAsync.mockResolvedValue([makePackage()]);
      mockPrismaTransaction.create.mockResolvedValue({});
      mockAxiosPost.mockRejectedValue({ message: "API error" });

      await expect(
        DuitkuService.createTransaction({
          userId: BigInt(123456789),
          packageId: "starter",
        }),
      ).rejects.toThrow("Failed to create payment");
    });

    it("uses MD5 signature in the request payload", async () => {
      mockGetPackagesAsync.mockResolvedValue([makePackage()]);
      mockPrismaTransaction.create.mockResolvedValue({});
      mockAxiosPost.mockResolvedValue({
        data: { paymentUrl: "https://sandbox.duitku.com", reference: "REF" },
      });

      await DuitkuService.createTransaction({
        userId: BigInt(123456789),
        packageId: "starter",
      });

      const [, payload] = mockAxiosPost.mock.calls[0] as any[];
      const { merchantCode, merchantOrderId, paymentAmount, signature } = payload;

      const expectedSig = crypto
        .createHash("md5")
        .update(merchantCode + merchantOrderId + paymentAmount + "test-dk-apikey")
        .digest("hex");

      expect(signature).toBe(expectedSig);
    });
  });

  // ─────────────────────────── handleCallback ──────────────────────

  describe("handleCallback()", () => {
    const orderId = "OC-1234567890-123456789-ABC123";
    const amount = "49000";

    it("rejects callback with invalid signature", async () => {
      const result = await DuitkuService.handleCallback({
        merchantCode: "TEST_DK",
        amount,
        merchantOrderId: orderId,
        resultCode: "00",
        reference: "REF-001",
        signature: "invalid-signature",
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/invalid signature/i);
    });

    it("marks transaction as success and grants credits on resultCode '00'", async () => {
      const validSig = buildValidSignature("TEST_DK", amount, orderId, "test-dk-apikey");
      const transaction = makeTransaction({ orderId });
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaUser.update.mockResolvedValue({});
      mockPrismaUser.findUnique.mockResolvedValue({ username: "u", createdAt: new Date() });
      mockPrismaTransaction.update.mockResolvedValue({});

      const result = await DuitkuService.handleCallback({
        merchantCode: "TEST_DK",
        amount,
        merchantOrderId: orderId,
        resultCode: "00",
        reference: "REF-001",
        signature: validSig,
      });

      expect(result.success).toBe(true);
      expect(mockPrismaTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orderId,
            status: { not: "success" },
          }),
          data: expect.objectContaining({ status: "success" }),
        }),
      );
      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ creditBalance: { increment: 6 } }),
        }),
      );
    });

    it("marks transaction as pending on resultCode '01'", async () => {
      const validSig = buildValidSignature("TEST_DK", amount, orderId, "test-dk-apikey");
      const transaction = makeTransaction({ orderId });
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.updateMany.mockResolvedValue({ count: 1 });

      const result = await DuitkuService.handleCallback({
        merchantCode: "TEST_DK",
        amount,
        merchantOrderId: orderId,
        resultCode: "01",
        reference: "REF-001",
        signature: validSig,
      });

      expect(result.success).toBe(true);
      expect(mockPrismaTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "pending" }),
        }),
      );
    });

    it("maps resultCode '02' to 'refunded' status", async () => {
      const validSig = buildValidSignature("TEST_DK", amount, orderId, "test-dk-apikey");
      const transaction = makeTransaction({ orderId });
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.updateMany
        .mockResolvedValueOnce({ count: 1 }) // main status update
        .mockResolvedValueOnce({ count: 0 }); // refund credit reversal (not in success state)

      const result = await DuitkuService.handleCallback({
        merchantCode: "TEST_DK",
        amount,
        merchantOrderId: orderId,
        resultCode: "02",
        reference: "REF-001",
        signature: validSig,
      });

      expect(result.success).toBe(true);
      expect(mockPrismaTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "refunded" }),
        }),
      );
    });

    it("maps unknown resultCode to 'failed' status", async () => {
      const validSig = buildValidSignature("TEST_DK", amount, orderId, "test-dk-apikey");
      const transaction = makeTransaction({ orderId });
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.updateMany.mockResolvedValue({ count: 1 });

      const result = await DuitkuService.handleCallback({
        merchantCode: "TEST_DK",
        amount,
        merchantOrderId: orderId,
        resultCode: "99",
        reference: "REF-001",
        signature: validSig,
      });

      expect(result.success).toBe(true);
      expect(mockPrismaTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "failed" }),
        }),
      );
    });

    it("returns failure when transaction not found", async () => {
      const validSig = buildValidSignature("TEST_DK", amount, orderId, "test-dk-apikey");
      mockPrismaTransaction.findUnique.mockResolvedValue(null);

      const result = await DuitkuService.handleCallback({
        merchantCode: "TEST_DK",
        amount,
        merchantOrderId: orderId,
        resultCode: "00",
        reference: "REF-001",
        signature: validSig,
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/not found/i);
    });

    it("returns 'Already processed' when updateMany count is 0 (idempotent guard)", async () => {
      const validSig = buildValidSignature("TEST_DK", amount, orderId, "test-dk-apikey");
      const transaction = makeTransaction({ orderId, status: "success" });
      mockPrismaTransaction.findUnique.mockResolvedValue(transaction);
      mockPrismaTransaction.updateMany.mockResolvedValue({ count: 0 });

      const result = await DuitkuService.handleCallback({
        merchantCode: "TEST_DK",
        amount,
        merchantOrderId: orderId,
        resultCode: "00",
        reference: "REF-001",
        signature: validSig,
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatch(/already processed/i);
    });
  });
});
