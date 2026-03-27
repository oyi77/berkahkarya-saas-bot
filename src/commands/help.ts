/**
 * Help Command
 *
 * Handles /help command
 */

import { BotContext } from "@/types";

/**
 * Handle /help command
 */
export async function helpCommand(ctx: BotContext): Promise<void> {
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
      "🎬 `/video` — Buat video dari deskripsi\n" +
      "📸 `/imagine` — Generate gambar\n" +
      "🔄 `/i2v` — Animasikan foto jadi video\n" +
      "🎭 `/avatar` — Buat talking avatar\n\n" +
      "**ACCOUNT:**\n" +
      "─────────────────────────────────────\n" +
      "💰 `/credits` — Cek saldo kredit\n" +
      "📈 `/history` — Riwayat generate\n" +
      "⚙️ `/settings` — Pengaturan akun\n" +
      "🌐 `/lang [id/en]` — Ganti bahasa\n\n" +
      "**INFO:**\n" +
      "─────────────────────────────────────\n" +
      "❓ `/faq` — Pertanyaan umum\n" +
      "💬 `/feedback` — Kirim feedback\n" +
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
}
