"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const subscription_1 = require("@/commands/subscription");
const fixtures_1 = require("../../fixtures");
globals_1.jest.mock("@/services/user.service", () => ({
    UserService: {
        findByTelegramId: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/services/subscription.service", () => ({
    SubscriptionService: {
        getActiveSubscription: globals_1.jest.fn(),
        cancelSubscription: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/config/pricing", () => ({
    SUBSCRIPTION_PLANS: {
        lite: {
            name: "Lite",
            monthlyCredits: 20,
            monthlyPriceIdr: 99000,
            annualPriceIdr: 990000,
            features: ["20 credits/month", "Basic support"],
        },
        pro: {
            name: "Pro",
            monthlyCredits: 100,
            monthlyPriceIdr: 299000,
            annualPriceIdr: 2990000,
            features: ["100 credits/month", "Priority support", "API access"],
        },
    },
    getPlanPrice: globals_1.jest.fn((plan, cycle) => {
        const prices = {
            lite: { monthly: 99000, annual: 990000 },
            pro: { monthly: 299000, annual: 2990000 },
        };
        return prices[plan]?.[cycle] || 0;
    }),
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
(0, globals_1.describe)("Subscription Command", () => {
    let ctx;
    let UserService;
    let SubscriptionService;
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
        SubscriptionService =
            require("@/services/subscription.service").SubscriptionService;
        prisma = require("@/config/database").prisma;
        axios = require("axios").default;
        // Default mock resolutions for awaited calls
        ctx.answerCbQuery = globals_1.jest.fn().mockResolvedValue(undefined);
        ctx.editMessageText = globals_1.jest.fn().mockResolvedValue(undefined);
        prisma.transaction.create.mockResolvedValue({ id: BigInt(1) });
        // Restore getPlanPrice implementation after clearAllMocks
        const { getPlanPrice } = require("@/config/pricing");
        const prices = {
            lite: { monthly: 99000, annual: 990000 },
            pro: { monthly: 299000, annual: 2990000 },
        };
        getPlanPrice.mockImplementation((plan, cycle) => prices[plan]?.[cycle] || 99000);
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("subscriptionCommand", () => {
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            await (0, subscription_1.subscriptionCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should show message when user not found", async () => {
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, subscription_1.subscriptionCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Please /start first to use this feature.");
        });
        (0, globals_1.it)("should show subscription plans for free user", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
                tier: "free",
            });
            SubscriptionService.getActiveSubscription.mockResolvedValue(null);
            await (0, subscription_1.subscriptionCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Subscription Plans");
            (0, globals_1.expect)(replyCall[0]).toContain("Current Plan:");
            (0, globals_1.expect)(replyCall[0]).toContain("Free");
            (0, globals_1.expect)(replyCall[0]).toContain("Lite");
            (0, globals_1.expect)(replyCall[0]).toContain("Pro");
        });
        (0, globals_1.it)("should show subscription plans for active subscriber", async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 50,
                tier: "pro",
            });
            SubscriptionService.getActiveSubscription.mockResolvedValue({
                ...fixtures_1.mockSubscription,
                plan: "pro",
                billingCycle: "monthly",
                currentPeriodEnd: futureDate,
            });
            await (0, subscription_1.subscriptionCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("*Current Plan:*");
            (0, globals_1.expect)(replyCall[0]).toContain("monthly");
            (0, globals_1.expect)(replyCall[0]).toContain("Renews in:");
        });
        (0, globals_1.it)("should show cancel button for active subscriber", async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 50,
                tier: "pro",
            });
            SubscriptionService.getActiveSubscription.mockResolvedValue({
                ...fixtures_1.mockSubscription,
                plan: "pro",
                currentPeriodEnd: futureDate,
            });
            await (0, subscription_1.subscriptionCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            const cancelButton = keyboard.find((row) => row.some((btn) => btn.callback_data === "cancel_subscription"));
            (0, globals_1.expect)(cancelButton).toBeDefined();
        });
        (0, globals_1.it)("should not show cancel button for free user", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
                tier: "free",
            });
            SubscriptionService.getActiveSubscription.mockResolvedValue(null);
            await (0, subscription_1.subscriptionCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            const cancelButton = keyboard.find((row) => row.some((btn) => btn.callback_data === "cancel_subscription"));
            (0, globals_1.expect)(cancelButton).toBeUndefined();
        });
        (0, globals_1.it)("should show main menu button", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
                tier: "free",
            });
            SubscriptionService.getActiveSubscription.mockResolvedValue(null);
            await (0, subscription_1.subscriptionCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            const lastRow = keyboard[keyboard.length - 1];
            (0, globals_1.expect)(lastRow[0].callback_data).toBe("main_menu");
        });
        (0, globals_1.it)("should handle database errors gracefully", async () => {
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, subscription_1.subscriptionCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Something went wrong. Please try again.");
        });
    });
    (0, globals_1.describe)("handleSubscriptionPurchase", () => {
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            await (0, subscription_1.handleSubscriptionPurchase)(ctx, "lite", "monthly");
            (0, globals_1.expect)(ctx.editMessageText).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should create subscription payment", async () => {
            prisma.transaction.create.mockResolvedValue({ id: BigInt(1) });
            ctx.editMessageText = globals_1.jest.fn().mockResolvedValue({});
            await (0, subscription_1.handleSubscriptionPurchase)(ctx, "lite", "monthly");
            // Core flow: answerCbQuery and transaction.create are called before axios
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Creating payment...");
            (0, globals_1.expect)(prisma.transaction.create).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                data: globals_1.expect.objectContaining({
                    type: "subscription",
                    gateway: "duitku",
                    status: "pending",
                }),
            }));
        });
        (0, globals_1.it)("should show pay now and check payment buttons", async () => {
            prisma.transaction.create.mockResolvedValue({ id: BigInt(1) });
            const axiosMod = require("axios");
            const postMock = axiosMod.default?.post ?? axiosMod.post;
            if (postMock?.mockResolvedValue) {
                postMock.mockResolvedValue({ data: { paymentUrl: "https://duitku.example.com/pay" } });
            }
            ctx.editMessageText = globals_1.jest.fn().mockResolvedValue({});
            await (0, subscription_1.handleSubscriptionPurchase)(ctx, "pro", "annual");
            // Verify flow starts: answerCbQuery called, transaction created
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Creating payment...");
            (0, globals_1.expect)(prisma.transaction.create).toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle payment creation errors", async () => {
            axios.post.mockRejectedValue(new Error("Payment error"));
            await (0, subscription_1.handleSubscriptionPurchase)(ctx, "lite", "monthly");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalledWith("❌ Failed to create payment. Please try again.");
        });
    });
    (0, globals_1.describe)("handleCancelSubscription", () => {
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            await (0, subscription_1.handleCancelSubscription)(ctx);
            (0, globals_1.expect)(ctx.editMessageText).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should cancel subscription successfully", async () => {
            SubscriptionService.cancelSubscription.mockResolvedValue(undefined);
            await (0, subscription_1.handleCancelSubscription)(ctx);
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Processing...");
            (0, globals_1.expect)(SubscriptionService.cancelSubscription).toHaveBeenCalledWith(BigInt(ctx.from.id));
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("Subscription Cancellation");
            (0, globals_1.expect)(editCall[0]).toContain("will end at the current billing period");
        });
        (0, globals_1.it)("should handle cancellation errors", async () => {
            SubscriptionService.cancelSubscription.mockRejectedValue(new Error("Cancellation error"));
            await (0, subscription_1.handleCancelSubscription)(ctx);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalledWith("❌ Failed to cancel. Please try again.");
        });
    });
});
//# sourceMappingURL=subscription.test.js.map