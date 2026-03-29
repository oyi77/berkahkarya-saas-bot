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

import {
  MAIN_MENU_KEYBOARD,
} from "@/config/pricing";

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
            keyboard: MAIN_MENU_KEYBOARD,
            resize_keyboard: true,
          },
        },
      );
    } else {
      // New user — show onboarding with free trial
      const msg = ctx.message as { text?: string } | undefined;
      const startPayload = msg?.text?.split(" ")[1];

      // Extract UTM parameters from start payload or deep link
      // Format: /start utm_source=berkahkarya&utm_campaign=lp1&utm_content=cta_click&lp_variant=1
      const utmParams: any = {};
      const attributionParams: any = {};
      
      if (startPayload) {
        try {
          const params = new URLSearchParams(startPayload.replace('?', ''));
          utmParams.utm_source = params.get('utm_source') || undefined;
          utmParams.utm_medium = params.get('utm_medium') || undefined;
          utmParams.utm_campaign = params.get('utm_campaign') || undefined;
          utmParams.utm_content = params.get('utm_content') || undefined;
          utmParams.lp_variant = params.get('lp_variant') || undefined;
          
          // Attribution IDs
          attributionParams.fbc = params.get('fbc') || undefined;
          attributionParams.fbp = params.get('fbp') || undefined;
          attributionParams.ttclid = params.get('ttclid') || undefined;
        } catch (e) {
          logger.warn(`Failed to parse UTM params from start payload: ${startPayload}`);
        }
      }

      // Detect language from Telegram client settings
      const detectedLang = detectLanguage(user.language_code);

      if (ctx.session) {
        ctx.session.state = "ONBOARDING_LANGUAGE";
        ctx.session.lastActivity = new Date();
        ctx.session.stateData = {
          startPayload: startPayload || null,
          detectedLang,
          utmParams,
          attributionParams,
        };
      }

      // ── NEW: Onboarding dengan Free Trial ────────────────────────────────
      await ctx.reply(
        `Selamat datang di BerkahKarya AI! 🎉\n\n` +
          `📱 **Platform AI Content Creation Terlengkap di Indonesia**\n\n` +
          `Kamu udah dapat **3 credits GRATIS** yang bisa dipake untuk:\n` +
          `• 6 video pendek (5 detik)\n` +
          `• 3 gambar HD\n` +
          `• Atau kombinasi keduanya!\n\n` +
          `─────────────────────────────\n` +
          `**MAU BUAT APA HARI INI?**\n` +
          `─────────────────────────────\n\n` +
          `🎬 **Video**\n` +
          `• Upload foto → jadi video cinematic\n` +
          `• Deskripsikan → AI bikin video\n` +
          `• Clone video viral → adaptasi buat brandmu\n\n` +
          `🖼️ **Gambar**\n` +
          `• Foto produk profesional\n` +
          `• Thumbnail YouTube\n` +
          `• Social media content\n\n` +
          `📋 **Prompt Templates**\n` +
          `• 40+ prompt profesional per niche\n` +
          `• Tinggal pilih → langsung generate\n` +
          `• Gratis untuk semua user!\n\n` +
          `─────────────────────────────\n\n` +
          `Ketik \`/prompts\` untuk lihat semua template siap pakai\n` +
          `atau langsung jelaskan kebutuhanmu! 😊`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🚀 Mulai Sekarang!", callback_data: "onboard_start" }],
              [{ text: "📚 Lihat Prompt Library", callback_data: "prompts_menu" }],
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
