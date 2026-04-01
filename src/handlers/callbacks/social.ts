import { BotContext } from "@/types";
import { t } from "@/i18n/translations";

/**
 * Social media connect & auto-post — Coming Soon.
 * PostBridge API integration is not yet available.
 * All social callbacks show a "coming soon" message.
 */

const SOCIAL_PREFIXES = [
  "auto_post_", "publish_video_", "select_platform_", "confirm_publish_",
  "connect_account_", "disconnect_account_",
];

const SOCIAL_EXACT = [
  "manage_accounts", "connect_account_new",
];

export async function handleSocialCallbacks(ctx: BotContext, data: string): Promise<boolean> {
  const isMatch = SOCIAL_EXACT.includes(data) || SOCIAL_PREFIXES.some(p => data.startsWith(p));
  if (!isMatch) return false;

  const lang = ctx.session?.userLang || 'id';
  try {
    await ctx.answerCbQuery(t('social.coming_soon_short', lang)).catch(() => {});
    await ctx.editMessageText(
      t('social.coming_soon', lang),
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: t('btn.main_menu', lang), callback_data: "main_menu" }],
          ],
        },
      },
    );
  } catch {
    await ctx.reply(
      t('social.coming_soon', lang),
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: t('btn.main_menu', lang), callback_data: "main_menu" }],
          ],
        },
      },
    );
  }
  return true;
}
