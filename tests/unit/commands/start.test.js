"use strict";
/**
 * Start Command Unit Tests
 *
 * Tests for /start command handler
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const start_1 = require("@/commands/start");
const fixtures_1 = require("../../fixtures");
// Mock dependencies
globals_1.jest.mock("@/services/user.service", () => ({
    UserService: {
        findByTelegramId: globals_1.jest.fn(),
        updateActivity: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/services/vilona-animation.service", () => ({
    sendVilonaWelcomeAnimation: globals_1.jest.fn(),
}));
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/config/languages", () => ({
    LANGUAGES: {
        id: { code: "id", label: "Bahasa Indonesia" },
        en: { code: "en", label: "English" },
        ms: { code: "ms", label: "Bahasa Melayu" },
        th: { code: "th", label: "Thai" },
        vi: { code: "vi", label: "Vietnamese" },
        zh: { code: "zh", label: "Chinese" },
        ja: { code: "ja", label: "Japanese" },
        ko: { code: "ko", label: "Korean" },
        ar: { code: "ar", label: "Arabic" },
        ru: { code: "ru", label: "Russian" },
        fr: { code: "fr", label: "French" },
        de: { code: "de", label: "German" },
        es: { code: "es", label: "Spanish" },
        pt: { code: "pt", label: "Portuguese" },
    },
}));
(0, globals_1.describe)("Start Command", () => {
    let ctx;
    let UserService;
    let sendVilonaWelcomeAnimation;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        ctx = (0, fixtures_1.createMockContext)();
        UserService = require("@/services/user.service").UserService;
        sendVilonaWelcomeAnimation =
            require("@/services/vilona-animation.service").sendVilonaWelcomeAnimation;
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("startCommand", () => {
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Unable to identify user. Please try again.");
            (0, globals_1.expect)(UserService.findByTelegramId).not.toHaveBeenCalled();
        });
        (0, globals_1.it)("should show welcome message for new users", async () => {
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(UserService.findByTelegramId).toHaveBeenCalledWith(BigInt(ctx.from.id));
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Selamat datang di BerkahKarya AI!");
            (0, globals_1.expect)(replyCall[1].reply_markup.inline_keyboard[0][0].callback_data).toBe("onboard_start");
        });
        (0, globals_1.it)("should detect language from Telegram language_code", async () => {
            ctx.from.language_code = "id";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("id");
        });
        (0, globals_1.it)("should handle language code with region (e.g., en-US)", async () => {
            ctx.from.language_code = "en-US";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("en");
        });
        (0, globals_1.it)("should fallback to English for unsupported language", async () => {
            ctx.from.language_code = "xyz";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("en");
        });
        (0, globals_1.it)("should handle missing language_code", async () => {
            ctx.from.language_code = undefined;
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("en");
        });
        (0, globals_1.it)("should extract start payload from message", async () => {
            ctx.message = { text: "/start referral_123", message_id: 1 };
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.startPayload).toBe("referral_123");
        });
        (0, globals_1.it)("should set ONBOARDING_LANGUAGE state for new users", async () => {
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.state).toBe("ONBOARDING_LANGUAGE");
        });
        (0, globals_1.it)("should show main menu for existing users", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
                tier: "free",
                isBanned: false,
            });
            UserService.updateActivity.mockResolvedValue(undefined);
            sendVilonaWelcomeAnimation.mockResolvedValue(undefined);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(UserService.updateActivity).toHaveBeenCalledWith(BigInt(ctx.from.id));
            (0, globals_1.expect)(sendVilonaWelcomeAnimation).toHaveBeenCalledWith(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Halo");
            (0, globals_1.expect)(replyCall[1].reply_markup.inline_keyboard).toHaveLength(5);
        });
        (0, globals_1.it)("should show correct credit emoji for zero balance", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 0,
                isBanned: false,
            });
            UserService.updateActivity.mockResolvedValue(undefined);
            sendVilonaWelcomeAnimation.mockResolvedValue(undefined);
            await (0, start_1.startCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("⚠️");
        });
        (0, globals_1.it)("should show correct credit emoji for low balance (< 3)", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 2,
                isBanned: false,
            });
            UserService.updateActivity.mockResolvedValue(undefined);
            sendVilonaWelcomeAnimation.mockResolvedValue(undefined);
            await (0, start_1.startCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("🟡");
        });
        (0, globals_1.it)("should show correct credit emoji for sufficient balance (>= 3)", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 10,
                isBanned: false,
            });
            UserService.updateActivity.mockResolvedValue(undefined);
            sendVilonaWelcomeAnimation.mockResolvedValue(undefined);
            await (0, start_1.startCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("🟢");
        });
        (0, globals_1.it)("should store credit balance in session", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                creditBalance: 15,
                tier: "pro",
                isBanned: false,
            });
            UserService.updateActivity.mockResolvedValue(undefined);
            sendVilonaWelcomeAnimation.mockResolvedValue(undefined);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.creditBalance).toBe(15);
            (0, globals_1.expect)(ctx.session?.tier).toBe("pro");
        });
        (0, globals_1.it)("should set DASHBOARD state for existing users", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                isBanned: false,
            });
            UserService.updateActivity.mockResolvedValue(undefined);
            sendVilonaWelcomeAnimation.mockResolvedValue(undefined);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.state).toBe("DASHBOARD");
        });
        (0, globals_1.it)("should show ban message for banned users", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                isBanned: true,
                banReason: "Violation of terms",
            });
            UserService.updateActivity.mockResolvedValue(undefined);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(sendVilonaWelcomeAnimation).not.toHaveBeenCalled();
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("account has been restricted");
            (0, globals_1.expect)(replyCall[0]).toContain("Violation of terms");
        });
        (0, globals_1.it)("should show default ban reason when none provided", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                isBanned: true,
                banReason: null,
            });
            UserService.updateActivity.mockResolvedValue(undefined);
            await (0, start_1.startCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("No reason provided");
        });
        (0, globals_1.it)("should handle database errors gracefully", async () => {
            UserService.findByTelegramId.mockRejectedValue(new Error("Database error"));
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Something went wrong. Please try again later.");
        });
        (0, globals_1.it)("should handle missing session gracefully", async () => {
            ctx.session = undefined;
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            // Should not throw, just skip session updates
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
        });
        (0, globals_1.it)("should show correct inline keyboard buttons for existing users", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                isBanned: false,
            });
            UserService.updateActivity.mockResolvedValue(undefined);
            sendVilonaWelcomeAnimation.mockResolvedValue(undefined);
            await (0, start_1.startCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            (0, globals_1.expect)(keyboard[0][0].callback_data).toBe("create_video_new");
            (0, globals_1.expect)(keyboard[1][0].callback_data).toBe("create_image_new");
            (0, globals_1.expect)(keyboard[2][0].callback_data).toBe("credits_menu");
            (0, globals_1.expect)(keyboard[3][0].callback_data).toBe("videos_list");
            (0, globals_1.expect)(keyboard[4][0].callback_data).toBe("account_menu");
        });
        (0, globals_1.it)("should handle zh-hans language code", async () => {
            ctx.from.language_code = "zh-hans";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("zh");
        });
        (0, globals_1.it)("should handle pt-br language code", async () => {
            ctx.from.language_code = "pt-br";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("pt");
        });
        (0, globals_1.it)("should handle ms language code", async () => {
            ctx.from.language_code = "ms";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("ms");
        });
        (0, globals_1.it)("should handle th language code", async () => {
            ctx.from.language_code = "th";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("th");
        });
        (0, globals_1.it)("should handle vi language code", async () => {
            ctx.from.language_code = "vi";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("vi");
        });
        (0, globals_1.it)("should handle ja language code", async () => {
            ctx.from.language_code = "ja";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("ja");
        });
        (0, globals_1.it)("should handle ko language code", async () => {
            ctx.from.language_code = "ko";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("ko");
        });
        (0, globals_1.it)("should handle ar language code", async () => {
            ctx.from.language_code = "ar";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("ar");
        });
        (0, globals_1.it)("should handle ru language code", async () => {
            ctx.from.language_code = "ru";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("ru");
        });
        (0, globals_1.it)("should handle fr language code", async () => {
            ctx.from.language_code = "fr";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("fr");
        });
        (0, globals_1.it)("should handle de language code", async () => {
            ctx.from.language_code = "de";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("de");
        });
        (0, globals_1.it)("should handle es language code", async () => {
            ctx.from.language_code = "es";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("es");
        });
        (0, globals_1.it)("should handle case-insensitive language codes", async () => {
            ctx.from.language_code = "EN";
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.detectedLang).toBe("en");
        });
        (0, globals_1.it)("should handle message without start payload", async () => {
            ctx.message = { text: "/start", message_id: 1 };
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.startPayload).toBeNull();
        });
        (0, globals_1.it)("should handle missing message object", async () => {
            ctx.message = undefined;
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.stateData?.startPayload).toBeNull();
        });
        (0, globals_1.it)("should handle premium user with high credit balance", async () => {
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockPremiumUser,
                creditBalance: 100,
                tier: "pro",
                isBanned: false,
            });
            UserService.updateActivity.mockResolvedValue(undefined);
            sendVilonaWelcomeAnimation.mockResolvedValue(undefined);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.session?.creditBalance).toBe(100);
            (0, globals_1.expect)(ctx.session?.tier).toBe("pro");
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("🟢");
        });
        (0, globals_1.it)("should handle user with no username", async () => {
            ctx.from.username = undefined;
            UserService.findByTelegramId.mockResolvedValue({
                ...fixtures_1.mockUser,
                isBanned: false,
            });
            UserService.updateActivity.mockResolvedValue(undefined);
            sendVilonaWelcomeAnimation.mockResolvedValue(undefined);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
        });
        (0, globals_1.it)("should handle user with no last_name", async () => {
            ctx.from.last_name = undefined;
            UserService.findByTelegramId.mockResolvedValue(null);
            await (0, start_1.startCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=start.test.js.map