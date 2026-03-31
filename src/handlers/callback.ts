/**
 * Callback Handler
 *
 * Handles all callback queries (inline button clicks)
 */

import { BotContext } from "@/types";
import { logger } from "@/utils/logger";
import { prisma } from "@/config/database";
import { redis } from "@/config/redis";
import { UserService } from "@/services/user.service";
import {
  topupCommand,
} from "@/commands/topup";
import { profileCommand } from "@/commands/profile";
import { referralCommand } from "@/commands/referral";
import { helpCommand } from "@/commands/help";
import {
  getLangConfig,
  LANGUAGE_LIST,
  LANG_PAGE_SIZE,
} from "@/config/languages";
import {
  handleDurationSelection,
  handleNicheSelection,
  handleStyleSelection,
  handlePlatformSelection,
  handleVOToggle,
  handleVOContinue,
  handleCustomPromptRequest,
  handleSkipPrompt,
  createCommand,
  generateCaption,
} from "@/commands/create";
import {
  videosCommand,
  viewVideo,
  copyVideoUrl,
  deleteVideo,
} from "@/commands/videos";
import { NICHES } from "@/services/video-generation.service";
import { VideoService } from "@/services/video.service";
import { PostAutomationService } from "@/services/postautomation.service";
import {
  handleVideoCreationImage,
  handleSkipImageReference,
} from "@/handlers/message";
import { AvatarService } from "@/services/avatar.service";
import {
  paymentSettingsCommand,
  handlePaymentDefaultGateway,
  handlePaymentToggleGateway,
  handlePaymentSetDefault,
} from "@/commands/admin/paymentSettings";
import {
  getImageCreditCostAsync,
  getVideoCreditCostAsync,
} from "@/config/pricing";
import { ImageGenerationService } from "@/services/image.service";
import { enqueueVideoGeneration } from "@/config/queue";
import { t } from "@/i18n/translations";
import {
  showNichePrompts,
  showCustomizePrompt,
  promptsCommand,
  trendingCommand as promptsTrendingCommand,
  dailyCommand as promptsDailyCommand,
  PROMPT_LIBRARY,
  MYSTERY_PROMPTS,
  TRENDING_PROMPTS,
  getPromptById,
  saveLibraryPrompt,
  showMyPrompts,
  startAddCustomPrompt,
} from "@/commands/prompts";
import { SavedPromptService } from "@/services/saved-prompt.service";
import { P2pService } from "@/services/p2p.service";
import { PaymentSettingsService } from "@/services/payment-settings.service";

// ── Back button helpers ──────────────────────────────────────────────────────
const BTN_BACK_MAIN = { text: "◀️ Menu Utama", callback_data: "main_menu" };

/**
 * Handle storyboard selection
 */
async function handleStoryboardRequest(ctx: BotContext, niche: string) {
  try {
    const storyboard = await VideoService.generateStoryboard({
      niche,
      duration: 30,
    });

    let message = `📋 *Storyboard: ${niche.toUpperCase()}*\n\n`;

    storyboard.scenes.forEach((s) => {
      message += `🎬 *Scene ${s.scene} (${s.duration}s)*\n`;
      message += `Type: ${s.type}\n`;
      message += `Desc: ${s.description}\n\n`;
    });

    message += `📝 *Caption:*\n_${storyboard.caption}_\n\n`;
    message += `💰 *Cost: 1.0 Credits*`;

    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 Create Video Now",
              callback_data: `confirm_create_${niche}`,
            },
          ],
          [
            {
              text: "◀️ Back to Selection",
              callback_data: "storyboard_create",
            },
          ],
        ],
      },
    });
  } catch (error) {
    logger.error("Storyboard error:", error);
    await ctx.answerCbQuery("Error generating storyboard");
  }
}

/**
 * Handle callback queries
 */
export async function callbackHandler(ctx: BotContext): Promise<void> {
  try {
    const callbackQuery = ctx.callbackQuery;

    if (!callbackQuery || !("data" in callbackQuery)) {
      return;
    }

    const data = callbackQuery.data;

    logger.debug("Callback received:", { userId: ctx.from?.id, data });

    // Route to appropriate handler based on callback data prefix

    // ── P2P TRANSFER HANDLERS ───────────────────────────────────────────
    if (data === "cancel_send") {
      await ctx.answerCbQuery("❌ Transfer cancelled");
      await ctx.editMessageText("❌ Transfer cancelled by user.");
      return;
    }

    if (data.startsWith("confirm_send_")) {
      const parts = data.replace("confirm_send_", "").split("_");
      const recipientIdStr = parts[0];
      const amountStr = parts[1];
      const recipientId = BigInt(recipientIdStr);
      const amount = Number(amountStr);
      const senderId = BigInt(ctx.from!.id);

      try {
        await ctx.answerCbQuery("Processing transfer...");
        const result = await P2pService.executeTransfer(senderId, recipientId, amount);

        if (result.success) {
          await ctx.editMessageText(
            `✅ *Transfer Successful!*\n\n` +
            `You have successfully sent *${amount}* credits to ID \`${recipientIdStr}\`.`,
            { parse_mode: "Markdown" }
          );

          // Notify recipient
          try {
            await ctx.telegram.sendMessage(
              Number(recipientIdStr),
              `💸 *You received credits!*\n\n` +
              `User \`${senderId}\` has sent you *${amount}* credits.\n` +
              `Check your balance with /profile.`,
              { parse_mode: "Markdown" }
            );
          } catch (err) {
            logger.warn(`Failed to notify recipient ${recipientIdStr}`);
          }
        } else {
          await ctx.editMessageText(`❌ *Transfer Failed:* ${result.error}`, { parse_mode: "Markdown" });
        }
      } catch (error: any) {
        await ctx.editMessageText(`❌ *Transfer Error:* ${error.message}`, { parse_mode: "Markdown" });
      }
      return;
    }

    // ── UNIVERSAL NOOP (pagination display buttons) ──────────────────────
    if (data === "noop") {
      await ctx.answerCbQuery();
      return;
    }

    // ── NEW REDESIGN HANDLERS (2026-03-24) ───────────────────────────────
    if (data === "main_menu") {
      await ctx.answerCbQuery();
      // Always reset state so user isn't stuck in a previous flow
      if (ctx.session) ctx.session.state = "DASHBOARD";
      const user = ctx.from;
      if (!user) return;
      const dbUser = await UserService.findByTelegramId(BigInt(user.id));
      const credBal = dbUser ? Number(dbUser.creditBalance) : 0;
      const credEmoji = credBal === 0 ? "⚠️" : credBal < 3 ? "🟡" : "🟢";

      const rows: any[][] = [
        [{ text: "📚 Pilih Prompt & Buat Video", callback_data: "back_prompts" }],
        [
          { text: "🔥 Trending", callback_data: "prompts_trending" },
          { text: "🎁 Prompt Gratis", callback_data: "daily_open" },
        ],
        [
          { text: "🎬 Buat Video", callback_data: "create_video_new" },
          { text: "🖼️ Buat Gambar", callback_data: "image_from_prompt" },
        ],
        [
          { text: "🔄 Clone", callback_data: "clone_video" },
          { text: "📋 Storyboard", callback_data: "storyboard_create" },
          { text: "📈 Viral", callback_data: "viral_research" },
        ],
        [
          { text: "🔄 Repurpose Video", callback_data: "repurpose_video" },
          { text: "🔍 Disassemble", callback_data: "disassemble" },
        ],
        [
          { text: "💰 Top Up", callback_data: "topup" },
          { text: "⭐ Langganan", callback_data: "open_subscription" },
        ],
        [
          { text: "📁 Video Saya", callback_data: "videos_list" },
          { text: "👥 Referral", callback_data: "open_referral" },
          { text: "👤 Profil", callback_data: "open_profile" },
        ],
      ];

      const webAppUrl = process.env.WEB_APP_URL;
      if (webAppUrl) {
        rows.push([{ text: "🌐 Dashboard Web", web_app: { url: `${webAppUrl}/app` } }]);
      }

      await ctx.editMessageText(
        `👋 *Halo, ${user.first_name}!*\n\n` +
        `${credEmoji} Kredit: *${credBal}*\n\n` +
        `Mau buat apa hari ini? 👇`,
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: rows },
        },
      );
      return;
    }

    if (data === "credits_menu") {
      await ctx.answerCbQuery();
      const user = ctx.from;
      if (!user) return;
      const dbUser = await UserService.findByTelegramId(BigInt(user.id));
      const credBal = dbUser ? Number(dbUser.creditBalance) : 0;
      const tier = dbUser?.tier || "free";
      await ctx.editMessageText(
        `💳 *Kredit & Paket*\n\n` +
        `Saldo kredit: *${credBal}*\n` +
        `Tier: *${tier}*\n\n` +
        `Pilih aksi:`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "💰 Beli Kredit", callback_data: "topup" }],
              [
                {
                  text: "⭐ Upgrade Langganan",
                  callback_data: "open_subscription",
                },
              ],
              [{ text: "🎁 Kode Referral", callback_data: "open_referral" }],
              [{ text: "◀️ Menu Utama", callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    if (data === "account_menu") {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `👤 *Akun*\n\n` + `Kelola preferensi dan pengaturan kamu:`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "⭐ Workflow Favorit",
                  callback_data: "account_favorites",
                },
              ],
              [
                {
                  text: "⚙️ Preferensi Workflow",
                  callback_data: "account_preferences",
                },
              ],
              [{ text: "🎁 Kode Referral", callback_data: "open_referral" }],
              [
                {
                  text: "🌐 Bahasa & Notifikasi",
                  callback_data: "account_settings",
                },
              ],
              [{ text: "❓ Bantuan & FAQ", callback_data: "open_help" }],
              [{ text: "◀️ Menu Utama", callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    // Placeholder handlers for new account submenu
    if (data === "account_favorites") {
      await ctx.answerCbQuery("🚧 Fitur Workflow Favorit segera hadir!");
      return;
    }
    if (data === "account_preferences") {
      await ctx.answerCbQuery("🚧 Fitur Preferensi Workflow segera hadir!");
      return;
    }
    if (data === "account_settings") {
      await ctx.answerCbQuery(
        "🚧 Pengaturan Bahasa & Notifikasi segera hadir!",
      );
      return;
    }

    // Chat AI — activate conversational mode
    if (data === "chat_ai") {
      await ctx.answerCbQuery();
      if (ctx.session) ctx.session.state = "DASHBOARD";
      await ctx.editMessageText(
        `💬 *AI Assistant aktif!*\n\n` +
        `Langsung ketik pertanyaan kamu sekarang.\n\n` +
        `*Contoh:*\n` +
        `• "Bikinin prompt untuk bakso saya"\n` +
        `• "Tips video TikTok F&B yang viral"\n\n` +
        `Atau ketik /prompts untuk template siap pakai`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📚 Prompt Library", callback_data: "prompts_menu" }],
              [{ text: "◀️ Menu Utama", callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    // Prompt Library menu
    if (data === "prompts_menu") {
      await ctx.answerCbQuery();
      await promptsCommand(ctx);
      return;
    }

    // Full help
    if (data === "open_help_full") {
      await ctx.answerCbQuery();
      await helpCommand(ctx);
      return;
    }

    // Image generation from prompt library (V3)
    if (data.startsWith("generate_image_v3_")) {
      await ctx.answerCbQuery();
      const promptId = data.replace("generate_image_v3_", "");
      const { findAnyPrompt } = await import("../commands/prompts.js");
      const prompt = await findAnyPrompt(promptId);
      if (!prompt) {
        await ctx.reply("❌ Prompt tidak ditemukan.");
        return;
      }
      // Route to generate_free_ flow which handles image generation
      const { handlePromptsCallback } = await import("./callbacks/prompts.js");
      await handlePromptsCallback(ctx, `generate_free_${promptId}`);
      return;
    }

    // Rate result (placeholder)
    if (data === "generate_rate") {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `⭐ *Rate Hasil Konten*\n\n` +
        `Seberapa puas dengan hasil generate?`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "⭐⭐⭐⭐⭐ Sempurna!", callback_data: "rate_5" },
              ],
              [
                { text: "⭐⭐⭐⭐ Bagus", callback_data: "rate_4" },
              ],
              [
                { text: "⭐⭐⭐ Cukup", callback_data: "rate_3" },
              ],
              [
                { text: "⭐⭐ Kurang", callback_data: "rate_2" },
              ],
              [{ text: "◀️ Menu Utama", callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    if (data.startsWith("rate_")) {
      const score = parseInt(data.replace("rate_", ""));
      await ctx.answerCbQuery(`Terima kasih! Rating: ${"⭐".repeat(score)}`);
      await ctx.editMessageText(
        `✅ *Terima kasih atas feedbacknya!*\n\n` +
        `Rating: ${"⭐".repeat(score)}\n\n` +
        `Feedback kamu membantu kami meningkatkan kualitas AI.`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔄 Generate Lagi", callback_data: "generate_start" }],
              [{ text: "🏠 Menu Utama", callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    // Support: tutorial and bug report
    if (data === "view_tutorial") {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `📖 *Tutorial Singkat*\n\n` +
        `1. Ketik /create untuk membuat video\n` +
        `2. Pilih mode (Basic/Smart/Pro)\n` +
        `3. Upload foto produk atau ketik deskripsi\n` +
        `4. Pilih platform & durasi\n` +
        `5. Konfirmasi — video masuk antrian\n\n` +
        `Untuk gambar: ketik /image\n` +
        `Untuk top up kredit: ketik /topup`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "◀️ Kembali", callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    if (data === "report_bug") {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `🐛 *Report Bug*\n\n` +
        `Temukan bug? Silakan hubungi tim kami:\n\n` +
        `💬 @codergaboets\n\n` +
        `Sertakan:\n` +
        `• Deskripsi masalah\n` +
        `• Langkah-langkah yang dilakukan\n` +
        `• Screenshot (jika ada)`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "◀️ Kembali", callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    // Image generation menu
    if (data === "img_gen_menu") {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `🖼️ *Image Generation*\n\nPilih workflow:`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🛍️ Product Photo", callback_data: "img_product" }],
              [{ text: "🍔 F&B Food", callback_data: "img_fnb" }],
              [{ text: "🏠 Real Estate", callback_data: "img_realestate" }],
              [{ text: "🚗 Car/Automotive", callback_data: "img_car" }],
              [{ text: "◀️ Menu Utama", callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    // ── END NEW REDESIGN HANDLERS ────────────────────────────────────────

    // ── V3 Flow handlers (Basic/Smart/Pro → HPAS) ────────────────────────────────
    if (data === "generate_start" || data === "create_video_new") {
      const { showGenerateMode } = await import("../flows/generate.js");
      await showGenerateMode(ctx);
      return;
    }

    if (data.startsWith("mode_")) {
      const { showGenerateAction } = await import("../flows/generate.js");
      const mode = data.replace("mode_", "") as "basic" | "smart" | "pro";
      await showGenerateAction(ctx, mode);
      return;
    }

    if (data.startsWith("action_")) {
      const { requestProductInput, showSmartPresetSelection } = await import("../flows/generate.js");
      const action = data.replace("action_", "") as "image_set" | "video" | "clone_style" | "campaign";
      if (action === "video" && ctx.session?.generateMode === "smart") {
        await showSmartPresetSelection(ctx);
      } else {
        await requestProductInput(ctx, action);
      }
      return;
    }

    if (data.startsWith("preset_")) {
      const preset = data.replace("preset_", "");

      // Custom duration: ask user to type duration
      if (preset === "custom") {
        await ctx.answerCbQuery?.();
        if (ctx.session) {
          ctx.session.state = "CUSTOM_DURATION_INPUT_V3";
        }
        await ctx.editMessageText(
          `⏱️ *Custom Duration*\n\n` +
          `Ketik durasi video dalam detik:\n\n` +
          `Contoh:\n` +
          `\`90\` = 1 menit 30 detik\n` +
          `\`300\` = 5 menit\n` +
          `\`3600\` = 1 jam\n\n` +
          `Min: 6 detik | Max: 3600 detik (1 jam)`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      const { showSmartPlatformSelection } = await import("../flows/generate.js");
      await showSmartPlatformSelection(ctx, preset as any);
      return;
    }

    if (data.startsWith("platform_")) {
      const platform = data.replace("platform_", "") as "tiktok" | "instagram" | "youtube" | "square";
      if (ctx.session) ctx.session.generatePlatform = platform;
      // If product description already entered, go straight to confirm; otherwise ask for it
      if (ctx.session?.generateProductDesc) {
        const { showConfirmScreen } = await import("../flows/generate.js");
        await showConfirmScreen(ctx);
      } else {
        const { requestProductInput } = await import("../flows/generate.js");
        await requestProductInput(ctx, "video");
      }
      return;
    }

    if (data === "campaign_size_5" || data === "campaign_size_10") {
      const { showConfirmScreen } = await import("../flows/generate.js");
      if (ctx.session) ctx.session.generateCampaignSize = data === "campaign_size_5" ? 5 : 10;
      await showConfirmScreen(ctx);
      return;
    }

    if (data.startsWith("generate_start_") || data === "generate_confirm") {
      const { handleGenerateCallback } = await import("../flows/generate.js");
      await handleGenerateCallback(ctx, data);
      return;
    }

    // Image preference flow (prompt library → image choice)
    if (data === "image_pref_upload") {
      await ctx.answerCbQuery();
      if (ctx.session) ctx.session.state = 'AWAITING_GENERATE_IMAGE';
      await ctx.editMessageText(
        '📸 *Kirim Foto Referensi*\n\nKirim foto yang ingin dijadikan referensi gaya video.\n\nAtau ketik /skip untuk lanjut tanpa foto.',
        { parse_mode: 'Markdown' },
      );
      return;
    }

    if (data === "image_pref_skip") {
      await ctx.answerCbQuery();
      if (ctx.session) {
        delete ctx.session.generatePhotoUrl;
        ctx.session.state = 'DASHBOARD';
      }
      const { continueAfterImagePreference } = await import('../flows/generate.js');
      await continueAfterImagePreference(ctx);
      return;
    }

    if (data === "generate_variation") {
      const { showGenerateMode } = await import("../flows/generate.js");
      await showGenerateMode(ctx);
      return;
    }

    if (data === "generate_new") {
      const { showGenerateMode } = await import("../flows/generate.js");
      await showGenerateMode(ctx);
      return;
    }

    // ── Legacy Creation Handlers ─────────────────
    if (data.startsWith("vcreate_") || data === "create_image_new") {
      const { handleLegacyCreationCallback } = await import("./callbacks/creation.js");
      if (await handleLegacyCreationCallback(ctx, data)) return;
    }

    // ── END NEW VIDEO/IMAGE CREATION HANDLERS ─────────────────────────────

    // ── Prompt Handlers ─────────────────
    if (data.startsWith("prompts_niche_") || data.startsWith("use_prompt_") || data.startsWith("use_admin_prompt_") || data.startsWith("use_saved_") || data.startsWith("generate_free_")) {
      const { handlePromptsCallback } = await import("./callbacks/prompts.js");
      if (await handlePromptsCallback(ctx, data)) return;
    }
    // ── ONBOARDING HANDLERS ───────────────────────────────────────────────
    if (data === "onboard_start") {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `💡 *APA ITU KREDIT?*\n\n` +
        `Kredit adalah mata uang digital di BerkahKarya.\n\n` +
        `*1 kredit bisa digunakan untuk:*\n` +
        `• 5 gambar AI berkualitas\n` +
        `• 1 video pendek (5 detik)\n` +
        `• Video lebih panjang = lebih banyak kredit\n\n` +
        `*CONTOH:*\n` +
        `• 20 kredit = 100 gambar atau 20 video 5 detik\n` +
        `• 50 kredit = 250 gambar atau 50 video 5 detik\n\n` +
        `Siap klaim FREE TRIAL? 🎁`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🎁 Klaim FREE TRIAL!",
                  callback_data: "onboard_claim_trial",
                },
              ],
            ],
          },
        },
      );
      return;
    }

    if (data === "onboard_claim_trial") {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `🎉 *SELAMAT! Anda mendapat FREE TRIAL!*\n\n` +
        `*Bonus yang Anda dapatkan:*\n` +
        `• ✅ 1x Image Generation GRATIS (sekali pakai)\n` +
        `• ✅ 1x Mystery Prompt harian (inspirasi prompt terbaik!)\n\n` +
        `Pilih niche bisnis Anda untuk mulai:`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🍔 F&B", callback_data: "onboard_niche_fnb" },
                { text: "👗 Fashion", callback_data: "onboard_niche_fashion" },
              ],
              [
                { text: "💻 Tech", callback_data: "onboard_niche_tech" },
                { text: "✈️ Travel", callback_data: "onboard_niche_travel" },
              ],
              [
                {
                  text: "🎓 Education",
                  callback_data: "onboard_niche_education",
                },
                { text: "💰 Finance", callback_data: "onboard_niche_finance" },
              ],
              [
                { text: "🏥 Health", callback_data: "onboard_niche_health" },
                {
                  text: "🎬 Entertainment",
                  callback_data: "onboard_niche_entertainment",
                },
              ],
            ],
          },
        },
      );
      return;
    }

    if (data.startsWith("onboard_niche_")) {
      const niche = data.replace("onboard_niche_", "");
      await ctx.answerCbQuery();

      // Create user account with free trial
      const user = ctx.from;
      if (!user) return;

      const telegramId = BigInt(user.id);

      // Check if user already exists
      let dbUser = await UserService.findByTelegramId(telegramId);

      if (!dbUser) {
        // Create new user with free trial (0 kredit, tapi ada welcome bonus)
        const detectedLang = (ctx.session?.stateData?.detectedLang as string) || "id";
        dbUser = await UserService.create({
          telegramId,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          language: detectedLang,
        });

        // Set selected niche and welcome bonus
        await prisma.user.update({
          where: { telegramId },
          data: {
            selectedNiche: niche,
            welcomeBonusUsed: false,
            dailyFreeUsed: false,
            dailyFreeResetAt: null,
          },
        });

        logger.info(
          `New user created with free trial: ${telegramId}, niche: ${niche}`,
        );
      }

      const nicheLabels: Record<string, string> = {
        fnb: "🍔 F&B",
        fashion: "👗 Fashion",
        tech: "💻 Tech",
        travel: "✈️ Travel",
        education: "🎓 Education",
        finance: "💰 Finance",
        health: "🏥 Health",
        entertainment: "🎬 Entertainment",
      };

      await ctx.editMessageText(
        `✅ *Akun berhasil dibuat!*\n\n` +
        `Niche Anda: ${nicheLabels[niche] || niche}\n\n` +
        `📋 *CARA KERJA BOT:*\n\n` +
        `1️⃣ Pilih template dari library\n` +
        `2️⃣ Generate image/video\n` +
        `3️⃣ Tunggu hasil (30 detik - 2 menit)\n` +
        `4️⃣ Download dan gunakan!\n\n` +
        `*FREE TRIAL ANDA:*\n` +
        `• ✅ 1x Image Generation (Welcome Bonus)\n` +
        `• ✅ 1x Mystery Prompt harian (contoh prompt terbaik!)\n` +
        `• 🎨 Harus pilih dari Prompt Library\n` +
        `• 🆓 AI Generation GRATIS\n\n` +
        `*FITUR PREMIUM (Bayar):*\n` +
        `• ✍️ Custom prompt sendiri\n` +
        `• 🎬 Video generation\n` +
        `• 📸 Upload foto produk\n` +
        `• 🚀 Priority queue\n\n` +
        `Siap mulai? 🚀`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🎨 Gunakan Welcome Bonus!",
                  callback_data: "use_welcome_bonus",
                },
              ],
              [{ text: "💰 Beli Kredit", callback_data: "topup" }],
            ],
          },
        },
      );
      return;
    }

    if (data === "use_welcome_bonus") {
      await ctx.answerCbQuery();
      const user = ctx.from;
      if (!user) return;

      const telegramId = BigInt(user.id);
      const dbUser = await UserService.findByTelegramId(telegramId);

      if (!dbUser) {
        await ctx.reply("❌ User tidak ditemukan. Silakan /start ulang.");
        return;
      }

      // Check if welcome bonus already used
      if (dbUser.welcomeBonusUsed) {
        await ctx.editMessageText(
          `⚠️ *Welcome Bonus sudah digunakan!*\n\n` +
          `Gunakan Daily Free Anda atau beli kredit.`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🎁 Gunakan Daily Free",
                    callback_data: "use_daily_free",
                  },
                ],
                [{ text: "💰 Beli Kredit", callback_data: "topup" }],
                [{ text: "🏠 Menu Utama", callback_data: "main_menu" }],
              ],
            },
          },
        );
        return;
      }

      // Redirect to prompt library for selected niche
      const niche = dbUser.selectedNiche || "fnb";
      await ctx.editMessageText(
        `🎨 *Welcome Bonus: 1x Image Generation*\n\n` +
        `Pilih prompt dari library ${niche.toUpperCase()}:`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📚 Lihat Prompt Library",
                  callback_data: `prompts_niche_${niche}`,
                },
              ],
              [{ text: "◀️ Kembali", callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    if (data === "use_daily_free") {
      await ctx.answerCbQuery();
      const user = ctx.from;
      if (!user) return;

      const telegramId = BigInt(user.id);
      const dbUser = await UserService.findByTelegramId(telegramId);

      if (!dbUser) {
        await ctx.reply("❌ User tidak ditemukan. Silakan /start ulang.");
        return;
      }

      const { canUseDailyFree, getNextDailyFreeReset } =
        await import("../config/free-trial.js");

      // Check if daily free can be used
      if (!canUseDailyFree(dbUser)) {
        const resetAt = dbUser.dailyFreeResetAt || getNextDailyFreeReset();
        const hoursLeft = Math.ceil(
          (resetAt.getTime() - Date.now()) / (1000 * 60 * 60),
        );

        await ctx.editMessageText(
          `⏰ *Daily Free belum reset!*\n\n` +
          `Reset dalam: ${hoursLeft} jam\n` +
          `Reset time: 00:00 WIB setiap hari\n\n` +
          `Gunakan Welcome Bonus atau beli kredit.`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🎁 Gunakan Welcome Bonus",
                    callback_data: "use_welcome_bonus",
                  },
                ],
                [{ text: "💰 Beli Kredit", callback_data: "topup" }],
                [{ text: "🏠 Menu Utama", callback_data: "main_menu" }],
              ],
            },
          },
        );
        return;
      }

      // Redirect to prompt library
      const niche = dbUser.selectedNiche || "fnb";
      await ctx.editMessageText(
        `🎁 *Daily Free: 1x Image Generation*\n\n` +
        `Pilih prompt dari library ${niche.toUpperCase()}:`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📚 Lihat Prompt Library",
                  callback_data: `prompts_niche_${niche}`,
                },
              ],
              [{ text: "◀️ Kembali", callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    // Onboarding language selection (new users picking language before account creation)
    if (data.startsWith("onboard_lang_more_")) {
      // Paginated "more languages" view
      await ctx.answerCbQuery();
      const page = parseInt(data.replace("onboard_lang_more_", ""));
      const start = page * LANG_PAGE_SIZE;
      const pageItems = LANGUAGE_LIST.slice(start, start + LANG_PAGE_SIZE);
      const totalPages = Math.ceil(LANGUAGE_LIST.length / LANG_PAGE_SIZE);

      const langButtons: Array<Array<{ text: string; callback_data: string }>> =
        [];
      for (let i = 0; i < pageItems.length; i += 2) {
        const row: Array<{ text: string; callback_data: string }> = [];
        for (let j = i; j < Math.min(i + 2, pageItems.length); j++) {
          const lang = pageItems[j];
          row.push({
            text: `${lang.flag} ${lang.label}`,
            callback_data: `onboard_lang_${lang.code}`,
          });
        }
        langButtons.push(row);
      }

      // Pagination row
      const navRow: Array<{ text: string; callback_data: string }> = [];
      if (page > 0)
        navRow.push({
          text: "\u25c0\ufe0f Prev",
          callback_data: `onboard_lang_more_${page - 1}`,
        });
      navRow.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
      if (page < totalPages - 1)
        navRow.push({
          text: "Next \u25b6\ufe0f",
          callback_data: `onboard_lang_more_${page + 1}`,
        });
      langButtons.push(navRow);

      await ctx.editMessageText(
        `\ud83c\udf10 *Selamat datang di Vilona Asisten OpenClaw!*\n\n` +
        `Please select your preferred language.\n` +
        `This will be used for the bot interface, voice over, subtitles, and captions.`,
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: langButtons },
        },
      );
      return;
    }

    if (data.startsWith("onboard_lang_")) {
      // User picked a language — create account and run welcome flow
      const langCode = data.replace("onboard_lang_", "");
      const langCfg = getLangConfig(langCode);
      await ctx.answerCbQuery(`${langCfg.flag} ${langCfg.label}`);

      const userId = ctx.from?.id;
      if (!userId) return;

      // Resolve referral from session stateData
      let referredBy: string | undefined;
      const startPayload = ctx.session?.stateData?.startPayload as
        | string
        | null;
      if (startPayload?.startsWith("ref_")) {
        const refCode = startPayload.replace("ref_", "");
        const referrer = await UserService.findByReferralCode(refCode);
        if (referrer) {
          referredBy = referrer.uuid;
        }
      }

      // Create the user with the selected language
      const user = ctx.from!;
      await UserService.create({
        telegramId: BigInt(user.id),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        language: langCode,
        referredBy,
      });

      // Update language selection confirmation on the picker message
      await ctx.editMessageText(`${langCfg.flag} ${langCfg.label} \u2705`, {
        parse_mode: "Markdown",
      });

      // ── Guided onboarding — step-by-step, friendly ───────────────────────
      const lang = langCode;

      // Message 1: Welcome + inline menu
      await ctx.reply(t("onboarding.welcome", lang), {
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
      });

      // Message 2 (after 1.5s): how to start guide
      await new Promise((r) => setTimeout(r, 1500));
      await ctx.reply(t("onboarding.features", lang), {
        parse_mode: "Markdown",
      });

      // Message 3 (after 1.5s): CTA with prompt-first flow
      await new Promise((r) => setTimeout(r, 1500));
      await ctx.reply(t("onboarding.cta", lang), {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            // Primary: prompt discovery
            [
              {
                text: t("onboarding.btn_create_video", lang),
                callback_data: "back_prompts",
              },
            ],
            // Secondary: daily free prompt
            [
              {
                text: t("onboarding.btn_try_image", lang),
                callback_data: "daily_open",
              },
            ],
            // Tertiary: AI chat help
            [
              {
                text: t("onboarding.btn_chat_ai", lang),
                callback_data: "open_chat",
              },
            ],
          ],
        },
      });

      // Update session to dashboard
      if (ctx.session) {
        ctx.session.state = "DASHBOARD";
        ctx.session.lastActivity = new Date();
        ctx.session.stateData = {};
      }
      return;
    }

    // ── Account & Billing Handlers ─────────────────
    if (data.startsWith("topup_") || data.startsWith("check_payment_") || data.startsWith("subscribe_") || data === "cancel_subscription" || data === "open_subscription") {
      const { handleAccountCallback } = await import("./callbacks/account.js");
      if (await handleAccountCallback(ctx, data)) return;
    }
    // Niche selection (Phase 1)
    if (data.startsWith("select_niche_")) {
      const nicheKey = data.replace("select_niche_", "");
      await handleNicheSelection(ctx, nicheKey);
      return;
    }

    // Style selection (Phase 1)
    if (data.startsWith("select_style_")) {
      const styleKey = data.replace("select_style_", "");
      await handleStyleSelection(ctx, styleKey);
      return;
    }

    // Platform selection (create flow)
    if (data.startsWith("create_platform_")) {
      const platformKey = data.replace("create_platform_", "");
      await handlePlatformSelection(ctx, platformKey);
      return;
    }

    // Video quality feedback
    if (data.startsWith("feedback_good_")) {
      const jobId = data.replace("feedback_good_", "");
      await ctx.answerCbQuery();
      try {
        await redis.set(`feedback:${jobId}`, "good", "EX", 86400 * 30);
      } catch (_) {
        /* Redis optional */
      }
      const feedbackUser = ctx.from
        ? await UserService.findByTelegramId(BigInt(ctx.from.id.toString()))
        : null;
      const feedbackLang = feedbackUser?.language || "id";
      await ctx.reply(t("feedback.thanks_good", feedbackLang));
      return;
    }

    if (data.startsWith("feedback_bad_")) {
      const jobId = data.replace("feedback_bad_", "");
      await ctx.answerCbQuery();
      try {
        await redis.set(`feedback:${jobId}`, "bad", "EX", 86400 * 30);
      } catch (_) {
        /* Redis optional */
      }
      const feedbackUser = ctx.from
        ? await UserService.findByTelegramId(BigInt(ctx.from.id.toString()))
        : null;
      const feedbackLang = feedbackUser?.language || "id";
      await ctx.reply(t("feedback.thanks_bad", feedbackLang), {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔄 Coba Lagi", callback_data: "back_prompts" }],
          ],
        },
      });
      return;
    }

    if (data === "custom_duration") {
      await handleDurationSelection(ctx, "custom_duration");
      return;
    }

    if (data.startsWith("duration_")) {
      const durationStr = data.replace("duration_", "");
      await handleDurationSelection(ctx, durationStr);
      return;
    }

    // VO / Subtitle toggle handlers
    if (data === "vo_toggle_vo") {
      await handleVOToggle(ctx, "vo");
      return;
    }
    if (data === "vo_toggle_subtitles") {
      await handleVOToggle(ctx, "subtitles");
      return;
    }
    if (data === "vo_continue") {
      await handleVOContinue(ctx);
      return;
    }
    if (data === "create_custom_prompt") {
      await handleCustomPromptRequest(ctx);
      return;
    }
    if (data === "create_skip_prompt") {
      await handleSkipPrompt(ctx);
      return;
    }
    // Upload reference from VO continue screen
    if (data === "create_upload_reference") {
      await ctx.answerCbQuery();
      if (ctx.session?.videoCreation)
        ctx.session.videoCreation.waitingForImage = true;
      ctx.session!.state = "CREATE_VIDEO_UPLOAD";
      await ctx.editMessageText(
        "📸 *Upload Foto Referensi*\n\n" +
        "Kirim foto produk kamu sekarang.\n" +
        "AI akan animasikan foto tersebut menjadi video!\n\n" +
        "_Atau ketik /skip untuk generate tanpa foto._",
        { parse_mode: "Markdown" },
      );
      return;
    }

    // Legacy handlers removed for MVP
    // Mode, niche, platform selection now automatic

    // Brief skip
    if (data === "brief_skip") {
      await ctx.editMessageText(
        "⏭️ Brief skipped\n\n" +
        "✅ Confirm video creation:\n\n" +
        "Estimated credits: 1.0\n\n" +
        "Proceed?",
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Yes, Create!", callback_data: "confirm_create" },
                { text: "❌ Cancel", callback_data: "cancel_create" },
              ],
            ],
          },
        },
      );
      return;
    }

    if (data === "confirm_create") {
      // Redirect to V3 generate flow
      const { showGenerateMode } = await import("../flows/generate.js");
      await showGenerateMode(ctx);
      return;
    }

    if (data === "cancel_create") {
      await ctx.editMessageText(
        "❌ Video creation cancelled.\n\n" + "Use /create to start again.",
      );
      ctx.session.state = "DASHBOARD";
      return;
    }

    // Payment method handlers (placeholder - will use Midtrans)
    if (data.startsWith("payment_")) {
      const [, method, packageId] = data.split("_");

      await ctx.editMessageText(
        `💳 Processing ${method} payment...\n\n` +
        "In sandbox mode - this would redirect to Midtrans payment page.",
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✅ Simulate Success",
                  callback_data: `simulate_success_${packageId}`,
                },
              ],
            ],
          },
        },
      );
      return;
    }

    if (data.startsWith("simulate_success_")) {
      const packageId = data.replace("simulate_success_", "");

      const credits: Record<string, number> = {
        starter: 6,
        growth: 18,
        scale: 75,
        enterprise: 260,
      };

      await ctx.editMessageText(
        `✅ Payment Successful! (Simulated)\n\n` +
        `Credits added: ${credits[packageId] || 0}\n\n` +
        "Thank you for your purchase! 🎉",
      );
      return;
    }

    // Share referral
    if (data === "share_referral") {
      await ctx.answerCbQuery("Share feature coming soon!");
      return;
    }

    // ─── PROMPT LIBRARY CALLBACKS ──────────────────────────────────────────

    // Browse niche prompts: prompts_fnb, prompts_fashion, etc.
    if (data.startsWith("prompts_")) {
      await ctx.answerCbQuery();
      const nicheKey = data.replace("prompts_", "");
      if (nicheKey === "trending") {
        // Build trending inline (edit in place)
        const TP = TRENDING_PROMPTS;
        const PL = PROMPT_LIBRARY;
        let msg = `🔥 *TRENDING PROMPTS THIS WEEK*\n_Diupdate berdasarkan penggunaan real user!_\n\n`;
        const buttons: any[][] = [];
        TP.forEach((t: any, i: number) => {
          const niche = PL[t.niche];
          const p = niche.prompts.find((x: any) => x.id === t.promptId)!;
          msg += `*#${i + 1}* ${niche.emoji} ${p.title} — ⭐${p.successRate}% | 📈+${t.usageChange}%\n\n`;
          buttons.push([
            {
              text: `#${i + 1} ${p.title}`,
              callback_data: `use_prompt_${p.id}`,
            },
          ]);
        });
        buttons.push([
          { text: "◀️ Kembali ke Niche", callback_data: "back_prompts" },
        ]);
        try {
          await ctx.editMessageText(msg, {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: buttons },
          });
        } catch {
          await promptsTrendingCommand(ctx);
        }
      } else if (nicheKey === "custom") {
        await ctx.editMessageText(
          "✨ *Custom Prompt Generator*\n\n" +
          "Ceritakan kebutuhan kamu:\n\n" +
          "1️⃣ Produk/jasa apa?\n" +
          "2️⃣ Target audience?\n" +
          "3️⃣ Mood video: energetic/calm/luxury?\n" +
          "4️⃣ Platform utama: TikTok/IG/YouTube?\n" +
          "5️⃣ Durasi: 5-60 detik?\n\n" +
          "Jawab semuanya dalam satu pesan, saya akan generate prompt optimal! 🎯",
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "◀️ Kembali", callback_data: "back_prompts" }],
              ],
            },
          },
        );
        if (ctx.session) ctx.session.state = "CUSTOM_PROMPT_CREATION";
      } else {
        await showNichePrompts(ctx, nicheKey, true);
      }
      return;
    }

    // use_prompt_ is handled by the unified prompts callback handler above (line ~508)

    // Customize a prompt: customize_prompt_fnb_1
    if (data.startsWith("customize_prompt_")) {
      await ctx.answerCbQuery();
      const promptId = data.replace("customize_prompt_", "");
      await showCustomizePrompt(ctx, promptId, true);
      return;
    }

    // Customizer style/light quick picks
    if (data.startsWith("cust_style_") || data.startsWith("cust_light_")) {
      await ctx.answerCbQuery();
      const parts = data.split("_");
      // cust_style_cinematic_fnb_1 → type=style, value=cinematic, id=fnb_1
      const type = parts[1]; // style or light
      const value = parts[2];
      const promptId = parts.slice(3).join("_");
      const p = await getPromptById(promptId);
      const base = p?.prompt || "";
      const modifiers: Record<string, string> = {
        cinematic: "cinematic style, film-grade quality",
        dramatic: "dramatic lighting, high contrast, intense atmosphere",
        minimal: "minimalist clean aesthetic, simple background",
        golden: "golden hour natural lighting, warm tones",
        studio: "professional studio lighting, even illumination",
        moody: "moody dark atmosphere, low-key lighting",
      };
      const newPrompt = `${base}, ${modifiers[value] || value}`;
      if (ctx.session)
        ctx.session.stateData = {
          ...(ctx.session.stateData || {}),
          selectedPrompt: newPrompt,
        };
      await ctx.editMessageText(
        `✅ *Prompt Updated!*\n\n\`${newPrompt.slice(0, 300)}\`\n\n_${type === "style" ? "Style" : "Lighting"}: *${value}* applied_\n\nMau buat video atau gambar dengan prompt ini?`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🎬 Buat Video", callback_data: "create_video_new" },
                { text: "🖼️ Buat Gambar", callback_data: "image_from_prompt" },
              ],
              [
                {
                  text: "🔧 Customize Lagi",
                  callback_data: `customize_prompt_${promptId}`,
                },
              ],
            ],
          },
        },
      );
      return;
    }

    // ── Saved Prompt callbacks ─────────────────────────────────────────────

    // Save library prompt: save_prompt_fnb_1
    if (data.startsWith("save_prompt_")) {
      const promptId = data.replace("save_prompt_", "");
      await saveLibraryPrompt(ctx, promptId);
      return;
    }

    // Show user's saved prompts for a niche: my_prompts_fnb
    if (data.startsWith("my_prompts_")) {
      await ctx.answerCbQuery();
      const nicheKey = data.replace("my_prompts_", "");
      await showMyPrompts(ctx, nicheKey, true);
      return;
    }

    // use_admin_prompt_ and use_saved_ are now handled by the unified prompts callback handler above

    // Delete saved prompt: del_saved_123_fnb
    if (data.startsWith("del_saved_")) {
      const parts = data.replace("del_saved_", "").split("_");
      const savedId = parseInt(parts[0]);
      const nicheKey = parts.slice(1).join("_");
      const telegramId = ctx.from?.id;
      if (telegramId) {
        const dbUser = await UserService.findByTelegramId(BigInt(telegramId));
        if (dbUser) {
          await SavedPromptService.delete(
            savedId,
            dbUser.id as unknown as bigint,
          );
          await ctx.answerCbQuery("🗑️ Prompt dihapus!");
          await showMyPrompts(ctx, nicheKey, true);
        }
      }
      return;
    }

    // Add custom prompt: add_custom_prompt_fnb
    if (data.startsWith("add_custom_prompt_")) {
      await ctx.answerCbQuery();
      const nicheKey = data.replace("add_custom_prompt_", "");
      await startAddCustomPrompt(ctx, nicheKey, true);
      return;
    }

    // ── END Saved Prompt callbacks ─────────────────────────────────────────

    // prompts_niche_ is handled by the unified prompts callback handler above (line ~508)

    // use_prof_prompt_ and gen_free_ are handled by the unified prompts callback handler above

    if (data === "back_prompts") {
      await ctx.answerCbQuery();
      try {
        await ctx.editMessageText(
          "📚 *Prompt Library — 40+ Template Siap Pakai*\n\n" +
          "👇 *Pilih niche bisnis kamu:*\n\n" +
          "🍔 F&B · 👗 Fashion · 📱 Tech · 💪 Health\n" +
          "✈️ Travel · 📚 Education · 💰 Finance · 🎭 Entertainment\n\n" +
          "_Setiap niche punya 5 prompt profesional yang sudah ditest ribuan user. Tinggal pilih → buat video!_",
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🍔 F&B", callback_data: "prompts_fnb" },
                  { text: "👗 Fashion", callback_data: "prompts_fashion" },
                ],
                [
                  { text: "📱 Tech", callback_data: "prompts_tech" },
                  { text: "💪 Health", callback_data: "prompts_health" },
                ],
                [
                  { text: "✈️ Travel", callback_data: "prompts_travel" },
                  { text: "📚 Education", callback_data: "prompts_education" },
                ],
                [
                  { text: "💰 Finance", callback_data: "prompts_finance" },
                  {
                    text: "🎭 Entertainment",
                    callback_data: "prompts_entertainment",
                  },
                ],
                [
                  { text: "🔥 Trending", callback_data: "prompts_trending" },
                  { text: "✨ Custom AI", callback_data: "prompts_custom" },
                ],
              ],
            },
          },
        );
      } catch {
        await promptsCommand(ctx); // fallback: send new message
      }
      return;
    }

    // Daily prompt save/another
    if (data.startsWith("daily_save_")) {
      await ctx.answerCbQuery("💾 Prompt disimpan ke sesi kamu!");
      const promptId = data.replace("daily_save_", "");
      const p = await getPromptById(promptId);
      if (p && ctx.session)
        ctx.session.stateData = {
          ...(ctx.session.stateData || {}),
          savedPrompt: p.prompt,
        };
      return;
    }
    if (data === "daily_another") {
      await ctx.answerCbQuery();
      // Rotate to next mystery prompt
      const dayShift = new Date().getHours() % MYSTERY_PROMPTS.length;
      const mystery = MYSTERY_PROMPTS[dayShift];
      const niche = PROMPT_LIBRARY[mystery.niche];
      const p = niche?.prompts.find((x) => x.id === mystery.promptId);
      if (p) {
        await ctx.editMessageText(
          `🎁 *Another Mystery Prompt!*\n\n${niche.emoji} *${p.title}*\n\`${p.prompt}\`\n\n⭐ ${p.successRate}% success rate`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🚀 Pakai Sekarang",
                    callback_data: `use_prompt_${p.id}`,
                  },
                ],
                [{ text: "📚 Browse Semua", callback_data: "back_prompts" }],
              ],
            },
          },
        );
      }
      return;
    }

    // ─── END PROMPT LIBRARY CALLBACKS ──────────────────────────────────────

    // Create video - redirect to /create flow
    if (data === "create_video") {
      // ── Inject selected prompt from library into session ─────────────────
      const selectedPrompt = ctx.session?.stateData?.selectedPrompt as
        | string
        | undefined;
      if (selectedPrompt && ctx.session) {
        // Pre-fill videoCreation with the chosen prompt so user skips "add custom prompt" step
        if (!ctx.session.videoCreation) ctx.session.videoCreation = {} as any;
        ctx.session.videoCreation!.customPrompt = selectedPrompt;
        ctx.session.videoCreation!.waitingForCustomPrompt = false;
        // Clear so it doesn't persist to next session
        ctx.session.stateData = {
          ...ctx.session.stateData,
          selectedPrompt: undefined,
        };
      }
      await ctx.deleteMessage().catch(() => { });
      await createCommand(ctx);
      return;
    }

    // Image generation handlers
    // image_from_prompt — auto-detect niche from session selectedPrompt context
    if (data === "image_from_prompt") {
      await ctx.answerCbQuery();
      // Map niche to image category
      const nicheToCategory: Record<string, string> = {
        fnb: "fnb",
        food: "fnb",
        fashion: "product",
        health: "product",
        tech: "product",
        finance: "product",
        education: "product",
        entertainment: "product",
        travel: "realestate",
      };
      const sessionNiche = (ctx.session?.selectedNiche ||
        ctx.session?.stateData?.addingPromptNiche ||
        "product") as string;
      const autoCategory = nicheToCategory[sessionNiche] || "product";
      await handleImageGeneration(ctx, autoCategory);
      return;
    }

    if (data === "image_generate") {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        "🖼️ *Generate Gambar AI*\n\n" +
        "💡 _AI buat foto marketing profesional dari deskripsi atau foto referensi kamu_\n\n" +
        "Pilih kategori konten kamu:",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🛍️ Foto Produk", callback_data: "img_product" }],
              [{ text: "🍔 Makanan & Minuman", callback_data: "img_fnb" }],
              [
                {
                  text: "🏠 Properti / Real Estate",
                  callback_data: "img_realestate",
                },
              ],
              [{ text: "🚗 Kendaraan / Otomotif", callback_data: "img_car" }],
              [{ text: "👤 Kelola Avatar", callback_data: "avatar_manage" }],
              [{ text: "◀️ Menu Utama", callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    // Image generation category handlers
    if (data.startsWith("img_")) {
      const category = data.replace("img_", "");
      await handleImageGeneration(ctx, category);
      return;
    }

    // ── Avatar management ──
    if (data === "avatar_manage") {
      const telegramId = BigInt(ctx.from!.id);
      const avatars = await AvatarService.listAvatars(telegramId);

      let message = "👤 *Your Avatars*\n\n";
      if (avatars.length === 0) {
        message += "_No avatars saved yet._\n\n";
        message +=
          "Save an avatar to maintain consistent characters across your images and videos.";
      } else {
        avatars.forEach((a, i) => {
          message += `${i + 1}. ${a.isDefault ? "⭐ " : ""}*${a.name}*\n`;
          if (a.description)
            message += `   _${a.description.slice(0, 80)}..._\n`;
        });
      }

      const avatarButtons = avatars.map((a) => [
        {
          text: `${a.isDefault ? "⭐ " : ""}${a.name}`,
          callback_data: `avatar_view_${a.id}`,
        },
      ]);

      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            ...avatarButtons,
            [{ text: "➕ Add New Avatar", callback_data: "avatar_add" }],
            [{ text: "◀️ Back", callback_data: "image_generate" }],
          ],
        },
      });
      return;
    }

    if (data === "avatar_add") {
      await ctx.editMessageText(
        "👤 *Add New Avatar*\n\n" +
        "Send me a clear photo of the character/person you want to use consistently.\n\n" +
        "📸 _Tips:_\n" +
        "• Use a clear, front-facing photo\n" +
        "• Good lighting helps AI understand features\n" +
        "• One person per avatar works best",
        { parse_mode: "Markdown" },
      );
      ctx.session.state = "AVATAR_UPLOAD_WAITING";
      ctx.session.stateData = {};
      return;
    }

    if (data.startsWith("avatar_view_")) {
      const avatarId = parseInt(data.replace("avatar_view_", ""), 10);
      const avatar = await AvatarService.getAvatar(avatarId);
      if (!avatar) {
        await ctx.answerCbQuery("Avatar not found");
        return;
      }

      await ctx.editMessageText(
        `👤 *Avatar: ${avatar.name}*\n` +
        `${avatar.isDefault ? "⭐ Default avatar\n" : ""}\n` +
        `${avatar.description ? `_${avatar.description.slice(0, 300)}_\n\n` : ""}` +
        `What would you like to do?`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              ...(avatar.isDefault
                ? []
                : [
                  [
                    {
                      text: "⭐ Set as Default",
                      callback_data: `avatar_default_${avatar.id}`,
                    },
                  ],
                ]),
              [
                {
                  text: "🗑️ Delete",
                  callback_data: `avatar_delete_${avatar.id}`,
                },
              ],
              [{ text: "◀️ Back", callback_data: "avatar_manage" }],
            ],
          },
        },
      );
      return;
    }

    if (data.startsWith("avatar_default_")) {
      const avatarId = parseInt(data.replace("avatar_default_", ""), 10);
      const telegramId = BigInt(ctx.from!.id);
      await AvatarService.setDefault(telegramId, avatarId);
      await ctx.answerCbQuery("✅ Avatar set as default!");
      // Re-show manage screen
      const avatars = await AvatarService.listAvatars(telegramId);
      let message = "👤 *Your Avatars*\n\n";
      avatars.forEach((a, i) => {
        message += `${i + 1}. ${a.isDefault ? "⭐ " : ""}*${a.name}*\n`;
      });
      const avatarButtons = avatars.map((a) => [
        {
          text: `${a.isDefault ? "⭐ " : ""}${a.name}`,
          callback_data: `avatar_view_${a.id}`,
        },
      ]);
      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            ...avatarButtons,
            [{ text: "➕ Add New Avatar", callback_data: "avatar_add" }],
            [{ text: "◀️ Back", callback_data: "image_generate" }],
          ],
        },
      });
      return;
    }

    if (data.startsWith("avatar_delete_")) {
      const avatarId = parseInt(data.replace("avatar_delete_", ""), 10);
      const telegramId = BigInt(ctx.from!.id);
      const deleted = await AvatarService.deleteAvatar(telegramId, avatarId);
      await ctx.answerCbQuery(
        deleted ? "🗑️ Avatar deleted" : "❌ Avatar not found",
      );
      // Return to manage
      const avatars = await AvatarService.listAvatars(telegramId);
      let message = "👤 *Your Avatars*\n\n";
      if (avatars.length === 0) {
        message += "_No avatars saved yet._";
      } else {
        avatars.forEach((a, i) => {
          message += `${i + 1}. ${a.isDefault ? "⭐ " : ""}*${a.name}*\n`;
        });
      }
      const avatarButtons = avatars.map((a) => [
        {
          text: `${a.isDefault ? "⭐ " : ""}${a.name}`,
          callback_data: `avatar_view_${a.id}`,
        },
      ]);
      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            ...avatarButtons,
            [{ text: "➕ Add New Avatar", callback_data: "avatar_add" }],
            [{ text: "◀️ Back", callback_data: "image_generate" }],
          ],
        },
      });
      return;
    }

    // Upload reference image for image generation
    if (data === "imgref_upload") {
      await ctx.answerCbQuery();
      ctx.session.state = "IMAGE_REFERENCE_WAITING";
      await ctx.editMessageText(
        `📸 *Upload Foto Referensi*\n\n` +
        `Kirim foto produk atau subjek kamu.\n\n` +
        `AI akan gunakan foto ini sebagai referensi untuk buat gambar marketing yang menjaga identitas produk kamu.\n\n` +
        `_Bisa: foto produk, makanan, properti, kendaraan, dll_`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "⏭️ Skip — Deskripsikan Saja",
                  callback_data: "imgref_skip",
                },
              ],
              [{ text: "◀️ Kembali", callback_data: "image_generate" }],
            ],
          },
        },
      );
      return;
    }

    // Skip reference image → generate text2img
    if (data === "imgref_skip") {
      await ctx.answerCbQuery();
      ctx.session.state = "IMAGE_GENERATION_WAITING";
      const category = ctx.session.stateData?.imageCategory as string;
      ctx.session.stateData = { ...ctx.session.stateData, imageCategory: category, mode: "text2img" };

      const hints: Record<string, string> = {
        product:
          'contoh: _"botol parfum premium di background hitam, lighting studio, close-up detail"_',
        fnb: 'contoh: _"semangkuk bakso kuah dengan steam, lighting hangat, sudut 45 derajat"_',
        realestate:
          'contoh: _"ruang tamu modern minimalis, natural lighting, sofa abu-abu"_',
        car: 'contoh: _"mobil SUV warna putih, outdoor sunset lighting, angle 3/4 front"_',
      };
      const hint =
        hints[category] ||
        'contoh: _"produk saya dengan background putih bersih, lighting profesional"_';

      await ctx.editMessageText(
        `✏️ *Deskripsikan Gambar yang Kamu Mau*\n\n` +
        `${hint}\n\n` +
        `Ketik deskripsi kamu sekarang 👇`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "◀️ Kembali", callback_data: "image_generate" }],
            ],
          },
        },
      );
      return;
    }

    // Use saved avatar for image generation
    if (data.startsWith("imgref_avatar_")) {
      const avatarId = parseInt(data.replace("imgref_avatar_", ""), 10);
      const avatar = await AvatarService.getAvatar(avatarId);
      if (!avatar) {
        await ctx.answerCbQuery("Avatar not found");
        return;
      }

      ctx.session.state = "IMAGE_GENERATION_WAITING";
      ctx.session.stateData = {
        ...ctx.session.stateData,
        avatarImageUrl: avatar.imageUrl,
        avatarId: avatar.id,
        avatarName: avatar.name,
        mode: "ip_adapter",
      };

      await ctx.editMessageText(
        `🖼️ *Using Avatar: ${avatar.name}*\n\n` +
        `The AI will maintain this character's identity.\n\n` +
        `Now describe the scene/setting you want:`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "◀️ Menu Utama", callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    // Clone/Remake Video
    if (data === "clone_video") {
      await ctx.editMessageText(
        "🔄 *Clone/Remake Video*\n\n" +
        "Kirim video yang mau direkreasi, atau paste URL dari:\n" +
        "• TikTok · Instagram Reels · YouTube Shorts\n\n" +
        "_AI akan buat video dengan style serupa._",
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [[BTN_BACK_MAIN]] },
        },
      );
      ctx.session.state = "CLONE_VIDEO_WAITING";
      return;
    }

    if (data === "clone_edit_desc") {
      await ctx.answerCbQuery();

      if (!ctx.session?.stateData?.clonePrompt) {
        await ctx.reply("❌ Data clone tidak ditemukan. Silakan mulai ulang.");
        return;
      }

      await ctx.editMessageText(
        "✏️ *Edit Video Description*\n\n" +
        "Kirim deskripsi baru untuk video yang akan dibuat.\n\n" +
        '_Contoh: "Buat video produk skincare dengan lighting soft, background minimalis putih, close-up detail produk"_',
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "❌ Cancel", callback_data: "main_menu" }],
            ],
          },
        },
      );

      ctx.session.state = "CLONE_EDIT_DESC_WAITING";
      return;
    }

    // Clone/Remake Image
    if (data === "clone_image") {
      await ctx.editMessageText(
        "🔄 *Clone/Remake Image*\n\n" +
        "Kirim gambar yang mau direkreasi.\n" +
        "_AI akan buat gambar dengan style serupa._",
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [[BTN_BACK_MAIN]] },
        },
      );
      ctx.session.state = "CLONE_IMAGE_WAITING";
      return;
    }

    // Storyboard Creator
    if (data === "storyboard_create") {
      await ctx.editMessageText(
        "📋 *Storyboard Creator*\n\n" + "Pilih tipe konten kamu:",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🛍️ Product Promo", callback_data: "sb_product" }],
              [{ text: "🍔 F&B Content", callback_data: "sb_fnb" }],
              [{ text: "🏠 Real Estate Tour", callback_data: "sb_realestate" }],
              [{ text: "🚗 Car Showcase", callback_data: "sb_car" }],
              [BTN_BACK_MAIN],
            ],
          },
        },
      );
      return;
    }

    if (data === "sb_product") return handleStoryboardRequest(ctx, "product");
    if (data === "sb_fnb") return handleStoryboardRequest(ctx, "fnb");
    if (data === "sb_realestate")
      return handleStoryboardRequest(ctx, "realestate");
    if (data === "sb_car") return handleStoryboardRequest(ctx, "car");

    // Viral/Trend Research
    if (data === "viral_research") {
      await ctx.editMessageText(
        "📈 *Viral/Trend Research*\n\n" +
        "Analyzing trending content across platforms...\n\n" +
        "Select niche to discover what's working:",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔥 All Trends (Viral)", callback_data: "trend_viral" }],
              [{ text: "🍔 F&B / Restaurant", callback_data: "trend_fnb" }],
              [{ text: "🏠 Real Estate", callback_data: "trend_realestate" }],
              [{ text: "🛍️ E-commerce", callback_data: "trend_ecom" }],
              [{ text: "◀️ Back to Menu", callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    if (data.startsWith("trend_")) {
      const niche = data.replace("trend_", "");
      await ctx.editMessageText(
        `📈 *Viral Research: ${niche.toUpperCase()}*\n\n` +
        `✅ Analysis complete.\n\n` +
        `*Trending Patterns:* \n` +
        `• Quick cuts, beat-matching\n` +
        `• ASMR audio layer\n` +
        `• Text-to-speech overlay (Female voice)\n\n` +
        `*Suggested Storyboard:*`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📋 Generate Viral Storyboard",
                  callback_data: `sb_${niche === "viral" ? "product" : niche === "ecom" ? "product" : niche}`,
                },
              ],
              [{ text: "◀️ Back", callback_data: "viral_research" }],
            ],
          },
        },
      );
      return;
    }

    // Video/Image to Prompt (Disassemble)
    if (data === "disassemble") {
      await ctx.editMessageText(
        "🔍 *Video/Image to Prompt*\n\n" +
        "Kirim video atau gambar kamu.\n" +
        "_AI akan extract prompt yang digunakan untuk membuatnya._",
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [[BTN_BACK_MAIN]] },
        },
      );
      ctx.session.state = "DISASSEMBLE_WAITING";
      return;
    }

    // Repurpose / Trend Replication
    if (data === "repurpose_video") {
      await ctx.editMessageText(
        "🔄 *Repurpose Trending Video*\n\n" +
        "Kirim video dengan cara:\n" +
        "• 📎 Upload file MP4 langsung\n" +
        "• 🔗 Paste link TikTok / Instagram Reels\n" +
        "• 🔗 Paste link YouTube Shorts / Twitter/X\n\n" +
        "_AI akan extract storyboard, scene prompts, dan transkrip — lalu buat ulang videonya._",
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [[BTN_BACK_MAIN]] },
        },
      );
      ctx.session.state = "REPURPOSE_VIDEO_URL";
      return;
    }

    if (data === "repurpose_generate_t2v") {
      // Use extracted storyboard prompts for t2v generation
      const repurposeData = ctx.session.stateData?.repurposeData as any;
      if (!repurposeData?.storyboard) {
        await ctx.reply("❌ Data analisis tidak ditemukan. Silakan mulai ulang.");
        return;
      }
      // Store in videoCreation and trigger normal generation flow
      const storyboard = repurposeData.storyboard;
      const duration = repurposeData.totalDuration || 15;
      const niche = repurposeData.niche || "general";

      const creditCost = await getVideoCreditCostAsync(duration);
      const telegramId = BigInt(ctx.from!.id);
      const user = await UserService.findByTelegramId(telegramId);
      if (!user || Number(user.creditBalance) < creditCost) {
        await ctx.reply(`❌ Insufficient credits. Need ${creditCost} credits.`);
        return;
      }

      await UserService.deductCredits(telegramId, creditCost);
      const jobId = `RPR-T2V-${Date.now()}-${telegramId}`;
      const chatId = ctx.chat!.id;

      await prisma.video.create({
        data: {
          userId: telegramId,
          jobId,
          niche,
          platform: "reels",
          duration,
          scenes: storyboard.length,
          status: "processing",
          creditsUsed: creditCost,
          storyboard,
        },
      });

      await enqueueVideoGeneration({
        jobId,
        niche,
        platform: "reels",
        duration,
        scenes: storyboard.length,
        storyboard,
        userId: telegramId.toString(),
        chatId,
        enableVO: false,
        enableSubtitles: false,
        language: "id",
      });

      await ctx.editMessageText(
        `✅ *Video regeneration started!*\n\n` +
        `🎬 Job: \`${jobId}\`\n` +
        `📊 ${storyboard.length} scenes · ${duration}s · niche: ${niche}\n\n` +
        `_We'll send you the video when it's ready._`,
        { parse_mode: "Markdown" },
      );
      return;
    }

    if (data === "repurpose_generate_i2v") {
      const repurposeData = ctx.session.stateData?.repurposeData as any;
      if (!repurposeData?.storyboard) {
        await ctx.reply("❌ Data analisis tidak ditemukan. Silakan mulai ulang.");
        return;
      }
      const storyboard = repurposeData.storyboard;
      const duration = repurposeData.totalDuration || 15;
      const niche = repurposeData.niche || "general";
      const referenceImage = repurposeData.keyFramePaths?.[0] || undefined;

      const creditCost = await getVideoCreditCostAsync(duration);
      const telegramId = BigInt(ctx.from!.id);
      const user = await UserService.findByTelegramId(telegramId);
      if (!user || Number(user.creditBalance) < creditCost) {
        await ctx.reply(`❌ Insufficient credits. Need ${creditCost} credits.`);
        return;
      }

      await UserService.deductCredits(telegramId, creditCost);
      const jobId = `RPR-I2V-${Date.now()}-${telegramId}`;
      const chatId = ctx.chat!.id;

      await prisma.video.create({
        data: {
          userId: telegramId,
          jobId,
          niche,
          platform: "reels",
          duration,
          scenes: storyboard.length,
          status: "processing",
          creditsUsed: creditCost,
          storyboard,
        },
      });

      await enqueueVideoGeneration({
        jobId,
        niche,
        platform: "reels",
        duration,
        scenes: storyboard.length,
        storyboard,
        referenceImage,
        userId: telegramId.toString(),
        chatId,
        enableVO: false,
        enableSubtitles: false,
        language: "id",
      });

      await ctx.editMessageText(
        `✅ *Video regeneration started! (with frame reference)*\n\n` +
        `🎬 Job: \`${jobId}\`\n` +
        `📊 ${storyboard.length} scenes · ${duration}s · niche: ${niche}\n\n` +
        `_We'll send you the video when it's ready._`,
        { parse_mode: "Markdown" },
      );
      return;
    }

    // (main_menu is handled above in NEW REDESIGN HANDLERS section)

    // Videos menu handlers
    if (data === "videos_favorites") {
      await ctx.editMessageText(
        "⭐ *Favorite Videos*\n\n" +
        "Your favorite videos will appear here.\n\n" +
        "No favorites yet.",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "◀️ Back", callback_data: "videos_back" }],
            ],
          },
        },
      );
      return;
    }

    if (data === "videos_trash") {
      await ctx.editMessageText(
        "🗑️ *Trash*\n\n" +
        "Deleted videos (restorable for 7 days).\n\n" +
        "Trash is empty.",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "◀️ Back", callback_data: "videos_back" }],
            ],
          },
        },
      );
      return;
    }

    if (data === "videos_back" || data === "videos_list") {
      await ctx.deleteMessage().catch(() => { });
      await videosCommand(ctx);
      return;
    }

    // Video viewing handlers
    if (data.startsWith("video_view_")) {
      const jobId = data.replace("video_view_", "");
      await viewVideo(ctx, jobId);
      return;
    }

    if (data.startsWith("video_copy_")) {
      const jobId = data.replace("video_copy_", "");
      await copyVideoUrl(ctx, jobId);
      return;
    }

    if (data.startsWith("video_delete_")) {
      const jobId = data.replace("video_delete_", "");
      await deleteVideo(ctx, jobId);
      return;
    }

    if (data.startsWith("video_confirm_delete_")) {
      await ctx.answerCbQuery();
      const jobId = data.replace("video_confirm_delete_", "");
      const videoToDelete = await VideoService.getByJobId(jobId);
      if (!videoToDelete || (ctx.from && videoToDelete.userId !== BigInt(ctx.from.id))) {
        await ctx.editMessageText("❌ Access denied or video not found.");
        return;
      }
      // Soft delete — mark as deleted instead of removing from database
      await VideoService.deleteVideo(jobId);
      await ctx.editMessageText(
        "🗑️ *Video Moved to Trash*\n\n" + "The video has been moved to trash.",
        { parse_mode: "Markdown" },
      );
      return;
    }

    if (data.startsWith("video_retry_")) {
      await ctx.answerCbQuery("Retrying video...");
      await createCommand(ctx);
      return;
    }

    // Copy Caption — reply with plain caption text for easy copying
    if (data.startsWith("copy_caption_")) {
      const jobId = data.replace("copy_caption_", "");
      await ctx.answerCbQuery("Caption copied below!");

      try {
        const video = await VideoService.getByJobId(jobId);
        if (video && ctx.from && video.userId !== BigInt(ctx.from.id)) {
          await ctx.reply("❌ Access denied.");
          return;
        }
        const niche =
          ctx.session?.selectedNiche ||
          ctx.session?.videoCreation?.niche ||
          (video as any)?.niche ||
          "product";
        const storyboard = ctx.session?.videoCreation?.storyboard;
        const platform = (video as any)?.platform || "tiktok";

        const scenes =
          storyboard && storyboard.length > 0
            ? storyboard
            : [{ description: (video as any)?.prompt || niche }];
        const caption = generateCaption(niche, scenes, platform);

        // Send plain text — easy for users to long-press and copy on mobile
        await ctx.reply(`${caption.text}\n\n${caption.hashtags}`);
      } catch (err) {
        logger.error("Failed to generate caption for copy:", err);
        await ctx.reply("Gagal membuat caption. Silakan coba lagi.");
      }
      return;
    }

    // Create Similar — pre-fill niche + style + storyboard from a past video, skip to ref image
    if (data.startsWith("create_similar_")) {
      const jobId = data.replace("create_similar_", "");
      await ctx.answerCbQuery("Loading video settings...");

      try {
        const video = await VideoService.getByJobId(jobId);
        if (!video) {
          await ctx.reply("Video tidak ditemukan. Gunakan /create untuk mulai.");
          return;
        }

        if (ctx.from && video.userId !== BigInt(ctx.from.id)) {
          await ctx.reply("❌ Access denied.");
          return;
        }

        // Pre-fill session with the video's niche and style
        const nicheKey = video.niche || "fnb";
        const nicheConfig = NICHES[nicheKey as keyof typeof NICHES];

        ctx.session.selectedNiche = nicheKey;

        // Use the first style from the video's styles array, or default to the niche's first style
        const videoStyles =
          video.styles && video.styles.length > 0
            ? video.styles
            : nicheConfig?.styles
              ? [nicheConfig.styles[0]]
              : ["professional"];
        ctx.session.selectedStyles = videoStyles as string[];

        // Get storyboard from the original video DB record
        const videoStoryboard = (video as any).storyboard as Array<{
          scene: number;
          duration: number;
          description: string;
        }> | null;
        const videoDuration = video.duration || 30;
        const videoScenes =
          video.scenes ||
          (videoStoryboard
            ? videoStoryboard.length
            : Math.ceil(videoDuration / 5));

        // Pre-fill videoCreation session with storyboard and duration (skip niche, style, AND duration)
        ctx.session.videoCreation = {
          niche: nicheKey,
          totalDuration: videoDuration,
          scenes: videoScenes,
          storyboard: videoStoryboard || undefined,
          waitingForImage: true,
        };

        const storyboardInfo = videoStoryboard
          ? `${videoStoryboard.length} scenes`
          : `${videoScenes} scenes`;

        // Skip straight to reference image step
        await ctx.editMessageText(
          `🎬 *Creating similar video*\n\n` +
          `Niche: ${nicheConfig?.emoji || ""} ${nicheConfig?.name || nicheKey}\n` +
          `Duration: ${videoDuration}s\n` +
          `Storyboard: ${storyboardInfo}\n` +
          `Style: ${videoStyles[0]}\n\n` +
          `Send a reference image or /skip`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "⏭️ Skip Reference Image",
                    callback_data: `duration_${videoDuration}_${videoScenes}`,
                  },
                ],
                [
                  {
                    text: "🔄 Change Niche/Style",
                    callback_data: "create_video_new",
                  },
                ],
              ],
            },
          },
        );
      } catch (error) {
        logger.error("Create similar error:", error);
        await ctx.reply(
          "Gagal memuat pengaturan video. Gunakan /create untuk mulai.",
        );
      }
      return;
    }

    // Auto-Post to All connected accounts
    if (data.startsWith("auto_post_")) {
      const jobId = data.replace("auto_post_", "");
      await handleAutoPostToAll(ctx, jobId);
      return;
    }

    // Post Automation - Publish Video
    if (data.startsWith("publish_video_")) {
      const jobId = data.replace("publish_video_", "");
      await handlePublishVideo(ctx, jobId);
      return;
    }

    if (data.startsWith("select_platform_")) {
      const jobId = data.split("_")[2];
      const platform = data.split("_")[3];
      await handlePublishPlatformSelection(ctx, jobId, platform);
      return;
    }

    if (data.startsWith("confirm_publish_")) {
      const jobId = data.replace("confirm_publish_", "");
      await handleConfirmPublish(ctx, jobId);
      return;
    }

    // Social Account Management
    if (data === "manage_accounts") {
      await handleManageAccounts(ctx);
      return;
    }

    if (data.startsWith("connect_account_")) {
      const platform = data.replace("connect_account_", "");
      await handleConnectAccount(ctx, platform);
      return;
    }

    if (data.startsWith("disconnect_account_")) {
      const accountId = data.replace("disconnect_account_", "");
      await handleDisconnectAccount(ctx, accountId);
      return;
    }

    // Admin Payment Settings
    if (data === "admin_payment_settings") {
      await paymentSettingsCommand(ctx);
      return;
    }

    if (data === "admin_payment_default") {
      await handlePaymentDefaultGateway(ctx);
      return;
    }

    if (data.startsWith("admin_payment_toggle_")) {
      const gateway = data.replace("admin_payment_toggle_", "");
      await handlePaymentToggleGateway(ctx, gateway);
      return;
    }

    if (data.startsWith("admin_payment_setdefault_")) {
      const gateway = data.replace("admin_payment_setdefault_", "");
      await handlePaymentSetDefault(ctx, gateway);
      return;
    }

    // Topup from inline menu
    if (data === "topup") {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => { });
      await topupCommand(ctx);
      return;
    }

    // Open chat from inline menu
    if (data === "open_chat") {
      await ctx.answerCbQuery();
      await ctx
        .editMessageText(
          "💬 *AI Assistant aktif!*\n\n" +
          "Langsung ketik pertanyaan kamu sekarang.\n\n" +
          "*Contoh:*\n" +
          '• _"Bikinin prompt untuk produk skincare saya"_\n' +
          '• _"Tips video TikTok F&B yang viral"_\n' +
          '• _"Niche mana yang paling bagus buat jualan online?"_\n\n' +
          "Atau browse template siap pakai:",
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📚 Lihat Prompt Library",
                    callback_data: "back_prompts",
                  },
                ],
                [
                  {
                    text: "🔥 Trending Prompts",
                    callback_data: "prompts_trending",
                  },
                ],
                [{ text: "◀️ Kembali ke Menu", callback_data: "main_menu" }],
              ],
            },
          },
        )
        .catch(async () => {
          // fallback if message can't be edited
          await ctx.reply(
            "💬 *AI Assistant aktif!*\n\nLangsung ketik pertanyaan kamu!",
            { parse_mode: "Markdown" },
          );
        });
      if (ctx.session) ctx.session.state = "DASHBOARD";
      return;
    }

    // Daily prompt shortcut
    if (data === "daily_open") {
      await ctx.answerCbQuery();
      // Build daily prompt inline (edit in place)
      const MP = MYSTERY_PROMPTS;
      const PL2 = PROMPT_LIBRARY;
      const dayOfWeek = new Date().getDay();
      const mystery = MP[dayOfWeek % MP.length];
      const niche = PL2[mystery.niche];
      const p = niche?.prompts.find((x: any) => x.id === mystery.promptId);
      if (p) {
        const msg =
          `🎁 *MYSTERY PROMPT BOX*\n\n✨ *PROMPT UNLOCKED!*\n\n` +
          `${niche.emoji} Niche: *${niche.label}* · ⭐ Rarity: *${mystery.rarity}*\n\n` +
          `*${p.title}*\n\n\`${p.prompt}\`\n\n` +
          `⭐ ${p.successRate}% success rate\n\n` +
          `🆓 Gratis untuk kamu hari ini!`;
        try {
          await ctx.editMessageText(msg, {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🚀 Pakai Sekarang",
                    callback_data: `use_prompt_${p.id}`,
                  },
                ],
                [{ text: "🔄 Prompt Lain", callback_data: "daily_another" }],
                [{ text: "◀️ Kembali ke Menu", callback_data: "back_prompts" }],
              ],
            },
          });
        } catch {
          await ctx.deleteMessage().catch(() => { });
          await promptsDailyCommand(ctx);
        }
      }
      return;
    }

    if (data === "open_profile") {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => { });
      await profileCommand(ctx);
      return;
    }

    if (data === "open_referral") {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => { });
      await referralCommand(ctx);
      return;
    }

    if (data === "open_help") {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => { });
      await helpCommand(ctx);
      return;
    }

    // =========================================================================
    // SETTINGS HANDLERS
    // =========================================================================

    // Show language selection (paginated)
    if (data === "settings_language" || data.startsWith("lang_page_")) {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      const user = userId
        ? await UserService.findByTelegramId(BigInt(userId))
        : null;
      const currentLang = user?.language || "id";
      const currentConfig = getLangConfig(currentLang);

      const page = data.startsWith("lang_page_")
        ? parseInt(data.replace("lang_page_", ""))
        : 0;
      const start = page * LANG_PAGE_SIZE;
      const pageItems = LANGUAGE_LIST.slice(start, start + LANG_PAGE_SIZE);
      const totalPages = Math.ceil(LANGUAGE_LIST.length / LANG_PAGE_SIZE);

      // Build language buttons (2 per row)
      const langButtons: Array<Array<{ text: string; callback_data: string }>> =
        [];
      for (let i = 0; i < pageItems.length; i += 2) {
        const row: Array<{ text: string; callback_data: string }> = [];
        for (let j = i; j < Math.min(i + 2, pageItems.length); j++) {
          const lang = pageItems[j];
          const check = lang.code === currentLang ? " \u2705" : "";
          row.push({
            text: `${lang.flag} ${lang.label}${check}`,
            callback_data: `set_language_${lang.code}`,
          });
        }
        langButtons.push(row);
      }

      // Pagination row
      const navRow: Array<{ text: string; callback_data: string }> = [];
      if (page > 0)
        navRow.push({
          text: "\u25c0\ufe0f Prev",
          callback_data: `lang_page_${page - 1}`,
        });
      navRow.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
      if (page < totalPages - 1)
        navRow.push({
          text: "Next \u25b6\ufe0f",
          callback_data: `lang_page_${page + 1}`,
        });
      langButtons.push(navRow);

      langButtons.push([
        {
          text: "◀️ Kembali ke Pengaturan",
          callback_data: "open_settings",
        },
      ]);

      // Prepend the 4 UI languages as a quick-pick section on page 0
      const UI_LANG_QUICK_PICK = [
        { code: "id", flag: "🇮🇩", label: "Bahasa Indonesia" },
        { code: "en", flag: "🇬🇧", label: "English" },
        { code: "ru", flag: "🇷🇺", label: "Русский" },
        { code: "zh", flag: "🇨🇳", label: "中文" },
      ];
      if (page === 0) {
        const quickRow = UI_LANG_QUICK_PICK.map((l) => ({
          text: `${l.flag}${l.code === currentLang ? " ✅" : ""}`,
          callback_data: `set_language_${l.code}`,
        }));
        langButtons.unshift(quickRow);
      }

      const uiLangTitle: Record<string, string> = {
        id: "🌐 *Ganti Bahasa*",
        en: "🌐 *Change Language*",
        ru: "🌐 *Изменить язык*",
        zh: "🌐 *更改语言*",
      };
      const uiLangCurrent: Record<string, string> = {
        id: "Saat ini", en: "Current", ru: "Текущий", zh: "当前",
      };
      const uiLangHint: Record<string, string> = {
        id: "Pilih bahasa. Mempengaruhi tampilan bot, voice over, subtitle, dan caption.",
        en: "Select language. Affects bot UI, voice over, subtitles, and captions.",
        ru: "Выберите язык. Влияет на интерфейс, озвучку, субтитры и подписи.",
        zh: "选择语言。影响界面、配音、字幕和说明文字。",
      };

      await ctx.editMessageText(
        `${uiLangTitle[currentLang] || "🌐 *Change Language*"}\n\n` +
        `${uiLangCurrent[currentLang] || "Current"}: ${currentConfig.flag} ${currentConfig.label}\n\n` +
        `${uiLangHint[currentLang] || "Select language. Affects bot UI, voice over, subtitles, and captions."}`,
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: langButtons },
        },
      );
      return;
    }

    // Set language (dynamic — any supported code)
    if (data.startsWith("set_language_")) {
      const langCode = data.replace("set_language_", "");
      const langCfg = getLangConfig(langCode);
      await ctx.answerCbQuery(`Language set to ${langCfg.label}`);
      const userId = ctx.from?.id;
      if (userId) {
        await UserService.update(BigInt(userId), { language: langCode });
      }
      await ctx.editMessageText(
        "\ud83c\udf10 *Language Updated*\n\n" +
        `\u2705 ${langCfg.flag} ${langCfg.label} selected.\n\n` +
        `Bot messages, voice over, subtitles, and captions will use ${langCfg.label}.`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "◀️ Kembali ke Pengaturan",
                  callback_data: "open_settings",
                },
              ],
            ],
          },
        },
      );
      return;
    }

    // Show notifications toggle
    if (data === "settings_notifications") {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      const user = userId
        ? await UserService.findByTelegramId(BigInt(userId))
        : null;
      const enabled = user?.notificationsEnabled ?? true;

      await ctx.editMessageText(
        "🔔 *Notifications*\n\n" +
        `Status: ${enabled ? "✅ Enabled" : "❌ Disabled"}\n\n` +
        "Receive notifications for:\n" +
        "• Video completion\n" +
        "• Payment confirmations\n" +
        "• Referral commissions\n" +
        "• Promotions & updates",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: enabled
                    ? "🔕 Turn Off Notifications"
                    : "🔔 Turn On Notifications",
                  callback_data: "toggle_notifications",
                },
              ],
              [{ text: "◀️ Kembali ke Pengaturan", callback_data: "open_settings" }],
            ],
          },
        },
      );
      return;
    }

    // Toggle notifications
    if (data === "toggle_notifications") {
      const userId = ctx.from?.id;
      if (!userId) {
        await ctx.answerCbQuery("Error: user not found");
        return;
      }
      const user = await UserService.findByTelegramId(BigInt(userId));
      const newValue = !(user?.notificationsEnabled ?? true);
      await UserService.update(BigInt(userId), {
        notificationsEnabled: newValue,
      });
      await ctx.answerCbQuery(
        newValue ? "Notifications enabled" : "Notifications disabled",
      );

      await ctx.editMessageText(
        "🔔 *Notifications*\n\n" +
        `Status: ${newValue ? "✅ Enabled" : "❌ Disabled"}\n\n` +
        `Notifications have been ${newValue ? "enabled" : "disabled"}.`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: newValue
                    ? "🔕 Turn Off Notifications"
                    : "🔔 Turn On Notifications",
                  callback_data: "toggle_notifications",
                },
              ],
              [{ text: "◀️ Kembali ke Pengaturan", callback_data: "open_settings" }],
            ],
          },
        },
      );
      return;
    }

    // Show auto-renewal toggle
    if (data === "settings_autorenewal") {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      const user = userId
        ? await UserService.findByTelegramId(BigInt(userId))
        : null;
      const enabled = user?.autoRenewal ?? false;

      await ctx.editMessageText(
        "🔄 *Auto-Renewal*\n\n" +
        `Status: ${enabled ? "✅ Enabled" : "❌ Disabled"}\n\n` +
        "When enabled, your subscription will automatically\n" +
        "renew at the end of each billing cycle.",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: enabled
                    ? "❌ Disable Auto-Renewal"
                    : "✅ Enable Auto-Renewal",
                  callback_data: "toggle_autorenewal",
                },
              ],
              [{ text: "◀️ Kembali ke Pengaturan", callback_data: "open_settings" }],
            ],
          },
        },
      );
      return;
    }

    // Toggle auto-renewal
    if (data === "toggle_autorenewal") {
      const userId = ctx.from?.id;
      if (!userId) {
        await ctx.answerCbQuery("Error: user not found");
        return;
      }
      const user = await UserService.findByTelegramId(BigInt(userId));
      const newValue = !(user?.autoRenewal ?? false);
      await UserService.update(BigInt(userId), { autoRenewal: newValue });
      await ctx.answerCbQuery(
        newValue ? "Auto-renewal enabled" : "Auto-renewal disabled",
      );

      await ctx.editMessageText(
        "🔄 *Auto-Renewal*\n\n" +
        `Status: ${newValue ? "✅ Enabled" : "❌ Disabled"}\n\n` +
        `Auto-renewal has been ${newValue ? "enabled" : "disabled"}.`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: newValue
                    ? "❌ Disable Auto-Renewal"
                    : "✅ Enable Auto-Renewal",
                  callback_data: "toggle_autorenewal",
                },
              ],
              [{ text: "◀️ Kembali ke Pengaturan", callback_data: "open_settings" }],
            ],
          },
        },
      );
      return;
    }

    // Open settings menu (back navigation target + "settings" alias from profile menu)
    if (data === "open_settings" || data === "settings") {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      const user = userId
        ? await UserService.findByTelegramId(BigInt(userId))
        : null;
      const lang = user?.language === "en" ? "English" : "Bahasa Indonesia";
      const notif = user?.notificationsEnabled ? "Enabled" : "Disabled";
      const autoRenew = user?.autoRenewal ? "Enabled" : "Disabled";

      const settingsText =
        "⚙️ *Settings*\n\n" +
        "Configure your preferences:\n\n" +
        `*Language:* ${lang}\n` +
        `*Notifications:* ${notif}\n` +
        `*Auto-renewal:* ${autoRenew}\n\n` +
        "What would you like to change?";
      const settingsMarkup = {
        inline_keyboard: [
          [{ text: "🌐 Change Language", callback_data: "settings_language" }],
          [{ text: "🔔 Notifications", callback_data: "settings_notifications" }],
          [{ text: "🔄 Auto-renewal", callback_data: "settings_autorenewal" }],
          [{ text: "◀️ Back to Menu", callback_data: "main_menu" }],
        ],
      };
      try {
        await ctx.editMessageText(settingsText, { parse_mode: "Markdown", reply_markup: settingsMarkup });
      } catch {
        await ctx.reply(settingsText, { parse_mode: "Markdown", reply_markup: settingsMarkup });
      }
      return;
    }

    // =========================================================================
    // TRANSACTION HISTORY
    // =========================================================================

    if (data === "transaction_history") {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      if (!userId) return;

      try {
        const transactions = await prisma.transaction.findMany({
          where: { userId: BigInt(userId) },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        if (transactions.length === 0) {
          await ctx.editMessageText(
            "📜 *Transaction History*\n\n" +
            "No transactions found.\n\n" +
            "Top up credits to get started!",
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "💰 Top Up Now", callback_data: "topup" }],
                  [{ text: "◀️ Back to Menu", callback_data: "main_menu" }],
                ],
              },
            },
          );
          return;
        }

        let message = "📜 *Transaction History*\n\n";
        message += "_Last 10 transactions:_\n\n";

        for (const tx of transactions) {
          const date = tx.createdAt.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          const statusEmoji =
            tx.status === "success"
              ? "✅"
              : tx.status === "pending"
                ? "⏳"
                : "❌";
          const amount = Number(tx.amountIdr).toLocaleString("id-ID");
          const credits = tx.creditsAmount
            ? Number(tx.creditsAmount).toFixed(1)
            : "-";
          message += `${statusEmoji} ${date} | ${tx.type} | Rp ${amount} | ${credits} credits\n`;
        }

        await ctx.editMessageText(message, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "◀️ Back to Menu", callback_data: "main_menu" }],
            ],
          },
        });
      } catch (error) {
        logger.error("Transaction history error:", error);
        await ctx.editMessageText(
          "❌ Gagal memuat riwayat transaksi.\n\nSilakan coba lagi nanti.",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "◀️ Back to Menu", callback_data: "main_menu" }],
              ],
            },
          },
        );
      }
      return;
    }

    // =========================================================================
    // COPY PROMPT
    // =========================================================================

    if (data === "copy_prompt") {
      await ctx.answerCbQuery();
      const extractedPrompt = ctx.session?.stateData?.extractedPrompt as
        | string
        | undefined;

      if (extractedPrompt) {
        await ctx.reply(
          `📋 *Extracted Prompt:*\n\n\`\`\`\n${extractedPrompt}\n\`\`\`\n\n_Copy the text above to use it._`,
          { parse_mode: "Markdown" },
        );
      } else {
        await ctx.reply(
          "❌ Prompt tidak ditemukan. Gunakan fitur Disassemble terlebih dahulu untuk mengekstrak prompt dari media.",
          { parse_mode: "Markdown" },
        );
      }
      return;
    }

    // =========================================================================
    // CONNECT ACCOUNT (NEW) - Route to manage_accounts for platform selection
    // =========================================================================

    if (data === "connect_account_new") {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        "🔗 *Connect New Account*\n\n" + "Select platform to connect:",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📱 TikTok", callback_data: "connect_account_tiktok" }],
              [
                {
                  text: "📷 Instagram",
                  callback_data: "connect_account_instagram",
                },
              ],
              [
                {
                  text: "📘 Facebook",
                  callback_data: "connect_account_facebook",
                },
              ],
              [
                {
                  text: "🐦 Twitter/X",
                  callback_data: "connect_account_twitter",
                },
              ],
              [
                {
                  text: "📺 YouTube",
                  callback_data: "connect_account_youtube",
                },
              ],
              [{ text: "◀️ Back", callback_data: "manage_accounts" }],
            ],
          },
        },
      );
      return;
    }

    // =========================================================================
    // REFERRAL STATS
    // =========================================================================

    if (data === "referral_stats") {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      if (!userId) return;

      try {
        const user = await UserService.findByTelegramId(BigInt(userId));
        if (!user) {
          await ctx.reply("❌ User not found.");
          return;
        }

        const [referralCount, commissionAgg, availableAgg, withdrawnAgg] =
          await Promise.all([
            prisma.user.count({ where: { referredBy: user.uuid } }),
            prisma.commission.aggregate({
              where: { referrerId: BigInt(userId) },
              _sum: { amount: true },
            }),
            prisma.commission.aggregate({
              where: { referrerId: BigInt(userId), status: "available" },
              _sum: { amount: true },
            }),
            prisma.commission.aggregate({
              where: { referrerId: BigInt(userId), status: "withdrawn" },
              _sum: { amount: true },
            }),
          ]);

        const totalCommission = Number(commissionAgg._sum.amount || 0);
        const availableCommission = Number(availableAgg._sum.amount || 0);
        const withdrawnCommission = Number(withdrawnAgg._sum.amount || 0);

        await ctx.editMessageText(
          "📊 *Referral Statistics*\n\n" +
          `*Total Referrals:* ${referralCount}\n` +
          `*Referral Tier:* ${user.referralTier}\n\n` +
          "*Commission Summary:*\n" +
          `• Total Earned: Rp ${totalCommission.toLocaleString("id-ID")}\n` +
          `• Available: Rp ${availableCommission.toLocaleString("id-ID")}\n` +
          `• Withdrawn: Rp ${withdrawnCommission.toLocaleString("id-ID")}\n\n` +
          `*Referral Code:* \`${user.referralCode || "N/A"}\``,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "💸 Withdraw", callback_data: "referral_withdraw" }],
                [
                  {
                    text: "◀️ Back to Referral",
                    callback_data: "open_referral",
                  },
                ],
              ],
            },
          },
        );
      } catch (error) {
        logger.error("Referral stats error:", error);
        await ctx.reply(
          "❌ Gagal memuat statistik referral. Silakan coba lagi.",
        );
      }
      return;
    }

    // =========================================================================
    // REFERRAL WITHDRAW
    // =========================================================================

    if (data === "referral_withdraw") {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      if (!userId) return;

      try {
        const availableAgg = await prisma.commission.aggregate({
          where: { referrerId: BigInt(userId), status: "available" },
          _sum: { amount: true },
        });
        const available = Number(availableAgg._sum.amount || 0);

        // Use admin-configurable rates (default: sell=3000 IDR/credit)
        const sellRateStr = await PaymentSettingsService.get('referral_sell_rate');
        const SELL_RATE = sellRateStr ? parseInt(sellRateStr) : 3000;
        const creditsCanConvert = Math.floor(available / SELL_RATE);

        let message = "💸 *Withdraw Commission*\n\n";
        message += `*Saldo Komisi:* Rp ${available.toLocaleString("id-ID")}\n\n`;

        if (available <= 0) {
          message += `❌ Belum ada komisi yang tersedia.\n\n`;
          message += `Ajak teman untuk mulai mendapatkan komisi!`;
        } else {
          message += `*Opsi Penarikan:*\n\n`;
          message += `1️⃣ *Tukar ke Kredit* — ${creditsCanConvert} kredit\n`;
          message += `   (Rate: Rp ${SELL_RATE.toLocaleString("id-ID")}/kredit)\n\n`;
          message += `2️⃣ *Jual ke Admin* — Rp ${(available / 2).toLocaleString("id-ID")}\n`;
          message += `   (50% dari harga beli kredit)\n\n`;
          message += `3️⃣ *Transfer P2P* — Kirim kredit ke user lain\n`;
          message += `   (Gunakan /send setelah konversi)\n\n`;
          message += `_Komisi juga bisa dipakai langsung untuk generate!_`;
        }

        const buttons: any[][] = [];
        if (creditsCanConvert > 0) {
          buttons.push([{ text: `🔄 Tukar ke ${creditsCanConvert} Kredit`, callback_data: "referral_convert_credits" }]);
          buttons.push([{ text: `💵 Jual ke Admin (Rp ${(available / 2).toLocaleString("id-ID")})`, callback_data: "referral_sell_admin" }]);
        }
        buttons.push([{ text: "📊 Lihat Stats", callback_data: "referral_stats" }]);
        buttons.push([{ text: "◀️ Kembali", callback_data: "open_referral" }]);

        await ctx.editMessageText(message, {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: buttons },
        });
      } catch (error) {
        logger.error("Referral withdraw error:", error);
        await ctx.reply("❌ Gagal memuat info withdrawal. Coba lagi.");
      }
      return;
    }

    // Convert referral commission to credits
    if (data === "referral_convert_credits") {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      if (!userId) return;

      try {
        const telegramId = BigInt(userId);
        const availableAgg = await prisma.commission.aggregate({
          where: { referrerId: telegramId, status: "available" },
          _sum: { amount: true },
        });
        const available = Number(availableAgg._sum.amount || 0);
        const sellRateStr = await PaymentSettingsService.get('referral_sell_rate');
        const SELL_RATE = sellRateStr ? parseInt(sellRateStr) : 3000;
        const creditsToAdd = Math.floor(available / SELL_RATE);

        if (creditsToAdd <= 0) {
          await ctx.editMessageText("❌ Komisi tidak cukup untuk ditukar ke kredit.", {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: [[{ text: "◀️ Kembali", callback_data: "referral_withdraw" }]] },
          });
          return;
        }

        // Execute conversion in transaction
        await prisma.$transaction(async (tx) => {
          // Mark commissions as withdrawn
          await tx.commission.updateMany({
            where: { referrerId: telegramId, status: "available" },
            data: { status: "withdrawn" },
          });
          // Add credits to user
          await tx.user.update({
            where: { telegramId },
            data: { creditBalance: { increment: creditsToAdd } },
          });
          // Create transaction record
          await tx.transaction.create({
            data: {
              orderId: `REF-CONV-${Date.now()}`,
              userId: telegramId,
              type: "referral_conversion",
              amountIdr: available,
              creditsAmount: creditsToAdd,
              gateway: "internal",
              status: "success",
              paymentMethod: "referral_commission",
            },
          });
        });

        await ctx.editMessageText(
          `✅ *Konversi Berhasil!*\n\n` +
          `Rp ${available.toLocaleString("id-ID")} komisi → *${creditsToAdd} kredit*\n\n` +
          `Kredit sudah ditambahkan ke saldo kamu.`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🎬 Buat Video", callback_data: "create_video_new" }],
                [{ text: "🏠 Menu Utama", callback_data: "main_menu" }],
              ],
            },
          },
        );
      } catch (error) {
        logger.error("Referral convert credits error:", error);
        await ctx.reply("❌ Gagal konversi. Coba lagi.");
      }
      return;
    }

    // Sell commission to admin (request cashout at half rate)
    if (data === "referral_sell_admin") {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      if (!userId) return;

      try {
        const telegramId = BigInt(userId);
        const availableAgg = await prisma.commission.aggregate({
          where: { referrerId: telegramId, status: "available" },
          _sum: { amount: true },
        });
        const available = Number(availableAgg._sum.amount || 0);
        const cashoutAmount = Math.floor(available / 2); // half rate

        if (cashoutAmount <= 0) {
          await ctx.editMessageText("❌ Komisi tidak cukup untuk dijual.", {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: [[{ text: "◀️ Kembali", callback_data: "referral_withdraw" }]] },
          });
          return;
        }

        // Mark commissions as pending_cashout
        await prisma.commission.updateMany({
          where: { referrerId: telegramId, status: "available" },
          data: { status: "pending_cashout" },
        });

        // Create cashout request transaction
        await prisma.transaction.create({
          data: {
            orderId: `REF-CASH-${Date.now()}`,
            userId: telegramId,
            type: "referral_cashout",
            amountIdr: cashoutAmount,
            creditsAmount: 0,
            gateway: "admin_transfer",
            status: "pending",
            paymentMethod: "admin_transfer",
          },
        });

        // Notify admin
        const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "").split(",").filter(Boolean);
        const user = await UserService.findByTelegramId(telegramId);
        for (const adminId of adminIds) {
          try {
            await ctx.telegram.sendMessage(
              adminId.trim(),
              `💸 *Cashout Request*\n\n` +
              `User: ${user?.firstName || user?.username || telegramId}\n` +
              `TG ID: ${telegramId}\n` +
              `Komisi: Rp ${available.toLocaleString("id-ID")}\n` +
              `Cashout (50%): *Rp ${cashoutAmount.toLocaleString("id-ID")}*\n\n` +
              `Transfer ke rekening user, lalu ketik:\n` +
              `/grant_credits ${telegramId} 0 cashout_approved`,
              { parse_mode: "Markdown" },
            );
          } catch { /* admin unreachable */ }
        }

        await ctx.editMessageText(
          `✅ *Permintaan Cashout Dikirim!*\n\n` +
          `Komisi: Rp ${available.toLocaleString("id-ID")}\n` +
          `Cashout (50%): *Rp ${cashoutAmount.toLocaleString("id-ID")}*\n\n` +
          `Admin akan memproses dalam 1-3 hari kerja.\n` +
          `Kamu akan dinotifikasi saat transfer selesai.`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "📊 Lihat Stats", callback_data: "referral_stats" }],
                [{ text: "🏠 Menu Utama", callback_data: "main_menu" }],
              ],
            },
          },
        );
      } catch (error) {
        logger.error("Referral sell admin error:", error);
        await ctx.reply("❌ Gagal memproses cashout. Coba lagi.");
      }
      return;
    }

    // =========================================================================
    // MULTI-PHOTO VIDEO CREATION HANDLERS
    // =========================================================================

    // "Generate Now" — trigger video generation with all collected photos
    if (data === "generate_video_now") {
      await ctx.answerCbQuery();

      if (!ctx.session?.videoCreation?.waitingForImage) {
        await ctx.reply("Tidak ada sesi pembuatan video aktif. Gunakan /create untuk mulai.");
        return;
      }

      const uploadedPhotos = ctx.session.videoCreation.uploadedPhotos || [];
      if (uploadedPhotos.length === 0) {
        await ctx.reply(
          "No photos uploaded yet. Send a reference image first, or /skip to generate without one.",
        );
        return;
      }

      await handleVideoCreationImage(ctx, uploadedPhotos);
      return;
    }

    // "Add More Photos" — acknowledge, user will send more photos naturally
    if (data === "add_more_photos") {
      await ctx.answerCbQuery();
      const count = ctx.session?.videoCreation?.uploadedPhotos?.length || 0;
      const remaining = 5 - count;
      await ctx.reply(
        `Send up to ${remaining} more photo(s).\n\nYou can also tap "Generate Now" when ready.`,
      );
      return;
    }

    // "Skip Reference Image" — from multi-photo flow inline button
    if (data === "skip_reference_image") {
      await ctx.answerCbQuery();
      await handleSkipImageReference(ctx);
      return;
    }

    // =========================================================================
    // PREVIOUSLY UNHANDLED CALLBACKS
    // =========================================================================

    // niche_* — photo upload flow niche selection (different from select_niche_*)
    if (data.startsWith("niche_")) {
      const nicheKey = data.replace("niche_", "");
      await handleNicheSelection(ctx, nicheKey);
      return;
    }

    // open_topup — Top Up button from /profile
    if (data === "open_topup") {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => {});
      await topupCommand(ctx);
      return;
    }

    // contact_support — shown in error messages
    if (data === "contact_support") {
      await ctx.answerCbQuery();
      await ctx.reply(
        "💬 *Butuh Bantuan?*\n\n" +
        "Hubungi tim support kami:\n" +
        "• Telegram: @BerkahKaryaSupport\n\n" +
        "Sertakan screenshot error dan username kamu saat menghubungi.",
        { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[BTN_BACK_MAIN]] } },
      );
      return;
    }

    // referral_menu — Refer Teman button after video generation
    if (data === "referral_menu") {
      await ctx.answerCbQuery();
      await referralCommand(ctx);
      return;
    }

    // notif_unsubscribe — Unsubscribe button in retention notifications
    if (data === "notif_unsubscribe") {
      await ctx.answerCbQuery();
      const uid = ctx.from?.id;
      if (uid) {
        await prisma.user.update({
          where: { telegramId: BigInt(uid) },
          data: { notificationsEnabled: false },
        });
      }
      await ctx.reply(
        "🔕 Notifikasi dinonaktifkan.\n\nKamu bisa mengaktifkan kembali di ⚙️ Settings.",
        { reply_markup: { inline_keyboard: [[{ text: "⚙️ Settings", callback_data: "open_settings" }]] } },
      );
      return;
    }

    // admin_menu — Back to Admin Menu from payment settings
    if (data === "admin_menu") {
      await ctx.answerCbQuery();
      await paymentSettingsCommand(ctx);
      return;
    }

    // pro_select_duration — Pro mode scene review → duration selection
    if (data === "pro_select_duration") {
      const { showSmartPresetSelection } = await import("../flows/generate.js");
      await showSmartPresetSelection(ctx);
      return;
    }

    // edit_scene_* — Pro mode individual scene editing
    if (data.startsWith("edit_scene_")) {
      await ctx.answerCbQuery();
      const sceneId = data.replace("edit_scene_", "");
      const scenes = ctx.session?.generateScenes || [];
      const sceneIndex = scenes.findIndex((s) => s.sceneId === sceneId);
      if (ctx.session) {
        ctx.session.stateData = { ...(ctx.session.stateData as object || {}), editingSceneId: sceneId };
        ctx.session.state = "AWAITING_SCENE_EDIT";
      }
      const sceneNum = sceneIndex >= 0 ? sceneIndex + 1 : "?";
      await ctx.reply(
        `✏️ *Edit Scene ${sceneNum}*\n\nKetik deskripsi baru untuk scene ini.\nAtau ketik /skip untuk membatalkan.`,
        { parse_mode: "Markdown" },
      );
      return;
    }

    // Unknown callback
    logger.warn("Unknown callback:", data);
    await ctx.answerCbQuery("Unknown action");
  } catch (error) {
    logger.error("Error in callback handler:", error);
    await ctx.answerCbQuery("Error processing request");
  }
}

/**
 * Handle video publishing
 */
async function handlePublishVideo(ctx: BotContext, jobId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Get video details
  const video = await VideoService.getByJobId(jobId);
  if (!video || !video.videoUrl) {
    await ctx.answerCbQuery("❌ Video not found");
    return;
  }

  if (video.userId !== BigInt(userId)) {
    await ctx.answerCbQuery("❌ Access denied");
    return;
  }

  // Check if user has connected accounts
  const hasAccounts = await PostAutomationService.hasConnectedAccounts(
    BigInt(userId),
  );

  if (!hasAccounts) {
    await ctx.editMessageText(
      "📤 *Publish to Social Media*\n\n" +
      "You haven't connected any social media accounts yet.\n\n" +
      "Connect your accounts first to publish videos.",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔗 Connect Accounts", callback_data: "manage_accounts" }],
            [{ text: "❌ Cancel", callback_data: "videos_list" }],
          ],
        },
      },
    );
    return;
  }

  // Get user's connected accounts
  const accounts = await PostAutomationService.getUserAccounts(BigInt(userId));

  // Build inline keyboard
  const keyboard: any[][] = [];

  // Group by platform
  const platformGroups: Record<string, typeof accounts> = {};
  accounts.forEach((acc) => {
    if (!platformGroups[acc.platform]) {
      platformGroups[acc.platform] = [];
    }
    platformGroups[acc.platform].push(acc);
  });

  Object.entries(platformGroups).forEach(([platform, accs]) => {
    const platformEmoji = getPlatformEmoji(platform);
    accs.forEach((acc) => {
      keyboard.push([
        {
          text: `${platformEmoji} ${platform.toUpperCase()} (${acc.username})`,
          callback_data: `select_platform_${jobId}_${acc.id}`,
        },
      ]);
    });
  });

  keyboard.push([
    { text: "✅ Post Now", callback_data: `confirm_publish_${jobId}` },
  ]);
  keyboard.push([{ text: "❌ Cancel", callback_data: "videos_list" }]);

  await ctx.editMessageText(
    "📤 *Publish to Social Media*\n\n" +
    "Select the platform(s) to publish this video:",
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: keyboard,
      },
    },
  );

  // Store selected platform in session
  ctx.session.selectedPlatforms = [];
  ctx.session.currentJobId = jobId;
}

/**
 * Handle platform selection for publishing
 */
async function handlePublishPlatformSelection(
  ctx: BotContext,
  jobId: string,
  platformOrAccountId: string,
) {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Initialize session if needed
  if (!ctx.session.selectedPlatforms) {
    ctx.session.selectedPlatforms = [];
  }

  if (platformOrAccountId === "all") {
    // Select all accounts
    const accounts = await PostAutomationService.getUserAccounts(
      BigInt(userId),
    );
    ctx.session.selectedPlatforms = accounts.map((acc) => acc.id);
  } else {
    // Toggle single account
    const accountId = parseInt(platformOrAccountId);
    const index = ctx.session.selectedPlatforms.indexOf(accountId);

    if (index > -1) {
      ctx.session.selectedPlatforms.splice(index, 1);
    } else {
      ctx.session.selectedPlatforms.push(accountId);
    }
  }

  // Show confirmation
  const selectedCount = ctx.session.selectedPlatforms.length;

  if (selectedCount === 0) {
    await ctx.answerCbQuery("Select at least one platform");
    return;
  }

  await ctx.editMessageText(
    `📤 *Publish Video*\n\n` +
    `✅ ${selectedCount} platform(s) selected\n\n` +
    `Ready to publish?`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Publish Now",
              callback_data: `confirm_publish_${jobId}`,
            },
          ],
          [{ text: "❌ Cancel", callback_data: "videos_list" }],
        ],
      },
    },
  );
}

/**
 * Handle confirm publish
 */
async function handleConfirmPublish(ctx: BotContext, jobId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  await ctx.editMessageText(
    "⏳ *Publishing...*\n\n" + "Uploading to selected platforms...",
    { parse_mode: "Markdown" },
  );

  try {
    // Get video
    const video = await VideoService.getByJobId(jobId);
    if (!video || !video.videoUrl) {
      throw new Error("Video not found");
    }

    if (video.userId !== BigInt(userId)) {
      await ctx.editMessageText("❌ Access denied.");
      return;
    }

    // Get user's selected accounts
    const accounts = await PostAutomationService.getUserAccounts(
      BigInt(userId),
    );

    // Publish
    const results = await PostAutomationService.publish({
      userId: BigInt(userId),
      mediaUrl: video.videoUrl,
      caption:
        ctx.session.caption ||
        `${video.title || "Check this out!"} #viral #fyp`,
      platformAccountIds: accounts.map((a) => a.id),
    });

    // Show results
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    let message = `📤 *Publish Results*\n\n`;
    message += `✅ Success: ${successCount}\n`;
    if (failCount > 0) {
      message += `❌ Failed: ${failCount}\n\n`;
    }

    results.forEach((result) => {
      const emoji = result.success ? "✅" : "❌";
      message += `${emoji} ${result.platform.toUpperCase()}\n`;
      if (result.postUrl) {
        message += `   ${result.postUrl}\n`;
      }
      if (result.error) {
        message += `   Error: ${result.error}\n`;
      }
    });

    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📁 My Videos", callback_data: "videos_list" }],
          [{ text: "🎬 Buat Video Lagi", callback_data: "back_prompts" }],
        ],
      },
    });
  } catch (error: any) {
    logger.error("Publish failed:", error);
    await ctx.editMessageText(
      `❌ *Publish Failed*\n\n` +
      `Error: ${error.message}\n\n` +
      `Silakan coba lagi atau hubungi support.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔄 Coba Lagi", callback_data: `publish_video_${jobId}` }],
            [{ text: "❌ Batal", callback_data: "videos_list" }],
          ],
        },
      },
    );
  }
}

/**
 * Handle auto-post to ALL connected social accounts
 */
async function handleAutoPostToAll(ctx: BotContext, jobId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Acknowledge button press immediately
  await ctx.answerCbQuery("Publishing to all accounts...");

  try {
    // Get video details
    const video = await VideoService.getByJobId(jobId);
    if (!video || !video.videoUrl) {
      await ctx.reply("❌ Video not found or has no URL.");
      return;
    }

    if (video.userId !== BigInt(userId)) {
      await ctx.reply("❌ Access denied.");
      return;
    }

    // Get ALL connected accounts for this user
    const accounts = await PostAutomationService.getUserAccounts(
      BigInt(userId),
    );
    if (accounts.length === 0) {
      await ctx.reply(
        "❌ No connected social accounts found.\n\n" +
        "Connect your accounts first to auto-post.",
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔗 Connect Accounts",
                  callback_data: "manage_accounts",
                },
              ],
            ],
          },
        },
      );
      return;
    }

    // Show progress message
    const platformNames = accounts
      .map((a) => `${getPlatformEmoji(a.platform)} ${a.platform}`)
      .join(", ");
    await ctx.reply(
      `⏳ *Auto-Posting to ${accounts.length} account(s)...*\n\n` +
      `Platforms: ${platformNames}`,
      { parse_mode: "Markdown" },
    );

    // Publish to all accounts at once
    const results = await PostAutomationService.publish({
      userId: BigInt(userId),
      mediaUrl: video.videoUrl,
      caption:
        ctx.session?.caption ||
        `${video.title || "Check this out!"} #viral #fyp`,
      platformAccountIds: accounts.map((a) => a.id),
    });

    // Build results message
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    let message = `🚀 *Auto-Post Results*\n\n`;
    message += `Total: ${results.length} platform(s)\n`;
    message += `✅ Success: ${successCount}\n`;
    if (failCount > 0) {
      message += `❌ Failed: ${failCount}\n`;
    }
    message += "\n";

    results.forEach((result) => {
      const emoji = result.success ? "✅" : "❌";
      message += `${emoji} ${result.platform.toUpperCase()}`;
      if (result.postUrl) {
        message += ` — [View Post](${result.postUrl})`;
      }
      if (result.error) {
        message += ` — ${result.error}`;
      }
      message += "\n";
    });

    await ctx.reply(message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎬 Buat Video Lagi", callback_data: "back_prompts" }],
          [{ text: "📁 My Videos", callback_data: "videos_list" }],
        ],
      },
    });
  } catch (error: any) {
    logger.error("Auto-post failed:", error);
    await ctx.reply(
      `❌ *Auto-Post Failed*\n\n` +
      `Error: ${error.message}\n\n` +
      `You can still publish manually.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📤 Publish Manually",
                callback_data: `publish_video_${jobId}`,
              },
            ],
            [{ text: "📁 My Videos", callback_data: "videos_list" }],
          ],
        },
      },
    );
  }
}

/**
 * Handle manage accounts
 */
async function handleManageAccounts(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const accounts = await PostAutomationService.getUserAccounts(BigInt(userId));

  if (accounts.length === 0) {
    await ctx.editMessageText(
      "🔗 *Connect Social Accounts*\n\n" +
      "Connect your social media accounts to publish videos directly.\n\n" +
      "Select platform to connect:",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📱 TikTok", callback_data: "connect_account_tiktok" }],
            [
              {
                text: "📷 Instagram",
                callback_data: "connect_account_instagram",
              },
            ],
            [
              {
                text: "📘 Facebook",
                callback_data: "connect_account_facebook",
              },
            ],
            [
              {
                text: "🐦 Twitter/X",
                callback_data: "connect_account_twitter",
              },
            ],
            [{ text: "📺 YouTube", callback_data: "connect_account_youtube" }],
            [{ text: "❌ Cancel", callback_data: "main_menu" }],
          ],
        },
      },
    );
    return;
  }

  // Show connected accounts
  let message = "🔗 *Connected Accounts*\n\n";
  const keyboard: any[][] = [];

  accounts.forEach((acc) => {
    const emoji = getPlatformEmoji(acc.platform);
    message += `${emoji} ${acc.platform.toUpperCase()}: ${acc.username}\n`;
    keyboard.push([
      {
        text: `❌ Disconnect ${acc.platform} (${acc.username})`,
        callback_data: `disconnect_account_${acc.id}`,
      },
    ]);
  });

  message += "\nConnect more accounts:";
  keyboard.push([
    { text: "➕ Connect New Account", callback_data: "connect_account_new" },
  ]);
  keyboard.push([{ text: "◀️ Back", callback_data: "main_menu" }]);

  await ctx.editMessageText(message, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
}

/**
 * Handle connect account
 */
async function handleConnectAccount(ctx: BotContext, platform: string) {
  // In production, this would redirect to OAuth flow
  // For now, we'll show instructions
  await ctx.editMessageText(
    `🔗 *Connect ${platform.toUpperCase()}*\n\n` +
    `To connect your ${platform} account:\n\n` +
    `1. Go to PostBridge Dashboard\n` +
    `2. Connect your ${platform} account\n` +
    `3. Copy your Account ID\n` +
    `4. Paste it here\n\n` +
    `Or use the link below:`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `🔗 Open PostBridge`,
              url: "https://post-bridge.com/dashboard",
            },
          ],
          [{ text: "◀️ Back", callback_data: "manage_accounts" }],
        ],
      },
    },
  );

  ctx.session.state = "WAITING_ACCOUNT_ID";
  ctx.session.connectingPlatform = platform;
}

/**
 * Handle disconnect account
 */
async function handleDisconnectAccount(ctx: BotContext, accountId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  await PostAutomationService.disconnectAccount(
    BigInt(userId),
    parseInt(accountId),
  );

  await ctx.answerCbQuery("✅ Account disconnected");

  // Refresh account list
  await handleManageAccounts(ctx);
}

/**
 * Get platform emoji
 */
function getPlatformEmoji(platform: string): string {
  const emojis: Record<string, string> = {
    tiktok: "📱",
    instagram: "📷",
    facebook: "📘",
    twitter: "🐦",
    youtube: "📺",
  };
  return emojis[platform.toLowerCase()] || "📱";
}

/**
 * Handle image generation
 */
async function handleImageGeneration(ctx: BotContext, category: string) {
  const categoryNames: Record<string, string> = {
    product: "🛍️ Product Photo",
    fnb: "🍔 F&B Food",
    realestate: "🏠 Real Estate",
    car: "🚗 Car/Automotive",
  };

  // Check if a cloned prompt already exists from clone_video or clone_image flow
  const existingClonePrompt = ctx.session?.stateData?.clonePrompt as
    | string
    | undefined;

  if (existingClonePrompt) {
    // Clone prompt exists — skip the "describe what you want" step and fire generation immediately.
    // Release session state before async work so the user is not blocked.
    ctx.session.state = "DASHBOARD";
    ctx.session.stateData = {
      ...ctx.session.stateData,
      imageCategory: category,
      useClonePrompt: true,
    };

    await ctx.editMessageText(
      `🖼️ *Generate ${categoryNames[category] || category}*\n\n` +
      `Using cloned prompt:\n_${existingClonePrompt.slice(0, 200)}${existingClonePrompt.length > 200 ? "..." : ""}_\n\n` +
      `Generating image...`,
      { parse_mode: "Markdown" },
    );

    // Fire-and-forget: trigger generation inline (same pattern as message.ts IMAGE_GENERATION_WAITING)
    const chatId = ctx.chat!.id;
    const telegramClient = ctx.telegram;
    const telegramId = BigInt(ctx.from!.id);

    void (async () => {
      try {
        const result = await ImageGenerationService.generateImage({
          prompt: existingClonePrompt,
          category: category || "product",
          aspectRatio: "1:1",
          style: "commercial",
          mode: "text2img",
        });

        if (result.success && result.imageUrl) {
          await UserService.deductCredits(telegramId, await getImageCreditCostAsync(result.provider));
          await telegramClient.sendPhoto(chatId, result.imageUrl, {
            caption: `✅ *Gambar Berhasil Dibuat!*\n\n_Prompt: ${existingClonePrompt.slice(0, 100)}${existingClonePrompt.length > 100 ? "..." : ""}_`,
            parse_mode: "Markdown",
          });
        } else {
          await telegramClient.sendMessage(chatId, `❌ Gagal generate gambar. Kredit tidak ditagih.\n\n${result.error || ""}`);
        }
      } catch (err) {
        logger.error("useClonePrompt generation error", err);
        await telegramClient.sendMessage(chatId, "❌ Gagal generate gambar. Coba lagi.");
      }
    })();

    return;
  }

  // Build reference image options
  const telegramId = BigInt(ctx.from!.id);
  const avatars = await AvatarService.listAvatars(telegramId);
  const creditCost = await getImageCreditCostAsync();

  const avatarButtons = avatars.slice(0, 3).map((a) => ({
    text: `👤 ${a.isDefault ? "⭐ " : ""}${a.name}`,
    callback_data: `imgref_avatar_${a.id}`,
  }));

  await ctx.editMessageText(
    `🖼️ *Generate ${categoryNames[category]}*\n` +
    `💰 _Biaya: ${creditCost} kredit per gambar_\n\n` +
    `How do you want to generate?\n\n` +
    `📸 *Upload Reference* — Send your product photo and AI will create marketing images based on it\n` +
    `👤 *Use Avatar* — Keep a consistent character/person across images\n` +
    `✏️ *Describe Only* — AI generates from your text description`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📸 Upload Reference Photo",
              callback_data: "imgref_upload",
            },
          ],
          ...(avatarButtons.length > 0 ? [avatarButtons] : []),
          [
            {
              text: "✏️ Describe Only (No Reference)",
              callback_data: "imgref_skip",
            },
          ],
          [{ text: "◀️ Menu Utama", callback_data: "main_menu" }],
        ],
      },
    },
  );

  // Only persist the imageCategory — do NOT set state here.
  // imgref_upload sets IMAGE_REFERENCE_WAITING; imgref_skip sets
  // IMAGE_GENERATION_WAITING. Setting IMAGE_GENERATION_WAITING here would
  // cause photo uploads at this point to be silently dropped.
  ctx.session.stateData = { ...ctx.session.stateData, imageCategory: category };
}
