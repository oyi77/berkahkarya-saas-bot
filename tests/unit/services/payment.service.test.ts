/**
 * Unit Tests — PaymentService
 *
 * Comprehensive test coverage for Midtrans payment gateway integration.
 * Tests all exported methods, edge cases, and error scenarios.
 */

import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import crypto from "crypto";

// ── Mocks ──

// Mock Prisma client
const mockPrisma = {
  transaction: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    update: jest.fn() as any,
  },
  user: {
    update: jest.fn() as any,
  },
};

jest.mock("@/config/database", () => ({
  prisma: mockPrisma,
}));

// Mock axios
const mockAxiosPost = jest.fn() as any;
jest.mock("axios", () => ({
  default: {
    post: mockAxiosPost,
  },
  post: mockAxiosPost,
}));

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
jest.mock("@/utils/logger", () => ({
  logger: mockLogger,
}));

// Mock ReferralService
const mockProcessCommissions = jest.fn() as any;
jest.mock("@/services/referral.service", () => ({
  ReferralService: {
    processCommissions: mockProcessCommissions,
  },
}));

// Set environment variables for tests
process.env.MIDTRANS_SERVER_KEY = "test-server-key";
process.env.MIDTRANS_ENVIRONMENT = "sandbox";
process.env.WEBHOOK_URL = "https://test.example.com";

// Import after mocks are set up
import { PaymentService } from "@/services/payment.service";
import { getPackagesAsync } from "@/config/pricing";

// Mock getPackagesAsync
jest.mock("@/config/pricing", () => {
  const actual = jest.requireActual("@/config/pricing") as any;
  return {
    ...actual,
    getPackagesAsync: jest.fn(),
  };
});
const mockGetPackagesAsync = getPackagesAsync as jest.MockedFunction<typeof getPackagesAsync>;

// ── Test Data ──

const TEST_USER_ID = BigInt(123456789);
const TEST_ORDER_ID = "OC-1234567890-123456789-ABC123";

// ── Helper Functions ──

function generateValidSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
): string {
  return crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
}

// ── Tests ──

describe("PaymentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── getPackages() ──

  describe("getPackages()", () => {
    it("should return all available packages via async fetch", async () => {
      mockGetPackagesAsync.mockResolvedValue([
        { id: "starter", name: "Starter", priceIdr: 50000, credits: 5, bonus: 1, totalCredits: 6 },
        { id: "growth", name: "Growth", priceIdr: 150000, credits: 15, bonus: 3, totalCredits: 18 },
      ]);
      const packages = await PaymentService.getPackages();

      expect(packages).toHaveLength(2);
      expect(packages[0]).toEqual(
        expect.objectContaining({
          id: "starter",
          totalCredits: 6,
        }),
      );
    });
  });

  // ── createTransaction() ──

  describe("createTransaction()", () => {
    it("should create transaction successfully for valid package", async () => {
      mockGetPackagesAsync.mockResolvedValue([
        { id: "starter", name: "Starter", priceIdr: 50000, credits: 5, bonus: 1, totalCredits: 6 },
      ]);
      const mockMidtransResponse = {
        data: {
          token: "test-token-123",
          redirect_url: "https://sandbox.midtrans.com/snap/v2/transactions/test-token-123",
        },
      };

      mockPrisma.transaction.create.mockResolvedValue({
        id: "tx-123",
        orderId: TEST_ORDER_ID,
        userId: TEST_USER_ID,
        type: "topup",
        packageName: "starter",
        amountIdr: 50000,
        creditsAmount: BigInt(6),
        gateway: "midtrans",
        status: "pending",
      });

      mockAxiosPost.mockResolvedValue(mockMidtransResponse);

      const result = await PaymentService.createTransaction({
        userId: TEST_USER_ID,
        packageId: "starter",
        username: "testuser",
      });

      expect(result).toHaveProperty("orderId");
      expect(result).toHaveProperty("token", "test-token-123");
      expect(mockPrisma.transaction.create).toHaveBeenCalled();
    });

    it("should throw error for invalid package ID", async () => {
      mockGetPackagesAsync.mockResolvedValue([]);
      await expect(
        PaymentService.createTransaction({
          userId: TEST_USER_ID,
          packageId: "invalid-package",
        }),
      ).rejects.toThrow("Invalid package");
    });
  });

  describe("handleNotification()", () => {
    it("should process settlement status as success", async () => {
      const notification = {
        order_id: TEST_ORDER_ID,
        status_code: "200",
        gross_amount: "50000",
        signature_key: generateValidSignature(TEST_ORDER_ID, "200", "50000", "test-server-key"),
        transaction_status: "settlement",
        payment_type: "bank_transfer",
      };

      const mockTransaction = {
        orderId: TEST_ORDER_ID,
        userId: TEST_USER_ID,
        creditsAmount: BigInt(6),
        amountIdr: BigInt(50000),
        status: "pending",
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      const result = await PaymentService.handleNotification(notification);

      expect(result.success).toBe(true);
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "success" }),
        }),
      );
    });
  });
});
