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

    await ctx.reply(
      '*Referral & Affiliate*\n\n' +
      'Invite friends and earn commission!\n\n' +
      `*Your Referral Code:* \`${referralCode}\`\n` +
      `*Your Link:* ${referralLink}\n\n` +
      '*Commission Structure:*\n' +
      '- Tier 1 (Direct): 10%\n' +
      '- Tier 2 (Indirect): 5%\n\n' +
      '*Your Stats:*\n' +
      `- Total Referrals: ${stats.referralCount}\n` +
      `- Total Commission: ${formatRupiah(stats.commissionEarned)}\n\n` +
      'Share your link and start earning!',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📤 Share Referral Link',
                url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join and create amazing AI videos! Use my referral link:')}`,
              },
            ],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('Error in referral command:', error);
    await ctx.reply('Failed to load referral info. Please try again later.');
  }
}
