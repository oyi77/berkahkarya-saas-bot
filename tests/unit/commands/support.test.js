"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const support_1 = require("@/commands/support");
const fixtures_1 = require("../../fixtures");
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)("Support Command", () => {
    let ctx;
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
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("supportCommand", () => {
        (0, globals_1.it)("should show support message", async () => {
            await (0, support_1.supportCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Help & Support");
            (0, globals_1.expect)(replyCall[0]).toContain("Frequently Asked Questions");
        });
        (0, globals_1.it)("should show FAQ section", async () => {
            await (0, support_1.supportCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("How do I create a video?");
            (0, globals_1.expect)(replyCall[0]).toContain("How long does video generation take?");
            (0, globals_1.expect)(replyCall[0]).toContain("What formats are supported?");
            (0, globals_1.expect)(replyCall[0]).toContain("How do credits work?");
        });
        (0, globals_1.it)("should show correct inline keyboard buttons", async () => {
            await (0, support_1.supportCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            (0, globals_1.expect)(keyboard[0][0].url).toContain("t.me/codergaboets");
            (0, globals_1.expect)(keyboard[1][0].callback_data).toBe("view_tutorial");
            (0, globals_1.expect)(keyboard[2][0].callback_data).toBe("report_bug");
            (0, globals_1.expect)(keyboard[3][0].callback_data).toBe("main_menu");
        });
        (0, globals_1.it)("should set session state to SUPPORT_CHAT", async () => {
            await (0, support_1.supportCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.state).toBe("SUPPORT_CHAT");
        });
        (0, globals_1.it)("should handle missing session gracefully", async () => {
            ctx.session = undefined;
            await (0, globals_1.expect)((0, support_1.supportCommand)(ctx)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=support.test.js.map