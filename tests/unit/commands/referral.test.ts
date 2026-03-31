import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { referralCommand } from "@/commands/referral";
import { createMockContext, mockUser } from "../../fixtures";

jest.mock("@/services/user.service", () => ({
  UserService: {
    findByTelegramId: jest.fn(),
    getStats: jest.fn(),
  },
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("Referral Command", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let UserService: any;

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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("referralCommand", () => {
    it("should handle missing user gracefully", async () => {
      ctx.from = undefined as any;

      await referralCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("referral"),
      );
    });

    it("should show message when user not found", async () => {
      UserService.findByTelegramId.mockResolvedValue(null);

      await referralCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        "You don't have an account yet. Please use /start to register first.",
      );
    });

    it("should show referral info for user with referrals", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        referralCode: "TEST123",
      });
      UserService.getStats.mockResolvedValue({
        referralCount: 5,
        commissionEarned: 25000,
      });

      await referralCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Referral & Affiliate");
      expect(replyCall[0]).toContain("TEST123");
      expect(replyCall[0]).toContain("5");
      expect(replyCall[0]).toContain("Rp 25.000");
    });

    it("should show referral info for user without referrals", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        referralCode: "TEST123",
      });
      UserService.getStats.mockResolvedValue({
        referralCount: 0,
        commissionEarned: 0,
      });

      await referralCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("0");
      expect(replyCall[0]).toContain("Rp 0");
    });

    it("should show referral info with no referral code", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        referralCode: null,
      });
      UserService.getStats.mockResolvedValue({
        referralCount: 0,
        commissionEarned: 0,
      });

      await referralCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("N/A");
    });

    it("should show correct inline keyboard buttons", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        referralCode: "TEST123",
      });
      UserService.getStats.mockResolvedValue({
        referralCount: 5,
        commissionEarned: 25000,
      });

      await referralCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      expect(keyboard[0][0].url).toContain("t.me/share/url");
      expect(keyboard[3][0].callback_data).toBe("main_menu");
    });

    it("should include referral link in share URL", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        referralCode: "TEST123",
      });
      UserService.getStats.mockResolvedValue({
        referralCount: 5,
        commissionEarned: 25000,
      });

      await referralCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      expect(keyboard[0][0].url).toContain("ref_TEST123");
    });

    it("should handle database errors gracefully", async () => {
      UserService.findByTelegramId.mockRejectedValue(
        new Error("Database error"),
      );

      await referralCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("referral"),
      );
    });
  });
});
