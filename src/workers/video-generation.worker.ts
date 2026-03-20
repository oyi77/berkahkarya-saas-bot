/**
 * Video Generation Worker
 *
 * BullMQ worker that processes video generation jobs off the videoQueue.
 * Supports single-scene (fallback chain) and multi-scene (extended/chaining) flows.
 * On success: updates VideoService, sends video to user via Telegram.
 * On failure: refunds credits, notifies user.
 */

import { Worker, Job } from 'bullmq';
import { redis } from '@/config/redis';
import { logger } from '@/utils/logger';
import { VideoService } from '@/services/video.service';
import { UserService } from '@/services/user.service';
import { GeminiGenService } from '@/services/geminigen.service';
import { generateVideoWithFallback } from '@/services/video-fallback.service';
import { getVideoCreditCost } from '@/config/pricing';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type { Telegram } from 'telegraf';

const exec = promisify(execCallback);

const VIDEO_DIR = process.env.VIDEO_DIR || '/tmp/videos';

// ── Job payload type ──

export interface VideoGenerationJobData {
  jobId: string;
  niche: string;
  platform: string;
  duration: number;
  scenes: number;
  storyboard: Array<{ scene: number; duration: number; description: string }>;
  referenceImage?: string | null;
  userId: string;   // bigint serialised as string
  chatId: number;
}

// ── Helpers (mirrored from create.ts) ──

function buildPrompt(description: string, platform: string, duration: number): string {
  return `${duration}s ${description}, high quality, ${platform} format, professional style`;
}

function getAspectRatio(platform: string): string {
  const ratios: Record<string, string> = {
    tiktok: '9:16',
    shorts: '9:16',
    reels: '9:16',
    facebook: '16:9',
    youtube: '16:9',
  };
  return ratios[platform] || '9:16';
}

function getStyleForNiche(niche: string): string {
  const styles: Record<string, string> = {
    trading: 'professional',
    fitness: 'energetic',
    cooking: 'appetizing',
    tech: 'modern',
    travel: 'cinematic',
    education: 'clear',
  };
  return styles[niche] || 'professional';
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  await exec(`wget -q -O "${outputPath}" "${url}"`);
}

async function concatenateVideos(inputPaths: string[], outputPath: string): Promise<void> {
  if (inputPaths.length === 1) {
    fs.copyFileSync(inputPaths[0], outputPath);
    return;
  }
  if (inputPaths.length === 2) {
    await exec(
      `ffmpeg -y -i "${inputPaths[0]}" -i "${inputPaths[1]}" ` +
      `-filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=4.5[v]" ` +
      `-map "[v]" "${outputPath}"`
    );
  } else if (inputPaths.length === 3) {
    await exec(
      `ffmpeg -y -i "${inputPaths[0]}" -i "${inputPaths[1]}" -i "${inputPaths[2]}" ` +
      `-filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=4.5[v1];` +
      `[v1][2:v]xfade=transition=fade:duration=0.5:offset=9.5[v]" ` +
      `-map "[v]" "${outputPath}"`
    );
  } else {
    const simpleListPath = path.join(VIDEO_DIR, `concat_${Date.now()}.txt`);
    const simpleListContent = inputPaths.map((p) => `file '${p}'`).join('\n');
    fs.writeFileSync(simpleListPath, simpleListContent);
    await exec(`ffmpeg -y -f concat -safe 0 -i "${simpleListPath}" -c copy "${outputPath}"`);
    try { fs.unlinkSync(simpleListPath); } catch (_) { /* ignore */ }
  }
}

// ── Single-scene generation ──

async function processSingleScene(
  job: Job<VideoGenerationJobData>,
  telegram: Telegram
): Promise<void> {
  const { jobId, niche, platform, duration, storyboard, referenceImage, userId, chatId } = job.data;
  const telegramId = BigInt(userId);

  await job.updateProgress(10);

  const scene = storyboard[0];
  const prompt = buildPrompt(scene.description, platform, duration);

  const result = await generateVideoWithFallback({
    prompt,
    duration,
    aspectRatio: getAspectRatio(platform),
    style: getStyleForNiche(niche),
    niche,
    referenceImage,
  });

  await job.updateProgress(60);

  if (!result.success || !result.videoUrl) {
    const creditCost = getVideoCreditCost(duration);
    await VideoService.updateStatus(jobId, 'failed', result.error);
    await UserService.refundCredits(telegramId, creditCost, jobId, result.error || 'Generation failed');
    await telegram.sendMessage(
      chatId,
      `Video generation failed\n\nJob ID: ${jobId}\nError: ${result.error || 'Generation failed'}\n\nCredits refunded.`,
    );
    return;
  }

  logger.info(`Video generated via ${result.provider} for job ${jobId}`);
  await job.updateProgress(80);

  const localPath = path.join(VIDEO_DIR, `${jobId}.mp4`);
  await downloadVideo(result.videoUrl, localPath);

  await VideoService.setOutput(jobId, { videoUrl: result.videoUrl, downloadUrl: localPath });
  await job.updateProgress(100);

  await sendVideoToUser(telegram, chatId, jobId, duration, platform, localPath);
}

// ── Multi-scene (extended) generation ──

async function processExtendedScenes(
  job: Job<VideoGenerationJobData>,
  telegram: Telegram
): Promise<void> {
  const { jobId, niche, platform, duration, scenes, storyboard, referenceImage, userId, chatId } = job.data;
  const telegramId = BigInt(userId);

  const sceneVideos: string[] = [];
  let lastUuid: string | null = null;

  for (let i = 0; i < scenes; i++) {
    const scene = storyboard[i];
    const scenePath = path.join(VIDEO_DIR, `${jobId}_scene_${i + 1}.mp4`);
    const prompt = buildPrompt(scene.description, platform, scene.duration);

    logger.info(`Generating scene ${i + 1}/${scenes} for job ${jobId}: ${scene.description}`);

    let result: any;
    if (i === 0) {
      result = await generateVideoWithFallback({
        prompt,
        duration: scene.duration,
        aspectRatio: getAspectRatio(platform),
        style: getStyleForNiche(niche),
        niche,
        referenceImage,
      });
    } else if (lastUuid) {
      try {
        result = await GeminiGenService.generateExtend({ prompt, refHistory: lastUuid });
      } catch (extendErr: any) {
        logger.warn(`Scene ${i + 1} extend failed, falling back to standalone: ${extendErr.message}`);
        result = await generateVideoWithFallback({
          prompt,
          duration: scene.duration,
          aspectRatio: getAspectRatio(platform),
          style: getStyleForNiche(niche),
          niche,
          referenceImage,
        });
      }
    } else {
      result = await generateVideoWithFallback({
        prompt,
        duration: scene.duration,
        aspectRatio: getAspectRatio(platform),
        style: getStyleForNiche(niche),
        niche,
        referenceImage,
      });
    }

    if (!result.success || !result.videoUrl) {
      const creditCost = getVideoCreditCost(duration);
      await VideoService.updateStatus(jobId, 'failed', `Scene ${i + 1} failed: ${result.error}`);
      await UserService.refundCredits(telegramId, creditCost, jobId, result.error || 'Generation failed');
      await telegram.sendMessage(
        chatId,
        `Video generation failed\n\nJob ID: ${jobId}\nScene ${i + 1}: ${result.error || 'Generation failed'}\n\nCredits refunded.`,
      );
      return;
    }

    await downloadVideo(result.videoUrl, scenePath);
    sceneVideos.push(scenePath);

    if (result.jobId) {
      lastUuid = result.jobId;
    }

    const progress = Math.round(((i + 1) / scenes) * 80);
    await job.updateProgress(progress);
    await VideoService.updateProgress(jobId, progress);
  }

  // Concatenate scenes
  const finalPath = path.join(VIDEO_DIR, `${jobId}.mp4`);
  logger.info(`Concatenating ${scenes} scenes for job ${jobId}...`);
  await concatenateVideos(sceneVideos, finalPath);

  await VideoService.updateProgress(jobId, 100);
  await VideoService.updateStatus(jobId, 'completed');
  await job.updateProgress(100);

  await sendVideoToUser(telegram, chatId, jobId, duration, platform, finalPath);

  // Cleanup scene files
  for (const sp of sceneVideos) {
    try { fs.unlinkSync(sp); } catch (_) { /* ignore */ }
  }
}

// ── Notification helper ──

async function sendVideoToUser(
  telegram: Telegram,
  chatId: number,
  jobId: string,
  duration: number,
  platform: string,
  localPath: string
): Promise<void> {
  try {
    if (fs.existsSync(localPath)) {
      await telegram.sendVideo(chatId, { source: localPath }, {
        caption:
          `Video Ready!\n\n` +
          `Job ID: ${jobId}\n` +
          `Duration: ${duration}s\n` +
          `Platform: ${platform}`,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Publish to Social Media', callback_data: `publish_video_${jobId}` }],
            [
              { text: 'Create Another', callback_data: 'create_video' },
              { text: 'My Videos', callback_data: 'videos_list' },
            ],
          ],
        },
      });
    } else {
      await telegram.sendMessage(
        chatId,
        `Video Ready!\n\nJob ID: ${jobId}\nDuration: ${duration}s\nPlatform: ${platform}\n\nNote: Local file unavailable, but video is saved.`,
      );
    }
  } catch (sendErr: any) {
    logger.error(`Failed to send video notification for job ${jobId}:`, sendErr);
  }
}

// ── Worker initialisation ──

let workerInstance: Worker<VideoGenerationJobData> | null = null;

/**
 * Start the BullMQ video generation worker.
 * Pass the bot instance so the worker can send Telegram notifications.
 * Returns the Worker so callers can listen to events if needed.
 */
export function startVideoWorker(bot: { telegram: Telegram }): Worker<VideoGenerationJobData> {
  if (workerInstance) {
    logger.warn('Video worker already running, returning existing instance');
    return workerInstance;
  }

  // Ensure video directory exists
  if (!fs.existsSync(VIDEO_DIR)) {
    fs.mkdirSync(VIDEO_DIR, { recursive: true });
  }

  const telegram = bot.telegram;

  workerInstance = new Worker<VideoGenerationJobData>(
    'video-generation',
    async (job: Job<VideoGenerationJobData>) => {
      logger.info(`Processing video job ${job.id} (jobId=${job.data.jobId}, scenes=${job.data.scenes})`);

      try {
        if (job.data.scenes === 1) {
          await processSingleScene(job, telegram);
        } else {
          await processExtendedScenes(job, telegram);
        }
        logger.info(`Video job ${job.id} completed successfully`);
      } catch (error: any) {
        logger.error(`Video job ${job.id} failed with unhandled error:`, error);

        // Last-resort refund and notification
        try {
          const telegramId = BigInt(job.data.userId);
          const creditCost = getVideoCreditCost(job.data.duration);
          await VideoService.updateStatus(job.data.jobId, 'failed', error.message);
          await UserService.refundCredits(telegramId, creditCost, job.data.jobId, error.message);
          await telegram.sendMessage(
            job.data.chatId,
            `Video generation failed\n\nJob ID: ${job.data.jobId}\nError: ${error.message}\n\nCredits refunded.`,
          );
        } catch (refundErr) {
          logger.error('Failed to handle job failure cleanup:', refundErr);
        }

        throw error; // Let BullMQ handle retry logic
      }
    },
    {
      connection: redis,
      concurrency: 3,
    }
  );

  workerInstance.on('completed', (job) => {
    logger.info(`Video worker: job ${job.id} completed`);
  });

  workerInstance.on('failed', (job, err) => {
    logger.error(`Video worker: job ${job?.id} failed:`, err);
  });

  workerInstance.on('error', (err) => {
    logger.error('Video worker error:', err);
  });

  logger.info('Video generation worker started (concurrency: 3)');
  return workerInstance;
}
