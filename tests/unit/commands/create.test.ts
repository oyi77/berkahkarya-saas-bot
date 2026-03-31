/**
 * Create Command Unit Tests
 *
 * Tests for /create command handler and related functions
 */

jest.mock("@/flows/generate", () => ({
  showGenerateMode: jest.fn().mockResolvedValue(undefined),
}));

import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import {
  createCommand,
  handleDurationSelection,
  handleNicheSelection,
  handleStyleSelection,
  handlePlatformSelection,
  handleVOToggle,
  handleVOContinue,
  handleCustomPromptRequest,
  handleSkipPrompt,
  generateCaption,
} from "@/commands/create";
import { createMockContext, mockUser, mockPremiumUser } from "../../fixtures";

jest.mock("@/services/user.service", () => ({
  UserService: {
    findByTelegramId: jest.fn(),
    canGenerate: jest.fn(),
    create: jest.fn(),
    refundCredits: jest.fn(),
  },
}));

jest.mock("@/services/video.service", () => ({
  VideoService: {
    updateStatus: jest.fn(),
    setOutput: jest.fn(),
    getByJobId: jest.fn(),
    updateProgress: jest.fn(),
  },
}));

jest.mock("@/services/geminigen.service", () => ({
  GeminiGenService: {
    generateExtend: jest.fn(),
  },
}));

jest.mock("@/services/video-fallback.service", () => ({
  generateVideoWithFallback: jest.fn(),
}));

jest.mock("@/services/video-generation.service", () => ({
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
  generateStoryboard: jest.fn(() => [
    { scene: 1, duration: 5, description: "Scene 1 description" },
    { scene: 2, duration: 5, description: "Scene 2 description" },
  ]),
}));

jest.mock("@/services/postautomation.service", () => ({
  PostAutomationService: {
    hasConnectedAccounts: jest.fn(),
  },
}));

jest.mock("@/services/scene-consistency.service", () => ({
  SceneConsistencyEngine: {
    createMemory: jest.fn(),
    enrichScenePrompt: jest.fn(),
  },
}));

jest.mock("@/config/pricing", () => ({
  getVideoCreditCost: jest.fn((duration: number) => {
    const costs: Record<number, number> = {
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

jest.mock("@/config/audio-subtitle-engine", () => ({
  MARKETING_HOOKS: ["Check this out!", "You won't believe this!"],
  MARKETING_CTAS: ["Follow for more!", "Like and share!"],
}));

jest.mock("@/utils/errors", () => ({
  actionableError: jest.fn((error: string) => error),
}));

jest.mock("@/i18n/translations", () => ({
  t: jest.fn((key: string, lang?: string, params?: any) => {
    const translations: Record<string, string> = {
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

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("util", () => ({
  promisify: jest.fn(() => jest.fn()),
}));

jest.mock("child_process", () => ({
  exec: jest.fn(),
}));

jest.mock("fs", () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe("Create Command", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let UserService: any;
  let VideoService: any;
  let generateVideoWithFallback: jest.Mock;
  let generateStoryboard: jest.Mock;

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
    VideoService = require("@/services/video.service").VideoService;
    generateVideoWithFallback =
      require("@/services/video-fallback.service").generateVideoWithFallback;
    generateStoryboard =
      require("@/services/video-generation.service").generateStoryboard;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("createCommand", () => {
    let showGenerateMode: jest.Mock;

    beforeEach(() => {
      showGenerateMode = require("@/flows/generate").showGenerateMode;
      showGenerateMode.mockClear();
    });

    it("should delegate to showGenerateMode regardless of user state", async () => {
      await createCommand(ctx as any);

      expect(showGenerateMode).toHaveBeenCalledWith(ctx);
    });

    it("should delegate to showGenerateMode when user is missing", async () => {
      ctx.from = undefined as any;

      await createCommand(ctx as any);

      expect(showGenerateMode).toHaveBeenCalledWith(ctx);
    });

    it("should delegate to showGenerateMode when user not found in database", async () => {
      UserService.findByTelegramId.mockResolvedValue(null);

      await createCommand(ctx as any);

      expect(showGenerateMode).toHaveBeenCalledWith(ctx);
    });

    it("should delegate to showGenerateMode when balance is insufficient", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 0.3,
        language: "id",
      });

      await createCommand(ctx as any);

      expect(showGenerateMode).toHaveBeenCalledWith(ctx);
    });

    it("should delegate to showGenerateMode when daily limit reached", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 10,
        language: "id",
      });
      UserService.canGenerate.mockResolvedValue({
        allowed: false,
        used: 3,
        limit: 3,
      });

      await createCommand(ctx as any);

      expect(showGenerateMode).toHaveBeenCalledWith(ctx);
    });

    it("should delegate to showGenerateMode when prompt is preselected", async () => {
      ctx.session.stateData = { selectedPrompt: "Test prompt for video" };
      ctx.session.selectedNiche = "fnb";
      ctx.session.selectedStyles = ["appetizing"];
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 10,
        language: "id",
      });
      UserService.canGenerate.mockResolvedValue({ allowed: true });

      await createCommand(ctx as any);

      expect(showGenerateMode).toHaveBeenCalledWith(ctx);
    });

    it("should delegate to showGenerateMode for normal flow", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 10,
        language: "id",
      });
      UserService.canGenerate.mockResolvedValue({ allowed: true });

      await createCommand(ctx as any);

      expect(showGenerateMode).toHaveBeenCalledWith(ctx);
    });

    it("should delegate to showGenerateMode when user has no language set", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 10,
        language: null,
      });
      UserService.canGenerate.mockResolvedValue({ allowed: true });

      await createCommand(ctx as any);

      expect(showGenerateMode).toHaveBeenCalledWith(ctx);
    });

    it("should delegate to showGenerateMode even when database errors occur", async () => {
      UserService.findByTelegramId.mockRejectedValue(
        new Error("Database error"),
      );

      await createCommand(ctx as any);

      expect(showGenerateMode).toHaveBeenCalledWith(ctx);
    });
  });

  describe("handleDurationSelection", () => {
    it("should handle missing session", async () => {
      ctx.session = undefined as any;

      await handleDurationSelection(ctx as any, "duration_15_1");

      expect(ctx.editMessageText).not.toHaveBeenCalled();
    });

    it("should handle custom duration input", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        language: "id",
      });

      await handleDurationSelection(ctx as any, "custom_duration");

      expect(ctx.reply).toHaveBeenCalled();
      expect(ctx.session?.state).toBe("CUSTOM_DURATION_INPUT");
    });

    it("should parse duration and scenes correctly", async () => {
      ctx.from.id = 123456789;
      ctx.session.selectedNiche = "fnb";
      ctx.session.selectedStyles = ["appetizing"];
      ctx.session.stateData = { selectedPlatform: "tiktok" };
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 10,
        language: "id",
      });

      await handleDurationSelection(ctx as any, "duration_30_2");

      expect(ctx.session?.videoCreation).toBeDefined();
      expect(ctx.session?.videoCreation?.totalDuration).toBe(30);
      expect(ctx.session?.videoCreation?.scenes).toBe(2);
    });

    it("should auto-calculate scenes when not provided", async () => {
      ctx.from.id = 123456789;
      ctx.session.selectedNiche = "fnb";
      ctx.session.selectedStyles = ["appetizing"];
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 10,
        language: "id",
      });

      await handleDurationSelection(ctx as any, "duration_30");

      expect(ctx.session?.videoCreation?.scenes).toBe(6);
    });

    it("should reject invalid duration (< 6 seconds)", async () => {
      ctx.from.id = 123456789;
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 10,
        language: "id",
      });

      await handleDurationSelection(ctx as any, "duration_5_1");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Duration must be 6-300 seconds",
      );
    });

    it("should reject invalid duration (> 300 seconds)", async () => {
      ctx.from.id = 123456789;
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 10,
        language: "id",
      });

      await handleDurationSelection(ctx as any, "duration_301_60");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Duration must be 6-300 seconds",
      );
    });

    it("should create user if not exists", async () => {
      ctx.from.id = 123456789;
      ctx.session.selectedNiche = "fnb";
      ctx.session.selectedStyles = ["appetizing"];
      UserService.findByTelegramId.mockResolvedValue(null);
      UserService.create.mockResolvedValue({
        ...mockUser,
        creditBalance: 3,
      });

      await handleDurationSelection(ctx as any, "duration_15_1");

      expect(UserService.create).toHaveBeenCalled();
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Welcome"),
      );
    });

    it("should show insufficient credits message", async () => {
      ctx.from.id = 123456789;
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        creditBalance: 0.1,
        language: "id",
      });

      await handleDurationSelection(ctx as any, "duration_30_2");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith("Insufficient credits");
      expect(ctx.reply).toHaveBeenCalled();
    });

    it("should handle missing user", async () => {
      ctx.from = undefined as any;
      ctx.session = {
        state: "DASHBOARD",
        lastActivity: new Date(),
        stateData: {},
      };

      await handleDurationSelection(ctx as any, "duration_15_1");

      expect(ctx.editMessageText).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      UserService.findByTelegramId.mockRejectedValue(
        new Error("Database error"),
      );

      await handleDurationSelection(ctx as any, "duration_15_1");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Terjadi kesalahan. Coba lagi.",
      );
    });
  });

  describe("handleNicheSelection", () => {
    it("should handle missing session", async () => {
      ctx.session = undefined as any;

      await handleNicheSelection(ctx as any, "fnb");

      expect(ctx.editMessageText).not.toHaveBeenCalled();
    });

    it("should handle invalid niche", async () => {
      await handleNicheSelection(ctx as any, "invalid_niche");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith("Niche tidak valid");
    });

    it("should show style picker for valid niche", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        language: "id",
      });

      await handleNicheSelection(ctx as any, "fnb");

      expect(ctx.session?.selectedNiche).toBe("fnb");
      expect(ctx.editMessageText).toHaveBeenCalled();
      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[1].reply_markup.inline_keyboard.length).toBeGreaterThan(
        0,
      );
    });

    it("should handle errors gracefully", async () => {
      UserService.findByTelegramId.mockRejectedValue(
        new Error("Database error"),
      );

      await handleNicheSelection(ctx as any, "fnb");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Terjadi kesalahan. Coba lagi.",
      );
    });
  });

  describe("handleStyleSelection", () => {
    it("should handle missing session", async () => {
      ctx.session = undefined as any;

      await handleStyleSelection(ctx as any, "appetizing");

      expect(ctx.editMessageText).not.toHaveBeenCalled();
    });

    it("should show platform picker after style selection", async () => {
      ctx.session.selectedNiche = "fnb";
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        language: "id",
      });

      await handleStyleSelection(ctx as any, "appetizing");

      expect(ctx.session?.selectedStyles).toEqual(["appetizing"]);
      expect(ctx.editMessageText).toHaveBeenCalled();
      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[0]).toContain("platform");
    });

    it("should handle errors gracefully", async () => {
      UserService.findByTelegramId.mockRejectedValue(
        new Error("Database error"),
      );

      await handleStyleSelection(ctx as any, "appetizing");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Terjadi kesalahan. Coba lagi.",
      );
    });
  });

  describe("handlePlatformSelection", () => {
    it("should handle missing session", async () => {
      ctx.session = undefined as any;

      await handlePlatformSelection(ctx as any, "tiktok");

      expect(ctx.editMessageText).not.toHaveBeenCalled();
    });

    it("should show duration picker after platform selection", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        language: "id",
      });

      await handlePlatformSelection(ctx as any, "tiktok");

      expect(ctx.session?.stateData?.selectedPlatform).toBe("tiktok");
      expect(ctx.editMessageText).toHaveBeenCalled();
      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[0]).toContain("9:16");
    });

    it("should handle youtube platform", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        language: "id",
      });

      await handlePlatformSelection(ctx as any, "youtube");

      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[0]).toContain("16:9");
    });

    it("should handle instagram platform", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        language: "id",
      });

      await handlePlatformSelection(ctx as any, "instagram");

      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[0]).toContain("4:5");
    });

    it("should handle square platform", async () => {
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        language: "id",
      });

      await handlePlatformSelection(ctx as any, "square");

      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[0]).toContain("1:1");
    });

    it("should handle errors gracefully", async () => {
      UserService.findByTelegramId.mockRejectedValue(
        new Error("Database error"),
      );

      await handlePlatformSelection(ctx as any, "tiktok");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Terjadi kesalahan. Coba lagi.",
      );
    });
  });

  describe("handleVOToggle", () => {
    it("should handle missing video creation session", async () => {
      ctx.session.videoCreation = undefined;

      await handleVOToggle(ctx as any, "vo");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Tidak ada sesi pembuatan video aktif",
      );
    });

    it("should toggle VO setting", async () => {
      ctx.session.videoCreation = {
        enableVO: true,
        enableSubtitles: true,
        niche: "fnb",
        totalDuration: 30,
        scenes: 2,
      };
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        language: "id",
      });

      await handleVOToggle(ctx as any, "vo");

      expect(ctx.session?.videoCreation?.enableVO).toBe(false);
      expect(ctx.editMessageText).toHaveBeenCalled();
    });

    it("should toggle subtitles setting", async () => {
      ctx.session.videoCreation = {
        enableVO: true,
        enableSubtitles: true,
        niche: "fnb",
        totalDuration: 30,
        scenes: 2,
      };
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        language: "id",
      });

      await handleVOToggle(ctx as any, "subtitles");

      expect(ctx.session?.videoCreation?.enableSubtitles).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      ctx.session.videoCreation = {
        enableVO: true,
        enableSubtitles: true,
        niche: "fnb",
        totalDuration: 30,
        scenes: 2,
      };
      UserService.findByTelegramId.mockRejectedValue(
        new Error("Database error"),
      );

      await handleVOToggle(ctx as any, "vo");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Terjadi kesalahan. Coba lagi.",
      );
    });
  });

  describe("handleVOContinue", () => {
    it("should handle missing video creation session", async () => {
      ctx.session.videoCreation = undefined;

      await handleVOContinue(ctx as any);

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Tidak ada sesi pembuatan video aktif",
      );
    });

    it("should skip to generate when custom prompt exists", async () => {
      ctx.session.videoCreation = {
        customPrompt: "Test custom prompt",
        totalDuration: 30,
        enableVO: true,
        enableSubtitles: true,
      };

      await handleVOContinue(ctx as any);

      expect(ctx.editMessageText).toHaveBeenCalled();
      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[0]).toContain("Siap generate");
    });

    it("should show VO settings for normal flow", async () => {
      ctx.session.videoCreation = {
        enableVO: true,
        enableSubtitles: true,
        totalDuration: 30,
      };

      await handleVOContinue(ctx as any);

      expect(ctx.editMessageText).toHaveBeenCalled();
      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[0]).toContain("Pengaturan Suara");
    });

    it("should handle errors gracefully", async () => {
      ctx.session.videoCreation = {
        enableVO: true,
        enableSubtitles: true,
      };
      ctx.editMessageText.mockRejectedValue(new Error("Edit error"));

      await handleVOContinue(ctx as any);

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Terjadi kesalahan. Coba lagi.",
      );
    });
  });

  describe("handleCustomPromptRequest", () => {
    it("should handle missing video creation session", async () => {
      ctx.session.videoCreation = undefined;

      await handleCustomPromptRequest(ctx as any);

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Tidak ada sesi pembuatan video aktif",
      );
    });

    it("should set waiting for custom prompt state", async () => {
      ctx.session.videoCreation = {
        enableVO: true,
        enableSubtitles: true,
      };

      await handleCustomPromptRequest(ctx as any);

      expect(ctx.session?.videoCreation?.waitingForCustomPrompt).toBe(true);
      expect(ctx.session?.state).toBe("CUSTOM_PROMPT_INPUT");
      expect(ctx.editMessageText).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      ctx.session.videoCreation = {
        enableVO: true,
        enableSubtitles: true,
      };
      ctx.editMessageText.mockRejectedValue(new Error("Edit error"));

      await handleCustomPromptRequest(ctx as any);

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Terjadi kesalahan. Coba lagi.",
      );
    });
  });

  describe("handleSkipPrompt", () => {
    it("should handle missing video creation session", async () => {
      ctx.session.videoCreation = undefined;

      await handleSkipPrompt(ctx as any);

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Tidak ada sesi pembuatan video aktif",
      );
    });

    it("should set waiting for image state", async () => {
      ctx.session.videoCreation = {
        enableVO: true,
        enableSubtitles: true,
      };
      UserService.findByTelegramId.mockResolvedValue({
        ...mockUser,
        language: "id",
      });

      await handleSkipPrompt(ctx as any);

      expect(ctx.session?.videoCreation?.waitingForImage).toBe(true);
      expect(ctx.editMessageText).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      ctx.session.videoCreation = {
        enableVO: true,
        enableSubtitles: true,
      };
      UserService.findByTelegramId.mockRejectedValue(
        new Error("Database error"),
      );

      await handleSkipPrompt(ctx as any);

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Terjadi kesalahan. Coba lagi.",
      );
    });
  });

  describe("generateCaption", () => {
    it("should generate caption with hashtags", () => {
      const storyboard = [
        { scene: 1, duration: 5, description: "Delicious food shot" },
        { scene: 2, duration: 5, description: "Close up of ingredients" },
      ];

      const result = generateCaption("fnb", storyboard, "tiktok");

      expect(result.text).toBeDefined();
      expect(result.hashtags).toBeDefined();
      expect(result.hashtags).toContain("#");
    });

    it("should use correct hashtag count for platform", () => {
      const storyboard = [{ scene: 1, duration: 5, description: "Test scene" }];

      const tiktokCaption = generateCaption("fnb", storyboard, "tiktok");
      const youtubeCaption = generateCaption("fnb", storyboard, "youtube");

      const tiktokTags = tiktokCaption.hashtags.split(" ").length;
      const youtubeTags = youtubeCaption.hashtags.split(" ").length;

      expect(tiktokTags).toBeGreaterThan(youtubeTags);
    });

    it("should handle empty storyboard", () => {
      const result = generateCaption("fnb", [], "tiktok");

      expect(result.text).toBeDefined();
      expect(result.hashtags).toBeDefined();
    });

    it("should handle unknown niche", () => {
      const storyboard = [{ scene: 1, duration: 5, description: "Test scene" }];

      const result = generateCaption("unknown_niche", storyboard, "tiktok");

      expect(result.hashtags).toContain("#viral");
      expect(result.hashtags).toContain("#fyp");
    });

    it("should include niche-specific hashtags", () => {
      const storyboard = [{ scene: 1, duration: 5, description: "Test scene" }];

      const result = generateCaption("fnb", storyboard, "tiktok");

      expect(result.hashtags).toMatch(/#food|#kuliner|#makananenak/);
    });
  });
});
