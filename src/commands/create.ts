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
import { generateVideoWithFallback } from '@/services/video-fallback.service';
import { NICHES, generateStoryboard as genStoryboardFromService } from '@/services/video-generation.service';
import { PostAutomationService } from '@/services/postautomation.service';
import { SceneConsistencyEngine } from '@/services/scene-consistency.service';
import { getVideoCreditCost } from '@/config/pricing';
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

    // Show niche picker (Phase 1)
    const nicheKeys = Object.keys(NICHES);
    const nicheButtons: any[][] = [];
    for (let i = 0; i < nicheKeys.length; i += 2) {
      const row: any[] = [];
      const key1 = nicheKeys[i];
      const n1 = NICHES[key1 as keyof typeof NICHES];
      row.push({ text: `${n1.emoji} ${n1.name}`, callback_data: `select_niche_${key1}` });
      if (nicheKeys[i + 1]) {
        const key2 = nicheKeys[i + 1];
        const n2 = NICHES[key2 as keyof typeof NICHES];
        row.push({ text: `${n2.emoji} ${n2.name}`, callback_data: `select_niche_${key2}` });
      }
      nicheButtons.push(row);
    }
    nicheButtons.push([{ text: '💰 Need more credits?', callback_data: 'topup' }]);

    await ctx.reply(
      `🎬 Create New Video\n\n` +
      `Current credits: ${dbUser.creditBalance}\n\n` +
      `Pilih kategori konten:`,
      {
        reply_markup: {
          inline_keyboard: nicheButtons,
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
    
    // Parse duration and scenes (format: duration_15_2 or duration_30_4)
    let duration: number, scenes: number | null;
    
    if (durationStr === 'custom_duration') {
      await ctx.reply(
        `🎯 **Custom Duration**\n\n` +
        `Send number of seconds you want (e.g., 45, 60, 90, 120)\n\n` +
        `Note: System will auto-calculate scenes (15s max per scene)\n` +
        `Example: 60s = 4 scenes (15s each)`,
      );
      ctx.session.state = 'CUSTOM_DURATION_INPUT';
      return;
    }
    
    const parts = durationStr.replace('duration_', '').split('_');
    duration = parseInt(parts[0]);
    scenes = parts[1] ? parseInt(parts[1]) : null;

    // Auto-calculate scenes if not specified
    if (!scenes) {
      // Try to fit into max 15s per scene, then 10s, then 6s
      // Find the best combination for total duration
      let bestFit = { scenes: 0, durationPerScene: 0, error: Infinity };
      
      for (const durationPerScene of [15, 10, 6]) {
        const calculatedScenes = Math.ceil(duration / durationPerScene);
        const totalDuration = calculatedScenes * durationPerScene;
        const error = Math.abs(totalDuration - duration);
        
        if (error < bestFit.error) {
          bestFit = { scenes: calculatedScenes, durationPerScene, error };
        }
      }
      
      scenes = bestFit.scenes;
      duration = scenes * bestFit.durationPerScene;
      logger.info(`📊 Auto-calculated: ${scenes} scenes × ${bestFit.durationPerScene}s = ${duration}s total`);
    }

    // Validate duration
    if (duration < 6 || duration > 300) {
      await ctx.answerCbQuery('Duration must be 6-300 seconds');
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

    const creditCost = getVideoCreditCost(duration);

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

    const niche = ctx.session.selectedNiche || 'fnb';
    const selectedStyles = ctx.session.selectedStyles || [];
    const platform = 'tiktok';

    const storyboard = genStoryboardFromService(niche, selectedStyles, duration, scenes);

    await ctx.editMessageText(
      `🎬 **Almost Ready!**\n\n` +
      `📋 Niche: ${niche}\n` +
      `⏱ Duration: ${duration}s (${scenes} scene${scenes > 1 ? 's' : ''})\n` +
      `💰 Credit cost: ${creditCost}\n\n` +
      `📸 **Send a reference image** for your video,\n` +
      `or type /skip to let AI generate everything.`,
      { parse_mode: 'Markdown' }
    );

    ctx.session.videoCreation = {
      mode: scenes > 1 ? 'extended' : 'short',
      niche,
      platform,
      totalDuration: duration,
      scenes,
      storyboard,
      jobId: '',
      waitingForImage: true,
    };

  } catch (error) {
    logger.error('Error handling duration selection:', error);
    await ctx.answerCbQuery('Error. Please try again.');
  }
}

// Storyboard generation delegated to video-generation.service.ts (genStoryboardFromService)

/**
 * Handle niche selection
 */
export async function handleNicheSelection(ctx: BotContext, nicheKey: string): Promise<void> {
  try {
    if (!ctx.session) return;

    const nicheConfig = NICHES[nicheKey];
    if (!nicheConfig) {
      await ctx.answerCbQuery('Invalid niche');
      return;
    }

    ctx.session.selectedNiche = nicheKey;

    const styleButtons: any[][] = (nicheConfig.styles as readonly string[]).flatMap((s) => {
      if (!s || typeof s !== 'string') return [];
      return [[{ text: s.charAt(0).toUpperCase() + s.slice(1), callback_data: `select_style_${s}` }]];
    });
    styleButtons.push([{ text: '← Ganti Kategori', callback_data: 'create_video' }]);

    await ctx.editMessageText(
      `✅ ${nicheConfig.emoji} ${nicheConfig.name} dipilih!\n\n` +
      `Pilih style video:`,
      {
        reply_markup: {
          inline_keyboard: styleButtons,
        },
      }
    );
  } catch (error) {
    logger.error('Error handling niche selection:', error);
    await ctx.answerCbQuery('Error. Please try again.');
  }
}

/**
 * Handle style selection - then show duration picker
 */
export async function handleStyleSelection(ctx: BotContext, styleKey: string): Promise<void> {
  try {
    if (!ctx.session) return;

    ctx.session.selectedStyles = [styleKey];

    // Show duration picker (reuse existing layout)
    await ctx.editMessageText(
      `🎬 Style dipilih!\n\n` +
      `💡 Extend Mode: Duration sepanjang apapun!\n\n` +
      `Pilih total duration (sistem akan otomatis hitung scenes):`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '⚡ Quick: 15s (1 scene)', callback_data: 'duration_15_1' },
              { text: '📊 Standard: 30s (2 scenes)', callback_data: 'duration_30_2' },
            ],
            [
              { text: '🎬 Long: 60s (4 scenes)', callback_data: 'duration_60_4' },
              { text: '📹 Extended: 120s (8 scenes)', callback_data: 'duration_120_8' },
            ],
            [
              { text: '🎯 Custom Duration', callback_data: 'custom_duration' },
            ],
            [
              { text: '← Ganti Kategori', callback_data: 'create_video' },
            ],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('Error handling style selection:', error);
    await ctx.answerCbQuery('Error. Please try again.');
  }
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
  storyboard: Array<any>,
  referenceImage?: string | null
): Promise<void> {
  try {
    logger.info(`🎬 Starting single-scene video generation for job ${jobId}`);

    const scene = storyboard[0];
    const prompt = buildPrompt(scene.description, platform, duration);

    // Use multi-provider fallback chain
    const result = await generateVideoWithFallback({
      prompt,
      duration,
      aspectRatio: getAspectRatio(platform),
      style: getStyleForNiche(niche),
      niche,
      referenceImage,
    });

    if (!result.success || !result.videoUrl) {
      logger.error('Video generation failed (all providers):', result.error);
      await VideoService.updateStatus(jobId, 'failed', result.error);
      const telegramId = BigInt(ctx.from!.id);
      const creditCost = getVideoCreditCost(duration);
      await UserService.refundCredits(telegramId, creditCost, jobId, result.error || 'Generation failed');
      await sendErrorNotification(ctx, jobId, `${result.error || 'Generation failed'}\n\n💰 Credits refunded.`);
      return;
    }

    logger.info(`🎬 Video generated via ${result.provider}`);

    // Download and save
    const localPath = await downloadVideo(result.videoUrl, jobId);
    logger.info(`📥 Video downloaded: ${localPath}`);

    await VideoService.setOutput(jobId, { videoUrl: result.videoUrl, downloadUrl: localPath });
    await sendSuccessNotification(ctx, jobId, duration, platform);
    logger.info(`✅ Single-scene video generation complete for job ${jobId}`);

  } catch (error) {
    logger.error('Video generation error:', error);
    await VideoService.updateStatus(jobId, 'failed', String(error));
    const telegramId = BigInt(ctx.from!.id);
    await UserService.refundCredits(telegramId, 0.5, jobId, String(error));
    await ctx.reply(`❌ Error generating video: ${error}\n\n💰 Credits refunded.`);
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
 let lastUuid: string | null = null;

 // Scene consistency: create memory after first scene, enrich subsequent prompts
 let sceneMemory: ReturnType<typeof SceneConsistencyEngine.createMemory> | null = null;

 // Derive the style key from session or fall back to the niche-based style
 const styleKey = (ctx.session?.selectedStyles?.[0]) || getStyleForNiche(niche);

 // Generate each scene sequentially
 for (let i =0; i < scenes; i++) {
 const scene = storyboard[i];
 const scenePath = path.join(VIDEO_DIR, `${jobId}_scene_${i +1}.mp4`);

 logger.info(`🎬 Generating scene ${i +1}/${scenes}: ${scene.description}`);
 let prompt = buildPrompt(scene.description, platform, scene.duration);

 // Apply scene consistency: create memory from scene 1, enrich scene 2+
 if (i === 0) {
   sceneMemory = SceneConsistencyEngine.createMemory(prompt, niche, styleKey, !!referenceImage);
 } else if (sceneMemory) {
   prompt = SceneConsistencyEngine.enrichScenePrompt(prompt, sceneMemory, i);
 }

 // Scene 1: use multi-provider fallback chain
 // Scene 2+: use GeminiGen extend (only provider that supports scene chaining)
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
   // Try GeminiGen extend first, fallback to standalone generation
   try {
     result = await GeminiGenService.generateExtend({
       prompt,
       refHistory: lastUuid,
     });
   } catch (extendErr: any) {
     logger.warn(`🎬 Scene ${i + 1} extend failed, falling back to standalone: ${extendErr.message}`);
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
   // No lastUuid — generate standalone
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
  logger.error(`Scene ${i + 1} generation failed:`, result.error);
  await VideoService.updateStatus(jobId, 'failed', `Scene ${i + 1} failed: ${result.error}`);
  const telegramId = BigInt(ctx.from!.id);
  const creditCost = getVideoCreditCost(totalDuration);
  await UserService.refundCredits(telegramId, creditCost, jobId, result.error || 'Generation failed');
  await sendErrorNotification(ctx, jobId, `Scene ${i + 1}: ${result.error || 'Generation failed'}\n\n💰 Credits refunded.`);
  return;
 }

 // Download scene
 await downloadVideoToPath(result.videoUrl, scenePath);
 logger.info(`📥 Scene ${i +1} downloaded: ${scenePath}`);
 sceneVideos.push(scenePath);

 // Save UUID for next extend
 if (result.jobId) {
 lastUuid = result.jobId;
 }

 // Update progress
 const progress = Math.round(((i +1) / scenes) *80);
 await VideoService.updateProgress(jobId, progress);
 }

 // Concatenate scenes with crossfade
 const finalPath = path.join(VIDEO_DIR, `${jobId}.mp4`);
 logger.info(`🎞️ Concatenating ${scenes} scenes...`);
 await concatenateVideos(sceneVideos, finalPath);
 logger.info(`✅ Concatenation complete: ${finalPath}`);

 // Update status to completed
 await VideoService.updateProgress(jobId,100);
 await VideoService.updateStatus(jobId, 'completed');

 await sendSuccessNotification(ctx, jobId, totalDuration, platform);
 logger.info(`✅ Extended video generation complete for job ${jobId}`);

 } catch (error) {
  logger.error('Extended video generation error:', error);
  await VideoService.updateStatus(jobId, 'failed', String(error));
  const telegramId = BigInt(ctx.from!.id);
  await UserService.refundCredits(telegramId, 0.5, jobId, String(error));
  await ctx.reply(`❌ Error generating video: ${error}\n\n💰 Credits refunded.`);
 }
}

// extractLastFrame removed — frame extraction handled by geminigen.service.ts

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
  const listContent = inputPaths.map((p) => `file '${p}'\nduration 0.5`).join('\n');
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

  // Build button rows dynamically based on whether the user has
  // connected social accounts.
  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

  // Row 1: manual publish (always shown)
  keyboard.push([
    { text: '📤 Publish to Social Media', callback_data: `publish_video_${jobId}` },
  ]);

  // Row 2: auto-post to all connected accounts (only if accounts exist)
  const userId = ctx.from?.id;
  if (userId) {
    try {
      const hasAccounts = await PostAutomationService.hasConnectedAccounts(BigInt(userId));
      if (hasAccounts) {
        keyboard.push([
          { text: '🚀 Auto-Post to All', callback_data: `auto_post_${jobId}` },
        ]);
      }
    } catch (err) {
      logger.warn('Failed to check connected accounts for auto-post button:', err);
    }
  }

  // Row 3: create another / my videos
  keyboard.push([
    { text: '🎬 Create Another', callback_data: 'create_video' },
    { text: '📁 My Videos', callback_data: 'videos_list' },
  ]);

  await ctx.replyWithVideo(
    { source: video.downloadUrl },
    {
      caption: `✅ **Video Ready!**\n\n` +
        `Job ID: ${jobId}\n` +
        `Duration: ${duration}s\n` +
        `Platform: ${platform}`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard,
      },
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
          [{ text: '🔄 Try Again', callback_data: `video_retry_${jobId}` }],
        ],
      },
    }
  );
}

// Export functions for message handler
export { generateVideoAsync, generateExtendedVideoAsync };
