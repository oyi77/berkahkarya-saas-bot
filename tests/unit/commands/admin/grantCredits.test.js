"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const grantCredits_1 = require("@/commands/admin/grantCredits");
const fixtures_1 = require("../../../fixtures");
globals_1.jest.mock("@/services/user.service", () => ({
    UserService: {
        findByTelegramId: globals_1.jest.fn(),
        grantCredits: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)("Admin Grant Credits Command", () => {
    let ctx;
    let UserService;
    let logger;
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
        logger = require("@/utils/logger").logger;
        process.env.ADMIN_TELEGRAM_IDS = "123456789";
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
        delete process.env.ADMIN_TELEGRAM_IDS;
    });
    (0, globals_1.describe)("adminGrantCreditsCommand", () => {
        (0, globals_1.it)("should reject non-admin users", async () => {
            ctx.from.id = 999999999;
            ctx.message = { text: "/grant_credits 111111111 10 test", message_id: 1 };
            await (0, grantCredits_1.adminGrantCreditsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ You do not have permission to use this command.");
        });
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            ctx.message = { text: "/grant_credits 111111111 10 test", message_id: 1 };
            await (0, grantCredits_1.adminGrantCreditsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ You do not have permission to use this command.");
        });
        (0, globals_1.it)("should show usage when no arguments provided", async () => {
            ctx.message = { text: "/grant_credits", message_id: 1 };
            await (0, grantCredits_1.adminGrantCreditsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Grant Credits");
            (0, globals_1.expect)(replyCall[0]).toContain("Usage:");
        });
        (0, globals_1.it)("should show usage when insufficient arguments", async () => {
            ctx.message = { text: "/grant_credits 111111111", message_id: 1 };
            await (0, grantCredits_1.adminGrantCreditsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Usage:");
        });
        (0, globals_1.it)("should show error for invalid amount", async () => {
            ctx.message = {
                text: "/grant_credits 111111111 invalid test",
                message_id: 1,
            };
            await (0, grantCredits_1.adminGrantCreditsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Invalid amount. Please enter a positive number.");
        });
        (0, globals_1.it)("should show error for zero amount", async () => {
            ctx.message = { text: "/grant_credits 111111111 0 test", message_id: 1 };
            await (0, grantCredits_1.adminGrantCreditsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Invalid amount. Please enter a positive number.");
        });
        (0, globals_1.it)("should show error for negative amount", async () => {
            ctx.message = { text: "/grant_credits 111111111 -5 test", message_id: 1 };
            await (0, grantCredits_1.adminGrantCreditsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Invalid amount. Please enter a positive number.");
        });
        (0, globals_1.it)("should show error when user not found", async () => {
            ctx.message = { text: "/grant_credits 111111111 10 test", message_id: 1 };
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, grantCredits_1.adminGrantCreditsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ User not found. Please check the user ID.");
        });
        (0, globals_1.it)("should grant credits successfully", async () => {
            ctx.message = {
                text: "/grant_credits 111111111 10 Bonus for referral",
                message_id: 1,
            };
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                id: BigInt(1),
                telegramId: BigInt(111111111),
                username: "testuser",
            });
            UserService.grantCredits.mockResolvedValue(undefined);
            await (0, grantCredits_1.adminGrantCreditsCommand)(ctx);
            (0, globals_1.expect)(UserService.grantCredits).toHaveBeenCalledWith(BigInt(1), 10, "Bonus for referral");
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Credits Granted");
            (0, globals_1.expect)(replyCall[0]).toContain("111111111");
            (0, globals_1.expect)(replyCall[0]).toContain("10");
            (0, globals_1.expect)(replyCall[0]).toContain("Bonus for referral");
        });
        (0, globals_1.it)("should log grant action", async () => {
            ctx.message = {
                text: "/grant_credits 111111111 10 Bonus",
                message_id: 1,
            };
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                id: BigInt(1),
                telegramId: BigInt(111111111),
            });
            UserService.grantCredits.mockResolvedValue(undefined);
            await (0, grantCredits_1.adminGrantCreditsCommand)(ctx);
            (0, globals_1.expect)(logger.info).toHaveBeenCalledWith(globals_1.expect.stringContaining("granted"));
        });
        (0, globals_1.it)("should handle database errors gracefully", async () => {
            ctx.message = { text: "/grant_credits 111111111 10 test", message_id: 1 };
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, grantCredits_1.adminGrantCreditsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Error Granting Credits");
        });
        (0, globals_1.it)("should handle missing message gracefully", async () => {
            ctx.message = undefined;
            await (0, grantCredits_1.adminGrantCreditsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("Usage: /grant_credits <user_id> <amount> <reason>");
        });
        (0, globals_1.it)("should handle user with no username", async () => {
            ctx.message = {
                text: "/grant_credits 111111111 10 Bonus",
                message_id: 1,
            };
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                id: BigInt(1),
                telegramId: BigInt(111111111),
                username: null,
                firstName: "Test",
            });
            UserService.grantCredits.mockResolvedValue(undefined);
            await (0, grantCredits_1.adminGrantCreditsCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Test");
        });
    });
});
//# sourceMappingURL=grantCredits.test.js.map