/**
 * Profile Command
 *
 * Handles /profile command - shows real user data from database
 */

import { BotContext } from '@/types';
import { UserService } from '@/services/user.service';
import { logger } from '@/utils/logger';

const BOT_USERNAME = process.env.BOT_USERNAME || 'berkahkarya_saas_bot';

/**
 * Handle /profile command
 */
export async function profileCommand(ctx: BotContext): Promise<void> {
  const from = ctx.from;

  if (!from) {
    await ctx.reply('Unable to load profile. Please try again.');
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

    const tierLabel = user.tier.charAt(0).toUpperCase() + user.tier.slice(1);
    const creditBalance = Number(user.creditBalance);
    const referralCode = user.referralCode || 'N/A';
    const referralLink = `https://t.me/${BOT_USERNAME}?start=ref_${referralCode}`;

    const formatRupiah = (amount: number): string => {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    await ctx.reply(
      '*Your Profile*\n\n' +
      `*Name:* ${user.firstName} ${user.lastName || ''}\n` +
      `*Username:* @${user.username || 'N/A'}\n` +
      `*ID:* ${from.id}\n\n` +
      '*Account Info:*\n' +
      `- Tier: ${tierLabel}\n` +
      `- Credits: ${creditBalance}\n` +
      `- Videos Created: ${stats.videosCreated}\n\n` +
      '*Referral Info:*\n' +
      `- Code: \`${referralCode}\`\n` +
      `- Total Referrals: ${stats.referralCount}\n` +
      `- Commission Earned: ${formatRupiah(stats.commissionEarned)}\n\n` +
      '*Spending:*\n' +
      `- Total Spent: ${formatRupiah(stats.totalSpent)}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Top Up Credits', callback_data: 'open_topup' }],
            [{ text: '📤 Share Referral', url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join and create amazing AI videos! Use my referral link:')}` }],
            [{ text: '⚙️ Settings', callback_data: 'settings' }],
            [{ text: '◀️ Menu Utama', callback_data: 'main_menu' }],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('Error in profile command:', error);
    await ctx.reply('Failed to load profile. Please try again later.');
  }
}
