"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const prompts_1 = require("@/commands/prompts");
const fixtures_1 = require("../../fixtures");
globals_1.jest.mock("@/services/user.service", () => ({
    UserService: {
        findByTelegramId: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/services/saved-prompt.service", () => ({
    SavedPromptService: {
        getByUser: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
        save: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/config/database", () => ({
    prisma: {
        savedPrompt: {
            findMany: globals_1.jest.fn(),
        },
    },
}));
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)("Prompts Command", () => {
    let ctx;
    let UserService;
    let SavedPromptService;
    let prisma;
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
        UserService = require("@/services/user.service").UserService;
        SavedPromptService =
            require("@/services/saved-prompt.service").SavedPromptService;
        prisma = require("@/config/database").prisma;
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("PROMPT_LIBRARY", () => {
        (0, globals_1.it)("should have all required niches", () => {
            (0, globals_1.expect)(prompts_1.PROMPT_LIBRARY).toHaveProperty("fnb");
            (0, globals_1.expect)(prompts_1.PROMPT_LIBRARY).toHaveProperty("fashion");
            (0, globals_1.expect)(prompts_1.PROMPT_LIBRARY).toHaveProperty("tech");
            (0, globals_1.expect)(prompts_1.PROMPT_LIBRARY).toHaveProperty("health");
            (0, globals_1.expect)(prompts_1.PROMPT_LIBRARY).toHaveProperty("travel");
            (0, globals_1.expect)(prompts_1.PROMPT_LIBRARY).toHaveProperty("education");
            (0, globals_1.expect)(prompts_1.PROMPT_LIBRARY).toHaveProperty("finance");
            (0, globals_1.expect)(prompts_1.PROMPT_LIBRARY).toHaveProperty("entertainment");
        });
        (0, globals_1.it)("should have 5 prompts per niche", () => {
            Object.keys(prompts_1.PROMPT_LIBRARY).forEach((niche) => {
                (0, globals_1.expect)(prompts_1.PROMPT_LIBRARY[niche].prompts.length).toBe(5);
            });
        });
        (0, globals_1.it)("should have required prompt properties", () => {
            Object.keys(prompts_1.PROMPT_LIBRARY).forEach((niche) => {
                prompts_1.PROMPT_LIBRARY[niche].prompts.forEach((prompt) => {
                    (0, globals_1.expect)(prompt).toHaveProperty("id");
                    (0, globals_1.expect)(prompt).toHaveProperty("title");
                    (0, globals_1.expect)(prompt).toHaveProperty("prompt");
                    (0, globals_1.expect)(prompt).toHaveProperty("suitable");
                    (0, globals_1.expect)(prompt).toHaveProperty("successRate");
                });
            });
        });
    });
    (0, globals_1.describe)("TRENDING_PROMPTS", () => {
        (0, globals_1.it)("should have trending prompts", () => {
            (0, globals_1.expect)(prompts_1.TRENDING_PROMPTS.length).toBeGreaterThan(0);
        });
        (0, globals_1.it)("should have required properties", () => {
            prompts_1.TRENDING_PROMPTS.forEach((t) => {
                (0, globals_1.expect)(t).toHaveProperty("niche");
                (0, globals_1.expect)(t).toHaveProperty("promptId");
                (0, globals_1.expect)(t).toHaveProperty("usageChange");
            });
        });
    });
    (0, globals_1.describe)("getPromptById", () => {
        (0, globals_1.it)("should return prompt for valid ID", () => {
            const prompt = (0, prompts_1.getPromptById)("fnb_1");
            (0, globals_1.expect)(prompt).toBeDefined();
            (0, globals_1.expect)(prompt?.id).toBe("fnb_1");
            (0, globals_1.expect)(prompt?.niche).toBe("fnb");
        });
        (0, globals_1.it)("should return null for invalid ID", () => {
            const prompt = (0, prompts_1.getPromptById)("invalid_id");
            (0, globals_1.expect)(prompt).toBeNull();
        });
    });
    (0, globals_1.describe)("promptsCommand", () => {
        (0, globals_1.it)("should show prompt library menu", async () => {
            ctx.message = { text: "/prompts", message_id: 1 };
            await (0, prompts_1.promptsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("PROMPT LIBRARY");
            (0, globals_1.expect)(replyCall[0]).toContain("40+ Template");
        });
        (0, globals_1.it)("should show all niche buttons", async () => {
            ctx.message = { text: "/prompts", message_id: 1 };
            await (0, prompts_1.promptsCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            const allButtons = keyboard.flat();
            (0, globals_1.expect)(allButtons.some((btn) => btn.callback_data === "prompts_fnb")).toBe(true);
            (0, globals_1.expect)(allButtons.some((btn) => btn.callback_data === "prompts_fashion")).toBe(true);
            (0, globals_1.expect)(allButtons.some((btn) => btn.callback_data === "prompts_tech")).toBe(true);
            (0, globals_1.expect)(allButtons.some((btn) => btn.callback_data === "prompts_health")).toBe(true);
        });
        (0, globals_1.it)("should show niche prompts when niche argument provided", async () => {
            ctx.message = { text: "/prompts fnb", message_id: 1 };
            prisma.savedPrompt.findMany.mockResolvedValue([]);
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, prompts_1.promptsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("F&B");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            ctx.message = { text: "/prompts", message_id: 1 };
            ctx.reply.mockRejectedValue(new Error("Reply error"));
            await (0, globals_1.expect)((0, prompts_1.promptsCommand)(ctx)).rejects.toThrow();
        });
    });
    (0, globals_1.describe)("showNichePrompts", () => {
        (0, globals_1.it)("should show prompts for valid niche", async () => {
            prisma.savedPrompt.findMany.mockResolvedValue([]);
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, prompts_1.showNichePrompts)(ctx, "fnb");
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("F&B");
            (0, globals_1.expect)(replyCall[0]).toContain("PROMPT TEMPLATES");
        });
        (0, globals_1.it)("should show error for invalid niche", async () => {
            await (0, prompts_1.showNichePrompts)(ctx, "invalid_niche");
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Niche tidak ditemukan.");
        });
        (0, globals_1.it)("should show admin prompts when available", async () => {
            prisma.savedPrompt.findMany.mockResolvedValue([
                { id: 1, title: "Admin Prompt", prompt: "Test prompt", niche: "fnb" },
            ]);
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, prompts_1.showNichePrompts)(ctx, "fnb");
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Dari Admin");
        });
        (0, globals_1.it)("should show saved prompts when available", async () => {
            prisma.savedPrompt.findMany.mockResolvedValue([]);
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                id: BigInt(1),
            });
            SavedPromptService.getByUser.mockResolvedValue([fixtures_1.mockSavedPrompt]);
            await (0, prompts_1.showNichePrompts)(ctx, "fnb");
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("PROMPT TEMPLATES");
        });
        (0, globals_1.it)("should edit message when edit flag is true", async () => {
            prisma.savedPrompt.findMany.mockResolvedValue([]);
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, prompts_1.showNichePrompts)(ctx, "fnb", true);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)("showPromptDetail", () => {
        (0, globals_1.it)("should show prompt details", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
            });
            await (0, prompts_1.showPromptDetail)(ctx, "fnb_1");
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Prompt Aktif");
            (0, globals_1.expect)(replyCall[0]).toContain("Steam & Zoom Drama");
        });
        (0, globals_1.it)("should show error for invalid prompt ID", async () => {
            await (0, prompts_1.showPromptDetail)(ctx, "invalid_id");
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Prompt tidak ditemukan.");
        });
        (0, globals_1.it)("should save prompt to session", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
            });
            await (0, prompts_1.showPromptDetail)(ctx, "fnb_1");
            (0, globals_1.expect)(ctx.session?.stateData?.selectedPrompt).toBeDefined();
        });
        (0, globals_1.it)("should edit message when edit flag is true", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
            });
            await (0, prompts_1.showPromptDetail)(ctx, "fnb_1", true);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)("showCustomizePrompt", () => {
        (0, globals_1.it)("should show customize options", async () => {
            await (0, prompts_1.showCustomizePrompt)(ctx, "fnb_1");
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("PROMPT CUSTOMIZER");
        });
        (0, globals_1.it)("should set session state to CUSTOMIZING_PROMPT", async () => {
            await (0, prompts_1.showCustomizePrompt)(ctx, "fnb_1");
            (0, globals_1.expect)(ctx.session?.state).toBe("CUSTOMIZING_PROMPT");
        });
        (0, globals_1.it)("should edit message when edit flag is true", async () => {
            await (0, prompts_1.showCustomizePrompt)(ctx, "fnb_1", true);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)("dailyCommand", () => {
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            await (0, prompts_1.dailyCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("Unable to identify user.");
        });
        (0, globals_1.it)("should show daily prompt", async () => {
            await (0, prompts_1.dailyCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("MYSTERY PROMPT BOX");
        });
        (0, globals_1.it)("should save prompt to session", async () => {
            await (0, prompts_1.dailyCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.selectedPrompt).toBeDefined();
        });
        (0, globals_1.it)("should show action buttons", async () => {
            await (0, prompts_1.dailyCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            (0, globals_1.expect)(keyboard[0][0].callback_data).toContain("use_prompt_");
            (0, globals_1.expect)(keyboard[0][1].callback_data).toContain("daily_save_");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            ctx.reply.mockRejectedValue(new Error("Reply error"));
            await (0, globals_1.expect)((0, prompts_1.dailyCommand)(ctx)).rejects.toThrow();
        });
    });
    (0, globals_1.describe)("trendingCommand", () => {
        (0, globals_1.it)("should show trending prompts", async () => {
            await (0, prompts_1.trendingCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("TRENDING PROMPTS");
        });
        (0, globals_1.it)("should show all trending prompts", async () => {
            await (0, prompts_1.trendingCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            prompts_1.TRENDING_PROMPTS.forEach((t, i) => {
                (0, globals_1.expect)(replyCall[0]).toContain(`#${i + 1}`);
            });
        });
        (0, globals_1.it)("should show action buttons for each prompt", async () => {
            await (0, prompts_1.trendingCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            const promptButtons = keyboard.filter((row) => row.some((btn) => btn.callback_data?.startsWith("use_prompt_")));
            (0, globals_1.expect)(promptButtons.length).toBe(prompts_1.TRENDING_PROMPTS.length);
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            ctx.reply.mockRejectedValue(new Error("Reply error"));
            await (0, globals_1.expect)((0, prompts_1.trendingCommand)(ctx)).rejects.toThrow();
        });
    });
    (0, globals_1.describe)("fingerprintCommand", () => {
        (0, globals_1.it)("should show fingerprint analysis", async () => {
            await (0, prompts_1.fingerprintCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("YOUR PROMPT FINGERPRINT");
        });
        (0, globals_1.it)("should show style preferences", async () => {
            await (0, prompts_1.fingerprintCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Top Styles");
            (0, globals_1.expect)(replyCall[0]).toContain("Preferred Lighting");
            (0, globals_1.expect)(replyCall[0]).toContain("Favorite Moods");
        });
        (0, globals_1.it)("should show recommendations", async () => {
            await (0, prompts_1.fingerprintCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("RECOMMENDED FOR YOU");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            ctx.reply.mockRejectedValue(new Error("Reply error"));
            await (0, globals_1.expect)((0, prompts_1.fingerprintCommand)(ctx)).rejects.toThrow();
        });
    });
    (0, globals_1.describe)("saveLibraryPrompt", () => {
        (0, globals_1.it)("should handle invalid prompt ID", async () => {
            await (0, prompts_1.saveLibraryPrompt)(ctx, "invalid_id");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Prompt tidak ditemukan");
        });
        (0, globals_1.it)("should handle missing user", async () => {
            ctx.from = undefined;
            await (0, prompts_1.saveLibraryPrompt)(ctx, "fnb_1");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("❌ User not found");
        });
        (0, globals_1.it)("should handle user not found in database", async () => {
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, prompts_1.saveLibraryPrompt)(ctx, "fnb_1");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("❌ User not found");
        });
        (0, globals_1.it)("should save prompt successfully", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                id: BigInt(1),
            });
            SavedPromptService.count.mockResolvedValue(5);
            await (0, prompts_1.saveLibraryPrompt)(ctx, "fnb_1");
            (0, globals_1.expect)(SavedPromptService.save).toHaveBeenCalled();
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith(globals_1.expect.stringContaining("tersimpan"));
        });
        (0, globals_1.it)("should reject when max prompts reached", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                id: BigInt(1),
            });
            SavedPromptService.count.mockResolvedValue(20);
            await (0, prompts_1.saveLibraryPrompt)(ctx, "fnb_1");
            (0, globals_1.expect)(SavedPromptService.save).not.toHaveBeenCalled();
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith(globals_1.expect.stringContaining("Max 20 prompt"));
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, prompts_1.saveLibraryPrompt)(ctx, "fnb_1");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Gagal menyimpan. Coba lagi.");
        });
    });
    (0, globals_1.describe)("showMyPrompts", () => {
        (0, globals_1.it)("should handle missing user", async () => {
            ctx.from = undefined;
            await (0, prompts_1.showMyPrompts)(ctx, "fnb");
            (0, globals_1.expect)(ctx.reply).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle user not found in database", async () => {
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, prompts_1.showMyPrompts)(ctx, "fnb");
            (0, globals_1.expect)(ctx.reply).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should show empty state when no saved prompts", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                id: BigInt(1),
            });
            SavedPromptService.getByUser.mockResolvedValue([]);
            await (0, prompts_1.showMyPrompts)(ctx, "fnb");
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Belum ada prompt tersimpan");
        });
        (0, globals_1.it)("should show saved prompts", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                id: BigInt(1),
            });
            SavedPromptService.getByUser.mockResolvedValue([fixtures_1.mockSavedPrompt]);
            await (0, prompts_1.showMyPrompts)(ctx, "fnb");
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Test Prompt");
        });
        (0, globals_1.it)("should edit message when edit flag is true", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                id: BigInt(1),
            });
            SavedPromptService.getByUser.mockResolvedValue([]);
            await (0, prompts_1.showMyPrompts)(ctx, "fnb", true);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, prompts_1.showMyPrompts)(ctx, "fnb");
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Gagal load prompt tersimpan.");
        });
    });
    (0, globals_1.describe)("startAddCustomPrompt", () => {
        (0, globals_1.it)("should show custom prompt creation message", async () => {
            await (0, prompts_1.startAddCustomPrompt)(ctx, "fnb");
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Tambah Custom Prompt");
        });
        (0, globals_1.it)("should set session state to CUSTOM_PROMPT_CREATION", async () => {
            await (0, prompts_1.startAddCustomPrompt)(ctx, "fnb");
            (0, globals_1.expect)(ctx.session?.state).toBe("CUSTOM_PROMPT_CREATION");
        });
        (0, globals_1.it)("should save niche to session", async () => {
            await (0, prompts_1.startAddCustomPrompt)(ctx, "fnb");
            (0, globals_1.expect)(ctx.session?.stateData?.addingPromptNiche).toBe("fnb");
        });
        (0, globals_1.it)("should edit message when edit flag is true", async () => {
            ctx.editMessageText = globals_1.jest.fn().mockResolvedValue({});
            await (0, prompts_1.startAddCustomPrompt)(ctx, "fnb", true);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=prompts.test.js.map