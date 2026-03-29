"use strict";
/**
 * Unit Tests — PaymentService
 *
 * Comprehensive test coverage for Midtrans payment gateway integration.
 * Tests all exported methods, edge cases, and error scenarios.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const crypto_1 = __importDefault(require("crypto"));
// ── Mocks ──
// Mock Prisma client
const mockPrisma = {
    transaction: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
    },
    user: {
        update: globals_1.jest.fn(),
    },
};
globals_1.jest.mock("@/config/database", () => ({
    prisma: mockPrisma,
}));
// Mock axios
const mockAxiosPost = globals_1.jest.fn();
globals_1.jest.mock("axios", () => ({
    default: {
        post: mockAxiosPost,
    },
    post: mockAxiosPost,
}));
// Mock logger
const mockLogger = {
    info: globals_1.jest.fn(),
    error: globals_1.jest.fn(),
    warn: globals_1.jest.fn(),
};
globals_1.jest.mock("@/utils/logger", () => ({
    logger: mockLogger,
}));
// Mock ReferralService
const mockProcessCommissions = globals_1.jest.fn();
globals_1.jest.mock("@/services/referral.service", () => ({
    ReferralService: {
        processCommissions: mockProcessCommissions,
    },
}));
// Set environment variables for tests
process.env.MIDTRANS_SERVER_KEY = "test-server-key";
process.env.MIDTRANS_ENVIRONMENT = "sandbox";
process.env.WEBHOOK_URL = "https://test.example.com";
// Import after mocks are set up
const payment_service_1 = require("@/services/payment.service");
const pricing_1 = require("@/config/pricing");
// Mock getPackagesAsync
globals_1.jest.mock("@/config/pricing", () => {
    const actual = globals_1.jest.requireActual("@/config/pricing");
    return {
        ...actual,
        getPackagesAsync: globals_1.jest.fn(),
    };
});
const mockGetPackagesAsync = pricing_1.getPackagesAsync;
// ── Test Data ──
const TEST_USER_ID = BigInt(123456789);
const TEST_ORDER_ID = "OC-1234567890-123456789-ABC123";
// ── Helper Functions ──
function generateValidSignature(orderId, statusCode, grossAmount, serverKey) {
    return crypto_1.default
        .createHash("sha512")
        .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
        .digest("hex");
}
// ── Tests ──
(0, globals_1.describe)("PaymentService", () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    // ── getPackages() ──
    (0, globals_1.describe)("getPackages()", () => {
        (0, globals_1.it)("should return all available packages via async fetch", async () => {
            mockGetPackagesAsync.mockResolvedValue([
                { id: "starter", name: "Starter", priceIdr: 50000, credits: 5, bonus: 1, totalCredits: 6 },
                { id: "growth", name: "Growth", priceIdr: 150000, credits: 15, bonus: 3, totalCredits: 18 },
            ]);
            const packages = await payment_service_1.PaymentService.getPackages();
            (0, globals_1.expect)(packages).toHaveLength(2);
            (0, globals_1.expect)(packages[0]).toEqual(globals_1.expect.objectContaining({
                id: "starter",
                totalCredits: 6,
            }));
        });
    });
    // ── createTransaction() ──
    (0, globals_1.describe)("createTransaction()", () => {
        (0, globals_1.it)("should create transaction successfully for valid package", async () => {
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
            const result = await payment_service_1.PaymentService.createTransaction({
                userId: TEST_USER_ID,
                packageId: "starter",
                username: "testuser",
            });
            (0, globals_1.expect)(result).toHaveProperty("orderId");
            (0, globals_1.expect)(result).toHaveProperty("token", "test-token-123");
            (0, globals_1.expect)(mockPrisma.transaction.create).toHaveBeenCalled();
        });
        (0, globals_1.it)("should throw error for invalid package ID", async () => {
            mockGetPackagesAsync.mockResolvedValue([]);
            await (0, globals_1.expect)(payment_service_1.PaymentService.createTransaction({
                userId: TEST_USER_ID,
                packageId: "invalid-package",
            })).rejects.toThrow("Invalid package");
        });
    });
    (0, globals_1.describe)("handleNotification()", () => {
        (0, globals_1.it)("should process settlement status as success", async () => {
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
            const result = await payment_service_1.PaymentService.handleNotification(notification);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(mockPrisma.transaction.update).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                data: globals_1.expect.objectContaining({ status: "success" }),
            }));
        });
    });
});
//# sourceMappingURL=payment.service.test.js.map