"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const social_1 = require("@/commands/social");
const fixtures_1 = require("../../fixtures");
globals_1.jest.mock("@/services/postautomation.service", () => ({
    PostAutomationService: {
        getUserAccounts: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)("Social Command", () => {
    let ctx;
    let PostAutomationService;
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
        PostAutomationService =
            require("@/services/postautomation.service").PostAutomationService;
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("socialCommand", () => {
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            await (0, social_1.socialCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Unable to identify user.");
        });
        (0, globals_1.it)("should show connect options when no accounts connected", async () => {
            PostAutomationService.getUserAccounts.mockResolvedValue([]);
            await (0, social_1.socialCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Social Media Accounts");
            (0, globals_1.expect)(replyCall[0]).toContain("Connect your social media accounts");
        });
        (0, globals_1.it)("should show all platform connect buttons when no accounts", async () => {
            PostAutomationService.getUserAccounts.mockResolvedValue([]);
            await (0, social_1.socialCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            (0, globals_1.expect)(keyboard[0][0].callback_data).toBe("connect_account_tiktok");
            (0, globals_1.expect)(keyboard[1][0].callback_data).toBe("connect_account_instagram");
            (0, globals_1.expect)(keyboard[2][0].callback_data).toBe("connect_account_facebook");
            (0, globals_1.expect)(keyboard[3][0].callback_data).toBe("connect_account_twitter");
            (0, globals_1.expect)(keyboard[4][0].callback_data).toBe("connect_account_youtube");
        });
        (0, globals_1.it)("should show connected accounts", async () => {
            PostAutomationService.getUserAccounts.mockResolvedValue([
                { ...fixtures_1.mockSocialAccount, platform: "tiktok", username: "@testuser" },
            ]);
            await (0, social_1.socialCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Your Social Media Accounts");
            (0, globals_1.expect)(replyCall[0]).toContain("TIKTOK");
            (0, globals_1.expect)(replyCall[0]).toContain("@testuser");
        });
        (0, globals_1.it)("should show multiple connected accounts", async () => {
            PostAutomationService.getUserAccounts.mockResolvedValue([
                {
                    ...fixtures_1.mockSocialAccount,
                    id: 1,
                    platform: "tiktok",
                    username: "@testuser",
                },
                {
                    ...fixtures_1.mockSocialAccount,
                    id: 2,
                    platform: "instagram",
                    username: "@testinsta",
                },
            ]);
            await (0, social_1.socialCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("TIKTOK");
            (0, globals_1.expect)(replyCall[0]).toContain("INSTAGRAM");
        });
        (0, globals_1.it)("should show disconnect buttons for connected accounts", async () => {
            PostAutomationService.getUserAccounts.mockResolvedValue([
                {
                    ...fixtures_1.mockSocialAccount,
                    id: 1,
                    platform: "tiktok",
                    username: "@testuser",
                },
            ]);
            await (0, social_1.socialCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            const disconnectButton = keyboard.find((row) => row.some((btn) => btn.callback_data === "disconnect_account_1"));
            (0, globals_1.expect)(disconnectButton).toBeDefined();
        });
        (0, globals_1.it)("should show connect new account button", async () => {
            PostAutomationService.getUserAccounts.mockResolvedValue([
                { ...fixtures_1.mockSocialAccount, platform: "tiktok", username: "@testuser" },
            ]);
            await (0, social_1.socialCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            const connectButton = keyboard.find((row) => row.some((btn) => btn.callback_data === "manage_accounts"));
            (0, globals_1.expect)(connectButton).toBeDefined();
        });
        (0, globals_1.it)("should show create video button", async () => {
            PostAutomationService.getUserAccounts.mockResolvedValue([
                { ...fixtures_1.mockSocialAccount, platform: "tiktok", username: "@testuser" },
            ]);
            await (0, social_1.socialCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            const createButton = keyboard.find((row) => row.some((btn) => btn.callback_data === "create_video"));
            (0, globals_1.expect)(createButton).toBeDefined();
        });
        (0, globals_1.it)("should show correct platform emojis", async () => {
            PostAutomationService.getUserAccounts.mockResolvedValue([
                {
                    ...fixtures_1.mockSocialAccount,
                    id: 1,
                    platform: "tiktok",
                    username: "@testuser",
                },
                {
                    ...fixtures_1.mockSocialAccount,
                    id: 2,
                    platform: "instagram",
                    username: "@testinsta",
                },
                {
                    ...fixtures_1.mockSocialAccount,
                    id: 3,
                    platform: "facebook",
                    username: "@testfb",
                },
                {
                    ...fixtures_1.mockSocialAccount,
                    id: 4,
                    platform: "twitter",
                    username: "@testtwitter",
                },
                {
                    ...fixtures_1.mockSocialAccount,
                    id: 5,
                    platform: "youtube",
                    username: "@testyt",
                },
            ]);
            await (0, social_1.socialCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("📱");
            (0, globals_1.expect)(replyCall[0]).toContain("📷");
            (0, globals_1.expect)(replyCall[0]).toContain("📘");
            (0, globals_1.expect)(replyCall[0]).toContain("🐦");
            (0, globals_1.expect)(replyCall[0]).toContain("📺");
        });
        (0, globals_1.it)("should handle database errors gracefully", async () => {
            PostAutomationService.getUserAccounts.mockRejectedValue(new Error("Database error"));
            await (0, social_1.socialCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Something went wrong. Please try again.");
        });
    });
});
//# sourceMappingURL=social.test.js.map