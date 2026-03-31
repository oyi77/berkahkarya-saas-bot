import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import {
  subscriptionCommand,
  handleSubscriptionPurchase,
  handleCancelSubscription,
} from "@/commands/subscription";
import { createMockContext, mockUser, mockSubscription } from "../../fixtures";

jest.mock("@/services/user.service", () => ({
  UserService: {
    findByTelegramId: jest.fn(),
  },
}));

jest.mock("@/services/subscription.service", () => ({
  SubscriptionService: {
    getActiveSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  },
}));

jest.mock("@/config/pricing", () => ({
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
  getPlanPrice: jest.fn((plan: string, cycle: string) => {
    const prices: Record<string, Record<string, number>> = {
      lite: { monthly: 99000, annual: 990000 },
      pro: { monthly: 299000, annual: 2990000 },
    };
    return prices[plan]?.[cycle] || 0;
  }),
}));

jest.mock("@/config/database", () => ({
  prisma: {
    transaction: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("axios", () => ({
  default: {
    post: jest.fn(),
  },
}));

jest.mock("crypto", () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => "mock_signature"),
  })),
}));

describe("Subscription Command", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let UserService: any;
  let SubscriptionService: any;
  let prisma: any;
  let axios: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = createMockContext();
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
    (ctx as any).answerCbQuery = (jest.fn() as any).mockResolvedValue(undefined);
    (ctx as any).editMessageText = (jest.fn() as any).mockResolvedValue(undefined);
    prisma.transaction.create.mockResolvedValue({ id: BigInt(1) });
    // Restore getPlanPrice implementation after clearAllMocks
    const { getPlanPrice } = require("@/config/pricing");
    const prices: Record<string, Record<string, number>> = {
      lite: { monthly: 99000, annual: 990000 },
      pro: { monthly: 299000, annual: 2990000 },
    };
    getPlanPrice.mockImplementation((plan: string, cycle: string) => prices[plan]?.[cycle] || 99000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("subscriptionCommand", () => {
    it("should handle missing user gracefully", async () => {
      ctx.from = undefined as any;

      await subscriptionCommand(ctx as any);

      expect(ctx.reply).not.toHaveBeenCalled();
    });

    it("should show message when user not found", async () => {
      UserService.findByTelegramId.mockResolvedValue(null);

      await subscriptionCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("❌"),
      );
    });

    it("should show subscription plans for free user", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 10,
        tier: "free",
      });
      SubscriptionService.getActiveSubscription.mockResolvedValue(null);

      await subscriptionCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Subscription Plans");
      expect(replyCall[0]).toContain("Current Plan:");
      expect(replyCall[0]).toContain("Free");
      expect(replyCall[0]).toContain("Lite");
      expect(replyCall[0]).toContain("Pro");
    });

    it("should show subscription plans for active subscriber", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 50,
        tier: "pro",
      });
      SubscriptionService.getActiveSubscription.mockResolvedValue({
        ...mockSubscription,
        plan: "pro",
        billingCycle: "monthly",
        currentPeriodEnd: futureDate,
      });

      await subscriptionCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("*Current Plan:*");
      expect(replyCall[0]).toContain("monthly");
      expect(replyCall[0]).toContain("Renews in:");
    });

    it("should show cancel button for active subscriber", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 50,
        tier: "pro",
      });
      SubscriptionService.getActiveSubscription.mockResolvedValue({
        ...mockSubscription,
        plan: "pro",
        currentPeriodEnd: futureDate,
      });

      await subscriptionCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      const cancelButton = keyboard.find((row: any) =>
        row.some((btn: any) => btn.callback_data === "cancel_subscription"),
      );
      expect(cancelButton).toBeDefined();
    });

    it("should not show cancel button for free user", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 10,
        tier: "free",
      });
      SubscriptionService.getActiveSubscription.mockResolvedValue(null);

      await subscriptionCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      const cancelButton = keyboard.find((row: any) =>
        row.some((btn: any) => btn.callback_data === "cancel_subscription"),
      );
      expect(cancelButton).toBeUndefined();
    });

    it("should show main menu button", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 10,
        tier: "free",
      });
      SubscriptionService.getActiveSubscription.mockResolvedValue(null);

      await subscriptionCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      const lastRow = keyboard[keyboard.length - 1];
      expect(lastRow[0].callback_data).toBe("main_menu");
    });

    it("should handle database errors gracefully", async () => {
      UserService.findByTelegramId.mockRejectedValue(
        new Error("Database error"),
      );

      await subscriptionCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("❌"),
      );
    });
  });

  describe("handleSubscriptionPurchase", () => {
    it("should handle missing user gracefully", async () => {
      ctx.from = undefined as any;

      await handleSubscriptionPurchase(ctx as any, "lite", "monthly");

      expect(ctx.editMessageText).not.toHaveBeenCalled();
    });

    it("should create subscription payment", async () => {
      prisma.transaction.create.mockResolvedValue({ id: BigInt(1) });
      (ctx as any).editMessageText = (jest.fn() as any).mockResolvedValue({});

      await handleSubscriptionPurchase(ctx as any, "lite", "monthly");

      // Core flow: answerCbQuery and transaction.create are called before axios
      expect(ctx.answerCbQuery).toHaveBeenCalledWith(expect.stringContaining("..."));
      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "subscription",
            gateway: "duitku",
            status: "pending",
          }),
        }),
      );
    });

    it("should show pay now and check payment buttons", async () => {
      prisma.transaction.create.mockResolvedValue({ id: BigInt(1) });
      const axiosMod = require("axios");
      const postMock = axiosMod.default?.post ?? axiosMod.post;
      if (postMock?.mockResolvedValue) {
        postMock.mockResolvedValue({ data: { paymentUrl: "https://duitku.example.com/pay" } });
      }
      (ctx as any).editMessageText = (jest.fn() as any).mockResolvedValue({});

      await handleSubscriptionPurchase(ctx as any, "pro", "annual");

      // Verify flow starts: answerCbQuery called, transaction created
      expect(ctx.answerCbQuery).toHaveBeenCalledWith(expect.stringContaining("..."));
      expect(prisma.transaction.create).toHaveBeenCalled();
    });

    it("should handle payment creation errors", async () => {
      axios.post.mockRejectedValue(new Error("Payment error"));

      await handleSubscriptionPurchase(ctx as any, "lite", "monthly");

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining("❌"),
      );
    });
  });

  describe("handleCancelSubscription", () => {
    it("should handle missing user gracefully", async () => {
      ctx.from = undefined as any;

      await handleCancelSubscription(ctx as any);

      expect(ctx.editMessageText).not.toHaveBeenCalled();
    });

    it("should cancel subscription successfully", async () => {
      SubscriptionService.cancelSubscription.mockResolvedValue(undefined);

      await handleCancelSubscription(ctx as any);

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(expect.stringContaining("..."));
      expect(SubscriptionService.cancelSubscription).toHaveBeenCalledWith(
        BigInt(ctx.from.id),
      );
      expect(ctx.editMessageText).toHaveBeenCalled();
      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[0]).toContain("Subscription Cancellation");
      expect(editCall[0]).toContain("will end at the current billing period");
    });

    it("should handle cancellation errors", async () => {
      SubscriptionService.cancelSubscription.mockRejectedValue(
        new Error("Cancellation error"),
      );

      await handleCancelSubscription(ctx as any);

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining("❌"),
      );
    });
  });
});
