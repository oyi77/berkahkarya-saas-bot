import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { AdsService } from '@/services/ads.service';

/**
 * Handle /report_today command
 */
export async function reportTodayCommand(ctx: BotContext): Promise<void> {
  try {
    const data = await AdsService.getDailyFunnel(ctx.from?.id.toString() || '');
    const today = data[data.length - 1];

    const message = 
      `📊 **Daily Ads Report - ${today.date}**\n\n` +
      `💰 Spend: Rp ${today.spend.toLocaleString('id-ID')}\n` +
      `🖱️ Shopee Clicks: ${today.shopeeClicks.toLocaleString('id-ID')}\n` +
      `📦 Orders: ${today.orders}\n` +
      `💸 Revenue: Rp ${today.revenue.toLocaleString('id-ID')}\n` +
      `📈 ROAS: ${today.roas === Infinity ? '∞' : today.roas.toFixed(2)}\n` +
      `🔥 **Profit: Rp ${today.profit.toLocaleString('id-ID')}**`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Error in report_today command:', error);
    await ctx.reply('❌ Gagal menarik laporan.');
  }
}

/**
 * Handle /creative_ideas command
 */
export async function creativeIdeasCommand(ctx: BotContext): Promise<void> {
  try {
    const ideas = await AdsService.generateIdeas(5);
    let message = `💡 **Top 5 Creative Ideas for Today:**\n\n`;
    
    ideas.forEach((item, i) => {
      message += `${i + 1}. **${item.topic}**\n   Hook: ${item.hook}\n\n`;
    });

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Error in creative_ideas command:', error);
    await ctx.reply('❌ Gagal generate ide.');
  }
}
