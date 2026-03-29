"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const help_1 = require("@/commands/help");
const fixtures_1 = require("../../fixtures");
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)("Help Command", () => {
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
    (0, globals_1.describe)("helpCommand", () => {
        (0, globals_1.it)("should show help message", async () => {
            await (0, help_1.helpCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("BERKAHKARYA AI");
            (0, globals_1.expect)(replyCall[0]).toContain("PANDUAN LENGKAP");
        });
        (0, globals_1.it)("should show all command categories", async () => {
            await (0, help_1.helpCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("/prompts");
            (0, globals_1.expect)(replyCall[0]).toContain("GENERATE");
            (0, globals_1.expect)(replyCall[0]).toContain("ACCOUNT");
        });
        (0, globals_1.it)("should show all available commands", async () => {
            await (0, help_1.helpCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("/prompts");
            (0, globals_1.expect)(replyCall[0]).toContain("/create");
            (0, globals_1.expect)(replyCall[0]).toContain("/credits");
            (0, globals_1.expect)(replyCall[0]).toContain("/history");
            (0, globals_1.expect)(replyCall[0]).toContain("/settings");
            (0, globals_1.expect)(replyCall[0]).toContain("/feedback");
            (0, globals_1.expect)(replyCall[0]).toContain("/settings");
            (0, globals_1.expect)(replyCall[0]).toContain("/support");
        });
        (0, globals_1.it)("should show creative tools section", async () => {
            await (0, help_1.helpCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("GENERATE");
            (0, globals_1.expect)(replyCall[0]).toContain("/video");
            (0, globals_1.expect)(replyCall[0]).toContain("/imagine");
        });
        (0, globals_1.it)("should show quick tips section", async () => {
            await (0, help_1.helpCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("INFO");
            (0, globals_1.expect)(replyCall[0]).toContain("/prompts");
            (0, globals_1.expect)(replyCall[0]).toContain("/daily");
        });
        (0, globals_1.it)("should show main menu button", async () => {
            await (0, help_1.helpCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            (0, globals_1.expect)(keyboard[0][0].callback_data).toBe("main_menu");
        });
        (0, globals_1.it)("should use MarkdownV2 parse mode", async () => {
            await (0, help_1.helpCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[1].parse_mode).toBe("Markdown");
        });
    });
});
//# sourceMappingURL=help.test.js.map