/**
 * Referral Command
 *
 * Handles /referral command - shows real referral data from database
 */

import { BotContext } from '@/types';
import { UserService } from '@/services/user.service';
import { logger } from '@/utils/logger';

const BOT_USERNAME = process.env.BOT_USERNAME || 'berkahkarya_saas_bot';

/**
 * Handle /referral command
 */
export async function referralCommand(ctx: BotContext): Promise<void> {
  const from = ctx.from;

  if (!from) {
    await ctx.reply('Unable to load referral info. Please try again.');
    return;
  }

  try {
    const telegramId = BigInt(from.id);
    const user = await UserService.findByTelegramId(telegramId);

    if (!user) {
      await ctx.reply(
        'You don\'t have an account yet. Please use /start to register first.'
      );
      return;
    }

    const stats = await UserService.getStats(telegramId);

    const referralCode = user.referralCode || 'N/A';
    const referralLink = `https://t.me/${BOT_USERNAME}?start=ref_${referralCode}`;

    const formatRupiah = (amount: number): string => {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    const msg =
      `👥 Referral & Affiliate\n\n` +
      `Ajak teman dan dapatkan komisi!\n\n` +
      `Kode Referral: ${referralCode}\n\n` +
      `Struktur Komisi:\n` +
      `• Tier 1 (Langsung): 15%\n` +
      `• Tier 2 (Tidak Langsung): 5%\n\n` +
      `Stats Kamu:\n` +
      `• Total Referral: ${stats.referralCount}\n` +
      `• Total Komisi: ${formatRupiah(stats.commissionEarned)}\n\n` +
      `Opsi Komisi:\n` +
      `• Tukar ke kredit (untuk generate)\n` +
      `• Transfer P2P ke user lain\n` +
      `• Jual ke admin (50% harga kredit)\n\n` +
      `Tap Share untuk mulai earn!`;

    const markup = {
      inline_keyboard: [
        [{ text: '📤 Share Link Referral', url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Buat video iklan AI keren! Pakai link referral saya:')}` }],
        [{ text: '💸 Withdraw Komisi', callback_data: 'referral_withdraw' }],
        [{ text: '📊 Lihat Stats', callback_data: 'referral_stats' }],
        [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
      ],
    };

    await ctx.reply(msg, { reply_markup: markup });
  } catch (error: any) {
    logger.error('Error in referral command:', error);
    await ctx.reply(`Failed to load referral info. Error: ${error.message || 'Unknown'}. Please try again later.`);
  }
}
