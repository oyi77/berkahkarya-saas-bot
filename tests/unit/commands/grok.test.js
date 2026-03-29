"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const grok_1 = require("@/commands/grok");
const fixtures_1 = require("../../fixtures");
globals_1.jest.mock("@/services/omniroute.service", () => ({
    getOmniRouteService: globals_1.jest.fn(),
}));
globals_1.jest.mock("@/services/vilona-animation.service", () => ({
    sendVilonaLoading: globals_1.jest.fn(),
}));
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)("Chat Command (Grok)", () => {
    let ctx;
    let getOmniRouteService;
    let sendVilonaLoading;
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
        getOmniRouteService =
            require("@/services/omniroute.service").getOmniRouteService;
        sendVilonaLoading =
            require("@/services/vilona-animation.service").sendVilonaLoading;
        logger = require("@/utils/logger").logger;
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("chatCommand", () => {
        (0, globals_1.it)("should show usage message when no prompt provided", async () => {
            ctx.message = { text: "/chat", message_id: 1 };
            await (0, grok_1.chatCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("AI Chat");
            (0, globals_1.expect)(replyCall[0]).toContain("Ask me anything");
            (0, globals_1.expect)(replyCall[0]).toContain("Usage:");
        });
        (0, globals_1.it)("should show usage message for /ask command", async () => {
            ctx.message = { text: "/ask", message_id: 1 };
            await (0, grok_1.chatCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("AI Chat");
        });
        (0, globals_1.it)("should show examples in usage message", async () => {
            ctx.message = { text: "/chat", message_id: 1 };
            await (0, grok_1.chatCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Examples");
            (0, globals_1.expect)(replyCall[0]).toContain("/chat What is the best marketing strategy?");
        });
        (0, globals_1.it)("should process chat prompt successfully", async () => {
            ctx.message = { text: "/chat Hello, how are you?", message_id: 1 };
            sendVilonaLoading.mockResolvedValue(123);
            const mockChatFn = globals_1.jest.fn(() => Promise.resolve({
                success: true,
                content: "I'm doing great, thank you!",
                model: "gpt-3.5-turbo",
            }));
            getOmniRouteService.mockReturnValue({ chat: mockChatFn });
            await (0, grok_1.chatCommand)(ctx);
            (0, globals_1.expect)(sendVilonaLoading).toHaveBeenCalledWith(ctx, "thinking");
            (0, globals_1.expect)(mockChatFn).toHaveBeenCalledWith(String(ctx.from.id), "Hello, how are you?");
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("I'm doing great, thank you!");
        });
        (0, globals_1.it)("should handle /ask command prompt", async () => {
            ctx.message = { text: "/ask What is AI?", message_id: 1 };
            sendVilonaLoading.mockResolvedValue(123);
            const mockChatFn = globals_1.jest.fn(() => Promise.resolve({
                success: true,
                content: "AI is artificial intelligence.",
                model: "gpt-3.5-turbo",
            }));
            getOmniRouteService.mockReturnValue({ chat: mockChatFn });
            await (0, grok_1.chatCommand)(ctx);
            (0, globals_1.expect)(mockChatFn).toHaveBeenCalledWith(String(ctx.from.id), "What is AI?");
        });
        (0, globals_1.it)("should delete loading animation after response", async () => {
            ctx.message = { text: "/chat Hello", message_id: 1 };
            sendVilonaLoading.mockResolvedValue(123);
            const mockChatFn = globals_1.jest.fn(() => Promise.resolve({
                success: true,
                content: "Hello!",
                model: "gpt-3.5-turbo",
            }));
            getOmniRouteService.mockReturnValue({ chat: mockChatFn });
            await (0, grok_1.chatCommand)(ctx);
            (0, globals_1.expect)(ctx.telegram.deleteMessage).toHaveBeenCalledWith(ctx.chat.id, 123);
        });
        (0, globals_1.it)("should handle AI service error", async () => {
            ctx.message = { text: "/chat Hello", message_id: 1 };
            sendVilonaLoading.mockResolvedValue(123);
            const mockChatFn = globals_1.jest.fn(() => Promise.resolve({
                success: false,
                error: "Service unavailable",
            }));
            getOmniRouteService.mockReturnValue({ chat: mockChatFn });
            await (0, grok_1.chatCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Service unavailable");
        });
        (0, globals_1.it)("should handle long responses by chunking", async () => {
            ctx.message = { text: "/chat Tell me a long story", message_id: 1 };
            sendVilonaLoading.mockResolvedValue(123);
            const longResponse = "A".repeat(5000);
            const mockChatFn = globals_1.jest.fn(() => Promise.resolve({
                success: true,
                content: longResponse,
                model: "gpt-3.5-turbo",
            }));
            getOmniRouteService.mockReturnValue({ chat: mockChatFn });
            await (0, grok_1.chatCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCalls = ctx.reply.mock.calls;
            (0, globals_1.expect)(replyCalls.length).toBeGreaterThan(1);
        });
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            ctx.message = { text: "/chat Hello", message_id: 1 };
            sendVilonaLoading.mockResolvedValue(123);
            const mockChatFn = globals_1.jest.fn(() => Promise.resolve({
                success: true,
                content: "Hello!",
                model: "gpt-3.5-turbo",
            }));
            getOmniRouteService.mockReturnValue({ chat: mockChatFn });
            await (0, grok_1.chatCommand)(ctx);
            (0, globals_1.expect)(mockChatFn).toHaveBeenCalledWith("unknown", "Hello");
        });
        (0, globals_1.it)("should handle service errors gracefully", async () => {
            ctx.message = { text: "/chat Hello", message_id: 1 };
            sendVilonaLoading.mockResolvedValue(123);
            const mockChatFn = globals_1.jest.fn(() => Promise.reject(new Error("Service error")));
            getOmniRouteService.mockReturnValue({ chat: mockChatFn });
            await (0, grok_1.chatCommand)(ctx);
            (0, globals_1.expect)(ctx.telegram.deleteMessage).toHaveBeenCalledWith(ctx.chat.id, 123);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Gagal dapat respons AI. Coba lagi ya!");
        });
        (0, globals_1.it)("should log chat response", async () => {
            ctx.message = { text: "/chat Hello", message_id: 1 };
            sendVilonaLoading.mockResolvedValue(123);
            const mockChatFn = globals_1.jest.fn(() => Promise.resolve({
                success: true,
                content: "Hello! How can I help you today?",
                model: "gpt-3.5-turbo",
            }));
            getOmniRouteService.mockReturnValue({ chat: mockChatFn });
            await (0, grok_1.chatCommand)(ctx);
            (0, globals_1.expect)(logger.info).toHaveBeenCalledWith(globals_1.expect.stringContaining("Chat response"));
        });
        (0, globals_1.it)("should handle missing message gracefully", async () => {
            ctx.message = undefined;
            await (0, grok_1.chatCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("AI Chat");
        });
    });
});
//# sourceMappingURL=grok.test.js.map