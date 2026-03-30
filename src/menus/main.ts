/**
 * Main Menu — Inline Keyboard
 *
 * Designed for micro business owners (non-tech users).
 * Clear, simple, action-oriented buttons.
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';

export async function showMainMenu(ctx: BotContext, isEdit = false): Promise<void> {
  try {
    const user = ctx.from;
    if (!user) return;

    // Fetch real credit balance from DB
    let credBal = 0;
    try {
      const dbUser = await UserService.findByTelegramId(BigInt(user.id));
      if (dbUser) credBal = Number(dbUser.creditBalance);
    } catch { /* fallback to 0 */ }

    const credEmoji = credBal === 0 ? '⚠️' : credBal < 3 ? '🟡' : '🟢';

    const menuText =
      `👋 *Halo, ${user.first_name}!*\n\n` +
      `${credEmoji} Kredit: *${credBal}*\n\n` +
      `Mau buat apa hari ini? 👇`;

    const rows: any[][] = [
      [{ text: '📚 Pilih Prompt & Buat Video', callback_data: 'back_prompts' }],
      [
        { text: '🔥 Trending', callback_data: 'prompts_trending' },
        { text: '🎁 Prompt Gratis', callback_data: 'daily_open' },
      ],
      [
        { text: '🎬 Buat Video', callback_data: 'create_video_new' },
        { text: '🖼️ Buat Gambar', callback_data: 'image_from_prompt' },
      ],
      [
        { text: '🔄 Clone', callback_data: 'clone_video' },
        { text: '📋 Storyboard', callback_data: 'storyboard_create' },
        { text: '📈 Viral', callback_data: 'viral_research' },
      ],
      [
        { text: '💰 Top Up', callback_data: 'topup' },
        { text: '⭐ Langganan', callback_data: 'open_subscription' },
      ],
      [
        { text: '📁 Video Saya', callback_data: 'videos_list' },
        { text: '👥 Referral', callback_data: 'open_referral' },
        { text: '👤 Profil', callback_data: 'open_profile' },
      ],
    ];

    const webAppUrl = process.env.WEB_APP_URL;
    if (webAppUrl) {
      rows.push([{ text: '🌐 Dashboard Web', web_app: { url: `${webAppUrl}/app` } }]);
    }

    const menuButtons = { inline_keyboard: rows };

    if (isEdit && ctx.callbackQuery) {
      await ctx.editMessageText(menuText, {
        parse_mode: 'Markdown',
        reply_markup: menuButtons,
      });
    } else {
      await ctx.reply(menuText, {
        parse_mode: 'Markdown',
        reply_markup: menuButtons,
      });
    }
  } catch (error) {
    logger.error('Error showing main menu:', error);
  }
}
