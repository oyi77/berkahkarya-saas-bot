/**
 * Videos Command
 * 
 * Handles /videos command
 */

import { BotContext } from '@/types';
import { VideoService } from '@/services/video.service';

/**
 * Handle /videos command
 */
export async function videosCommand(ctx: BotContext): Promise<void> {
  const user = ctx.from;
  let videosList = 'No videos yet. Create your first one!';
  
  if (user) {
    const videos = await VideoService.getUserVideos(BigInt(user.id), 5);
    if (videos.length > 0) {
      videosList = videos.map((v, i) => 
        `${i + 1}. ${v.title}\n   Status: ${v.status} | ${v.duration}s | ${v.platform}\n   Created: ${v.createdAt.toLocaleDateString('id-ID')}`
      ).join('\n\n');
    }
  }

  await ctx.reply(
    '📁 *My Videos*\n\n' +
    `*Recent Videos:*\n${videosList}\n\n` +
    'Videos are stored for 30 days.',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎬 Create New Video', callback_data: 'create_video' }],
          [{ text: '⭐ Favorites', callback_data: 'videos_favorites' }, { text: '🗑️ Trash', callback_data: 'videos_trash' }],
        ],
      },
    }
  );
}
