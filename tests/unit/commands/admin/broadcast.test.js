"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const broadcast_1 = require("@/commands/admin/broadcast");
const fixtures_1 = require("../../../fixtures");
globals_1.jest.mock("@/config/database", () => ({
    prisma: {
        user: {
            findMany: globals_1.jest.fn(),
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
(0, globals_1.describe)("Admin Broadcast Command", () => {
    let ctx;
    let prisma;
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
        prisma = require("@/config/database").prisma;
        logger = require("@/utils/logger").logger;
        process.env.ADMIN_TELEGRAM_IDS = "123456789";
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
        delete process.env.ADMIN_TELEGRAM_IDS;
    });
    (0, globals_1.describe)("adminBroadcastCommand", () => {
        (0, globals_1.it)("should reject non-admin users", async () => {
            ctx.from.id = 999999999;
            ctx.message = { text: "/broadcast Hello", message_id: 1 };
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ You do not have permission to use this command.");
        });
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            ctx.message = { text: "/broadcast Hello", message_id: 1 };
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ You do not have permission to use this command.");
        });
        (0, globals_1.it)("should show usage when no message provided", async () => {
            ctx.message = { text: "/broadcast", message_id: 1 };
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Broadcast Message");
            (0, globals_1.expect)(replyCall[0]).toContain("Usage:");
        });
        (0, globals_1.it)("should show usage when message is empty", async () => {
            ctx.message = { text: "/broadcast   ", message_id: 1 };
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Broadcast message cannot be empty.");
        });
        (0, globals_1.it)("should broadcast to all users when no filters", async () => {
            ctx.message = { text: "/broadcast Hello everyone!", message_id: 1 };
            prisma.user.findMany.mockResolvedValue([
                { telegramId: BigInt(111), username: "user1", firstName: "User" },
                { telegramId: BigInt(222), username: "user2", firstName: "User" },
            ]);
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(prisma.user.findMany).toHaveBeenCalled();
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Broadcast Queued");
            (0, globals_1.expect)(replyCall[0]).toContain("2 users");
        });
        (0, globals_1.it)("should filter by tier", async () => {
            ctx.message = { text: "/broadcast Hello --tier pro", message_id: 1 };
            prisma.user.findMany.mockResolvedValue([
                { telegramId: BigInt(111), username: "pro_user", firstName: "Pro" },
            ]);
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(prisma.user.findMany).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                where: globals_1.expect.objectContaining({ tier: "pro" }),
            }));
        });
        (0, globals_1.it)("should filter by active-since (days)", async () => {
            ctx.message = {
                text: "/broadcast Hello --active-since 7d",
                message_id: 1,
            };
            prisma.user.findMany.mockResolvedValue([]);
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(prisma.user.findMany).toHaveBeenCalled();
        });
        (0, globals_1.it)("should filter by active-since (hours)", async () => {
            ctx.message = {
                text: "/broadcast Hello --active-since 24h",
                message_id: 1,
            };
            prisma.user.findMany.mockResolvedValue([]);
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(prisma.user.findMany).toHaveBeenCalled();
        });
        (0, globals_1.it)("should filter by active-since (hours)", async () => {
            ctx.message = {
                text: "/broadcast Hello --active-since 24h",
                message_id: 1,
            };
            prisma.user.findMany.mockResolvedValue([]);
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(prisma.user.findMany).toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle multiple filters", async () => {
            ctx.message = {
                text: "/broadcast Hello --tier pro --active-since 7d",
                message_id: 1,
            };
            prisma.user.findMany.mockResolvedValue([]);
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(prisma.user.findMany).toHaveBeenCalled();
        });
        (0, globals_1.it)("should filter by active-since (hours)", async () => {
            ctx.message = {
                text: "/broadcast Hello --active-since 24h",
                message_id: 1,
            };
            prisma.user.findMany.mockResolvedValue([]);
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(prisma.user.findMany).toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle multiple filters", async () => {
            ctx.message = {
                text: "/broadcast Hello --tier pro --active-since 7d",
                message_id: 1,
            };
            prisma.user.findMany.mockResolvedValue([]);
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(prisma.user.findMany).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                where: globals_1.expect.objectContaining({
                    tier: "pro",
                    lastActivityAt: globals_1.expect.any(Object),
                }),
            }));
        });
        (0, globals_1.it)("should show no users message when no users found", async () => {
            ctx.message = { text: "/broadcast Hello", message_id: 1 };
            prisma.user.findMany.mockResolvedValue([]);
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ No users found matching the specified filters.");
        });
        (0, globals_1.it)("should log broadcast action", async () => {
            ctx.message = { text: "/broadcast Hello everyone!", message_id: 1 };
            prisma.user.findMany.mockResolvedValue([
                { telegramId: BigInt(111), username: "user1", firstName: "User" },
            ]);
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(logger.info).toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle database errors gracefully", async () => {
            ctx.message = { text: "/broadcast Hello", message_id: 1 };
            prisma.user.findMany.mockRejectedValue(new Error("Database error"));
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Error Broadcasting Message");
        });
        (0, globals_1.it)("should handle missing message gracefully", async () => {
            ctx.message = undefined;
            await (0, broadcast_1.adminBroadcastCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("Usage: /broadcast <message> [filters]");
        });
    });
});
//# sourceMappingURL=broadcast.test.js.map