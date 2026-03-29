"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const profile_1 = require("@/commands/profile");
const fixtures_1 = require("../../fixtures");
globals_1.jest.mock("@/services/user.service", () => ({
    UserService: {
        findByTelegramId: globals_1.jest.fn(),
        getStats: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)("Profile Command", () => {
    let ctx;
    let UserService;
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
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("profileCommand", () => {
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            await (0, profile_1.profileCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("Unable to load profile. Please try again.");
        });
        (0, globals_1.it)("should show message when user not found", async () => {
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, profile_1.profileCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("You don't have an account yet. Please use /start to register first.");
        });
        (0, globals_1.it)("should show profile for free user", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
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
            await (0, profile_1.profileCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Your Profile");
            (0, globals_1.expect)(replyCall[0]).toContain("Test User");
            (0, globals_1.expect)(replyCall[0]).toContain("@testuser");
            (0, globals_1.expect)(replyCall[0]).toContain("Free");
            (0, globals_1.expect)(replyCall[0]).toContain("10");
            (0, globals_1.expect)(replyCall[0]).toContain("TEST123");
        });
        (0, globals_1.it)("should show profile for premium user", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
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
            await (0, profile_1.profileCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Pro");
            (0, globals_1.expect)(replyCall[0]).toContain("100");
        });
        (0, globals_1.it)("should show profile with no username", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
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
            await (0, profile_1.profileCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("@N/A");
        });
        (0, globals_1.it)("should show profile with no last name", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
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
            await (0, profile_1.profileCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Test");
        });
        (0, globals_1.it)("should show profile with no referral code", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
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
            await (0, profile_1.profileCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("N/A");
        });
        (0, globals_1.it)("should show correct inline keyboard buttons", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
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
            await (0, profile_1.profileCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            (0, globals_1.expect)(keyboard[0][0].callback_data).toBe("open_topup");
            (0, globals_1.expect)(keyboard[1][0].url).toContain("t.me/share/url");
            (0, globals_1.expect)(keyboard[2][0].callback_data).toBe("settings");
            (0, globals_1.expect)(keyboard[3][0].callback_data).toBe("main_menu");
        });
        (0, globals_1.it)("should format rupiah correctly", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
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
            await (0, profile_1.profileCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Rp 15.000");
            (0, globals_1.expect)(replyCall[0]).toContain("Rp 500.000");
        });
        (0, globals_1.it)("should handle database errors gracefully", async () => {
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, profile_1.profileCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("Failed to load profile. Please try again later.");
        });
    });
});
//# sourceMappingURL=profile.test.js.map