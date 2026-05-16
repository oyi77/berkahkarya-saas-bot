import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
} from "@jest/globals";
import { socialCommand } from "@/commands/social";
import { createMockContext } from "../../fixtures";

describe("Social Command — Coming Soon", () => {
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
      userLang: "en",
    };
  });

  it("should show coming soon message", async () => {
    await socialCommand(ctx as any);

    expect(ctx.reply).toHaveBeenCalled();
    const replyText = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain("Social Media Auto-Post");
    expect(replyText).toContain("Coming soon");
  });

  it("should show main menu button", async () => {
    await socialCommand(ctx as any);

    const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
    const hasMainMenu = keyboard.some((row: any) =>
      row.some((btn: any) => btn.callback_data === "main_menu"),
    );
    expect(hasMainMenu).toBe(true);
  });

  it("should use Markdown parse mode", async () => {
    await socialCommand(ctx as any);

    const options = ctx.reply.mock.calls[0][1];
    expect(options.parse_mode).toBe("Markdown");
  });
});
