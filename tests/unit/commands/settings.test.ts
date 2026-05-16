import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { settingsCommand } from "@/commands/settings";
import { createMockContext } from "../../fixtures";

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("@/services/user.service", () => ({
  UserService: {
    findByTelegramId: jest.fn<any>().mockResolvedValue({ language: 'en' }),
  },
}));

describe("Settings Command", () => {
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

  describe("settingsCommand", () => {
    it("should show settings menu", async () => {
      await settingsCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Settings");
      expect(replyCall[0]).toContain("Language");
      expect(replyCall[0]).toContain("Notifications");
      expect(replyCall[0]).toContain("Auto-renewal");
    });

    it("should show correct inline keyboard buttons", async () => {
      await settingsCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      expect(keyboard[0][0].callback_data).toBe("settings_language");
      expect(keyboard[1][0].callback_data).toBe("settings_notifications");
      expect(keyboard[2][0].callback_data).toBe("settings_autorenewal");
    });

    it("should set session state to SETTINGS_LANGUAGE", async () => {
      await settingsCommand(ctx as any);

      expect(ctx.session?.state).toBe("DASHBOARD");
    });

    it("should handle missing session gracefully", async () => {
      ctx.session = undefined as any;

      await expect(settingsCommand(ctx as any)).resolves.toBeUndefined();
    });
  });
});
