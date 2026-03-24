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
    "📖 *BERKAHKARYA AI — PANDUAN LENGKAP*\n" +
      "─────────────────────────────────────\n\n" +
      "*📚 PROMPT LIBRARY:*\n" +
      "/prompts \\[niche\\] — Browse 40\\+ template profesional\n" +
      "/trending — Prompt paling banyak dipakai minggu ini\n" +
      "/daily — Mystery prompt gratis hari ini 🎁\n" +
      "/fingerprint — Lihat style preference kamu\n\n" +
      "*🎬 GENERATE:*\n" +
      "/create — Buat video dari prompt atau foto\n" +
      "/chat \\[pertanyaan\\] — Chat dengan AI assistant\n\n" +
      "*💳 ACCOUNT:*\n" +
      "/topup — Top up credits\n" +
      "/subscription — Paket langganan Lite/Pro/Agency\n" +
      "/videos — Riwayat video kamu\n" +
      "/profile — Profil & saldo kredit\n" +
      "/referral — Referral & komisi 15%\n" +
      "/settings — Pengaturan akun & bahasa\n" +
      "/support — Hubungi support\n\n" +
      "─────────────────────────────────────\n" +
      "*🎬 Creative Tools \\(via Menu\\):*\n" +
      "🎬 Create Video — AI video generation \\(8 niche\\)\n" +
      "🖼️ Generate Image — AI image dari teks\n" +
      "🔄 Clone Video/Image — Recreate konten serupa\n" +
      "📋 Storyboard — Plan scene sebelum generate\n" +
      "📈 Viral Research — Temukan tren konten\n" +
      "🔍 Disassemble — Extract prompt dari media\n\n" +
      "─────────────────────────────────────\n" +
      "*💡 Quick Tips:*\n" +
      "• Mulai dari /prompts untuk template siap pakai\n" +
      "• Upload foto referensi untuk hasil video lebih baik\n" +
      "• /daily setiap hari untuk prompt gratis\n" +
      "• Refer teman → komisi 15% setiap transaksi\\!\n\n" +
      "Butuh bantuan? /support atau @codergaboets",
    {
      parse_mode: "MarkdownV2",
      reply_markup: {
        inline_keyboard: [
          [{ text: "◀️ Menu Utama", callback_data: "main_menu" }],
        ],
      },
    },
  );
}
