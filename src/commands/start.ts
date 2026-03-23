/**
 * Start Command
 * 
 * Handles /start command - entry point for new users
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';
import { t } from '@/i18n/translations';
import { LANGUAGE_LIST, LANG_PAGE_SIZE, LANGUAGES } from '@/config/languages';
import { sendVilonaWelcomeAnimation } from '@/services/vilona-animation.service';

/**
 * Map Telegram language_code to our supported language codes.
 */
const TELEGRAM_LANG_MAP: Record<string, string> = {
  id: 'id',
  en: 'en',
  ms: 'ms',
  th: 'th',
  vi: 'vi',
  'zh-hans': 'zh',
  zh: 'zh',
  ja: 'ja',
  ko: 'ko',
  ar: 'ar',
  ru: 'ru',
  fr: 'fr',
  de: 'de',
  es: 'es',
  'pt-br': 'pt',
  pt: 'pt',
};

function detectLanguage(telegramLangCode?: string): string {
  if (!telegramLangCode) return 'en';
  const lower = telegramLangCode.toLowerCase();
  // Try exact match first, then base language (e.g. "en-us" → "en")
  if (TELEGRAM_LANG_MAP[lower] && LANGUAGES[TELEGRAM_LANG_MAP[lower]]) {
    return TELEGRAM_LANG_MAP[lower];
  }
  const base = lower.split('-')[0];
  if (TELEGRAM_LANG_MAP[base] && LANGUAGES[TELEGRAM_LANG_MAP[base]]) {
    return TELEGRAM_LANG_MAP[base];
  }
  return 'en';
}

/**
 * Handle /start command
 */
export async function startCommand(ctx: BotContext): Promise<void> {
  try {
    const user = ctx.from;
    
    if (!user) {
      await ctx.reply('❌ Unable to identify user. Please try again.');
      return;
    }

    logger.info(`User started bot: ${user.id} (${user.username || 'no username'})`);

    // Check if user exists in database
    const existingUser = await UserService.findByTelegramId(BigInt(user.id));

    if (existingUser) {
      // Update activity
      await UserService.updateActivity(BigInt(user.id));
      
      // Check if banned
      if (existingUser.isBanned) {
        await ctx.reply(
          `❌ Your account has been restricted.\n\n` +
          `Reason: ${existingUser.banReason || 'No reason provided'}\n\n` +
          `Contact support if you believe this is an error.`
        );
        return;
      }

      // ── Vilona welcome animation (non-blocking) ──────────────────────────
      await sendVilonaWelcomeAnimation(ctx);

      // ── Single dashboard message: keyboard + inline menu ─────────────────
      // Telegram requires separate messages for reply_keyboard vs inline_keyboard.
      // We minimize to 2 msgs: (1) set keyboard silently, (2) main menu.
      const credBal = Number(existingUser.creditBalance);
      const credEmoji = credBal === 0 ? '⚠️' : credBal < 3 ? '🟡' : '🟢';

      // Msg 1 — set bottom keyboard (minimized, no clutter)
      await ctx.reply(
        `${credEmoji} *${existingUser.creditBalance} kredit* tersisa`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [
              [{ text: '📚 Prompt Library' }, { text: '🔥 Trending' }],
              [{ text: '🎬 Create Video' }, { text: '🖼️ Generate Image' }],
              [{ text: '🎁 Daily Prompt' }, { text: '💬 Chat AI' }],
              [{ text: '💰 Top Up' }, { text: '⭐ Subscription' }],
              [{ text: '👤 Profile' }, { text: '🆘 Support' }],
            ],
            resize_keyboard: true,
          },
        }
      );

      // Msg 2 — main inline menu
      await ctx.reply(
        `👋 Halo, *${user.first_name}!* Mau buat apa hari ini? 👇`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📚 Pilih Prompt & Buat Video', callback_data: 'back_prompts' }],
              [
                { text: '🔥 Trending', callback_data: 'prompts_trending' },
                { text: '🎁 Prompt Gratis', callback_data: 'daily_open' },
              ],
              [
                { text: '🎬 Buat Video', callback_data: 'create_video' },
                { text: '🖼️ Buat Gambar', callback_data: 'image_generate' },
              ],
              [
                { text: '🔄 Clone', callback_data: 'clone_video' },
                { text: '📋 Storyboard', callback_data: 'storyboard_create' },
                { text: '📈 Viral', callback_data: 'viral_research' },
              ],
              [
                { text: '💰 Top Up', callback_data: 'topup' },
                { text: '⭐ Langganan', callback_data: 'open_subscription' },
              ],
              [
                { text: '📁 Video Saya', callback_data: 'videos_list' },
                { text: '👥 Referral', callback_data: 'open_referral' },
                { text: '👤 Profil', callback_data: 'open_profile' },
              ],
            ],
          },
        }
      );
    } else {
      // New user — show language selection before creating account
      // Check for referral code in deep link and preserve it in session
      const msg = ctx.message as { text?: string } | undefined;
      const startPayload = msg?.text?.split(' ')[1];

      // Detect language from Telegram client settings
      const detectedLang = detectLanguage(user.language_code);

      if (ctx.session) {
        ctx.session.state = 'ONBOARDING_LANGUAGE';
        ctx.session.lastActivity = new Date();
        ctx.session.stateData = { startPayload: startPayload || null, detectedLang };
      }

      // Build first page of language buttons (2 per row, first 8 popular)
      // Put detected language first with a checkmark indicator
      const detectedEntry = LANGUAGE_LIST.find(l => l.code === detectedLang);
      const restItems = LANGUAGE_LIST.filter(l => l.code !== detectedLang);
      const reordered = detectedEntry ? [detectedEntry, ...restItems] : [...LANGUAGE_LIST];
      const pageItems = reordered.slice(0, LANG_PAGE_SIZE);

      const langButtons: Array<Array<{ text: string; callback_data: string }>> = [];
      for (let i = 0; i < pageItems.length; i += 2) {
        const row: Array<{ text: string; callback_data: string }> = [];
        for (let j = i; j < Math.min(i + 2, pageItems.length); j++) {
          const lang = pageItems[j];
          const isDetected = lang.code === detectedLang;
          row.push({
            text: isDetected ? `${lang.flag} ${lang.label} ✓` : `${lang.flag} ${lang.label}`,
            callback_data: `onboard_lang_${lang.code}`,
          });
        }
        langButtons.push(row);
      }

      // "More languages" button if there are more than one page
      if (reordered.length > LANG_PAGE_SIZE) {
        langButtons.push([{ text: '🌐 More languages...', callback_data: 'onboard_lang_more_1' }]);
      }

      const detectedLabel = detectedEntry ? `${detectedEntry.flag} ${detectedEntry.label}` : 'English';
      await ctx.reply(
        `🌐 *Selamat datang di Vilona Asisten OpenClaw!*\n\n` +
        `Detected language: *${detectedLabel}*\n\n` +
        `Please select your preferred language.\n` +
        `This will be used for the bot interface, voice over, subtitles, and captions.`,
        {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: langButtons },
        }
      );
      return;
    }

    // Update session state (returning users only — new users handled after language pick)
    if (ctx.session) {
      ctx.session.state = 'DASHBOARD';
      ctx.session.lastActivity = new Date();
    }

  } catch (error) {
    logger.error('Error in start command:', error);
    await ctx.reply('❌ Something went wrong. Please try again later.');
  }
}
