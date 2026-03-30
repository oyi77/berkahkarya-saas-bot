/**
 * Videos Command
 * 
 * Handles /videos command - Show user's video library
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { VideoService } from '@/services/video.service';

/**
 * Handle /videos command
 */
export async function videosCommand(ctx: BotContext): Promise<void> {
  try {
    const user = ctx.from;
  
    if (!user) {
      await ctx.reply('❌ Unable to identify user.');
      return;
    }

    // Get user's videos from database
    const videos = await VideoService.getUserVideos(BigInt(user.id), 10);

    if (videos.length === 0) {
      await ctx.reply(
        '📁 *My Videos*\n\n' +
        'No videos yet. Create your first one! 🎬\n\n' +
        'Videos are stored for 30 days.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎬 Create New Video', callback_data: 'create_video_new' }],
            ],
          },
        }
      );
      return;
    }

    // Build video list with buttons
    const videoButtons = videos.map((v, idx) => {
      const statusEmoji = v.status === 'completed' ? '✅' : 
                          v.status === 'processing' ? '⏳' : 
                          v.status === 'failed' ? '❌' : '📹';
    
      return [{
        text: `${statusEmoji} ${v.title || `Video ${idx + 1}`} (${v.duration}s)`,
        callback_data: `video_view_${v.jobId}`
      }];
    });

    await ctx.reply(
      `📁 *My Videos*\n\n` +
      `Found ${videos.length} video(s)\n\n` +
      `Click a video to view/download:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            ...videoButtons,
            [{ text: '🎬 Buat Video Baru', callback_data: 'create_video_new' }],
            [{ text: '◀️ Menu Utama', callback_data: 'main_menu' }],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('videosCommand error:', error);
    try { await ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.'); } catch { /* ignore */ }
  }
}

/**
 * View video details with download option
 */
export async function viewVideo(ctx: BotContext, jobId: string): Promise<void> {
  const video = await VideoService.getByJobId(jobId);
  
  if (!video) {
    await ctx.answerCbQuery('❌ Video not found');
    return;
  }

  // Status message
  const statusText = {
    processing: '⏳ Processing...',
    completed: '✅ Completed',
    failed: '❌ Failed',
  }[video.status] || video.status;

  const message = 
    `📹 *Video Details*\n\n` +
    `*Title:* ${video.title || 'Untitled'}\n` +
    `*Status:* ${statusText}\n` +
    `*Niche:* ${video.niche}\n` +
    `*Platform:* ${video.platform}\n` +
    `*Duration:* ${video.duration}s\n` +
    `*Scenes:* ${video.scenes}\n` +
    `*Credits Used:* ${Number(video.creditsUsed)}\n` +
    `*Created:* ${video.createdAt.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}\n` +
    (video.completedAt ? `*Completed:* ${video.completedAt.toLocaleDateString('id-ID')}\n` : '') +
    `\n*Expires:* ${video.expiresAt?.toLocaleDateString('id-ID') || 'N/A'}`;

  // If video is completed and has URL, show with thumbnail and download
  if (video.status === 'completed' && video.videoUrl && video.thumbnailUrl) {
    try {
      // Send thumbnail with video info
      await ctx.editMessageMedia(
        {
          type: 'photo',
          media: video.thumbnailUrl,
          caption: message,
          parse_mode: 'Markdown',
        } as any
      );
      
      // Send download button separately
      await ctx.reply(
        '⬇️ *Actions*',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⬇️ Download Video', url: video.downloadUrl || video.videoUrl }],
              [{ text: '🎬 Create Similar', callback_data: `create_similar_${jobId}` }],
              [{ text: '📤 Publish to Social Media', callback_data: `publish_video_${jobId}` }],
              [{ text: '📋 Copy Video URL', callback_data: `video_copy_${jobId}` }],
              [{ text: '🗑️ Delete Video', callback_data: `video_delete_${jobId}` }],
              [{ text: '◀️ Back to List', callback_data: 'videos_list' }],
            ],
          },
        }
      );
    } catch (error) {
      // If photo fails, send as text
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬇️ Download Video', url: video.downloadUrl || video.videoUrl || '#' }],
            [{ text: '🎬 Create Similar', callback_data: `create_similar_${jobId}` }],
            [{ text: '◀️ Back to List', callback_data: 'videos_list' }],
          ],
        },
      });
    }
  } else if (video.status === 'processing') {
    await ctx.editMessageText(
      message + '\n\n_Your video is being generated. Please check back in a few minutes._',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Refresh', callback_data: `video_view_${jobId}` }],
            [{ text: '◀️ Back to List', callback_data: 'videos_list' }],
          ],
        },
      }
    );
  } else if (video.status === 'failed') {
    await ctx.editMessageText(
      message + '\n\n_❌ Video generation failed. Please try again or contact support._',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Retry', callback_data: `video_retry_${jobId}` }],
            [{ text: '◀️ Back to List', callback_data: 'videos_list' }],
          ],
        },
      }
    );
  } else {
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '◀️ Back to List', callback_data: 'videos_list' }],
        ],
      },
    });
  }
}

/**
 * Copy video URL to clipboard (show as text)
 */
export async function copyVideoUrl(ctx: BotContext, jobId: string): Promise<void> {
  try {
    const video = await VideoService.getByJobId(jobId);
  
    if (!video || !video.videoUrl) {
      await ctx.answerCbQuery('❌ Video URL not found');
      return;
    }

    await ctx.answerCbQuery('URL copied!');
    await ctx.reply(
      `📋 *Video URL:*\n\n${video.videoUrl}\n\n` +
      `_Tap and hold the URL above to copy_`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    logger.error('copyVideoUrl error:', error);
    try { await ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.'); } catch { /* ignore */ }
  }
}

/**
 * Delete video
 */
export async function deleteVideo(ctx: BotContext, jobId: string): Promise<void> {
  try {
    const video = await VideoService.getByJobId(jobId);
  
    if (!video) {
      await ctx.answerCbQuery('❌ Video not found');
      return;
    }

    // Soft delete by setting status to deleted
    await ctx.editMessageText(
      `🗑️ *Delete Video*\n\n` +
      `Are you sure you want to delete "${video.title || 'this video'}"?\n\n` +
      `_This action cannot be undone._`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Yes, Delete', callback_data: `video_confirm_delete_${jobId}` },
              { text: '❌ Cancel', callback_data: `video_view_${jobId}` },
            ],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('deleteVideo error:', error);
    try { await ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.'); } catch { /* ignore */ }
  }
}
