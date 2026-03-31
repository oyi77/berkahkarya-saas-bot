/**
 * Help Command
 *
 * Handles /help command
 */

import { BotContext } from "@/types";
import { logger } from "@/utils/logger";
import { t } from "@/i18n/translations";

/**
 * Handle /help command
 */
export async function helpCommand(ctx: BotContext): Promise<void> {
  try {
    await ctx.reply(
      "📖 **BERKAHKARYA AI — PANDUAN LENGKAP**\n" +
        "─────────────────────────────────────\n\n" +
        "**COMMANDS UTAMA:**\n" +
        "─────────────────────────────────────\n\n" +
        "📚 `/prompts [niche]` — Browse prompt library\n" +
        "🔥 `/trending` — Lihat prompt trending\n" +
        "🎁 `/daily` — Mystery prompt gratis\n" +
        "🔧 `/customize [id]` — Modify prompt\n" +
        "✨ `/create` — Bikin prompt custom via AI\n" +
        "📊 `/fingerprint` — Lihat style preference kamu\n\n" +
        "**GENERATE:**\n" +
        "─────────────────────────────────────\n" +
        "🎬 `/create` — Buat video / gambar AI\n" +
        "📋 `/prompts` — Browse prompt library\n" +
        "🔥 `/trending` — Prompt trending\n" +
        "🎁 `/daily` — Mystery prompt gratis\n\n" +
        "**ACCOUNT:**\n" +
        "─────────────────────────────────────\n" +
        "💰 `/topup` — Isi kredit\n" +
        "📋 `/subscription` — Langganan & paket\n" +
        "🎞 `/videos` — Video saya\n" +
        "👤 `/profile` — Profil akun\n" +
        "⚙️ `/settings` — Pengaturan\n" +
        "👥 `/referral` — Program referral\n\n" +
        "**INFO:**\n" +
        "─────────────────────────────────────\n" +
        "❓ `/help` — Panduan lengkap\n" +
        "📞 `/support` — Hubungi support\n\n" +
        "─────────────────────────────────────\n\n" +
        "Butuh bantuan spesifik? Langsung tanya aja! 😊",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "◀️ Menu Utama", callback_data: "main_menu" }],
          ],
        },
      },
    );
  } catch (error) {
    logger.error('helpCommand error:', error);
    try {
      await ctx.reply(t('error.generic', 'id'));
    } catch { /* ignore */ }
  }
}
