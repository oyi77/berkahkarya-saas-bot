/**
 * Social Command — Manage social media accounts and publish content
 */

import { BotContext } from '@/types';
import { t } from '@/i18n/translations';

/**
 * Handle /social command — show connected accounts or connect new ones
 */
export async function socialCommand(ctx: BotContext): Promise<void> {
  const lang = ctx.session?.userLang || 'id';
  await ctx.reply(
    t('social.coming_soon', lang),
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: t('btn.main_menu', lang), callback_data: 'main_menu' }],
        ],
      },
    },
  );
}
