"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const send_1 = require("@/commands/send");
const fixtures_1 = require("../../fixtures");
globals_1.jest.mock("@/services/p2p.service", () => ({
    P2pService: {
        validateTransfer: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)("Send Command", () => {
    let ctx;
    let P2pService;
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
        P2pService = require("@/services/p2p.service").P2pService;
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("sendCommand", () => {
        (0, globals_1.it)("should handle missing message gracefully", async () => {
            ctx.message = undefined;
            await (0, send_1.sendCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle missing message text gracefully", async () => {
            ctx.message = { text: undefined, message_id: 1 };
            await (0, send_1.sendCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should show usage message when no arguments provided", async () => {
            ctx.message = { text: "/send", message_id: 1 };
            await (0, send_1.sendCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Usage: /send");
            (0, globals_1.expect)(replyCall[0]).toContain("recipient_telegram_id");
            (0, globals_1.expect)(replyCall[0]).toContain("amount");
        });
        (0, globals_1.it)("should show usage message when only one argument provided", async () => {
            ctx.message = { text: "/send 123456789", message_id: 1 };
            await (0, send_1.sendCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Usage: /send");
        });
        (0, globals_1.it)("should show usage message when too many arguments provided", async () => {
            ctx.message = { text: "/send 123456789 50 extra", message_id: 1 };
            await (0, send_1.sendCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Usage: /send");
        });
        (0, globals_1.it)("should show error for invalid recipient ID format", async () => {
            ctx.message = { text: "/send invalid_id 50", message_id: 1 };
            await (0, send_1.sendCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Invalid recipient ID format.");
        });
        (0, globals_1.it)("should show error for invalid amount", async () => {
            ctx.message = { text: "/send 123456789 invalid", message_id: 1 };
            await (0, send_1.sendCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Amount must be a positive number.");
        });
        (0, globals_1.it)("should show error for zero amount", async () => {
            ctx.message = { text: "/send 123456789 0", message_id: 1 };
            await (0, send_1.sendCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Amount must be a positive number.");
        });
        (0, globals_1.it)("should show error for negative amount", async () => {
            ctx.message = { text: "/send 123456789 -5", message_id: 1 };
            await (0, send_1.sendCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Amount must be a positive number.");
        });
        (0, globals_1.it)("should show transfer confirmation for valid transfer", async () => {
            ctx.message = { text: "/send 987654321 50", message_id: 1 };
            P2pService.validateTransfer.mockResolvedValue({
                fee: 0.25,
                totalDeduction: 50.25,
            });
            await (0, send_1.sendCommand)(ctx);
            (0, globals_1.expect)(P2pService.validateTransfer).toHaveBeenCalledWith(BigInt(ctx.from.id), BigInt(987654321), 50);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Transfer Confirmation");
            (0, globals_1.expect)(replyCall[0]).toContain("50");
            (0, globals_1.expect)(replyCall[0]).toContain("0.25");
            (0, globals_1.expect)(replyCall[0]).toContain("50.25");
        });
        (0, globals_1.it)("should show confirm and cancel buttons", async () => {
            ctx.message = { text: "/send 987654321 50", message_id: 1 };
            P2pService.validateTransfer.mockResolvedValue({
                fee: 0.25,
                totalDeduction: 50.25,
            });
            await (0, send_1.sendCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            (0, globals_1.expect)(keyboard[0][0].callback_data).toBe("confirm_send_987654321_50");
            (0, globals_1.expect)(keyboard[0][1].callback_data).toBe("cancel_send");
        });
        (0, globals_1.it)("should handle validation errors", async () => {
            ctx.message = { text: "/send 987654321 50", message_id: 1 };
            P2pService.validateTransfer.mockRejectedValue(new Error("Insufficient balance"));
            await (0, send_1.sendCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Transfer Failed: Insufficient balance");
        });
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            ctx.message = { text: "/send 987654321 50", message_id: 1 };
            await (0, globals_1.expect)((0, send_1.sendCommand)(ctx)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=send.test.js.map