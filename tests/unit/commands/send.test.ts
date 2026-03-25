import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { sendCommand } from "@/commands/send";
import { createMockContext, mockUser } from "../../fixtures";

jest.mock("@/services/p2p.service", () => ({
  P2pService: {
    validateTransfer: jest.fn(),
  },
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("Send Command", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let P2pService: any;

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
    P2pService = require("@/services/p2p.service").P2pService;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("sendCommand", () => {
    it("should handle missing message gracefully", async () => {
      ctx.message = undefined;

      await sendCommand(ctx as any);

      expect(ctx.reply).not.toHaveBeenCalled();
    });

    it("should handle missing message text gracefully", async () => {
      ctx.message = { text: undefined, message_id: 1 } as any;

      await sendCommand(ctx as any);

      expect(ctx.reply).not.toHaveBeenCalled();
    });

    it("should show usage message when no arguments provided", async () => {
      ctx.message = { text: "/send", message_id: 1 };

      await sendCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Usage: /send");
      expect(replyCall[0]).toContain("recipient_telegram_id");
      expect(replyCall[0]).toContain("amount");
    });

    it("should show usage message when only one argument provided", async () => {
      ctx.message = { text: "/send 123456789", message_id: 1 };

      await sendCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Usage: /send");
    });

    it("should show usage message when too many arguments provided", async () => {
      ctx.message = { text: "/send 123456789 50 extra", message_id: 1 };

      await sendCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Usage: /send");
    });

    it("should show error for invalid recipient ID format", async () => {
      ctx.message = { text: "/send invalid_id 50", message_id: 1 };

      await sendCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith("❌ Invalid recipient ID format.");
    });

    it("should show error for invalid amount", async () => {
      ctx.message = { text: "/send 123456789 invalid", message_id: 1 };

      await sendCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        "❌ Amount must be a positive number.",
      );
    });

    it("should show error for zero amount", async () => {
      ctx.message = { text: "/send 123456789 0", message_id: 1 };

      await sendCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        "❌ Amount must be a positive number.",
      );
    });

    it("should show error for negative amount", async () => {
      ctx.message = { text: "/send 123456789 -5", message_id: 1 };

      await sendCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        "❌ Amount must be a positive number.",
      );
    });

    it("should show transfer confirmation for valid transfer", async () => {
      ctx.message = { text: "/send 987654321 50", message_id: 1 };
      P2pService.validateTransfer.mockResolvedValue({
        fee: 0.25,
        totalDeduction: 50.25,
      });

      await sendCommand(ctx as any);

      expect(P2pService.validateTransfer).toHaveBeenCalledWith(
        BigInt(ctx.from.id),
        BigInt(987654321),
        50,
      );
      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Transfer Confirmation");
      expect(replyCall[0]).toContain("50");
      expect(replyCall[0]).toContain("0.25");
      expect(replyCall[0]).toContain("50.25");
    });

    it("should show confirm and cancel buttons", async () => {
      ctx.message = { text: "/send 987654321 50", message_id: 1 };
      P2pService.validateTransfer.mockResolvedValue({
        fee: 0.25,
        totalDeduction: 50.25,
      });

      await sendCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      expect(keyboard[0][0].callback_data).toBe("confirm_send_987654321_50");
      expect(keyboard[0][1].callback_data).toBe("cancel_send");
    });

    it("should handle validation errors", async () => {
      ctx.message = { text: "/send 987654321 50", message_id: 1 };
      P2pService.validateTransfer.mockRejectedValue(
        new Error("Insufficient balance"),
      );

      await sendCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        "❌ Transfer Failed: Insufficient balance",
      );
    });

    it("should handle missing user gracefully", async () => {
      ctx.from = undefined as any;
      ctx.message = { text: "/send 987654321 50", message_id: 1 };

      await expect(sendCommand(ctx as any)).rejects.toThrow();
    });
  });
});
