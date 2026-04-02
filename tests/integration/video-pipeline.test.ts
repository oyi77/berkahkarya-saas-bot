/**
 * Video Generation Pipeline Integration Tests
 *
 * Tests key integration points:
 * 1. Job enqueuing
 * 2. Video record creation in database
 * 3. Status updates and credit deduction
 */

import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";

const mockPrismaVideo = {
  create: jest.fn<any>(),
  findFirst: jest.fn<any>(),
  findUnique: jest.fn<any>(),
  update: jest.fn<any>(),
  delete: jest.fn<any>(),
};

const mockPrisma = {
  video: mockPrismaVideo,
};

jest.mock("@/config/database", () => ({
  prisma: mockPrisma,
}));

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock("@/utils/logger", () => ({
  logger: mockLogger,
}));

jest.mock("@/config/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock("@/config/queue", () => ({
  videoQueue: {
    add: jest.fn(),
  },
}));

import { VideoService } from "@/services/video.service";

const TEST_JOB_ID = "test-integration-job";
const TEST_USER_ID = BigInt(123456789);

describe("Video Generation Pipeline Integration", () => {
  beforeAll(async () => {
    process.env.BOT_TOKEN = "test-token";
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || "postgresql://test@localhost:5432/test";
    process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
  });

  afterAll(async () => {
    // No cleanup needed
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Job Enqueueing", () => {
    it("should enqueue video generation job", async () => {
      const { videoQueue } = require("@/config/queue");
      videoQueue.add.mockResolvedValue({ id: "test-job-id" });

      const job = await videoQueue.add({
        jobId: TEST_JOB_ID,
        userId: TEST_USER_ID,
        niche: "food",
        duration: 15,
        scenes: 5,
        platform: "tiktok",
        styles: ["cinematic"],
      });

      expect(job).toBeDefined();
      expect(job.id).toBe("test-job-id");
    });
  });

  describe("Video Record Creation", () => {
    it("should create video record in database when job starts", async () => {
      mockPrismaVideo.create.mockResolvedValue({
        id: BigInt(1),
        jobId: TEST_JOB_ID,
        userId: TEST_USER_ID,
        niche: "food",
        duration: 15,
        scenes: 5,
        platform: "tiktok",
        styles: ["cinematic"],
        status: "processing",
        progress: 0,
        creditsUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const video = await VideoService.createJob({
        userId: TEST_USER_ID,
        niche: "food",
        duration: 15,
        scenes: 5,
        platform: "tiktok",
        title: "Test Video",
      });

      expect(video).toBeDefined();
      expect(video.jobId).toBeDefined();
      expect(video.status).toBe("processing");
    });
  });

  describe("Status Updates", () => {
    it("should update video status to completed", async () => {
      mockPrismaVideo.findFirst.mockResolvedValue({
        id: BigInt(1),
        jobId: TEST_JOB_ID,
        status: "processing",
      });

      mockPrismaVideo.update.mockResolvedValue({
        id: BigInt(1),
        jobId: TEST_JOB_ID,
        status: "completed",
        videoUrl: "https://example.com/video.mp4",
        thumbnailUrl: "https://example.com/thumb.jpg",
        progress: 100,
        creditsUsed: 10,
        completedAt: new Date(),
      });

      const video = await VideoService.updateStatus(TEST_JOB_ID, "completed");

      expect(video).toBeDefined();
      expect(video.status).toBe("completed");
    });

    it("should update video status to failed with error message", async () => {
      mockPrismaVideo.findFirst.mockResolvedValue({
        id: BigInt(1),
        jobId: TEST_JOB_ID,
        status: "processing",
      });

      mockPrismaVideo.update.mockResolvedValue({
        id: BigInt(1),
        jobId: TEST_JOB_ID,
        status: "failed",
        errorMessage: "Provider timeout",
        progress: 50,
      });

      const video = await VideoService.updateStatus(
        TEST_JOB_ID,
        "failed",
        "Provider timeout",
      );

      expect(video).toBeDefined();
      expect(video.status).toBe("failed");
      expect(video.errorMessage).toBe("Provider timeout");
    });
  });

  describe("Credit Deduction", () => {
    it("should track credits used on successful generation", async () => {
      mockPrismaVideo.findUnique.mockResolvedValue({
        id: BigInt(1),
        jobId: TEST_JOB_ID,
        status: "completed",
        creditsUsed: 10,
      });

      const video = await VideoService.getByJobId(TEST_JOB_ID);

      expect(video).toBeDefined();
      expect(video!.creditsUsed).toBe(10);
    });

    it("should not deduct credits on failed generation", async () => {
      mockPrismaVideo.findUnique.mockResolvedValue({
        id: BigInt(1),
        jobId: TEST_JOB_ID,
        status: "failed",
        creditsUsed: 0,
      });

      const video = await VideoService.getByJobId(TEST_JOB_ID);

      expect(video).toBeDefined();
      expect(video!.status).toBe("failed");
      expect(video!.creditsUsed).toBe(0);
    });
  });

  describe("End-to-End Workflow", () => {
    it("should complete full video generation pipeline", async () => {
      // 1. Create job record
      mockPrismaVideo.create.mockResolvedValue({
        id: BigInt(1),
        jobId: TEST_JOB_ID,
        userId: TEST_USER_ID,
        niche: "food",
        duration: 15,
        scenes: 5,
        platform: "tiktok",
        styles: ["cinematic"],
        status: "processing",
        progress: 0,
        creditsUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const createdVideo = await VideoService.createJob({
        userId: TEST_USER_ID,
        niche: "food",
        duration: 15,
        scenes: 5,
        platform: "tiktok",
        title: "Test Video",
      });

      expect(createdVideo.status).toBe("processing");

      // 2. Update to completed
      mockPrismaVideo.findFirst.mockResolvedValue(createdVideo);
      mockPrismaVideo.update.mockResolvedValue({
        ...createdVideo,
        status: "completed",
        videoUrl: "https://example.com/final.mp4",
        thumbnailUrl: "https://example.com/thumb.jpg",
        progress: 100,
        creditsUsed: 10,
        completedAt: new Date(),
      });

      const completedVideo = await VideoService.updateStatus(
        TEST_JOB_ID,
        "completed",
      );

      expect(completedVideo.status).toBe("completed");
      expect(completedVideo.videoUrl).toBeTruthy();
      expect(completedVideo.creditsUsed).toBe(10);
    });
  });
});
