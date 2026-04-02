/**
 * Delete Account Command
 *
 * Allows users to delete their account and all personal data.
 * Required by Indonesian UU PDP law.
 */

import { BotContext } from "@/types";
import { logger } from "@/utils/logger";
import { t } from "@/i18n/translations";

export async function deleteAccountCommand(ctx: BotContext): Promise<void> {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply(t("social.unable_identify_user", "id"));
      return;
    }

    const userLang = ctx.session?.userLang || "id";

    await ctx.reply(
      `${t("delete_account.title", userLang)}\n\n` +
        `${t("delete_account.warning", userLang)}\n\n` +
        `${t("delete_account.irreversible", userLang)}\n` +
        `${t("delete_account.data_removed", userLang)}\n` +
        `${t("delete_account.transaction_retention", userLang)}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `✅ ${t("delete_account.confirm_button", userLang)}`,
                callback_data: "delete_account_confirm",
              },
            ],
            [
              {
                text: `❌ ${t("delete_account.cancel_button", userLang)}`,
                callback_data: "delete_account_cancel",
              },
            ],
          ],
        },
      },
    );

    ctx.session.state = "DASHBOARD";
    logger.info(`User ${userId} requested account deletion`);
  } catch (error) {
    logger.error("deleteAccountCommand error:", error);
    await ctx.reply(t("error.generic", "id"));
  }
}
