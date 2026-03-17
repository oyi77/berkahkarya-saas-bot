/**
 * Message Handler
 * 
 * Handles all incoming messages
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { videosCommand } from '@/commands/videos';
import { UserService } from '@/services/user.service';
import { ImageGenerationService } from '@/services/image.service';
import { ContentAnalysisService } from '@/services/content-analysis.service';

// Forward declaration
async function handleDisassemble(ctx: BotContext): Promise<void> {
  // Will be implemented in callback handler
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

    // Handle text messages
    if ('text' in message) {
      const text = message.text;

      // Handle menu buttons
      switch (text) {
        case '🎬 Create Video':
        case '🚀 Get Started':
          await ctx.reply(
            '📤 Please upload 1-5 photos of your product:\n\n' +
            'Tips for best results:\n' +
            '• Use high-quality images\n' +
            '• Show the product clearly\n' +
            '• Good lighting helps a lot!',
            {
              reply_markup: {
                remove_keyboard: true,
              },
            }
          );
          ctx.session.state = 'CREATE_VIDEO_UPLOAD';
          return;

        case '💰 Top Up':
          await ctx.reply(
            '💳 Choose your package:\n\n' +
            '• Starter: Rp 50.000 (5 credits + 1 bonus)\n' +
            '• Growth: Rp 150.000 (15 credits + 3 bonus)\n' +
            '• Scale: Rp 500.000 (60 credits + 15 bonus)\n' +
            '• Enterprise: Rp 1.500.000 (200 credits + 60 bonus)',
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: 'Starter', callback_data: 'topup_starter' },
                    { text: 'Growth', callback_data: 'topup_growth' },
                  ],
                  [
                    { text: 'Scale', callback_data: 'topup_scale' },
                    { text: 'Enterprise', callback_data: 'topup_enterprise' },
                  ],
                ],
              },
            }
          );
          return;

        case '📁 My Videos':
          // Call the actual videosCommand to show user's videos from database
          await videosCommand(ctx);
          return;

        case '👤 Profile':
          // Get real user data from database
          const user = ctx.from ? await UserService.findByTelegramId(BigInt(ctx.from.id)) : null;
          const stats = ctx.from ? await UserService.getStats(BigInt(ctx.from.id)) : null;
          
          await ctx.reply(
            '👤 Your Profile\n\n' +
            'Name: ' + (user?.firstName || ctx.from?.first_name || 'Unknown') + '\n' +
            'Username: @' + (user?.username || ctx.from?.username || 'N/A') + '\n' +
            'Tier: ' + (user?.tier || 'Free') + '\n' +
            'Credits: ' + (user ? Number(user.creditBalance) : 0) + '\n' +
            'Referral Code: ' + (user?.referralCode || 'N/A') + '\n\n' +
            '📊 Stats:\n' +
            '• Videos Created: ' + (stats?.videosCreated || 0) + '\n' +
            '• Referrals: ' + (stats?.referralCount || 0) + '\n\n' +
            'Share your referral code and earn 10% commission!',
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🔗 Share Referral', callback_data: 'share_referral' }],
                  [{ text: '⚙️ Settings', callback_data: 'settings' }],
                ],
              },
            }
          );
          return;

        default:
          // Unknown command
          await ctx.reply(
            '❓ I didn\'t understand that.\n\n' +
            'Use the menu below or type /help for assistance.',
            {
              reply_markup: {
                keyboard: [
                  [{ text: '🎬 Create Video' }, { text: '💰 Top Up' }],
                  [{ text: '📁 My Videos' }, { text: '👤 Profile' }],
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
        let result;
        
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
          await ctx.replyWithPhoto(result.imageUrl, {
            caption: `✅ *Image Generated!*\n\n` +
              `_Description: ${description}_\n\n` +
              `What would you like to do?`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '⬇️ Download', url: result.imageUrl }],
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

  } catch (error) {
    logger.error('Error in message handler:', error);
    await ctx.reply('❌ Something went wrong. Please try again later.');
  }
}
