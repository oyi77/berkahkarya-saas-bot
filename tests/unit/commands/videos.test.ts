/**
 * Videos Command Unit Tests
 *
 * Tests for /videos command handler and related functions
 */

import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import {
  videosCommand,
  viewVideo,
  copyVideoUrl,
  deleteVideo,
} from "@/commands/videos";
import {
  createMockContext,
  mockVideo,
  mockProcessingVideo,
  mockFailedVideo,
} from "../../fixtures";

jest.mock("@/services/video.service", () => ({
  VideoService: {
    getUserVideos: jest.fn(),
    getByJobId: jest.fn(),
  },
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("@/services/user.service", () => ({
  UserService: {
    findByTelegramId: jest.fn<any>().mockResolvedValue(null),
  },
}));

describe("Videos Command", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let VideoService: any;

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
    VideoService = require("@/services/video.service").VideoService;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("videosCommand", () => {
    it("should handle missing user gracefully", async () => {
      ctx.from = undefined as any;

      await videosCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("❌"));
    });

    it("should show empty state when no videos exist", async () => {
      VideoService.getUserVideos.mockResolvedValue([]);

      await videosCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("No videos yet");
      expect(
        replyCall[1].reply_markup.inline_keyboard[0][0].callback_data,
      ).toBe("create_video_new");
    });

    it("should show video list with completed videos", async () => {
      VideoService.getUserVideos.mockResolvedValue([mockVideo]);

      await videosCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Found 1 video(s)");
      expect(
        replyCall[1].reply_markup.inline_keyboard[0][0].callback_data,
      ).toBe("video_view_job_test_123");
    });

    it("should show correct status emoji for completed video", async () => {
      VideoService.getUserVideos.mockResolvedValue([
        { ...mockVideo, status: "completed" },
      ]);

      await videosCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      const videoButton = replyCall[1].reply_markup.inline_keyboard[0][0];
      expect(videoButton.text).toContain("✅");
    });

    it("should show correct status emoji for processing video", async () => {
      VideoService.getUserVideos.mockResolvedValue([mockProcessingVideo]);

      await videosCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      const videoButton = replyCall[1].reply_markup.inline_keyboard[0][0];
      expect(videoButton.text).toContain("⏳");
    });

    it("should show correct status emoji for failed video", async () => {
      VideoService.getUserVideos.mockResolvedValue([mockFailedVideo]);

      await videosCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      const videoButton = replyCall[1].reply_markup.inline_keyboard[0][0];
      expect(videoButton.text).toContain("❌");
    });

    it("should show multiple videos in list", async () => {
      VideoService.getUserVideos.mockResolvedValue([
        mockVideo,
        mockProcessingVideo,
        mockFailedVideo,
      ]);

      await videosCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Found 3 video(s)");
      expect(replyCall[1].reply_markup.inline_keyboard.length).toBeGreaterThan(
        3,
      );
    });

    it("should show create new video button", async () => {
      VideoService.getUserVideos.mockResolvedValue([mockVideo]);

      await videosCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      const keyboard = replyCall[1].reply_markup.inline_keyboard;
      const createButton = keyboard.find((row: any) =>
        row.some((btn: any) => btn.callback_data === "create_video_new"),
      );
      expect(createButton).toBeDefined();
    });

    it("should show main menu button", async () => {
      VideoService.getUserVideos.mockResolvedValue([mockVideo]);

      await videosCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      const keyboard = replyCall[1].reply_markup.inline_keyboard;
      const lastRow = keyboard[keyboard.length - 1];
      expect(lastRow[0].callback_data).toBe("main_menu");
    });

    it("should handle database errors gracefully", async () => {
      VideoService.getUserVideos.mockRejectedValue(
        new Error("Database error") as never,
      );

      await videosCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        "❌ Terjadi kesalahan. Silakan coba lagi.",
      );
    });
  });

  describe("viewVideo", () => {
    it("should show video not found message", async () => {
      VideoService.getByJobId.mockResolvedValue(null);

      await viewVideo(ctx as any, "invalid_job_id");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Video not found");
    });

    it("should show completed video details with thumbnail", async () => {
      VideoService.getByJobId.mockResolvedValue({
        ...mockVideo,
        status: "completed",
        videoUrl: "https://example.com/video.mp4",
        thumbnailUrl: "https://example.com/thumb.jpg",
        downloadUrl: "https://example.com/download.mp4",
      });

      await viewVideo(ctx as any, "job_test_123");

      expect(ctx.editMessageMedia).toHaveBeenCalled();
      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Actions");
      expect(replyCall[1].reply_markup.inline_keyboard[0][0].text).toContain(
        "Download Video",
      );
    });

    it("should handle completed video without thumbnail", async () => {
      VideoService.getByJobId.mockResolvedValue({
        ...mockVideo,
        status: "completed",
        videoUrl: "https://example.com/video.mp4",
        thumbnailUrl: null,
      });

      await viewVideo(ctx as any, "job_test_123");

      // No thumbnail → text path with download button (download URL is our JWT URL, not provider URL)
      expect(ctx.editMessageText).toHaveBeenCalled();
      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[0]).toContain("Video Details");
      const dlButton = editCall[1].reply_markup.inline_keyboard[0][0];
      expect(dlButton.url).toMatch(/\/video\/job_test_123\/download\?token=/);
    });

    it("should show processing video with refresh button", async () => {
      VideoService.getByJobId.mockResolvedValue(mockProcessingVideo);

      await viewVideo(ctx as any, "job_processing_456");

      expect(ctx.editMessageText).toHaveBeenCalled();
      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[0]).toContain("Processing...");
      expect(editCall[1].reply_markup.inline_keyboard[0][0].callback_data).toBe(
        "video_view_job_processing_456",
      );
    });

    it("should show failed video with retry button", async () => {
      VideoService.getByJobId.mockResolvedValue(mockFailedVideo);

      await viewVideo(ctx as any, "job_failed_789");

      expect(ctx.editMessageText).toHaveBeenCalled();
      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[0]).toContain("Failed");
      expect(editCall[1].reply_markup.inline_keyboard[0][0].callback_data).toBe(
        "video_retry_job_failed_789",
      );
    });

    it("should show video details with all information", async () => {
      VideoService.getByJobId.mockResolvedValue({
        ...mockVideo,
        title: "Test Video",
        niche: "fnb",
        platform: "tiktok",
        duration: 30,
        scenes: 5,
        creditsUsed: 1,
      });

      await viewVideo(ctx as any, "job_test_123");

      expect(ctx.editMessageMedia).toHaveBeenCalled();
      const mediaCall = ctx.editMessageMedia.mock.calls[0][0];
      expect(mediaCall.caption).toContain("Test Video");
      expect(mediaCall.caption).toContain("fnb");
      expect(mediaCall.caption).toContain("tiktok");
      expect(mediaCall.caption).toContain("30s");
    });

    it("should handle errors gracefully", async () => {
      VideoService.getByJobId.mockRejectedValue(
        new Error("Database error") as never,
      );

      await expect(viewVideo(ctx as any, "job_test_123")).rejects.toThrow();
    });
  });

  describe("copyVideoUrl", () => {
    it("should show video not found message", async () => {
      VideoService.getByJobId.mockResolvedValue(null);

      await copyVideoUrl(ctx as any, "invalid_job_id");

      // Mock language_code is "en" so uses English translation
      expect(ctx.answerCbQuery).toHaveBeenCalledWith(expect.stringContaining("not found"));
    });

    it("should show video URL not found when no URL", async () => {
      VideoService.getByJobId.mockResolvedValue({
        ...mockVideo,
        videoUrl: null,
      });

      await copyVideoUrl(ctx as any, "job_test_123");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(expect.stringContaining("not found"));
    });

    it("should copy video URL to clipboard", async () => {
      VideoService.getByJobId.mockResolvedValue({
        ...mockVideo,
        videoUrl: "https://example.com/video.mp4",
      });

      await copyVideoUrl(ctx as any, "job_test_123");

      // Returns our signed download URL, not the raw provider CDN URL
      expect(ctx.answerCbQuery).toHaveBeenCalledWith(expect.stringContaining("copied"));
      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toMatch(/\/video\/job_test_123\/download\?token=/);
    });

    it("should handle errors gracefully", async () => {
      VideoService.getByJobId.mockRejectedValue(
        new Error("Database error") as never,
      );

      await copyVideoUrl(ctx as any, "job_test_123");

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("❌"),
      );
    });
  });

  describe("deleteVideo", () => {
    it("should show video not found message", async () => {
      VideoService.getByJobId.mockResolvedValue(null);

      await deleteVideo(ctx as any, "invalid_job_id");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Video not found");
    });

    it("should show delete confirmation dialog", async () => {
      VideoService.getByJobId.mockResolvedValue({
        ...mockVideo,
        title: "Test Video",
      });

      await deleteVideo(ctx as any, "job_test_123");

      expect(ctx.editMessageText).toHaveBeenCalled();
      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[0]).toContain("Delete Video");
      expect(editCall[0]).toContain("Test Video");
      expect(editCall[1].reply_markup.inline_keyboard[0][0].callback_data).toBe(
        "video_confirm_delete_job_test_123",
      );
      expect(editCall[1].reply_markup.inline_keyboard[0][1].callback_data).toBe(
        "video_view_job_test_123",
      );
    });

    it("should show delete confirmation for video without title", async () => {
      VideoService.getByJobId.mockResolvedValue({
        ...mockVideo,
        title: null,
      });

      await deleteVideo(ctx as any, "job_test_123");

      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[0]).toContain("this video");
    });

    it("should handle errors gracefully", async () => {
      VideoService.getByJobId.mockRejectedValue(
        new Error("Database error") as never,
      );

      await deleteVideo(ctx as any, "job_test_123");

      expect(ctx.reply).toHaveBeenCalledWith(
        "❌ Terjadi kesalahan. Silakan coba lagi.",
      );
    });
  });
});
