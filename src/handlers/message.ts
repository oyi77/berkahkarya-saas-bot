/**
 * Message Handler
 * 
 * Handles all incoming messages
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { videosCommand } from '@/commands/videos';
import { createCommand } from '@/commands/create';
import { topupCommand } from '@/commands/topup';
import { profileCommand } from '@/commands/profile';
import { referralCommand } from '@/commands/referral';
import { subscriptionCommand } from '@/commands/subscription';
import { settingsCommand } from '@/commands/settings';
import { supportCommand } from '@/commands/support';
import { UserService } from '@/services/user.service';
import { ImageGenerationService } from '@/services/image.service';
import { ContentAnalysisService } from '@/services/content-analysis.service';
import { VideoService } from '@/services/video.service';
import { PostAutomationService } from '@/services/postautomation.service';
import { generateStoryboard } from '@/services/video-generation.service';
import { getVideoCreditCost } from '@/config/pricing';
import { generateVideoAsync, generateExtendedVideoAsync } from '@/commands/create';
import { enqueueVideoGeneration } from '@/config/queue';
import * as fs from 'fs';
import * as path from 'path';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);

// Forward declaration
async function handleDisassemble(_ctx: BotContext): Promise<void> {
  // Will be implemented in callback handler
}

export async function handleVideoCreationImage(
  ctx: BotContext,
  collectedPhotos?: Array<{ fileId: string; localPath?: string }>
): Promise<void> {
  if (!ctx.session?.videoCreation?.waitingForImage) {
    await ctx.reply('No active video creation. Please start with /create');
    return;
  }

  const { scenes, storyboard, totalDuration, niche, platform } = ctx.session.videoCreation;
  const telegramId = BigInt(ctx.from!.id);
  const creditCost = getVideoCreditCost(totalDuration);

  // Use collected photos from session or fallback to legacy single-photo
  const photos = collectedPhotos && collectedPhotos.length > 0
    ? collectedPhotos
    : ctx.session.videoCreation.uploadedPhotos || [];

  if (photos.length === 0) {
    await ctx.reply('No photos uploaded. Please send a reference image or /skip.');
    return;
  }

  let jobId: string | null = null;
  let creditsDeducted = false;

  try {
    const user = await UserService.findByTelegramId(telegramId);
    if (!user || Number(user.creditBalance) < creditCost) {
      await ctx.reply(`Not enough credits. Need ${creditCost}, have ${user?.creditBalance || 0}. Use /topup`);
      return;
    }

    // Use the FIRST photo as the primary reference image for video generation
    const primaryFileId = photos[0].fileId;
    const primaryImageUrl = (await ctx.telegram.getFileLink(primaryFileId)).toString();

    const VIDEO_DIR = process.env.VIDEO_DIR || '/tmp/videos';
    if (!fs.existsSync(VIDEO_DIR)) {
      fs.mkdirSync(VIDEO_DIR, { recursive: true });
    }

    const video = await VideoService.createJob({
      userId: telegramId,
      niche,
      platform,
      duration: totalDuration,
      scenes,
      title: `Video ${new Date().toLocaleDateString('id-ID')}`,
    });
    jobId = video.jobId;

    await UserService.deductCredits(telegramId, creditCost);
    creditsDeducted = true;

    // Download primary reference image
    const imagePath = path.join(VIDEO_DIR, `${jobId}_reference.jpg`);

    try {
      await exec(`wget -q -O "${imagePath}" "${primaryImageUrl}"`);
    } catch (wgetErr: any) {
      logger.error('wget failed downloading reference image:', wgetErr.message);
      throw new Error(`Failed to download reference image: ${wgetErr.message}`);
    }

    if (!fs.existsSync(imagePath) || fs.statSync(imagePath).size === 0) {
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      throw new Error('Reference image download failed — file is empty or missing');
    }

    // Run Gemini Vision analysis on ALL uploaded photos to extract product details
    let visionInsights = '';
    try {
      await ctx.reply(
        `Analyzing ${photos.length} photo(s) with AI Vision...`,
        { parse_mode: 'Markdown' }
      );

      const analysisPromises = photos.map(async (photo, idx) => {
        try {
          const photoUrl = (await ctx.telegram.getFileLink(photo.fileId)).toString();
          const result = await ContentAnalysisService.extractPrompt(photoUrl, 'image');
          if (result.success && result.prompt) {
            return `[Photo ${idx + 1}] ${result.prompt}`;
          }
          return null;
        } catch (err) {
          logger.warn(`Vision analysis failed for photo ${idx + 1}:`, err);
          return null;
        }
      });

      const analysisResults = await Promise.all(analysisPromises);
      const validResults = analysisResults.filter(Boolean);

      if (validResults.length > 0) {
        visionInsights = validResults.join('\n\n');
        logger.info(`Vision analysis completed for ${validResults.length}/${photos.length} photos`);
      }
    } catch (visionErr) {
      logger.warn('Vision analysis batch failed (non-fatal):', visionErr);
      // Non-fatal: continue without vision enrichment
    }

    // Enrich storyboard scenes with vision analysis insights
    let enrichedStoryboard = storyboard;
    if (visionInsights && storyboard && storyboard.length > 0) {
      enrichedStoryboard = storyboard.map((scene: any, idx: number) => ({
        ...scene,
        description: idx === 0
          ? `${scene.description}. Product context from reference images: ${visionInsights.slice(0, 500)}`
          : `${scene.description}. Visual reference: ${visionInsights.slice(0, 200)}`,
      }));
      logger.info('Storyboard enriched with vision analysis insights');
    }

    // Store vision analysis in session for potential later use
    ctx.session.videoCreation.visionAnalysis = visionInsights || undefined;

    await ctx.reply(
      `*Video Job Created!*\n\n` +
      `Job ID: \`${jobId}\`\n` +
      `Credits used: ${creditCost}\n\n` +
      `\ud83d\udcf8 ${photos.length} reference photo(s) received!\n` +
      (visionInsights ? `\ud83d\udd0d AI Vision analysis complete\n` : '') +
      `\ud83c\udfac Starting generation...\n\n` +
      `Scenes: ${scenes} | Duration: ${totalDuration}s\n` +
      `ETA: ${Math.ceil(scenes * 2)}-${Math.ceil(scenes * 5)} minutes`,
      { parse_mode: 'Markdown' }
    );

    ctx.session.videoCreation.waitingForImage = false;
    ctx.session.videoCreation.referenceImage = imagePath;
    ctx.session.videoCreation.jobId = jobId;

    const capturedJobId = jobId;
    try {
      const { position } = await enqueueVideoGeneration({
        jobId: capturedJobId,
        niche,
        platform,
        duration: totalDuration,
        scenes,
        storyboard: enrichedStoryboard,
        referenceImage: imagePath,
        userId: telegramId.toString(),
        chatId: ctx.chat!.id,
      });
      await ctx.reply(
        `Video queued! Position: #${position}. You'll be notified when ready.`
      );
    } catch (enqueueErr: any) {
      logger.warn('Queue enqueue failed, falling back to direct async:', enqueueErr.message);
      if (scenes === 1) {
        generateVideoAsync(ctx, capturedJobId, niche, platform, totalDuration, enrichedStoryboard, imagePath)
          .catch((err) => logger.error('Background generateVideoAsync error:', err));
      } else {
        generateExtendedVideoAsync(ctx, capturedJobId, niche, platform, totalDuration, scenes, enrichedStoryboard, imagePath)
          .catch((err) => logger.error('Background generateExtendedVideoAsync error:', err));
      }
    }

  } catch (error: any) {
    logger.error('handleVideoCreationImage error:', error);

    if (creditsDeducted && jobId) {
      try {
        await UserService.refundCredits(telegramId, creditCost, jobId, error.message || 'Image upload failed');
        await VideoService.updateStatus(jobId, 'failed', error.message || 'Image upload failed');
      } catch (refundErr) {
        logger.error('Failed to refund credits after image error:', refundErr);
      }
    }

    if (ctx.session?.videoCreation) {
      ctx.session.videoCreation.waitingForImage = false;
    }

    await ctx.reply(
      `Failed to process reference image.\n\n` +
      `${error.message?.includes('download') ? 'Could not download the image. Please try again.' : 'An error occurred processing your image.'}\n\n` +
      `${creditsDeducted ? 'Credits have been refunded.' : ''}\n\n` +
      `Please send the image again or type /skip to generate without a reference.`,
      { parse_mode: 'Markdown' }
    );
  }
}

export async function handleSkipImageReference(ctx: BotContext): Promise<void> {
  if (!ctx.session?.videoCreation?.waitingForImage) {
    await ctx.reply('❌ No active video creation. Please start with /create');
    return;
  }

  const { scenes, storyboard, totalDuration, niche, platform } = ctx.session.videoCreation;
  const telegramId = BigInt(ctx.from!.id);
  const creditCost = getVideoCreditCost(totalDuration);

  const user = await UserService.findByTelegramId(telegramId);
  if (!user || Number(user.creditBalance) < creditCost) {
    await ctx.reply(`❌ Not enough credits. Need ${creditCost}, have ${user?.creditBalance || 0}. Use /topup`);
    return;
  }

  const video = await VideoService.createJob({
    userId: telegramId,
    niche,
    platform,
    duration: totalDuration,
    scenes,
    title: `Video ${new Date().toLocaleDateString('id-ID')}`,
  });
  const jobId = video.jobId;

  await UserService.deductCredits(telegramId, creditCost);

  await ctx.reply(
    `✅ **Video Job Created!**\n\n` +
    `Job ID: \`${jobId}\`\n` +
    `Credits used: ${creditCost}\n\n` +
    `⏭️ No reference image — AI will generate everything.\n` +
    `🎬 Starting generation...\n\n` +
    `Scenes: ${scenes} | Duration: ${totalDuration}s\n` +
    `⏳ ETA: ${Math.ceil(scenes * 2)}-${Math.ceil(scenes * 5)} minutes`,
    { parse_mode: 'Markdown' }
  );

  ctx.session.videoCreation.waitingForImage = false;
  ctx.session.videoCreation.referenceImage = null;
  ctx.session.videoCreation.jobId = jobId;

  try {
    const { position } = await enqueueVideoGeneration({
      jobId,
      niche,
      platform,
      duration: totalDuration,
      scenes,
      storyboard,
      referenceImage: null,
      userId: telegramId.toString(),
      chatId: ctx.chat!.id,
    });
    await ctx.reply(
      `Video queued! Position: #${position}. You'll be notified when ready.`
    );
  } catch (enqueueErr: any) {
    logger.warn('Queue enqueue failed, falling back to direct async:', enqueueErr.message);
    if (scenes === 1) {
      generateVideoAsync(ctx, jobId, niche, platform, totalDuration, storyboard)
        .catch((err) => logger.error('Background generateVideoAsync error:', err));
    } else {
      generateExtendedVideoAsync(ctx, jobId, niche, platform, totalDuration, scenes, storyboard)
        .catch((err) => logger.error('Background generateExtendedVideoAsync error:', err));
    }
  }
}

/**
 * Handle incoming messages
 */
export async function messageHandler(ctx: BotContext): Promise<void> {
  try {
    const message = ctx.message;
    
    if (!message) {
      return;
    }

    // Log message
    logger.debug('Received message:', {
      userId: ctx.from?.id,
      chatId: ctx.chat?.id,
      text: 'text' in message ? message.text : '[non-text]',
    });

    // Handle /skip for video creation (must be before switch)
    if ('text' in message && message.text === '/skip' && ctx.session?.videoCreation?.waitingForImage) {
      await handleSkipImageReference(ctx);
      return;
    }

    // Handle custom duration input (must be before switch to catch numeric input)
    if (ctx.session?.state === 'CUSTOM_DURATION_INPUT' && 'text' in message) {
      const durationInput = message.text.trim();
      const duration = parseInt(durationInput);

      if (isNaN(duration) || duration < 6 || duration > 300) {
        await ctx.reply('❌ Please enter a valid duration (6-300 seconds)');
        return;
      }

      let bestFit = { scenes: 0, durationPerScene: 0, error: Infinity };
      for (const dps of [15, 10, 6]) {
        const s = Math.ceil(duration / dps);
        const total = s * dps;
        const err = Math.abs(total - duration);
        if (err < bestFit.error) bestFit = { scenes: s, durationPerScene: dps, error: err };
      }

      const finalDuration = bestFit.scenes * bestFit.durationPerScene;
      const niche = ctx.session.selectedNiche || 'fnb';
      const platform = String(ctx.session.selectedPlatforms?.[0] || 'tiktok');
      const creditCost = getVideoCreditCost(finalDuration);
      const telegramId = BigInt(ctx.from!.id);

      const user = await UserService.findByTelegramId(telegramId);
      if (!user || Number(user.creditBalance) < creditCost) {
        await ctx.reply(`❌ Not enough credits. Need ${creditCost}, have ${user?.creditBalance || 0}. Use /topup`);
        ctx.session.state = 'DASHBOARD';
        return;
      }

      const styles = ctx.session.selectedStyles || [];
      ctx.session.state = 'DASHBOARD';

      await ctx.reply(
        `🎬 **Almost Ready!**\n\n` +
        `Requested: ${duration}s → Optimized: ${finalDuration}s (${bestFit.scenes} × ${bestFit.durationPerScene}s)\n` +
        `💰 Credit cost: ${creditCost}\n\n` +
        `📸 **Send a reference image** for your video,\n` +
        `or type /skip to let AI generate everything.`,
        { parse_mode: 'Markdown' }
      );

      ctx.session.videoCreation = {
        mode: bestFit.scenes > 1 ? 'extended' : 'short',
        niche,
        platform,
        totalDuration: finalDuration,
        scenes: bestFit.scenes,
        storyboard: generateStoryboard(niche, styles, finalDuration, bestFit.scenes),
        jobId: '',
        waitingForImage: true,
      };
      return;
    }

    // Handle social account connection (WAITING_ACCOUNT_ID state)
    if (ctx.session?.state === 'WAITING_ACCOUNT_ID' && 'text' in message) {
      const accountId = message.text.trim();
      const platform = ctx.session.connectingPlatform || 'unknown';
      const telegramId = BigInt(ctx.from!.id);

      if (!accountId || accountId.startsWith('/')) {
        await ctx.reply('❌ Please enter a valid PostBridge Account ID.');
        return;
      }

      try {
        await PostAutomationService.connectAccount(
          telegramId,
          platform,
          accountId,
        );

        await ctx.reply(
          `✅ *Account Connected!*\n\n` +
          `Platform: ${platform.toUpperCase()}\n` +
          `Account ID: \`${accountId}\`\n\n` +
          `You can now publish videos to this account.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔗 Manage Accounts', callback_data: 'manage_accounts' }],
                [{ text: '🎬 Create Video', callback_data: 'create_video' }],
              ],
            },
          }
        );
      } catch (error: any) {
        logger.error('Failed to connect account:', error);
        await ctx.reply(
          `❌ Failed to connect account.\n\n` +
          `Error: ${error.message || 'Unknown error'}\n\n` +
          `Please try again or contact support.`,
        );
      }

      ctx.session.state = 'DASHBOARD';
      ctx.session.connectingPlatform = undefined;
      return;
    }

    // Handle text messages
    if ('text' in message) {
      const text = message.text;

      // Handle reply keyboard buttons — route to proper command handlers
      switch (text) {
        case '🎬 Create Video':
        case '🚀 Get Started':
          await createCommand(ctx);
          return;

        case '🖼️ Generate Image':
          await ctx.reply(
            '🖼️ *Image Generation*\n\n' +
            'Select workflow:',
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🛍️ Product Photo', callback_data: 'img_product' }],
                  [{ text: '🍔 F&B Food', callback_data: 'img_fnb' }],
                  [{ text: '🏠 Real Estate', callback_data: 'img_realestate' }],
                  [{ text: '🚗 Car/Automotive', callback_data: 'img_car' }],
                ],
              },
            }
          );
          return;

        case '💬 Chat AI':
          await ctx.reply(
            '*💬 AI Chat*\n\n' +
            'Ask me anything!\n\n' +
            'Usage: `/chat <your question>`\n\n' +
            '*Examples:*\n' +
            '`/chat What is the best marketing strategy?`\n' +
            '`/chat Help me write a product description`\n' +
            '`/chat Suggest 5 TikTok video ideas for my cafe`',
            { parse_mode: 'Markdown' }
          );
          return;

        case '📁 My Videos':
          await videosCommand(ctx);
          return;

        case '💰 Top Up':
          await topupCommand(ctx);
          return;

        case '⭐ Subscription':
          await subscriptionCommand(ctx);
          return;

        case '👤 Profile':
          await profileCommand(ctx);
          return;

        case '👥 Referral':
          await referralCommand(ctx);
          return;

        case '⚙️ Settings':
          await settingsCommand(ctx);
          return;

        case '🆘 Support':
          await supportCommand(ctx);
          return;

        default:
          // Unknown text — show help prompt with full keyboard
          await ctx.reply(
            '❓ I didn\'t understand that.\n\n' +
            'Use the menu below or type /help for assistance.',
            {
              reply_markup: {
                keyboard: [
                  [{ text: '🎬 Create Video' }, { text: '🖼️ Generate Image' }],
                  [{ text: '💬 Chat AI' }, { text: '📁 My Videos' }],
                  [{ text: '💰 Top Up' }, { text: '⭐ Subscription' }],
                  [{ text: '👤 Profile' }, { text: '👥 Referral' }],
                  [{ text: '⚙️ Settings' }, { text: '🆘 Support' }],
                ],
                resize_keyboard: true,
              },
            }
          );
      }
    }

    // Handle photo uploads
    if ('photo' in message) {
      if (ctx.session.state === 'CREATE_VIDEO_UPLOAD') {
        await ctx.reply(
          '✅ Photo received!\n\n' +
          'Now, please select your niche:',
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🍔 F&B', callback_data: 'niche_fnb' },
                  { text: '💄 Beauty', callback_data: 'niche_beauty' },
                ],
                [
                  { text: '🛍️ Retail', callback_data: 'niche_retail' },
                  { text: '🔧 Services', callback_data: 'niche_services' },
                ],
                [
                  { text: '🏢 Professional', callback_data: 'niche_professional' },
                  { text: '🏨 Hospitality', callback_data: 'niche_hospitality' },
                ],
              ],
            },
          }
        );
        ctx.session.state = 'CREATE_VIDEO_NICHE';
        return;
      }
    }

    // Handle image generation
    if (ctx.session.state === 'IMAGE_GENERATION_WAITING' && 'text' in message) {
      const description = message.text;
      const category = ctx.session.stateData?.imageCategory as string;

      await ctx.reply(
        '⏳ *Generating image...*\n\n' +
        'This may take 30-60 seconds.',
        { parse_mode: 'Markdown' }
      );

      try {
        let result: any;

        switch (category) {
          case 'product':
            result = await ImageGenerationService.generateProductImage(description);
            break;
          case 'fnb':
            result = await ImageGenerationService.generateFoodImage(description);
            break;
          case 'realestate':
            result = await ImageGenerationService.generateRealEstateImage(description);
            break;
          case 'car':
            result = await ImageGenerationService.generateCarImage(description);
            break;
          default:
            result = await ImageGenerationService.generateProductImage(description);
        }

        if (result.success && result.imageUrl) {
          const isDemo = result.provider === 'demo';
          const caption = isDemo
            ? `🖼️ *Sample Image (Demo)*\n\n` +
              `_Description: ${description}_\n\n` +
              `⚠️ This is a placeholder image. AI generation is temporarily unavailable.\n` +
              `The actual product will generate images matching your description.`
            : `✅ *Image Generated!*\n\n` +
              `_Description: ${description}_\n\n` +
              `What would you like to do?`;

          // Handle base64 data URIs (from NVIDIA, HuggingFace, etc.) vs URL images
          let photoSource: string | { source: Buffer };
          let isBase64 = false;
          if (result.imageUrl!.startsWith('data:')) {
            const base64Data = result.imageUrl!.split(',')[1];
            photoSource = { source: Buffer.from(base64Data, 'base64') };
            isBase64 = true;
          } else {
            photoSource = result.imageUrl!;
          }

          await ctx.replyWithPhoto(photoSource, {
            caption,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                ...(isDemo || isBase64 ? [] : [[{ text: '⬇️ Download', url: result.imageUrl! }]]),
                [{ text: '🔄 Generate Another', callback_data: 'image_generate' }],
                [{ text: '🎬 Create Video', callback_data: 'create_video' }],
              ],
            },
          });
        } else {
          await ctx.reply(
            `❌ *Generation Failed*\n\n` +
            `Error: ${result.error || 'Unknown error'}\n\n` +
            `Please try again with a different description.`,
            { parse_mode: 'Markdown' }
          );
        }

      } catch (error: any) {
        logger.error('Image generation error:', error);
        await ctx.reply(
          '❌ Failed to generate image. Please try again.',
          { parse_mode: 'Markdown' }
        );
      }

      ctx.session.state = 'DASHBOARD';
      return;
    }

    // Handle clone video
    if (ctx.session.state === 'CLONE_VIDEO_WAITING') {
      let videoUrl: string | undefined;

      if ('text' in message) {
        videoUrl = message.text;
      } else if ('video' in message) {
        const fileId = message.video.file_id;
        videoUrl = (await ctx.telegram.getFileLink(fileId)).toString();
      }

      if (!videoUrl) {
        await ctx.reply('❌ Please send a video or video URL.');
        return;
      }

      await ctx.reply(
        '⏳ *Analyzing video...*\n\n' +
        'Extracting style and creating prompt...',
        { parse_mode: 'Markdown' }
      );

      try {
        const result = await ContentAnalysisService.cloneVideo(videoUrl);

        if (result.success && result.prompt) {
          await ctx.reply(
            `✅ *Video Style Extracted:*\n\n` +
            `${result.prompt}\n\n` +
            `*Style:* ${result.style || 'N/A'}\n` +
            `*Key Elements:* ${result.elements?.join(', ') || 'N/A'}\n\n` +
            `Ready to create a similar video?`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🎬 Create Similar Video', callback_data: 'create_video' }],
                  [{ text: '❌ Cancel', callback_data: 'main_menu' }],
                ],
              },
            }
          );

          ctx.session.stateData = { clonePrompt: result.prompt };
        } else {
          await ctx.reply(
            `❌ *Analysis Failed*\n\n` +
            `Error: ${result.error || 'Unknown error'}`,
            { parse_mode: 'Markdown' }
          );
        }

      } catch (error: any) {
        logger.error('Clone video error:', error);
        await ctx.reply(
          '❌ Failed to analyze video. Please try again.',
          { parse_mode: 'Markdown' }
        );
      }

      ctx.session.state = 'DASHBOARD';
      return;
    }

    // Handle clone image
    if (ctx.session.state === 'CLONE_IMAGE_WAITING') {
      let imageUrl: string | undefined;

      if ('text' in message) {
        imageUrl = message.text;
      } else if ('photo' in message) {
        const photos = message.photo;
        const fileId = photos[photos.length - 1].file_id;
        imageUrl = (await ctx.telegram.getFileLink(fileId)).toString();
      }

      if (!imageUrl) {
        await ctx.reply('❌ Please send an image or image URL.');
        return;
      }

      await ctx.reply(
        '⏳ *Analyzing image...*\n\n' +
        'Extracting style and creating prompt...',
        { parse_mode: 'Markdown' }
      );

      try {
        const result = await ContentAnalysisService.cloneImage(imageUrl);

        if (result.success && result.prompt) {
          await ctx.reply(
            `✅ *Image Style Extracted:*\n\n` +
            `${result.prompt}\n\n` +
            `*Style:* ${result.style || 'N/A'}\n` +
            `*Key Elements:* ${result.elements?.join(', ') || 'N/A'}\n\n` +
            `Ready to generate a similar image?`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🖼️ Generate Similar Image', callback_data: 'image_generate' }],
                  [{ text: '❌ Cancel', callback_data: 'main_menu' }],
                ],
              },
            }
          );

          ctx.session.stateData = { clonePrompt: result.prompt };
        } else {
          await ctx.reply(
            `❌ *Analysis Failed*\n\n` +
            `Error: ${result.error || 'Unknown error'}`,
            { parse_mode: 'Markdown' }
          );
        }

      } catch (error: any) {
        logger.error('Clone image error:', error);
        await ctx.reply(
          '❌ Failed to analyze image. Please try again.',
          { parse_mode: 'Markdown' }
        );
      }

      ctx.session.state = 'DASHBOARD';
      return;
    }

    // Handle disassemble (video/image to prompt)
    if (ctx.session.state === 'DISASSEMBLE_WAITING') {
      await handleDisassemble(ctx);
      ctx.session.state = 'DASHBOARD';
      return;
    }

    // Handle image upload during video creation — accumulate multi-photo (up to 5)
    if (ctx.session?.videoCreation?.waitingForImage && 'photo' in message) {
      const photos = message.photo;
      const largestPhoto = photos[photos.length - 1];
      const fileId = largestPhoto.file_id;

      // Initialize uploaded photos array if needed
      if (!ctx.session.videoCreation.uploadedPhotos) {
        ctx.session.videoCreation.uploadedPhotos = [];
      }

      const currentPhotos = ctx.session.videoCreation.uploadedPhotos;
      const MAX_PHOTOS = 5;

      if (currentPhotos.length >= MAX_PHOTOS) {
        await ctx.reply(
          `You have already uploaded ${MAX_PHOTOS} photos (maximum).\n\n` +
          `Tap "Generate Now" to start video creation, or /skip to generate without references.`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '\u25b6\ufe0f Generate Now', callback_data: 'generate_video_now' }],
                [{ text: '\u23ed\ufe0f Skip Reference', callback_data: 'skip_reference_image' }],
              ],
            },
          }
        );
        return;
      }

      // Store the photo
      currentPhotos.push({ fileId });
      const count = currentPhotos.length;

      await ctx.reply(
        `\ud83d\udcf8 Photo ${count}/${MAX_PHOTOS} received!` +
        (count < MAX_PHOTOS ? ' Send more photos or tap Generate.' : ' Maximum reached — tap Generate.'),
        {
          reply_markup: {
            inline_keyboard: [
              ...(count < MAX_PHOTOS
                ? [[{ text: '\ud83d\udcf8 Add More', callback_data: 'add_more_photos' }]]
                : []),
              [{ text: '\u25b6\ufe0f Generate Now', callback_data: 'generate_video_now' }],
              [{ text: '\u23ed\ufe0f Skip Reference', callback_data: 'skip_reference_image' }],
            ],
          },
        }
      );
      return;
    }

    // Handle /skip during video creation
    if ('text' in message && message.text === '/skip') {
      if (ctx.session?.videoCreation?.waitingForImage) {
        await handleSkipImageReference(ctx);
        return;
      }
    }

  } catch (error) {
    logger.error('Error in message handler:', error);
    await ctx.reply('❌ Something went wrong. Please try again later.');
  }
}
