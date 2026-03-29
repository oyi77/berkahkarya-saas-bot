"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const referral_1 = require("@/commands/referral");
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
(0, globals_1.describe)("Referral Command", () => {
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
    (0, globals_1.describe)("referralCommand", () => {
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            await (0, referral_1.referralCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("Unable to load referral info. Please try again.");
        });
        (0, globals_1.it)("should show message when user not found", async () => {
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, referral_1.referralCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("You don't have an account yet. Please use /start to register first.");
        });
        (0, globals_1.it)("should show referral info for user with referrals", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                referralCode: "TEST123",
            });
            UserService.getStats.mockResolvedValue({
                referralCount: 5,
                commissionEarned: 25000,
            });
            await (0, referral_1.referralCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Referral & Affiliate");
            (0, globals_1.expect)(replyCall[0]).toContain("TEST123");
            (0, globals_1.expect)(replyCall[0]).toContain("5");
            (0, globals_1.expect)(replyCall[0]).toContain("Rp 25.000");
        });
        (0, globals_1.it)("should show referral info for user without referrals", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                referralCode: "TEST123",
            });
            UserService.getStats.mockResolvedValue({
                referralCount: 0,
                commissionEarned: 0,
            });
            await (0, referral_1.referralCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("0");
            (0, globals_1.expect)(replyCall[0]).toContain("Rp 0");
        });
        (0, globals_1.it)("should show referral info with no referral code", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                referralCode: null,
            });
            UserService.getStats.mockResolvedValue({
                referralCount: 0,
                commissionEarned: 0,
            });
            await (0, referral_1.referralCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("N/A");
        });
        (0, globals_1.it)("should show correct inline keyboard buttons", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                referralCode: "TEST123",
            });
            UserService.getStats.mockResolvedValue({
                referralCount: 5,
                commissionEarned: 25000,
            });
            await (0, referral_1.referralCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            (0, globals_1.expect)(keyboard[0][0].url).toContain("t.me/share/url");
            (0, globals_1.expect)(keyboard[1][0].callback_data).toBe("main_menu");
        });
        (0, globals_1.it)("should include referral link in share URL", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                referralCode: "TEST123",
            });
            UserService.getStats.mockResolvedValue({
                referralCount: 5,
                commissionEarned: 25000,
            });
            await (0, referral_1.referralCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            (0, globals_1.expect)(keyboard[0][0].url).toContain("ref_TEST123");
        });
        (0, globals_1.it)("should handle database errors gracefully", async () => {
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, referral_1.referralCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("Failed to load referral info. Please try again later.");
        });
    });
});
//# sourceMappingURL=referral.test.js.map