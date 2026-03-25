import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { socialCommand } from "@/commands/social";
import { createMockContext, mockSocialAccount } from "../../fixtures";

jest.mock("@/services/postautomation.service", () => ({
  PostAutomationService: {
    getUserAccounts: jest.fn(),
  },
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("Social Command", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let PostAutomationService: any;

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
    PostAutomationService =
      require("@/services/postautomation.service").PostAutomationService;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("socialCommand", () => {
    it("should handle missing user gracefully", async () => {
      ctx.from = undefined as any;

      await socialCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith("❌ Unable to identify user.");
    });

    it("should show connect options when no accounts connected", async () => {
      PostAutomationService.getUserAccounts.mockResolvedValue([]);

      await socialCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Social Media Accounts");
      expect(replyCall[0]).toContain("Connect your social media accounts");
    });

    it("should show all platform connect buttons when no accounts", async () => {
      PostAutomationService.getUserAccounts.mockResolvedValue([]);

      await socialCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      expect(keyboard[0][0].callback_data).toBe("connect_account_tiktok");
      expect(keyboard[1][0].callback_data).toBe("connect_account_instagram");
      expect(keyboard[2][0].callback_data).toBe("connect_account_facebook");
      expect(keyboard[3][0].callback_data).toBe("connect_account_twitter");
      expect(keyboard[4][0].callback_data).toBe("connect_account_youtube");
    });

    it("should show connected accounts", async () => {
      PostAutomationService.getUserAccounts.mockResolvedValue([
        { ...mockSocialAccount, platform: "tiktok", username: "@testuser" },
      ]);

      await socialCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Your Social Media Accounts");
      expect(replyCall[0]).toContain("TIKTOK");
      expect(replyCall[0]).toContain("@testuser");
    });

    it("should show multiple connected accounts", async () => {
      PostAutomationService.getUserAccounts.mockResolvedValue([
        {
          ...mockSocialAccount,
          id: 1,
          platform: "tiktok",
          username: "@testuser",
        },
        {
          ...mockSocialAccount,
          id: 2,
          platform: "instagram",
          username: "@testinsta",
        },
      ]);

      await socialCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("TIKTOK");
      expect(replyCall[0]).toContain("INSTAGRAM");
    });

    it("should show disconnect buttons for connected accounts", async () => {
      PostAutomationService.getUserAccounts.mockResolvedValue([
        {
          ...mockSocialAccount,
          id: 1,
          platform: "tiktok",
          username: "@testuser",
        },
      ]);

      await socialCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      const disconnectButton = keyboard.find((row: any) =>
        row.some((btn: any) => btn.callback_data === "disconnect_account_1"),
      );
      expect(disconnectButton).toBeDefined();
    });

    it("should show connect new account button", async () => {
      PostAutomationService.getUserAccounts.mockResolvedValue([
        { ...mockSocialAccount, platform: "tiktok", username: "@testuser" },
      ]);

      await socialCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      const connectButton = keyboard.find((row: any) =>
        row.some((btn: any) => btn.callback_data === "manage_accounts"),
      );
      expect(connectButton).toBeDefined();
    });

    it("should show create video button", async () => {
      PostAutomationService.getUserAccounts.mockResolvedValue([
        { ...mockSocialAccount, platform: "tiktok", username: "@testuser" },
      ]);

      await socialCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      const createButton = keyboard.find((row: any) =>
        row.some((btn: any) => btn.callback_data === "create_video"),
      );
      expect(createButton).toBeDefined();
    });

    it("should show correct platform emojis", async () => {
      PostAutomationService.getUserAccounts.mockResolvedValue([
        {
          ...mockSocialAccount,
          id: 1,
          platform: "tiktok",
          username: "@testuser",
        },
        {
          ...mockSocialAccount,
          id: 2,
          platform: "instagram",
          username: "@testinsta",
        },
        {
          ...mockSocialAccount,
          id: 3,
          platform: "facebook",
          username: "@testfb",
        },
        {
          ...mockSocialAccount,
          id: 4,
          platform: "twitter",
          username: "@testtwitter",
        },
        {
          ...mockSocialAccount,
          id: 5,
          platform: "youtube",
          username: "@testyt",
        },
      ]);

      await socialCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("📱");
      expect(replyCall[0]).toContain("📷");
      expect(replyCall[0]).toContain("📘");
      expect(replyCall[0]).toContain("🐦");
      expect(replyCall[0]).toContain("📺");
    });

    it("should handle database errors gracefully", async () => {
      PostAutomationService.getUserAccounts.mockRejectedValue(
        new Error("Database error"),
      );

      await socialCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        "❌ Something went wrong. Please try again.",
      );
    });
  });
});
