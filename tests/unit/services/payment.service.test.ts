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
    create: jest.fn() as jest.MockedFunction<any>,
    findUnique: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
  },
  user: {
    update: jest.fn() as jest.MockedFunction<any>,
  },
};

jest.mock("@/config/database", () => ({
  prisma: mockPrisma,
}));

// Mock axios
const mockAxiosPost = jest.fn() as jest.MockedFunction<any>;
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
const mockProcessCommissions = jest.fn() as jest.MockedFunction<any>;
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

// ── Test Data ──

const PACKAGES = {
  starter: { price: 50000, credits: 5, bonus: 1, name: "Starter" },
  growth: { price: 150000, credits: 15, bonus: 3, name: "Growth" },
  scale: { price: 500000, credits: 60, bonus: 15, name: "Scale" },
  enterprise: { price: 1500000, credits: 200, bonus: 60, name: "Enterprise" },
};

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
    it("should return all available packages with correct structure", () => {
      const packages = PaymentService.getPackages();

      expect(packages).toHaveLength(4);
      expect(packages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "starter",
            name: "Starter",
            price: 50000,
            credits: 5,
            bonus: 1,
            totalCredits: 6,
          }),
          expect.objectContaining({
            id: "growth",
            name: "Growth",
            price: 150000,
            credits: 15,
            bonus: 3,
            totalCredits: 18,
          }),
          expect.objectContaining({
            id: "scale",
            name: "Scale",
            price: 500000,
            credits: 60,
            bonus: 15,
            totalCredits: 75,
          }),
          expect.objectContaining({
            id: "enterprise",
            name: "Enterprise",
            price: 1500000,
            credits: 200,
            bonus: 60,
            totalCredits: 260,
          }),
        ]),
      );
    });

    it("should calculate totalCredits as credits + bonus", () => {
      const packages = PaymentService.getPackages();

      packages.forEach((pkg) => {
        expect(pkg.totalCredits).toBe(pkg.credits + pkg.bonus);
      });
    });

    it("should return packages with all required fields", () => {
      const packages = PaymentService.getPackages();

      packages.forEach((pkg) => {
        expect(pkg).toHaveProperty("id");
        expect(pkg).toHaveProperty("name");
        expect(pkg).toHaveProperty("price");
        expect(pkg).toHaveProperty("credits");
        expect(pkg).toHaveProperty("bonus");
        expect(pkg).toHaveProperty("totalCredits");
        expect(typeof pkg.id).toBe("string");
        expect(typeof pkg.name).toBe("string");
        expect(typeof pkg.price).toBe("number");
        expect(typeof pkg.credits).toBe("number");
        expect(typeof pkg.bonus).toBe("number");
        expect(typeof pkg.totalCredits).toBe("number");
      });
    });
  });

  // ── createTransaction() ──

  describe("createTransaction()", () => {
    it("should create transaction successfully for valid package", async () => {
      const mockMidtransResponse = {
        data: {
          token: "test-token-123",
          redirect_url:
            "https://sandbox.midtrans.com/snap/v2/transactions/test-token-123",
        },
      };

      mockPrisma.transaction.create.mockResolvedValue({
        id: "tx-123",
        orderId: expect.any(String),
        userId: TEST_USER_ID,
        type: "topup",
        packageName: "starter",
        amountIdr: 50000,
        creditsAmount: 6,
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
      expect(result).toHaveProperty(
        "redirectUrl",
        mockMidtransResponse.data.redirect_url,
      );
      expect(result.orderId).toMatch(/^OC-\d+-123456789-[A-Z0-9]{6}$/);

      // Verify Prisma transaction was created
      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: TEST_USER_ID,
          type: "topup",
          packageName: "starter",
          amountIdr: 50000,
          creditsAmount: 6,
          gateway: "midtrans",
          status: "pending",
        }),
      });

      // Verify Midtrans API was called
      expect(mockAxiosPost).toHaveBeenCalledWith(
        expect.stringContaining("/transactions"),
        expect.objectContaining({
          transaction_details: expect.objectContaining({
            gross_amount: 50000,
          }),
          customer_details: expect.objectContaining({
            first_name: "testuser",
          }),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: expect.stringContaining("Basic"),
          }),
        }),
      );
    });

    it("should use default username when not provided", async () => {
      mockPrisma.transaction.create.mockResolvedValue({});
      mockAxiosPost.mockResolvedValue({
        data: { token: "token", redirect_url: "url" },
      });

      await PaymentService.createTransaction({
        userId: TEST_USER_ID,
        packageId: "starter",
      });

      expect(mockAxiosPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          customer_details: expect.objectContaining({
            first_name: "User",
          }),
        }),
        expect.any(Object),
      );
    });

    it("should throw error for invalid package ID", async () => {
      await expect(
        PaymentService.createTransaction({
          userId: TEST_USER_ID,
          packageId: "invalid-package",
        }),
      ).rejects.toThrow("Invalid package");

      expect(mockPrisma.transaction.create).not.toHaveBeenCalled();
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it("should throw error for empty package ID", async () => {
      await expect(
        PaymentService.createTransaction({
          userId: TEST_USER_ID,
          packageId: "",
        }),
      ).rejects.toThrow("Invalid package");
    });

    it("should handle Midtrans API error gracefully", async () => {
      mockPrisma.transaction.create.mockResolvedValue({});

      const apiError = new Error("API Error");
      (apiError as any).response = {
        data: { error_messages: ["Transaction failed"] },
      };
      mockAxiosPost.mockRejectedValue(apiError);

      await expect(
        PaymentService.createTransaction({
          userId: TEST_USER_ID,
          packageId: "starter",
        }),
      ).rejects.toThrow("Failed to create payment transaction");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Midtrans API error:",
        expect.objectContaining({ error_messages: ["Transaction failed"] }),
      );
    });

    it("should handle Midtrans API error without response data", async () => {
      mockPrisma.transaction.create.mockResolvedValue({});

      const apiError = new Error("Network timeout");
      mockAxiosPost.mockRejectedValue(apiError);

      await expect(
        PaymentService.createTransaction({
          userId: TEST_USER_ID,
          packageId: "starter",
        }),
      ).rejects.toThrow("Failed to create payment transaction");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Midtrans API error:",
        "Network timeout",
      );
    });

    it("should create transaction with correct credits calculation for all packages", async () => {
      mockAxiosPost.mockResolvedValue({
        data: { token: "token", redirect_url: "url" },
      });

      for (const [packageId, pkg] of Object.entries(PACKAGES)) {
        mockPrisma.transaction.create.mockResolvedValue({});

        await PaymentService.createTransaction({
          userId: TEST_USER_ID,
          packageId,
        });

        expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            amountIdr: pkg.price,
            creditsAmount: pkg.credits + pkg.bonus,
          }),
        });
      }
    });

    it("should include correct callback URL in Midtrans request", async () => {
      mockPrisma.transaction.create.mockResolvedValue({});
      mockAxiosPost.mockResolvedValue({
        data: { token: "token", redirect_url: "url" },
      });

      await PaymentService.createTransaction({
        userId: TEST_USER_ID,
        packageId: "starter",
      });

      expect(mockAxiosPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          callbacks: expect.objectContaining({
            finish: expect.stringContaining("/payment/finish"),
          }),
        }),
        expect.any(Object),
      );
    });

    it("should log successful transaction creation", async () => {
      mockPrisma.transaction.create.mockResolvedValue({});
      mockAxiosPost.mockResolvedValue({
        data: { token: "token", redirect_url: "url" },
      });

      await PaymentService.createTransaction({
        userId: TEST_USER_ID,
        packageId: "starter",
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Created transaction:"),
      );
    });
  });

  // ── verifySignature() ──

  describe("verifySignature()", () => {
    it("should return true for valid signature", () => {
      const orderId = "OC-123-456-ABC";
      const statusCode = "200";
      const grossAmount = "50000";
      const serverKey = process.env.MIDTRANS_SERVER_KEY || "";

      const validSignature = generateValidSignature(
        orderId,
        statusCode,
        grossAmount,
        serverKey,
      );

      const result = PaymentService.verifySignature(
        orderId,
        statusCode,
        grossAmount,
        validSignature,
      );

      expect(result).toBe(true);
    });

    it("should return false for invalid signature", () => {
      const result = PaymentService.verifySignature(
        "OC-123-456-ABC",
        "200",
        "50000",
        "invalid-signature-hash",
      );

      expect(result).toBe(false);
    });

    it("should return false for tampered order ID", () => {
      const orderId = "OC-123-456-ABC";
      const statusCode = "200";
      const grossAmount = "50000";
      const serverKey = process.env.MIDTRANS_SERVER_KEY || "";

      const validSignature = generateValidSignature(
        orderId,
        statusCode,
        grossAmount,
        serverKey,
      );

      const result = PaymentService.verifySignature(
        "OC-TAMPERED-456-ABC",
        statusCode,
        grossAmount,
        validSignature,
      );

      expect(result).toBe(false);
    });

    it("should return false for tampered status code", () => {
      const orderId = "OC-123-456-ABC";
      const statusCode = "200";
      const grossAmount = "50000";
      const serverKey = process.env.MIDTRANS_SERVER_KEY || "";

      const validSignature = generateValidSignature(
        orderId,
        statusCode,
        grossAmount,
        serverKey,
      );

      const result = PaymentService.verifySignature(
        orderId,
        "400",
        grossAmount,
        validSignature,
      );

      expect(result).toBe(false);
    });

    it("should return false for tampered gross amount", () => {
      const orderId = "OC-123-456-ABC";
      const statusCode = "200";
      const grossAmount = "50000";
      const serverKey = process.env.MIDTRANS_SERVER_KEY || "";

      const validSignature = generateValidSignature(
        orderId,
        statusCode,
        grossAmount,
        serverKey,
      );

      const result = PaymentService.verifySignature(
        orderId,
        statusCode,
        "99999",
        validSignature,
      );

      expect(result).toBe(false);
    });

    it("should return false for empty signature", () => {
      const result = PaymentService.verifySignature(
        "OC-123-456-ABC",
        "200",
        "50000",
        "",
      );

      expect(result).toBe(false);
    });
  });

  // ── handleNotification() ──

  describe("handleNotification()", () => {
    const validNotification = {
      order_id: TEST_ORDER_ID,
      status_code: "200",
      gross_amount: "50000",
      signature_key: "",
      transaction_status: "settlement",
      payment_type: "bank_transfer",
    };

    beforeEach(() => {
      validNotification.signature_key = generateValidSignature(
        validNotification.order_id,
        validNotification.status_code,
        validNotification.gross_amount,
        process.env.MIDTRANS_SERVER_KEY || "",
      );
    });

    it("should reject invalid signature", async () => {
      const notification = {
        ...validNotification,
        signature_key: "invalid-signature",
      };

      const result = await PaymentService.handleNotification(notification);

      expect(result).toEqual({
        success: false,
        message: "Invalid signature",
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Invalid webhook signature",
      );
      expect(mockPrisma.transaction.findUnique).not.toHaveBeenCalled();
    });

    it("should return error when transaction not found", async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      const result = await PaymentService.handleNotification(validNotification);

      expect(result).toEqual({
        success: false,
        message: "Transaction not found",
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Transaction not found:"),
      );
    });

    it("should process settlement status as success", async () => {
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
      mockProcessCommissions.mockResolvedValue(undefined);

      const result = await PaymentService.handleNotification({
        ...validNotification,
        transaction_status: "settlement",
      });

      expect(result).toEqual({
        success: true,
        message: "Notification processed",
      });

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { orderId: TEST_ORDER_ID },
        data: expect.objectContaining({
          status: "success",
          paymentMethod: "bank_transfer",
          paidAt: expect.any(Date),
        }),
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { telegramId: TEST_USER_ID },
        data: expect.objectContaining({
          creditBalance: { increment: 6 },
          tier: "basic",
        }),
      });

      expect(mockProcessCommissions).toHaveBeenCalledWith(
        TEST_ORDER_ID,
        50000,
        TEST_USER_ID,
      );
    });

    it("should process capture status as success", async () => {
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
      mockProcessCommissions.mockResolvedValue(undefined);

      const result = await PaymentService.handleNotification({
        ...validNotification,
        transaction_status: "capture",
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "success" }),
        }),
      );
    });

    it("should keep pending status unchanged", async () => {
      const mockTransaction = {
        orderId: TEST_ORDER_ID,
        userId: TEST_USER_ID,
        creditsAmount: BigInt(6),
        amountIdr: BigInt(50000),
        status: "pending",
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({});

      const result = await PaymentService.handleNotification({
        ...validNotification,
        transaction_status: "pending",
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "pending",
            paidAt: undefined,
          }),
        }),
      );

      // Should NOT add credits for pending status
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockProcessCommissions).not.toHaveBeenCalled();
    });

    it("should process deny status as failed", async () => {
      const mockTransaction = {
        orderId: TEST_ORDER_ID,
        userId: TEST_USER_ID,
        creditsAmount: BigInt(6),
        amountIdr: BigInt(50000),
        status: "pending",
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({});

      await PaymentService.handleNotification({
        ...validNotification,
        transaction_status: "deny",
      });

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "failed" }),
        }),
      );
    });

    it("should process cancel status as failed", async () => {
      const mockTransaction = {
        orderId: TEST_ORDER_ID,
        userId: TEST_USER_ID,
        creditsAmount: BigInt(6),
        amountIdr: BigInt(50000),
        status: "pending",
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({});

      await PaymentService.handleNotification({
        ...validNotification,
        transaction_status: "cancel",
      });

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "failed" }),
        }),
      );
    });

    it("should process expire status as failed", async () => {
      const mockTransaction = {
        orderId: TEST_ORDER_ID,
        userId: TEST_USER_ID,
        creditsAmount: BigInt(6),
        amountIdr: BigInt(50000),
        status: "pending",
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({});

      await PaymentService.handleNotification({
        ...validNotification,
        transaction_status: "expire",
      });

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "failed" }),
        }),
      );
    });

    it("should process refund status correctly", async () => {
      const mockTransaction = {
        orderId: TEST_ORDER_ID,
        userId: TEST_USER_ID,
        creditsAmount: BigInt(6),
        amountIdr: BigInt(50000),
        status: "success",
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({});

      await PaymentService.handleNotification({
        ...validNotification,
        transaction_status: "refund",
      });

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "refunded" }),
        }),
      );
    });

    it("should not add credits if transaction already succeeded", async () => {
      const mockTransaction = {
        orderId: TEST_ORDER_ID,
        userId: TEST_USER_ID,
        creditsAmount: BigInt(6),
        amountIdr: BigInt(50000),
        status: "success", // Already succeeded
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({});

      await PaymentService.handleNotification({
        ...validNotification,
        transaction_status: "settlement",
      });

      // Should NOT add credits again
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockProcessCommissions).not.toHaveBeenCalled();
    });

    it("should handle zero credits amount gracefully", async () => {
      const mockTransaction = {
        orderId: TEST_ORDER_ID,
        userId: TEST_USER_ID,
        creditsAmount: BigInt(0),
        amountIdr: BigInt(50000),
        status: "pending",
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});
      mockProcessCommissions.mockResolvedValue(undefined);

      const result = await PaymentService.handleNotification(validNotification);

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { telegramId: TEST_USER_ID },
        data: expect.objectContaining({
          creditBalance: { increment: 0 },
        }),
      });
    });

    it("should handle null credits amount gracefully", async () => {
      const mockTransaction = {
        orderId: TEST_ORDER_ID,
        userId: TEST_USER_ID,
        creditsAmount: null,
        amountIdr: BigInt(50000),
        status: "pending",
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});
      mockProcessCommissions.mockResolvedValue(undefined);

      const result = await PaymentService.handleNotification(validNotification);

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { telegramId: TEST_USER_ID },
        data: expect.objectContaining({
          creditBalance: { increment: 0 },
        }),
      });
    });

    it("should log credit addition on successful payment", async () => {
      const mockTransaction = {
        orderId: TEST_ORDER_ID,
        userId: TEST_USER_ID,
        creditsAmount: BigInt(18),
        amountIdr: BigInt(150000),
        status: "pending",
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});
      mockProcessCommissions.mockResolvedValue(undefined);

      await PaymentService.handleNotification(validNotification);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Added 18 credits to user"),
      );
    });
  });

  // ── getTransactionStatus() ──

  describe("getTransactionStatus()", () => {
    it("should return transaction status for valid order ID", async () => {
      const mockTransaction = {
        orderId: TEST_ORDER_ID,
        status: "success",
        amountIdr: BigInt(50000),
        creditsAmount: BigInt(6),
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await PaymentService.getTransactionStatus(TEST_ORDER_ID);

      expect(result).toEqual({
        status: "success",
        amount: 50000,
        credits: 6,
      });

      expect(mockPrisma.transaction.findUnique).toHaveBeenCalledWith({
        where: { orderId: TEST_ORDER_ID },
      });
    });

    it("should return null for non-existent order ID", async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      const result = await PaymentService.getTransactionStatus("NON-EXISTENT");

      expect(result).toBeNull();
    });

    it("should handle zero credits amount", async () => {
      const mockTransaction = {
        orderId: TEST_ORDER_ID,
        status: "pending",
        amountIdr: BigInt(50000),
        creditsAmount: BigInt(0),
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await PaymentService.getTransactionStatus(TEST_ORDER_ID);

      expect(result).toEqual({
        status: "pending",
        amount: 50000,
        credits: 0,
      });
    });

    it("should handle null credits amount", async () => {
      const mockTransaction = {
        orderId: TEST_ORDER_ID,
        status: "pending",
        amountIdr: BigInt(50000),
        creditsAmount: null,
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await PaymentService.getTransactionStatus(TEST_ORDER_ID);

      expect(result).toEqual({
        status: "pending",
        amount: 50000,
        credits: 0,
      });
    });

    it("should return all possible transaction statuses", async () => {
      const statuses = ["pending", "success", "failed", "refunded"];

      for (const status of statuses) {
        mockPrisma.transaction.findUnique.mockResolvedValue({
          orderId: TEST_ORDER_ID,
          status,
          amountIdr: BigInt(50000),
          creditsAmount: BigInt(6),
        });

        const result = await PaymentService.getTransactionStatus(TEST_ORDER_ID);

        expect(result?.status).toBe(status);
      }
    });
  });

  // ── Edge Cases & Integration Scenarios ──

  describe("Edge Cases", () => {
    it("should handle concurrent webhook notifications correctly", async () => {
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
      mockProcessCommissions.mockResolvedValue(undefined);

      const notification = {
        order_id: TEST_ORDER_ID,
        status_code: "200",
        gross_amount: "50000",
        signature_key: generateValidSignature(
          TEST_ORDER_ID,
          "200",
          "50000",
          process.env.MIDTRANS_SERVER_KEY || "",
        ),
        transaction_status: "settlement",
        payment_type: "bank_transfer",
      };

      // Simulate concurrent notifications
      const results = await Promise.all([
        PaymentService.handleNotification(notification),
        PaymentService.handleNotification(notification),
      ]);

      // Both should succeed
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it("should handle very large credit amounts", async () => {
      const mockTransaction = {
        orderId: TEST_ORDER_ID,
        userId: TEST_USER_ID,
        creditsAmount: BigInt(999999999),
        amountIdr: BigInt(999999999),
        status: "pending",
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});
      mockProcessCommissions.mockResolvedValue(undefined);

      const notification = {
        order_id: TEST_ORDER_ID,
        status_code: "200",
        gross_amount: "999999999",
        signature_key: generateValidSignature(
          TEST_ORDER_ID,
          "200",
          "999999999",
          process.env.MIDTRANS_SERVER_KEY || "",
        ),
        transaction_status: "settlement",
        payment_type: "bank_transfer",
      };

      const result = await PaymentService.handleNotification(notification);

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { telegramId: TEST_USER_ID },
        data: expect.objectContaining({
          creditBalance: { increment: 999999999 },
        }),
      });
    });

    it("should handle special characters in order ID", async () => {
      const specialOrderId = "OC-123-456-ABC-!@#$%";
      const mockTransaction = {
        orderId: specialOrderId,
        userId: TEST_USER_ID,
        creditsAmount: BigInt(6),
        amountIdr: BigInt(50000),
        status: "pending",
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});
      mockProcessCommissions.mockResolvedValue(undefined);

      const notification = {
        order_id: specialOrderId,
        status_code: "200",
        gross_amount: "50000",
        signature_key: generateValidSignature(
          specialOrderId,
          "200",
          "50000",
          process.env.MIDTRANS_SERVER_KEY || "",
        ),
        transaction_status: "settlement",
        payment_type: "bank_transfer",
      };

      const result = await PaymentService.handleNotification(notification);

      expect(result.success).toBe(true);
    });
  });
});
