import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { profileCommand } from "@/commands/profile";
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

describe("Profile Command", () => {
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

  describe("profileCommand", () => {
    it("should handle missing user gracefully", async () => {
      ctx.from = undefined as any;

      await profileCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        "Unable to load profile. Please try again.",
      );
    });

    it("should show message when user not found", async () => {
      UserService.findByTelegramId.mockResolvedValue(null);

      await profileCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        "You don't have an account yet. Please use /start to register first.",
      );
    });

    it("should show profile for free user", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        tier: "free",
        creditBalance: 10,
        referralCode: "TEST123",
      });
      UserService.getStats.mockResolvedValue({
        videosCreated: 5,
        referralCount: 3,
        commissionEarned: 15000,
        totalSpent: 50000,
      });

      await profileCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Your Profile");
      expect(replyCall[0]).toContain("Test User");
      expect(replyCall[0]).toContain("@testuser");
      expect(replyCall[0]).toContain("Free");
      expect(replyCall[0]).toContain("10");
      expect(replyCall[0]).toContain("TEST123");
    });

    it("should show profile for premium user", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        tier: "pro",
        creditBalance: 100,
        referralCode: "PREMIUM",
      });
      UserService.getStats.mockResolvedValue({
        videosCreated: 50,
        referralCount: 10,
        commissionEarned: 100000,
        totalSpent: 500000,
      });

      await profileCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Pro");
      expect(replyCall[0]).toContain("100");
    });

    it("should show profile with no username", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        username: null,
        tier: "free",
        creditBalance: 5,
        referralCode: "TEST123",
      });
      UserService.getStats.mockResolvedValue({
        videosCreated: 0,
        referralCount: 0,
        commissionEarned: 0,
        totalSpent: 0,
      });

      await profileCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("@N/A");
    });

    it("should show profile with no last name", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        lastName: null,
        tier: "free",
        creditBalance: 5,
        referralCode: "TEST123",
      });
      UserService.getStats.mockResolvedValue({
        videosCreated: 0,
        referralCount: 0,
        commissionEarned: 0,
        totalSpent: 0,
      });

      await profileCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Test");
    });

    it("should show profile with no referral code", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        referralCode: null,
        tier: "free",
        creditBalance: 5,
      });
      UserService.getStats.mockResolvedValue({
        videosCreated: 0,
        referralCount: 0,
        commissionEarned: 0,
        totalSpent: 0,
      });

      await profileCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("N/A");
    });

    it("should show correct inline keyboard buttons", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        tier: "free",
        creditBalance: 10,
        referralCode: "TEST123",
      });
      UserService.getStats.mockResolvedValue({
        videosCreated: 5,
        referralCount: 3,
        commissionEarned: 15000,
        totalSpent: 50000,
      });

      await profileCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      expect(keyboard[0][0].callback_data).toBe("open_topup");
      expect(keyboard[1][0].url).toContain("t.me/share/url");
      expect(keyboard[2][0].callback_data).toBe("settings");
      expect(keyboard[3][0].callback_data).toBe("main_menu");
    });

    it("should format rupiah correctly", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        tier: "free",
        creditBalance: 10,
        referralCode: "TEST123",
      });
      UserService.getStats.mockResolvedValue({
        videosCreated: 5,
        referralCount: 3,
        commissionEarned: 15000,
        totalSpent: 500000,
      });

      await profileCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Rp 15.000");
      expect(replyCall[0]).toContain("Rp 500.000");
    });

    it("should handle database errors gracefully", async () => {
      UserService.findByTelegramId.mockRejectedValue(
        new Error("Database error"),
      );

      await profileCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        "Failed to load profile. Please try again later.",
      );
    });
  });
});
