import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { chatCommand } from "@/commands/grok";
import { createMockContext } from "../../fixtures";

jest.mock("@/services/omniroute.service", () => ({
  getOmniRouteService: jest.fn(),
}));

jest.mock("@/services/vilona-animation.service", () => ({
  sendVilonaLoading: jest.fn(),
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("Chat Command (Grok)", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let getOmniRouteService: any;
  let sendVilonaLoading: any;
  let logger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = createMockContext();
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("chatCommand", () => {
    it("should show usage message when no prompt provided", async () => {
      ctx.message = { text: "/chat", message_id: 1 };

      await chatCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("AI Chat");
      expect(replyCall[0]).toContain("Ask me anything");
      expect(replyCall[0]).toContain("Usage:");
    });

    it("should show usage message for /ask command", async () => {
      ctx.message = { text: "/ask", message_id: 1 };

      await chatCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("AI Chat");
    });

    it("should show examples in usage message", async () => {
      ctx.message = { text: "/chat", message_id: 1 };

      await chatCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Examples");
      expect(replyCall[0]).toContain(
        "/chat What is the best marketing strategy?",
      );
    });

    it("should process chat prompt successfully", async () => {
      ctx.message = { text: "/chat Hello, how are you?", message_id: 1 };
      sendVilonaLoading.mockResolvedValue(123);
      const mockChatFn = jest.fn(() =>
        Promise.resolve({
          success: true,
          content: "I'm doing great, thank you!",
          model: "gpt-3.5-turbo",
        }),
      );
      getOmniRouteService.mockReturnValue({ chat: mockChatFn });

      await chatCommand(ctx as any);

      expect(sendVilonaLoading).toHaveBeenCalledWith(ctx, "thinking");
      expect(mockChatFn).toHaveBeenCalledWith(
        String(ctx.from.id),
        "Hello, how are you?",
      );
      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("I'm doing great, thank you!");
    });

    it("should handle /ask command prompt", async () => {
      ctx.message = { text: "/ask What is AI?", message_id: 1 };
      sendVilonaLoading.mockResolvedValue(123);
      const mockChatFn = jest.fn(() =>
        Promise.resolve({
          success: true,
          content: "AI is artificial intelligence.",
          model: "gpt-3.5-turbo",
        }),
      );
      getOmniRouteService.mockReturnValue({ chat: mockChatFn });

      await chatCommand(ctx as any);

      expect(mockChatFn).toHaveBeenCalledWith(
        String(ctx.from.id),
        "What is AI?",
      );
    });

    it("should delete loading animation after response", async () => {
      ctx.message = { text: "/chat Hello", message_id: 1 };
      sendVilonaLoading.mockResolvedValue(123);
      const mockChatFn = jest.fn(() =>
        Promise.resolve({
          success: true,
          content: "Hello!",
          model: "gpt-3.5-turbo",
        }),
      );
      getOmniRouteService.mockReturnValue({ chat: mockChatFn });

      await chatCommand(ctx as any);

      expect(ctx.telegram.deleteMessage).toHaveBeenCalledWith(ctx.chat.id, 123);
    });

    it("should handle AI service error", async () => {
      ctx.message = { text: "/chat Hello", message_id: 1 };
      sendVilonaLoading.mockResolvedValue(123);
      const mockChatFn = jest.fn(() =>
        Promise.resolve({
          success: false,
          error: "Service unavailable",
        }),
      );
      getOmniRouteService.mockReturnValue({ chat: mockChatFn });

      await chatCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith("❌ Service unavailable");
    });

    it("should handle long responses by chunking", async () => {
      ctx.message = { text: "/chat Tell me a long story", message_id: 1 };
      sendVilonaLoading.mockResolvedValue(123);
      const longResponse = "A".repeat(5000);
      const mockChatFn = jest.fn(() =>
        Promise.resolve({
          success: true,
          content: longResponse,
          model: "gpt-3.5-turbo",
        }),
      );
      getOmniRouteService.mockReturnValue({ chat: mockChatFn });

      await chatCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCalls = ctx.reply.mock.calls;
      expect(replyCalls.length).toBeGreaterThan(1);
    });

    it("should handle missing user gracefully", async () => {
      ctx.from = undefined as any;
      ctx.message = { text: "/chat Hello", message_id: 1 };
      sendVilonaLoading.mockResolvedValue(123);
      const mockChatFn = jest.fn(() =>
        Promise.resolve({
          success: true,
          content: "Hello!",
          model: "gpt-3.5-turbo",
        }),
      );
      getOmniRouteService.mockReturnValue({ chat: mockChatFn });

      await chatCommand(ctx as any);

      expect(mockChatFn).toHaveBeenCalledWith("unknown", "Hello");
    });

    it("should handle service errors gracefully", async () => {
      ctx.message = { text: "/chat Hello", message_id: 1 };
      sendVilonaLoading.mockResolvedValue(123);
      const mockChatFn = jest.fn(() =>
        Promise.reject(new Error("Service error")),
      );
      getOmniRouteService.mockReturnValue({ chat: mockChatFn });

      await chatCommand(ctx as any);

      expect(ctx.telegram.deleteMessage).toHaveBeenCalledWith(ctx.chat.id, 123);
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("❌"),
      );
    });

    it("should log chat response", async () => {
      ctx.message = { text: "/chat Hello", message_id: 1 };
      sendVilonaLoading.mockResolvedValue(123);
      const mockChatFn = jest.fn(() =>
        Promise.resolve({
          success: true,
          content: "Hello! How can I help you today?",
          model: "gpt-3.5-turbo",
        }),
      );
      getOmniRouteService.mockReturnValue({ chat: mockChatFn });

      await chatCommand(ctx as any);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Chat response"),
      );
    });

    it("should handle missing message gracefully", async () => {
      ctx.message = undefined;

      await chatCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("AI Chat");
    });
  });
});
