import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { supportCommand } from "@/commands/support";
import { createMockContext } from "../../fixtures";

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("Support Command", () => {
  let ctx: ReturnType<typeof createMockContext>;

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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("supportCommand", () => {
    it("should show support message", async () => {
      await supportCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Help & Support");
      expect(replyCall[0]).toContain("Frequently Asked Questions");
    });

    it("should show FAQ section", async () => {
      await supportCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("How do I create a video?");
      expect(replyCall[0]).toContain("How long does video generation take?");
      expect(replyCall[0]).toContain("What formats are supported?");
      expect(replyCall[0]).toContain("How do credits work?");
    });

    it("should show correct inline keyboard buttons", async () => {
      await supportCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      expect(keyboard[0][0].url).toContain("t.me/codergaboets");
      expect(keyboard[1][0].callback_data).toBe("view_tutorial");
      expect(keyboard[2][0].callback_data).toBe("report_bug");
      expect(keyboard[3][0].callback_data).toBe("main_menu");
    });

    it("should set session state to SUPPORT_CHAT", async () => {
      await supportCommand(ctx as any);

      expect(ctx.session?.state).toBe("DASHBOARD");
    });

    it("should handle missing session gracefully", async () => {
      ctx.session = undefined as any;

      await expect(supportCommand(ctx as any)).resolves.toBeUndefined();
    });
  });
});
