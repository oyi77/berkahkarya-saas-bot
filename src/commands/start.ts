/**
 * Start Command
 *
 * Handles /start command - entry point for new users
 */

import { BotContext } from "@/types";
import { logger } from "@/utils/logger";
import { UserService } from "@/services/user.service";
import { LANGUAGES } from "@/config/languages";
import { sendVilonaWelcomeAnimation } from "@/services/vilona-animation.service";

/**
 * Map Telegram language_code to our supported language codes.
 */
const TELEGRAM_LANG_MAP: Record<string, string> = {
  id: "id",
  en: "en",
  ms: "ms",
  th: "th",
  vi: "vi",
  "zh-hans": "zh",
  zh: "zh",
  ja: "ja",
  ko: "ko",
  ar: "ar",
  ru: "ru",
  fr: "fr",
  de: "de",
  es: "es",
  "pt-br": "pt",
  pt: "pt",
};

function detectLanguage(telegramLangCode?: string): string {
  if (!telegramLangCode) return "en";
  const lower = telegramLangCode.toLowerCase();
  // Try exact match first, then base language (e.g. "en-us" → "en")
  if (TELEGRAM_LANG_MAP[lower] && LANGUAGES[TELEGRAM_LANG_MAP[lower]]) {
    return TELEGRAM_LANG_MAP[lower];
  }
  const base = lower.split("-")[0];
  if (TELEGRAM_LANG_MAP[base] && LANGUAGES[TELEGRAM_LANG_MAP[base]]) {
    return TELEGRAM_LANG_MAP[base];
  }
  return "en";
}

/**
 * Handle /start command
 */
export async function startCommand(ctx: BotContext): Promise<void> {
  try {
    const user = ctx.from;

    if (!user) {
      await ctx.reply("❌ Unable to identify user. Please try again.");
      return;
    }

    logger.info(
      `User started bot: ${user.id} (${user.username || "no username"})`,
    );

    // Check if user exists in database
    const existingUser = await UserService.findByTelegramId(BigInt(user.id));

    if (existingUser) {
      // Update activity
      await UserService.updateActivity(BigInt(user.id));

      // Check if banned
      if (existingUser.isBanned) {
        await ctx.reply(
          `❌ Your account has been restricted.\n\n` +
            `Reason: ${existingUser.banReason || "No reason provided"}\n\n` +
            `Contact support if you believe this is an error.`,
        );
        return;
      }

      // ── Vilona welcome animation (non-blocking) ──────────────────────────
      await sendVilonaWelcomeAnimation(ctx);

      // ── NEW: Simplified main menu (5 buttons only) ───────────────────────
      const credBal = Number(existingUser.creditBalance);
      const credEmoji = credBal === 0 ? "⚠️" : credBal < 3 ? "🟡" : "🟢";

      // Store credit balance in session for quick access
      if (ctx.session) {
        ctx.session.creditBalance = credBal;
        ctx.session.tier = existingUser.tier || "free";
      }

      await ctx.reply(
        `👋 *Halo, ${user.first_name}!*\n\n` +
          `${credEmoji} Kredit: *${credBal}*\n\n` +
          `Mau buat apa hari ini?`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🎬 Buat Video", callback_data: "create_video_new" }],
              [{ text: "🖼 Buat Gambar", callback_data: "create_image_new" }],
              [{ text: "💳 Kredit & Paket", callback_data: "credits_menu" }],
              [{ text: "🎞 Video Saya", callback_data: "videos_list" }],
              [{ text: "👤 Akun", callback_data: "account_menu" }],
            ],
          },
        },
      );
    } else {
      // New user — show onboarding with free trial
      const msg = ctx.message as { text?: string } | undefined;
      const startPayload = msg?.text?.split(" ")[1];

      // Detect language from Telegram client settings
      const detectedLang = detectLanguage(user.language_code);

      if (ctx.session) {
        ctx.session.state = "ONBOARDING_LANGUAGE";
        ctx.session.lastActivity = new Date();
        ctx.session.stateData = {
          startPayload: startPayload || null,
          detectedLang,
        };
      }

      // ── NEW: Onboarding dengan Free Trial ────────────────────────────────
      await ctx.reply(
        `🎉 *Selamat datang di BerkahKarya AI Video Studio!*\n\n` +
          `Kami membantu Anda membuat konten visual profesional dengan AI.\n\n` +
          `✨ *Fitur unggulan:*\n` +
          `• 🖼 Image Generation - Buat gambar produk, portrait, dll\n` +
          `• 🎬 Video Generation - Transformasi gambar ke video\n` +
          `• 🎨 15 Template Siap Pakai - Editorial, Streetwear, Luxury, dll\n` +
          `• 🌐 Multi-bahasa - 14 bahasa termasuk Indonesia\n\n` +
          `🎁 *FREE TRIAL untuk Anda!*\n` +
          `• 1x Image Generation GRATIS (sekali pakai)\n` +
          `• 1x Daily Free setiap hari (login harian)\n\n` +
          `Klik tombol di bawah untuk mulai! 👇`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🚀 Mulai Sekarang!", callback_data: "onboard_start" }],
            ],
          },
        },
      );
      return;
    }

    // Update session state (returning users only — new users handled after language pick)
    if (ctx.session) {
      ctx.session.state = "DASHBOARD";
      ctx.session.lastActivity = new Date();
    }
  } catch (error) {
    logger.error("Error in start command:", error);
    await ctx.reply("❌ Something went wrong. Please try again later.");
  }
}
