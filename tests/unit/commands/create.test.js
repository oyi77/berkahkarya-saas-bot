"use strict";
/**
 * Create Command Unit Tests
 *
 * Tests for /create command handler and related functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const create_1 = require("@/commands/create");
const fixtures_1 = require("../../fixtures");
globals_1.jest.mock("@/services/user.service", () => ({
    UserService: {
        findByTelegramId: globals_1.jest.fn(),
        canGenerate: globals_1.jest.fn(),
        create: globals_1.jest.fn(),
        refundCredits: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/services/video.service", () => ({
    VideoService: {
        updateStatus: globals_1.jest.fn(),
        setOutput: globals_1.jest.fn(),
        getByJobId: globals_1.jest.fn(),
        updateProgress: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/services/geminigen.service", () => ({
    GeminiGenService: {
        generateExtend: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/services/video-fallback.service", () => ({
    generateVideoWithFallback: globals_1.jest.fn(),
}));
globals_1.jest.mock("@/services/video-generation.service", () => ({
    NICHES: {
        fnb: {
            name: "Food & Beverage",
            emoji: "🍕",
            styles: ["appetizing", "cinematic", "viral"],
        },
        beauty: {
            name: "Beauty",
            emoji: "💄",
            styles: ["glam", "natural", "editorial"],
        },
        tech: {
            name: "Technology",
            emoji: "💻",
            styles: ["modern", "minimalist", "futuristic"],
        },
    },
    generateStoryboard: globals_1.jest.fn(() => [
        { scene: 1, duration: 5, description: "Scene 1 description" },
        { scene: 2, duration: 5, description: "Scene 2 description" },
    ]),
}));
globals_1.jest.mock("@/services/postautomation.service", () => ({
    PostAutomationService: {
        hasConnectedAccounts: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/services/scene-consistency.service", () => ({
    SceneConsistencyEngine: {
        createMemory: globals_1.jest.fn(),
        enrichScenePrompt: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/config/pricing", () => ({
    getVideoCreditCost: globals_1.jest.fn((duration) => {
        const costs = {
            15: 0.5,
            30: 1.0,
            60: 2.0,
            120: 4.0,
        };
        return costs[duration] || Math.ceil(duration / 5) * (2.0 / 12);
    }),
    SUBSCRIPTION_PLANS: {
        lite: { monthlyCredits: 20 },
        agency: { monthlyCredits: 150 },
    },
}));
globals_1.jest.mock("@/config/audio-subtitle-engine", () => ({
    MARKETING_HOOKS: ["Check this out!", "You won't believe this!"],
    MARKETING_CTAS: ["Follow for more!", "Like and share!"],
}));
globals_1.jest.mock("@/utils/errors", () => ({
    actionableError: globals_1.jest.fn((error) => error),
}));
globals_1.jest.mock("@/i18n/translations", () => ({
    t: globals_1.jest.fn((key, lang, params) => {
        const translations = {
            "error.identify_user": "❌ Unable to identify user",
            "error.user_not_found": "❌ User not found",
            "error.insufficient_credits": "❌ Insufficient credits",
            "error.insufficient_credits_detail": "Balance: {balance}, Min: {min}",
            "error.generic": "❌ Something went wrong",
            "menu.top_up": "💳 Top Up",
            "menu.subscribe": "📦 Subscribe",
            "create.title": "🎬 Create Video",
            "create.current_credits": "Credits",
            "create.select_niche": "Select a niche:",
            "create.daily_limit_reached": "Daily limit reached: {used}/{limit}",
            "create.need_credits": "Need credits?",
            "create.niche_selected": "selected!",
            "create.select_style": "Select a style:",
            "create.change_category": "◀️ Change Category",
            "create.style_selected": "Style selected!",
            "create.select_platform": "Select platform:",
            "create.platform_tiktok": "📱 TikTok",
            "create.platform_youtube": "▶️ YouTube",
            "create.platform_instagram": "📸 Instagram",
            "create.platform_square": "⬜ Square",
            "create.change_style": "◀️ Change Style",
            "create.platform_selected": "Platform selected!",
            "create.extend_mode": "Extend mode available",
            "create.select_duration": "Select duration:",
            "create.duration_quick": "⚡ 15s",
            "create.duration_standard": "🎬 30s",
            "create.duration_long": "📽️ 60s",
            "create.duration_extended": "🎞️ 120s",
            "create.custom_duration": "✏️ Custom",
            "create.custom_duration_prompt": "Enter custom duration:",
            "create.almost_ready": "Almost ready!",
            "create.niche_label": "Niche",
            "create.duration_label": "Duration",
            "create.credit_cost_label": "Cost",
            "create.scenes": "scenes",
            "create.scene": "scene",
            "create.send_reference_image": "Send reference image:",
        };
        let result = translations[key] || key;
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                result = result.replace(`{${k}}`, String(v));
            });
        }
        return result;
    }),
}));
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("util", () => ({
    promisify: globals_1.jest.fn(() => globals_1.jest.fn()),
}));
globals_1.jest.mock("child_process", () => ({
    exec: globals_1.jest.fn(),
}));
globals_1.jest.mock("fs", () => ({
    existsSync: globals_1.jest.fn(() => true),
    mkdirSync: globals_1.jest.fn(),
    writeFileSync: globals_1.jest.fn(),
}));
(0, globals_1.describe)("Create Command", () => {
    let ctx;
    let UserService;
    let VideoService;
    let generateVideoWithFallback;
    let generateStoryboard;
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
        VideoService = require("@/services/video.service").VideoService;
        generateVideoWithFallback =
            require("@/services/video-fallback.service").generateVideoWithFallback;
        generateStoryboard =
            require("@/services/video-generation.service").generateStoryboard;
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("createCommand", () => {
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            await (0, create_1.createCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Unable to identify user");
        });
        (0, globals_1.it)("should handle user not found in database", async () => {
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, create_1.createCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ User not found");
        });
        (0, globals_1.it)("should show insufficient credits message when balance < 0.5", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 0.3,
                language: "id",
            });
            await (0, create_1.createCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[1].reply_markup.inline_keyboard).toEqual(globals_1.expect.arrayContaining([
                globals_1.expect.arrayContaining([
                    globals_1.expect.objectContaining({ callback_data: "topup" }),
                ]),
            ]));
        });
        (0, globals_1.it)("should show daily limit message when generation not allowed", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
                language: "id",
            });
            UserService.canGenerate.mockResolvedValue({
                allowed: false,
                used: 3,
                limit: 3,
            });
            await (0, create_1.createCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[1].reply_markup.inline_keyboard[0][0].callback_data).toBe("open_subscription");
        });
        (0, globals_1.it)("should show duration picker when prompt is preselected", async () => {
            ctx.session.stateData = { selectedPrompt: "Test prompt for video" };
            ctx.session.selectedNiche = "fnb";
            ctx.session.selectedStyles = ["appetizing"];
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
                language: "id",
            });
            UserService.canGenerate.mockResolvedValue({ allowed: true });
            await (0, create_1.createCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Prompt aktif");
            (0, globals_1.expect)(replyCall[1].reply_markup.inline_keyboard[0][0].callback_data).toBe("duration_15_1");
        });
        (0, globals_1.it)("should truncate long preselected prompts", async () => {
            const longPrompt = "A".repeat(150);
            ctx.session.stateData = { selectedPrompt: longPrompt };
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
                language: "id",
            });
            UserService.canGenerate.mockResolvedValue({ allowed: true });
            await (0, create_1.createCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("...");
        });
        (0, globals_1.it)("should show niche picker for normal flow", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
                language: "id",
            });
            UserService.canGenerate.mockResolvedValue({ allowed: true });
            await (0, create_1.createCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Create Video");
            (0, globals_1.expect)(replyCall[1].reply_markup.inline_keyboard.length).toBeGreaterThan(0);
        });
        (0, globals_1.it)("should use default language when user has no language set", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
                language: null,
            });
            UserService.canGenerate.mockResolvedValue({ allowed: true });
            await (0, create_1.createCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle database errors gracefully", async () => {
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, create_1.createCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Something went wrong");
        });
    });
    (0, globals_1.describe)("handleDurationSelection", () => {
        (0, globals_1.it)("should handle missing session", async () => {
            ctx.session = undefined;
            await (0, create_1.handleDurationSelection)(ctx, "duration_15_1");
            (0, globals_1.expect)(ctx.editMessageText).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle custom duration input", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                language: "id",
            });
            await (0, create_1.handleDurationSelection)(ctx, "custom_duration");
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            (0, globals_1.expect)(ctx.session?.state).toBe("CUSTOM_DURATION_INPUT");
        });
        (0, globals_1.it)("should parse duration and scenes correctly", async () => {
            ctx.from.id = 123456789;
            ctx.session.selectedNiche = "fnb";
            ctx.session.selectedStyles = ["appetizing"];
            ctx.session.stateData = { selectedPlatform: "tiktok" };
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
                language: "id",
            });
            await (0, create_1.handleDurationSelection)(ctx, "duration_30_2");
            (0, globals_1.expect)(ctx.session?.videoCreation).toBeDefined();
            (0, globals_1.expect)(ctx.session?.videoCreation?.totalDuration).toBe(30);
            (0, globals_1.expect)(ctx.session?.videoCreation?.scenes).toBe(2);
        });
        (0, globals_1.it)("should auto-calculate scenes when not provided", async () => {
            ctx.from.id = 123456789;
            ctx.session.selectedNiche = "fnb";
            ctx.session.selectedStyles = ["appetizing"];
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
                language: "id",
            });
            await (0, create_1.handleDurationSelection)(ctx, "duration_30");
            (0, globals_1.expect)(ctx.session?.videoCreation?.scenes).toBe(6);
        });
        (0, globals_1.it)("should reject invalid duration (< 6 seconds)", async () => {
            ctx.from.id = 123456789;
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
                language: "id",
            });
            await (0, create_1.handleDurationSelection)(ctx, "duration_5_1");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Duration must be 6-300 seconds");
        });
        (0, globals_1.it)("should reject invalid duration (> 300 seconds)", async () => {
            ctx.from.id = 123456789;
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
                language: "id",
            });
            await (0, create_1.handleDurationSelection)(ctx, "duration_301_60");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Duration must be 6-300 seconds");
        });
        (0, globals_1.it)("should create user if not exists", async () => {
            ctx.from.id = 123456789;
            ctx.session.selectedNiche = "fnb";
            ctx.session.selectedStyles = ["appetizing"];
            UserService.findByTelegramId.mockResolvedValue(null);
            UserService.create.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 3,
            });
            await (0, create_1.handleDurationSelection)(ctx, "duration_15_1");
            (0, globals_1.expect)(UserService.create).toHaveBeenCalled();
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith(globals_1.expect.stringContaining("Welcome"));
        });
        (0, globals_1.it)("should show insufficient credits message", async () => {
            ctx.from.id = 123456789;
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 0.1,
                language: "id",
            });
            await (0, create_1.handleDurationSelection)(ctx, "duration_30_2");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Insufficient credits");
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle missing user", async () => {
            ctx.from = undefined;
            ctx.session = {
                state: "DASHBOARD",
                lastActivity: new Date(),
                stateData: {},
            };
            await (0, create_1.handleDurationSelection)(ctx, "duration_15_1");
            (0, globals_1.expect)(ctx.editMessageText).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, create_1.handleDurationSelection)(ctx, "duration_15_1");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Error. Please try again.");
        });
    });
    (0, globals_1.describe)("handleNicheSelection", () => {
        (0, globals_1.it)("should handle missing session", async () => {
            ctx.session = undefined;
            await (0, create_1.handleNicheSelection)(ctx, "fnb");
            (0, globals_1.expect)(ctx.editMessageText).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle invalid niche", async () => {
            await (0, create_1.handleNicheSelection)(ctx, "invalid_niche");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Invalid niche");
        });
        (0, globals_1.it)("should show style picker for valid niche", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                language: "id",
            });
            await (0, create_1.handleNicheSelection)(ctx, "fnb");
            (0, globals_1.expect)(ctx.session?.selectedNiche).toBe("fnb");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[1].reply_markup.inline_keyboard.length).toBeGreaterThan(0);
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, create_1.handleNicheSelection)(ctx, "fnb");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Error. Please try again.");
        });
    });
    (0, globals_1.describe)("handleStyleSelection", () => {
        (0, globals_1.it)("should handle missing session", async () => {
            ctx.session = undefined;
            await (0, create_1.handleStyleSelection)(ctx, "appetizing");
            (0, globals_1.expect)(ctx.editMessageText).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should show platform picker after style selection", async () => {
            ctx.session.selectedNiche = "fnb";
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                language: "id",
            });
            await (0, create_1.handleStyleSelection)(ctx, "appetizing");
            (0, globals_1.expect)(ctx.session?.selectedStyles).toEqual(["appetizing"]);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("platform");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, create_1.handleStyleSelection)(ctx, "appetizing");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Error. Please try again.");
        });
    });
    (0, globals_1.describe)("handlePlatformSelection", () => {
        (0, globals_1.it)("should handle missing session", async () => {
            ctx.session = undefined;
            await (0, create_1.handlePlatformSelection)(ctx, "tiktok");
            (0, globals_1.expect)(ctx.editMessageText).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should show duration picker after platform selection", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                language: "id",
            });
            await (0, create_1.handlePlatformSelection)(ctx, "tiktok");
            (0, globals_1.expect)(ctx.session?.stateData?.selectedPlatform).toBe("tiktok");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("9:16");
        });
        (0, globals_1.it)("should handle youtube platform", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                language: "id",
            });
            await (0, create_1.handlePlatformSelection)(ctx, "youtube");
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("16:9");
        });
        (0, globals_1.it)("should handle instagram platform", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                language: "id",
            });
            await (0, create_1.handlePlatformSelection)(ctx, "instagram");
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("4:5");
        });
        (0, globals_1.it)("should handle square platform", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                language: "id",
            });
            await (0, create_1.handlePlatformSelection)(ctx, "square");
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("1:1");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, create_1.handlePlatformSelection)(ctx, "tiktok");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Error. Please try again.");
        });
    });
    (0, globals_1.describe)("handleVOToggle", () => {
        (0, globals_1.it)("should handle missing video creation session", async () => {
            ctx.session.videoCreation = undefined;
            await (0, create_1.handleVOToggle)(ctx, "vo");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("No active video creation");
        });
        (0, globals_1.it)("should toggle VO setting", async () => {
            ctx.session.videoCreation = {
                enableVO: true,
                enableSubtitles: true,
                niche: "fnb",
                totalDuration: 30,
                scenes: 2,
            };
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                language: "id",
            });
            await (0, create_1.handleVOToggle)(ctx, "vo");
            (0, globals_1.expect)(ctx.session?.videoCreation?.enableVO).toBe(false);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
        });
        (0, globals_1.it)("should toggle subtitles setting", async () => {
            ctx.session.videoCreation = {
                enableVO: true,
                enableSubtitles: true,
                niche: "fnb",
                totalDuration: 30,
                scenes: 2,
            };
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                language: "id",
            });
            await (0, create_1.handleVOToggle)(ctx, "subtitles");
            (0, globals_1.expect)(ctx.session?.videoCreation?.enableSubtitles).toBe(false);
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            ctx.session.videoCreation = {
                enableVO: true,
                enableSubtitles: true,
                niche: "fnb",
                totalDuration: 30,
                scenes: 2,
            };
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, create_1.handleVOToggle)(ctx, "vo");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Error. Please try again.");
        });
    });
    (0, globals_1.describe)("handleVOContinue", () => {
        (0, globals_1.it)("should handle missing video creation session", async () => {
            ctx.session.videoCreation = undefined;
            await (0, create_1.handleVOContinue)(ctx);
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("No active video creation");
        });
        (0, globals_1.it)("should skip to generate when custom prompt exists", async () => {
            ctx.session.videoCreation = {
                customPrompt: "Test custom prompt",
                totalDuration: 30,
                enableVO: true,
                enableSubtitles: true,
            };
            await (0, create_1.handleVOContinue)(ctx);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("Siap generate");
        });
        (0, globals_1.it)("should show VO settings for normal flow", async () => {
            ctx.session.videoCreation = {
                enableVO: true,
                enableSubtitles: true,
                totalDuration: 30,
            };
            await (0, create_1.handleVOContinue)(ctx);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("Pengaturan Suara");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            ctx.session.videoCreation = {
                enableVO: true,
                enableSubtitles: true,
            };
            ctx.editMessageText.mockRejectedValue(new Error("Edit error"));
            await (0, create_1.handleVOContinue)(ctx);
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Error. Please try again.");
        });
    });
    (0, globals_1.describe)("handleCustomPromptRequest", () => {
        (0, globals_1.it)("should handle missing video creation session", async () => {
            ctx.session.videoCreation = undefined;
            await (0, create_1.handleCustomPromptRequest)(ctx);
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("No active video creation");
        });
        (0, globals_1.it)("should set waiting for custom prompt state", async () => {
            ctx.session.videoCreation = {
                enableVO: true,
                enableSubtitles: true,
            };
            await (0, create_1.handleCustomPromptRequest)(ctx);
            (0, globals_1.expect)(ctx.session?.videoCreation?.waitingForCustomPrompt).toBe(true);
            (0, globals_1.expect)(ctx.session?.state).toBe("CUSTOM_PROMPT_INPUT");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            ctx.session.videoCreation = {
                enableVO: true,
                enableSubtitles: true,
            };
            ctx.editMessageText.mockRejectedValue(new Error("Edit error"));
            await (0, create_1.handleCustomPromptRequest)(ctx);
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Error. Please try again.");
        });
    });
    (0, globals_1.describe)("handleSkipPrompt", () => {
        (0, globals_1.it)("should handle missing video creation session", async () => {
            ctx.session.videoCreation = undefined;
            await (0, create_1.handleSkipPrompt)(ctx);
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("No active video creation");
        });
        (0, globals_1.it)("should set waiting for image state", async () => {
            ctx.session.videoCreation = {
                enableVO: true,
                enableSubtitles: true,
            };
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                language: "id",
            });
            await (0, create_1.handleSkipPrompt)(ctx);
            (0, globals_1.expect)(ctx.session?.videoCreation?.waitingForImage).toBe(true);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            ctx.session.videoCreation = {
                enableVO: true,
                enableSubtitles: true,
            };
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, create_1.handleSkipPrompt)(ctx);
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("Error. Please try again.");
        });
    });
    (0, globals_1.describe)("generateCaption", () => {
        (0, globals_1.it)("should generate caption with hashtags", () => {
            const storyboard = [
                { scene: 1, duration: 5, description: "Delicious food shot" },
                { scene: 2, duration: 5, description: "Close up of ingredients" },
            ];
            const result = (0, create_1.generateCaption)("fnb", storyboard, "tiktok");
            (0, globals_1.expect)(result.text).toBeDefined();
            (0, globals_1.expect)(result.hashtags).toBeDefined();
            (0, globals_1.expect)(result.hashtags).toContain("#");
        });
        (0, globals_1.it)("should use correct hashtag count for platform", () => {
            const storyboard = [{ scene: 1, duration: 5, description: "Test scene" }];
            const tiktokCaption = (0, create_1.generateCaption)("fnb", storyboard, "tiktok");
            const youtubeCaption = (0, create_1.generateCaption)("fnb", storyboard, "youtube");
            const tiktokTags = tiktokCaption.hashtags.split(" ").length;
            const youtubeTags = youtubeCaption.hashtags.split(" ").length;
            (0, globals_1.expect)(tiktokTags).toBeGreaterThan(youtubeTags);
        });
        (0, globals_1.it)("should handle empty storyboard", () => {
            const result = (0, create_1.generateCaption)("fnb", [], "tiktok");
            (0, globals_1.expect)(result.text).toBeDefined();
            (0, globals_1.expect)(result.hashtags).toBeDefined();
        });
        (0, globals_1.it)("should handle unknown niche", () => {
            const storyboard = [{ scene: 1, duration: 5, description: "Test scene" }];
            const result = (0, create_1.generateCaption)("unknown_niche", storyboard, "tiktok");
            (0, globals_1.expect)(result.hashtags).toContain("#viral");
            (0, globals_1.expect)(result.hashtags).toContain("#fyp");
        });
        (0, globals_1.it)("should include niche-specific hashtags", () => {
            const storyboard = [{ scene: 1, duration: 5, description: "Test scene" }];
            const result = (0, create_1.generateCaption)("fnb", storyboard, "tiktok");
            (0, globals_1.expect)(result.hashtags).toMatch(/#food|#kuliner|#makananenak/);
        });
    });
});
//# sourceMappingURL=create.test.js.map