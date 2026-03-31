/**
 * Profile Command
 *
 * Handles /profile command - shows real user data from database
 */

import { BotContext } from '@/types';
import { UserService } from '@/services/user.service';
import { logger } from '@/utils/logger';
import { t } from '@/i18n/translations';

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

    const lang = user.language || 'id';
    const stats = await UserService.getStats(telegramId);

    const tierLabel = user.tier.charAt(0).toUpperCase() + user.tier.slice(1);
    const creditBalance = Number(user.creditBalance);
    const referralCode = user.referralCode || 'N/A';
    const referralLink = `https://t.me/${BOT_USERNAME}?start=ref_${referralCode}`;

    const formatRupiah = (amount: number): string => {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    // Fetch subscription details
    const { SubscriptionService } = await import('../services/subscription.service.js');
    const activeSub = await SubscriptionService.getActiveSubscription(telegramId);
    let subInfo = '';
    if (activeSub) {
      const daysLeft = Math.max(0, Math.ceil((new Date(activeSub.currentPeriodEnd).getTime() - Date.now()) / 86400000));
      const action = activeSub.cancelAtPeriodEnd ? 'Expires' : 'Renews';
      subInfo = `\n*${t('profile.subscription_plan', lang)}:*\n` +
        `- ${t('profile.subscription_plan', lang)}: ${activeSub.plan.charAt(0).toUpperCase() + activeSub.plan.slice(1)} (${activeSub.billingCycle})\n` +
        `- ${t('profile.renews_in', lang, { action, days: daysLeft })}\n`;
    }

    await ctx.reply(
      `${t('profile.title', lang)}\n\n` +
      `*Nama:* ${user.firstName} ${user.lastName || ''}\n` +
      `*Username:* @${user.username || 'N/A'}\n` +
      `*ID:* ${from.id}\n\n` +
      '*Info Akun:*\n' +
      `- Tier: ${tierLabel}\n` +
      `- ${t('profile.credits', lang)}: ${creditBalance}\n` +
      `- ${t('profile.videos_created', lang)}: ${stats.videosCreated}\n` +
      subInfo + '\n' +
      '*Info Referral:*\n' +
      `- ${t('profile.referral_code', lang)}: \`${referralCode}\`\n` +
      `- ${t('profile.total_referrals', lang)}: ${stats.referralCount}\n` +
      `- ${t('profile.commission', lang)}: ${formatRupiah(stats.commissionEarned)}\n\n` +
      `*${t('profile.total_spent', lang)}:*\n` +
      `- ${t('profile.total_spent', lang)}: ${formatRupiah(stats.totalSpent)}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t('btn.topup', lang), callback_data: 'open_topup' }],
            [{ text: '📤 Share Referral', url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join and create amazing AI videos! Use my referral link:')}` }],
            [{ text: '⚙️ Settings', callback_data: 'settings' }],
            [{ text: t('btn.main_menu', lang), callback_data: 'main_menu' }],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('Error in profile command:', error);
    await ctx.reply('Failed to load profile. Please try again later.');
  }
}
