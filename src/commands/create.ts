/**
 * Create Command - With Video Extend Technique
 *
 * Handles video creation using sequential chaining for longer videos
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';
import { VideoService } from '@/services/video.service';
import { GeminiGenService } from '@/services/geminigen.service';
import { getCreditCost } from '@/services/video-generation.service';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const exec = promisify(execCallback);

// Video storage directory
const VIDEO_DIR = process.env.VIDEO_DIR || '/tmp/videos';
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

const GENERATION_MODES = {
  'short': { maxDuration: 15, scenes: 1, name: 'Short Clip (4-15s)' },
};

/**
 * Handle /create command
 */
export async function createCommand(ctx: BotContext): Promise<void> {
  try {
    const user = ctx.from;
    if (!user) {
      await ctx.reply('❌ Unable to identify user.');
      return;
    }

    // Check credits
    const dbUser = await UserService.findByTelegramId(BigInt(user.id.toString()));
    if (!dbUser) {
      await ctx.reply('❌ User not found. Please start with /start');
      return;
    }

    if (Number(dbUser.creditBalance) < 0.5) {
      await ctx.reply(
        `❌ Insufficient credits.\n\n` +
        `Current balance: ${dbUser.creditBalance}\n` +
        `Minimum required: 0.5 credits\n\n` +
        `Use /topup to add more credits.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '💰 Top Up Now', callback_data: 'topup' }],
            ],
          },
        }
      );
      return;
    }

    // Show generation mode selection (only short mode for MVP)
    await ctx.reply(
      `🎬 **Create New Video**\n\n` +
      `Current credits: ${dbUser.creditBalance}\n\n` +
      `Select video duration:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🎯 5 seconds (0.5 credits)', callback_data: 'duration_5' },
            ],
            [
              { text: '🎯 10 seconds (0.5 credits)', callback_data: 'duration_10' },
            ],
            [
              { text: '🎯 15 seconds (0.5 credits)', callback_data: 'duration_15' },
            ],
            [
              { text: '💰 Need more credits?', callback_data: 'topup' },
            ],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('Error in create command:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

/**
 * Handle duration selection - simplified for MVP (no mode selection needed)
 */
export async function handleDurationSelection(ctx: BotContext, durationStr: string): Promise<void> {
  try {
    if (!ctx.session) return;
    
    const duration = parseInt(durationStr.replace('duration_', ''));

    // Validate duration (must be 4-15 seconds for AI)
    if (duration < 4 || duration > 15) {
      await ctx.answerCbQuery('Duration must be between 4-15 seconds');
      return;
    }

    const user = ctx.from;
    if (!user) return;

    // Get or create user
    let dbUser = await UserService.findByTelegramId(BigInt(user.id.toString()));
    
    // If user doesn't exist, create them
    if (!dbUser) {
      dbUser = await UserService.create({
        telegramId: BigInt(user.id),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
      });
      await ctx.reply(`👋 Welcome! You received 3 free credits to try.`);
    }

    // Fixed credit cost: 0.5 credits for any video up to 15s
    const creditCost = 0.5;

    if (Number(dbUser.creditBalance) < creditCost) {
      await ctx.answerCbQuery('Insufficient credits');
      await ctx.reply(
        `❌ Need ${creditCost} credits. You have ${dbUser.creditBalance}\n\n` +
        `Use /topup to add more credits.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '💰 Top Up Credits', callback_data: 'topup' }],
            ],
          },
        }
      );
      return;
    }

    // Default values for MVP
    const niche = 'fnb';  // Default niche
    const platform = 'tiktok';  // Default platform
    const scenes = 1;

    // Generate storyboard
    const storyboard = generateStoryboard(niche, platform, duration, scenes);

    // Create video job
    const video = await VideoService.createJob({
      userId: dbUser.telegramId,
      niche,
      platform,
      duration,
      scenes,
      title: `Video ${new Date().toLocaleDateString('id-ID')}`,
    });

    // Deduct credits
    await UserService.deductCredits(dbUser.telegramId, creditCost);

    // Ask for image reference
    await ctx.editMessageText(
      `✅ **Video Job Created!**\n\n` +
      `Job ID: \`${video.jobId}\`\n` +
      `Duration: ${duration}s\n` +
      `Credits used: ${creditCost}\n\n` +
      `📸 **Step 2: Add Reference Image**\n\n` +
      `Send me a photo/video to use as reference,\n` +
      `OR reply /skip to use AI-generated content.`,
      { parse_mode: 'Markdown' }
    );

    // Update session
    ctx.session.videoCreation = {
      mode: 'short',
      niche,
      platform,
      totalDuration: duration,
      scenes,
      storyboard,
      jobId: video.jobId,
      waitingForImage: true,
    };

  } catch (error) {
    logger.error('Error handling duration selection:', error);
    await ctx.answerCbQuery('Error. Please try again.');
  }
}

/**
 * Generate storyboard
 */
function generateStoryboard(
  niche: string,
  platform: string,
  totalDuration: number,
  scenes: number
): Array<{scene: number; duration: number; description: string}> {
  const durationPerScene = Math.floor(totalDuration / scenes);
  
  const templates: { [key: string]: string[] } = {
    'trading': [
      'Chart analysis with price movement',
      'Candlestick pattern formation',
      'Entry signal with stop loss marked',
      'Profit target achievement',
    ],
    'fitness': [
      'Warm-up and preparation',
      'Exercise demonstration',
      'Form correction focus',
      'Cool down and results',
    ],
    'cooking': [
      'Ingredients preparation',
      'Cooking process action',
      'Plating presentation',
      'Final appetizing shot',
    ],
    'tech': [
      'Product feature introduction',
      'Problem/solution showcase',
      'Benefits demonstration',
      'Call to action',
    ],
    'travel': [
      'Destination overview shot',
      'Key attractions highlight',
      'Experience/action sequence',
      'Memorable closing moment',
    ],
  };

  const scenesList = templates[niche] || templates['tech'];
  
  return scenesList.slice(0, scenes).map((desc, i) => ({
    scene: i + 1,
    duration: durationPerScene,
    description: desc,
  }));
}

/**
 * Generate single scene video
 */
async function generateVideoAsync(
  ctx: BotContext,
  jobId: string,
  niche: string,
  platform: string,
  duration: number,
  storyboard: Array<any>
): Promise<void> {
  try {
    logger.info(`🎬 Starting single-scene video generation for job ${jobId}`);

    const scene = storyboard[0];
    const prompt = buildPrompt(scene.description, platform, duration);

    // Call GeminiGen API
    const result = await GeminiGenService.generateVideo({
      prompt,
      duration,
      aspectRatio: getAspectRatio(platform),
      style: getStyleForNiche(niche),
    });

    if (!result.success || !result.videoUrl) {
      logger.error('Video generation failed:', result.error);
      await VideoService.updateStatus(jobId, 'failed', result.error);
      await sendErrorNotification(ctx, jobId, result.error);
      return;
    }

    // Download and save
    const localPath = await downloadVideo(result.videoUrl, jobId);
    logger.info(`📥 Video downloaded: ${localPath}`);

    await VideoService.setOutput(jobId, { videoUrl: result.videoUrl, downloadUrl: localPath });
    await sendSuccessNotification(ctx, jobId, duration, platform);
    logger.info(`✅ Single-scene video generation complete for job ${jobId}`);

  } catch (error) {
    logger.error('Video generation error:', error);
    await VideoService.updateStatus(jobId, 'failed', String(error));
    await ctx.reply(`❌ Error generating video: ${error}`);
  }
}

/**
 * Generate extended video with sequential chaining
 */
async function generateExtendedVideoAsync(
  ctx: BotContext,
  jobId: string,
  niche: string,
  platform: string,
  totalDuration: number,
  scenes: number,
  storyboard: Array<any>,
  referenceImage?: string | null
): Promise<void> {
  try {
    logger.info(`🎬 Starting extended video generation for job ${jobId} (${scenes} scenes)`);

    const sceneVideos: string[] = [];
    let lastFramePath: string | null = referenceImage || null;

    // Generate each scene sequentially
    for (let i = 0; i < scenes; i++) {
      const scene = storyboard[i];
      const scenePath = path.join(VIDEO_DIR, `${jobId}_scene_${i + 1}.mp4`);
      
      logger.info(`🎬 Generating scene ${i + 1}/${scenes}: ${scene.description}`);

      const prompt = buildPrompt(scene.description, platform, scene.duration);
      
      // Generate video (with last frame as reference if available)
      const result = await GeminiGenService.generateVideo({
        prompt,
        duration: scene.duration,
        aspectRatio: getAspectRatio(platform),
        style: getStyleForNiche(niche),
      });

      if (!result.success || !result.videoUrl) {
        logger.error(`Scene ${i + 1} generation failed:`, result.error);
        await VideoService.updateStatus(jobId, 'failed', `Scene ${i + 1} failed: ${result.error}`);
        await sendErrorNotification(ctx, jobId, `Scene ${i + 1}: ${result.error}`);
        return;
      }

      // Download scene
      await downloadVideoToPath(result.videoUrl, scenePath);
      logger.info(`📥 Scene ${i + 1} downloaded: ${scenePath}`);
      sceneVideos.push(scenePath);

      // Extract last frame for next scene
      if (i < scenes - 1) {
        lastFramePath = await extractLastFrame(scenePath, jobId, i);
        logger.info(`📸 Last frame extracted: ${lastFramePath}`);
      }

      // Update progress
      const progress = Math.round(((i + 1) / scenes) * 80);
      await VideoService.updateProgress(jobId, progress);
    }

    // Concatenate scenes with crossfade
    const finalPath = path.join(VIDEO_DIR, `${jobId}.mp4`);
    logger.info(`🎞️ Concatenating ${scenes} scenes...`);
    
    await concatenateVideos(sceneVideos, finalPath);
    logger.info(`✅ Concatenation complete: ${finalPath}`);

    // Update status to completed
    await VideoService.updateProgress(jobId, 100);
    await VideoService.updateStatus(jobId, 'completed');

    await sendSuccessNotification(ctx, jobId, totalDuration, platform);
    logger.info(`✅ Extended video generation complete for job ${jobId}`);

  } catch (error) {
    logger.error('Extended video generation error:', error);
    await VideoService.updateStatus(jobId, 'failed', String(error));
    await ctx.reply(`❌ Error generating video: ${error}`);
  }
}

/**
 * Extract last frame from video
 */
async function extractLastFrame(videoPath: string, jobId: string, sceneIndex: number): Promise<string> {
  const framePath = path.join(VIDEO_DIR, `${jobId}_scene_${sceneIndex + 1}_last_frame.png`);
  
  await exec(`ffmpeg -i "${videoPath}" -vf "select=eq(pict_type\\,I)" -vsync vfr -frames:v 1 "${framePath}"`);
  
  return framePath;
}

/**
 * Download video to specific path
 */
async function downloadVideoToPath(url: string, outputPath: string): Promise<void> {
  await exec(`wget -O "${outputPath}" "${url}"`);
}

/**
 * Concatenate videos with crossfade transitions
 */
async function concatenateVideos(inputPaths: string[], outputPath: string): Promise<void> {
  // Create concat list file
  const listPath = path.join(VIDEO_DIR, 'concat_list.txt');
  const listContent = inputPaths.map((p, i) => `file '${p}'\nduration 0.5`).join('\n');
  fs.writeFileSync(listPath, listContent);

  // Concatenate with xfade crossfade
  if (inputPaths.length === 2) {
    await exec(`ffmpeg -i "${inputPaths[0]}" -i "${inputPaths[1]}" -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=4.5[v]" -map "[v]" "${outputPath}"`);
  } else if (inputPaths.length === 3) {
    await exec(`ffmpeg -i "${inputPaths[0]}" -i "${inputPaths[1]}" -i "${inputPaths[2]}" -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=4.5[v1];[v1][2:v]xfade=transition=fade:duration=0.5:offset=9.5[v]" -map "[v]" "${outputPath}"`);
  } else {
    // Fallback: simple concat without crossfade
    const simpleListPath = path.join(VIDEO_DIR, 'simple_list.txt');
    const simpleListContent = inputPaths.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(simpleListPath, simpleListContent);
    await exec(`ffmpeg -f concat -safe 0 -i "${simpleListPath}" -c copy "${outputPath}"`);
  }
}

/**
 * Download video from URL
 */
async function downloadVideo(url: string, jobId: string): Promise<string> {
  const outputPath = path.join(VIDEO_DIR, `${jobId}.mp4`);
  await exec(`wget -O "${outputPath}" "${url}"`);
  return outputPath;
}

/**
 * Build prompt based on scene description
 */
function buildPrompt(description: string, platform: string, duration: number): string {
  return `${duration}s ${description}, high quality, ${platform} format, professional style`;
}

/**
 * Get aspect ratio for platform
 */
function getAspectRatio(platform: string): string {
  const ratios: { [key: string]: string } = {
    'tiktok': '9:16',
    'shorts': '9:16',
    'reels': '9:16',
    'facebook': '16:9',
    'youtube': '16:9',
  };
  return ratios[platform] || '9:16';
}

/**
 * Get style for niche
 */
function getStyleForNiche(niche: string): string {
  const styles: { [key: string]: string } = {
    'trading': 'professional',
    'fitness': 'energetic',
    'cooking': 'appetizing',
    'tech': 'modern',
    'travel': 'cinematic',
    'education': 'clear',
  };
  return styles[niche] || 'professional';
}

/**
 * Send success notification
 */
async function sendSuccessNotification(
  ctx: BotContext,
  jobId: string,
  duration: number,
  platform: string
): Promise<void> {
  const video = await VideoService.getByJobId(jobId);
  if (!video?.downloadUrl) return;

  await ctx.replyWithVideo(
    { source: video.downloadUrl },
    {
      caption: `✅ **Video Ready!**\n\n` +
        `Job ID: ${jobId}\n` +
        `Duration: ${duration}s\n` +
        `Platform: ${platform}\n\n` +
        `Tip: Use /social to publish to social media`,
      parse_mode: 'Markdown',
    }
  );
}

/**
 * Send error notification
 */
async function sendErrorNotification(ctx: BotContext, jobId: string, error: string): Promise<void> {
  await ctx.reply(
    `❌ Video generation failed\n\n` +
    `Job ID: ${jobId}\n` +
    `Error: ${error}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 Try Again', callback_data: `retry_${jobId}` }],
        ],
      },
    }
  );
}

// Export functions for message handler
export { generateVideoAsync, generateExtendedVideoAsync };
