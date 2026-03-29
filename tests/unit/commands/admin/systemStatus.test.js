"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const systemStatus_1 = require("@/commands/admin/systemStatus");
const fixtures_1 = require("../../../fixtures");
globals_1.jest.mock("@/config/queue", () => ({
    getQueueStats: globals_1.jest.fn(),
}));
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)("Admin System Status Command", () => {
    let ctx;
    let getQueueStats;
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
        getQueueStats = require("@/config/queue").getQueueStats;
        logger = require("@/utils/logger").logger;
        process.env.ADMIN_TELEGRAM_IDS = "123456789";
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
        delete process.env.ADMIN_TELEGRAM_IDS;
    });
    (0, globals_1.describe)("adminSystemStatusCommand", () => {
        (0, globals_1.it)("should reject non-admin users", async () => {
            ctx.from.id = 999999999;
            await (0, systemStatus_1.adminSystemStatusCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ You do not have permission to use this command.");
        });
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            await (0, systemStatus_1.adminSystemStatusCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ You do not have permission to use this command.");
        });
        (0, globals_1.it)("should show system status", async () => {
            getQueueStats.mockResolvedValue({
                video: { waiting: 5, active: 2 },
                payment: { waiting: 0, active: 1 },
                notification: { waiting: 10, active: 3 },
            });
            await (0, systemStatus_1.adminSystemStatusCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("System Status");
            (0, globals_1.expect)(replyCall[0]).toContain("OpenClaw Core:");
            (0, globals_1.expect)(replyCall[0]).toContain("Connected");
            (0, globals_1.expect)(replyCall[0]).toContain("PostgreSQL:");
            (0, globals_1.expect)(replyCall[0]).toContain("Redis:");
        });
        (0, globals_1.it)("should show queue statistics", async () => {
            getQueueStats.mockResolvedValue({
                video: { waiting: 5, active: 2 },
                payment: { waiting: 0, active: 1 },
                notification: { waiting: 10, active: 3 },
            });
            await (0, systemStatus_1.adminSystemStatusCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Video Queue: 5 waiting, 2 active");
            (0, globals_1.expect)(replyCall[0]).toContain("Payment Queue: 0 waiting, 1 active");
            (0, globals_1.expect)(replyCall[0]).toContain("Notification Queue: 10 waiting, 3 active");
        });
        (0, globals_1.it)("should show active users and videos generated", async () => {
            getQueueStats.mockResolvedValue({
                video: { waiting: 0, active: 0 },
                payment: { waiting: 0, active: 0 },
                notification: { waiting: 0, active: 0 },
            });
            await (0, systemStatus_1.adminSystemStatusCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Active Users:");
            (0, globals_1.expect)(replyCall[0]).toContain("Videos Generated (24h):");
            (0, globals_1.expect)(replyCall[0]).toContain("Error Rate:");
        });
        (0, globals_1.it)("should handle queue stats errors gracefully", async () => {
            getQueueStats.mockRejectedValue(new Error("Queue error"));
            await (0, systemStatus_1.adminSystemStatusCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Failed to get system status. Please try again.");
        });
        (0, globals_1.it)("should log errors", async () => {
            getQueueStats.mockRejectedValue(new Error("Queue error"));
            await (0, systemStatus_1.adminSystemStatusCommand)(ctx);
            (0, globals_1.expect)(logger.error).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=systemStatus.test.js.map