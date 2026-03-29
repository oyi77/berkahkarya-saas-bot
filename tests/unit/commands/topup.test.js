"use strict";
/**
 * Topup Command Unit Tests
 *
 * Tests for /topup command handler and related functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const topup_1 = require("@/commands/topup");
const fixtures_1 = require("../../fixtures");
globals_1.jest.mock("@/services/user.service", () => ({
    UserService: {
        findByTelegramId: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/services/payment.service", () => ({
    PaymentService: {
        getPackages: globals_1.jest.fn(() => [
            { id: "starter", name: "Starter", price: 49000, totalCredits: 6 },
            { id: "growth", name: "Growth", price: 149000, totalCredits: 22 },
        ]),
        createTransaction: globals_1.jest.fn(),
        getTransactionStatus: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/services/duitku.service", () => ({
    DuitkuService: {
        createTransaction: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/services/payment-settings.service", () => ({
    PaymentSettingsService: {
        getEnabledGateways: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/services/subscription.service", () => ({
    SubscriptionService: {
        isSubscribed: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/services/nowpayments.service", () => ({
    NowPaymentsService: {
        createPayment: globals_1.jest.fn(),
    },
    CRYPTO_PACKAGES: [
        { credits: 1, usd: 0.5 },
        { credits: 5, usd: 2.0 },
        { credits: 10, usd: 3.5 },
    ],
    CRYPTO_COINS: [
        { id: "usdtbsc", label: "USDT (BSC)", emoji: "💵" },
        { id: "bnb", label: "BNB", emoji: "🟡" },
        { id: "matic", label: "MATIC", emoji: "🟣" },
        { id: "ton", label: "TON", emoji: "💎" },
    ],
}));
globals_1.jest.mock("@/config/pricing", () => ({
    EXTRA_CREDIT_PACKAGES: [
        { id: "extra_1", credits: 1 },
        { id: "extra_5", credits: 5 },
        { id: "extra_10", credits: 10 },
    ],
    getCreditPriceIdr: globals_1.jest.fn((tier) => tier === "free" ? 20000 : 10000),
    getExtraCreditPackagePrice: globals_1.jest.fn((credits, tier) => credits * (tier === "free" ? 20000 : 10000)),
}));
globals_1.jest.mock("@/config/database", () => ({
    prisma: {
        transaction: {
            create: globals_1.jest.fn(),
        },
    },
}));
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("axios", () => ({
    default: {
        post: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("crypto", () => ({
    createHash: globals_1.jest.fn(() => ({
        update: globals_1.jest.fn().mockReturnThis(),
        digest: globals_1.jest.fn(() => "mock_signature"),
    })),
}));
(0, globals_1.describe)("Topup Command", () => {
    let ctx;
    let UserService;
    let PaymentService;
    let DuitkuService;
    let PaymentSettingsService;
    let SubscriptionService;
    let NowPaymentsService;
    let prisma;
    let axios;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        ctx = (0, fixtures_1.createMockContext)();
        ctx.session = {
            state: "DASHBOARD",
            lastActivity: new Date(),
            creditBalance: 10,
            tier: "free",
            stateData: {},
        };
        UserService = require("@/services/user.service").UserService;
        PaymentService = require("@/services/payment.service").PaymentService;
        DuitkuService = require("@/services/duitku.service").DuitkuService;
        PaymentSettingsService =
            require("@/services/payment-settings.service").PaymentSettingsService;
        SubscriptionService =
            require("@/services/subscription.service").SubscriptionService;
        NowPaymentsService =
            require("@/services/nowpayments.service").NowPaymentsService;
        prisma = require("@/config/database").prisma;
        axios = require("axios").default;
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("topupCommand", () => {
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            await (0, topup_1.topupCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should show message when user not found", async () => {
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, topup_1.topupCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Please /start first to use this feature.");
        });
        (0, globals_1.it)("should show topup menu for non-subscriber", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 5,
                tier: "free",
            });
            SubscriptionService.isSubscribed.mockResolvedValue(false);
            await (0, topup_1.topupCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Top Up Credits");
            (0, globals_1.expect)(replyCall[0]).toContain("Standard Pricing");
            (0, globals_1.expect)(replyCall[0]).toContain("Subscribe to save 50%");
        });
        (0, globals_1.it)("should show subscriber pricing for subscribed users", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockPremiumUser,
                creditBalance: 50,
                tier: "pro",
            });
            SubscriptionService.isSubscribed.mockResolvedValue(true);
            await (0, topup_1.topupCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Subscriber Pricing");
            (0, globals_1.expect)(replyCall[0]).not.toContain("Subscribe to save 50%");
        });
        (0, globals_1.it)("should show extra credit packages", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 5,
                tier: "free",
            });
            SubscriptionService.isSubscribed.mockResolvedValue(false);
            await (0, topup_1.topupCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Extra Credit Packages");
        });
        (0, globals_1.it)("should show bulk packages", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 5,
                tier: "free",
            });
            SubscriptionService.isSubscribed.mockResolvedValue(false);
            await (0, topup_1.topupCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Bulk Packages");
        });
        (0, globals_1.it)("should show Telegram Stars option", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 5,
                tier: "free",
            });
            SubscriptionService.isSubscribed.mockResolvedValue(false);
            await (0, topup_1.topupCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            const starsButton = keyboard.find((row) => row.some((btn) => btn.callback_data === "topup_stars_menu"));
            (0, globals_1.expect)(starsButton).toBeDefined();
        });
        (0, globals_1.it)("should show Crypto option", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 5,
                tier: "free",
            });
            SubscriptionService.isSubscribed.mockResolvedValue(false);
            await (0, topup_1.topupCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            const cryptoButton = keyboard.find((row) => row.some((btn) => btn.callback_data === "topup_crypto_menu"));
            (0, globals_1.expect)(cryptoButton).toBeDefined();
        });
        (0, globals_1.it)("should show main menu button", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 5,
                tier: "free",
            });
            SubscriptionService.isSubscribed.mockResolvedValue(false);
            await (0, topup_1.topupCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            const lastRow = keyboard[keyboard.length - 1];
            (0, globals_1.expect)(lastRow[0].callback_data).toBe("main_menu");
        });
        (0, globals_1.it)("should show upsell for non-subscribers", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 5,
                tier: "free",
            });
            SubscriptionService.isSubscribed.mockResolvedValue(false);
            await (0, topup_1.topupCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            const upsellButton = keyboard.find((row) => row.some((btn) => btn.callback_data === "open_subscription"));
            (0, globals_1.expect)(upsellButton).toBeDefined();
        });
        (0, globals_1.it)("should not show upsell for subscribers", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockPremiumUser,
                creditBalance: 50,
                tier: "pro",
            });
            SubscriptionService.isSubscribed.mockResolvedValue(true);
            await (0, topup_1.topupCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            const upsellButton = keyboard.find((row) => row.some((btn) => btn.callback_data === "open_subscription" &&
                btn.text.includes("save")));
            (0, globals_1.expect)(upsellButton).toBeUndefined();
        });
        (0, globals_1.it)("should handle database errors gracefully", async () => {
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, topup_1.topupCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Something went wrong. Please try again.");
        });
    });
    (0, globals_1.describe)("handleTopupSelection", () => {
        (0, globals_1.it)("should handle missing user", async () => {
            ctx.from = undefined;
            await (0, topup_1.handleTopupSelection)(ctx, "starter");
            (0, globals_1.expect)(ctx.editMessageText).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should auto-select single gateway", async () => {
            PaymentSettingsService.getEnabledGateways.mockResolvedValue([
                { id: "midtrans", name: "Midtrans" },
            ]);
            PaymentService.createTransaction.mockResolvedValue({
                orderId: "ORDER-123",
                paymentUrl: "https://payment.example.com",
            });
            await (0, topup_1.handleTopupSelection)(ctx, "starter");
            (0, globals_1.expect)(PaymentService.createTransaction).toHaveBeenCalled();
        });
        (0, globals_1.it)("should show gateway selection for multiple gateways", async () => {
            PaymentSettingsService.getEnabledGateways.mockResolvedValue([
                { id: "midtrans", name: "Midtrans" },
                { id: "duitku", name: "Duitku" },
            ]);
            await (0, topup_1.handleTopupSelection)(ctx, "starter");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("select payment gateway");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            PaymentSettingsService.getEnabledGateways.mockRejectedValue(new Error("Service error"));
            await (0, topup_1.handleTopupSelection)(ctx, "starter");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalledWith(globals_1.expect.stringContaining("Failed to process"));
        });
    });
    (0, globals_1.describe)("handlePaymentGateway", () => {
        (0, globals_1.it)("should handle missing user", async () => {
            ctx.from = undefined;
            await (0, topup_1.handlePaymentGateway)(ctx, "starter", "midtrans");
            (0, globals_1.expect)(ctx.editMessageText).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should create Midtrans transaction", async () => {
            PaymentService.createTransaction.mockResolvedValue({
                orderId: "ORDER-123",
                paymentUrl: "https://payment.example.com",
            });
            await (0, topup_1.handlePaymentGateway)(ctx, "starter", "midtrans");
            (0, globals_1.expect)(PaymentService.createTransaction).toHaveBeenCalled();
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("Payment Ready");
            (0, globals_1.expect)(editCall[0]).toContain("Midtrans");
        });
        (0, globals_1.it)("should create Duitku transaction", async () => {
            DuitkuService.createTransaction.mockResolvedValue({
                orderId: "ORDER-456",
                redirectUrl: "https://duitku.example.com",
            });
            await (0, topup_1.handlePaymentGateway)(ctx, "starter", "duitku");
            (0, globals_1.expect)(DuitkuService.createTransaction).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("Duitku");
        });
        (0, globals_1.it)("should show pay now and check payment buttons", async () => {
            PaymentService.createTransaction.mockResolvedValue({
                orderId: "ORDER-123",
                paymentUrl: "https://payment.example.com",
            });
            await (0, topup_1.handlePaymentGateway)(ctx, "starter", "midtrans");
            const editCall = ctx.editMessageText.mock.calls[0];
            const keyboard = editCall[1].reply_markup.inline_keyboard;
            (0, globals_1.expect)(keyboard[0][0].text).toContain("Pay Now");
            (0, globals_1.expect)(keyboard[1][0].callback_data).toBe("check_payment_ORDER-123");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            PaymentService.createTransaction.mockRejectedValue(new Error("Payment error"));
            await (0, topup_1.handlePaymentGateway)(ctx, "starter", "midtrans");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalledWith(globals_1.expect.stringContaining("Failed to create payment"));
        });
    });
    (0, globals_1.describe)("checkPayment", () => {
        (0, globals_1.it)("should show success message for successful payment", async () => {
            PaymentService.getTransactionStatus.mockResolvedValue({
                status: "success",
                credits: 6,
            });
            await (0, topup_1.checkPayment)(ctx, "ORDER-123");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("Payment Successful");
            (0, globals_1.expect)(editCall[0]).toContain("6");
        });
        (0, globals_1.it)("should show pending message for pending payment", async () => {
            PaymentService.getTransactionStatus.mockResolvedValue({
                status: "pending",
            });
            await (0, topup_1.checkPayment)(ctx, "ORDER-123");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Payment still pending. Please complete payment first.", { show_alert: true });
        });
        (0, globals_1.it)("should show failed message for failed payment", async () => {
            PaymentService.getTransactionStatus.mockResolvedValue({
                status: "failed",
            });
            await (0, topup_1.checkPayment)(ctx, "ORDER-123");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalledWith(globals_1.expect.stringContaining("Payment failed"));
        });
        (0, globals_1.it)("should handle transaction not found", async () => {
            PaymentService.getTransactionStatus.mockResolvedValue(null);
            await (0, topup_1.checkPayment)(ctx, "ORDER-123");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalledWith("❌ Transaction not found.");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            PaymentService.getTransactionStatus.mockRejectedValue(new Error("Service error"));
            await (0, topup_1.checkPayment)(ctx, "ORDER-123");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Failed to check status. Please try again.");
        });
    });
    (0, globals_1.describe)("handleTopupExtraCredit", () => {
        (0, globals_1.it)("should handle missing user", async () => {
            ctx.from = undefined;
            await (0, topup_1.handleTopupExtraCredit)(ctx, 5);
            (0, globals_1.expect)(ctx.editMessageText).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle user not found", async () => {
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, topup_1.handleTopupExtraCredit)(ctx, 5);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalledWith("❌ User not found. Please /start first.");
        });
        (0, globals_1.it)("should create extra credit payment", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                tier: "free",
            });
            prisma.transaction.create.mockResolvedValue({});
            await (0, topup_1.handleTopupExtraCredit)(ctx, 5);
            (0, globals_1.expect)(prisma.transaction.create).toHaveBeenCalled();
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                tier: "free",
            });
            axios.post.mockRejectedValue(new Error("Payment error"));
            await (0, topup_1.handleTopupExtraCredit)(ctx, 5);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalledWith(globals_1.expect.stringContaining("Failed to create payment"));
        });
    });
    (0, globals_1.describe)("handleStarsMenu", () => {
        (0, globals_1.it)("should show Stars packages", async () => {
            await (0, topup_1.handleStarsMenu)(ctx);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("Pay with Telegram Stars");
            (0, globals_1.expect)(editCall[1].reply_markup.inline_keyboard.length).toBeGreaterThan(0);
        });
        (0, globals_1.it)("should show all Stars packages", async () => {
            await (0, topup_1.handleStarsMenu)(ctx);
            const keyboard = ctx.editMessageText.mock.calls[0][1].reply_markup.inline_keyboard;
            const packageButtons = keyboard.filter((row) => row.some((btn) => btn.callback_data?.startsWith("topup_stars_")));
            (0, globals_1.expect)(packageButtons.length).toBe(topup_1.STARS_PACKAGES.length);
        });
        (0, globals_1.it)("should show back button", async () => {
            await (0, topup_1.handleStarsMenu)(ctx);
            const keyboard = ctx.editMessageText.mock.calls[0][1].reply_markup.inline_keyboard;
            const lastRow = keyboard[keyboard.length - 1];
            (0, globals_1.expect)(lastRow[0].callback_data).toBe("topup");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            ctx.editMessageText.mockRejectedValue(new Error("Edit error"));
            await (0, topup_1.handleStarsMenu)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Something went wrong. Please try again.");
        });
    });
    (0, globals_1.describe)("handleStarsInvoice", () => {
        (0, globals_1.it)("should handle invalid package", async () => {
            await (0, topup_1.handleStarsInvoice)(ctx, 999);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Invalid package.");
        });
        (0, globals_1.it)("should handle missing user", async () => {
            ctx.from = undefined;
            await (0, topup_1.handleStarsInvoice)(ctx, 1);
            (0, globals_1.expect)(ctx.replyWithInvoice).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should send invoice for valid package", async () => {
            ctx.replyWithInvoice = globals_1.jest.fn();
            await (0, topup_1.handleStarsInvoice)(ctx, 1);
            (0, globals_1.expect)(ctx.replyWithInvoice).toHaveBeenCalled();
            const mockCalls = ctx.replyWithInvoice.mock.calls;
            const invoiceCall = mockCalls[0][0];
            (0, globals_1.expect)(invoiceCall.currency).toBe("XTR");
            (0, globals_1.expect)(invoiceCall.prices[0].amount).toBe(15);
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            ctx.replyWithInvoice = globals_1.jest.fn(() => {
                throw new Error("Invoice error");
            });
            await (0, topup_1.handleStarsInvoice)(ctx, 1);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith(globals_1.expect.stringContaining("Failed to create Stars invoice"));
        });
    });
    (0, globals_1.describe)("handleCryptoMenu", () => {
        (0, globals_1.it)("should show crypto packages", async () => {
            await (0, topup_1.handleCryptoMenu)(ctx);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("Crypto Payment");
        });
        (0, globals_1.it)("should show all crypto packages", async () => {
            await (0, topup_1.handleCryptoMenu)(ctx);
            const keyboard = ctx.editMessageText.mock.calls[0][1].reply_markup.inline_keyboard;
            const packageButtons = keyboard.filter((row) => row.some((btn) => btn.callback_data?.startsWith("topup_crypto_pkg_")));
            (0, globals_1.expect)(packageButtons.length).toBe(3);
        });
        (0, globals_1.it)("should show back button", async () => {
            await (0, topup_1.handleCryptoMenu)(ctx);
            const keyboard = ctx.editMessageText.mock.calls[0][1].reply_markup.inline_keyboard;
            const lastRow = keyboard[keyboard.length - 1];
            (0, globals_1.expect)(lastRow[0].callback_data).toBe("topup");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            ctx.editMessageText.mockRejectedValue(new Error("Edit error"));
            await (0, topup_1.handleCryptoMenu)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Something went wrong. Please try again.");
        });
    });
    (0, globals_1.describe)("handleCryptoCoinSelect", () => {
        (0, globals_1.it)("should handle invalid package", async () => {
            await (0, topup_1.handleCryptoCoinSelect)(ctx, 999);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Invalid package.");
        });
        (0, globals_1.it)("should show coin selector for valid package", async () => {
            await (0, topup_1.handleCryptoCoinSelect)(ctx, 5);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("5 Credits");
            (0, globals_1.expect)(editCall[0]).toContain("$2.00");
        });
        (0, globals_1.it)("should show all supported coins", async () => {
            await (0, topup_1.handleCryptoCoinSelect)(ctx, 5);
            const keyboard = ctx.editMessageText.mock.calls[0][1].reply_markup.inline_keyboard;
            const coinButtons = keyboard.filter((row) => row.some((btn) => btn.callback_data?.startsWith("topup_crypto_pay_")));
            (0, globals_1.expect)(coinButtons.length).toBe(4);
        });
        (0, globals_1.it)("should show back button", async () => {
            await (0, topup_1.handleCryptoCoinSelect)(ctx, 5);
            const keyboard = ctx.editMessageText.mock.calls[0][1].reply_markup.inline_keyboard;
            const lastRow = keyboard[keyboard.length - 1];
            (0, globals_1.expect)(lastRow[0].callback_data).toBe("topup_crypto_menu");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            ctx.editMessageText.mockRejectedValue(new Error("Edit error"));
            await (0, topup_1.handleCryptoCoinSelect)(ctx, 5);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Something went wrong. Please try again.");
        });
    });
    (0, globals_1.describe)("handleCryptoPayment", () => {
        (0, globals_1.it)("should handle missing user", async () => {
            ctx.from = undefined;
            await (0, topup_1.handleCryptoPayment)(ctx, 5, "usdtbsc");
            (0, globals_1.expect)(ctx.editMessageText).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should create crypto payment", async () => {
            NowPaymentsService.createPayment.mockResolvedValue({
                payAmount: "2.0",
                payCurrency: "usdtbsc",
                payAddress: "0x1234567890abcdef",
                orderId: "CRYPTO-123",
            });
            await (0, topup_1.handleCryptoPayment)(ctx, 5, "usdtbsc");
            (0, globals_1.expect)(NowPaymentsService.createPayment).toHaveBeenCalled();
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("Crypto Payment Created");
            (0, globals_1.expect)(editCall[0]).toContain("0x1234567890abcdef");
        });
        (0, globals_1.it)("should show back to top up button", async () => {
            NowPaymentsService.createPayment.mockResolvedValue({
                payAmount: "2.0",
                payCurrency: "usdtbsc",
                payAddress: "0x1234567890abcdef",
                orderId: "CRYPTO-123",
            });
            await (0, topup_1.handleCryptoPayment)(ctx, 5, "usdtbsc");
            const keyboard = ctx.editMessageText.mock.calls[0][1].reply_markup.inline_keyboard;
            (0, globals_1.expect)(keyboard[0][0].callback_data).toBe("topup");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            NowPaymentsService.createPayment.mockRejectedValue(new Error("Payment error"));
            await (0, topup_1.handleCryptoPayment)(ctx, 5, "usdtbsc");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalledWith(globals_1.expect.stringContaining("Failed to create crypto payment"));
        });
    });
    (0, globals_1.describe)("STARS_PACKAGES", () => {
        (0, globals_1.it)("should have correct package structure", () => {
            (0, globals_1.expect)(topup_1.STARS_PACKAGES).toBeDefined();
            (0, globals_1.expect)(topup_1.STARS_PACKAGES.length).toBe(4);
            topup_1.STARS_PACKAGES.forEach((pkg) => {
                (0, globals_1.expect)(pkg).toHaveProperty("credits");
                (0, globals_1.expect)(pkg).toHaveProperty("stars");
                (0, globals_1.expect)(pkg.credits).toBeGreaterThan(0);
                (0, globals_1.expect)(pkg.stars).toBeGreaterThan(0);
            });
        });
        (0, globals_1.it)("should have increasing stars for more credits", () => {
            for (let i = 1; i < topup_1.STARS_PACKAGES.length; i++) {
                (0, globals_1.expect)(topup_1.STARS_PACKAGES[i].stars).toBeGreaterThan(topup_1.STARS_PACKAGES[i - 1].stars);
            }
        });
    });
});
//# sourceMappingURL=topup.test.js.map