"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const settings_1 = require("@/commands/settings");
const fixtures_1 = require("../../fixtures");
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)("Settings Command", () => {
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
    (0, globals_1.describe)("settingsCommand", () => {
        (0, globals_1.it)("should show settings menu", async () => {
            await (0, settings_1.settingsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Settings");
            (0, globals_1.expect)(replyCall[0]).toContain("Language");
            (0, globals_1.expect)(replyCall[0]).toContain("Notifications");
            (0, globals_1.expect)(replyCall[0]).toContain("Auto-renewal");
        });
        (0, globals_1.it)("should show correct inline keyboard buttons", async () => {
            await (0, settings_1.settingsCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            (0, globals_1.expect)(keyboard[0][0].callback_data).toBe("settings_language");
            (0, globals_1.expect)(keyboard[1][0].callback_data).toBe("settings_notifications");
            (0, globals_1.expect)(keyboard[2][0].callback_data).toBe("settings_autorenewal");
        });
        (0, globals_1.it)("should set session state to SETTINGS_LANGUAGE", async () => {
            await (0, settings_1.settingsCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.state).toBe("SETTINGS_LANGUAGE");
        });
        (0, globals_1.it)("should handle missing session gracefully", async () => {
            ctx.session = undefined;
            await (0, globals_1.expect)((0, settings_1.settingsCommand)(ctx)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=settings.test.js.map