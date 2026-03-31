/**
 * Support Command
 *
 * Handles /support command
 */

import { BotContext } from "@/types";
import { logger } from "@/utils/logger";
import { t } from "@/i18n/translations";

/**
 * Handle /support command
 */
export async function supportCommand(ctx: BotContext): Promise<void> {
  try {
    await ctx.reply(
      "🆘 *Help & Support*\n\n" +
        "*Frequently Asked Questions:*\n\n" +
        "*Q: How do I create a video?*\n" +
        "A: Use /create command and follow the steps.\n\n" +
        "*Q: How long does video generation take?*\n" +
        "A: Usually 2-5 minutes depending on queue.\n\n" +
        "*Q: What formats are supported?*\n" +
        "A: TikTok, Instagram, YouTube, Facebook, Twitter.\n\n" +
        "*Q: How do credits work?*\n" +
        "A: 1 credit = 1 video (30s, 5 scenes)\n\n" +
        "Need more help? Contact us!",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "💬 Chat Support", url: `https://t.me/${process.env.SUPPORT_TELEGRAM_USERNAME || 'codergaboets'}` }],
            [{ text: "📖 View Tutorial", callback_data: "view_tutorial" }],
            [{ text: "🐛 Report Bug", callback_data: "report_bug" }],
            [{ text: "◀️ Menu Utama", callback_data: "main_menu" }],
          ],
        },
      },
    );

    ctx.session.state = "DASHBOARD";
  } catch (error) {
    logger.error('supportCommand error:', error);
    try {
      await ctx.reply(t('error.generic', 'id'));
    } catch { /* ignore */ }
  }
}
