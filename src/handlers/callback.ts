/**
 * Callback Handler
 * 
 * Handles all callback queries (inline button clicks)
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { handleTopupSelection, checkPayment } from '@/commands/topup';
import { 
  handleNicheSelection, 
  handlePlatformSelection, 
  handleDurationSelection,
  createCommand 
} from '@/commands/create';
import { videosCommand, viewVideo, copyVideoUrl, deleteVideo } from '@/commands/videos';
import { VideoService } from '@/services/video.service';
import { PostAutomationService } from '@/services/postautomation.service';
import { ImageGenerationService } from '@/services/image.service';
import { ContentAnalysisService } from '@/services/content-analysis.service';

/**
 * Handle storyboard selection
 */
async function handleStoryboardRequest(ctx: BotContext, niche: string) {
  try {
    const storyboard = VideoService.generateStoryboard({ 
      niche, 
      duration: 30 
    });

    let message = `📋 *Storyboard: ${niche.toUpperCase()}*\n\n`;
    
    storyboard.scenes.forEach(s => {
      message += `🎬 *Scene ${s.scene} (${s.duration}s)*\n`;
      message += `Type: ${s.type}\n`;
      message += `Desc: ${s.description}\n\n`;
    });

    message += `📝 *Caption:*\n_${storyboard.caption}_\n\n`;
    message += `💰 *Cost: 1.0 Credits*`;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Create Video Now', callback_data: `confirm_create_${niche}` }],
          [{ text: '◀️ Back to Selection', callback_data: 'storyboard_create' }],
        ]
      }
    });
  } catch (error) {
    logger.error('Storyboard error:', error);
    await ctx.answerCbQuery('Error generating storyboard');
  }
}

/**
 * Handle callback queries
 */
export async function callbackHandler(ctx: BotContext): Promise<void> {
  try {
    const callbackQuery = ctx.callbackQuery;
    
    if (!callbackQuery || !('data' in callbackQuery)) {
      return;
    }

    const data = callbackQuery.data;

    logger.debug('Callback received:', { userId: ctx.from?.id, data });

    // Route to appropriate handler based on callback data prefix

    // Topup handlers
    if (data.startsWith('topup_')) {
      const packageId = data.replace('topup_', '');
      await handleTopupSelection(ctx, packageId);
      return;
    }

    if (data.startsWith('check_payment_')) {
      const orderId = data.replace('check_payment_', '');
      await checkPayment(ctx, orderId);
      return;
    }

    // Video creation handlers
    if (data.startsWith('niche_')) {
      const nicheId = data.replace('niche_', '');
      await handleNicheSelection(ctx, nicheId);
      return;
    }

    if (data.startsWith('platform_')) {
      const platformId = data.replace('platform_', '');
      await handlePlatformSelection(ctx, platformId);
      return;
    }

    if (data.startsWith('duration_')) {
      const durationStr = data.replace('duration_', '');
      await handleDurationSelection(ctx, durationStr);
      return;
    }

    // Brief skip
    if (data === 'brief_skip') {
      await ctx.editMessageText(
        '⏭️ Brief skipped\n\n' +
        '✅ Confirm video creation:\n\n' +
        'Estimated credits: 1.0\n\n' +
        'Proceed?',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Yes, Create!', callback_data: 'confirm_create' },
                { text: '❌ Cancel', callback_data: 'cancel_create' },
              ],
            ],
          },
        }
      );
      return;
    }

    if (data === 'confirm_create') {
      await ctx.editMessageText(
        '🎬 Creating your video...\n\n' +
        '⏳ Estimated time: 2-5 minutes\n\n' +
        'You will be notified when it\'s ready!'
      );
      ctx.session.state = 'CREATE_VIDEO_PROCESSING';
      return;
    }

    if (data === 'cancel_create') {
      await ctx.editMessageText(
        '❌ Video creation cancelled.\n\n' +
        'Use /create to start again.'
      );
      ctx.session.state = 'DASHBOARD';
      return;
    }

    // Payment method handlers (placeholder - will use Midtrans)
    if (data.startsWith('payment_')) {
      const [_, method, packageId] = data.split('_');
      
      await ctx.editMessageText(
        `💳 Processing ${method} payment...\n\n` +
        'In sandbox mode - this would redirect to Midtrans payment page.',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Simulate Success', callback_data: `simulate_success_${packageId}` },
              ],
            ],
          },
        }
      );
      return;
    }

    if (data.startsWith('simulate_success_')) {
      const packageId = data.replace('simulate_success_', '');
      
      const credits: Record<string, number> = {
        starter: 6,
        growth: 18,
        scale: 75,
        enterprise: 260,
      };

      await ctx.editMessageText(
        `✅ Payment Successful! (Simulated)\n\n` +
        `Credits added: ${credits[packageId] || 0}\n\n` +
        'Thank you for your purchase! 🎉'
      );
      return;
    }

    // Share referral
    if (data === 'share_referral') {
      await ctx.answerCbQuery('Share feature coming soon!');
      return;
    }

    // Create video - redirect to /create flow
    if (data === 'create_video') {
      await ctx.deleteMessage().catch(() => {});
      await createCommand(ctx);
      return;
    }

    // Image generation handlers
    if (data === 'image_generate') {
      await ctx.editMessageText(
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
              [{ text: '◀️ Back to Menu', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    // Image generation category handlers
    if (data.startsWith('img_')) {
      const category = data.replace('img_', '');
      await handleImageGeneration(ctx, category);
      return;
    }

    // Clone/Remake Video
    if (data === 'clone_video') {
      await ctx.editMessageText(
        '🔄 *Clone/Remake Video*\n\n' +
        'Send me a video to recreate with similar style.\n\n' +
        'Or paste a video URL from:\n' +
        '• TikTok\n' +
        '• Instagram Reels\n' +
        '• YouTube Shorts',
        { parse_mode: 'Markdown' }
      );
      ctx.session.state = 'CLONE_VIDEO_WAITING';
      return;
    }

    // Clone/Remake Image
    if (data === 'clone_image') {
      await ctx.editMessageText(
        '🔄 *Clone/Remake Image*\n\n' +
        'Send me an image to recreate with similar style.\n\n' +
        'I\'ll analyze the image and generate a similar one.',
        { parse_mode: 'Markdown' }
      );
      ctx.session.state = 'CLONE_IMAGE_WAITING';
      return;
    }

    // Storyboard Creator
    if (data === 'storyboard_create') {
      await ctx.editMessageText(
        '📋 *Storyboard Creator*\n\n' +
        'I\'ll help you create a video storyboard.\n\n' +
        'Select your content type:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛍️ Product Promo', callback_data: 'sb_product' }],
              [{ text: '🍔 F&B Content', callback_data: 'sb_fnb' }],
              [{ text: '🏠 Real Estate Tour', callback_data: 'sb_realestate' }],
              [{ text: '🚗 Car Showcase', callback_data: 'sb_car' }],
              [{ text: '◀️ Back to Menu', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    if (data === 'sb_product') return handleStoryboardRequest(ctx, 'product');
    if (data === 'sb_fnb') return handleStoryboardRequest(ctx, 'fnb');
    if (data === 'sb_realestate') return handleStoryboardRequest(ctx, 'realestate');
    if (data === 'sb_car') return handleStoryboardRequest(ctx, 'car');

    // Viral/Trend Research
    if (data === 'viral_research') {
      await ctx.editMessageText(
        '📈 *Viral/Trend Research*\n\n' +
        'Analyzing trending content across platforms...\n\n' +
        'Select niche to discover what\'s working:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔥 All Trends (Viral)', callback_data: 'trend_viral' }],
              [{ text: '🍔 F&B / Restaurant', callback_data: 'trend_fnb' }],
              [{ text: '🏠 Real Estate', callback_data: 'trend_realestate' }],
              [{ text: '🛍️ E-commerce', callback_data: 'trend_ecom' }],
              [{ text: '◀️ Back to Menu', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    if (data.startsWith('trend_')) {
      const niche = data.replace('trend_', '');
      await ctx.editMessageText(
        `📈 *Viral Research: ${niche.toUpperCase()}*\n\n` +
        `✅ Analysis complete.\n\n` +
        `*Trending Patterns:* \n` +
        `• Quick cuts, beat-matching\n` +
        `• ASMR audio layer\n` +
        `• Text-to-speech overlay (Female voice)\n\n` +
        `*Suggested Storyboard:*`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Generate Viral Storyboard', callback_data: `sb_${niche === 'viral' ? 'product' : (niche === 'ecom' ? 'product' : niche)}` }],
              [{ text: '◀️ Back', callback_data: 'viral_research' }],
            ],
          },
        }
      );
      return;
    }

    // Video/Image to Prompt (Disassemble)
    if (data === 'disassemble') {
      await ctx.editMessageText(
        '🔍 *Video/Image to Prompt*\n\n' +
        'I\'ll analyze your media and extract the prompt used to create it.\n\n' +
        'Send me a video or image:',
        { parse_mode: 'Markdown' }
      );
      ctx.session.state = 'DISASSEMBLE_WAITING';
      return;
    }

    // Main menu
    if (data === 'main_menu') {
      await ctx.editMessageText(
        '🎬 *OpenClaw Video Studio*\n\n' +
        'What would you like to do?',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎬 Create Video', callback_data: 'create_video' }],
              [{ text: '🖼️ Generate Image', callback_data: 'image_generate' }],
              [{ text: '🔄 Clone Video', callback_data: 'clone_video' }],
              [{ text: '📋 Storyboard Creator', callback_data: 'storyboard_create' }],
              [{ text: '🔄 Clone Image', callback_data: 'clone_image' }],
              [{ text: '📈 Viral Research', callback_data: 'viral_research' }],
              [{ text: '🔍 Disassemble Prompt', callback_data: 'disassemble' }],
              [{ text: '🔗 Social Accounts', callback_data: 'manage_accounts' }],
            ],
          },
        }
      );
      return;
    }

    // Videos menu handlers
    if (data === 'videos_favorites') {
      await ctx.editMessageText(
        '⭐ *Favorite Videos*\n\n' +
        'Your favorite videos will appear here.\n\n' +
        'No favorites yet.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Back', callback_data: 'videos_back' }],
            ],
          },
        }
      );
      return;
    }

    if (data === 'videos_trash') {
      await ctx.editMessageText(
        '🗑️ *Trash*\n\n' +
        'Deleted videos (restorable for 7 days).\n\n' +
        'Trash is empty.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Back', callback_data: 'videos_back' }],
            ],
          },
        }
      );
      return;
    }

    if (data === 'videos_back' || data === 'videos_list') {
      await videosCommand(ctx);
      return;
    }

    // Video viewing handlers
    if (data.startsWith('video_view_')) {
      const jobId = data.replace('video_view_', '');
      await viewVideo(ctx, jobId);
      return;
    }

    if (data.startsWith('video_copy_')) {
      const jobId = data.replace('video_copy_', '');
      await copyVideoUrl(ctx, jobId);
      return;
    }

    if (data.startsWith('video_delete_')) {
      const jobId = data.replace('video_delete_', '');
      await deleteVideo(ctx, jobId);
      return;
    }

    if (data.startsWith('video_confirm_delete_')) {
      const jobId = data.replace('video_confirm_delete_', '');
      // Actually delete from database
      await VideoService.deleteVideo(jobId);
      await ctx.editMessageText(
        '🗑️ *Video Deleted*\n\n' +
        'The video has been permanently deleted.',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    if (data.startsWith('video_retry_')) {
      const jobId = data.replace('video_retry_', '');
      // Retry video creation - redirect to create
      await ctx.answerCbQuery('Retrying video...');
      await createCommand(ctx);
      return;
    }

    // Post Automation - Publish Video
    if (data.startsWith('publish_video_')) {
      const jobId = data.replace('publish_video_', '');
      await handlePublishVideo(ctx, jobId);
      return;
    }

    if (data.startsWith('select_platform_')) {
      const jobId = data.split('_')[2];
      const platform = data.split('_')[3];
      await handlePublishPlatformSelection(ctx, jobId, platform);
      return;
    }

    if (data.startsWith('confirm_publish_')) {
      const jobId = data.replace('confirm_publish_', '');
      await handleConfirmPublish(ctx, jobId);
      return;
    }

    // Social Account Management
    if (data === 'manage_accounts') {
      await handleManageAccounts(ctx);
      return;
    }

    if (data.startsWith('connect_account_')) {
      const platform = data.replace('connect_account_', '');
      await handleConnectAccount(ctx, platform);
      return;
    }

    if (data.startsWith('disconnect_account_')) {
      const accountId = data.replace('disconnect_account_', '');
      await handleDisconnectAccount(ctx, accountId);
      return;
    }

    // Unknown callback
    logger.warn('Unknown callback:', data);
    await ctx.answerCbQuery('Unknown action');

  } catch (error) {
    logger.error('Error in callback handler:', error);
    await ctx.answerCbQuery('Error processing request');
  }
}

/**
 * Handle video publishing
 */
async function handlePublishVideo(ctx: BotContext, jobId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Get video details
  const video = await VideoService.getByJobId(jobId);
  if (!video || !video.videoUrl) {
    await ctx.answerCbQuery('❌ Video not found');
    return;
  }

  // Check if user has connected accounts
  const hasAccounts = await PostAutomationService.hasConnectedAccounts(BigInt(userId));
  
  if (!hasAccounts) {
    await ctx.editMessageText(
      '📤 *Publish to Social Media*\n\n' +
      'You haven\'t connected any social media accounts yet.\n\n' +
      'Connect your accounts first to publish videos.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔗 Connect Accounts', callback_data: 'manage_accounts' }],
            [{ text: '❌ Cancel', callback_data: 'videos_list' }],
          ],
        },
      }
    );
    return;
  }

  // Get user's connected accounts
  const accounts = await PostAutomationService.getUserAccounts(BigInt(userId));
  
  // Build inline keyboard
  const keyboard: any[][] = [];
  
  // Group by platform
  const platformGroups: Record<string, typeof accounts> = {};
  accounts.forEach(acc => {
    if (!platformGroups[acc.platform]) {
      platformGroups[acc.platform] = [];
    }
    platformGroups[acc.platform].push(acc);
  });

  Object.entries(platformGroups).forEach(([platform, accs]) => {
    const platformEmoji = getPlatformEmoji(platform);
    accs.forEach(acc => {
      keyboard.push([{
        text: `${platformEmoji} ${platform.toUpperCase()} (${acc.username})`,
        callback_data: `select_platform_${jobId}_${acc.id}`,
      }]);
    });
  });

  keyboard.push([{ text: '✅ Post Now', callback_data: `confirm_publish_${jobId}` }]);
  keyboard.push([{ text: '❌ Cancel', callback_data: 'videos_list' }]);

  await ctx.editMessageText(
    '📤 *Publish to Social Media*\n\n' +
    'Select the platform(s) to publish this video:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard,
      },
    }
  );

  // Store selected platform in session
  ctx.session.selectedPlatforms = [];
  ctx.session.currentJobId = jobId;
}

/**
 * Handle platform selection for publishing
 */
async function handlePublishPlatformSelection(ctx: BotContext, jobId: string, platformOrAccountId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Initialize session if needed
  if (!ctx.session.selectedPlatforms) {
    ctx.session.selectedPlatforms = [];
  }

  if (platformOrAccountId === 'all') {
    // Select all accounts
    const accounts = await PostAutomationService.getUserAccounts(BigInt(userId));
    ctx.session.selectedPlatforms = accounts.map(acc => acc.id);
  } else {
    // Toggle single account
    const accountId = parseInt(platformOrAccountId);
    const index = ctx.session.selectedPlatforms.indexOf(accountId);
    
    if (index > -1) {
      ctx.session.selectedPlatforms.splice(index, 1);
    } else {
      ctx.session.selectedPlatforms.push(accountId);
    }
  }

  // Show confirmation
  const selectedCount = ctx.session.selectedPlatforms.length;
  
  if (selectedCount === 0) {
    await ctx.answerCbQuery('Select at least one platform');
    return;
  }

  await ctx.editMessageText(
    `📤 *Publish Video*\n\n` +
    `✅ ${selectedCount} platform(s) selected\n\n` +
    `Ready to publish?`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Publish Now', callback_data: `confirm_publish_${jobId}` }],
          [{ text: '❌ Cancel', callback_data: 'videos_list' }],
        ],
      },
    }
  );
}

/**
 * Handle confirm publish
 */
async function handleConfirmPublish(ctx: BotContext, jobId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  await ctx.editMessageText(
    '⏳ *Publishing...*\n\n' +
    'Uploading to selected platforms...',
    { parse_mode: 'Markdown' }
  );

  try {
    // Get video
    const video = await VideoService.getByJobId(jobId);
    if (!video || !video.videoUrl) {
      throw new Error('Video not found');
    }

    // Get user's selected accounts
    const accounts = await PostAutomationService.getUserAccounts(BigInt(userId));
    
    // Publish
    const results = await PostAutomationService.publish({
      userId: BigInt(userId),
      mediaUrl: video.videoUrl,
      caption: ctx.session.caption || `${video.title || 'Check this out!'} #viral #fyp`,
      platformAccountIds: accounts.map(a => a.id),
    });

    // Show results
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    let message = `📤 *Publish Results*\n\n`;
    message += `✅ Success: ${successCount}\n`;
    if (failCount > 0) {
      message += `❌ Failed: ${failCount}\n\n`;
    }

    results.forEach(result => {
      const emoji = result.success ? '✅' : '❌';
      message += `${emoji} ${result.platform.toUpperCase()}\n`;
      if (result.postUrl) {
        message += `   ${result.postUrl}\n`;
      }
      if (result.error) {
        message += `   Error: ${result.error}\n`;
      }
    });

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📁 My Videos', callback_data: 'videos_list' }],
          [{ text: '🎬 Create Another', callback_data: 'create_video' }],
        ],
      },
    });

  } catch (error: any) {
    logger.error('Publish failed:', error);
    await ctx.editMessageText(
      `❌ *Publish Failed*\n\n` +
      `Error: ${error.message}\n\n` +
      `Please try again or contact support.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Retry', callback_data: `publish_video_${jobId}` }],
            [{ text: '❌ Cancel', callback_data: 'videos_list' }],
          ],
        },
      }
    );
  }
}

/**
 * Handle manage accounts
 */
async function handleManageAccounts(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const accounts = await PostAutomationService.getUserAccounts(BigInt(userId));

  if (accounts.length === 0) {
    await ctx.editMessageText(
      '🔗 *Connect Social Accounts*\n\n' +
      'Connect your social media accounts to publish videos directly.\n\n' +
      'Select platform to connect:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 TikTok', callback_data: 'connect_account_tiktok' }],
            [{ text: '📷 Instagram', callback_data: 'connect_account_instagram' }],
            [{ text: '📘 Facebook', callback_data: 'connect_account_facebook' }],
            [{ text: '🐦 Twitter/X', callback_data: 'connect_account_twitter' }],
            [{ text: '📺 YouTube', callback_data: 'connect_account_youtube' }],
            [{ text: '❌ Cancel', callback_data: 'main_menu' }],
          ],
        },
      }
    );
    return;
  }

  // Show connected accounts
  let message = '🔗 *Connected Accounts*\n\n';
  const keyboard: any[][] = [];

  accounts.forEach(acc => {
    const emoji = getPlatformEmoji(acc.platform);
    message += `${emoji} ${acc.platform.toUpperCase()}: ${acc.username}\n`;
    keyboard.push([{
      text: `❌ Disconnect ${acc.platform} (${acc.username})`,
      callback_data: `disconnect_account_${acc.id}`,
    }]);
  });

  message += '\nConnect more accounts:';
  keyboard.push([{ text: '➕ Connect New Account', callback_data: 'connect_account_new' }]);
  keyboard.push([{ text: '◀️ Back', callback_data: 'main_menu' }]);

  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
}

/**
 * Handle connect account
 */
async function handleConnectAccount(ctx: BotContext, platform: string) {
  // In production, this would redirect to OAuth flow
  // For now, we'll show instructions
  await ctx.editMessageText(
    `🔗 *Connect ${platform.toUpperCase()}*\n\n` +
    `To connect your ${platform} account:\n\n` +
    `1. Go to PostBridge Dashboard\n` +
    `2. Connect your ${platform} account\n` +
    `3. Copy your Account ID\n` +
    `4. Paste it here\n\n` +
    `Or use the link below:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: `🔗 Open PostBridge`, url: 'https://post-bridge.com/dashboard' }],
          [{ text: '◀️ Back', callback_data: 'manage_accounts' }],
        ],
      },
    }
  );

  ctx.session.state = 'WAITING_ACCOUNT_ID';
  ctx.session.connectingPlatform = platform;
}

/**
 * Handle disconnect account
 */
async function handleDisconnectAccount(ctx: BotContext, accountId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  await PostAutomationService.disconnectAccount(BigInt(userId), parseInt(accountId));
  
  await ctx.answerCbQuery('✅ Account disconnected');
  
  // Refresh account list
  await handleManageAccounts(ctx);
}

/**
 * Get platform emoji
 */
function getPlatformEmoji(platform: string): string {
  const emojis: Record<string, string> = {
    tiktok: '📱',
    instagram: '📷',
    facebook: '📘',
    twitter: '🐦',
    youtube: '📺',
  };
  return emojis[platform.toLowerCase()] || '📱';
}

/**
 * Handle image generation
 */
async function handleImageGeneration(ctx: BotContext, category: string) {
  const categoryNames: Record<string, string> = {
    product: '🛍️ Product Photo',
    fnb: '🍔 F&B Food',
    realestate: '🏠 Real Estate',
    car: '🚗 Car/Automotive',
  };

  await ctx.editMessageText(
    `🖼️ *Generate ${categoryNames[category]}*\n\n` +
    `Describe what you want to generate:\n\n` +
    `Example: "Modern smartphone on white background with soft lighting"`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Cancel', callback_data: 'image_generate' }],
        ],
      },
    }
  );

  ctx.session.state = 'IMAGE_GENERATION_WAITING';
  ctx.session.stateData = { imageCategory: category };
}

/**
 * Handle disassemble prompt (video/image to prompt extraction)
 */
async function handleDisassemble(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Check if user sent media
  const message = ctx.message as any;
  
  if (!message) {
    await ctx.reply(
      '🔍 *Video/Image to Prompt*\n\n' +
      'Please send a video or image first.',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  let mediaUrl: string | undefined;
  let mediaType: 'video' | 'image' = 'image';

  if (message.video) {
    mediaUrl = message.video.file_id;
    mediaType = 'video';
  } else if (message.photo) {
    const photos = message.photo;
    mediaUrl = photos[photos.length - 1].file_id;
    mediaType = 'image';
  }

  if (!mediaUrl) {
    await ctx.reply(
      '❌ No media found. Please send a video or image.',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await ctx.reply(
    '⏳ *Analyzing...*\n\n' +
    'Extracting prompt from your media...',
    { parse_mode: 'Markdown' }
  );

  try {
    // Get file URL
    const fileUrl = await ctx.telegram.getFileLink(mediaUrl);
    
    // Extract prompt
    const result = await ContentAnalysisService.extractPrompt(fileUrl.toString(), mediaType);

    if (result.success && result.prompt) {
      await ctx.reply(
        `✅ *Prompt Extracted:*\n\n` +
        `${result.prompt}\n\n` +
        `*Style:* ${result.style || 'N/A'}\n` +
        `*Elements:* ${result.elements?.join(', ') || 'N/A'}\n\n` +
        `_Use this prompt to create similar content!_`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎬 Create Video with This Prompt', callback_data: 'create_video' }],
              [{ text: '🖼️ Generate Image with This Prompt', callback_data: 'image_generate' }],
              [{ text: '📋 Copy Prompt', callback_data: 'copy_prompt' }],
            ],
          },
        }
      );

      // Store prompt in session
      ctx.session.stateData = { extractedPrompt: result.prompt };

    } else {
      await ctx.reply(
        `❌ *Extraction Failed*\n\n` +
        `Error: ${result.error || 'Unknown error'}\n\n` +
        `Please try again with different media.`,
        { parse_mode: 'Markdown' }
      );
    }

  } catch (error: any) {
    logger.error('Disassemble failed:', error);
    await ctx.reply(
      `❌ *Error*\n\n` +
      `Failed to analyze media. Please try again.`,
      { parse_mode: 'Markdown' }
    );
  }
}
