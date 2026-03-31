import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { cancelCommand } from "@/commands/cancel";
import { createMockContext } from "../../fixtures";

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("Cancel Command", () => {
  let ctx: ReturnType<typeof createMockContext>;
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
    logger = require("@/utils/logger").logger;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("cancelCommand", () => {
    it("should handle missing user gracefully", async () => {
      ctx.from = undefined as any;

      await cancelCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("Tidak dapat mengidentifikasi"));
    });

    it("should show no operation message when no active operation", async () => {
      ctx.session.state = "DASHBOARD";

      await cancelCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Tidak ada operasi yang sedang berjalan");
    });

    it("should cancel VIDEO_CREATE operation", async () => {
      ctx.session.state = "VIDEO_CREATE_STEP1";
      ctx.session.videoCreation = { test: "data" };

      await cancelCommand(ctx as any);

      expect(ctx.session.state).toBe("DASHBOARD");
      expect(ctx.session.videoCreation).toBeUndefined();
      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Dibatalkan");
    });

    it("should cancel CREATE operation", async () => {
      ctx.session.state = "CREATE_NICHE";
      ctx.session.videoCreation = { test: "data" };

      await cancelCommand(ctx as any);

      expect(ctx.session.state).toBe("DASHBOARD");
      expect(ctx.session.videoCreation).toBeUndefined();
    });

    it("should cancel IMAGE_CREATE operation", async () => {
      ctx.session.state = "IMAGE_CREATE_STEP1";

      await cancelCommand(ctx as any);

      expect(ctx.session.state).toBe("DASHBOARD");
    });

    it("should cancel CUSTOM_ operation", async () => {
      ctx.session.state = "CUSTOM_PROMPT_INPUT";

      await cancelCommand(ctx as any);

      expect(ctx.session.state).toBe("DASHBOARD");
    });

    it("should clear videoCreationNew on cancel", async () => {
      ctx.session.state = "VIDEO_CREATE_STEP1";
      ctx.session.videoCreationNew = { test: "data" };

      await cancelCommand(ctx as any);

      expect(ctx.session.videoCreationNew).toBeUndefined();
    });

    it("should clear stateData on cancel", async () => {
      ctx.session.state = "VIDEO_CREATE_STEP1";
      ctx.session.stateData = { test: "data" };

      await cancelCommand(ctx as any);

      expect(ctx.session.stateData).toEqual({});
    });

    it("should show main menu button after cancel", async () => {
      ctx.session.state = "VIDEO_CREATE_STEP1";

      await cancelCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      expect(keyboard[0][0].callback_data).toBe("main_menu");
    });

    it("should log cancel action", async () => {
      ctx.session.state = "VIDEO_CREATE_STEP1";

      await cancelCommand(ctx as any);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("cancelled operation"),
      );
    });

    it("should handle missing session gracefully", async () => {
      ctx.session = undefined as any;

      await cancelCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      ctx.session.state = "VIDEO_CREATE_STEP1";
      ctx.reply.mockRejectedValue(new Error("Reply error") as never);

      await expect(cancelCommand(ctx as any)).rejects.toThrow();
    });
  });
});
