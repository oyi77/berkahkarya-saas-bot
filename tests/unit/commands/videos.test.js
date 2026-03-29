"use strict";
/**
 * Videos Command Unit Tests
 *
 * Tests for /videos command handler and related functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const videos_1 = require("@/commands/videos");
const fixtures_1 = require("../../fixtures");
globals_1.jest.mock("@/services/video.service", () => ({
    VideoService: {
        getUserVideos: globals_1.jest.fn(),
        getByJobId: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)("Videos Command", () => {
    let ctx;
    let VideoService;
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
        VideoService = require("@/services/video.service").VideoService;
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("videosCommand", () => {
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            await (0, videos_1.videosCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Unable to identify user.");
        });
        (0, globals_1.it)("should show empty state when no videos exist", async () => {
            VideoService.getUserVideos.mockResolvedValue([]);
            await (0, videos_1.videosCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("No videos yet");
            (0, globals_1.expect)(replyCall[1].reply_markup.inline_keyboard[0][0].callback_data).toBe("create_video");
        });
        (0, globals_1.it)("should show video list with completed videos", async () => {
            VideoService.getUserVideos.mockResolvedValue([fixtures_1.mockVideo]);
            await (0, videos_1.videosCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Found 1 video(s)");
            (0, globals_1.expect)(replyCall[1].reply_markup.inline_keyboard[0][0].callback_data).toBe("video_view_job_test_123");
        });
        (0, globals_1.it)("should show correct status emoji for completed video", async () => {
            VideoService.getUserVideos.mockResolvedValue([
                { ...fixtures_1.mockVideo, status: "completed" },
            ]);
            await (0, videos_1.videosCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            const videoButton = replyCall[1].reply_markup.inline_keyboard[0][0];
            (0, globals_1.expect)(videoButton.text).toContain("✅");
        });
        (0, globals_1.it)("should show correct status emoji for processing video", async () => {
            VideoService.getUserVideos.mockResolvedValue([fixtures_1.mockProcessingVideo]);
            await (0, videos_1.videosCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            const videoButton = replyCall[1].reply_markup.inline_keyboard[0][0];
            (0, globals_1.expect)(videoButton.text).toContain("⏳");
        });
        (0, globals_1.it)("should show correct status emoji for failed video", async () => {
            VideoService.getUserVideos.mockResolvedValue([fixtures_1.mockFailedVideo]);
            await (0, videos_1.videosCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            const videoButton = replyCall[1].reply_markup.inline_keyboard[0][0];
            (0, globals_1.expect)(videoButton.text).toContain("❌");
        });
        (0, globals_1.it)("should show multiple videos in list", async () => {
            VideoService.getUserVideos.mockResolvedValue([
                fixtures_1.mockVideo,
                fixtures_1.mockProcessingVideo,
                fixtures_1.mockFailedVideo,
            ]);
            await (0, videos_1.videosCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Found 3 video(s)");
            (0, globals_1.expect)(replyCall[1].reply_markup.inline_keyboard.length).toBeGreaterThan(3);
        });
        (0, globals_1.it)("should show create new video button", async () => {
            VideoService.getUserVideos.mockResolvedValue([fixtures_1.mockVideo]);
            await (0, videos_1.videosCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            const keyboard = replyCall[1].reply_markup.inline_keyboard;
            const createButton = keyboard.find((row) => row.some((btn) => btn.callback_data === "create_video"));
            (0, globals_1.expect)(createButton).toBeDefined();
        });
        (0, globals_1.it)("should show main menu button", async () => {
            VideoService.getUserVideos.mockResolvedValue([fixtures_1.mockVideo]);
            await (0, videos_1.videosCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            const keyboard = replyCall[1].reply_markup.inline_keyboard;
            const lastRow = keyboard[keyboard.length - 1];
            (0, globals_1.expect)(lastRow[0].callback_data).toBe("main_menu");
        });
        (0, globals_1.it)("should handle database errors gracefully", async () => {
            VideoService.getUserVideos.mockRejectedValue(new Error("Database error"));
            await (0, globals_1.expect)((0, videos_1.videosCommand)(ctx)).rejects.toThrow();
        });
    });
    (0, globals_1.describe)("viewVideo", () => {
        (0, globals_1.it)("should show video not found message", async () => {
            VideoService.getByJobId.mockResolvedValue(null);
            await (0, videos_1.viewVideo)(ctx, "invalid_job_id");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Video not found");
        });
        (0, globals_1.it)("should show completed video details with thumbnail", async () => {
            VideoService.getByJobId.mockResolvedValue({
                ...fixtures_1.mockVideo,
                status: "completed",
                videoUrl: "https://example.com/video.mp4",
                thumbnailUrl: "https://example.com/thumb.jpg",
                downloadUrl: "https://example.com/download.mp4",
            });
            await (0, videos_1.viewVideo)(ctx, "job_test_123");
            (0, globals_1.expect)(ctx.editMessageMedia).toHaveBeenCalled();
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Actions");
            (0, globals_1.expect)(replyCall[1].reply_markup.inline_keyboard[0][0].text).toContain("Download Video");
        });
        (0, globals_1.it)("should handle completed video without thumbnail", async () => {
            VideoService.getByJobId.mockResolvedValue({
                ...fixtures_1.mockVideo,
                status: "completed",
                videoUrl: "https://example.com/video.mp4",
                thumbnailUrl: null,
            });
            await (0, videos_1.viewVideo)(ctx, "job_test_123");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("Video Details");
        });
        (0, globals_1.it)("should show processing video with refresh button", async () => {
            VideoService.getByJobId.mockResolvedValue(fixtures_1.mockProcessingVideo);
            await (0, videos_1.viewVideo)(ctx, "job_processing_456");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("Processing...");
            (0, globals_1.expect)(editCall[1].reply_markup.inline_keyboard[0][0].callback_data).toBe("video_view_job_processing_456");
        });
        (0, globals_1.it)("should show failed video with retry button", async () => {
            VideoService.getByJobId.mockResolvedValue(fixtures_1.mockFailedVideo);
            await (0, videos_1.viewVideo)(ctx, "job_failed_789");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("Failed");
            (0, globals_1.expect)(editCall[1].reply_markup.inline_keyboard[0][0].callback_data).toBe("video_retry_job_failed_789");
        });
        (0, globals_1.it)("should show video details with all information", async () => {
            VideoService.getByJobId.mockResolvedValue({
                ...fixtures_1.mockVideo,
                title: "Test Video",
                niche: "fnb",
                platform: "tiktok",
                duration: 30,
                scenes: 5,
                creditsUsed: 1,
            });
            await (0, videos_1.viewVideo)(ctx, "job_test_123");
            (0, globals_1.expect)(ctx.editMessageMedia).toHaveBeenCalled();
            const mediaCall = ctx.editMessageMedia.mock.calls[0][0];
            (0, globals_1.expect)(mediaCall.caption).toContain("Test Video");
            (0, globals_1.expect)(mediaCall.caption).toContain("fnb");
            (0, globals_1.expect)(mediaCall.caption).toContain("tiktok");
            (0, globals_1.expect)(mediaCall.caption).toContain("30s");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            VideoService.getByJobId.mockRejectedValue(new Error("Database error"));
            await (0, globals_1.expect)((0, videos_1.viewVideo)(ctx, "job_test_123")).rejects.toThrow();
        });
    });
    (0, globals_1.describe)("copyVideoUrl", () => {
        (0, globals_1.it)("should show video not found message", async () => {
            VideoService.getByJobId.mockResolvedValue(null);
            await (0, videos_1.copyVideoUrl)(ctx, "invalid_job_id");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Video URL not found");
        });
        (0, globals_1.it)("should show video URL not found when no URL", async () => {
            VideoService.getByJobId.mockResolvedValue({
                ...fixtures_1.mockVideo,
                videoUrl: null,
            });
            await (0, videos_1.copyVideoUrl)(ctx, "job_test_123");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Video URL not found");
        });
        (0, globals_1.it)("should copy video URL to clipboard", async () => {
            VideoService.getByJobId.mockResolvedValue({
                ...fixtures_1.mockVideo,
                videoUrl: "https://example.com/video.mp4",
            });
            await (0, videos_1.copyVideoUrl)(ctx, "job_test_123");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("URL copied!");
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("https://example.com/video.mp4");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            VideoService.getByJobId.mockRejectedValue(new Error("Database error"));
            await (0, globals_1.expect)((0, videos_1.copyVideoUrl)(ctx, "job_test_123")).rejects.toThrow();
        });
    });
    (0, globals_1.describe)("deleteVideo", () => {
        (0, globals_1.it)("should show video not found message", async () => {
            VideoService.getByJobId.mockResolvedValue(null);
            await (0, videos_1.deleteVideo)(ctx, "invalid_job_id");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Video not found");
        });
        (0, globals_1.it)("should show delete confirmation dialog", async () => {
            VideoService.getByJobId.mockResolvedValue({
                ...fixtures_1.mockVideo,
                title: "Test Video",
            });
            await (0, videos_1.deleteVideo)(ctx, "job_test_123");
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("Delete Video");
            (0, globals_1.expect)(editCall[0]).toContain("Test Video");
            (0, globals_1.expect)(editCall[1].reply_markup.inline_keyboard[0][0].callback_data).toBe("video_confirm_delete_job_test_123");
            (0, globals_1.expect)(editCall[1].reply_markup.inline_keyboard[0][1].callback_data).toBe("video_view_job_test_123");
        });
        (0, globals_1.it)("should show delete confirmation for video without title", async () => {
            VideoService.getByJobId.mockResolvedValue({
                ...fixtures_1.mockVideo,
                title: null,
            });
            await (0, videos_1.deleteVideo)(ctx, "job_test_123");
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("this video");
        });
        (0, globals_1.it)("should handle errors gracefully", async () => {
            VideoService.getByJobId.mockRejectedValue(new Error("Database error"));
            await (0, globals_1.expect)((0, videos_1.deleteVideo)(ctx, "job_test_123")).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=videos.test.js.map