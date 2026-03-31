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
const btnBackMain = (lang: string) => ({ text: t('btn.main_menu', lang), callback_data: "main_menu" });

/**
 * Handle storyboard selection
 */
async function handleStoryboardRequest(ctx: BotContext, niche: string) {
  try {
    const storyboard = await VideoService.generateStoryboard({
      niche,
      duration: 30,
    });

    const lang = ctx.session?.userLang || 'id';
    let message = t('cb.storyboard_title', lang, { niche: niche.toUpperCase() }) + '\n\n';

    storyboard.scenes.forEach((s) => {
      message += t('cb.storyboard_scene', lang, { scene: s.scene, duration: s.duration, type: s.type, description: s.description }) + '\n\n';
    });

    message += t('cb.storyboard_caption', lang, { caption: storyboard.caption }) + '\n\n';
    message += t('cb.storyboard_cost', lang);

    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: t('btn.create_video_now', lang),
              callback_data: `confirm_create_${niche}`,
            },
          ],
          [
            {
              text: t('btn.back_to_selection', lang),
              callback_data: "storyboard_create",
            },
          ],
        ],
      },
    });
  } catch (error) {
    logger.error("Storyboard error:", error);
    const lang = ctx.session?.userLang || 'id';
    await ctx.answerCbQuery(t('cb.storyboard_failed', lang));
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
      const lang = ctx.session?.userLang || 'id';
      await ctx.answerCbQuery(t('cb.transfer_cancelled', lang));
      await ctx.editMessageText(t('cb.transfer_cancelled', lang));
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
        const lang = ctx.session?.userLang || 'id';
        await ctx.answerCbQuery(t('cb.processing_transfer', lang));
        const result = await P2pService.executeTransfer(senderId, recipientId, amount);

        if (result.success) {
          await ctx.editMessageText(
            t('cb.transfer_success', lang, { amount, recipientId: recipientIdStr }),
            { parse_mode: "Markdown" }
          );

          // Notify recipient
          try {
            await ctx.telegram.sendMessage(
              Number(recipientIdStr),
              t('cb.transfer_received', lang, { senderId: senderId.toString(), amount }),
              { parse_mode: "Markdown" }
            );
          } catch (err) {
            logger.warn(`Failed to notify recipient ${recipientIdStr}`);
          }
        } else {
          await ctx.editMessageText(t('cb.transfer_failed', lang, { error: result.error }), { parse_mode: "Markdown" });
        }
      } catch (error: any) {
        const lang = ctx.session?.userLang || 'id';
        await ctx.editMessageText(t('cb.transfer_error', lang, { error: error.message }), { parse_mode: "Markdown" });
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
      // Always reset state and clear generate session so user isn't stuck in a previous flow
      if (ctx.session) {
        ctx.session.state = "DASHBOARD";
        delete ctx.session.generateProductDesc;
        delete ctx.session.generatePhotoUrl;
        delete ctx.session.generatePreset;
        delete ctx.session.generatePlatform;
        delete ctx.session.generateAction;
        delete ctx.session.generateScenes;
        delete ctx.session.generateMode;
        delete ctx.session.generateCampaignSize;
        delete ctx.session.customPresetConfig;
        if (ctx.session.stateData && typeof ctx.session.stateData === 'object') {
          delete (ctx.session.stateData as any).selectedPrompt;
          delete (ctx.session.stateData as any).selectedPromptId;
        }
      }
      const user = ctx.from;
      if (!user) return;
      const lang = ctx.session?.userLang || 'id';
      const dbUser = await UserService.findByTelegramId(BigInt(user.id));
      const credBal = dbUser ? Number(dbUser.creditBalance) : 0;
      const credEmoji = credBal === 0 ? "⚠️" : credBal < 3 ? "🟡" : "🟢";

      const rows: any[][] = [
        [{ text: t('btn.browse_prompts', lang), callback_data: "back_prompts" }],
        [
          { text: t('btn.trending', lang), callback_data: "prompts_trending" },
          { text: t('btn.free_prompt', lang), callback_data: "daily_open" },
        ],
        [
          { text: t('btn.create_video', lang), callback_data: "create_video_new" },
          { text: t('btn.create_image', lang), callback_data: "image_from_prompt" },
        ],
        [
          { text: t('btn.clone', lang), callback_data: "clone_video" },
          { text: t('btn.storyboard', lang), callback_data: "storyboard_create" },
          { text: t('btn.viral', lang), callback_data: "viral_research" },
        ],
        [
          { text: t('btn.repurpose', lang), callback_data: "repurpose_video" },
          { text: t('btn.disassemble', lang), callback_data: "disassemble" },
        ],
        [
          { text: t('btn.topup', lang), callback_data: "topup" },
          { text: t('btn.subscription', lang), callback_data: "open_subscription" },
        ],
        [
          { text: t('btn.my_videos', lang), callback_data: "videos_list" },
          { text: t('btn.referral', lang), callback_data: "open_referral" },
          { text: t('btn.profile', lang), callback_data: "open_profile" },
        ],
      ];

      const webAppUrl = process.env.WEB_APP_URL;
      if (webAppUrl) {
        rows.push([{ text: t('btn.web_dashboard', lang), web_app: { url: `${webAppUrl}/app` } }]);
      }

      await ctx.editMessageText(
        t('cb.main_menu_greeting', lang, { name: user.first_name, credEmoji, credits: credBal }),
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: rows },
        },
      );
      return;
    }

    if (data === "credits_menu") {
      await ctx.answerCbQuery();
      const lang = ctx.session?.userLang || 'id';
      const user = ctx.from;
      if (!user) return;
      const dbUser = await UserService.findByTelegramId(BigInt(user.id));
      const credBal = dbUser ? Number(dbUser.creditBalance) : 0;
      const tier = dbUser?.tier || "free";
      await ctx.editMessageText(
        t('cb.credits_menu_title', lang, { credits: credBal, tier }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: t('btn.buy_credits', lang), callback_data: "topup" }],
              [
                {
                  text: t('btn.upgrade_subscription', lang),
                  callback_data: "open_subscription",
                },
              ],
              [{ text: t('btn.referral_code', lang), callback_data: "open_referral" }],
              [btnBackMain(lang)],
            ],
          },
        },
      );
      return;
    }

    if (data === "account_menu") {
      await ctx.answerCbQuery();
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.account_title', lang),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: t('btn.fav_workflows', lang),
                  callback_data: "account_favorites",
                },
              ],
              [
                {
                  text: t('btn.workflow_prefs', lang),
                  callback_data: "account_preferences",
                },
              ],
              [{ text: t('btn.referral_code', lang), callback_data: "open_referral" }],
              [
                {
                  text: t('btn.lang_notif', lang),
                  callback_data: "account_settings",
                },
              ],
              [{ text: t('btn.help_faq', lang), callback_data: "open_help" }],
              [btnBackMain(lang)],
            ],
          },
        },
      );
      return;
    }

    // Placeholder handlers for new account submenu
    if (data === "account_favorites") {
      const lang = ctx.session?.userLang || 'id';
      await ctx.answerCbQuery(t('misc.coming_soon', lang));
      return;
    }
    if (data === "account_preferences") {
      const lang = ctx.session?.userLang || 'id';
      await ctx.answerCbQuery(t('misc.coming_soon', lang));
      return;
    }
    if (data === "account_settings") {
      const lang = ctx.session?.userLang || 'id';
      await ctx.answerCbQuery(t('cb.lang_notif_coming_soon', lang));
      return;
    }

    // Chat AI — activate conversational mode
    if (data === "chat_ai") {
      await ctx.answerCbQuery();
      const lang = ctx.session?.userLang || 'id';
      if (ctx.session) ctx.session.state = "DASHBOARD";
      await ctx.editMessageText(
        t('cb.chat_ai_active', lang),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: t('btn.prompt_library', lang), callback_data: "prompts_menu" }],
              [btnBackMain(lang)],
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
        const lang = ctx.session?.userLang || 'id';
        await ctx.reply(t('cb.prompt_not_found', lang));
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
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.rate_title', lang),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: t('cb.rate_5', lang), callback_data: "rate_5" },
              ],
              [
                { text: t('cb.rate_4', lang), callback_data: "rate_4" },
              ],
              [
                { text: t('cb.rate_3', lang), callback_data: "rate_3" },
              ],
              [
                { text: t('cb.rate_2', lang), callback_data: "rate_2" },
              ],
              [btnBackMain(lang)],
            ],
          },
        },
      );
      return;
    }

    if (data.startsWith("rate_")) {
      const lang = ctx.session?.userLang || 'id';
      const score = parseInt(data.replace("rate_", ""));
      const stars = "⭐".repeat(score);
      await ctx.answerCbQuery(t('cb.rate_thanks', lang, { stars }));
      await ctx.editMessageText(
        t('cb.rate_thanks_msg', lang, { stars }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: t('btn.generate_again', lang), callback_data: "generate_start" }],
              [{ text: t('btn.home_menu', lang), callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    // Support: tutorial and bug report
    if (data === "view_tutorial") {
      await ctx.answerCbQuery();
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.tutorial', lang),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: t('btn.back', lang), callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    if (data === "report_bug") {
      await ctx.answerCbQuery();
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.report_bug', lang),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: t('btn.back', lang), callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    // Image generation menu
    if (data === "img_gen_menu") {
      await ctx.answerCbQuery();
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.img_gen_menu', lang),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: t('cb.img_product', lang), callback_data: "img_product" }],
              [{ text: t('cb.img_fnb', lang), callback_data: "img_fnb" }],
              [{ text: t('cb.img_realestate', lang), callback_data: "img_realestate" }],
              [{ text: t('cb.img_car', lang), callback_data: "img_car" }],
              [btnBackMain(lang)],
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
        const lang = ctx.session?.userLang || 'id';
        if (ctx.session) {
          ctx.session.state = "CUSTOM_DURATION_INPUT_V3";
        }
        await ctx.editMessageText(
          t('cb.custom_duration_v3', lang),
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
      const lang = ctx.session?.userLang || 'id';
      if (ctx.session) ctx.session.state = 'AWAITING_GENERATE_IMAGE';
      await ctx.editMessageText(
        t('cb.send_reference_photo', lang),
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

    // Pro mode: multi-image upload controls
    if (data === "pro_image_complete_ai" || data === "pro_image_skip") {
      await ctx.answerCbQuery();
      if (ctx.session) {
        ctx.session.generatePhotoUploadDone = true;
        ctx.session.state = 'DASHBOARD';
      }
      const { showPromptSourceSelection } = await import('../flows/generate.js');
      await showPromptSourceSelection(ctx);
      return;
    }

    // Pro mode: storyboard auto/manual
    if (data === "pro_storyboard_auto") {
      await ctx.answerCbQuery();
      if (ctx.session) ctx.session.generateStoryboardMode = 'auto';
      const { showProTranscriptChoice } = await import('../flows/generate.js');
      await showProTranscriptChoice(ctx);
      return;
    }

    if (data === "pro_storyboard_manual") {
      await ctx.answerCbQuery();
      if (ctx.session) ctx.session.generateStoryboardMode = 'manual';
      const { showProStoryboardEditor } = await import('../flows/generate.js');
      await showProStoryboardEditor(ctx, 0);
      return;
    }

    // Pro mode: transcript auto/manual
    if (data === "pro_transcript_auto") {
      await ctx.answerCbQuery();
      if (ctx.session) ctx.session.generateTranscriptMode = 'auto';
      const { showSmartPresetSelection } = await import('../flows/generate.js');
      await showSmartPresetSelection(ctx);
      return;
    }

    if (data === "pro_transcript_manual") {
      await ctx.answerCbQuery();
      if (ctx.session) ctx.session.state = 'AWAITING_TRANSCRIPT_INPUT';
      const { t } = await import('../i18n/translations.js');
      await ctx.editMessageText(t('gen.transcript_input', ctx.session?.userLang || 'id'), { parse_mode: 'Markdown' });
      return;
    }

    // Prompt source selection: library or custom
    if (data === "prompt_source_library") {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => {});
      await promptsCommand(ctx);
      return;
    }

    if (data === "prompt_source_custom") {
      await ctx.answerCbQuery();
      const lang = ctx.session?.userLang || 'id';
      if (ctx.session) ctx.session.state = 'AWAITING_PRODUCT_INPUT';
      const action = ctx.session?.generateAction || 'video';
      const actionLabelKeys: Record<string, string> = {
        image_set: 'cb.action_label_image_set',
        video: 'cb.action_label_video',
        campaign: 'cb.action_label_campaign',
      };
      const output = actionLabelKeys[action] ? t(actionLabelKeys[action], lang) : action;
      await ctx.editMessageText(
        t('cb.write_custom_prompt', lang, { output }),
        { parse_mode: 'Markdown' },
      );
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
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.onboard_credits_info', lang),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: t('btn.claim_trial', lang),
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
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.onboard_trial_claimed', lang),
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

      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.onboard_account_created', lang, { niche: nicheLabels[niche] || niche }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: t('btn.use_welcome_bonus', lang),
                  callback_data: "use_welcome_bonus",
                },
              ],
              [{ text: t('btn.buy_credits', lang), callback_data: "topup" }],
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
        const lang = ctx.session?.userLang || 'id';
        await ctx.reply(t('cb.user_not_found_start', lang));
        return;
      }

      // Check if welcome bonus already used
      if (dbUser.welcomeBonusUsed) {
        const lang = ctx.session?.userLang || 'id';
        await ctx.editMessageText(
          t('cb.welcome_bonus_used', lang),
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: t('btn.use_daily_free', lang),
                    callback_data: "use_daily_free",
                  },
                ],
                [{ text: t('btn.buy_credits', lang), callback_data: "topup" }],
                [{ text: t('btn.home_menu', lang), callback_data: "main_menu" }],
              ],
            },
          },
        );
        return;
      }

      // Redirect to prompt library for selected niche
      const lang2 = ctx.session?.userLang || 'id';
      const niche = dbUser.selectedNiche || "fnb";
      await ctx.editMessageText(
        t('cb.welcome_bonus_prompt', lang2, { niche: niche.toUpperCase() }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: t('btn.view_prompt_library', lang2),
                  callback_data: `prompts_niche_${niche}`,
                },
              ],
              [{ text: t('btn.back', lang2), callback_data: "main_menu" }],
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
        const lang = ctx.session?.userLang || 'id';
        await ctx.reply(t('cb.user_not_found_start', lang));
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

        const lang = ctx.session?.userLang || 'id';
        await ctx.editMessageText(
          t('cb.daily_free_not_reset', lang, { hours: hoursLeft }),
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: t('btn.use_welcome', lang),
                    callback_data: "use_welcome_bonus",
                  },
                ],
                [{ text: t('btn.buy_credits', lang), callback_data: "topup" }],
                [{ text: t('btn.home_menu', lang), callback_data: "main_menu" }],
              ],
            },
          },
        );
        return;
      }

      // Redirect to prompt library
      const lang = ctx.session?.userLang || 'id';
      const niche = dbUser.selectedNiche || "fnb";
      await ctx.editMessageText(
        t('cb.daily_free_prompt', lang, { niche: niche.toUpperCase() }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: t('btn.view_prompt_library', lang),
                  callback_data: `prompts_niche_${niche}`,
                },
              ],
              [{ text: t('btn.back', lang), callback_data: "main_menu" }],
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

      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.onboard_lang_welcome', lang),
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
        if (referrer && referrer.telegramId !== BigInt(userId)) {
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
            [{ text: t('btn.create_video', lang), callback_data: "create_video_new" }],
            [{ text: t('btn.create_image', lang), callback_data: "create_image_new" }],
            [{ text: t('btn.credits_packages', lang), callback_data: "credits_menu" }],
            [{ text: t('btn.my_videos_emoji', lang), callback_data: "videos_list" }],
            [{ text: t('btn.account', lang), callback_data: "account_menu" }],
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
    if (data.startsWith("topup_") || data.startsWith("duitku_method_") || data.startsWith("check_payment_") || data.startsWith("subscribe_") || data === "cancel_subscription" || data === "open_subscription") {
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
            [{ text: t('btn.try_again', feedbackLang), callback_data: "back_prompts" }],
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
      const lang = ctx.session?.userLang || 'id';
      if (ctx.session?.videoCreation)
        ctx.session.videoCreation.waitingForImage = true;
      ctx.session!.state = "CREATE_VIDEO_UPLOAD";
      await ctx.editMessageText(
        t('cb.upload_reference', lang),
        { parse_mode: "Markdown" },
      );
      return;
    }

    // Legacy handlers removed for MVP
    // Mode, niche, platform selection now automatic

    // Brief skip
    if (data === "brief_skip") {
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.brief_skip', lang),
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: t('btn.yes_create', lang), callback_data: "confirm_create" },
                { text: t('btn.cancel', lang), callback_data: "cancel_create" },
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
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.creation_cancelled', lang),
      );
      ctx.session.state = "DASHBOARD";
      return;
    }

    // Payment method handlers (placeholder - will use Midtrans)
    if (data.startsWith("payment_")) {
      const lang = ctx.session?.userLang || 'id';
      const [, method, packageId] = data.split("_");

      await ctx.editMessageText(
        t('cb.payment_processing', lang, { method }),
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: t('btn.simulate_success', lang),
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

      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.payment_success_sim', lang, { credits: credits[packageId] || 0 }),
      );
      return;
    }

    // Share referral
    if (data === "share_referral") {
      const lang = ctx.session?.userLang || 'id';
      await ctx.answerCbQuery(t('misc.share_coming_soon', lang));
      return;
    }

    // ─── PROMPT LIBRARY CALLBACKS ──────────────────────────────────────────

    // Browse niche prompts: prompts_fnb, prompts_fashion, etc.
    if (data.startsWith("prompts_")) {
      await ctx.answerCbQuery();
      const nicheKey = data.replace("prompts_", "");
      if (nicheKey === "trending") {
        // Build trending inline (edit in place)
        const lang = ctx.session?.userLang || 'id';
        const TP = TRENDING_PROMPTS;
        const PL = PROMPT_LIBRARY;
        let msg = t('cb.trending_header', lang) + '\n\n';
        const buttons: any[][] = [];
        TP.forEach((tp: any, i: number) => {
          const niche = PL[tp.niche];
          const p = niche.prompts.find((x: any) => x.id === tp.promptId)!;
          msg += `*#${i + 1}* ${niche.emoji} ${p.title} — ⭐${p.successRate}% | 📈+${tp.usageChange}%\n\n`;
          buttons.push([
            {
              text: `#${i + 1} ${p.title}`,
              callback_data: `use_prompt_${p.id}`,
            },
          ]);
        });
        buttons.push([
          { text: t('btn.back_to_niche', lang), callback_data: "back_prompts" },
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
        const lang = ctx.session?.userLang || 'id';
        await ctx.editMessageText(
          t('cb.custom_prompt_gen', lang),
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: t('btn.back', lang), callback_data: "back_prompts" }],
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
      const lang = ctx.session?.userLang || 'id';
      const typeLabel = type === "style" ? "Style" : "Lighting";
      await ctx.editMessageText(
        t('cb.prompt_updated', lang, { prompt: newPrompt.slice(0, 300), typeLabel, value }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: t('btn.create_video', lang), callback_data: "create_video_new" },
                { text: t('btn.create_image', lang), callback_data: "image_from_prompt" },
              ],
              [
                {
                  text: t('btn.customize_again', lang),
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
          const lang = ctx.session?.userLang || 'id';
          await ctx.answerCbQuery(t('prompt.deleted', lang));
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
      const lang = ctx.session?.userLang || 'id';
      try {
        await ctx.editMessageText(
          t('cb.prompt_library_title', lang),
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
                  { text: t('btn.trending', lang), callback_data: "prompts_trending" },
                  { text: t('btn.custom_ai', lang), callback_data: "prompts_custom" },
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
      const lang = ctx.session?.userLang || 'id';
      await ctx.answerCbQuery(t('prompt.saved_to_session', lang));
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
        const lang = ctx.session?.userLang || 'id';
        await ctx.editMessageText(
          t('cb.another_mystery', lang, { emoji: niche.emoji, title: p.title, prompt: p.prompt, rate: p.successRate }),
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: t('btn.use_now', lang),
                    callback_data: `use_prompt_${p.id}`,
                  },
                ],
                [{ text: t('btn.browse_all', lang), callback_data: "back_prompts" }],
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
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.image_generate_title', lang),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: t('btn.product_photo', lang), callback_data: "img_product" }],
              [{ text: t('btn.fnb_food', lang), callback_data: "img_fnb" }],
              [
                {
                  text: t('btn.real_estate', lang),
                  callback_data: "img_realestate",
                },
              ],
              [{ text: t('btn.automotive', lang), callback_data: "img_car" }],
              [{ text: t('btn.manage_avatar', lang), callback_data: "avatar_manage" }],
              [btnBackMain(lang)],
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
      const lang = ctx.session?.userLang || 'id';
      const telegramId = BigInt(ctx.from!.id);
      const avatars = await AvatarService.listAvatars(telegramId);

      let message = t('cb.avatar_title', lang) + '\n\n';
      if (avatars.length === 0) {
        message += t('cb.avatar_empty', lang);
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
            [{ text: t('btn.add_avatar', lang), callback_data: "avatar_add" }],
            [{ text: t('btn.back', lang), callback_data: "image_generate" }],
          ],
        },
      });
      return;
    }

    if (data === "avatar_add") {
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.avatar_add', lang),
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
        const lang = ctx.session?.userLang || 'id';
        await ctx.answerCbQuery(t('misc.avatar_not_found', lang));
        return;
      }

      const lang = ctx.session?.userLang || 'id';
      const defaultLabel = avatar.isDefault ? t('cb.avatar_is_default', lang) + '\n' : '';
      const descStr = avatar.description ? `_${avatar.description.slice(0, 300)}_\n\n` : '';
      await ctx.editMessageText(
        t('cb.avatar_view', lang, { name: avatar.name, defaultLabel, description: descStr }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              ...(avatar.isDefault
                ? []
                : [
                  [
                    {
                      text: t('btn.set_default', lang),
                      callback_data: `avatar_default_${avatar.id}`,
                    },
                  ],
                ]),
              [
                {
                  text: t('btn.delete', lang),
                  callback_data: `avatar_delete_${avatar.id}`,
                },
              ],
              [{ text: t('btn.back', lang), callback_data: "avatar_manage" }],
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
      const lang = ctx.session?.userLang || 'id';
      await ctx.answerCbQuery(t('misc.avatar_set_default', lang));
      // Re-show manage screen
      const avatars = await AvatarService.listAvatars(telegramId);
      let message = t('cb.avatar_title', lang) + '\n\n';
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
            [{ text: t('btn.add_avatar', lang), callback_data: "avatar_add" }],
            [{ text: t('btn.back', lang), callback_data: "image_generate" }],
          ],
        },
      });
      return;
    }

    if (data.startsWith("avatar_delete_")) {
      const avatarId = parseInt(data.replace("avatar_delete_", ""), 10);
      const telegramId = BigInt(ctx.from!.id);
      const lang = ctx.session?.userLang || 'id';
      const deleted = await AvatarService.deleteAvatar(telegramId, avatarId);
      await ctx.answerCbQuery(
        deleted ? t('cb.avatar_deleted', lang) : t('cb.avatar_not_found_del', lang),
      );
      // Return to manage
      const avatars = await AvatarService.listAvatars(telegramId);
      let message = t('cb.avatar_title', lang) + '\n\n';
      if (avatars.length === 0) {
        message += t('cb.avatar_empty', lang);
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
            [{ text: t('btn.add_avatar', lang), callback_data: "avatar_add" }],
            [{ text: t('btn.back', lang), callback_data: "image_generate" }],
          ],
        },
      });
      return;
    }

    // Upload reference image for image generation
    if (data === "imgref_upload") {
      await ctx.answerCbQuery();
      const lang = ctx.session?.userLang || 'id';
      ctx.session.state = "IMAGE_REFERENCE_WAITING";
      await ctx.editMessageText(
        t('cb.imgref_upload', lang),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: t('btn.skip_describe', lang),
                  callback_data: "imgref_skip",
                },
              ],
              [{ text: t('btn.back', lang), callback_data: "image_generate" }],
            ],
          },
        },
      );
      return;
    }

    // Skip reference image → generate text2img
    if (data === "imgref_skip") {
      await ctx.answerCbQuery();
      const lang = ctx.session?.userLang || 'id';
      ctx.session.state = "IMAGE_GENERATION_WAITING";
      const category = ctx.session.stateData?.imageCategory as string;
      ctx.session.stateData = { ...ctx.session.stateData, imageCategory: category, mode: "text2img" };

      const hintKeys: Record<string, string> = {
        product: 'cb.imgref_hint_product',
        fnb: 'cb.imgref_hint_fnb',
        realestate: 'cb.imgref_hint_realestate',
        car: 'cb.imgref_hint_car',
      };
      const hint = t(hintKeys[category] || 'cb.imgref_hint_default', lang);

      await ctx.editMessageText(
        t('cb.describe_image', lang, { hint }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: t('btn.back', lang), callback_data: "image_generate" }],
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
        const lang = ctx.session?.userLang || 'id';
        await ctx.answerCbQuery(t('misc.avatar_not_found', lang));
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

      const lang2 = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.using_avatar', lang2, { name: avatar.name }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [btnBackMain(lang2)],
            ],
          },
        },
      );
      return;
    }

    // Clone/Remake Video
    if (data === "clone_video") {
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb.clone_video', lang),
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [[btnBackMain(lang)]] },
        },
      );
      ctx.session.state = "CLONE_VIDEO_WAITING";
      return;
    }

    if (data === "clone_edit_desc") {
      await ctx.answerCbQuery();

      if (!ctx.session?.stateData?.clonePrompt) {
        const lang = ctx.session?.userLang || 'id';
        await ctx.reply(t('cb.clone_not_found', lang));
        return;
      }

      await ctx.editMessageText(
        t('cb2.edit_video_desc', ctx.session?.userLang || 'id'),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: t('btn.cancel', ctx.session?.userLang || 'id'), callback_data: "main_menu" }],
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
        t('cb2.clone_image', ctx.session?.userLang || 'id'),
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [[btnBackMain(ctx.session?.userLang || 'id')]] },
        },
      );
      ctx.session.state = "CLONE_IMAGE_WAITING";
      return;
    }

    // Storyboard Creator
    if (data === "storyboard_create") {
      {
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb2.storyboard_creator', lang),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: t('cb2.product_promo', lang), callback_data: "sb_product" }],
              [{ text: t('cb2.fnb_content', lang), callback_data: "sb_fnb" }],
              [{ text: t('cb2.realestate_tour', lang), callback_data: "sb_realestate" }],
              [{ text: t('cb2.car_showcase', lang), callback_data: "sb_car" }],
              [btnBackMain(ctx.session?.userLang || 'id')],
            ],
          },
        },
      );
      }
      return;
    }

    if (data === "sb_product") return handleStoryboardRequest(ctx, "product");
    if (data === "sb_fnb") return handleStoryboardRequest(ctx, "fnb");
    if (data === "sb_realestate")
      return handleStoryboardRequest(ctx, "realestate");
    if (data === "sb_car") return handleStoryboardRequest(ctx, "car");

    // Viral/Trend Research
    if (data === "viral_research") {
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb2.viral_research', lang),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: t('cb2.all_trends', lang), callback_data: "trend_viral" }],
              [{ text: t('cb2.fnb_restaurant', lang), callback_data: "trend_fnb" }],
              [{ text: t('cb2.realestate', lang), callback_data: "trend_realestate" }],
              [{ text: t('cb2.ecommerce', lang), callback_data: "trend_ecom" }],
              [{ text: t('cb2.back_to_menu', lang), callback_data: "main_menu" }],
            ],
          },
        },
      );
      return;
    }

    if (data.startsWith("trend_")) {
      const niche = data.replace("trend_", "");
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb2.viral_research_result', lang, { niche: niche.toUpperCase() }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: t('cb2.generate_viral_storyboard', lang),
                  callback_data: `sb_${niche === "viral" ? "product" : niche === "ecom" ? "product" : niche}`,
                },
              ],
              [{ text: t('btn.back', lang), callback_data: "viral_research" }],
            ],
          },
        },
      );
      return;
    }

    // Video/Image to Prompt (Disassemble)
    if (data === "disassemble") {
      await ctx.editMessageText(
        t('cb2.disassemble', ctx.session?.userLang || 'id'),
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [[btnBackMain(ctx.session?.userLang || 'id')]] },
        },
      );
      ctx.session.state = "DISASSEMBLE_WAITING";
      return;
    }

    // Repurpose / Trend Replication
    if (data === "repurpose_video") {
      await ctx.editMessageText(
        t('cb2.repurpose_video', ctx.session?.userLang || 'id'),
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [[btnBackMain(ctx.session?.userLang || 'id')]] },
        },
      );
      ctx.session.state = "REPURPOSE_VIDEO_URL";
      return;
    }

    if (data === "repurpose_generate_t2v") {
      // Use extracted storyboard prompts for t2v generation
      const repurposeData = ctx.session.stateData?.repurposeData as any;
      if (!repurposeData?.storyboard) {
        const lang = ctx.session?.userLang || 'id';
        await ctx.reply(t('cb.analysis_not_found', lang));
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
        const lang = user?.language || ctx.session?.userLang || 'id';
        await ctx.reply(t('cb.insufficient_credits_cost', lang, { cost: creditCost }));
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

      try {
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
      } catch (queueErr) {
        logger.error('Repurpose T2V queue failed:', queueErr);
        await UserService.refundCredits(telegramId, creditCost, jobId, 'queue failed')
          .catch((err) => logger.error('CRITICAL: repurpose refund failed', { jobId, err }));
        const lang2 = ctx.session?.userLang || 'id';
        await ctx.reply(t('cb.video_process_failed_refund', lang2));
        return;
      }

      await ctx.editMessageText(
        t('cb2.video_regen_started', ctx.session?.userLang || 'id', { jobId, scenes: storyboard.length, duration, niche }),
        { parse_mode: "Markdown" },
      );
      return;
    }

    if (data === "repurpose_generate_i2v") {
      const repurposeData = ctx.session.stateData?.repurposeData as any;
      if (!repurposeData?.storyboard) {
        const lang = ctx.session?.userLang || 'id';
        await ctx.reply(t('cb.analysis_not_found', lang));
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
        const lang = user?.language || ctx.session?.userLang || 'id';
        await ctx.reply(t('cb.insufficient_credits_cost', lang, { cost: creditCost }));
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

      try {
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
      } catch (queueErr) {
        logger.error('Repurpose I2V queue failed:', queueErr);
        await UserService.refundCredits(telegramId, creditCost, jobId, 'queue failed')
          .catch((err) => logger.error('CRITICAL: repurpose i2v refund failed', { jobId, err }));
        const lang2 = ctx.session?.userLang || 'id';
        await ctx.reply(t('cb.video_process_failed_refund', lang2));
        return;
      }

      await ctx.editMessageText(
        t('cb2.video_regen_started_ref', ctx.session?.userLang || 'id', { jobId, scenes: storyboard.length, duration, niche }),
        { parse_mode: "Markdown" },
      );
      return;
    }

    // (main_menu is handled above in NEW REDESIGN HANDLERS section)

    // Videos menu handlers
    if (data === "videos_favorites") {
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb2.favorites_title', lang),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: t('btn.back', lang), callback_data: "videos_back" }],
            ],
          },
        },
      );
      return;
    }

    if (data === "videos_trash") {
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb2.trash_title', lang),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: t('btn.back', lang), callback_data: "videos_back" }],
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
        const lang = ctx.session?.userLang || 'id';
        await ctx.editMessageText(t('cb.access_denied_video', lang));
        return;
      }
      // Soft delete — mark as deleted instead of removing from database
      await VideoService.deleteVideo(jobId);
      await ctx.editMessageText(
        t('cb2.video_moved_trash', ctx.session?.userLang || 'id'),
        { parse_mode: "Markdown" },
      );
      return;
    }

    if (data.startsWith("video_retry_")) {
      const lang = ctx.session?.userLang || 'id';
      await ctx.answerCbQuery(t('cb.retrying_video', lang));
      await createCommand(ctx);
      return;
    }

    // Copy Caption — reply with plain caption text for easy copying
    if (data.startsWith("copy_caption_")) {
      const jobId = data.replace("copy_caption_", "");
      const lang = ctx.session?.userLang || 'id';
      await ctx.answerCbQuery(t('cb.caption_copied', lang));

      try {
        const video = await VideoService.getByJobId(jobId);
        if (video && ctx.from && video.userId !== BigInt(ctx.from.id)) {
          await ctx.reply(t('cb.access_denied', lang));
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
        await ctx.reply(t('cb.caption_failed', lang));
      }
      return;
    }

    // Create Similar — pre-fill niche + style + storyboard from a past video, skip to ref image
    if (data.startsWith("create_similar_")) {
      const jobId = data.replace("create_similar_", "");
      const lang = ctx.session?.userLang || 'id';
      await ctx.answerCbQuery(t('cb.loading_settings', lang));

      try {
        const video = await VideoService.getByJobId(jobId);
        if (!video) {
          await ctx.reply(t('cb.video_not_found_create', lang));
          return;
        }

        if (ctx.from && video.userId !== BigInt(ctx.from.id)) {
          await ctx.reply(t('cb.access_denied', lang));
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
        {
        const lang = ctx.session?.userLang || 'id';
        await ctx.editMessageText(
          t('cb2.creating_similar', lang, {
            nicheInfo: `${nicheConfig?.emoji || ""} ${nicheConfig?.name || nicheKey}`,
            duration: videoDuration,
            storyboardInfo,
            style: videoStyles[0],
          }),
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: t('cb2.skip_ref_image', lang),
                    callback_data: `duration_${videoDuration}_${videoScenes}`,
                  },
                ],
                [
                  {
                    text: t('cb2.change_niche_style', lang),
                    callback_data: "create_video_new",
                  },
                ],
              ],
            },
          },
        );
        }
      } catch (error) {
        logger.error("Create similar error:", error);
        await ctx.reply(
          t('cb2.create_similar_failed', ctx.session?.userLang || 'id'),
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
      const lang = ctx.session?.userLang || 'id';
      await ctx
        .editMessageText(
          t('cb2.ai_assistant_active', lang),
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: t('cb2.prompt_library', lang),
                    callback_data: "back_prompts",
                  },
                ],
                [
                  {
                    text: t('cb2.trending_prompts', lang),
                    callback_data: "prompts_trending",
                  },
                ],
                [{ text: t('cb2.back_to_menu', lang), callback_data: "main_menu" }],
              ],
            },
          },
        )
        .catch(async () => {
          // fallback if message can't be edited
          await ctx.reply(
            t('cb2.ai_assistant_fallback', lang),
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
        const lang = ctx.session?.userLang || 'id';
        const msg = t('cb2.mystery_prompt_box', lang, {
          nicheEmoji: niche.emoji,
          nicheLabel: niche.label,
          rarity: mystery.rarity,
          title: p.title,
          prompt: p.prompt,
          successRate: p.successRate,
        });
        try {
          await ctx.editMessageText(msg, {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: t('cb2.use_now', lang),
                    callback_data: `use_prompt_${p.id}`,
                  },
                ],
                [{ text: t('cb2.another_prompt', lang), callback_data: "daily_another" }],
                [{ text: t('cb2.back_to_menu', lang), callback_data: "back_prompts" }],
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
          text: t('cb2.back_to_settings', currentLang),
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
      await ctx.answerCbQuery(`${langCfg.flag} ${langCfg.label} ✅`);
      const userId = ctx.from?.id;
      if (userId) {
        await UserService.update(BigInt(userId), { language: langCode });
      }
      await ctx.editMessageText(
        t('cb2.lang_updated', langCode, { flag: langCfg.flag, label: langCfg.label }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: t('cb2.back_to_settings', langCode),
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

      {
      const lang = ctx.session?.userLang || 'id';
      const statusText = enabled ? t('cb2.notif_enabled', lang) : t('cb2.notif_disabled', lang);
      await ctx.editMessageText(
        t('cb2.notifications_title', lang, { status: statusText }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: enabled
                    ? t('cb2.turn_off_notif', lang)
                    : t('cb2.turn_on_notif', lang),
                  callback_data: "toggle_notifications",
                },
              ],
              [{ text: t('cb2.back_to_settings', lang), callback_data: "open_settings" }],
            ],
          },
        },
      );
      }
      return;
    }

    // Toggle notifications
    if (data === "toggle_notifications") {
      const userId = ctx.from?.id;
      if (!userId) {
        const lang = ctx.session?.userLang || 'id';
        await ctx.answerCbQuery(t('misc.user_not_found_error', lang));
        return;
      }
      const user = await UserService.findByTelegramId(BigInt(userId));
      const newValue = !(user?.notificationsEnabled ?? true);
      await UserService.update(BigInt(userId), {
        notificationsEnabled: newValue,
      });
      {
      const lang = ctx.session?.userLang || 'id';
      await ctx.answerCbQuery(
        newValue ? t('cb2.notif_toggle_on', lang) : t('cb2.notif_toggle_off', lang),
      );

      const statusText = newValue ? t('cb2.notif_enabled', lang) : t('cb2.notif_disabled', lang);
      const actionText = newValue ? t('cb2.notif_action_enabled', lang) : t('cb2.notif_action_disabled', lang);
      await ctx.editMessageText(
        t('cb2.notif_updated', lang, { status: statusText, action: actionText }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: newValue
                    ? t('cb2.turn_off_notif', lang)
                    : t('cb2.turn_on_notif', lang),
                  callback_data: "toggle_notifications",
                },
              ],
              [{ text: t('cb2.back_to_settings', lang), callback_data: "open_settings" }],
            ],
          },
        },
      );
      }
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

      {
      const lang = ctx.session?.userLang || 'id';
      const statusText = enabled ? t('cb2.notif_enabled', lang) : t('cb2.notif_disabled', lang);
      await ctx.editMessageText(
        t('cb2.autorenewal_title', lang, { status: statusText }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: enabled
                    ? t('cb2.disable_autorenewal', lang)
                    : t('cb2.enable_autorenewal', lang),
                  callback_data: "toggle_autorenewal",
                },
              ],
              [{ text: t('cb2.back_to_settings', lang), callback_data: "open_settings" }],
            ],
          },
        },
      );
      }
      return;
    }

    // Toggle auto-renewal
    if (data === "toggle_autorenewal") {
      const userId = ctx.from?.id;
      if (!userId) {
        const lang = ctx.session?.userLang || 'id';
        await ctx.answerCbQuery(t('misc.user_not_found_error', lang));
        return;
      }
      const user = await UserService.findByTelegramId(BigInt(userId));
      const newValue = !(user?.autoRenewal ?? false);
      await UserService.update(BigInt(userId), { autoRenewal: newValue });
      {
      const lang = ctx.session?.userLang || 'id';
      await ctx.answerCbQuery(
        newValue ? t('cb2.autorenewal_toggle_on', lang) : t('cb2.autorenewal_toggle_off', lang),
      );

      const statusText = newValue ? t('cb2.notif_enabled', lang) : t('cb2.notif_disabled', lang);
      const actionText = newValue ? t('cb2.notif_action_enabled', lang) : t('cb2.notif_action_disabled', lang);
      await ctx.editMessageText(
        t('cb2.autorenewal_updated', lang, { status: statusText, action: actionText }),
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: newValue
                    ? t('cb2.disable_autorenewal', lang)
                    : t('cb2.enable_autorenewal', lang),
                  callback_data: "toggle_autorenewal",
                },
              ],
              [{ text: t('cb2.back_to_settings', lang), callback_data: "open_settings" }],
            ],
          },
        },
      );
      }
      return;
    }

    // Open settings menu (back navigation target + "settings" alias from profile menu)
    if (data === "open_settings" || data === "settings") {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      const user = userId
        ? await UserService.findByTelegramId(BigInt(userId))
        : null;
      const uiLang = ctx.session?.userLang || user?.language || 'id';
      const langDisplay = getLangConfig(user?.language || 'id').label;
      const notif = user?.notificationsEnabled ? t('cb2.notif_enabled', uiLang) : t('cb2.notif_disabled', uiLang);
      const autoRenew = user?.autoRenewal ? t('cb2.notif_enabled', uiLang) : t('cb2.notif_disabled', uiLang);

      const settingsText = t('cb2.settings_title', uiLang, { lang: langDisplay, notif, autoRenew });
      const settingsMarkup = {
        inline_keyboard: [
          [{ text: t('cb2.settings_lang_btn', uiLang), callback_data: "settings_language" }],
          [{ text: t('cb2.settings_notif_btn', uiLang), callback_data: "settings_notifications" }],
          [{ text: t('cb2.settings_autorenewal_btn', uiLang), callback_data: "settings_autorenewal" }],
          [{ text: t('cb2.back_to_menu', uiLang), callback_data: "main_menu" }],
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

        const lang = ctx.session?.userLang || 'id';
        if (transactions.length === 0) {
          await ctx.editMessageText(
            t('cb2.tx_history_empty', lang),
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: t('cb2.topup_now', lang), callback_data: "topup" }],
                  [{ text: t('cb2.back_to_menu', lang), callback_data: "main_menu" }],
                ],
              },
            },
          );
          return;
        }

        let message = t('cb2.tx_history_title', lang) + "\n\n";
        message += t('cb2.tx_history_recent', lang) + "\n\n";

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
              [{ text: t('cb2.back_to_menu', lang), callback_data: "main_menu" }],
            ],
          },
        });
      } catch (error) {
        logger.error("Transaction history error:", error);
        const lang2 = ctx.session?.userLang || 'id';
        await ctx.editMessageText(
          t('cb2.tx_history_failed', lang2),
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: t('cb2.back_to_menu', lang2), callback_data: "main_menu" }],
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
      const lang = ctx.session?.userLang || 'id';
      const extractedPrompt = ctx.session?.stateData?.extractedPrompt as
        | string
        | undefined;

      if (extractedPrompt) {
        await ctx.reply(
          `${t('cb2.copy_prompt_title', lang)}\n\n\`\`\`\n${extractedPrompt}\n\`\`\`\n\n${t('cb2.copy_prompt_hint', lang)}`,
          { parse_mode: "Markdown" },
        );
      } else {
        await ctx.reply(
          t('cb2.copy_prompt_not_found', lang),
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
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(
        t('cb2.connect_new_account_title', lang),
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
              [{ text: t('btn.back', lang), callback_data: "manage_accounts" }],
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
          const lang = ctx.session?.userLang || 'id';
          await ctx.reply(t('error.user_not_found', lang));
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

        {
        const lang = ctx.session?.userLang || 'id';
        await ctx.editMessageText(
          t('cb2.referral_stats', lang, {
            referralCount,
            referralTier: user.referralTier,
            totalCommission: totalCommission.toLocaleString("id-ID"),
            availableCommission: availableCommission.toLocaleString("id-ID"),
            withdrawnCommission: withdrawnCommission.toLocaleString("id-ID"),
            referralCode: user.referralCode || "N/A",
          }),
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: t('cb2.withdraw_btn', lang), callback_data: "referral_withdraw" }],
                [
                  {
                    text: t('btn.back', lang),
                    callback_data: "open_referral",
                  },
                ],
              ],
            },
          },
        );
        }
      } catch (error) {
        logger.error("Referral stats error:", error);
        await ctx.reply(
          t('cb.referral_stats_error', ctx.session?.userLang || 'id'),
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

        const lang = ctx.session?.userLang || 'id';
        let message = t('cb2.withdraw_title', lang) + "\n\n";
        message += t('cb2.withdraw_balance', lang, { available: available.toLocaleString("id-ID") }) + "\n\n";

        if (available <= 0) {
          message += t('cb2.withdraw_no_commission', lang);
        } else {
          message += t('cb2.withdraw_options', lang, {
            creditsCanConvert,
            sellRate: SELL_RATE.toLocaleString("id-ID"),
            cashoutHalf: (available / 2).toLocaleString("id-ID"),
          });
        }

        const buttons: any[][] = [];
        if (creditsCanConvert > 0) {
          buttons.push([{ text: t('cb2.convert_to_credits_btn', lang, { credits: creditsCanConvert }), callback_data: "referral_convert_credits" }]);
          buttons.push([{ text: t('cb2.sell_to_admin_btn', lang, { amount: (available / 2).toLocaleString("id-ID") }), callback_data: "referral_sell_admin" }]);
        }
        buttons.push([{ text: t('cb2.view_stats', lang), callback_data: "referral_stats" }]);
        buttons.push([{ text: t('btn.back', lang), callback_data: "open_referral" }]);

        await ctx.editMessageText(message, {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: buttons },
        });
      } catch (error) {
        logger.error("Referral withdraw error:", error);
        const lang = ctx.session?.userLang || 'id';
        await ctx.reply(t('referral.withdraw_load_failed', lang));
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

        // Execute conversion atomically — read SELL_RATE and balance INSIDE transaction to prevent race condition
        const result = await prisma.$transaction(async (tx) => {
          const sellRateStr = await PaymentSettingsService.get('referral_sell_rate');
          const SELL_RATE = sellRateStr ? parseInt(sellRateStr) : 3000;

          const availableAgg = await tx.commission.aggregate({
            where: { referrerId: telegramId, status: "available" },
            _sum: { amount: true },
          });
          const available = Number(availableAgg._sum.amount || 0);
          const creditsToAdd = Math.floor(available / SELL_RATE);

          if (creditsToAdd <= 0) return { creditsToAdd: 0, available: 0 };

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
          return { creditsToAdd, available };
        });

        const { creditsToAdd, available } = result;
        if (creditsToAdd <= 0) {
          const lang = ctx.session?.userLang || 'id';
          await ctx.editMessageText(t('referral.insufficient_convert', lang), {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: [[{ text: t('btn.back', ctx.session?.userLang || 'id'), callback_data: "referral_withdraw" }]] },
          });
          return;
        }

        {
        const lang = ctx.session?.userLang || 'id';
        await ctx.editMessageText(
          t('cb2.conversion_success', lang, { available: available.toLocaleString("id-ID"), credits: creditsToAdd }),
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: t('cb2.create_video_btn', lang), callback_data: "create_video_new" }],
                [{ text: t('cb2.main_menu', lang), callback_data: "main_menu" }],
              ],
            },
          },
        );
        }
      } catch (error) {
        logger.error("Referral convert credits error:", error);
        const lang = ctx.session?.userLang || 'id';
        await ctx.reply(t('referral.convert_failed', lang));
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
          const lang = ctx.session?.userLang || 'id';
          await ctx.editMessageText(t('referral.insufficient_sell', lang), {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: [[{ text: t('btn.back', ctx.session?.userLang || 'id'), callback_data: "referral_withdraw" }]] },
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
        const userName = user?.firstName || user?.username || String(telegramId);
        for (const adminId of adminIds) {
          try {
            await ctx.telegram.sendMessage(
              adminId.trim(),
              t('cb2.cashout_admin_notify', 'id', {
                userName,
                telegramId: String(telegramId),
                available: available.toLocaleString("id-ID"),
                cashoutAmount: cashoutAmount.toLocaleString("id-ID"),
              }),
              { parse_mode: "Markdown" },
            );
          } catch { /* admin unreachable */ }
        }

        const lang = ctx.session?.userLang || 'id';
        await ctx.editMessageText(
          t('cb2.cashout_sent', lang, {
            available: available.toLocaleString("id-ID"),
            cashoutAmount: cashoutAmount.toLocaleString("id-ID"),
          }),
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: t('cb2.view_stats', lang), callback_data: "referral_stats" }],
                [{ text: t('cb2.main_menu', lang), callback_data: "main_menu" }],
              ],
            },
          },
        );
      } catch (error) {
        logger.error("Referral sell admin error:", error);
        const lang = ctx.session?.userLang || 'id';
        await ctx.reply(t('referral.cashout_failed', lang));
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
        const lang = ctx.session?.userLang || 'id';
        await ctx.reply(t('error.no_session', lang));
        return;
      }

      const uploadedPhotos = ctx.session.videoCreation.uploadedPhotos || [];
      if (uploadedPhotos.length === 0) {
        await ctx.reply(
          t('cb2.no_photos_yet', ctx.session?.userLang || 'id'),
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
        t('cb2.add_more_photos', ctx.session?.userLang || 'id', { remaining }),
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
        t('cb2.contact_support', ctx.session?.userLang || 'id'),
        { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[btnBackMain(ctx.session?.userLang || 'id')]] } },
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
      {
      const lang = ctx.session?.userLang || 'id';
      await ctx.reply(
        t('cb2.notif_unsubscribed', lang),
        { reply_markup: { inline_keyboard: [[{ text: t('btn.settings', lang), callback_data: "open_settings" }]] } },
      );
      }
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
        t('cb2.edit_scene', ctx.session?.userLang || 'id', { sceneNum }),
        { parse_mode: "Markdown" },
      );
      return;
    }

    // Unknown callback
    logger.warn("Unknown callback:", data);
    const lang = ctx.session?.userLang || 'id';
    await ctx.answerCbQuery(t('cb.unknown_action', lang));
  } catch (error) {
    logger.error("Error in callback handler:", error);
    const lang = ctx.session?.userLang || 'id';
    // Reset state to DASHBOARD so user doesn't get stuck
    if (ctx.session) {
      ctx.session.state = 'DASHBOARD';
      ctx.session.stateData = {};
    }
    try {
      await ctx.answerCbQuery(t('error.generic', lang));
    } catch { /* answer may have already been sent */ }
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
    const lang = ctx.session?.userLang || 'id';
    await ctx.answerCbQuery(t('videos.not_found', lang));
    return;
  }

  if (video.userId !== BigInt(userId)) {
    const lang = ctx.session?.userLang || 'id';
    await ctx.answerCbQuery(t('cb.access_denied', lang));
    return;
  }

  // Check if user has connected accounts
  const hasAccounts = await PostAutomationService.hasConnectedAccounts(
    BigInt(userId),
  );

  const lang = ctx.session?.userLang || 'id';
  if (!hasAccounts) {
    await ctx.editMessageText(
      t('cb2.publish_no_accounts', lang),
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: t('cb2.connect_accounts_btn', lang), callback_data: "manage_accounts" }],
            [{ text: t('btn.cancel', lang), callback_data: "videos_list" }],
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
    { text: t('cb2.publish_now_btn', lang), callback_data: `confirm_publish_${jobId}` },
  ]);
  keyboard.push([{ text: t('btn.cancel', lang), callback_data: "videos_list" }]);

  await ctx.editMessageText(
    t('cb2.publish_select_platform', lang),
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
    const lang = ctx.session?.userLang || 'id';
    await ctx.answerCbQuery(t('cb.select_platform', lang));
    return;
  }

  const lang2 = ctx.session?.userLang || 'id';
  await ctx.editMessageText(
    t('cb2.publish_ready', lang2, { count: selectedCount }),
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: t('cb2.publish_now_btn', lang2),
              callback_data: `confirm_publish_${jobId}`,
            },
          ],
          [{ text: t('btn.cancel', lang2), callback_data: "videos_list" }],
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

  const lang = ctx.session?.userLang || 'id';
  await ctx.editMessageText(
    t('cb2.publishing_progress', lang),
    { parse_mode: "Markdown" },
  );

  try {
    // Get video
    const video = await VideoService.getByJobId(jobId);
    if (!video || !video.videoUrl) {
      throw new Error("Video not found");
    }

    if (video.userId !== BigInt(userId)) {
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(t('cb.access_denied', lang));
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
          [{ text: t('cb2.my_videos', lang), callback_data: "videos_list" }],
          [{ text: t('cb2.create_video_again', lang), callback_data: "back_prompts" }],
        ],
      },
    });
  } catch (error: any) {
    logger.error("Publish failed:", error);
    await ctx.editMessageText(
      t('cb.publish_failed', ctx.session?.userLang || 'id'),
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: t('btn.try_again', ctx.session?.userLang || 'id'), callback_data: `publish_video_${jobId}` }],
            [{ text: t('btn.cancel', ctx.session?.userLang || 'id'), callback_data: "videos_list" }],
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
  const lang = ctx.session?.userLang || 'id';
  await ctx.answerCbQuery(t('cb.publishing', lang));

  try {
    // Get video details
    const video = await VideoService.getByJobId(jobId);
    if (!video || !video.videoUrl) {
      await ctx.reply(t('cb.video_not_found_url', lang));
      return;
    }

    if (video.userId !== BigInt(userId)) {
      await ctx.reply(t('cb.access_denied', lang));
      return;
    }

    // Get ALL connected accounts for this user
    const accounts = await PostAutomationService.getUserAccounts(
      BigInt(userId),
    );
    if (accounts.length === 0) {
      await ctx.reply(
        t('cb2.no_connected_accounts', lang),
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: t('cb2.connect_accounts_btn', lang),
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
      t('cb2.auto_posting', lang, { count: accounts.length, platforms: platformNames }),
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
          [{ text: t('cb2.create_video_again', lang), callback_data: "back_prompts" }],
          [{ text: t('cb2.my_videos', lang), callback_data: "videos_list" }],
        ],
      },
    });
  } catch (error: any) {
    logger.error("Auto-post failed:", error);
    await ctx.reply(
      t('cb2.auto_post_failed', lang, { error: error.message }),
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: t('cb2.publish_manually_btn', lang),
                callback_data: `publish_video_${jobId}`,
              },
            ],
            [{ text: t('cb2.my_videos', lang), callback_data: "videos_list" }],
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

  const lang = ctx.session?.userLang || 'id';
  if (accounts.length === 0) {
    await ctx.editMessageText(
      t('cb2.connect_social_empty', lang),
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
            [{ text: t('btn.cancel', lang), callback_data: "main_menu" }],
          ],
        },
      },
    );
    return;
  }

  // Show connected accounts
  let message = t('cb2.connected_accounts_title', lang) + "\n\n";
  const keyboard: any[][] = [];

  accounts.forEach((acc) => {
    const emoji = getPlatformEmoji(acc.platform);
    message += `${emoji} ${acc.platform.toUpperCase()}: ${acc.username}\n`;
    keyboard.push([
      {
        text: t('cb2.disconnect_btn', lang, { platform: acc.platform, username: acc.username }),
        callback_data: `disconnect_account_${acc.id}`,
      },
    ]);
  });

  message += t('cb2.connect_more', lang);
  keyboard.push([
    { text: t('cb2.connect_new_btn', lang), callback_data: "connect_account_new" },
  ]);
  keyboard.push([{ text: t('btn.back', lang), callback_data: "main_menu" }]);

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
  const lang = ctx.session?.userLang || 'id';
  await ctx.editMessageText(
    t('cb2.connect_platform', lang, { platform: platform.toUpperCase() }),
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: t('cb2.open_postbridge', lang),
              url: "https://post-bridge.com/dashboard",
            },
          ],
          [{ text: t('btn.back', lang), callback_data: "manage_accounts" }],
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

  const lang = ctx.session?.userLang || 'id';
  await ctx.answerCbQuery(t('cb.account_disconnected', lang));

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

    const lang = ctx.session?.userLang || 'id';
    await ctx.editMessageText(
      t('cb2.image_generating', lang, {
        category: categoryNames[category] || category,
        prompt: existingClonePrompt.slice(0, 200) + (existingClonePrompt.length > 200 ? "..." : ""),
      }),
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
          const imgCreditCost = await getImageCreditCostAsync(result.provider);
          await UserService.deductCredits(telegramId, imgCreditCost);
          try {
            await telegramClient.sendPhoto(chatId, result.imageUrl, {
              caption: t('cb2.image_success', lang, { prompt: existingClonePrompt.slice(0, 100) + (existingClonePrompt.length > 100 ? "..." : "") }),
              parse_mode: "Markdown",
            });
          } catch (sendErr) {
            logger.error('sendPhoto failed after credit deduction, refunding:', sendErr);
            await UserService.refundCredits(telegramId, imgCreditCost, 'clone-img', 'sendPhoto failed')
              .catch((refundErr) => logger.error('CRITICAL: image refund failed', { telegramId: telegramId.toString(), err: refundErr }));
            await telegramClient.sendMessage(chatId, t('cb2.image_send_failed', lang));
          }
        } else {
          await telegramClient.sendMessage(chatId, t('cb2.image_gen_failed', lang) + (result.error ? `\n\n${result.error}` : ""));
        }
      } catch (err) {
        logger.error("useClonePrompt generation error", err);
        await telegramClient.sendMessage(chatId, t('cb2.image_gen_error', lang));
      }
    })();

    return;
  }

  // Build reference image options
  const telegramId = BigInt(ctx.from!.id);
  const lang = ctx.session?.userLang || 'id';
  const avatars = await AvatarService.listAvatars(telegramId);
  const creditCost = await getImageCreditCostAsync();

  const avatarButtons = avatars.slice(0, 3).map((a) => ({
    text: `👤 ${a.isDefault ? "⭐ " : ""}${a.name}`,
    callback_data: `imgref_avatar_${a.id}`,
  }));

  await ctx.editMessageText(
    t('cb.image_gen_header', lang, { category: categoryNames[category], cost: String(creditCost) }),
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: t('cb.btn_upload_ref', lang),
              callback_data: "imgref_upload",
            },
          ],
          ...(avatarButtons.length > 0 ? [avatarButtons] : []),
          [
            {
              text: t('cb.btn_describe_only', lang),
              callback_data: "imgref_skip",
            },
          ],
          [btnBackMain(lang)],
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
