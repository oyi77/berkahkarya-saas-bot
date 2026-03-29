"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const cancel_1 = require("@/commands/cancel");
const fixtures_1 = require("../../fixtures");
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)("Cancel Command", () => {
    let ctx;
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
        logger = require("@/utils/logger").logger;
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("cancelCommand", () => {
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            await (0, cancel_1.cancelCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("Unable to identify user.");
        });
        (0, globals_1.it)("should show no operation message when no active operation", async () => {
            ctx.session.state = "DASHBOARD";
            await (0, cancel_1.cancelCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Tidak ada operasi yang sedang berjalan");
        });
        (0, globals_1.it)("should cancel VIDEO_CREATE operation", async () => {
            ctx.session.state = "VIDEO_CREATE_STEP1";
            ctx.session.videoCreation = { test: "data" };
            await (0, cancel_1.cancelCommand)(ctx);
            (0, globals_1.expect)(ctx.session.state).toBe("DASHBOARD");
            (0, globals_1.expect)(ctx.session.videoCreation).toBeUndefined();
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Dibatalkan");
        });
        (0, globals_1.it)("should cancel CREATE operation", async () => {
            ctx.session.state = "CREATE_NICHE";
            ctx.session.videoCreation = { test: "data" };
            await (0, cancel_1.cancelCommand)(ctx);
            (0, globals_1.expect)(ctx.session.state).toBe("DASHBOARD");
            (0, globals_1.expect)(ctx.session.videoCreation).toBeUndefined();
        });
        (0, globals_1.it)("should cancel IMAGE_CREATE operation", async () => {
            ctx.session.state = "IMAGE_CREATE_STEP1";
            await (0, cancel_1.cancelCommand)(ctx);
            (0, globals_1.expect)(ctx.session.state).toBe("DASHBOARD");
        });
        (0, globals_1.it)("should cancel CUSTOM_ operation", async () => {
            ctx.session.state = "CUSTOM_PROMPT_INPUT";
            await (0, cancel_1.cancelCommand)(ctx);
            (0, globals_1.expect)(ctx.session.state).toBe("DASHBOARD");
        });
        (0, globals_1.it)("should clear videoCreationNew on cancel", async () => {
            ctx.session.state = "VIDEO_CREATE_STEP1";
            ctx.session.videoCreationNew = { test: "data" };
            await (0, cancel_1.cancelCommand)(ctx);
            (0, globals_1.expect)(ctx.session.videoCreationNew).toBeUndefined();
        });
        (0, globals_1.it)("should clear stateData on cancel", async () => {
            ctx.session.state = "VIDEO_CREATE_STEP1";
            ctx.session.stateData = { test: "data" };
            await (0, cancel_1.cancelCommand)(ctx);
            (0, globals_1.expect)(ctx.session.stateData).toEqual({});
        });
        (0, globals_1.it)("should show main menu button after cancel", async () => {
            ctx.session.state = "VIDEO_CREATE_STEP1";
            await (0, cancel_1.cancelCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            (0, globals_1.expect)(keyboard[0][0].callback_data).toBe("main_menu");
        });
        (0, globals_1.it)("should log cancel action", async () => {
            ctx.session.state = "VIDEO_CREATE_STEP1";
            await (0, cancel_1.cancelCommand)(ctx);
            (0, globals_1.expect)(logger.info).toHaveBeenCalledWith(globals_1.expect.stringContaining("cancelled operation"));
        });
        (0, globals_1.it)("should handle missing session gracefully", async () => {
            ctx.session = undefined;
            await (0, cancel_1.cancelCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            ctx.session.state = "VIDEO_CREATE_STEP1";
            ctx.reply.mockRejectedValue(new Error("Reply error"));
            await (0, globals_1.expect)((0, cancel_1.cancelCommand)(ctx)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=cancel.test.js.map