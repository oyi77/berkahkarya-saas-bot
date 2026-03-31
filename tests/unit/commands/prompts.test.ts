import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import {
  promptsCommand,
  showNichePrompts,
  showPromptDetail,
  showCustomizePrompt,
  dailyCommand,
  trendingCommand,
  fingerprintCommand,
  saveLibraryPrompt,
  showMyPrompts,
  startAddCustomPrompt,
  PROMPT_LIBRARY,
  TRENDING_PROMPTS,
  getPromptById,
} from "@/commands/prompts";
import { createMockContext, mockUser, mockSavedPrompt } from "../../fixtures";

jest.mock("@/services/user.service", () => ({
  UserService: {
    findByTelegramId: jest.fn(),
  },
}));

jest.mock("@/services/saved-prompt.service", () => ({
  SavedPromptService: {
    getByUser: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
  },
}));

jest.mock("@/config/database", () => ({
  prisma: {
    savedPrompt: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("Prompts Command", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let UserService: any;
  let SavedPromptService: any;
  let prisma: any;

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
    UserService = require("@/services/user.service").UserService;
    SavedPromptService =
      require("@/services/saved-prompt.service").SavedPromptService;
    prisma = require("@/config/database").prisma;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("PROMPT_LIBRARY", () => {
    it("should have all required niches", () => {
      expect(PROMPT_LIBRARY).toHaveProperty("fnb");
      expect(PROMPT_LIBRARY).toHaveProperty("fashion");
      expect(PROMPT_LIBRARY).toHaveProperty("tech");
      expect(PROMPT_LIBRARY).toHaveProperty("health");
      expect(PROMPT_LIBRARY).toHaveProperty("travel");
      expect(PROMPT_LIBRARY).toHaveProperty("education");
      expect(PROMPT_LIBRARY).toHaveProperty("finance");
      expect(PROMPT_LIBRARY).toHaveProperty("entertainment");
    });

    it("should have 5 prompts per niche", () => {
      Object.keys(PROMPT_LIBRARY).forEach((niche) => {
        expect(PROMPT_LIBRARY[niche].prompts.length).toBe(5);
      });
    });

    it("should have required prompt properties", () => {
      Object.keys(PROMPT_LIBRARY).forEach((niche) => {
        PROMPT_LIBRARY[niche].prompts.forEach((prompt) => {
          expect(prompt).toHaveProperty("id");
          expect(prompt).toHaveProperty("title");
          expect(prompt).toHaveProperty("prompt");
          expect(prompt).toHaveProperty("suitable");
          expect(prompt).toHaveProperty("successRate");
        });
      });
    });
  });

  describe("TRENDING_PROMPTS", () => {
    it("should have trending prompts", () => {
      expect(TRENDING_PROMPTS.length).toBeGreaterThan(0);
    });

    it("should have required properties", () => {
      TRENDING_PROMPTS.forEach((t) => {
        expect(t).toHaveProperty("niche");
        expect(t).toHaveProperty("promptId");
        expect(t).toHaveProperty("usageChange");
      });
    });
  });

  describe("getPromptById", () => {
    it("should return prompt for valid ID", async () => {
      const prompt = await getPromptById("fnb_1");
      expect(prompt).toBeDefined();
      expect(prompt?.id).toBe("fnb_1");
      expect(prompt?.niche).toBe("fnb");
    });

    it("should return null for invalid ID", async () => {
      const prompt = await getPromptById("invalid_id");
      expect(prompt).toBeNull();
    });
  });

  describe("promptsCommand", () => {
    it("should show prompt library menu", async () => {
      ctx.message = { text: "/prompts", message_id: 1 };

      await promptsCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("PROMPT LIBRARY");
      expect(replyCall[0]).toContain("40+");
    });

    it("should show all niche buttons", async () => {
      ctx.message = { text: "/prompts", message_id: 1 };

      await promptsCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      const allButtons = keyboard.flat();
      expect(
        allButtons.some((btn: any) => btn.callback_data === "prompts_fnb"),
      ).toBe(true);
      expect(
        allButtons.some((btn: any) => btn.callback_data === "prompts_fashion"),
      ).toBe(true);
      expect(
        allButtons.some((btn: any) => btn.callback_data === "prompts_tech"),
      ).toBe(true);
      expect(
        allButtons.some((btn: any) => btn.callback_data === "prompts_health"),
      ).toBe(true);
    });

    it("should show niche prompts when niche argument provided", async () => {
      ctx.message = { text: "/prompts fnb", message_id: 1 };
      prisma.savedPrompt.findMany.mockResolvedValue([]);
      UserService.findByTelegramId.mockResolvedValue(null);

      await promptsCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("F&B");
    });

    it("should handle errors gracefully", async () => {
      ctx.message = { text: "/prompts", message_id: 1 };
      ctx.reply.mockRejectedValue(new Error("Reply error") as never);

      await expect(promptsCommand(ctx as any)).rejects.toThrow();
    });
  });

  describe("showNichePrompts", () => {
    it("should show prompts for valid niche", async () => {
      prisma.savedPrompt.findMany.mockResolvedValue([]);
      UserService.findByTelegramId.mockResolvedValue(null);

      await showNichePrompts(ctx as any, "fnb");

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("F&B");
      expect(replyCall[0]).toContain("PROMPT TEMPLATES");
    });

    it("should show error for invalid niche", async () => {
      await showNichePrompts(ctx as any, "invalid_niche");

      expect(ctx.reply).toHaveBeenCalledWith("❌ Niche tidak ditemukan.");
    });

    it("should show admin prompts when available", async () => {
      prisma.savedPrompt.findMany.mockResolvedValue([
        { id: 1, title: "Admin Prompt", prompt: "Test prompt", niche: "fnb" },
      ]);
      UserService.findByTelegramId.mockResolvedValue(null);

      await showNichePrompts(ctx as any, "fnb");

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Dari Admin");
    });

    it("should show saved prompts when available", async () => {
      prisma.savedPrompt.findMany.mockResolvedValue([]);
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        id: BigInt(1),
      });
      SavedPromptService.getByUser.mockResolvedValue([mockSavedPrompt]);

      await showNichePrompts(ctx as any, "fnb");

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("PROMPT TEMPLATES");
    });

    it("should edit message when edit flag is true", async () => {
      prisma.savedPrompt.findMany.mockResolvedValue([]);
      UserService.findByTelegramId.mockResolvedValue(null);

      await showNichePrompts(ctx as any, "fnb", true);

      expect(ctx.editMessageText).toHaveBeenCalled();
    });
  });

  describe("showPromptDetail", () => {
    it("should show prompt details", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 10,
      });

      await showPromptDetail(ctx as any, "fnb_1");

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Prompt Aktif");
      expect(replyCall[0]).toContain("Steam & Zoom Drama");
    });

    it("should show error for invalid prompt ID", async () => {
      await showPromptDetail(ctx as any, "invalid_id");

      expect(ctx.reply).toHaveBeenCalledWith("❌ Prompt tidak ditemukan.");
    });

    it("should save prompt to session", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 10,
      });

      await showPromptDetail(ctx as any, "fnb_1");

      expect(ctx.session?.stateData?.selectedPrompt).toBeDefined();
    });

    it("should edit message when edit flag is true", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 10,
      });

      await showPromptDetail(ctx as any, "fnb_1", true);

      expect(ctx.editMessageText).toHaveBeenCalled();
    });
  });

  describe("showCustomizePrompt", () => {
    it("should show customize options", async () => {
      await showCustomizePrompt(ctx as any, "fnb_1");

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("PROMPT CUSTOMIZER");
    });

    it("should set session state to CUSTOMIZING_PROMPT", async () => {
      await showCustomizePrompt(ctx as any, "fnb_1");

      expect(ctx.session?.state).toBe("CUSTOMIZING_PROMPT");
    });

    it("should edit message when edit flag is true", async () => {
      await showCustomizePrompt(ctx as any, "fnb_1", true);

      expect(ctx.editMessageText).toHaveBeenCalled();
    });
  });

  describe("dailyCommand", () => {
    it("should handle missing user gracefully", async () => {
      ctx.from = undefined as any;

      await dailyCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("Tidak dapat mengidentifikasi"));
    });

    it("should show daily prompt", async () => {
      await dailyCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("MYSTERY PROMPT BOX");
    });

    it("should save prompt to session", async () => {
      await dailyCommand(ctx as any);

      expect(ctx.session?.stateData?.selectedPrompt).toBeDefined();
    });

    it("should show action buttons", async () => {
      await dailyCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      expect(keyboard[0][0].callback_data).toContain("use_prompt_");
      expect(keyboard[0][1].callback_data).toContain("daily_save_");
    });

    it("should handle errors gracefully", async () => {
      ctx.reply.mockRejectedValue(new Error("Reply error") as never);

      await expect(dailyCommand(ctx as any)).rejects.toThrow();
    });
  });

  describe("trendingCommand", () => {
    it("should show trending prompts", async () => {
      await trendingCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("TRENDING PROMPTS");
    });

    it("should show all trending prompts", async () => {
      await trendingCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      TRENDING_PROMPTS.forEach((t, i) => {
        expect(replyCall[0]).toContain(`#${i + 1}`);
      });
    });

    it("should show action buttons for each prompt", async () => {
      await trendingCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      const promptButtons = keyboard.filter((row: any) =>
        row.some((btn: any) => btn.callback_data?.startsWith("use_prompt_")),
      );
      expect(promptButtons.length).toBe(TRENDING_PROMPTS.length);
    });

    it("should handle errors gracefully", async () => {
      ctx.reply.mockRejectedValue(new Error("Reply error") as never);

      await expect(trendingCommand(ctx as any)).rejects.toThrow();
    });
  });

  describe("fingerprintCommand", () => {
    it("should show fingerprint analysis", async () => {
      await fingerprintCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("YOUR PROMPT FINGERPRINT");
    });

    it("should show style preferences", async () => {
      await fingerprintCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Top Styles");
      expect(replyCall[0]).toContain("Preferred Lighting");
      expect(replyCall[0]).toContain("Favorite Moods");
    });

    it("should show recommendations", async () => {
      await fingerprintCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("RECOMMENDED FOR YOU");
    });

    it("should handle errors gracefully", async () => {
      ctx.reply.mockRejectedValue(new Error("Reply error") as never);

      await expect(fingerprintCommand(ctx as any)).rejects.toThrow();
    });
  });

  describe("saveLibraryPrompt", () => {
    it("should handle invalid prompt ID", async () => {
      await saveLibraryPrompt(ctx as any, "invalid_id");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        expect.stringContaining("Prompt tidak ditemukan"),
      );
    });

    it("should handle missing user", async () => {
      ctx.from = undefined as any;

      await saveLibraryPrompt(ctx as any, "fnb_1");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(expect.stringContaining("❌"));
    });

    it("should handle user not found in database", async () => {
      UserService.findByTelegramId.mockResolvedValue(null);

      await saveLibraryPrompt(ctx as any, "fnb_1");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(expect.stringContaining("❌"));
    });

    it("should save prompt successfully", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        id: BigInt(1),
      });
      SavedPromptService.count.mockResolvedValue(5);

      await saveLibraryPrompt(ctx as any, "fnb_1");

      expect(SavedPromptService.save).toHaveBeenCalled();
      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        expect.stringContaining("tersimpan"),
      );
    });

    it("should reject when max prompts reached", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        id: BigInt(1),
      });
      SavedPromptService.count.mockResolvedValue(20);

      await saveLibraryPrompt(ctx as any, "fnb_1");

      expect(SavedPromptService.save).not.toHaveBeenCalled();
      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        expect.stringContaining("Max 20 prompt"),
      );
    });

    it("should handle errors gracefully", async () => {
      UserService.findByTelegramId.mockRejectedValue(
        new Error("Database error"),
      );

      await saveLibraryPrompt(ctx as any, "fnb_1");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "❌ Gagal menyimpan. Coba lagi.",
      );
    });
  });

  describe("showMyPrompts", () => {
    it("should handle missing user", async () => {
      ctx.from = undefined as any;

      await showMyPrompts(ctx as any, "fnb");

      expect(ctx.reply).not.toHaveBeenCalled();
    });

    it("should handle user not found in database", async () => {
      UserService.findByTelegramId.mockResolvedValue(null);

      await showMyPrompts(ctx as any, "fnb");

      expect(ctx.reply).not.toHaveBeenCalled();
    });

    it("should show empty state when no saved prompts", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        id: BigInt(1),
      });
      SavedPromptService.getByUser.mockResolvedValue([]);

      await showMyPrompts(ctx as any, "fnb");

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Belum ada prompt tersimpan");
    });

    it("should show saved prompts", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        id: BigInt(1),
      });
      SavedPromptService.getByUser.mockResolvedValue([mockSavedPrompt]);

      await showMyPrompts(ctx as any, "fnb");

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Test Prompt");
    });

    it("should edit message when edit flag is true", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        id: BigInt(1),
      });
      SavedPromptService.getByUser.mockResolvedValue([]);

      await showMyPrompts(ctx as any, "fnb", true);

      expect(ctx.editMessageText).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      UserService.findByTelegramId.mockRejectedValue(
        new Error("Database error"),
      );

      await showMyPrompts(ctx as any, "fnb");

      expect(ctx.reply).toHaveBeenCalledWith("❌ Gagal load prompt tersimpan.");
    });
  });

  describe("startAddCustomPrompt", () => {
    it("should show custom prompt creation message", async () => {
      await startAddCustomPrompt(ctx as any, "fnb");

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Tambah Custom Prompt");
    });

    it("should set session state to CUSTOM_PROMPT_CREATION", async () => {
      await startAddCustomPrompt(ctx as any, "fnb");

      expect(ctx.session?.state).toBe("CUSTOM_PROMPT_CREATION");
    });

    it("should save niche to session", async () => {
      await startAddCustomPrompt(ctx as any, "fnb");

      expect(ctx.session?.stateData?.addingPromptNiche).toBe("fnb");
    });

    it("should edit message when edit flag is true", async () => {
      (ctx as any).editMessageText = jest.fn<() => Promise<unknown>>().mockResolvedValue({});

      await startAddCustomPrompt(ctx as any, "fnb", true);

      expect(ctx.editMessageText).toHaveBeenCalled();
    });
  });
});
