/**
 * New Simplified Main Menu (Redesign 2026-03-24)
 * 
 * 5 core actions:
 * 1. 🎬 Buat Video
 * 2. 🖼 Buat Gambar
 * 3. 💳 Kredit & Paket
 * 4. 🎞 Video Saya
 * 5. 👤 Akun
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';

export async function showMainMenu(ctx: BotContext, isEdit = false): Promise<void> {
  try {
    const user = ctx.from;
    if (!user) return;

    const creditBalance = ctx.session?.creditBalance || 0;
    const credEmoji = creditBalance === 0 ? '⚠️' : creditBalance < 3 ? '🟡' : '🟢';

    const menuText = 
      `👋 *Halo, ${user.first_name}!*\n\n` +
      `${credEmoji} Kredit: *${creditBalance}*\n\n` +
      `Mau buat apa hari ini?`;

    const menuButtons = {
      inline_keyboard: [
        [{ text: '🎬 Buat Video', callback_data: 'create_video_new' }],
        [{ text: '🖼 Buat Gambar', callback_data: 'create_image_new' }],
        [{ text: '💳 Kredit & Paket', callback_data: 'credits_menu' }],
        [{ text: '🎞 Video Saya', callback_data: 'videos_list' }],
        [{ text: '👤 Akun', callback_data: 'account_menu' }],
      ],
    };

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

/**
 * Kredit & Paket Menu (replaces Top Up + Subscription)
 */
export async function showCreditsMenu(ctx: BotContext): Promise<void> {
  const creditBalance = ctx.session?.creditBalance || 0;
  const tier = ctx.session?.tier || 'free';

  await ctx.editMessageText(
    `💳 *Kredit & Paket*\n\n` +
    `Saldo kredit: *${creditBalance}*\n` +
    `Tier: *${tier}*\n\n` +
    `Pilih aksi:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💰 Beli Kredit', callback_data: 'topup' }],
          [{ text: '⭐ Upgrade Langganan', callback_data: 'open_subscription' }],
          [{ text: '🎁 Kode Referral', callback_data: 'open_referral' }],
          [{ text: '◀️ Menu Utama', callback_data: 'main_menu' }],
        ],
      },
    }
  );
}

/**
 * Account Menu (replaces Profile + Settings)
 */
export async function showAccountMenu(ctx: BotContext): Promise<void> {
  await ctx.editMessageText(
    `👤 *Akun*\n\n` +
    `Kelola preferensi dan pengaturan kamu:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⭐ Workflow Favorit', callback_data: 'account_favorites' }],
          [{ text: '⚙️ Preferensi Workflow', callback_data: 'account_preferences' }],
          [{ text: '🎁 Kode Referral', callback_data: 'open_referral' }],
          [{ text: '🌐 Bahasa & Notifikasi', callback_data: 'account_settings' }],
          [{ text: '❓ Bantuan & FAQ', callback_data: 'open_help' }],
          [{ text: '◀️ Menu Utama', callback_data: 'main_menu' }],
        ],
      },
    }
  );
}
