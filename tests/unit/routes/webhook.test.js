"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const crypto_1 = __importDefault(require("crypto"));
const mockLogger = {
    info: globals_1.jest.fn(),
    error: globals_1.jest.fn(),
    warn: globals_1.jest.fn(),
};
globals_1.jest.mock("@/utils/logger", () => ({
    logger: mockLogger,
}));
const mockPaymentServiceHandleNotification = globals_1.jest.fn();
globals_1.jest.mock("@/services/payment.service", () => ({
    PaymentService: {
        handleNotification: mockPaymentServiceHandleNotification,
    },
}));
const mockDuitkuServiceHandleCallback = globals_1.jest.fn();
globals_1.jest.mock("@/services/duitku.service", () => ({
    DuitkuService: {
        handleCallback: mockDuitkuServiceHandleCallback,
    },
}));
const mockNowPaymentsServiceHandleWebhook = globals_1.jest.fn();
globals_1.jest.mock("@/services/nowpayments.service", () => ({
    NowPaymentsService: {
        handleWebhook: mockNowPaymentsServiceHandleWebhook,
    },
}));
const mockHandleUpdate = globals_1.jest.fn();
const mockSendMessage = globals_1.jest.fn();
const mockBot = {
    handleUpdate: mockHandleUpdate,
    telegram: {
        sendMessage: mockSendMessage,
    },
};
process.env.WEBHOOK_SECRET = "test-webhook-secret";
process.env.MIDTRANS_SERVER_KEY = "test-midtrans-server-key";
process.env.TRIPAY_PRIVATE_KEY = "test-tripay-private-key";
process.env.NOWPAYMENTS_IPN_SECRET = "test-nowpayments-ipn-secret";
const webhook_1 = require("@/routes/webhook");
function createMockRequest(body, headers = {}) {
    return {
        body,
        headers,
    };
}
function createMockReply() {
    const reply = {
        status: globals_1.jest.fn().mockReturnThis(),
        send: globals_1.jest.fn().mockReturnThis(),
    };
    return reply;
}
function createMockServer() {
    const routes = {
        post: {},
    };
    const server = {
        post: globals_1.jest.fn((path, handler) => {
            routes.post[path] = handler;
        }),
    };
    return { server, routes };
}
function generateMidtransSignature(orderId, statusCode, grossAmount, serverKey) {
    return crypto_1.default
        .createHash("sha512")
        .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
        .digest("hex");
}
function generateTripaySignature(body, privateKey) {
    return crypto_1.default
        .createHmac("sha256", privateKey)
        .update(JSON.stringify(body))
        .digest("hex");
}
function generateNowPaymentsSignature(body, ipnSecret) {
    const sortedBody = JSON.stringify(Object.keys(body)
        .sort()
        .reduce((acc, key) => {
        acc[key] = body[key];
        return acc;
    }, {}));
    return crypto_1.default
        .createHmac("sha512", ipnSecret)
        .update(sortedBody)
        .digest("hex");
}
function generateDuitkuSignature(merchantCode, amount, merchantOrderId, apiKey) {
    return crypto_1.default
        .createHash("md5")
        .update(merchantCode + amount + merchantOrderId + apiKey)
        .digest("hex");
}
(0, globals_1.describe)("Webhook Routes", () => {
    let server;
    let routes;
    (0, globals_1.beforeEach)(async () => {
        globals_1.jest.clearAllMocks();
        const mockServer = createMockServer();
        server = mockServer.server;
        routes = mockServer.routes;
        await (0, webhook_1.webhookRoutes)(server, { bot: mockBot });
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("Route Registration", () => {
        (0, globals_1.it)("should register all webhook routes", () => {
            (0, globals_1.expect)(server.post).toHaveBeenCalledWith("/webhook/telegram", globals_1.expect.any(Function));
            (0, globals_1.expect)(server.post).toHaveBeenCalledWith("/webhook/midtrans", globals_1.expect.any(Function));
            (0, globals_1.expect)(server.post).toHaveBeenCalledWith("/webhook/tripay", globals_1.expect.any(Function));
            (0, globals_1.expect)(server.post).toHaveBeenCalledWith("/webhook/nowpayments", globals_1.expect.any(Function));
            (0, globals_1.expect)(server.post).toHaveBeenCalledWith("/webhook/duitku", globals_1.expect.any(Function));
        });
    });
    (0, globals_1.describe)("POST /webhook/telegram", () => {
        const telegramHandler = () => routes.post["/webhook/telegram"];
        (0, globals_1.it)("should process valid Telegram update successfully", async () => {
            const update = { update_id: 123, message: { text: "hello" } };
            const request = createMockRequest(update, {
                "x-telegram-bot-api-secret-token": process.env.WEBHOOK_SECRET,
            });
            const reply = createMockReply();
            mockHandleUpdate.mockResolvedValue(undefined);
            const result = await telegramHandler()(request, reply);
            (0, globals_1.expect)(mockHandleUpdate).toHaveBeenCalledWith(update);
            (0, globals_1.expect)(result).toEqual({ ok: true });
            (0, globals_1.expect)(reply.status).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should reject request with invalid webhook secret", async () => {
            const update = { update_id: 123, message: { text: "hello" } };
            const request = createMockRequest(update, {
                "x-telegram-bot-api-secret-token": "wrong-secret",
            });
            const reply = createMockReply();
            const result = await telegramHandler()(request, reply);
            (0, globals_1.expect)(mockHandleUpdate).not.toHaveBeenCalled();
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Unauthorized" });
            (0, globals_1.expect)(mockLogger.warn).toHaveBeenCalledWith("Invalid webhook secret");
        });
        (0, globals_1.it)("should reject request with missing webhook secret", async () => {
            const update = { update_id: 123, message: { text: "hello" } };
            const request = createMockRequest(update, {});
            const reply = createMockReply();
            const result = await telegramHandler()(request, reply);
            (0, globals_1.expect)(mockHandleUpdate).not.toHaveBeenCalled();
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Unauthorized" });
        });
        (0, globals_1.it)("should handle bot.handleUpdate error gracefully", async () => {
            const update = { update_id: 123, message: { text: "hello" } };
            const request = createMockRequest(update, {
                "x-telegram-bot-api-secret-token": process.env.WEBHOOK_SECRET,
            });
            const reply = createMockReply();
            const error = new Error("Bot processing error");
            mockHandleUpdate.mockRejectedValue(error);
            const result = await telegramHandler()(request, reply);
            (0, globals_1.expect)(mockLogger.error).toHaveBeenCalledWith("Telegram webhook error:", error);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(500);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
        (0, globals_1.it)("should handle callback query updates", async () => {
            const update = {
                update_id: 456,
                callback_query: { id: "cb123", data: "button_click" },
            };
            const request = createMockRequest(update, {
                "x-telegram-bot-api-secret-token": process.env.WEBHOOK_SECRET,
            });
            const reply = createMockReply();
            mockHandleUpdate.mockResolvedValue(undefined);
            const result = await telegramHandler()(request, reply);
            (0, globals_1.expect)(mockHandleUpdate).toHaveBeenCalledWith(update);
            (0, globals_1.expect)(result).toEqual({ ok: true });
        });
    });
    (0, globals_1.describe)("POST /webhook/midtrans", () => {
        const midtransHandler = () => routes.post["/webhook/midtrans"];
        (0, globals_1.it)("should process valid Midtrans notification successfully", async () => {
            const body = {
                order_id: "OC-1234567890-123456789-ABC123",
                status_code: "200",
                gross_amount: "50000",
                signature_key: "",
                transaction_status: "settlement",
                payment_type: "bank_transfer",
            };
            body.signature_key = generateMidtransSignature(body.order_id, body.status_code, body.gross_amount, process.env.MIDTRANS_SERVER_KEY);
            const request = createMockRequest(body, {
                "x-signature": body.signature_key,
            });
            const reply = createMockReply();
            mockPaymentServiceHandleNotification.mockResolvedValue({
                success: true,
                message: "Notification processed",
            });
            const result = await midtransHandler()(request, reply);
            (0, globals_1.expect)(mockPaymentServiceHandleNotification).toHaveBeenCalledWith({
                order_id: body.order_id,
                status_code: body.status_code,
                gross_amount: body.gross_amount,
                signature_key: body.signature_key,
                transaction_status: body.transaction_status,
                payment_type: body.payment_type,
            });
            (0, globals_1.expect)(result).toEqual({ ok: true });
            (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith("Midtrans webhook received:", body);
        });
        (0, globals_1.it)("should reject request with invalid Midtrans signature", async () => {
            const body = {
                order_id: "OC-1234567890-123456789-ABC123",
                status_code: "200",
                gross_amount: "50000",
                signature_key: "invalid-signature",
                transaction_status: "settlement",
                payment_type: "bank_transfer",
            };
            const request = createMockRequest(body, {
                "x-signature": "invalid-signature",
            });
            const reply = createMockReply();
            const result = await midtransHandler()(request, reply);
            (0, globals_1.expect)(mockPaymentServiceHandleNotification).not.toHaveBeenCalled();
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Invalid signature" });
            (0, globals_1.expect)(mockLogger.warn).toHaveBeenCalledWith("Invalid Midtrans signature");
        });
        (0, globals_1.it)("should reject request with tampered order_id", async () => {
            const originalBody = {
                order_id: "OC-1234567890-123456789-ABC123",
                status_code: "200",
                gross_amount: "50000",
                signature_key: "",
                transaction_status: "settlement",
                payment_type: "bank_transfer",
            };
            const validSignature = generateMidtransSignature(originalBody.order_id, originalBody.status_code, originalBody.gross_amount, process.env.MIDTRANS_SERVER_KEY);
            const tamperedBody = { ...originalBody, order_id: "TAMPERED-ORDER-ID" };
            const request = createMockRequest(tamperedBody, {
                "x-signature": validSignature,
            });
            const reply = createMockReply();
            const result = await midtransHandler()(request, reply);
            (0, globals_1.expect)(mockPaymentServiceHandleNotification).not.toHaveBeenCalled();
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
        });
        (0, globals_1.it)("should handle PaymentService error gracefully", async () => {
            const body = {
                order_id: "OC-1234567890-123456789-ABC123",
                status_code: "200",
                gross_amount: "50000",
                signature_key: "",
                transaction_status: "settlement",
                payment_type: "bank_transfer",
            };
            body.signature_key = generateMidtransSignature(body.order_id, body.status_code, body.gross_amount, process.env.MIDTRANS_SERVER_KEY);
            const request = createMockRequest(body, {
                "x-signature": body.signature_key,
            });
            const reply = createMockReply();
            const error = new Error("Database error");
            mockPaymentServiceHandleNotification.mockRejectedValue(error);
            const result = await midtransHandler()(request, reply);
            (0, globals_1.expect)(mockLogger.error).toHaveBeenCalledWith("Midtrans webhook error:", error);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(500);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
        (0, globals_1.it)("should process capture status correctly", async () => {
            const body = {
                order_id: "OC-1234567890-123456789-ABC123",
                status_code: "200",
                gross_amount: "50000",
                signature_key: "",
                transaction_status: "capture",
                payment_type: "credit_card",
            };
            body.signature_key = generateMidtransSignature(body.order_id, body.status_code, body.gross_amount, process.env.MIDTRANS_SERVER_KEY);
            const request = createMockRequest(body, {
                "x-signature": body.signature_key,
            });
            const reply = createMockReply();
            mockPaymentServiceHandleNotification.mockResolvedValue({
                success: true,
                message: "Notification processed",
            });
            const result = await midtransHandler()(request, reply);
            (0, globals_1.expect)(result).toEqual({ ok: true });
        });
        (0, globals_1.it)("should process pending status correctly", async () => {
            const body = {
                order_id: "OC-1234567890-123456789-ABC123",
                status_code: "200",
                gross_amount: "50000",
                signature_key: "",
                transaction_status: "pending",
                payment_type: "bank_transfer",
            };
            body.signature_key = generateMidtransSignature(body.order_id, body.status_code, body.gross_amount, process.env.MIDTRANS_SERVER_KEY);
            const request = createMockRequest(body, {
                "x-signature": body.signature_key,
            });
            const reply = createMockReply();
            mockPaymentServiceHandleNotification.mockResolvedValue({
                success: true,
                message: "Notification processed",
            });
            const result = await midtransHandler()(request, reply);
            (0, globals_1.expect)(result).toEqual({ ok: true });
        });
    });
    (0, globals_1.describe)("POST /webhook/tripay", () => {
        const tripayHandler = () => routes.post["/webhook/tripay"];
        (0, globals_1.it)("should process valid Tripay notification successfully", async () => {
            const body = {
                reference: "TP-123456789",
                status: "PAID",
                status_code: 200,
                amount: 50000,
                signature: "",
                payment_method: "BCA",
            };
            const signature = generateTripaySignature(body, process.env.TRIPAY_PRIVATE_KEY);
            const request = createMockRequest(body, { "x-signature": signature });
            const reply = createMockReply();
            mockPaymentServiceHandleNotification.mockResolvedValue({
                success: true,
                message: "Notification processed",
            });
            const result = await tripayHandler()(request, reply);
            (0, globals_1.expect)(mockPaymentServiceHandleNotification).toHaveBeenCalledWith({
                order_id: body.reference,
                status_code: "200",
                gross_amount: "50000",
                signature_key: body.signature,
                transaction_status: "success",
                payment_type: body.payment_method,
            });
            (0, globals_1.expect)(result).toEqual({ ok: true });
            (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith("Tripay webhook received:", body);
        });
        (0, globals_1.it)("should reject request with invalid Tripay signature", async () => {
            const body = {
                reference: "TP-123456789",
                status: "PAID",
                status_code: 200,
                amount: 50000,
                signature: "invalid-signature",
                payment_method: "BCA",
            };
            const request = createMockRequest(body, {
                "x-signature": "invalid-signature",
            });
            const reply = createMockReply();
            const result = await tripayHandler()(request, reply);
            (0, globals_1.expect)(mockPaymentServiceHandleNotification).not.toHaveBeenCalled();
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Invalid signature" });
            (0, globals_1.expect)(mockLogger.warn).toHaveBeenCalledWith("Invalid Tripay signature");
        });
        (0, globals_1.it)("should map PAID status to success", async () => {
            const body = {
                reference: "TP-123456789",
                status: "PAID",
                status_code: 200,
                amount: 50000,
                signature: "",
                payment_method: "BCA",
            };
            const signature = generateTripaySignature(body, process.env.TRIPAY_PRIVATE_KEY);
            const request = createMockRequest(body, { "x-signature": signature });
            const reply = createMockReply();
            mockPaymentServiceHandleNotification.mockResolvedValue({
                success: true,
                message: "Notification processed",
            });
            await tripayHandler()(request, reply);
            (0, globals_1.expect)(mockPaymentServiceHandleNotification).toHaveBeenCalledWith(globals_1.expect.objectContaining({ transaction_status: "success" }));
        });
        (0, globals_1.it)("should map EXPIRED status to failed", async () => {
            const body = {
                reference: "TP-123456789",
                status: "EXPIRED",
                status_code: 200,
                amount: 50000,
                signature: "",
                payment_method: "BCA",
            };
            const signature = generateTripaySignature(body, process.env.TRIPAY_PRIVATE_KEY);
            const request = createMockRequest(body, { "x-signature": signature });
            const reply = createMockReply();
            mockPaymentServiceHandleNotification.mockResolvedValue({
                success: true,
                message: "Notification processed",
            });
            await tripayHandler()(request, reply);
            (0, globals_1.expect)(mockPaymentServiceHandleNotification).toHaveBeenCalledWith(globals_1.expect.objectContaining({ transaction_status: "failed" }));
        });
        (0, globals_1.it)("should map FAILED status to failed", async () => {
            const body = {
                reference: "TP-123456789",
                status: "FAILED",
                status_code: 200,
                amount: 50000,
                signature: "",
                payment_method: "BCA",
            };
            const signature = generateTripaySignature(body, process.env.TRIPAY_PRIVATE_KEY);
            const request = createMockRequest(body, { "x-signature": signature });
            const reply = createMockReply();
            mockPaymentServiceHandleNotification.mockResolvedValue({
                success: true,
                message: "Notification processed",
            });
            await tripayHandler()(request, reply);
            (0, globals_1.expect)(mockPaymentServiceHandleNotification).toHaveBeenCalledWith(globals_1.expect.objectContaining({ transaction_status: "failed" }));
        });
        (0, globals_1.it)("should map CANCELLED status to failed", async () => {
            const body = {
                reference: "TP-123456789",
                status: "CANCELLED",
                status_code: 200,
                amount: 50000,
                signature: "",
                payment_method: "BCA",
            };
            const signature = generateTripaySignature(body, process.env.TRIPAY_PRIVATE_KEY);
            const request = createMockRequest(body, { "x-signature": signature });
            const reply = createMockReply();
            mockPaymentServiceHandleNotification.mockResolvedValue({
                success: true,
                message: "Notification processed",
            });
            await tripayHandler()(request, reply);
            (0, globals_1.expect)(mockPaymentServiceHandleNotification).toHaveBeenCalledWith(globals_1.expect.objectContaining({ transaction_status: "failed" }));
        });
        (0, globals_1.it)("should map unknown status to pending", async () => {
            const body = {
                reference: "TP-123456789",
                status: "UNPAID",
                status_code: 200,
                amount: 50000,
                signature: "",
                payment_method: "BCA",
            };
            const signature = generateTripaySignature(body, process.env.TRIPAY_PRIVATE_KEY);
            const request = createMockRequest(body, { "x-signature": signature });
            const reply = createMockReply();
            mockPaymentServiceHandleNotification.mockResolvedValue({
                success: true,
                message: "Notification processed",
            });
            await tripayHandler()(request, reply);
            (0, globals_1.expect)(mockPaymentServiceHandleNotification).toHaveBeenCalledWith(globals_1.expect.objectContaining({ transaction_status: "pending" }));
        });
        (0, globals_1.it)("should handle missing status_code gracefully", async () => {
            const body = {
                reference: "TP-123456789",
                status: "PAID",
                amount: 50000,
                signature: "",
                payment_method: "BCA",
            };
            const signature = generateTripaySignature(body, process.env.TRIPAY_PRIVATE_KEY);
            const request = createMockRequest(body, { "x-signature": signature });
            const reply = createMockReply();
            mockPaymentServiceHandleNotification.mockResolvedValue({
                success: true,
                message: "Notification processed",
            });
            await tripayHandler()(request, reply);
            (0, globals_1.expect)(mockPaymentServiceHandleNotification).toHaveBeenCalledWith(globals_1.expect.objectContaining({ status_code: "200" }));
        });
        (0, globals_1.it)("should handle missing amount gracefully", async () => {
            const body = {
                reference: "TP-123456789",
                status: "PAID",
                status_code: 200,
                signature: "",
                payment_method: "BCA",
            };
            const signature = generateTripaySignature(body, process.env.TRIPAY_PRIVATE_KEY);
            const request = createMockRequest(body, { "x-signature": signature });
            const reply = createMockReply();
            mockPaymentServiceHandleNotification.mockResolvedValue({
                success: true,
                message: "Notification processed",
            });
            await tripayHandler()(request, reply);
            (0, globals_1.expect)(mockPaymentServiceHandleNotification).toHaveBeenCalledWith(globals_1.expect.objectContaining({ gross_amount: "0" }));
        });
        (0, globals_1.it)("should handle PaymentService error gracefully", async () => {
            const body = {
                reference: "TP-123456789",
                status: "PAID",
                status_code: 200,
                amount: 50000,
                signature: "",
                payment_method: "BCA",
            };
            const signature = generateTripaySignature(body, process.env.TRIPAY_PRIVATE_KEY);
            const request = createMockRequest(body, { "x-signature": signature });
            const reply = createMockReply();
            const error = new Error("Database error");
            mockPaymentServiceHandleNotification.mockRejectedValue(error);
            const result = await tripayHandler()(request, reply);
            (0, globals_1.expect)(mockLogger.error).toHaveBeenCalledWith("Tripay webhook error:", error);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(500);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
    });
    (0, globals_1.describe)("POST /webhook/nowpayments", () => {
        const nowpaymentsHandler = () => routes.post["/webhook/nowpayments"];
        (0, globals_1.it)("should process valid NOWPayments notification successfully", async () => {
            const body = {
                payment_status: "finished",
                order_id: "CRYPTO-1234567890-123456789",
                payment_id: 98765,
                pay_currency: "usdtbsc",
                price_amount: 20,
            };
            const signature = generateNowPaymentsSignature(body, process.env.NOWPAYMENTS_IPN_SECRET);
            const request = createMockRequest(body, {
                "x-nowpayments-sig": signature,
            });
            const reply = createMockReply();
            mockNowPaymentsServiceHandleWebhook.mockResolvedValue({
                success: true,
                message: "Credits added",
            });
            mockSendMessage.mockResolvedValue(undefined);
            const result = await nowpaymentsHandler()(request, reply);
            (0, globals_1.expect)(mockNowPaymentsServiceHandleWebhook).toHaveBeenCalledWith(body);
            (0, globals_1.expect)(result).toEqual({ ok: true, message: "Credits added" });
            (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith("NOWPayments webhook received:", body);
        });
        (0, globals_1.it)("should reject request with invalid NOWPayments signature", async () => {
            const body = {
                payment_status: "finished",
                order_id: "CRYPTO-1234567890-123456789",
                payment_id: 98765,
            };
            const request = createMockRequest(body, {
                "x-nowpayments-sig": "invalid-signature",
            });
            const reply = createMockReply();
            const result = await nowpaymentsHandler()(request, reply);
            (0, globals_1.expect)(mockNowPaymentsServiceHandleWebhook).not.toHaveBeenCalled();
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Invalid signature" });
            (0, globals_1.expect)(mockLogger.warn).toHaveBeenCalledWith("NOWPayments: invalid IPN signature");
        });
        (0, globals_1.it)("should process request without signature when IPN_SECRET not set", async () => {
            const originalSecret = process.env.NOWPAYMENTS_IPN_SECRET;
            delete process.env.NOWPAYMENTS_IPN_SECRET;
            const body = {
                payment_status: "finished",
                order_id: "CRYPTO-1234567890-123456789",
                payment_id: 98765,
            };
            const request = createMockRequest(body, {});
            const reply = createMockReply();
            mockNowPaymentsServiceHandleWebhook.mockResolvedValue({
                success: true,
                message: "Credits added",
            });
            const result = await nowpaymentsHandler()(request, reply);
            (0, globals_1.expect)(mockNowPaymentsServiceHandleWebhook).toHaveBeenCalledWith(body);
            (0, globals_1.expect)(result).toEqual({ ok: true, message: "Credits added" });
            process.env.NOWPAYMENTS_IPN_SECRET = originalSecret;
        });
        (0, globals_1.it)("should send Telegram notification when credits are added", async () => {
            const body = {
                payment_status: "finished",
                order_id: "CRYPTO-1234567890-123456789",
                payment_id: 98765,
                pay_currency: "usdtbsc",
                price_amount: 20,
            };
            const signature = generateNowPaymentsSignature(body, process.env.NOWPAYMENTS_IPN_SECRET);
            const request = createMockRequest(body, {
                "x-nowpayments-sig": signature,
            });
            const reply = createMockReply();
            mockNowPaymentsServiceHandleWebhook.mockResolvedValue({
                success: true,
                message: "Credits added",
            });
            mockSendMessage.mockResolvedValue(undefined);
            await nowpaymentsHandler()(request, reply);
            (0, globals_1.expect)(mockSendMessage).toHaveBeenCalledWith("123456789", globals_1.expect.stringContaining("Crypto Payment Confirmed"), { parse_mode: "Markdown" });
        });
        (0, globals_1.it)("should extract telegram ID from order_id correctly", async () => {
            const body = {
                payment_status: "finished",
                order_id: "CRYPTO-1234567890-999888777",
                payment_id: 98765,
                pay_currency: "bnbbsc",
                price_amount: 50,
            };
            const signature = generateNowPaymentsSignature(body, process.env.NOWPAYMENTS_IPN_SECRET);
            const request = createMockRequest(body, {
                "x-nowpayments-sig": signature,
            });
            const reply = createMockReply();
            mockNowPaymentsServiceHandleWebhook.mockResolvedValue({
                success: true,
                message: "Credits added",
            });
            mockSendMessage.mockResolvedValue(undefined);
            await nowpaymentsHandler()(request, reply);
            (0, globals_1.expect)(mockSendMessage).toHaveBeenCalledWith("999888777", globals_1.expect.any(String), globals_1.expect.any(Object));
        });
        (0, globals_1.it)("should not send notification when credits are not added", async () => {
            const body = {
                payment_status: "waiting",
                order_id: "CRYPTO-1234567890-123456789",
                payment_id: 98765,
            };
            const signature = generateNowPaymentsSignature(body, process.env.NOWPAYMENTS_IPN_SECRET);
            const request = createMockRequest(body, {
                "x-nowpayments-sig": signature,
            });
            const reply = createMockReply();
            mockNowPaymentsServiceHandleWebhook.mockResolvedValue({
                success: true,
                message: "Status noted",
            });
            await nowpaymentsHandler()(request, reply);
            (0, globals_1.expect)(mockSendMessage).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should not send notification when success is false", async () => {
            const body = {
                payment_status: "finished",
                order_id: "CRYPTO-1234567890-123456789",
                payment_id: 98765,
            };
            const signature = generateNowPaymentsSignature(body, process.env.NOWPAYMENTS_IPN_SECRET);
            const request = createMockRequest(body, {
                "x-nowpayments-sig": signature,
            });
            const reply = createMockReply();
            mockNowPaymentsServiceHandleWebhook.mockResolvedValue({
                success: false,
                message: "Transaction not found",
            });
            await nowpaymentsHandler()(request, reply);
            (0, globals_1.expect)(mockSendMessage).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle notification send failure gracefully", async () => {
            const body = {
                payment_status: "finished",
                order_id: "CRYPTO-1234567890-123456789",
                payment_id: 98765,
                pay_currency: "usdtbsc",
                price_amount: 20,
            };
            const signature = generateNowPaymentsSignature(body, process.env.NOWPAYMENTS_IPN_SECRET);
            const request = createMockRequest(body, {
                "x-nowpayments-sig": signature,
            });
            const reply = createMockReply();
            mockNowPaymentsServiceHandleWebhook.mockResolvedValue({
                success: true,
                message: "Credits added",
            });
            mockSendMessage.mockRejectedValue(new Error("Telegram API error"));
            const result = await nowpaymentsHandler()(request, reply);
            (0, globals_1.expect)(mockLogger.warn).toHaveBeenCalledWith("Failed to notify user about crypto payment:", globals_1.expect.any(Error));
            (0, globals_1.expect)(result).toEqual({ ok: true, message: "Credits added" });
        });
        (0, globals_1.it)("should use default coin when pay_currency is missing", async () => {
            const body = {
                payment_status: "finished",
                order_id: "CRYPTO-1234567890-123456789",
                payment_id: 98765,
                price_amount: 20,
            };
            const signature = generateNowPaymentsSignature(body, process.env.NOWPAYMENTS_IPN_SECRET);
            const request = createMockRequest(body, {
                "x-nowpayments-sig": signature,
            });
            const reply = createMockReply();
            mockNowPaymentsServiceHandleWebhook.mockResolvedValue({
                success: true,
                message: "Credits added",
            });
            mockSendMessage.mockResolvedValue(undefined);
            await nowpaymentsHandler()(request, reply);
            (0, globals_1.expect)(mockSendMessage).toHaveBeenCalledWith(globals_1.expect.any(String), globals_1.expect.stringContaining("CRYPTO"), globals_1.expect.any(Object));
        });
        (0, globals_1.it)("should handle missing price_amount gracefully", async () => {
            const body = {
                payment_status: "finished",
                order_id: "CRYPTO-1234567890-123456789",
                payment_id: 98765,
                pay_currency: "usdtbsc",
            };
            const signature = generateNowPaymentsSignature(body, process.env.NOWPAYMENTS_IPN_SECRET);
            const request = createMockRequest(body, {
                "x-nowpayments-sig": signature,
            });
            const reply = createMockReply();
            mockNowPaymentsServiceHandleWebhook.mockResolvedValue({
                success: true,
                message: "Credits added",
            });
            mockSendMessage.mockResolvedValue(undefined);
            await nowpaymentsHandler()(request, reply);
            (0, globals_1.expect)(mockSendMessage).toHaveBeenCalledWith(globals_1.expect.any(String), globals_1.expect.not.stringContaining("$"), globals_1.expect.any(Object));
        });
        (0, globals_1.it)("should handle NowPaymentsService error gracefully", async () => {
            const body = {
                payment_status: "finished",
                order_id: "CRYPTO-1234567890-123456789",
                payment_id: 98765,
            };
            const signature = generateNowPaymentsSignature(body, process.env.NOWPAYMENTS_IPN_SECRET);
            const request = createMockRequest(body, {
                "x-nowpayments-sig": signature,
            });
            const reply = createMockReply();
            const error = new Error("Service error");
            mockNowPaymentsServiceHandleWebhook.mockRejectedValue(error);
            const result = await nowpaymentsHandler()(request, reply);
            (0, globals_1.expect)(mockLogger.error).toHaveBeenCalledWith("NOWPayments webhook error:", error);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(500);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
        (0, globals_1.it)("should not send notification when order_id is missing", async () => {
            const body = {
                payment_status: "finished",
                payment_id: 98765,
            };
            const signature = generateNowPaymentsSignature(body, process.env.NOWPAYMENTS_IPN_SECRET);
            const request = createMockRequest(body, {
                "x-nowpayments-sig": signature,
            });
            const reply = createMockReply();
            mockNowPaymentsServiceHandleWebhook.mockResolvedValue({
                success: true,
                message: "Credits added",
            });
            await nowpaymentsHandler()(request, reply);
            (0, globals_1.expect)(mockSendMessage).not.toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)("POST /webhook/duitku", () => {
        const duitkuHandler = () => routes.post["/webhook/duitku"];
        (0, globals_1.it)("should process valid Duitku callback successfully", async () => {
            const body = {
                merchantCode: "DS12345",
                amount: "50000",
                merchantOrderId: "OC-1234567890-123456789",
                resultCode: "00",
                reference: "DUTK-REF-123",
                signature: "",
            };
            body.signature = generateDuitkuSignature(body.merchantCode, body.amount, body.merchantOrderId, process.env.DUITKU_API_KEY || "");
            const request = createMockRequest(body);
            const reply = createMockReply();
            mockDuitkuServiceHandleCallback.mockResolvedValue({
                success: true,
                message: "Callback processed",
            });
            const result = await duitkuHandler()(request, reply);
            (0, globals_1.expect)(mockDuitkuServiceHandleCallback).toHaveBeenCalledWith({
                merchantCode: body.merchantCode,
                amount: body.amount,
                merchantOrderId: body.merchantOrderId,
                resultCode: body.resultCode,
                reference: body.reference,
                signature: body.signature,
            });
            (0, globals_1.expect)(result).toEqual({ ok: true, message: "Callback processed" });
            (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith("Duitku callback received:", body);
        });
        (0, globals_1.it)("should handle failed payment callback", async () => {
            const body = {
                merchantCode: "DS12345",
                amount: "50000",
                merchantOrderId: "OC-1234567890-123456789",
                resultCode: "02",
                reference: "DUTK-REF-123",
                signature: "",
            };
            body.signature = generateDuitkuSignature(body.merchantCode, body.amount, body.merchantOrderId, process.env.DUITKU_API_KEY || "");
            const request = createMockRequest(body);
            const reply = createMockReply();
            mockDuitkuServiceHandleCallback.mockResolvedValue({
                success: true,
                message: "Callback processed",
            });
            const result = await duitkuHandler()(request, reply);
            (0, globals_1.expect)(result).toEqual({ ok: true, message: "Callback processed" });
        });
        (0, globals_1.it)("should handle pending payment callback", async () => {
            const body = {
                merchantCode: "DS12345",
                amount: "50000",
                merchantOrderId: "OC-1234567890-123456789",
                resultCode: "01",
                reference: "DUTK-REF-123",
                signature: "",
            };
            body.signature = generateDuitkuSignature(body.merchantCode, body.amount, body.merchantOrderId, process.env.DUITKU_API_KEY || "");
            const request = createMockRequest(body);
            const reply = createMockReply();
            mockDuitkuServiceHandleCallback.mockResolvedValue({
                success: true,
                message: "Callback processed",
            });
            const result = await duitkuHandler()(request, reply);
            (0, globals_1.expect)(result).toEqual({ ok: true, message: "Callback processed" });
        });
        (0, globals_1.it)("should handle DuitkuService error gracefully", async () => {
            const body = {
                merchantCode: "DS12345",
                amount: "50000",
                merchantOrderId: "OC-1234567890-123456789",
                resultCode: "00",
                reference: "DUTK-REF-123",
                signature: "",
            };
            body.signature = generateDuitkuSignature(body.merchantCode, body.amount, body.merchantOrderId, process.env.DUITKU_API_KEY || "");
            const request = createMockRequest(body);
            const reply = createMockReply();
            const error = new Error("Database error");
            mockDuitkuServiceHandleCallback.mockRejectedValue(error);
            const result = await duitkuHandler()(request, reply);
            (0, globals_1.expect)(mockLogger.error).toHaveBeenCalledWith("Duitku webhook error:", error);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(500);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
        (0, globals_1.it)("should handle invalid signature from DuitkuService", async () => {
            const body = {
                merchantCode: "DS12345",
                amount: "50000",
                merchantOrderId: "OC-1234567890-123456789",
                resultCode: "00",
                reference: "DUTK-REF-123",
                signature: "invalid-signature",
            };
            const request = createMockRequest(body);
            const reply = createMockReply();
            mockDuitkuServiceHandleCallback.mockResolvedValue({
                success: false,
                message: "Invalid signature",
            });
            const result = await duitkuHandler()(request, reply);
            (0, globals_1.expect)(result).toEqual({ ok: false, message: "Invalid signature" });
        });
        (0, globals_1.it)("should handle transaction not found from DuitkuService", async () => {
            const body = {
                merchantCode: "DS12345",
                amount: "50000",
                merchantOrderId: "OC-NON-EXISTENT",
                resultCode: "00",
                reference: "DUTK-REF-123",
                signature: "",
            };
            const request = createMockRequest(body);
            const reply = createMockReply();
            mockDuitkuServiceHandleCallback.mockResolvedValue({
                success: false,
                message: "Transaction not found",
            });
            const result = await duitkuHandler()(request, reply);
            (0, globals_1.expect)(result).toEqual({ ok: false, message: "Transaction not found" });
        });
    });
    (0, globals_1.describe)("Edge Cases", () => {
        (0, globals_1.it)("should handle empty request body for telegram webhook", async () => {
            const request = createMockRequest({}, {
                "x-telegram-bot-api-secret-token": process.env.WEBHOOK_SECRET,
            });
            const reply = createMockReply();
            mockHandleUpdate.mockResolvedValue(undefined);
            const result = await routes.post["/webhook/telegram"](request, reply);
            (0, globals_1.expect)(result).toEqual({ ok: true });
        });
        (0, globals_1.it)("should handle concurrent webhook requests", async () => {
            const body = {
                order_id: "OC-1234567890-123456789-ABC123",
                status_code: "200",
                gross_amount: "50000",
                signature_key: "",
                transaction_status: "settlement",
                payment_type: "bank_transfer",
            };
            body.signature_key = generateMidtransSignature(body.order_id, body.status_code, body.gross_amount, process.env.MIDTRANS_SERVER_KEY);
            mockPaymentServiceHandleNotification.mockResolvedValue({
                success: true,
                message: "Notification processed",
            });
            const requests = Array(3)
                .fill(null)
                .map(() => {
                const request = createMockRequest(body, {
                    "x-signature": body.signature_key,
                });
                const reply = createMockReply();
                return routes.post["/webhook/midtrans"](request, reply);
            });
            const results = await Promise.all(requests);
            (0, globals_1.expect)(results).toHaveLength(3);
            results.forEach((result) => {
                (0, globals_1.expect)(result).toEqual({ ok: true });
            });
        });
        (0, globals_1.it)("should handle special characters in order IDs", async () => {
            const body = {
                order_id: "OC-123-456-ABC-!@#$%^&*()",
                status_code: "200",
                gross_amount: "50000",
                signature_key: "",
                transaction_status: "settlement",
                payment_type: "bank_transfer",
            };
            body.signature_key = generateMidtransSignature(body.order_id, body.status_code, body.gross_amount, process.env.MIDTRANS_SERVER_KEY);
            const request = createMockRequest(body, {
                "x-signature": body.signature_key,
            });
            const reply = createMockReply();
            mockPaymentServiceHandleNotification.mockResolvedValue({
                success: true,
                message: "Notification processed",
            });
            const result = await routes.post["/webhook/midtrans"](request, reply);
            (0, globals_1.expect)(result).toEqual({ ok: true });
        });
        (0, globals_1.it)("should handle very large amounts", async () => {
            const body = {
                reference: "TP-123456789",
                status: "PAID",
                status_code: 200,
                amount: 999999999,
                signature: "",
                payment_method: "BCA",
            };
            const signature = generateTripaySignature(body, process.env.TRIPAY_PRIVATE_KEY);
            const request = createMockRequest(body, { "x-signature": signature });
            const reply = createMockReply();
            mockPaymentServiceHandleNotification.mockResolvedValue({
                success: true,
                message: "Notification processed",
            });
            const result = await routes.post["/webhook/tripay"](request, reply);
            (0, globals_1.expect)(mockPaymentServiceHandleNotification).toHaveBeenCalledWith(globals_1.expect.objectContaining({ gross_amount: "999999999" }));
            (0, globals_1.expect)(result).toEqual({ ok: true });
        });
    });
});
//# sourceMappingURL=webhook.test.js.map