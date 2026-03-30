/**
 * Message Handler
 *
 * Handles all incoming messages
 */

import { handleDisassemble, handleVideoCreationImage, handleSkipImageReference } from "./messages/video-uploader";
export { handleDisassemble, handleVideoCreationImage, handleSkipImageReference };
import { BotContext } from "@/types";
import { logger } from "@/utils/logger";
import { videosCommand } from "@/commands/videos";
import { topupCommand } from "@/commands/topup";
import { profileCommand } from "@/commands/profile";
import { referralCommand } from "@/commands/referral";
import { subscriptionCommand } from "@/commands/subscription";
import { settingsCommand } from "@/commands/settings";
import { supportCommand } from "@/commands/support";
import { helpCommand } from "@/commands/help";
import { showMainMenu } from "@/menus/main";
import { UserService } from "@/services/user.service";
import { MetricsService } from "@/services/metrics.service";
import {
  ImageGenerationService,
  ImageGenerationMode,
} from "@/services/image.service";
import { AvatarService } from "@/services/avatar.service";
import { ContentAnalysisService } from "@/services/content-analysis.service";
import { PostAutomationService } from "@/services/postautomation.service";
import { generateStoryboard } from "@/services/video-generation.service";
import { getVideoCreditCost, getImageCreditCostAsync } from "@/config/pricing";
import { canUseDailyFree, canUseWelcomeBonus, getNextDailyFreeReset } from "@/config/free-trial";
import { prisma } from "@/config/database";
import {
  promptsCommand,
  dailyCommand,
  trendingCommand,
  fingerprintCommand,
} from "@/commands/prompts";
import { getOmniRouteService } from "@/services/omniroute.service";
import { sendVilonaLoading } from "@/services/vilona-animation.service";
import { SavedPromptService } from "@/services/saved-prompt.service";
import { PROMPT_LIBRARY as _PL } from "@/commands/prompts";
import { actionableError } from "@/utils/errors";

/**
 * Handle disassemble — extract prompt from user's uploaded media
 */






/**
 * Handle incoming messages
 */
export async function messageHandler(ctx: BotContext): Promise<void> {
  try {
    const message = ctx.message;

    if (!message) {
      return;
    }

    // Log message
    logger.debug("Received message:", {
      userId: ctx.from?.id,
      chatId: ctx.chat?.id,
      text: "text" in message ? message.text : "[non-text]",
    });

    if ("text" in message && message.text?.startsWith("/")) {
      return;
    }

    // Handle /skip for video creation (must be before switch)
    if (
      "text" in message &&
      message.text === "/skip" &&
      ctx.session?.videoCreation?.waitingForImage
    ) {
      await handleSkipImageReference(ctx);
      return;
    }

    // ── V3 FLOW: CUSTOM DURATION INPUT ─────────────────────────────────────
    if (ctx.session?.state === 'CUSTOM_DURATION_INPUT_V3' && 'text' in message) {
      const input = message.text.trim();
      const duration = parseInt(input);

      if (isNaN(duration) || duration < 6 || duration > 3600) {
        await ctx.reply('❌ Durasi harus antara 6 - 3600 detik.\n\nContoh: `120` untuk 2 menit, `3600` untuk 1 jam.', { parse_mode: 'Markdown' });
        return;
      }

      const { buildCustomPresetConfig } = await import('../config/hpas-engine.js');
      const presetConfig = buildCustomPresetConfig(duration);

      if (ctx.session) {
        ctx.session.generatePreset = 'custom';
        ctx.session.customPresetConfig = presetConfig;
        ctx.session.state = 'DASHBOARD';
      }

      const minutes = Math.floor(duration / 60);
      const secs = duration % 60;
      const durLabel = minutes > 0 ? `${minutes} menit${secs > 0 ? ` ${secs} detik` : ''}` : `${secs} detik`;

      await ctx.reply(
        `✅ *Custom Duration: ${durLabel}*\n\n` +
        `🎬 ${presetConfig.scenesIncluded.length} scene\n` +
        `💰 Biaya: ${presetConfig.creditCost} unit\n\n` +
        `Pilih platform tujuan:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎵 TikTok (9:16)', callback_data: 'platform_tiktok' }],
              [{ text: '📸 Instagram (9:16)', callback_data: 'platform_instagram' }],
              [{ text: '▶️ YouTube (16:9)', callback_data: 'platform_youtube' }],
              [{ text: '⬛ Square (1:1)', callback_data: 'platform_square' }],
              [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
            ],
          },
        },
      );
      return;
    }

    // ── V3 FLOW: AWAITING PRODUCT INPUT (photo or text) ───────────────────
    if (ctx.session?.state === 'AWAITING_PRODUCT_INPUT') {
      const { handleProductInput } = await import('../flows/generate.js');
      await handleProductInput(ctx, message);
      return;
    }

    // ── NEW VIDEO CREATION FLOW HANDLERS ──────────────────────────────────
    // Handle VIDEO_CREATE_UPLOAD (photo upload for new flow)
    if (ctx.session?.state === "VIDEO_CREATE_UPLOAD" && "photo" in message) {
      const photo = message.photo[message.photo.length - 1];
      const fileId = photo.file_id;

      if (!ctx.session.videoCreationNew) {
        ctx.session.videoCreationNew = {
          step: 2,
          source: "photo",
          contentType: null,
          theme: null,
          vibe: null,
          sceneCount: null,
          template: null,
        };
      }

      if (!ctx.session.videoCreationNew.uploadedPhotos) {
        ctx.session.videoCreationNew.uploadedPhotos = [];
      }
      ctx.session.videoCreationNew.uploadedPhotos.push({ fileId });

      await ctx.reply(`✅ Foto diterima!\n\n` + `Lanjut ke step berikutnya?`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "➡️ Lanjut", callback_data: "vcreate_photo_next" }],
            [
              {
                text: "📸 Upload Foto Lain",
                callback_data: "vcreate_photo_more",
              },
            ],
            [{ text: "❌ Batal", callback_data: "main_menu" }],
          ],
        },
      });
      return;
    }

    // Handle VIDEO_CREATE_TEXT (text input for new flow)
    if (ctx.session?.state === "VIDEO_CREATE_TEXT" && "text" in message) {
      const textInput = message.text;

      if (!ctx.session.videoCreationNew) {
        ctx.session.videoCreationNew = {
          step: 2,
          source: "text",
          contentType: null,
          theme: null,
          vibe: null,
          sceneCount: null,
          template: null,
        };
      }

      ctx.session.videoCreationNew.textInput = textInput;

      // Redirect to V3 flow
      const { showGenerateMode } = await import("../flows/generate.js");
      await showGenerateMode(ctx);
      return;
    }

    // ── END NEW VIDEO CREATION FLOW HANDLERS ──────────────────────────────

    // Handle custom duration input (must be before switch to catch numeric input)
    if (ctx.session?.state === "CUSTOM_DURATION_INPUT" && "text" in message) {
      const durationInput = message.text.trim();
      const duration = parseInt(durationInput);

      if (isNaN(duration) || duration < 6 || duration > 300) {
        await ctx.reply("❌ Please enter a valid duration (6-300 seconds)");
        return;
      }

      const SCENE_DURATION = 5;
      const bestFit = {
        scenes: Math.ceil(duration / SCENE_DURATION),
        durationPerScene: SCENE_DURATION,
      };

      const finalDuration = bestFit.scenes * bestFit.durationPerScene;
      const niche = ctx.session.selectedNiche || "fnb";
      const platform = String(ctx.session.selectedPlatforms?.[0] || "tiktok");
      const creditCost = getVideoCreditCost(finalDuration);
      const telegramId = BigInt(ctx.from!.id);

      const user = await UserService.findByTelegramId(telegramId);
      if (!user || Number(user.creditBalance) < creditCost) {
        await ctx.reply(
          `❌ Not enough credits. Need ${creditCost}, have ${user?.creditBalance || 0}. Use /topup`,
        );
        ctx.session.state = "DASHBOARD";
        return;
      }

      const styles = ctx.session.selectedStyles || [];
      ctx.session.state = "DASHBOARD";

      await ctx.reply(
        `🎬 **Almost Ready!**\n\n` +
        `Requested: ${duration}s → Optimized: ${finalDuration}s (${bestFit.scenes} × ${bestFit.durationPerScene}s)\n` +
        `💰 Credit cost: ${creditCost}\n\n` +
        `📸 **Send a reference image** for your video,\n` +
        `or type /skip to let AI generate everything.`,
        { parse_mode: "Markdown" },
      );

      ctx.session.videoCreation = {
        mode: bestFit.scenes > 1 ? "extended" : "short",
        niche,
        platform,
        totalDuration: finalDuration,
        scenes: bestFit.scenes,
        storyboard: generateStoryboard(
          niche,
          styles,
          finalDuration,
          bestFit.scenes,
        ),
        jobId: "",
        waitingForImage: true,
        enableVO: true,
        enableSubtitles: true,
      };
      return;
    }

    // Handle add-to-library custom prompt input (CUSTOM_PROMPT_CREATION state)
    if (
      ctx.session?.state === "CUSTOM_PROMPT_CREATION" &&
      ctx.session?.stateData?.addingPromptNiche &&
      "text" in message
    ) {
      const promptText = message.text.trim();
      const nicheKey = ctx.session.stateData.addingPromptNiche as string;
      if (promptText.length < 10) {
        await ctx.reply(
          "⚠️ Prompt terlalu pendek. Minimal 10 kata. Coba lagi atau tap /start untuk batal.",
        );
        return;
      }
      try {
        const dbUser = await UserService.findByTelegramId(BigInt(ctx.from!.id));
        if (dbUser) {
          // Auto-generate title from first 5 words
          const title = promptText.split(" ").slice(0, 5).join(" ");
          await SavedPromptService.save(dbUser.id as unknown as bigint, {
            title: title.length > 50 ? title.slice(0, 50) + "..." : title,
            prompt: promptText,
            niche: nicheKey,
            source: "custom",
          });
          ctx.session.state = "DASHBOARD";
          ctx.session.stateData = {
            ...ctx.session.stateData,
            addingPromptNiche: undefined,
          };
          const niche = _PL[nicheKey];
          await ctx.reply(
            `✅ *Prompt tersimpan ke ${niche?.emoji || ""} ${niche?.label || nicheKey}!*\n\n` +
            `\`${promptText.slice(0, 150)}${promptText.length > 150 ? "..." : ""}\`\n\n` +
            `Mau langsung pakai prompt ini?`,
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🚀 Buat Video Sekarang!",
                      callback_data: "create_video_new",
                    },
                  ],
                  [
                    {
                      text: `📌 Lihat Prompt Tersimpan`,
                      callback_data: `my_prompts_${nicheKey}`,
                    },
                  ],
                  [{ text: "◀️ Menu Utama", callback_data: "main_menu" }],
                ],
              },
            },
          );
          // Pre-fill session
          ctx.session.stateData = {
            ...ctx.session.stateData,
            selectedPrompt: promptText,
          };
        }
      } catch (err) {
        await ctx.reply("❌ Gagal menyimpan prompt. Coba lagi.");
      }
      return;
    }

    // Handle custom prompt text input
    if (
      ctx.session?.state === "CUSTOM_PROMPT_INPUT" &&
      ctx.session?.videoCreation?.waitingForCustomPrompt &&
      "text" in message
    ) {
      const promptText = message.text.trim();
      if (!promptText) {
        await ctx.reply("Please enter a prompt or use /create to start over.");
        return;
      }

      ctx.session.videoCreation.customPrompt = promptText;
      ctx.session.videoCreation.waitingForCustomPrompt = false;
      ctx.session.state = "DASHBOARD";

      // Proceed to reference image step
      ctx.session.videoCreation.waitingForImage = true;
      await ctx.reply(
        `✅ Custom prompt saved!\n\n` +
        `📸 Now send a reference image for your video, or type /skip to let AI generate everything.`,
        { parse_mode: "Markdown" },
      );
      return;
    }

    // Handle social account connection (WAITING_ACCOUNT_ID state)
    if (ctx.session?.state === "WAITING_ACCOUNT_ID" && "text" in message) {
      const accountId = message.text.trim();
      const platform = ctx.session.connectingPlatform || "unknown";
      const telegramId = BigInt(ctx.from!.id);

      if (!accountId || accountId.startsWith("/")) {
        await ctx.reply("❌ Please enter a valid PostBridge Account ID.");
        return;
      }

      try {
        await PostAutomationService.connectAccount(
          telegramId,
          platform,
          accountId,
        );

        await ctx.reply(
          `✅ *Account Connected!*\n\n` +
          `Platform: ${platform.toUpperCase()}\n` +
          `Account ID: \`${accountId}\`\n\n` +
          `You can now publish videos to this account.`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔗 Manage Accounts",
                    callback_data: "manage_accounts",
                  },
                ],
                [{ text: "🎬 Create Video", callback_data: "create_video_new" }],
              ],
            },
          },
        );
      } catch (error: any) {
        logger.error("Failed to connect account:", error);
        await ctx.reply(
          `❌ Failed to connect account.\n\n` +
          `Error: ${error.message || "Unknown error"}\n\n` +
          `Please try again or contact support.`,
        );
      }

      ctx.session.state = "DASHBOARD";
      ctx.session.connectingPlatform = undefined;
      return;
    }

    // Handle text messages
    if ("text" in message) {
      const text = message.text;

      // Check for active workflow states FIRST — before routing to menu/AI chat
      // This ensures prompts typed during image/video creation are captured correctly
      if (ctx.session?.state === "IMAGE_GENERATION_WAITING") {
        // Will be handled by the IMAGE_GENERATION_WAITING handler below
      } else if (ctx.session?.state === "CLONE_EDIT_DESC_WAITING") {
        // Will be handled by the CLONE_EDIT_DESC_WAITING handler below
      } else if (ctx.session?.state === "VIDEO_CREATE_TEXT") {
        // Will be handled by the VIDEO_CREATE_TEXT handler below
      } else if (ctx.session?.state === "CUSTOM_PROMPT_CREATION") {
        // Will be handled by the CUSTOM_PROMPT_CREATION handler below
      } else if (ctx.session?.state === "CUSTOM_PROMPT_INPUT") {
        // Will be handled by the CUSTOM_PROMPT_INPUT handler below
      } else if (ctx.session?.state === "WAITING_ACCOUNT_ID") {
        // Will be handled by the WAITING_ACCOUNT_ID handler below
      } else {
        // Handle reply keyboard buttons — route to proper command handlers
        switch (text) {
          case "🎬 Create Video":
          case "🚀 Get Started": {
            const { showGenerateMode } = await import('../flows/generate.js');
            await showGenerateMode(ctx);
            return;
          }

          case "🖼️ Generate Image":
            await ctx.reply("🖼️ *Image Generation*\n\n" + "Select workflow:", {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "🛍️ Product Photo", callback_data: "img_product" }],
                  [{ text: "🍔 F&B Food", callback_data: "img_fnb" }],
                  [{ text: "🏠 Real Estate", callback_data: "img_realestate" }],
                  [{ text: "🚗 Car/Automotive", callback_data: "img_car" }],
                ],
              },
            });
            return;

          case "💬 Chat AI":
            await ctx.reply(
              "💬 *AI Assistant aktif!*\n\n" +
              "Langsung ketik pertanyaan kamu sekarang.\n\n" +
              "*Contoh yang bisa kamu tanya:*\n" +
              '• _"Bikinin prompt untuk bakso saya"_\n' +
              '• _"Tips video TikTok F\\&B yang viral"_\n' +
              '• _"Niche apa yang paling cuan?"_\n\n' +
              "Atau ketik /prompts untuk template siap pakai 📚",
              { parse_mode: "MarkdownV2" },
            );
            if (ctx.session) ctx.session.state = "DASHBOARD";
            return;

          case "📁 My Videos":
            await videosCommand(ctx);
            return;

          case "💰 Top Up":
            await topupCommand(ctx);
            return;

          case "⭐ Subscription":
            await subscriptionCommand(ctx);
            return;

          case "👤 Profile":
            await profileCommand(ctx);
            return;

          case "👥 Referral":
            await referralCommand(ctx);
            return;

          case "⚙️ Settings":
            await settingsCommand(ctx);
            return;

          case "🆘 Support":
            await supportCommand(ctx);
            return;

          // ── NEW: Prompt Library keyboard buttons ──────────────────────────
          case "📚 Prompt Library":
            await promptsCommand(ctx);
            return;

          case "🔥 Trending":
            await trendingCommand(ctx);
            return;

          case "🎁 Daily Prompt":
            await dailyCommand(ctx);
            return;

          case "🧬 Fingerprint":
            await fingerprintCommand(ctx);
            return;

          case "📖 Help":
            await helpCommand(ctx);
            return;

          default: {
            // Natural language → route to AI chat assistant
            const trimmed = text.trim();
            if (trimmed.length > 2 && !trimmed.startsWith("/")) {
              const omni = getOmniRouteService();
              const userId = String(ctx.from?.id || "unknown");
              try {
                const loadingId = await sendVilonaLoading(ctx, "thinking");
                const result = await omni.chat(userId, trimmed);
                if (loadingId) {
                  await ctx.telegram
                    .deleteMessage(ctx.chat!.id, loadingId)
                    .catch(() => { });
                }
                if (result.success && result.content) {
                  try {
                    await ctx.reply(result.content, { parse_mode: "Markdown" });
                  } catch {
                    await ctx.reply(result.content);
                  }
                  return;
                }
              } catch {
                /* fall through to menu */
              }
            }
            // Fallback: show main menu (inline keyboard V3)
            await showMainMenu(ctx);
          }
        }
      }
    }

    // Handle photo uploads
    if ("photo" in message) {
      if (ctx.session.state === "CREATE_VIDEO_UPLOAD") {
        await ctx.reply(
          "✅ Photo received!\n\n" + "Now, please select your niche:",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🍔 F&B", callback_data: "niche_fnb" },
                  { text: "💄 Beauty", callback_data: "niche_beauty" },
                ],
                [
                  { text: "🛍️ Retail", callback_data: "niche_retail" },
                  { text: "🔧 Services", callback_data: "niche_services" },
                ],
                [
                  {
                    text: "🏢 Professional",
                    callback_data: "niche_professional",
                  },
                  {
                    text: "🏨 Hospitality",
                    callback_data: "niche_hospitality",
                  },
                ],
              ],
            },
          },
        );
        ctx.session.state = "CREATE_VIDEO_NICHE";
        return;
      }
    }

    // Handle reference image upload for image generation (img2img)
    if (ctx.session.state === "IMAGE_REFERENCE_WAITING" && "photo" in message) {
      const photos = message.photo;
      const largestPhoto = photos[photos.length - 1];
      const fileLink = await ctx.telegram.getFileLink(largestPhoto.file_id);
      const referenceUrl = fileLink.toString();

      ctx.session.state = "IMAGE_GENERATION_WAITING";
      ctx.session.stateData = {
        ...ctx.session.stateData,
        referenceImageUrl: referenceUrl,
        mode: "img2img",
      };

      await ctx.reply(
        `📸 *Reference image received!*\n\n` +
        `Now describe what you want to generate:\n\n` +
        `_Example: "Product on marble table with soft studio lighting, marketing photo"_`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "❌ Cancel", callback_data: "image_generate" }],
            ],
          },
        },
      );
      return;
    }

    // Handle avatar photo upload
    if (ctx.session.state === "AVATAR_UPLOAD_WAITING" && "photo" in message) {
      const photos = message.photo;
      const largestPhoto = photos[photos.length - 1];
      const fileLink = await ctx.telegram.getFileLink(largestPhoto.file_id);
      const avatarUrl = fileLink.toString();

      ctx.session.state = "AVATAR_NAME_WAITING";
      ctx.session.stateData = { avatarImageUrl: avatarUrl };

      await ctx.reply(
        `📸 *Photo received!*\n\n` +
        `Give this avatar a name (e.g., "Sarah", "Product Model", "Brand Mascot"):`,
        { parse_mode: "Markdown" },
      );
      return;
    }

    // Handle avatar name input
    if (ctx.session.state === "AVATAR_NAME_WAITING" && "text" in message) {
      const name = message.text.slice(0, 64);
      const avatarUrl = ctx.session.stateData?.avatarImageUrl as string;

      if (!avatarUrl) {
        await ctx.reply("❌ Avatar image lost. Please start over.");
        ctx.session.state = "DASHBOARD";
        return;
      }

      await ctx.reply("⏳ *Analyzing avatar...*", { parse_mode: "Markdown" });

      try {
        const telegramId = BigInt(ctx.from!.id);
        const avatar = await AvatarService.createAvatar(
          telegramId,
          name,
          avatarUrl,
        );

        await ctx.reply(
          `✅ *Avatar "${avatar.name}" saved!*\n` +
          `${avatar.isDefault ? "⭐ Set as default avatar\n" : ""}\n` +
          `${avatar.description ? `_${avatar.description.slice(0, 200)}_\n\n` : ""}` +
          `You can now use this avatar when generating images to keep consistent characters.`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🖼️ Generate with Avatar",
                    callback_data: "image_generate",
                  },
                ],
                [{ text: "👤 Manage Avatars", callback_data: "avatar_manage" }],
                [{ text: "◀️ Back to Menu", callback_data: "main_menu" }],
              ],
            },
          },
        );
      } catch (error: any) {
        logger.error("Avatar creation failed:", error);
        await ctx.reply(
          `❌ *Failed to save avatar*\n\n${error.message || "Please try again."}`,
          { parse_mode: "Markdown" },
        );
      }

      ctx.session.state = "DASHBOARD";
      return;
    }

    // Handle image generation (text2img, img2img, or ip_adapter)
    if (ctx.session.state === "IMAGE_GENERATION_WAITING" && "text" in message) {
      const description = message.text;
      const category = ctx.session.stateData?.imageCategory as string;
      const referenceImageUrl = ctx.session.stateData?.referenceImageUrl as
        | string
        | undefined;
      const avatarImageUrl = ctx.session.stateData?.avatarImageUrl as
        | string
        | undefined;
      const mode =
        (ctx.session.stateData?.mode as ImageGenerationMode) || "text2img";

      const modeLabel =
        mode === "img2img"
          ? " (with reference)"
          : mode === "ip_adapter"
            ? " (with avatar)"
            : "";

      // Check credits before generating
      const estimatedCost = await getImageCreditCostAsync();
      const telegramIdImg = BigInt(ctx.from!.id);
      const userImg = await UserService.findByTelegramId(telegramIdImg);
      
      let useFreeSlot: 'daily' | 'welcome' | null = null;
      const isLibraryPrompt = ctx.session.stateData?.selectedPrompt === description;

      if (!userImg || Number(userImg.creditBalance) < estimatedCost) {
        // Check for free slots (Welcome or Daily)
        if (isLibraryPrompt && canUseDailyFree(userImg)) {
          useFreeSlot = 'daily';
        } else if (isLibraryPrompt && canUseWelcomeBonus(userImg)) {
          useFreeSlot = 'welcome';
        } else {
          const reason = !isLibraryPrompt 
            ? "Prompt custom hanya tersedia untuk pengguna Premium." 
            : "Kredit tidak cukup & Reward harian sudah habis.";
            
          await ctx.reply(
            `❌ *Gagal Memulai*\n\n` +
            `${reason}\n\n` +
            `Gunakan /topup untuk menambah kredit agar bisa menggunakan fitur custom dan video.`,
            { parse_mode: "Markdown" }
          );
          ctx.session.state = "DASHBOARD";
          return;
        }
      }

      await ctx.reply(
        `⏳ *Generating image${modeLabel}...*\n\n` +
        "This may take 30-60 seconds.",
        { parse_mode: "Markdown" },
      );

      try {
        const result = await ImageGenerationService.generateImage({
          prompt: description,
          category: category || "product",
          aspectRatio:
            category === "realestate" || category === "car"
              ? "16:9"
              : category === "fnb"
                ? "4:5"
                : "1:1",
          style:
            category === "fnb"
              ? "food photography"
              : category === "realestate"
                ? "architectural"
                : category === "car"
                  ? "automotive"
                  : "commercial",
          referenceImageUrl,
          avatarImageUrl,
          mode,
        });

        if (result.success && result.imageUrl) {
          const isDemo = result.provider === "demo";

          // Deduct credits or consume free slot
          if (useFreeSlot === 'daily') {
            await prisma.user.update({
              where: { telegramId: telegramIdImg },
              data: { dailyFreeUsed: true, dailyFreeResetAt: getNextDailyFreeReset() }
            });
            await MetricsService.increment('generation_trial_daily');
            logger.info(`🖼️ Used Daily Free slot for user ${telegramIdImg}`);
          } else if (useFreeSlot === 'welcome') {
            await prisma.user.update({
              where: { telegramId: telegramIdImg },
              data: { welcomeBonusUsed: true }
            });
            await MetricsService.increment('generation_trial_welcome');
            logger.info(`🖼️ Used Welcome Bonus slot for user ${telegramIdImg}`);
          } else if (!isDemo) {
            const actualCost = await getImageCreditCostAsync(result.provider);
            await UserService.deductCredits(telegramIdImg, actualCost);
            logger.info(
              `🖼️ Charged ${actualCost} credits for image (provider: ${result.provider})`,
            );
          }

          const modeInfo =
            result.mode === "img2img"
              ? "\n📸 _Generated with your reference image_"
              : result.mode === "ip_adapter"
                ? "\n👤 _Generated with avatar consistency_"
                : "";

          const caption = isDemo
            ? `🖼️ *Sample Image (Demo)*\n\n` +
            `_Description: ${description}_\n\n` +
            `⚠️ This is a placeholder image. AI generation is temporarily unavailable.\n` +
            `The actual product will generate images matching your description.`
            : `✅ *Gambar Berhasil Dibuat!*\n\n` +
            `_Deskripsi: ${description}_${modeInfo}\n\n` +
            `Mau lanjut apa?`;

          let photoSource: string | { source: Buffer };
          let isBase64 = false;
          if (result.imageUrl!.startsWith("data:")) {
            const base64Data = result.imageUrl!.split(",")[1];
            photoSource = { source: Buffer.from(base64Data, "base64") };
            isBase64 = true;
          } else {
            photoSource = result.imageUrl!;
          }

          await ctx.replyWithPhoto(photoSource, {
            caption,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                ...(isDemo || isBase64
                  ? []
                  : [[{ text: "⬇️ Download", url: result.imageUrl! }]]),
                [
                  {
                    text: "🔄 Buat Variasi Lain",
                    callback_data: "image_generate",
                  },
                  { text: "🎬 Jadikan Video", callback_data: "create_video_new" },
                ],
                [{ text: "◀️ Menu Utama", callback_data: "main_menu" }],
              ],
            },
          });
        } else {
          await ctx.reply(
            `❌ *Generate Gagal*\n\n` +
            `${result.error || "Unknown error"}\n\n` +
            `Coba lagi dengan deskripsi yang berbeda.`,
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "🔄 Coba Lagi", callback_data: "image_generate" }],
                ],
              },
            },
          );
        }
      } catch (error: any) {
        logger.error("Image generation error:", error);
        await ctx.reply("❌ Failed to generate image. Please try again.", {
          parse_mode: "Markdown",
        });
      }

      ctx.session.state = "DASHBOARD";
      return;
    }

    // Handle clone video
    if (ctx.session.state === "CLONE_VIDEO_WAITING") {
      let videoUrl: string | undefined;

      if ("text" in message) {
        videoUrl = message.text;
      } else if ("video" in message) {
        const fileId = message.video.file_id;
        videoUrl = (await ctx.telegram.getFileLink(fileId)).toString();
      }

      if (!videoUrl) {
        await ctx.reply("❌ Please send a video or video URL.");
        return;
      }

      await ctx.reply(
        "⏳ *Analyzing video...*\n\n" +
        "Extracting style and creating prompt...",
        { parse_mode: "Markdown" },
      );

      try {
        const result = await ContentAnalysisService.cloneVideo(videoUrl);

        if (result.success && result.prompt) {
          const cleanPrompt = result.prompt
            .replace(/\*\*/g, "")
            .replace(/\*/g, "")
            .replace(/_/g, "")
            .replace(/`/g, "")
            .slice(0, 1500);

          // Format structured description
          const structuredDesc =
            `📋 *Video Analysis Result*\n\n` +
            `*Style:* ${result.style || "Modern/Dynamic"}\n\n` +
            `*Description:*\n${cleanPrompt}\n\n` +
            `Ready to create a similar video?`;

          await ctx.reply(structuredDesc, {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🎬 Create Similar Video",
                    callback_data: "create_video_new",
                  },
                ],
                [
                  {
                    text: "✏️ Edit Description",
                    callback_data: "clone_edit_desc",
                  },
                ],
                [{ text: "❌ Cancel", callback_data: "main_menu" }],
              ],
            },
          });

          ctx.session.stateData = {
            clonePrompt: result.prompt,
            cloneStyle: result.style,
          };
        } else {
          await ctx.reply(
            `❌ *Analysis Failed*\n\n` +
            `Error: ${result.error || "Unknown error"}`,
            { parse_mode: "Markdown" },
          );
        }
      } catch (error: any) {
        logger.error("Clone video error:", error);
        await ctx.reply("❌ Failed to analyze video. Please try again.", {
          parse_mode: "Markdown",
        });
      }

      ctx.session.state = "DASHBOARD";
      return;
    }

    // Handle clone edit description
    if (ctx.session.state === "CLONE_EDIT_DESC_WAITING" && "text" in message) {
      const newDescription = message.text;

      if (!ctx.session?.stateData?.clonePrompt) {
        await ctx.reply("❌ No clone data found. Please start over.");
        return;
      }

      // Update clone prompt with new description
      ctx.session.stateData.clonePrompt = newDescription;

      const structuredDesc =
        `✅ *Description Updated!*\n\n` +
        `*Style:* ${ctx.session.stateData.cloneStyle || "Modern/Dynamic"}\n\n` +
        `*New Description:*\n${newDescription}\n\n` +
        `Ready to create video?`;

      await ctx.reply(structuredDesc, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🎬 Create Video", callback_data: "create_video_new" }],
            [{ text: "✏️ Edit Again", callback_data: "clone_edit_desc" }],
            [{ text: "❌ Cancel", callback_data: "main_menu" }],
          ],
        },
      });

      ctx.session.state = "DASHBOARD";
      return;
    }

    // Handle clone image
    if (ctx.session.state === "CLONE_IMAGE_WAITING") {
      let imageUrl: string | undefined;

      if ("text" in message) {
        imageUrl = message.text;
      } else if ("photo" in message) {
        const photos = message.photo;
        const fileId = photos[photos.length - 1].file_id;
        imageUrl = (await ctx.telegram.getFileLink(fileId)).toString();
      }

      if (!imageUrl) {
        await ctx.reply("❌ Please send an image or image URL.");
        return;
      }

      await ctx.reply(
        "⏳ *Analyzing image...*\n\n" +
        "Extracting style and creating prompt...",
        { parse_mode: "Markdown" },
      );

      try {
        const result = await ContentAnalysisService.cloneImage(imageUrl);

        if (result.success && result.prompt) {
          // Sanitize Gemini output for Telegram (strip markdown that breaks parsing)
          const cleanPrompt = result.prompt
            .replace(/\*\*/g, "") // Remove ** bold
            .replace(/\*/g, "") // Remove * italic
            .replace(/_/g, "") // Remove _ underline
            .replace(/`/g, "") // Remove backticks
            .slice(0, 1500); // Telegram message limit safety

          await ctx.reply(
            `✅ Image Style Extracted:\n\n` +
            `${cleanPrompt}\n\n` +
            `Style: ${result.style || "N/A"}\n\n` +
            `Ready to generate a similar image?`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🖼️ Generate Similar Image",
                      callback_data: "image_generate",
                    },
                  ],
                  [{ text: "❌ Cancel", callback_data: "main_menu" }],
                ],
              },
            },
          );

          ctx.session.stateData = { clonePrompt: result.prompt };
        } else {
          await ctx.reply(
            `❌ *Analysis Failed*\n\n` +
            `Error: ${result.error || "Unknown error"}`,
            { parse_mode: "Markdown" },
          );
        }
      } catch (error: any) {
        logger.error("Clone image error:", error);
        await ctx.reply("❌ Failed to analyze image. Please try again.", {
          parse_mode: "Markdown",
        });
      }

      ctx.session.state = "DASHBOARD";
      return;
    }

    // Repurpose video URL input
    if (ctx.session.state === "REPURPOSE_VIDEO_URL") {
      let videoUrl: string | undefined;
      if ("video" in message) {
        // Telegram compressed video
        videoUrl = (await ctx.telegram.getFileLink((message as any).video.file_id)).toString();
      } else if ("document" in message) {
        // Video sent as file (uncompressed / .mp4 document)
        const doc = (message as any).document;
        if (doc?.mime_type?.startsWith("video/")) {
          videoUrl = (await ctx.telegram.getFileLink(doc.file_id)).toString();
        }
      } else if ("text" in message) {
        const text = message.text?.trim() || "";
        // Accept any http(s) URL — social platforms handled by yt-dlp in the service
        if (text.startsWith("http://") || text.startsWith("https://")) {
          videoUrl = text;
        }
      }

      if (!videoUrl) {
        await ctx.reply(
          "❌ Format tidak dikenali.\n\n" +
          "Kirim salah satu dari:\n" +
          "• Upload video langsung (MP4)\n" +
          "• Link TikTok / Instagram Reels / YouTube Shorts / Twitter\n" +
          "• URL langsung ke file video (.mp4)"
        );
        return;
      }

      const analyzingMsg = await ctx.reply(
        "⏳ *Menganalisis video...*\n\n" +
        "Extracting storyboard, prompts, dan transkrip. Tunggu sebentar...",
        { parse_mode: "Markdown" },
      );

      try {
        const { VideoAnalysisService } = await import("@/services/video-analysis.service");
        const analysis = await VideoAnalysisService.analyze(videoUrl);

        if (!analysis.success || !analysis.storyboard?.length) {
          await ctx.telegram.deleteMessage(ctx.chat!.id, analyzingMsg.message_id).catch(() => {});
          await ctx.reply(
            "❌ Gagal menganalisis video.\n\n" +
            (analysis.error || "Pastikan URL video bisa diakses publik."),
          );
          ctx.session.state = "DASHBOARD";
          return;
        }

        // Store analysis in session
        ctx.session.stateData = {
          ...ctx.session.stateData,
          repurposeData: {
            storyboard: analysis.storyboard,
            transcript: analysis.transcript,
            niche: analysis.niche,
            style: analysis.style,
            totalDuration: analysis.totalDuration,
            keyFramePaths: analysis.keyFramePaths,
          },
        };

        // Format storyboard preview
        const scenes = analysis.storyboard.slice(0, 5);
        const sceneText = scenes
          .map(
            (s) =>
              `*Scene ${s.scene}* (${s.duration}s): ${s.description.slice(0, 80)}${s.description.length > 80 ? "..." : ""}`,
          )
          .join("\n");

        const moreScenes =
          analysis.storyboard.length > 5
            ? `\n_...+${analysis.storyboard.length - 5} more scenes_`
            : "";
        const transcriptPreview = analysis.transcript
          ? `\n\n*Transkrip:*\n_"${analysis.transcript.slice(0, 200)}${analysis.transcript.length > 200 ? "..." : ""}"_`
          : "";

        const hasFrames = (analysis.keyFramePaths?.length || 0) > 0;

        await ctx.telegram.deleteMessage(ctx.chat!.id, analyzingMsg.message_id).catch(() => {});

        ctx.session.state = "REPURPOSE_CONFIRM";

        await ctx.reply(
          `✅ *Analisis Selesai!*\n\n` +
          `🎯 *Niche:* ${analysis.niche || "general"}\n` +
          `🎨 *Style:* ${analysis.style || "-"}\n` +
          `⏱️ *Durasi:* ${analysis.totalDuration || "?"}s · ${analysis.storyboard.length} scenes\n\n` +
          `*Storyboard:*\n${sceneText}${moreScenes}${transcriptPreview}\n\n` +
          `Mau regenerate gimana?`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🎬 Generate (Text-to-Video)", callback_data: "repurpose_generate_t2v" }],
                ...(hasFrames
                  ? [[{ text: "🖼️ Generate (Image-to-Video)", callback_data: "repurpose_generate_i2v" }]]
                  : []),
                [{ text: "❌ Cancel", callback_data: "main_menu" }],
              ],
            },
          },
        );
      } catch (err: any) {
        await ctx.telegram.deleteMessage(ctx.chat!.id, analyzingMsg.message_id).catch(() => {});
        await ctx.reply(`❌ Error: ${err.message}`);
        ctx.session.state = "DASHBOARD";
      }
      return;
    }

    // Handle disassemble (video/image to prompt)
    if (ctx.session.state === "DISASSEMBLE_WAITING") {
      await handleDisassemble(ctx);
      ctx.session.state = "DASHBOARD";
      return;
    }

    // Handle image upload during video creation — accumulate multi-photo (up to 5)
    // Supports both single photo and batch uploads (media groups)
    if (ctx.session?.videoCreation?.waitingForImage && "photo" in message) {
      const photos = message.photo;
      const largestPhoto = photos[photos.length - 1];
      const fileId = largestPhoto.file_id;

      if (!ctx.session.videoCreation.uploadedPhotos) {
        ctx.session.videoCreation.uploadedPhotos = [];
      }

      const currentPhotos = ctx.session.videoCreation.uploadedPhotos;
      const MAX_PHOTOS = 5;

      if (currentPhotos.length >= MAX_PHOTOS) {
        await ctx.reply(
          `You have already uploaded ${MAX_PHOTOS} photos (maximum).\n\n` +
          `Tap "Generate Now" to start video creation, or /skip to generate without references.`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "▶️ Generate Now",
                    callback_data: "generate_video_now",
                  },
                ],
                [
                  {
                    text: "⏭️ Skip Reference",
                    callback_data: "skip_reference_image",
                  },
                ],
              ],
            },
          },
        );
        return;
      }

      // Store the photo
      currentPhotos.push({ fileId });
      const count = currentPhotos.length;

      // Detect batch upload (media_group_id) — debounce reply
      // When user sends multiple photos at once, Telegram sends them as a media group.
      // We accumulate silently and only reply after the last photo in the group.
      const mediaGroupId = (message as any).media_group_id;
      if (mediaGroupId) {
        // Track the media group ID to debounce
        const lastGroupId = (ctx.session as any)._lastMediaGroupId;
        (ctx.session as any)._lastMediaGroupId = mediaGroupId;
        (ctx.session as any)._lastMediaGroupTime = Date.now();

        if (lastGroupId === mediaGroupId) {
          // Same group — accumulate silently, don't spam replies
          return;
        }

        // First photo of a new group — wait briefly for the rest to arrive
        await new Promise((r) => setTimeout(r, 1500));

        // Re-read count after debounce (other photos may have arrived)
        const finalCount =
          ctx.session.videoCreation.uploadedPhotos?.length || count;

        await ctx.reply(
          `📸 ${finalCount} photo(s) received!` +
          (finalCount < MAX_PHOTOS
            ? " Send more or tap Generate."
            : " Maximum reached — tap Generate."),
          {
            reply_markup: {
              inline_keyboard: [
                ...(finalCount < MAX_PHOTOS
                  ? [
                    [
                      {
                        text: "📸 Add More",
                        callback_data: "add_more_photos",
                      },
                    ],
                  ]
                  : []),
                [
                  {
                    text: "▶️ Generate Now",
                    callback_data: "generate_video_now",
                  },
                ],
                [
                  {
                    text: "⏭️ Skip Reference",
                    callback_data: "skip_reference_image",
                  },
                ],
              ],
            },
          },
        );
        return;
      }

      // Single photo upload (no media group) — reply immediately
      await ctx.reply(
        `📸 Photo ${count}/${MAX_PHOTOS} received!` +
        (count < MAX_PHOTOS
          ? " Send more photos or tap Generate."
          : " Maximum reached — tap Generate."),
        {
          reply_markup: {
            inline_keyboard: [
              ...(count < MAX_PHOTOS
                ? [[{ text: "📸 Add More", callback_data: "add_more_photos" }]]
                : []),
              [
                {
                  text: "▶️ Generate Now",
                  callback_data: "generate_video_now",
                },
              ],
              [
                {
                  text: "⏭️ Skip Reference",
                  callback_data: "skip_reference_image",
                },
              ],
            ],
          },
        },
      );
      return;
    }

    // Handle /skip during video creation
    if ("text" in message && message.text === "/skip") {
      if (ctx.session?.videoCreation?.waitingForImage) {
        await handleSkipImageReference(ctx);
        return;
      }
    }
  } catch (error: any) {
    logger.error("Error in message handler:", error);
    const userMessage = actionableError(error.message || String(error));
    await ctx.reply(userMessage);
  }
}
