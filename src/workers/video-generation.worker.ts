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
import { actionableError } from '@/utils/errors';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type { Telegram } from 'telegraf';
import { MARKETING_HOOKS, MARKETING_CTAS } from '@/config/audio-subtitle-engine';
import { VideoPostProcessing } from '@/services/video-post-processing.service';
import { AudioVOService } from '@/services/audio-vo.service';

const exec = promisify(execCallback);

const VIDEO_DIR = process.env.VIDEO_DIR || '/tmp/videos';

// ── Progress notification helpers ──

/** Send a silent progress message to the user (no notification sound). */
async function notifyProgress(telegram: Telegram, chatId: number, text: string): Promise<void> {
  try {
    await telegram.sendMessage(chatId, text, { disable_notification: true });
  } catch (err) {
    logger.warn('Failed to send progress notification:', err);
  }
}

/**
 * Start a timeout watcher that sends a "still processing" message
 * if the job exceeds the given threshold (ms). Returns a cancel function.
 */
function startTimeoutWatcher(
  telegram: Telegram,
  chatId: number,
  thresholdMs: number = 4 * 60 * 1000
): () => void {
  const timer = setTimeout(() => {
    notifyProgress(
      telegram,
      chatId,
      '\u23f3 Still processing... Taking longer than usual. We\u2019ll notify you when ready.'
    );
  }, thresholdMs);

  return () => clearTimeout(timer);
}

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

/**
 * Concatenate video clips with professional niche-aware transitions.
 * Delegates to VideoPostProcessing which dynamically builds xfade filter
 * chains for ANY number of clips using ffprobe-measured durations.
 * Falls back to simple concat on failure.
 */
async function concatenateVideos(
  inputPaths: string[],
  outputPath: string,
  niche?: string
): Promise<void> {
  await VideoPostProcessing.concatenateWithTransitions(inputPaths, outputPath, {
    niche,
    transitionDuration: 0.5,
  });
}

// ── Single-scene generation ──

async function processSingleScene(
  job: Job<VideoGenerationJobData>,
  telegram: Telegram
): Promise<void> {
  const { jobId, niche, platform, duration, storyboard, referenceImage, userId, chatId } = job.data;
  const telegramId = BigInt(userId);

  const cancelTimeout = startTimeoutWatcher(telegram, chatId);

  await job.updateProgress(10);

  // Send initial progress after a short delay so user knows work started
  const initialTimer = setTimeout(() => {
    notifyProgress(telegram, chatId, '\ud83c\udfac Generating your video... This usually takes 1-3 minutes.');
  }, 30_000);

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

  clearTimeout(initialTimer);
  await job.updateProgress(60);

  if (!result.success || !result.videoUrl) {
    cancelTimeout();
    const creditCost = getVideoCreditCost(duration);
    await VideoService.updateStatus(jobId, 'failed', result.error);
    await UserService.refundCredits(telegramId, creditCost, jobId, result.error || 'Generation failed');
    const userMessage = actionableError(result.error || 'Generation failed', { jobId });
    await telegram.sendMessage(
      chatId,
      `Video generation failed\n\nJob ID: ${jobId}\n${userMessage}\n\nCredits refunded.`,
    );
    return;
  }

  logger.info(`Video generated via ${result.provider} for job ${jobId}`);
  await job.updateProgress(80);

  await notifyProgress(telegram, chatId, '\u2705 Video generated! Downloading and processing...');

  const localPath = path.join(VIDEO_DIR, `${jobId}.mp4`);
  await downloadVideo(result.videoUrl, localPath);

  await notifyProgress(telegram, chatId, '\ud83d\udce6 Almost ready! Preparing delivery...');

  await VideoService.setOutput(jobId, { videoUrl: result.videoUrl, downloadUrl: localPath });
  await job.updateProgress(100);

  cancelTimeout();
  await sendVideoToUser(telegram, chatId, jobId, duration, platform, localPath, niche, storyboard);
}

// ── Multi-scene (extended) generation ──

async function processExtendedScenes(
  job: Job<VideoGenerationJobData>,
  telegram: Telegram
): Promise<void> {
  const { jobId, niche, platform, duration, scenes, storyboard, referenceImage, userId, chatId } = job.data;
  const telegramId = BigInt(userId);

  const cancelTimeout = startTimeoutWatcher(telegram, chatId);

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
      cancelTimeout();
      const creditCost = getVideoCreditCost(duration);
      await VideoService.updateStatus(jobId, 'failed', `Scene ${i + 1} failed: ${result.error}`);
      await UserService.refundCredits(telegramId, creditCost, jobId, result.error || 'Generation failed');
      const sceneUserMessage = actionableError(result.error || 'Generation failed', { jobId });
      await telegram.sendMessage(
        chatId,
        `Video generation failed (scene ${i + 1})\n\nJob ID: ${jobId}\n${sceneUserMessage}\n\nCredits refunded.`,
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

    // Notify user of scene progress
    await notifyProgress(
      telegram,
      chatId,
      `\ud83c\udfac Scene ${i + 1}/${scenes} complete! ${progress}% done...`
    );
  }

  // Concatenate scenes with professional niche-aware transitions
  await notifyProgress(telegram, chatId, '\u2702\ufe0f Combining scenes with transitions...');

  const rawConcatPath = path.join(VIDEO_DIR, `${jobId}_raw.mp4`);
  const finalPath = path.join(VIDEO_DIR, `${jobId}.mp4`);
  logger.info(`Concatenating ${scenes} scenes for job ${jobId} (niche: ${niche})...`);
  await concatenateVideos(sceneVideos, rawConcatPath, niche);

  // Post-processing: color grading
  await notifyProgress(telegram, chatId, '\ud83c\udfa8 Applying color grading...');
  try {
    await VideoPostProcessing.postProcess(rawConcatPath, finalPath, {
      niche,
      platform,
      colorGrade: true,
    });
    logger.info(`Post-processing complete for job ${jobId}`);
  } catch (ppErr: any) {
    logger.warn(`Post-processing failed for job ${jobId}, using raw concat: ${ppErr.message}`);
    // Fallback: use raw concatenated video
    if (fs.existsSync(rawConcatPath)) {
      fs.copyFileSync(rawConcatPath, finalPath);
    }
  }

  // Cleanup raw concat temp file
  try { fs.unlinkSync(rawConcatPath); } catch (_) { /* ignore */ }

  await notifyProgress(telegram, chatId, '\ud83d\udce6 Almost ready!');

  await VideoService.updateProgress(jobId, 100);
  await VideoService.updateStatus(jobId, 'completed');
  await job.updateProgress(100);

  cancelTimeout();
  await sendVideoToUser(telegram, chatId, jobId, duration, platform, finalPath, niche, storyboard);

  // Cleanup scene files
  for (const sp of sceneVideos) {
    try { fs.unlinkSync(sp); } catch (_) { /* ignore */ }
  }
}

// ── Caption generation ──

interface GeneratedCaption {
  text: string;
  hashtags: string;
}

const NICHE_HASHTAGS: Record<string, string[]> = {
  fnb: ['foodie', 'foodtok', 'kuliner', 'makananenak', 'resep', 'foodlover'],
  food_culinary: ['foodie', 'foodtok', 'kuliner', 'makananenak', 'resep', 'foodlover'],
  realestate: ['properti', 'rumah', 'realestate', 'investasi', 'homedecor'],
  product: ['produk', 'review', 'unboxing', 'belanja', 'shopee', 'tokopedia'],
  beauty: ['skincare', 'beauty', 'glowup', 'beautytips', 'makeup'],
  beauty_skincare: ['skincare', 'beauty', 'glowup', 'beautytips', 'makeup'],
  fashion: ['ootd', 'fashion', 'style', 'outfit', 'fashiontok'],
  fashion_lifestyle: ['ootd', 'fashion', 'style', 'outfit', 'fashiontok'],
  tech: ['tech', 'gadget', 'teknologi', 'review', 'unboxing'],
  tech_gadgets: ['tech', 'gadget', 'teknologi', 'review', 'unboxing'],
  travel: ['travel', 'jalan2', 'liburan', 'wisata', 'explore'],
  travel_adventure: ['travel', 'jalan2', 'liburan', 'wisata', 'explore'],
  fitness: ['fitness', 'workout', 'gym', 'health', 'fitnesstips'],
  fitness_health: ['fitness', 'workout', 'gym', 'health', 'fitnesstips'],
  education: ['edukasi', 'belajar', 'tips', 'tutorial', 'knowledge'],
  education_knowledge: ['edukasi', 'belajar', 'tips', 'tutorial', 'knowledge'],
  trading: ['trading', 'saham', 'crypto', 'investasi', 'finansial'],
  business_finance: ['bisnis', 'entrepreneur', 'bisnismuda', 'tips', 'sukses'],
  home_decor: ['homedecor', 'rumah', 'interior', 'dekorasi', 'aesthetic'],
};

const PLATFORM_HASHTAG_COUNT: Record<string, number> = {
  tiktok: 8,
  shorts: 5,
  reels: 6,
  instagram: 6,
  youtube: 4,
  facebook: 4,
};

function generateCaption(
  niche: string,
  storyboard: Array<{ scene: number; duration: number; description: string }>,
  platform: string
): GeneratedCaption {
  // Pick a random hook and CTA from marketing engine
  const hook = MARKETING_HOOKS[Math.floor(Math.random() * MARKETING_HOOKS.length)];
  const cta = MARKETING_CTAS[Math.floor(Math.random() * MARKETING_CTAS.length)];

  // Build description from storyboard scenes (first 2-3 relevant ones)
  const sceneDescriptions = storyboard
    .slice(0, 3)
    .map((s) => s.description)
    .filter(Boolean);

  const sceneText = sceneDescriptions.length > 0
    ? sceneDescriptions[0].charAt(0).toUpperCase() + sceneDescriptions[0].slice(1)
    : '';

  const captionText = sceneText
    ? `${hook.charAt(0).toUpperCase() + hook.slice(1)} \u2728\n\n${sceneText}\n\n\ud83d\udc49 ${cta.charAt(0).toUpperCase() + cta.slice(1)}`
    : `${hook.charAt(0).toUpperCase() + hook.slice(1)} \u2728\n\n\ud83d\udc49 ${cta.charAt(0).toUpperCase() + cta.slice(1)}`;

  // Build hashtags based on niche and platform
  const nicheKey = niche.toLowerCase();
  const nicheTags = NICHE_HASHTAGS[nicheKey] || ['viral', 'fyp', 'trending'];
  const baseTags = ['fyp', 'viral'];
  const allTags = [...new Set([...baseTags, ...nicheTags])];

  const maxTags = PLATFORM_HASHTAG_COUNT[platform] || 6;
  const selectedTags = allTags.slice(0, maxTags);
  const hashtags = selectedTags.map((t) => `#${t}`).join(' ');

  return { text: captionText, hashtags };
}

// ── Notification helper ──

async function sendVideoToUser(
  telegram: Telegram,
  chatId: number,
  jobId: string,
  duration: number,
  platform: string,
  localPath: string,
  niche?: string,
  storyboard?: Array<{ scene: number; duration: number; description: string }>
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

    // Send auto-generated caption as a follow-up message
    if (niche && storyboard) {
      try {
        const caption = generateCaption(niche, storyboard, platform);
        await telegram.sendMessage(
          chatId,
          `\ud83d\udccb Suggested Caption:\n\n${caption.text}\n\n${caption.hashtags}\n\n\ud83d\udca1 Copy and paste this when posting!`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '\ud83d\udccb Copy Caption', callback_data: `copy_caption_${jobId}` }],
              ],
            },
          }
        );
      } catch (captionErr) {
        logger.warn(`Failed to generate caption for job ${jobId}:`, captionErr);
      }
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
          const workerUserMessage = actionableError(error.message, { jobId: job.data.jobId });
          await telegram.sendMessage(
            job.data.chatId,
            `Video generation failed\n\nJob ID: ${job.data.jobId}\n${workerUserMessage}\n\nCredits refunded.`,
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
