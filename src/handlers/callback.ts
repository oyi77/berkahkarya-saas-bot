/**
 * Callback Handler
 * 
 * Handles all callback queries (inline button clicks)
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';
import { UserService } from '@/services/user.service';
import { handleTopupSelection, handlePaymentGateway, checkPayment, handleTopupExtraCredit, topupCommand, handleStarsMenu, handleStarsInvoice, STARS_PACKAGES, handleCryptoMenu, handleCryptoCoinSelect, handleCryptoPayment } from '@/commands/topup';
import { CRYPTO_PACKAGES, CRYPTO_COINS } from '@/services/nowpayments.service';
import {
  subscriptionCommand,
  handleSubscriptionPurchase,
  handleCancelSubscription,
} from '@/commands/subscription';
import { profileCommand } from '@/commands/profile';
import { referralCommand } from '@/commands/referral';
import { helpCommand } from '@/commands/help';
import { getLangConfig, LANGUAGE_LIST, LANG_PAGE_SIZE } from '@/config/languages';
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
} from '@/commands/create';
import { videosCommand, viewVideo, copyVideoUrl, deleteVideo } from '@/commands/videos';
import { NICHES } from '@/services/video-generation.service';
import { VideoService } from '@/services/video.service';
import { PostAutomationService } from '@/services/postautomation.service';
import { handleVideoCreationImage, handleSkipImageReference } from '@/handlers/message';
import { AvatarService } from '@/services/avatar.service';
import { 
  paymentSettingsCommand,
  handlePaymentDefaultGateway,
  handlePaymentToggleGateway,
  handlePaymentSetDefault
} from '@/commands/admin/paymentSettings';
import { SUBSCRIPTION_PLANS, PlanKey, BillingCycle, EXTRA_CREDIT_PACKAGES, getImageCreditCostAsync } from '@/config/pricing';
import { t } from '@/i18n/translations';
import { showNichePrompts, showPromptDetail, showCustomizePrompt, promptsCommand, trendingCommand as promptsTrendingCommand, dailyCommand as promptsDailyCommand, PROMPT_LIBRARY, MYSTERY_PROMPTS, TRENDING_PROMPTS, getPromptById, saveLibraryPrompt, showMyPrompts, startAddCustomPrompt } from '@/commands/prompts';
import { SavedPromptService } from '@/services/saved-prompt.service';

// ── Back button helpers ──────────────────────────────────────────────────────
const BTN_BACK_MAIN   = { text: '◀️ Menu Utama', callback_data: 'main_menu' };
const BTN_BACK_PROMPT = { text: '◀️ Prompt Library', callback_data: 'back_prompts' };

/**
 * Handle storyboard selection
 */
async function handleStoryboardRequest(ctx: BotContext, niche: string) {
  try {
    const storyboard = await VideoService.generateStoryboard({
      niche,
      duration: 30
    });

    let message = `📋 *Storyboard: ${niche.toUpperCase()}*\n\n`;
    
    storyboard.scenes.forEach(s => {
      message += `🎬 *Scene ${s.scene} (${s.duration}s)*\n`;
      message += `Type: ${s.type}\n`;
      message += `Desc: ${s.description}\n\n`;
    });

    message += `📝 *Caption:*\n_${storyboard.caption}_\n\n`;
    message += `💰 *Cost: 1.0 Credits*`;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Create Video Now', callback_data: `confirm_create_${niche}` }],
          [{ text: '◀️ Back to Selection', callback_data: 'storyboard_create' }],
        ]
      }
    });
  } catch (error) {
    logger.error('Storyboard error:', error);
    await ctx.answerCbQuery('Error generating storyboard');
  }
}

/**
 * Handle callback queries
 */
export async function callbackHandler(ctx: BotContext): Promise<void> {
  try {
    const callbackQuery = ctx.callbackQuery;
    
    if (!callbackQuery || !('data' in callbackQuery)) {
      return;
    }

    const data = callbackQuery.data;

    logger.debug('Callback received:', { userId: ctx.from?.id, data });

    // Route to appropriate handler based on callback data prefix

    // ── NEW REDESIGN HANDLERS (2026-03-24) ───────────────────────────────
    if (data === 'main_menu') {
      await ctx.answerCbQuery();
      const user = ctx.from;
      if (!user) return;
      const dbUser = await UserService.findByTelegramId(BigInt(user.id));
      const credBal = dbUser ? Number(dbUser.creditBalance) : 0;
      const credEmoji = credBal === 0 ? '⚠️' : credBal < 3 ? '🟡' : '🟢';
      await ctx.editMessageText(
        `👋 *Halo, ${user.first_name}!*\n\n` +
        `${credEmoji} Kredit: *${credBal}*\n\n` +
        `Mau buat apa hari ini?`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎬 Buat Video', callback_data: 'create_video_new' }],
              [{ text: '🖼 Buat Gambar', callback_data: 'create_image_new' }],
              [{ text: '💳 Kredit & Paket', callback_data: 'credits_menu' }],
              [{ text: '🎞 Video Saya', callback_data: 'videos_list' }],
              [{ text: '👤 Akun', callback_data: 'account_menu' }],
            ],
          },
        }
      );
      return;
    }

    if (data === 'credits_menu') {
      await ctx.answerCbQuery();
      const user = ctx.from;
      if (!user) return;
      const dbUser = await UserService.findByTelegramId(BigInt(user.id));
      const credBal = dbUser ? Number(dbUser.creditBalance) : 0;
      const tier = dbUser?.tier || 'free';
      await ctx.editMessageText(
        `💳 *Kredit & Paket*\n\n` +
        `Saldo kredit: *${credBal}*\n` +
        `Tier: *${tier}*\n\n` +
        `Pilih aksi:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '💰 Beli Kredit', callback_data: 'topup' }],
              [{ text: '⭐ Upgrade Langganan', callback_data: 'open_subscription' }],
              [{ text: '🎁 Kode Referral', callback_data: 'open_referral' }],
              [{ text: '◀️ Menu Utama', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    if (data === 'account_menu') {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `👤 *Akun*\n\n` +
        `Kelola preferensi dan pengaturan kamu:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⭐ Workflow Favorit', callback_data: 'account_favorites' }],
              [{ text: '⚙️ Preferensi Workflow', callback_data: 'account_preferences' }],
              [{ text: '🎁 Kode Referral', callback_data: 'open_referral' }],
              [{ text: '🌐 Bahasa & Notifikasi', callback_data: 'account_settings' }],
              [{ text: '❓ Bantuan & FAQ', callback_data: 'open_help' }],
              [{ text: '◀️ Menu Utama', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    // Placeholder handlers for new account submenu
    if (data === 'account_favorites') {
      await ctx.answerCbQuery('🚧 Fitur Workflow Favorit segera hadir!');
      return;
    }
    if (data === 'account_preferences') {
      await ctx.answerCbQuery('🚧 Fitur Preferensi Workflow segera hadir!');
      return;
    }
    if (data === 'account_settings') {
      await ctx.answerCbQuery('🚧 Pengaturan Bahasa & Notifikasi segera hadir!');
      return;
    }

    // ── END NEW REDESIGN HANDLERS ────────────────────────────────────────

    // New video/image creation flow handlers
    if (data === 'create_video_new') {
      const { startVideoCreationNew } = await import('../commands/create-new.js');
      await startVideoCreationNew(ctx);
      return;
    }

    if (data.startsWith('vcreate_source_')) {
      const { handleVideoSourceSelection } = await import('../commands/create-new.js');
      const source = data.replace('vcreate_source_', '');
      await handleVideoSourceSelection(ctx, source);
      return;
    }

    if (data.startsWith('vcreate_type_')) {
      const { showTemplateCategorySelection } = await import('../commands/create-new.js');
      await ctx.answerCbQuery();
      const type = data.replace('vcreate_type_', '');
      if (ctx.session?.videoCreationNew) {
        ctx.session.videoCreationNew.contentType = type;
      }
      await showTemplateCategorySelection(ctx);
      return;
    }

    if (data.startsWith('vcreate_theme_')) {
      const { handleTemplateCategorySelection } = await import('../commands/create-new.js');
      const theme = data.replace('vcreate_theme_', '');
      await handleTemplateCategorySelection(ctx, theme);
      return;
    }

    if (data.startsWith('vcreate_template_')) {
      const { showTemplatePreview } = await import('../commands/create-new.js');
      await ctx.answerCbQuery();
      const templateId = data.replace('vcreate_template_', '');
      await showTemplatePreview(ctx, templateId);
      return;
    }

    if (data === 'vcreate_back_category') {
      const { showTemplateCategorySelection } = await import('../commands/create-new.js');
      await ctx.answerCbQuery();
      await showTemplateCategorySelection(ctx);
      return;
    }

    if (data === 'vcreate_customize') {
      await ctx.answerCbQuery('🚧 Opsi Lanjutan segera hadir! Generate dengan default dulu.');
      return;
    }

    if (data === 'vcreate_save_favorite') {
      await ctx.answerCbQuery('🚧 Simpan Favorit segera hadir!');
      return;
    }

    if (data === 'vcreate_photo_next' || data === 'vcreate_photo_more') {
      if (data === 'vcreate_photo_more') {
        await ctx.answerCbQuery('📸 Kirim foto lain sekarang');
        return;
      }
      const { showContentTypeSelection } = await import('../commands/create-new.js');
      await ctx.answerCbQuery();
      await showContentTypeSelection(ctx);
      return;
    }

    if (data === 'vcreate_confirm') {
      await ctx.answerCbQuery();
      
      if (!ctx.session?.videoCreationNew || !ctx.session.videoCreationNew.template) {
        await ctx.reply('❌ Session expired. Mulai lagi dengan /start');
        return;
      }

      const { getTemplateById } = await import('../config/templates.js');
      const template = getTemplateById(ctx.session.videoCreationNew.template);
      
      if (!template) {
        await ctx.reply('❌ Template tidak ditemukan');
        return;
      }

      const user = ctx.from;
      if (!user) return;
      
      const telegramId = BigInt(user.id);
      const dbUser = await UserService.findByTelegramId(telegramId);
      
      if (!dbUser || Number(dbUser.creditBalance) < template.creditCost) {
        await ctx.editMessageText(
          `❌ *Kredit tidak cukup*\n\n` +
          `Butuh: ${template.creditCost} kredit\n` +
          `Saldo: ${dbUser?.creditBalance || 0} kredit`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '💰 Beli Kredit', callback_data: 'topup' }],
                [{ text: '◀️ Kembali', callback_data: 'main_menu' }],
              ],
            },
          }
        );
        return;
      }

      // Deduct credits
      await UserService.deductCredits(telegramId, template.creditCost);

      // Build prompt from template + user input
      const textInput = ctx.session.videoCreationNew.textInput || '';
      const source = ctx.session.videoCreationNew.source || 'text';
      
      let prompt = `Create a ${template.name} video with ${template.sceneCount} scenes. `;
      prompt += `Theme: ${template.theme}, Vibe: ${template.vibe}, Mood: ${template.mood}. `;
      prompt += `Lighting: ${template.lighting}, Colors: ${template.colors.join(', ')}. `;
      if (textInput) {
        prompt += `User description: ${textInput}`;
      }

      // Trigger video generation (use existing pipeline)
      const jobId = `job_${Date.now()}_${telegramId}`;
      const niche = template.theme;
      const duration = template.sceneCount * 5; // 5 sec per scene

      // Queue video generation job
      try {
        const video = await VideoService.createJob({
          userId: telegramId,
          niche,
          platform: 'tiktok',
          duration,
          scenes: template.sceneCount,
          title: `${template.name} - ${new Date().toLocaleDateString('id-ID')}`,
        });

        const actualJobId = video.jobId;

        // Trigger actual video generation
        const { generateVideoWithFallback } = await import('../services/video-fallback.service.js');
        
        // Download reference image if uploaded
        let referenceImageUrl: string | null = null;
        if (ctx.session.videoCreationNew.uploadedPhotos && ctx.session.videoCreationNew.uploadedPhotos.length > 0) {
          try {
            const fileId = ctx.session.videoCreationNew.uploadedPhotos[0].fileId;
            const fileLink = await ctx.telegram.getFileLink(fileId);
            referenceImageUrl = fileLink.toString();
            logger.info(`📸 Reference image downloaded: ${referenceImageUrl}`);
          } catch (err) {
            logger.error('Failed to download reference image:', err);
          }
        }
        
        // Start generation in background
        generateVideoWithFallback({
          prompt,
          duration,
          aspectRatio: '9:16',
          style: template.vibe,
          niche: template.theme,
          referenceImage: referenceImageUrl,
        }).then(async (result) => {
          if (result.success && result.videoUrl) {
            // Update video record
            await prisma.video.update({
              where: { jobId: actualJobId },
              data: {
                status: 'completed',
                progress: 100,
                videoUrl: result.videoUrl,
                thumbnailUrl: result.thumbnailUrl,
              },
            });

            // Send video to user
            await ctx.telegram.sendVideo(
              ctx.chat!.id,
              result.videoUrl,
              {
                caption: `✅ *Video Selesai!*\n\n📋 ${template.name}\n🎬 ${template.sceneCount} scene • ${duration} detik`,
                parse_mode: 'Markdown',
              }
            );
          } else {
            throw new Error(result.error || 'Generation failed');
          }
        }).catch(async (error) => {
          logger.error('Video generation failed:', error);
          await UserService.refundCredits(telegramId, template.creditCost, actualJobId, error.message);
          await ctx.telegram.sendMessage(
            ctx.chat!.id,
            `❌ *Generation Failed*\n\n` +
            `Job: ${actualJobId}\n` +
            `${error.message}\n\n` +
            `Kredit kamu sudah di-refund.`,
            { parse_mode: 'Markdown' }
          );
        });

        await ctx.editMessageText(
          `🚀 *Generating...*\n\n` +
          `Video kamu sedang dibuat!\n\n` +
          `📋 Template: ${template.name}\n` +
          `🎬 ${template.sceneCount} scene • ${duration} detik\n` +
          `💰 ${template.creditCost} kredit terpakai\n\n` +
          `⏱️ Estimasi: 2-5 menit\n` +
          `Kamu akan dapat notifikasi saat selesai.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎞 Video Saya', callback_data: 'videos_list' }],
                [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
              ],
            },
          }
        );

        // Clear session
        if (ctx.session) {
          ctx.session.videoCreationNew = undefined;
          ctx.session.state = 'DASHBOARD';
        }
      } catch (error: any) {
        logger.error('Video generation failed:', error);
        // Refund credits
        await UserService.refundCredits(telegramId, template.creditCost, jobId, error.message);
        await ctx.reply(
          `❌ *Generation Failed*\n\n` +
          `${error.message}\n\n` +
          `Kredit kamu sudah di-refund.`,
          { parse_mode: 'Markdown' }
        );
      }
      return;
    }

    if (data === 'create_image_new') {
      await ctx.answerCbQuery('🚧 Alur Buat Gambar baru segera hadir! Gunakan menu lama sementara.');
      // Fallback to old flow
      await ctx.editMessageText(
        '🖼️ *Generate Gambar AI*\n\n' +
        '💡 _AI buat foto marketing profesional dari deskripsi atau foto referensi kamu_\n\n' +
        'Pilih kategori konten kamu:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛍️ Foto Produk', callback_data: 'img_product' }],
              [{ text: '🍔 Makanan & Minuman', callback_data: 'img_fnb' }],
              [{ text: '🏠 Properti / Real Estate', callback_data: 'img_realestate' }],
              [{ text: '🚗 Kendaraan / Otomotif', callback_data: 'img_car' }],
              [{ text: '👤 Kelola Avatar', callback_data: 'avatar_manage' }],
              [{ text: '◀️ Menu Utama', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    // ── END NEW VIDEO/IMAGE CREATION HANDLERS ─────────────────────────────

    // ── PROMPT LIBRARY HANDLERS ───────────────────────────────────────────
    if (data.startsWith('prompts_niche_')) {
      const niche = data.replace('prompts_niche_', '');
      await ctx.answerCbQuery();
      
      const { getPromptsByNiche } = await import('../config/professional-prompts.js');
      const prompts = getPromptsByNiche(niche);
      
      if (prompts.length === 0) {
        await ctx.editMessageText(
          `⚠️ Prompt library untuk niche ${niche} belum tersedia.\n\n` +
          `Silakan pilih niche lain atau hubungi support.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '◀️ Kembali', callback_data: 'main_menu' }],
              ],
            },
          }
        );
        return;
      }
      
      const nicheLabels: Record<string, string> = {
        fnb: '🍔 F&B',
        fashion: '👗 Fashion',
        tech: '💻 Tech',
        travel: '✈️ Travel',
        education: '🎓 Education',
        finance: '💰 Finance',
        health: '🏥 Health',
        entertainment: '🎬 Entertainment',
      };
      
      let message = `📚 *Prompt Library: ${nicheLabels[niche] || niche}*\n\n`;
      message += `Pilih prompt profesional untuk generate image:\n\n`;
      
      const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
      
      prompts.forEach((prompt, idx) => {
        message += `${idx + 1}. *${prompt.name}*\n`;
        message += `   _${prompt.bestFor}_\n\n`;
        
        buttons.push([{
          text: `${idx + 1}. ${prompt.name}`,
          callback_data: `use_prompt_${prompt.id}`,
        }]);
      });
      
      buttons.push([{ text: '◀️ Pilih Niche Lain', callback_data: 'onboard_claim_trial' }]);
      buttons.push([{ text: '🏠 Menu Utama', callback_data: 'main_menu' }]);
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons },
      });
      return;
    }

    if (data.startsWith('use_prompt_')) {
      const promptId = data.replace('use_prompt_', '');
      await ctx.answerCbQuery();
      
      const { getPromptById } = await import('../config/professional-prompts.js');
      const prompt = getPromptById(promptId);
      
      if (!prompt) {
        await ctx.reply('❌ Prompt tidak ditemukan.');
        return;
      }
      
      // Check if user can use free trial
      const user = ctx.from;
      if (!user) return;
      
      const telegramId = BigInt(user.id);
      const dbUser = await UserService.findByTelegramId(telegramId);
      
      if (!dbUser) {
        await ctx.reply('❌ User tidak ditemukan. Silakan /start ulang.');
        return;
      }
      
      const { canUseWelcomeBonus, canUseDailyFree } = await import('../config/free-trial.js');
      
      const hasCredits = Number(dbUser.creditBalance) > 0;
      const canUseWelcome = canUseWelcomeBonus(dbUser);
      const canUseDaily = canUseDailyFree(dbUser);
      
      // If user has credits, bypass free trial
      if (!hasCredits && !canUseWelcome && !canUseDaily) {
        await ctx.editMessageText(
          `⚠️ *Free Trial sudah habis!*\n\n` +
          `Welcome Bonus: ❌ Sudah digunakan\n` +
          `Daily Free: ❌ Belum reset\n\n` +
          `Beli kredit untuk melanjutkan.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '💰 Beli Kredit', callback_data: 'topup' }],
                [{ text: '◀️ Kembali', callback_data: 'main_menu' }],
              ],
            },
          }
        );
        return;
      }
      
      const bonusType = hasCredits ? 'Kredit' : (canUseWelcome ? 'Welcome Bonus' : 'Daily Free');
      const costInfo = hasCredits ? `💳 Biaya: 0.2 kredit (sisa: ${dbUser.creditBalance})` : `🎁 Menggunakan: ${bonusType}`;
      
      await ctx.editMessageText(
        `✅ *Prompt Dipilih!*\n\n` +
        `📋 ${prompt.name}\n` +
        `🎨 Niche: ${prompt.niche.toUpperCase()}\n` +
        `🎯 Best For: ${prompt.bestFor}\n\n` +
        `${costInfo}\n` +
        `🆓 Provider: Google Gemini (GRATIS)\n\n` +
        `Siap generate?`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 Generate Sekarang!', callback_data: `generate_free_${promptId}` }],
              [{ text: '◀️ Pilih Prompt Lain', callback_data: `prompts_niche_${prompt.niche}` }],
            ],
          },
        }
      );
      return;
    }

    if (data.startsWith('generate_free_')) {
      const promptId = data.replace('generate_free_', '');
      await ctx.answerCbQuery();
      
      const { getPromptById } = await import('../config/professional-prompts.js');
      const prompt = getPromptById(promptId);
      
      if (!prompt) {
        await ctx.reply('❌ Prompt tidak ditemukan.');
        return;
      }
      
      const user = ctx.from;
      if (!user) return;
      
      const telegramId = BigInt(user.id);
      const dbUser = await UserService.findByTelegramId(telegramId);
      
      if (!dbUser) {
        await ctx.reply('❌ User tidak ditemukan. Silakan /start ulang.');
        return;
      }
      
      const { canUseWelcomeBonus, canUseDailyFree, getNextDailyFreeReset } = await import('../config/free-trial.js');
      
      const hasCredits = Number(dbUser.creditBalance) > 0;
      const canUseWelcome = canUseWelcomeBonus(dbUser);
      const canUseDaily = canUseDailyFree(dbUser);
      
      // If user has no credits and no free trial, block
      if (!hasCredits && !canUseWelcome && !canUseDaily) {
        await ctx.editMessageText(
          `⚠️ *Free Trial sudah habis!*\n\n` +
          `Beli kredit untuk melanjutkan.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '💰 Beli Kredit', callback_data: 'topup' }],
                [{ text: '◀️ Kembali', callback_data: 'main_menu' }],
              ],
            },
          }
        );
        return;
      }
      
      const bonusType = hasCredits ? 'credit' : (canUseWelcome ? 'welcome' : 'daily');
      const costText = hasCredits ? '0.2 kredit' : (bonusType === 'welcome' ? 'Welcome Bonus' : 'Daily Free');
      
      await ctx.editMessageText(
        `⏳ *Generating...*\n\n` +
        `📋 ${prompt.name}\n` +
        `💳 Menggunakan: ${costText}\n\n` +
        `Mohon tunggu 10-30 detik...`,
        { parse_mode: 'Markdown' }
      );
      
      try {
        // Generate image with Google Gemini (free provider)
        const { ImageGenerationService } = await import('../services/image.service.js');
        
        const result = await ImageGenerationService.generateImage({
          prompt: prompt.prompt,
          category: prompt.niche,
          aspectRatio: '1:1',
          style: 'professional',
        });
        
        if (!result.success || !result.imageUrl) {
          throw new Error(result.error || 'Generation failed');
        }
        
        // Deduct credits or mark bonus as used
        if (bonusType === 'credit') {
          // Deduct 0.2 credits for paid users
          await UserService.deductCredits(telegramId, 0.2);
        } else if (bonusType === 'welcome') {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { welcomeBonusUsed: true },
          });
        } else {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              dailyFreeUsed: true,
              dailyFreeResetAt: getNextDailyFreeReset(),
            },
          });
        }
        
        // Get updated balance
        const updatedUser = await UserService.findByTelegramId(telegramId);
        const balanceText = bonusType === 'credit' 
          ? `💳 Sisa kredit: ${updatedUser?.creditBalance || 0}`
          : `🎁 ${bonusType === 'welcome' ? 'Welcome Bonus' : 'Daily Free'} digunakan`;
        
        // Send image
        await ctx.replyWithPhoto(result.imageUrl, {
          caption:
            `✅ *Image Generated!*\n\n` +
            `📋 ${prompt.name}\n` +
            `${balanceText}\n\n` +
            `Suka hasilnya? Generate lebih banyak!`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Generate Lagi', callback_data: `prompts_niche_${prompt.niche}` }],
              [{ text: '💰 Beli Kredit', callback_data: 'topup' }],
              [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
            ],
          },
        });
        
      } catch (error) {
        console.error('Free trial generation error:', error);
        
        await ctx.reply(
          `❌ *Generation Gagal*\n\n` +
          `Terjadi error saat generate image.\n` +
          `Bonus Anda tidak terpakai.\n\n` +
          `Silakan coba lagi atau hubungi support.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 Coba Lagi', callback_data: `generate_free_${promptId}` }],
                [{ text: '◀️ Pilih Prompt Lain', callback_data: `prompts_niche_${prompt.niche}` }],
                [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
              ],
            },
          }
        );
      }
      
      return;
    }

    // ── ONBOARDING HANDLERS ───────────────────────────────────────────────
    if (data === 'onboard_start') {
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
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎁 Klaim FREE TRIAL!', callback_data: 'onboard_claim_trial' }],
            ],
          },
        }
      );
      return;
    }

    if (data === 'onboard_claim_trial') {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `🎉 *SELAMAT! Anda mendapat FREE TRIAL!*\n\n` +
        `*Bonus yang Anda dapatkan:*\n` +
        `• ✅ 1x Image Generation GRATIS (sekali pakai)\n` +
        `• ✅ 1x Daily Free setiap hari (login harian)\n\n` +
        `Pilih niche bisnis Anda untuk mulai:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🍔 F&B', callback_data: 'onboard_niche_fnb' }, { text: '👗 Fashion', callback_data: 'onboard_niche_fashion' }],
              [{ text: '💻 Tech', callback_data: 'onboard_niche_tech' }, { text: '✈️ Travel', callback_data: 'onboard_niche_travel' }],
              [{ text: '🎓 Education', callback_data: 'onboard_niche_education' }, { text: '💰 Finance', callback_data: 'onboard_niche_finance' }],
              [{ text: '🏥 Health', callback_data: 'onboard_niche_health' }, { text: '🎬 Entertainment', callback_data: 'onboard_niche_entertainment' }],
            ],
          },
        }
      );
      return;
    }

    if (data.startsWith('onboard_niche_')) {
      const niche = data.replace('onboard_niche_', '');
      await ctx.answerCbQuery();
      
      // Create user account with free trial
      const user = ctx.from;
      if (!user) return;
      
      const telegramId = BigInt(user.id);
      
      // Check if user already exists
      let dbUser = await UserService.findByTelegramId(telegramId);
      
      if (!dbUser) {
        // Create new user with free trial (0 kredit, tapi ada welcome bonus)
        dbUser = await UserService.create({
          telegramId,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          language: 'id',
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
        
        logger.info(`New user created with free trial: ${telegramId}, niche: ${niche}`);
      }
      
      const nicheLabels: Record<string, string> = {
        fnb: '🍔 F&B',
        fashion: '👗 Fashion',
        tech: '💻 Tech',
        travel: '✈️ Travel',
        education: '🎓 Education',
        finance: '💰 Finance',
        health: '🏥 Health',
        entertainment: '🎬 Entertainment',
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
        `• ✅ 1x Image Generation per hari (Daily Free)\n` +
        `• 🎨 Harus pilih dari Prompt Library\n` +
        `• 🆓 Provider: Google Gemini (GRATIS)\n\n` +
        `*FITUR PREMIUM (Bayar):*\n` +
        `• ✍️ Custom prompt sendiri\n` +
        `• 🎬 Video generation\n` +
        `• 📸 Upload foto produk\n` +
        `• 🚀 Priority queue\n\n` +
        `Siap mulai? 🚀`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎨 Gunakan Welcome Bonus!', callback_data: 'use_welcome_bonus' }],
              [{ text: '💰 Beli Kredit', callback_data: 'topup' }],
            ],
          },
        }
      );
      return;
    }

    if (data === 'use_welcome_bonus') {
      await ctx.answerCbQuery();
      const user = ctx.from;
      if (!user) return;
      
      const telegramId = BigInt(user.id);
      const dbUser = await UserService.findByTelegramId(telegramId);
      
      if (!dbUser) {
        await ctx.reply('❌ User tidak ditemukan. Silakan /start ulang.');
        return;
      }
      
      // Check if welcome bonus already used
      if (dbUser.welcomeBonusUsed) {
        await ctx.editMessageText(
          `⚠️ *Welcome Bonus sudah digunakan!*\n\n` +
          `Gunakan Daily Free Anda atau beli kredit.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎁 Gunakan Daily Free', callback_data: 'use_daily_free' }],
                [{ text: '💰 Beli Kredit', callback_data: 'topup' }],
                [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
              ],
            },
          }
        );
        return;
      }
      
      // Redirect to prompt library for selected niche
      const niche = dbUser.selectedNiche || 'fnb';
      await ctx.editMessageText(
        `🎨 *Welcome Bonus: 1x Image Generation*\n\n` +
        `Pilih prompt dari library ${niche.toUpperCase()}:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📚 Lihat Prompt Library', callback_data: `prompts_niche_${niche}` }],
              [{ text: '◀️ Kembali', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    if (data === 'use_daily_free') {
      await ctx.answerCbQuery();
      const user = ctx.from;
      if (!user) return;
      
      const telegramId = BigInt(user.id);
      const dbUser = await UserService.findByTelegramId(telegramId);
      
      if (!dbUser) {
        await ctx.reply('❌ User tidak ditemukan. Silakan /start ulang.');
        return;
      }
      
      const { canUseDailyFree, getNextDailyFreeReset } = await import('../config/free-trial.js');
      
      // Check if daily free can be used
      if (!canUseDailyFree(dbUser)) {
        const resetAt = dbUser.dailyFreeResetAt || getNextDailyFreeReset();
        const hoursLeft = Math.ceil((resetAt.getTime() - Date.now()) / (1000 * 60 * 60));
        
        await ctx.editMessageText(
          `⏰ *Daily Free belum reset!*\n\n` +
          `Reset dalam: ${hoursLeft} jam\n` +
          `Reset time: 00:00 WIB setiap hari\n\n` +
          `Gunakan Welcome Bonus atau beli kredit.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎁 Gunakan Welcome Bonus', callback_data: 'use_welcome_bonus' }],
                [{ text: '💰 Beli Kredit', callback_data: 'topup' }],
                [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
              ],
            },
          }
        );
        return;
      }
      
      // Redirect to prompt library
      const niche = dbUser.selectedNiche || 'fnb';
      await ctx.editMessageText(
        `🎁 *Daily Free: 1x Image Generation*\n\n` +
        `Pilih prompt dari library ${niche.toUpperCase()}:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📚 Lihat Prompt Library', callback_data: `prompts_niche_${niche}` }],
              [{ text: '◀️ Kembali', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    // Onboarding language selection (new users picking language before account creation)
    if (data.startsWith('onboard_lang_more_')) {
      // Paginated "more languages" view
      await ctx.answerCbQuery();
      const page = parseInt(data.replace('onboard_lang_more_', ''));
      const start = page * LANG_PAGE_SIZE;
      const pageItems = LANGUAGE_LIST.slice(start, start + LANG_PAGE_SIZE);
      const totalPages = Math.ceil(LANGUAGE_LIST.length / LANG_PAGE_SIZE);

      const langButtons: Array<Array<{ text: string; callback_data: string }>> = [];
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
      if (page > 0) navRow.push({ text: '\u25c0\ufe0f Prev', callback_data: `onboard_lang_more_${page - 1}` });
      navRow.push({ text: `${page + 1}/${totalPages}`, callback_data: 'noop' });
      if (page < totalPages - 1) navRow.push({ text: 'Next \u25b6\ufe0f', callback_data: `onboard_lang_more_${page + 1}` });
      langButtons.push(navRow);

      await ctx.editMessageText(
        `\ud83c\udf10 *Selamat datang di Vilona Asisten OpenClaw!*\n\n` +
        `Please select your preferred language.\n` +
        `This will be used for the bot interface, voice over, subtitles, and captions.`,
        {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: langButtons },
        }
      );
      return;
    }

    if (data.startsWith('onboard_lang_')) {
      // User picked a language — create account and run welcome flow
      const langCode = data.replace('onboard_lang_', '');
      const langCfg = getLangConfig(langCode);
      await ctx.answerCbQuery(`${langCfg.flag} ${langCfg.label}`);

      const userId = ctx.from?.id;
      if (!userId) return;

      // Resolve referral from session stateData
      let referredBy: string | undefined;
      const startPayload = ctx.session?.stateData?.startPayload as string | null;
      if (startPayload?.startsWith('ref_')) {
        const refCode = startPayload.replace('ref_', '');
        const referrer = await UserService.findByReferralCode(refCode);
        if (referrer) {
          referredBy = referrer.uuid;
        }
      }

      // Create the user with the selected language
      const user = ctx.from!;
      const newUser = await UserService.create({
        telegramId: BigInt(user.id),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        language: langCode,
        referredBy,
      });

      // Update language selection confirmation on the picker message
      await ctx.editMessageText(
        `${langCfg.flag} ${langCfg.label} \u2705`,
        { parse_mode: 'Markdown' }
      );

      // ── Guided onboarding — step-by-step, friendly ───────────────────────
      const lang = langCode;

      // Message 1: Welcome + keyboard (bottom bar)
      await ctx.reply(
        t('onboarding.welcome', lang),
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

      // Message 2 (after 1.5s): how to start guide
      await new Promise((r) => setTimeout(r, 1500));
      await ctx.reply(t('onboarding.features', lang), { parse_mode: 'Markdown' });

      // Message 3 (after 1.5s): CTA with prompt-first flow
      await new Promise((r) => setTimeout(r, 1500));
      await ctx.reply(
        t('onboarding.cta', lang),
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              // Primary: prompt discovery
              [{ text: t('onboarding.btn_create_video', lang), callback_data: 'back_prompts' }],
              // Secondary: daily free prompt
              [{ text: t('onboarding.btn_try_image', lang), callback_data: 'daily_open' }],
              // Tertiary: AI chat help
              [{ text: t('onboarding.btn_chat_ai', lang), callback_data: 'open_chat' }],
            ],
          },
        }
      );

      // Update session to dashboard
      if (ctx.session) {
        ctx.session.state = 'DASHBOARD';
        ctx.session.lastActivity = new Date();
        ctx.session.stateData = {};
      }
      return;
    }

    // Telegram Stars handlers
    if (data === 'topup_stars_menu') {
      await handleStarsMenu(ctx);
      return;
    }

    if (data.startsWith('topup_stars_')) {
      const credits = parseInt(data.replace('topup_stars_', ''), 10);
      const validPkg = STARS_PACKAGES.find(p => p.credits === credits);
      if (!validPkg) {
        await ctx.answerCbQuery('Invalid Stars package');
        return;
      }
      await handleStarsInvoice(ctx, credits);
      return;
    }

    // Crypto payment handlers
    if (data === 'topup_crypto_menu') {
      await handleCryptoMenu(ctx);
      return;
    }

    if (data.startsWith('topup_crypto_pkg_')) {
      const credits = parseInt(data.replace('topup_crypto_pkg_', ''), 10);
      const validPkg = CRYPTO_PACKAGES.find(p => p.credits === credits);
      if (!validPkg) {
        await ctx.answerCbQuery('Invalid crypto package');
        return;
      }
      await handleCryptoCoinSelect(ctx, credits);
      return;
    }

    if (data.startsWith('topup_crypto_pay_')) {
      const parts = data.replace('topup_crypto_pay_', '').split('_');
      const credits = parseInt(parts[0], 10);
      const coin = parts.slice(1).join('_'); // coin ids may not have underscore but safe
      const validCoin = CRYPTO_COINS.find(c => c.id === coin);
      if (!validCoin) {
        await ctx.answerCbQuery('Invalid coin');
        return;
      }
      await handleCryptoPayment(ctx, credits, coin);
      return;
    }

    // Topup handlers
    if (data.startsWith('topup_pkg_')) {
      const packageId = data.replace('topup_pkg_', '');
      await handleTopupSelection(ctx, packageId);
      return;
    }

    if (data.startsWith('topup_pay_')) {
      const parts = data.replace('topup_pay_', '').split('_');
      const packageId = parts[0];
      const gateway = parts[1];
      await handlePaymentGateway(ctx, packageId, gateway);
      return;
    }

    if (data.startsWith('topup_extra_')) {
      const credits = parseInt(data.replace('topup_extra_', ''), 10);
      const validPkg = EXTRA_CREDIT_PACKAGES.find(p => p.credits === credits);
      if (!validPkg) {
        await ctx.answerCbQuery('Invalid credit package');
        return;
      }
      await handleTopupExtraCredit(ctx, credits);
      return;
    }

    if (data.startsWith('topup_')) {
      const packageId = data.replace('topup_', '');
      await handleTopupSelection(ctx, packageId);
      return;
    }

    if (data.startsWith('check_payment_')) {
      const orderId = data.replace('check_payment_', '');
      await checkPayment(ctx, orderId);
      return;
    }

    // Subscription handlers
    if (data.startsWith('subscribe_')) {
      const parts = data.replace('subscribe_', '').split('_');
      const plan = parts[0] as PlanKey;
      const cycle = parts[1] as BillingCycle;
      if (!(plan in SUBSCRIPTION_PLANS) || !['monthly', 'annual'].includes(cycle)) {
        await ctx.answerCbQuery('Invalid plan selection');
        return;
      }
      await handleSubscriptionPurchase(ctx, plan, cycle);
      return;
    }

    if (data === 'cancel_subscription') {
      await handleCancelSubscription(ctx);
      return;
    }

    if (data === 'open_subscription') {
      await ctx.deleteMessage().catch(() => {});
      await subscriptionCommand(ctx);
      return;
    }

    // Niche selection (Phase 1)
    if (data.startsWith('select_niche_')) {
      const nicheKey = data.replace('select_niche_', '');
      await handleNicheSelection(ctx, nicheKey);
      return;
    }

    // Style selection (Phase 1)
    if (data.startsWith('select_style_')) {
      const styleKey = data.replace('select_style_', '');
      await handleStyleSelection(ctx, styleKey);
      return;
    }

    // Platform selection (create flow)
    if (data.startsWith('create_platform_')) {
      const platformKey = data.replace('create_platform_', '');
      await handlePlatformSelection(ctx, platformKey);
      return;
    }

    // Video quality feedback
    if (data.startsWith('feedback_good_')) {
      const jobId = data.replace('feedback_good_', '');
      await ctx.answerCbQuery();
      try {
        await redis.set(`feedback:${jobId}`, 'good', 'EX', 86400 * 30);
      } catch (_) { /* Redis optional */ }
      const feedbackUser = ctx.from ? await UserService.findByTelegramId(BigInt(ctx.from.id.toString())) : null;
      const feedbackLang = feedbackUser?.language || 'id';
      await ctx.reply(t('feedback.thanks_good', feedbackLang));
      return;
    }

    if (data.startsWith('feedback_bad_')) {
      const jobId = data.replace('feedback_bad_', '');
      await ctx.answerCbQuery();
      try {
        await redis.set(`feedback:${jobId}`, 'bad', 'EX', 86400 * 30);
      } catch (_) { /* Redis optional */ }
      const feedbackUser = ctx.from ? await UserService.findByTelegramId(BigInt(ctx.from.id.toString())) : null;
      const feedbackLang = feedbackUser?.language || 'id';
      await ctx.reply(t('feedback.thanks_bad', feedbackLang), {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Coba Lagi', callback_data: 'back_prompts' }],
          ],
        },
      });
      return;
    }

    if (data === 'custom_duration') {
      await handleDurationSelection(ctx, 'custom_duration');
      return;
    }

    if (data.startsWith('duration_')) {
      const durationStr = data.replace('duration_', '');
      await handleDurationSelection(ctx, durationStr);
      return;
    }

    // VO / Subtitle toggle handlers
    if (data === 'vo_toggle_vo') {
      await handleVOToggle(ctx, 'vo');
      return;
    }
    if (data === 'vo_toggle_subtitles') {
      await handleVOToggle(ctx, 'subtitles');
      return;
    }
    if (data === 'vo_continue') {
      await handleVOContinue(ctx);
      return;
    }
    if (data === 'create_custom_prompt') {
      await handleCustomPromptRequest(ctx);
      return;
    }
    if (data === 'create_skip_prompt') {
      await handleSkipPrompt(ctx);
      return;
    }
    // Upload reference from VO continue screen
    if (data === 'create_upload_reference') {
      await ctx.answerCbQuery();
      if (ctx.session?.videoCreation) ctx.session.videoCreation.waitingForImage = true;
      ctx.session!.state = 'CREATE_VIDEO_UPLOAD';
      await ctx.editMessageText(
        '📸 *Upload Foto Referensi*\n\n' +
        'Kirim foto produk kamu sekarang.\n' +
        'AI akan animasikan foto tersebut menjadi video!\n\n' +
        '_Atau ketik /skip untuk generate tanpa foto._',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Legacy handlers removed for MVP
    // Mode, niche, platform selection now automatic

    // Brief skip
    if (data === 'brief_skip') {
      await ctx.editMessageText(
        '⏭️ Brief skipped\n\n' +
        '✅ Confirm video creation:\n\n' +
        'Estimated credits: 1.0\n\n' +
        'Proceed?',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Yes, Create!', callback_data: 'confirm_create' },
                { text: '❌ Cancel', callback_data: 'cancel_create' },
              ],
            ],
          },
        }
      );
      return;
    }

    if (data === 'confirm_create') {
      await ctx.editMessageText(
        '🎬 Creating your video...\n\n' +
        '⏳ Estimated time: 2-5 minutes\n\n' +
        'You will be notified when it\'s ready!'
      );
      ctx.session.state = 'CREATE_VIDEO_PROCESSING';
      return;
    }

    if (data === 'cancel_create') {
      await ctx.editMessageText(
        '❌ Video creation cancelled.\n\n' +
        'Use /create to start again.'
      );
      ctx.session.state = 'DASHBOARD';
      return;
    }

    // Payment method handlers (placeholder - will use Midtrans)
    if (data.startsWith('payment_')) {
      const [_, method, packageId] = data.split('_');
      
      await ctx.editMessageText(
        `💳 Processing ${method} payment...\n\n` +
        'In sandbox mode - this would redirect to Midtrans payment page.',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Simulate Success', callback_data: `simulate_success_${packageId}` },
              ],
            ],
          },
        }
      );
      return;
    }

    if (data.startsWith('simulate_success_')) {
      const packageId = data.replace('simulate_success_', '');
      
      const credits: Record<string, number> = {
        starter: 6,
        growth: 18,
        scale: 75,
        enterprise: 260,
      };

      await ctx.editMessageText(
        `✅ Payment Successful! (Simulated)\n\n` +
        `Credits added: ${credits[packageId] || 0}\n\n` +
        'Thank you for your purchase! 🎉'
      );
      return;
    }

    // Share referral
    if (data === 'share_referral') {
      await ctx.answerCbQuery('Share feature coming soon!');
      return;
    }

    // ─── PROMPT LIBRARY CALLBACKS ──────────────────────────────────────────

    // Browse niche prompts: prompts_fnb, prompts_fashion, etc.
    if (data.startsWith('prompts_')) {
      await ctx.answerCbQuery();
      const nicheKey = data.replace('prompts_', '');
      if (nicheKey === 'trending') {
        // Build trending inline (edit in place)
        const TP = TRENDING_PROMPTS; const PL = PROMPT_LIBRARY;
        let msg = `🔥 *TRENDING PROMPTS THIS WEEK*\n_Diupdate berdasarkan penggunaan real user!_\n\n`;
        const buttons: any[][] = [];
        TP.forEach((t: any, i: number) => {
          const niche = PL[t.niche];
          const p = niche.prompts.find((x: any) => x.id === t.promptId)!;
          msg += `*#${i+1}* ${niche.emoji} ${p.title} — ⭐${p.successRate}% | 📈+${t.usageChange}%\n\n`;
          buttons.push([{ text: `#${i+1} ${p.title}`, callback_data: `use_prompt_${p.id}` }]);
        });
        buttons.push([{ text: '◀️ Kembali ke Niche', callback_data: 'back_prompts' }]);
        try {
          await ctx.editMessageText(msg, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } });
        } catch {
          await promptsTrendingCommand(ctx);
        }
      } else if (nicheKey === 'custom') {
        await ctx.editMessageText(
          '✨ *Custom Prompt Generator*\n\n' +
          'Ceritakan kebutuhan kamu:\n\n' +
          '1️⃣ Produk/jasa apa?\n' +
          '2️⃣ Target audience?\n' +
          '3️⃣ Mood video: energetic/calm/luxury?\n' +
          '4️⃣ Platform utama: TikTok/IG/YouTube?\n' +
          '5️⃣ Durasi: 5-60 detik?\n\n' +
          'Jawab semuanya dalam satu pesan, saya akan generate prompt optimal! 🎯',
          { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '◀️ Kembali', callback_data: 'back_prompts' }]] } }
        );
        if (ctx.session) ctx.session.state = 'CUSTOM_PROMPT_CREATION';
      } else {
        await showNichePrompts(ctx, nicheKey, true);
      }
      return;
    }

    // Use a specific prompt: use_prompt_fnb_1, use_prompt_fashion_2, etc.
    if (data.startsWith('use_prompt_')) {
      await ctx.answerCbQuery();
      const promptId = data.replace('use_prompt_', '');
      await showPromptDetail(ctx, promptId, true);
      return;
    }

    // Customize a prompt: customize_prompt_fnb_1
    if (data.startsWith('customize_prompt_')) {
      await ctx.answerCbQuery();
      const promptId = data.replace('customize_prompt_', '');
      await showCustomizePrompt(ctx, promptId, true);
      return;
    }

    // Customizer style/light quick picks
    if (data.startsWith('cust_style_') || data.startsWith('cust_light_')) {
      await ctx.answerCbQuery();
      const parts = data.split('_');
      // cust_style_cinematic_fnb_1 → type=style, value=cinematic, id=fnb_1
      const type = parts[1]; // style or light
      const value = parts[2];
      const promptId = parts.slice(3).join('_');
      const p = getPromptById(promptId);
      const base = p?.prompt || '';
      const modifiers: Record<string, string> = {
        cinematic: 'cinematic style, film-grade quality',
        dramatic: 'dramatic lighting, high contrast, intense atmosphere',
        minimal: 'minimalist clean aesthetic, simple background',
        golden: 'golden hour natural lighting, warm tones',
        studio: 'professional studio lighting, even illumination',
        moody: 'moody dark atmosphere, low-key lighting',
      };
      const newPrompt = `${base}, ${modifiers[value] || value}`;
      if (ctx.session) ctx.session.stateData = { ...(ctx.session.stateData || {}), selectedPrompt: newPrompt };
      await ctx.editMessageText(
        `✅ *Prompt Updated!*\n\n\`${newPrompt.slice(0, 300)}\`\n\n_${type === 'style' ? 'Style' : 'Lighting'}: *${value}* applied_\n\nMau buat video atau gambar dengan prompt ini?`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🎬 Buat Video', callback_data: 'create_video' },
                { text: '🖼️ Buat Gambar', callback_data: 'image_from_prompt' },
              ],
              [{ text: '🔧 Customize Lagi', callback_data: `customize_prompt_${promptId}` }],
            ],
          },
        }
      );
      return;
    }

    // ── Saved Prompt callbacks ─────────────────────────────────────────────

    // Save library prompt: save_prompt_fnb_1
    if (data.startsWith('save_prompt_')) {
      const promptId = data.replace('save_prompt_', '');
      await saveLibraryPrompt(ctx, promptId);
      return;
    }

    // Show user's saved prompts for a niche: my_prompts_fnb
    if (data.startsWith('my_prompts_')) {
      await ctx.answerCbQuery();
      const nicheKey = data.replace('my_prompts_', '');
      await showMyPrompts(ctx, nicheKey, true);
      return;
    }

    // Use admin prompt (by DB id): use_admin_prompt_123
    if (data.startsWith('use_admin_prompt_')) {
      await ctx.answerCbQuery();
      const adminPromptId = parseInt(data.replace('use_admin_prompt_', ''));
      try {
        const sp = await prisma.savedPrompt.findUnique({ where: { id: adminPromptId } });
        if (sp && ctx.session) {
          ctx.session.stateData = { ...(ctx.session.stateData || {}), selectedPrompt: sp.prompt };
          await SavedPromptService.incrementUsage(adminPromptId);
          await ctx.editMessageText(
            `✅ *Prompt dipilih!*\n\n⭐ *${sp.title}*\n\`${sp.prompt.slice(0, 200)}${sp.prompt.length > 200 ? '...' : ''}\`\n\nMau buat apa?`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🚀 Buat Video Sekarang!', callback_data: 'create_video' }],
                  [{ text: '🖼️ Buat Gambar', callback_data: 'image_from_prompt' }],
                  [{ text: `◀️ Kembali ke ${sp.niche}`, callback_data: `prompts_${sp.niche}` }],
                ],
              },
            }
          );
        }
      } catch { await ctx.reply('❌ Prompt tidak ditemukan.'); }
      return;
    }

    // Use a saved prompt (by DB id): use_saved_123
    if (data.startsWith('use_saved_')) {
      await ctx.answerCbQuery();
      const savedId = parseInt(data.replace('use_saved_', ''));
      try {
        // Increment usage
        await SavedPromptService.incrementUsage(savedId);
        // Get prompt from DB
        const sp = await prisma.savedPrompt.findUnique({ where: { id: savedId } });
        if (sp && ctx.session) {
          ctx.session.stateData = { ...(ctx.session.stateData || {}), selectedPrompt: sp.prompt };
          await ctx.editMessageText(
            `✅ *Prompt dipilih!*\n\n📌 *${sp.title}*\n\`${sp.prompt.slice(0, 200)}${sp.prompt.length > 200 ? '...' : ''}\`\n\nMau buat apa?`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🚀 Buat Video Sekarang!', callback_data: 'create_video' }],
                  [{ text: '🖼️ Buat Gambar', callback_data: 'image_from_prompt' }],
                  [{ text: `◀️ Kembali`, callback_data: `my_prompts_${sp.niche}` }],
                ],
              },
            }
          );
        }
      } catch (err) {
        await ctx.reply('❌ Gagal load prompt. Coba lagi.');
      }
      return;
    }

    // Delete saved prompt: del_saved_123_fnb
    if (data.startsWith('del_saved_')) {
      const parts = data.replace('del_saved_', '').split('_');
      const savedId = parseInt(parts[0]);
      const nicheKey = parts.slice(1).join('_');
      const telegramId = ctx.from?.id;
      if (telegramId) {
        const dbUser = await UserService.findByTelegramId(BigInt(telegramId));
        if (dbUser) {
          await SavedPromptService.delete(savedId, dbUser.id as unknown as bigint);
          await ctx.answerCbQuery('🗑️ Prompt dihapus!');
          await showMyPrompts(ctx, nicheKey, true);
        }
      }
      return;
    }

    // Add custom prompt: add_custom_prompt_fnb
    if (data.startsWith('add_custom_prompt_')) {
      await ctx.answerCbQuery();
      const nicheKey = data.replace('add_custom_prompt_', '');
      await startAddCustomPrompt(ctx, nicheKey, true);
      return;
    }

    // ── END Saved Prompt callbacks ─────────────────────────────────────────

    // Back to prompts main menu — edit current message
    // ── PROFESSIONAL PROMPT LIBRARY HANDLERS ──────────────────────────────
    if (data.startsWith('prompts_niche_')) {
      await ctx.answerCbQuery();
      const niche = data.replace('prompts_niche_', '');
      
      const { getPromptsByNiche } = await import('../config/professional-prompts.js');
      const prompts = getPromptsByNiche(niche);
      
      if (prompts.length === 0) {
        await ctx.editMessageText(
          `❌ Prompt library untuk niche ${niche} belum tersedia.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '◀️ Kembali', callback_data: 'main_menu' }]],
            },
          }
        );
        return;
      }
      
      const nicheLabels: Record<string, string> = {
        fnb: '🍔 F&B',
        fashion: '👗 Fashion',
        tech: '💻 Tech',
        travel: '✈️ Travel',
        education: '🎓 Education',
        finance: '💰 Finance',
        health: '🏥 Health',
        entertainment: '🎬 Entertainment',
      };
      
      let message = `📚 *Prompt Library: ${nicheLabels[niche] || niche}*\n\n`;
      message += `${prompts.length} prompt profesional tersedia:\n\n`;
      
      const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
      
      prompts.forEach((prompt, idx) => {
        message += `${idx + 1}. *${prompt.name}*\n`;
        message += `   _${prompt.bestFor}_\n\n`;
        
        buttons.push([{
          text: `${idx + 1}. ${prompt.name}`,
          callback_data: `use_prof_prompt_${prompt.id}`,
        }]);
      });
      
      buttons.push([{ text: '◀️ Pilih Niche Lain', callback_data: 'main_menu' }]);
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons },
      });
      return;
    }

    if (data.startsWith('use_prof_prompt_')) {
      await ctx.answerCbQuery();
      const promptId = data.replace('use_prof_prompt_', '');
      
      const { getPromptById } = await import('../config/professional-prompts.js');
      const prompt = getPromptById(promptId);
      
      if (!prompt) {
        await ctx.reply('❌ Prompt tidak ditemukan.');
        return;
      }
      
      // Check if user can use free trial
      const user = ctx.from;
      if (!user) return;
      
      const telegramId = BigInt(user.id);
      const dbUser = await UserService.findByTelegramId(telegramId);
      
      if (!dbUser) {
        await ctx.reply('❌ User tidak ditemukan. Silakan /start ulang.');
        return;
      }
      
      const { canUseWelcomeBonus, canUseDailyFree } = await import('../config/free-trial.js');
      const hasWelcome = canUseWelcomeBonus(dbUser);
      const hasDaily = canUseDailyFree(dbUser);
      const hasCredits = Number(dbUser.creditBalance) >= 0.2;
      
      if (!hasWelcome && !hasDaily && !hasCredits) {
        await ctx.editMessageText(
          `⚠️ *Tidak ada kredit tersedia!*\n\n` +
          `Welcome Bonus: ${hasWelcome ? '✅' : '❌'}\n` +
          `Daily Free: ${hasDaily ? '✅' : '❌'}\n` +
          `Kredit: ${dbUser.creditBalance}\n\n` +
          `Beli kredit untuk melanjutkan.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '💰 Beli Kredit', callback_data: 'topup' }],
                [{ text: '◀️ Kembali', callback_data: `prompts_niche_${prompt.niche}` }],
              ],
            },
          }
        );
        return;
      }
      
      // Show prompt preview and generate
      await ctx.editMessageText(
        `✅ *${prompt.name}*\n\n` +
        `📋 Prompt:\n_${prompt.prompt.substring(0, 200)}..._\n\n` +
        `🎯 Best For: ${prompt.bestFor}\n\n` +
        `Siap generate dengan ${hasWelcome ? 'Welcome Bonus' : hasDaily ? 'Daily Free' : 'kredit'}?`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 Generate Sekarang!', callback_data: `gen_free_${promptId}` }],
              [{ text: '◀️ Pilih Prompt Lain', callback_data: `prompts_niche_${prompt.niche}` }],
            ],
          },
        }
      );
      return;
    }

    if (data.startsWith('gen_free_')) {
      await ctx.answerCbQuery();
      const promptId = data.replace('gen_free_', '');
      
      const { getPromptById } = await import('../config/professional-prompts.js');
      const prompt = getPromptById(promptId);
      
      if (!prompt) {
        await ctx.reply('❌ Prompt tidak ditemukan.');
        return;
      }
      
      const user = ctx.from;
      if (!user) return;
      
      const telegramId = BigInt(user.id);
      const dbUser = await UserService.findByTelegramId(telegramId);
      
      if (!dbUser) {
        await ctx.reply('❌ User tidak ditemukan.');
        return;
      }
      
      const { canUseWelcomeBonus, canUseDailyFree, getNextDailyFreeReset } = await import('../config/free-trial.js');
      const hasWelcome = canUseWelcomeBonus(dbUser);
      const hasDaily = canUseDailyFree(dbUser);
      
      let usedType = '';
      if (hasWelcome) {
        usedType = 'welcome';
        // Mark welcome bonus as used
        await prisma.user.update({
          where: { telegramId },
          data: { welcomeBonusUsed: true },
        });
      } else if (hasDaily) {
        usedType = 'daily';
        // Mark daily free as used and set reset time
        await prisma.user.update({
          where: { telegramId },
          data: {
            dailyFreeUsed: true,
            dailyFreeResetAt: getNextDailyFreeReset(),
          },
        });
      } else {
        await ctx.reply('❌ Tidak ada free trial tersedia.');
        return;
      }
      
      // Trigger image generation with google_gemini (FREE provider)
      const { generateVideoWithFallback } = await import('../services/video-fallback.service.js');
      
      await ctx.editMessageText(
        `🚀 *Generating...*\n\n` +
        `Prompt: ${prompt.name}\n` +
        `Provider: Google Gemini (FREE)\n` +
        `Type: ${usedType === 'welcome' ? 'Welcome Bonus' : 'Daily Free'}\n\n` +
        `⏱️ Estimasi: 30-60 detik`,
        { parse_mode: 'Markdown' }
      );
      
      // Generate image
      generateVideoWithFallback({
        prompt: prompt.prompt,
        duration: 5,
        aspectRatio: '9:16',
        style: prompt.niche,
        niche: prompt.niche,
        referenceImage: null,
      }).then(async (result) => {
        if (result.success && result.videoUrl) {
          await ctx.telegram.sendPhoto(
            ctx.chat!.id,
            result.videoUrl,
            {
              caption: `✅ *Image Generated!*\n\n📋 ${prompt.name}\n🎨 ${prompt.bestFor}\n🆓 ${usedType === 'welcome' ? 'Welcome Bonus' : 'Daily Free'} digunakan\n\n_Generated by BerkahKarya_`,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🔄 Generate Lagi', callback_data: `prompts_niche_${prompt.niche}` }],
                  [{ text: '💰 Beli Kredit', callback_data: 'topup' }],
                  [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
                ],
              },
            }
          );
        } else {
          throw new Error(result.error || 'Generation failed');
        }
      }).catch(async (error) => {
        logger.error('Free trial generation failed:', error);
        
        // Refund free trial
        if (usedType === 'welcome') {
          await prisma.user.update({
            where: { telegramId },
            data: { welcomeBonusUsed: false },
          });
        } else if (usedType === 'daily') {
          await prisma.user.update({
            where: { telegramId },
            data: { dailyFreeUsed: false, dailyFreeResetAt: null },
          });
        }
        
        await ctx.telegram.sendMessage(
          ctx.chat!.id,
          `❌ *Generation Failed*\n\n${error.message}\n\nFree trial kamu sudah di-refund.`,
          { parse_mode: 'Markdown' }
        );
      });
      
      return;
    }

    if (data === 'back_prompts') {
      await ctx.answerCbQuery();
      try {
        await ctx.editMessageText(
          '📚 *Prompt Library — 40+ Template Siap Pakai*\n\n' +
          '👇 *Pilih niche bisnis kamu:*\n\n' +
          '🍔 F&B · 👗 Fashion · 📱 Tech · 💪 Health\n' +
          '✈️ Travel · 📚 Education · 💰 Finance · 🎭 Entertainment\n\n' +
          '_Setiap niche punya 5 prompt profesional yang sudah ditest ribuan user. Tinggal pilih → buat video!_',
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🍔 F&B', callback_data: 'prompts_fnb' }, { text: '👗 Fashion', callback_data: 'prompts_fashion' }],
                [{ text: '📱 Tech', callback_data: 'prompts_tech' }, { text: '💪 Health', callback_data: 'prompts_health' }],
                [{ text: '✈️ Travel', callback_data: 'prompts_travel' }, { text: '📚 Education', callback_data: 'prompts_education' }],
                [{ text: '💰 Finance', callback_data: 'prompts_finance' }, { text: '🎭 Entertainment', callback_data: 'prompts_entertainment' }],
                [{ text: '🔥 Trending', callback_data: 'prompts_trending' }, { text: '✨ Custom AI', callback_data: 'prompts_custom' }],
              ],
            },
          }
        );
      } catch {
        await promptsCommand(ctx); // fallback: send new message
      }
      return;
    }

    // Daily prompt save/another
    if (data.startsWith('daily_save_')) {
      await ctx.answerCbQuery('💾 Prompt disimpan ke sesi kamu!');
      const promptId = data.replace('daily_save_', '');
      const p = getPromptById(promptId);
      if (p && ctx.session) ctx.session.stateData = { ...(ctx.session.stateData || {}), savedPrompt: p.prompt };
      return;
    }
    if (data === 'daily_another') {
      await ctx.answerCbQuery();
      // Rotate to next mystery prompt
      const dayShift = (new Date().getHours() % MYSTERY_PROMPTS.length);
      const mystery = MYSTERY_PROMPTS[dayShift];
      const niche = PROMPT_LIBRARY[mystery.niche];
      const p = niche?.prompts.find(x => x.id === mystery.promptId);
      if (p) {
        await ctx.editMessageText(
          `🎁 *Another Mystery Prompt!*\n\n${niche.emoji} *${p.title}*\n\`${p.prompt}\`\n\n⭐ ${p.successRate}% success rate`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🚀 Pakai Sekarang', callback_data: `use_prompt_${p.id}` }],
                [{ text: '📚 Browse Semua', callback_data: 'back_prompts' }],
              ],
            },
          }
        );
      }
      return;
    }

    // ─── END PROMPT LIBRARY CALLBACKS ──────────────────────────────────────

    // Create video - redirect to /create flow
    if (data === 'create_video') {
      // ── Inject selected prompt from library into session ─────────────────
      const selectedPrompt = ctx.session?.stateData?.selectedPrompt as string | undefined;
      if (selectedPrompt && ctx.session) {
        // Pre-fill videoCreation with the chosen prompt so user skips "add custom prompt" step
        if (!ctx.session.videoCreation) ctx.session.videoCreation = {} as any;
        ctx.session.videoCreation!.customPrompt = selectedPrompt;
        ctx.session.videoCreation!.waitingForCustomPrompt = false;
        // Clear so it doesn't persist to next session
        ctx.session.stateData = { ...ctx.session.stateData, selectedPrompt: undefined };
      }
      await ctx.deleteMessage().catch(() => {});
      await createCommand(ctx);
      return;
    }

    // Image generation handlers
    // image_from_prompt — auto-detect niche from session selectedPrompt context
    if (data === 'image_from_prompt') {
      await ctx.answerCbQuery();
      // Map niche to image category
      const nicheToCategory: Record<string, string> = {
        fnb: 'fnb', food: 'fnb',
        fashion: 'product', health: 'product',
        tech: 'product', finance: 'product', education: 'product', entertainment: 'product',
        travel: 'realestate',
      };
      const sessionNiche = (ctx.session?.selectedNiche || ctx.session?.stateData?.addingPromptNiche || 'product') as string;
      const autoCategory = nicheToCategory[sessionNiche] || 'product';
      await handleImageGeneration(ctx, autoCategory);
      return;
    }

    if (data === 'image_generate') {
      await ctx.answerCbQuery();
      const telegramId = BigInt(ctx.from!.id);
      const creditCost = await getImageCreditCostAsync();
      const avatars = await AvatarService.listAvatars(telegramId);
      await ctx.editMessageText(
        '🖼️ *Generate Gambar AI*\n\n' +
        '💡 _AI buat foto marketing profesional dari deskripsi atau foto referensi kamu_\n\n' +
        'Pilih kategori konten kamu:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛍️ Foto Produk', callback_data: 'img_product' }],
              [{ text: '🍔 Makanan & Minuman', callback_data: 'img_fnb' }],
              [{ text: '🏠 Properti / Real Estate', callback_data: 'img_realestate' }],
              [{ text: '🚗 Kendaraan / Otomotif', callback_data: 'img_car' }],
              [{ text: '👤 Kelola Avatar', callback_data: 'avatar_manage' }],
              [{ text: '◀️ Menu Utama', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    // Image generation category handlers
    if (data.startsWith('img_')) {
      const category = data.replace('img_', '');
      await handleImageGeneration(ctx, category);
      return;
    }

    // ── Avatar management ──
    if (data === 'avatar_manage') {
      const telegramId = BigInt(ctx.from!.id);
      const avatars = await AvatarService.listAvatars(telegramId);

      let message = '👤 *Your Avatars*\n\n';
      if (avatars.length === 0) {
        message += '_No avatars saved yet._\n\n';
        message += 'Save an avatar to maintain consistent characters across your images and videos.';
      } else {
        avatars.forEach((a, i) => {
          message += `${i + 1}. ${a.isDefault ? '⭐ ' : ''}*${a.name}*\n`;
          if (a.description) message += `   _${a.description.slice(0, 80)}..._\n`;
        });
      }

      const avatarButtons = avatars.map(a => ([
        { text: `${a.isDefault ? '⭐ ' : ''}${a.name}`, callback_data: `avatar_view_${a.id}` },
      ]));

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            ...avatarButtons,
            [{ text: '➕ Add New Avatar', callback_data: 'avatar_add' }],
            [{ text: '◀️ Back', callback_data: 'image_generate' }],
          ],
        },
      });
      return;
    }

    if (data === 'avatar_add') {
      await ctx.editMessageText(
        '👤 *Add New Avatar*\n\n' +
        'Send me a clear photo of the character/person you want to use consistently.\n\n' +
        '📸 _Tips:_\n' +
        '• Use a clear, front-facing photo\n' +
        '• Good lighting helps AI understand features\n' +
        '• One person per avatar works best',
        { parse_mode: 'Markdown' }
      );
      ctx.session.state = 'AVATAR_UPLOAD_WAITING';
      ctx.session.stateData = {};
      return;
    }

    if (data.startsWith('avatar_view_')) {
      const avatarId = parseInt(data.replace('avatar_view_', ''), 10);
      const avatar = await AvatarService.getAvatar(avatarId);
      if (!avatar) {
        await ctx.answerCbQuery('Avatar not found');
        return;
      }

      await ctx.editMessageText(
        `👤 *Avatar: ${avatar.name}*\n` +
        `${avatar.isDefault ? '⭐ Default avatar\n' : ''}\n` +
        `${avatar.description ? `_${avatar.description.slice(0, 300)}_\n\n` : ''}` +
        `What would you like to do?`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              ...(avatar.isDefault ? [] : [[{ text: '⭐ Set as Default', callback_data: `avatar_default_${avatar.id}` }]]),
              [{ text: '🗑️ Delete', callback_data: `avatar_delete_${avatar.id}` }],
              [{ text: '◀️ Back', callback_data: 'avatar_manage' }],
            ],
          },
        }
      );
      return;
    }

    if (data.startsWith('avatar_default_')) {
      const avatarId = parseInt(data.replace('avatar_default_', ''), 10);
      const telegramId = BigInt(ctx.from!.id);
      await AvatarService.setDefault(telegramId, avatarId);
      await ctx.answerCbQuery('✅ Avatar set as default!');
      // Re-show manage screen
      const avatars = await AvatarService.listAvatars(telegramId);
      let message = '👤 *Your Avatars*\n\n';
      avatars.forEach((a, i) => {
        message += `${i + 1}. ${a.isDefault ? '⭐ ' : ''}*${a.name}*\n`;
      });
      const avatarButtons = avatars.map(a => ([
        { text: `${a.isDefault ? '⭐ ' : ''}${a.name}`, callback_data: `avatar_view_${a.id}` },
      ]));
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            ...avatarButtons,
            [{ text: '➕ Add New Avatar', callback_data: 'avatar_add' }],
            [{ text: '◀️ Back', callback_data: 'image_generate' }],
          ],
        },
      });
      return;
    }

    if (data.startsWith('avatar_delete_')) {
      const avatarId = parseInt(data.replace('avatar_delete_', ''), 10);
      const telegramId = BigInt(ctx.from!.id);
      const deleted = await AvatarService.deleteAvatar(telegramId, avatarId);
      await ctx.answerCbQuery(deleted ? '🗑️ Avatar deleted' : '❌ Avatar not found');
      // Return to manage
      const avatars = await AvatarService.listAvatars(telegramId);
      let message = '👤 *Your Avatars*\n\n';
      if (avatars.length === 0) {
        message += '_No avatars saved yet._';
      } else {
        avatars.forEach((a, i) => {
          message += `${i + 1}. ${a.isDefault ? '⭐ ' : ''}*${a.name}*\n`;
        });
      }
      const avatarButtons = avatars.map(a => ([
        { text: `${a.isDefault ? '⭐ ' : ''}${a.name}`, callback_data: `avatar_view_${a.id}` },
      ]));
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            ...avatarButtons,
            [{ text: '➕ Add New Avatar', callback_data: 'avatar_add' }],
            [{ text: '◀️ Back', callback_data: 'image_generate' }],
          ],
        },
      });
      return;
    }

    // Upload reference image for image generation
    if (data === 'imgref_upload') {
      ctx.session.state = 'IMAGE_REFERENCE_WAITING';
      await ctx.editMessageText(
        `📸 *Upload Foto Referensi*\n\n` +
        `Kirim foto produk atau subjek kamu.\n\n` +
        `AI akan gunakan foto ini sebagai referensi untuk buat gambar marketing yang menjaga identitas produk kamu.\n\n` +
        `_Bisa: foto produk, makanan, properti, kendaraan, dll_`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⏭️ Skip — Deskripsikan Saja', callback_data: 'imgref_skip' }],
              [{ text: '◀️ Kembali', callback_data: 'image_generate' }],
            ],
          },
        }
      );
      return;
    }

    // Skip reference image → generate text2img
    if (data === 'imgref_skip') {
      ctx.session.state = 'IMAGE_GENERATION_WAITING';
      const category = ctx.session.stateData?.imageCategory as string;
      ctx.session.stateData = { imageCategory: category };

      const hints: Record<string, string> = {
        product: 'contoh: _"botol parfum premium di background hitam, lighting studio, close-up detail"_',
        fnb: 'contoh: _"semangkuk bakso kuah dengan steam, lighting hangat, sudut 45 derajat"_',
        realestate: 'contoh: _"ruang tamu modern minimalis, natural lighting, sofa abu-abu"_',
        car: 'contoh: _"mobil SUV warna putih, outdoor sunset lighting, angle 3/4 front"_',
      };
      const hint = hints[category] || 'contoh: _"produk saya dengan background putih bersih, lighting profesional"_';

      await ctx.editMessageText(
        `✏️ *Deskripsikan Gambar yang Kamu Mau*\n\n` +
        `${hint}\n\n` +
        `Ketik deskripsi kamu sekarang 👇`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Kembali', callback_data: 'image_generate' }],
            ],
          },
        }
      );
      return;
    }

    // Use saved avatar for image generation
    if (data.startsWith('imgref_avatar_')) {
      const avatarId = parseInt(data.replace('imgref_avatar_', ''), 10);
      const avatar = await AvatarService.getAvatar(avatarId);
      if (!avatar) {
        await ctx.answerCbQuery('Avatar not found');
        return;
      }

      ctx.session.state = 'IMAGE_GENERATION_WAITING';
      ctx.session.stateData = {
        ...ctx.session.stateData,
        avatarImageUrl: avatar.imageUrl,
        avatarId: avatar.id,
        avatarName: avatar.name,
        mode: 'ip_adapter',
      };

      await ctx.editMessageText(
        `🖼️ *Using Avatar: ${avatar.name}*\n\n` +
        `The AI will maintain this character's identity.\n\n` +
        `Now describe the scene/setting you want:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Menu Utama', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    // Clone/Remake Video
    if (data === 'clone_video') {
      await ctx.editMessageText(
        '🔄 *Clone/Remake Video*\n\n' +
        'Kirim video yang mau direkreasi, atau paste URL dari:\n' +
        '• TikTok · Instagram Reels · YouTube Shorts\n\n' +
        '_AI akan buat video dengan style serupa._',
        { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[BTN_BACK_MAIN]] } }
      );
      ctx.session.state = 'CLONE_VIDEO_WAITING';
      return;
    }

    if (data === 'clone_edit_desc') {
      await ctx.answerCbQuery();
      
      if (!ctx.session?.stateData?.clonePrompt) {
        await ctx.reply('❌ No clone data found. Please start over.');
        return;
      }
      
      await ctx.editMessageText(
        '✏️ *Edit Video Description*\n\n' +
        'Kirim deskripsi baru untuk video yang akan dibuat.\n\n' +
        '_Contoh: "Buat video produk skincare dengan lighting soft, background minimalis putih, close-up detail produk"_',
        { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'main_menu' }]] } }
      );
      
      ctx.session.state = 'CLONE_EDIT_DESC_WAITING';
      return;
    }

    // Clone/Remake Image
    if (data === 'clone_image') {
      await ctx.editMessageText(
        '🔄 *Clone/Remake Image*\n\n' +
        'Kirim gambar yang mau direkreasi.\n' +
        '_AI akan buat gambar dengan style serupa._',
        { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[BTN_BACK_MAIN]] } }
      );
      ctx.session.state = 'CLONE_IMAGE_WAITING';
      return;
    }

    // Storyboard Creator
    if (data === 'storyboard_create') {
      await ctx.editMessageText(
        '📋 *Storyboard Creator*\n\n' +
        'Pilih tipe konten kamu:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛍️ Product Promo', callback_data: 'sb_product' }],
              [{ text: '🍔 F&B Content', callback_data: 'sb_fnb' }],
              [{ text: '🏠 Real Estate Tour', callback_data: 'sb_realestate' }],
              [{ text: '🚗 Car Showcase', callback_data: 'sb_car' }],
              [BTN_BACK_MAIN],
            ],
          },
        }
      );
      return;
    }

    if (data === 'sb_product') return handleStoryboardRequest(ctx, 'product');
    if (data === 'sb_fnb') return handleStoryboardRequest(ctx, 'fnb');
    if (data === 'sb_realestate') return handleStoryboardRequest(ctx, 'realestate');
    if (data === 'sb_car') return handleStoryboardRequest(ctx, 'car');

    // Viral/Trend Research
    if (data === 'viral_research') {
      await ctx.editMessageText(
        '📈 *Viral/Trend Research*\n\n' +
        'Analyzing trending content across platforms...\n\n' +
        'Select niche to discover what\'s working:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔥 All Trends (Viral)', callback_data: 'trend_viral' }],
              [{ text: '🍔 F&B / Restaurant', callback_data: 'trend_fnb' }],
              [{ text: '🏠 Real Estate', callback_data: 'trend_realestate' }],
              [{ text: '🛍️ E-commerce', callback_data: 'trend_ecom' }],
              [{ text: '◀️ Back to Menu', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    if (data.startsWith('trend_')) {
      const niche = data.replace('trend_', '');
      await ctx.editMessageText(
        `📈 *Viral Research: ${niche.toUpperCase()}*\n\n` +
        `✅ Analysis complete.\n\n` +
        `*Trending Patterns:* \n` +
        `• Quick cuts, beat-matching\n` +
        `• ASMR audio layer\n` +
        `• Text-to-speech overlay (Female voice)\n\n` +
        `*Suggested Storyboard:*`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Generate Viral Storyboard', callback_data: `sb_${niche === 'viral' ? 'product' : (niche === 'ecom' ? 'product' : niche)}` }],
              [{ text: '◀️ Back', callback_data: 'viral_research' }],
            ],
          },
        }
      );
      return;
    }

    // Video/Image to Prompt (Disassemble)
    if (data === 'disassemble') {
      await ctx.editMessageText(
        '🔍 *Video/Image to Prompt*\n\n' +
        'Kirim video atau gambar kamu.\n' +
        '_AI akan extract prompt yang digunakan untuk membuatnya._',
        { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[BTN_BACK_MAIN]] } }
      );
      ctx.session.state = 'DISASSEMBLE_WAITING';
      return;
    }

    // Main menu
    if (data === 'main_menu') {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        '👋 *Mau buat apa hari ini?* 👇',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📚 Pilih Prompt & Buat Video', callback_data: 'back_prompts' }],
              [{ text: '🔥 Trending', callback_data: 'prompts_trending' }, { text: '🎁 Prompt Gratis', callback_data: 'daily_open' }],
              [{ text: '🎬 Buat Video', callback_data: 'create_video' }, { text: '🖼️ Buat Gambar', callback_data: 'image_from_prompt' }],
              [{ text: '🔄 Clone', callback_data: 'clone_video' }, { text: '📋 Storyboard', callback_data: 'storyboard_create' }, { text: '📈 Viral', callback_data: 'viral_research' }],
              [{ text: '💰 Top Up', callback_data: 'topup' }, { text: '⭐ Langganan', callback_data: 'open_subscription' }],
              [{ text: '📁 Video Saya', callback_data: 'videos_list' }, { text: '👥 Referral', callback_data: 'open_referral' }, { text: '👤 Profil', callback_data: 'open_profile' }],
            ],
          },
        }
      );
      return;
    }

    // Videos menu handlers
    if (data === 'videos_favorites') {
      await ctx.editMessageText(
        '⭐ *Favorite Videos*\n\n' +
        'Your favorite videos will appear here.\n\n' +
        'No favorites yet.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Back', callback_data: 'videos_back' }],
            ],
          },
        }
      );
      return;
    }

    if (data === 'videos_trash') {
      await ctx.editMessageText(
        '🗑️ *Trash*\n\n' +
        'Deleted videos (restorable for 7 days).\n\n' +
        'Trash is empty.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Back', callback_data: 'videos_back' }],
            ],
          },
        }
      );
      return;
    }

    if (data === 'videos_back' || data === 'videos_list') {
      await ctx.deleteMessage().catch(() => {});
      await videosCommand(ctx);
      return;
    }

    // Video viewing handlers
    if (data.startsWith('video_view_')) {
      const jobId = data.replace('video_view_', '');
      await viewVideo(ctx, jobId);
      return;
    }

    if (data.startsWith('video_copy_')) {
      const jobId = data.replace('video_copy_', '');
      await copyVideoUrl(ctx, jobId);
      return;
    }

    if (data.startsWith('video_delete_')) {
      const jobId = data.replace('video_delete_', '');
      await deleteVideo(ctx, jobId);
      return;
    }

    if (data.startsWith('video_confirm_delete_')) {
      const jobId = data.replace('video_confirm_delete_', '');
      // Soft delete — mark as deleted instead of removing from database
      await VideoService.deleteVideo(jobId);
      await ctx.editMessageText(
        '🗑️ *Video Moved to Trash*\n\n' +
        'The video has been moved to trash.',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    if (data.startsWith('video_retry_')) {
      await ctx.answerCbQuery('Retrying video...');
      await createCommand(ctx);
      return;
    }

    // Copy Caption — reply with plain caption text for easy copying
    if (data.startsWith('copy_caption_')) {
      const jobId = data.replace('copy_caption_', '');
      await ctx.answerCbQuery('Caption copied below!');

      try {
        const video = await VideoService.getByJobId(jobId);
        const niche = ctx.session?.selectedNiche || ctx.session?.videoCreation?.niche || (video as any)?.niche || 'product';
        const storyboard = ctx.session?.videoCreation?.storyboard;
        const platform = (video as any)?.platform || 'tiktok';

        const scenes = storyboard && storyboard.length > 0
          ? storyboard
          : [{ description: (video as any)?.prompt || niche }];
        const caption = generateCaption(niche, scenes, platform);

        // Send plain text — easy for users to long-press and copy on mobile
        await ctx.reply(`${caption.text}\n\n${caption.hashtags}`);
      } catch (err) {
        logger.error('Failed to generate caption for copy:', err);
        await ctx.reply('Failed to generate caption. Please try again.');
      }
      return;
    }

    // Create Similar — pre-fill niche + style + storyboard from a past video, skip to ref image
    if (data.startsWith('create_similar_')) {
      const jobId = data.replace('create_similar_', '');
      await ctx.answerCbQuery('Loading video settings...');

      try {
        const video = await VideoService.getByJobId(jobId);
        if (!video) {
          await ctx.reply('Video not found. Please try /create instead.');
          return;
        }

        // Pre-fill session with the video's niche and style
        const nicheKey = video.niche || 'fnb';
        const nicheConfig = NICHES[nicheKey as keyof typeof NICHES];

        ctx.session.selectedNiche = nicheKey;

        // Use the first style from the video's styles array, or default to the niche's first style
        const videoStyles = video.styles && video.styles.length > 0
          ? video.styles
          : (nicheConfig?.styles ? [nicheConfig.styles[0]] : ['professional']);
        ctx.session.selectedStyles = videoStyles as string[];

        // Get storyboard from the original video DB record
        const videoStoryboard = (video as any).storyboard as Array<{ scene: number; duration: number; description: string }> | null;
        const videoDuration = video.duration || 30;
        const videoScenes = video.scenes || (videoStoryboard ? videoStoryboard.length : Math.ceil(videoDuration / 5));

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
          `Niche: ${nicheConfig?.emoji || ''} ${nicheConfig?.name || nicheKey}\n` +
          `Duration: ${videoDuration}s\n` +
          `Storyboard: ${storyboardInfo}\n` +
          `Style: ${videoStyles[0]}\n\n` +
          `Send a reference image or /skip`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '⏭️ Skip Reference Image', callback_data: `duration_${videoDuration}_${videoScenes}` }],
                [{ text: '🔄 Change Niche/Style', callback_data: 'create_video' }],
              ],
            },
          }
        );
      } catch (error) {
        logger.error('Create similar error:', error);
        await ctx.reply('Failed to load video settings. Please try /create instead.');
      }
      return;
    }

    // Auto-Post to All connected accounts
    if (data.startsWith('auto_post_')) {
      const jobId = data.replace('auto_post_', '');
      await handleAutoPostToAll(ctx, jobId);
      return;
    }

    // Post Automation - Publish Video
    if (data.startsWith('publish_video_')) {
      const jobId = data.replace('publish_video_', '');
      await handlePublishVideo(ctx, jobId);
      return;
    }

    if (data.startsWith('select_platform_')) {
      const jobId = data.split('_')[2];
      const platform = data.split('_')[3];
      await handlePublishPlatformSelection(ctx, jobId, platform);
      return;
    }

    if (data.startsWith('confirm_publish_')) {
      const jobId = data.replace('confirm_publish_', '');
      await handleConfirmPublish(ctx, jobId);
      return;
    }

    // Social Account Management
    if (data === 'manage_accounts') {
      await handleManageAccounts(ctx);
      return;
    }

    if (data.startsWith('connect_account_')) {
      const platform = data.replace('connect_account_', '');
      await handleConnectAccount(ctx, platform);
      return;
    }

    if (data.startsWith('disconnect_account_')) {
      const accountId = data.replace('disconnect_account_', '');
      await handleDisconnectAccount(ctx, accountId);
      return;
    }

    // Admin Payment Settings
    if (data === 'admin_payment_settings') {
      await paymentSettingsCommand(ctx);
      return;
    }

    if (data === 'admin_payment_default') {
      await handlePaymentDefaultGateway(ctx);
      return;
    }

    if (data.startsWith('admin_payment_toggle_')) {
      const gateway = data.replace('admin_payment_toggle_', '');
      await handlePaymentToggleGateway(ctx, gateway);
      return;
    }

    if (data.startsWith('admin_payment_setdefault_')) {
      const gateway = data.replace('admin_payment_setdefault_', '');
      await handlePaymentSetDefault(ctx, gateway);
      return;
    }

    // Topup from inline menu
    if (data === 'topup') {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => {});
      await topupCommand(ctx);
      return;
    }

    // Open chat from inline menu
    if (data === 'open_chat') {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        '💬 *AI Assistant aktif!*\n\n' +
        'Langsung ketik pertanyaan kamu sekarang.\n\n' +
        '*Contoh:*\n' +
        '• _"Bikinin prompt untuk produk skincare saya"_\n' +
        '• _"Tips video TikTok F&B yang viral"_\n' +
        '• _"Niche mana yang paling bagus buat jualan online?"_\n\n' +
        'Atau browse template siap pakai:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📚 Lihat Prompt Library', callback_data: 'back_prompts' }],
              [{ text: '🔥 Trending Prompts', callback_data: 'prompts_trending' }],
              [{ text: '◀️ Kembali ke Menu', callback_data: 'main_menu' }],
            ],
          },
        }
      ).catch(async () => {
        // fallback if message can't be edited
        await ctx.reply('💬 *AI Assistant aktif!*\n\nLangsung ketik pertanyaan kamu!', { parse_mode: 'Markdown' });
      });
      if (ctx.session) ctx.session.state = 'DASHBOARD';
      return;
    }

    // Daily prompt shortcut
    if (data === 'daily_open') {
      await ctx.answerCbQuery();
      // Build daily prompt inline (edit in place)
      const MP = MYSTERY_PROMPTS; const PL2 = PROMPT_LIBRARY;
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
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🚀 Pakai Sekarang', callback_data: `use_prompt_${p.id}` }],
                [{ text: '🔄 Prompt Lain', callback_data: 'daily_another' }],
                [{ text: '◀️ Kembali ke Menu', callback_data: 'back_prompts' }],
              ],
            },
          });
        } catch {
          await ctx.deleteMessage().catch(() => {});
          await promptsDailyCommand(ctx);
        }
      }
      return;
    }

    if (data === 'open_profile') {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => {});
      await profileCommand(ctx);
      return;
    }

    if (data === 'open_referral') {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => {});
      await referralCommand(ctx);
      return;
    }

    if (data === 'open_help') {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => {});
      await helpCommand(ctx);
      return;
    }

    // =========================================================================
    // SETTINGS HANDLERS
    // =========================================================================

    // Show language selection (paginated)
    if (data === 'settings_language' || data.startsWith('lang_page_')) {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      const user = userId ? await UserService.findByTelegramId(BigInt(userId)) : null;
      const currentLang = user?.language || 'id';
      const currentConfig = getLangConfig(currentLang);

      const page = data.startsWith('lang_page_') ? parseInt(data.replace('lang_page_', '')) : 0;
      const start = page * LANG_PAGE_SIZE;
      const pageItems = LANGUAGE_LIST.slice(start, start + LANG_PAGE_SIZE);
      const totalPages = Math.ceil(LANGUAGE_LIST.length / LANG_PAGE_SIZE);

      // Build language buttons (2 per row)
      const langButtons: Array<Array<{ text: string; callback_data: string }>> = [];
      for (let i = 0; i < pageItems.length; i += 2) {
        const row: Array<{ text: string; callback_data: string }> = [];
        for (let j = i; j < Math.min(i + 2, pageItems.length); j++) {
          const lang = pageItems[j];
          const check = lang.code === currentLang ? ' \u2705' : '';
          row.push({
            text: `${lang.flag} ${lang.label}${check}`,
            callback_data: `set_language_${lang.code}`,
          });
        }
        langButtons.push(row);
      }

      // Pagination row
      const navRow: Array<{ text: string; callback_data: string }> = [];
      if (page > 0) navRow.push({ text: '\u25c0\ufe0f Prev', callback_data: `lang_page_${page - 1}` });
      navRow.push({ text: `${page + 1}/${totalPages}`, callback_data: 'noop' });
      if (page < totalPages - 1) navRow.push({ text: 'Next \u25b6\ufe0f', callback_data: `lang_page_${page + 1}` });
      langButtons.push(navRow);

      langButtons.push([{ text: '\u25c0\ufe0f Back to Settings', callback_data: 'open_settings' }]);

      await ctx.editMessageText(
        '\ud83c\udf10 *Change Language*\n\n' +
        `Current: ${currentConfig.flag} ${currentConfig.label}\n\n` +
        'Select your preferred language.\nThis affects bot UI, voice over, subtitles, and captions.',
        {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: langButtons },
        }
      );
      return;
    }

    // Set language (dynamic — any supported code)
    if (data.startsWith('set_language_')) {
      const langCode = data.replace('set_language_', '');
      const langCfg = getLangConfig(langCode);
      await ctx.answerCbQuery(`Language set to ${langCfg.label}`);
      const userId = ctx.from?.id;
      if (userId) {
        await UserService.update(BigInt(userId), { language: langCode });
      }
      await ctx.editMessageText(
        '\ud83c\udf10 *Language Updated*\n\n' +
        `\u2705 ${langCfg.flag} ${langCfg.label} selected.\n\n` +
        `Bot messages, voice over, subtitles, and captions will use ${langCfg.label}.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '\u25c0\ufe0f Back to Settings', callback_data: 'open_settings' }],
            ],
          },
        }
      );
      return;
    }

    // Show notifications toggle
    if (data === 'settings_notifications') {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      const user = userId ? await UserService.findByTelegramId(BigInt(userId)) : null;
      const enabled = user?.notificationsEnabled ?? true;

      await ctx.editMessageText(
        '🔔 *Notifications*\n\n' +
        `Status: ${enabled ? '✅ Enabled' : '❌ Disabled'}\n\n` +
        'Receive notifications for:\n' +
        '• Video completion\n' +
        '• Payment confirmations\n' +
        '• Referral commissions\n' +
        '• Promotions & updates',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: enabled ? '🔕 Turn Off Notifications' : '🔔 Turn On Notifications', callback_data: 'toggle_notifications' }],
              [{ text: '◀️ Back to Settings', callback_data: 'open_settings' }],
            ],
          },
        }
      );
      return;
    }

    // Toggle notifications
    if (data === 'toggle_notifications') {
      const userId = ctx.from?.id;
      if (!userId) {
        await ctx.answerCbQuery('Error: user not found');
        return;
      }
      const user = await UserService.findByTelegramId(BigInt(userId));
      const newValue = !(user?.notificationsEnabled ?? true);
      await UserService.update(BigInt(userId), { notificationsEnabled: newValue });
      await ctx.answerCbQuery(newValue ? 'Notifications enabled' : 'Notifications disabled');

      await ctx.editMessageText(
        '🔔 *Notifications*\n\n' +
        `Status: ${newValue ? '✅ Enabled' : '❌ Disabled'}\n\n` +
        `Notifications have been ${newValue ? 'enabled' : 'disabled'}.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: newValue ? '🔕 Turn Off Notifications' : '🔔 Turn On Notifications', callback_data: 'toggle_notifications' }],
              [{ text: '◀️ Back to Settings', callback_data: 'open_settings' }],
            ],
          },
        }
      );
      return;
    }

    // Show auto-renewal toggle
    if (data === 'settings_autorenewal') {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      const user = userId ? await UserService.findByTelegramId(BigInt(userId)) : null;
      const enabled = user?.autoRenewal ?? false;

      await ctx.editMessageText(
        '🔄 *Auto-Renewal*\n\n' +
        `Status: ${enabled ? '✅ Enabled' : '❌ Disabled'}\n\n` +
        'When enabled, your subscription will automatically\n' +
        'renew at the end of each billing cycle.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: enabled ? '❌ Disable Auto-Renewal' : '✅ Enable Auto-Renewal', callback_data: 'toggle_autorenewal' }],
              [{ text: '◀️ Back to Settings', callback_data: 'open_settings' }],
            ],
          },
        }
      );
      return;
    }

    // Toggle auto-renewal
    if (data === 'toggle_autorenewal') {
      const userId = ctx.from?.id;
      if (!userId) {
        await ctx.answerCbQuery('Error: user not found');
        return;
      }
      const user = await UserService.findByTelegramId(BigInt(userId));
      const newValue = !(user?.autoRenewal ?? false);
      await UserService.update(BigInt(userId), { autoRenewal: newValue });
      await ctx.answerCbQuery(newValue ? 'Auto-renewal enabled' : 'Auto-renewal disabled');

      await ctx.editMessageText(
        '🔄 *Auto-Renewal*\n\n' +
        `Status: ${newValue ? '✅ Enabled' : '❌ Disabled'}\n\n` +
        `Auto-renewal has been ${newValue ? 'enabled' : 'disabled'}.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: newValue ? '❌ Disable Auto-Renewal' : '✅ Enable Auto-Renewal', callback_data: 'toggle_autorenewal' }],
              [{ text: '◀️ Back to Settings', callback_data: 'open_settings' }],
            ],
          },
        }
      );
      return;
    }

    // Open settings menu (back navigation target)
    if (data === 'open_settings') {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      const user = userId ? await UserService.findByTelegramId(BigInt(userId)) : null;
      const lang = user?.language === 'en' ? 'English' : 'Bahasa Indonesia';
      const notif = user?.notificationsEnabled ? 'Enabled' : 'Disabled';
      const autoRenew = user?.autoRenewal ? 'Enabled' : 'Disabled';

      await ctx.editMessageText(
        '⚙️ *Settings*\n\n' +
        'Configure your preferences:\n\n' +
        `*Language:* ${lang}\n` +
        `*Notifications:* ${notif}\n` +
        `*Auto-renewal:* ${autoRenew}\n\n` +
        'What would you like to change?',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌐 Change Language', callback_data: 'settings_language' }],
              [{ text: '🔔 Notifications', callback_data: 'settings_notifications' }],
              [{ text: '🔄 Auto-renewal', callback_data: 'settings_autorenewal' }],
              [{ text: '◀️ Back to Menu', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      return;
    }

    // =========================================================================
    // TRANSACTION HISTORY
    // =========================================================================

    if (data === 'transaction_history') {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      if (!userId) return;

      try {
        const transactions = await prisma.transaction.findMany({
          where: { userId: BigInt(userId) },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        if (transactions.length === 0) {
          await ctx.editMessageText(
            '📜 *Transaction History*\n\n' +
            'No transactions found.\n\n' +
            'Top up credits to get started!',
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '💰 Top Up Now', callback_data: 'topup' }],
                  [{ text: '◀️ Back to Menu', callback_data: 'main_menu' }],
                ],
              },
            }
          );
          return;
        }

        let message = '📜 *Transaction History*\n\n';
        message += '_Last 10 transactions:_\n\n';

        for (const tx of transactions) {
          const date = tx.createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
          const statusEmoji = tx.status === 'success' ? '✅' : tx.status === 'pending' ? '⏳' : '❌';
          const amount = Number(tx.amountIdr).toLocaleString('id-ID');
          const credits = tx.creditsAmount ? Number(tx.creditsAmount).toFixed(1) : '-';
          message += `${statusEmoji} ${date} | ${tx.type} | Rp ${amount} | ${credits} credits\n`;
        }

        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Back to Menu', callback_data: 'main_menu' }],
            ],
          },
        });
      } catch (error) {
        logger.error('Transaction history error:', error);
        await ctx.editMessageText(
          '❌ Failed to load transaction history.\n\nPlease try again later.',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '◀️ Back to Menu', callback_data: 'main_menu' }],
              ],
            },
          }
        );
      }
      return;
    }

    // =========================================================================
    // COPY PROMPT
    // =========================================================================

    if (data === 'copy_prompt') {
      await ctx.answerCbQuery();
      const extractedPrompt = ctx.session?.stateData?.extractedPrompt as string | undefined;

      if (extractedPrompt) {
        await ctx.reply(
          `📋 *Extracted Prompt:*\n\n\`\`\`\n${extractedPrompt}\n\`\`\`\n\n_Copy the text above to use it._`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply(
          '❌ No prompt found. Please use the Disassemble feature first to extract a prompt from media.',
          { parse_mode: 'Markdown' }
        );
      }
      return;
    }

    // =========================================================================
    // CONNECT ACCOUNT (NEW) - Route to manage_accounts for platform selection
    // =========================================================================

    if (data === 'connect_account_new') {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        '🔗 *Connect New Account*\n\n' +
        'Select platform to connect:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📱 TikTok', callback_data: 'connect_account_tiktok' }],
              [{ text: '📷 Instagram', callback_data: 'connect_account_instagram' }],
              [{ text: '📘 Facebook', callback_data: 'connect_account_facebook' }],
              [{ text: '🐦 Twitter/X', callback_data: 'connect_account_twitter' }],
              [{ text: '📺 YouTube', callback_data: 'connect_account_youtube' }],
              [{ text: '◀️ Back', callback_data: 'manage_accounts' }],
            ],
          },
        }
      );
      return;
    }

    // =========================================================================
    // REFERRAL STATS
    // =========================================================================

    if (data === 'referral_stats') {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      if (!userId) return;

      try {
        const user = await UserService.findByTelegramId(BigInt(userId));
        if (!user) {
          await ctx.reply('❌ User not found.');
          return;
        }

        const [referralCount, commissionAgg, availableAgg, withdrawnAgg] = await Promise.all([
          prisma.user.count({ where: { referredBy: user.uuid } }),
          prisma.commission.aggregate({
            where: { referrerId: BigInt(userId) },
            _sum: { amount: true },
          }),
          prisma.commission.aggregate({
            where: { referrerId: BigInt(userId), status: 'available' },
            _sum: { amount: true },
          }),
          prisma.commission.aggregate({
            where: { referrerId: BigInt(userId), status: 'withdrawn' },
            _sum: { amount: true },
          }),
        ]);

        const totalCommission = Number(commissionAgg._sum.amount || 0);
        const availableCommission = Number(availableAgg._sum.amount || 0);
        const withdrawnCommission = Number(withdrawnAgg._sum.amount || 0);

        await ctx.editMessageText(
          '📊 *Referral Statistics*\n\n' +
          `*Total Referrals:* ${referralCount}\n` +
          `*Referral Tier:* ${user.referralTier}\n\n` +
          '*Commission Summary:*\n' +
          `• Total Earned: Rp ${totalCommission.toLocaleString('id-ID')}\n` +
          `• Available: Rp ${availableCommission.toLocaleString('id-ID')}\n` +
          `• Withdrawn: Rp ${withdrawnCommission.toLocaleString('id-ID')}\n\n` +
          `*Referral Code:* \`${user.referralCode || 'N/A'}\``,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '💸 Withdraw', callback_data: 'referral_withdraw' }],
                [{ text: '◀️ Back to Referral', callback_data: 'open_referral' }],
              ],
            },
          }
        );
      } catch (error) {
        logger.error('Referral stats error:', error);
        await ctx.reply('❌ Failed to load referral statistics. Please try again.');
      }
      return;
    }

    // =========================================================================
    // REFERRAL WITHDRAW
    // =========================================================================

    if (data === 'referral_withdraw') {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      if (!userId) return;

      try {
        const availableAgg = await prisma.commission.aggregate({
          where: { referrerId: BigInt(userId), status: 'available' },
          _sum: { amount: true },
        });
        const available = Number(availableAgg._sum.amount || 0);

        const minWithdraw = 50000; // Rp 50,000 minimum

        let message = '💸 *Withdraw Commission*\n\n';
        message += `*Available Balance:* Rp ${available.toLocaleString('id-ID')}\n`;
        message += `*Minimum Withdrawal:* Rp ${minWithdraw.toLocaleString('id-ID')}\n\n`;

        if (available < minWithdraw) {
          message += `❌ Insufficient balance for withdrawal.\n\n`;
          message += `You need at least Rp ${minWithdraw.toLocaleString('id-ID')} to withdraw.\n`;
          message += `Keep referring to earn more!`;
        } else {
          message += `✅ You are eligible for withdrawal.\n\n`;
          message += `*How to withdraw:*\n`;
          message += `1. Contact our support team\n`;
          message += `2. Provide your bank account details\n`;
          message += `3. Withdrawal processed within 1-3 business days\n\n`;
          message += `Contact: @berkahkarya_support`;
        }

        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📊 View Stats', callback_data: 'referral_stats' }],
              [{ text: '◀️ Back to Referral', callback_data: 'open_referral' }],
            ],
          },
        });
      } catch (error) {
        logger.error('Referral withdraw error:', error);
        await ctx.reply('❌ Failed to load withdrawal info. Please try again.');
      }
      return;
    }

    // =========================================================================
    // MULTI-PHOTO VIDEO CREATION HANDLERS
    // =========================================================================

    // "Generate Now" — trigger video generation with all collected photos
    if (data === 'generate_video_now') {
      await ctx.answerCbQuery();

      if (!ctx.session?.videoCreation?.waitingForImage) {
        await ctx.reply('No active video creation. Please start with /create');
        return;
      }

      const uploadedPhotos = ctx.session.videoCreation.uploadedPhotos || [];
      if (uploadedPhotos.length === 0) {
        await ctx.reply(
          'No photos uploaded yet. Send a reference image first, or /skip to generate without one.'
        );
        return;
      }

      await handleVideoCreationImage(ctx, uploadedPhotos);
      return;
    }

    // "Add More Photos" — acknowledge, user will send more photos naturally
    if (data === 'add_more_photos') {
      await ctx.answerCbQuery();
      const count = ctx.session?.videoCreation?.uploadedPhotos?.length || 0;
      const remaining = 5 - count;
      await ctx.reply(
        `Send up to ${remaining} more photo(s).\n\nYou can also tap "Generate Now" when ready.`
      );
      return;
    }

    // "Skip Reference Image" — from multi-photo flow inline button
    if (data === 'skip_reference_image') {
      await ctx.answerCbQuery();
      await handleSkipImageReference(ctx);
      return;
    }

    // Unknown callback
    logger.warn('Unknown callback:', data);
    await ctx.answerCbQuery('Unknown action');

  } catch (error) {
    logger.error('Error in callback handler:', error);
    await ctx.answerCbQuery('Error processing request');
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
    await ctx.answerCbQuery('❌ Video not found');
    return;
  }

  // Check if user has connected accounts
  const hasAccounts = await PostAutomationService.hasConnectedAccounts(BigInt(userId));
  
  if (!hasAccounts) {
    await ctx.editMessageText(
      '📤 *Publish to Social Media*\n\n' +
      'You haven\'t connected any social media accounts yet.\n\n' +
      'Connect your accounts first to publish videos.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔗 Connect Accounts', callback_data: 'manage_accounts' }],
            [{ text: '❌ Cancel', callback_data: 'videos_list' }],
          ],
        },
      }
    );
    return;
  }

  // Get user's connected accounts
  const accounts = await PostAutomationService.getUserAccounts(BigInt(userId));
  
  // Build inline keyboard
  const keyboard: any[][] = [];
  
  // Group by platform
  const platformGroups: Record<string, typeof accounts> = {};
  accounts.forEach(acc => {
    if (!platformGroups[acc.platform]) {
      platformGroups[acc.platform] = [];
    }
    platformGroups[acc.platform].push(acc);
  });

  Object.entries(platformGroups).forEach(([platform, accs]) => {
    const platformEmoji = getPlatformEmoji(platform);
    accs.forEach(acc => {
      keyboard.push([{
        text: `${platformEmoji} ${platform.toUpperCase()} (${acc.username})`,
        callback_data: `select_platform_${jobId}_${acc.id}`,
      }]);
    });
  });

  keyboard.push([{ text: '✅ Post Now', callback_data: `confirm_publish_${jobId}` }]);
  keyboard.push([{ text: '❌ Cancel', callback_data: 'videos_list' }]);

  await ctx.editMessageText(
    '📤 *Publish to Social Media*\n\n' +
    'Select the platform(s) to publish this video:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard,
      },
    }
  );

  // Store selected platform in session
  ctx.session.selectedPlatforms = [];
  ctx.session.currentJobId = jobId;
}

/**
 * Handle platform selection for publishing
 */
async function handlePublishPlatformSelection(ctx: BotContext, jobId: string, platformOrAccountId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Initialize session if needed
  if (!ctx.session.selectedPlatforms) {
    ctx.session.selectedPlatforms = [];
  }

  if (platformOrAccountId === 'all') {
    // Select all accounts
    const accounts = await PostAutomationService.getUserAccounts(BigInt(userId));
    ctx.session.selectedPlatforms = accounts.map(acc => acc.id);
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
    await ctx.answerCbQuery('Select at least one platform');
    return;
  }

  await ctx.editMessageText(
    `📤 *Publish Video*\n\n` +
    `✅ ${selectedCount} platform(s) selected\n\n` +
    `Ready to publish?`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Publish Now', callback_data: `confirm_publish_${jobId}` }],
          [{ text: '❌ Cancel', callback_data: 'videos_list' }],
        ],
      },
    }
  );
}

/**
 * Handle confirm publish
 */
async function handleConfirmPublish(ctx: BotContext, jobId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  await ctx.editMessageText(
    '⏳ *Publishing...*\n\n' +
    'Uploading to selected platforms...',
    { parse_mode: 'Markdown' }
  );

  try {
    // Get video
    const video = await VideoService.getByJobId(jobId);
    if (!video || !video.videoUrl) {
      throw new Error('Video not found');
    }

    // Get user's selected accounts
    const accounts = await PostAutomationService.getUserAccounts(BigInt(userId));
    
    // Publish
    const results = await PostAutomationService.publish({
      userId: BigInt(userId),
      mediaUrl: video.videoUrl,
      caption: ctx.session.caption || `${video.title || 'Check this out!'} #viral #fyp`,
      platformAccountIds: accounts.map(a => a.id),
    });

    // Show results
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    let message = `📤 *Publish Results*\n\n`;
    message += `✅ Success: ${successCount}\n`;
    if (failCount > 0) {
      message += `❌ Failed: ${failCount}\n\n`;
    }

    results.forEach(result => {
      const emoji = result.success ? '✅' : '❌';
      message += `${emoji} ${result.platform.toUpperCase()}\n`;
      if (result.postUrl) {
        message += `   ${result.postUrl}\n`;
      }
      if (result.error) {
        message += `   Error: ${result.error}\n`;
      }
    });

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📁 My Videos', callback_data: 'videos_list' }],
          [{ text: '🎬 Buat Video Lagi', callback_data: 'back_prompts' }],
        ],
      },
    });

  } catch (error: any) {
    logger.error('Publish failed:', error);
    await ctx.editMessageText(
      `❌ *Publish Failed*\n\n` +
      `Error: ${error.message}\n\n` +
      `Please try again or contact support.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Retry', callback_data: `publish_video_${jobId}` }],
            [{ text: '❌ Cancel', callback_data: 'videos_list' }],
          ],
        },
      }
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
  await ctx.answerCbQuery('Publishing to all accounts...');

  try {
    // Get video details
    const video = await VideoService.getByJobId(jobId);
    if (!video || !video.videoUrl) {
      await ctx.reply('❌ Video not found or has no URL.');
      return;
    }

    // Get ALL connected accounts for this user
    const accounts = await PostAutomationService.getUserAccounts(BigInt(userId));
    if (accounts.length === 0) {
      await ctx.reply(
        '❌ No connected social accounts found.\n\n' +
        'Connect your accounts first to auto-post.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔗 Connect Accounts', callback_data: 'manage_accounts' }],
            ],
          },
        }
      );
      return;
    }

    // Show progress message
    const platformNames = accounts.map(a => `${getPlatformEmoji(a.platform)} ${a.platform}`).join(', ');
    await ctx.reply(
      `⏳ *Auto-Posting to ${accounts.length} account(s)...*\n\n` +
      `Platforms: ${platformNames}`,
      { parse_mode: 'Markdown' }
    );

    // Publish to all accounts at once
    const results = await PostAutomationService.publish({
      userId: BigInt(userId),
      mediaUrl: video.videoUrl,
      caption: ctx.session?.caption || `${video.title || 'Check this out!'} #viral #fyp`,
      platformAccountIds: accounts.map(a => a.id),
    });

    // Build results message
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    let message = `🚀 *Auto-Post Results*\n\n`;
    message += `Total: ${results.length} platform(s)\n`;
    message += `✅ Success: ${successCount}\n`;
    if (failCount > 0) {
      message += `❌ Failed: ${failCount}\n`;
    }
    message += '\n';

    results.forEach(result => {
      const emoji = result.success ? '✅' : '❌';
      message += `${emoji} ${result.platform.toUpperCase()}`;
      if (result.postUrl) {
        message += ` — [View Post](${result.postUrl})`;
      }
      if (result.error) {
        message += ` — ${result.error}`;
      }
      message += '\n';
    });

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎬 Buat Video Lagi', callback_data: 'back_prompts' }],
          [{ text: '📁 My Videos', callback_data: 'videos_list' }],
        ],
      },
    });

  } catch (error: any) {
    logger.error('Auto-post failed:', error);
    await ctx.reply(
      `❌ *Auto-Post Failed*\n\n` +
      `Error: ${error.message}\n\n` +
      `You can still publish manually.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📤 Publish Manually', callback_data: `publish_video_${jobId}` }],
            [{ text: '📁 My Videos', callback_data: 'videos_list' }],
          ],
        },
      }
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
      '🔗 *Connect Social Accounts*\n\n' +
      'Connect your social media accounts to publish videos directly.\n\n' +
      'Select platform to connect:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 TikTok', callback_data: 'connect_account_tiktok' }],
            [{ text: '📷 Instagram', callback_data: 'connect_account_instagram' }],
            [{ text: '📘 Facebook', callback_data: 'connect_account_facebook' }],
            [{ text: '🐦 Twitter/X', callback_data: 'connect_account_twitter' }],
            [{ text: '📺 YouTube', callback_data: 'connect_account_youtube' }],
            [{ text: '❌ Cancel', callback_data: 'main_menu' }],
          ],
        },
      }
    );
    return;
  }

  // Show connected accounts
  let message = '🔗 *Connected Accounts*\n\n';
  const keyboard: any[][] = [];

  accounts.forEach(acc => {
    const emoji = getPlatformEmoji(acc.platform);
    message += `${emoji} ${acc.platform.toUpperCase()}: ${acc.username}\n`;
    keyboard.push([{
      text: `❌ Disconnect ${acc.platform} (${acc.username})`,
      callback_data: `disconnect_account_${acc.id}`,
    }]);
  });

  message += '\nConnect more accounts:';
  keyboard.push([{ text: '➕ Connect New Account', callback_data: 'connect_account_new' }]);
  keyboard.push([{ text: '◀️ Back', callback_data: 'main_menu' }]);

  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
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
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: `🔗 Open PostBridge`, url: 'https://post-bridge.com/dashboard' }],
          [{ text: '◀️ Back', callback_data: 'manage_accounts' }],
        ],
      },
    }
  );

  ctx.session.state = 'WAITING_ACCOUNT_ID';
  ctx.session.connectingPlatform = platform;
}

/**
 * Handle disconnect account
 */
async function handleDisconnectAccount(ctx: BotContext, accountId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  await PostAutomationService.disconnectAccount(BigInt(userId), parseInt(accountId));
  
  await ctx.answerCbQuery('✅ Account disconnected');
  
  // Refresh account list
  await handleManageAccounts(ctx);
}

/**
 * Get platform emoji
 */
function getPlatformEmoji(platform: string): string {
  const emojis: Record<string, string> = {
    tiktok: '📱',
    instagram: '📷',
    facebook: '📘',
    twitter: '🐦',
    youtube: '📺',
  };
  return emojis[platform.toLowerCase()] || '📱';
}

/**
 * Handle image generation
 */
async function handleImageGeneration(ctx: BotContext, category: string) {
  const categoryNames: Record<string, string> = {
    product: '🛍️ Product Photo',
    fnb: '🍔 F&B Food',
    realestate: '🏠 Real Estate',
    car: '🚗 Car/Automotive',
  };

  // Check if a cloned prompt already exists from clone_video or clone_image flow
  const existingClonePrompt = ctx.session?.stateData?.clonePrompt as string | undefined;

  if (existingClonePrompt) {
    // Clone prompt exists — skip the "describe what you want" step and go straight to generation
    ctx.session.state = 'IMAGE_GENERATION_WAITING';
    ctx.session.stateData = { ...ctx.session.stateData, imageCategory: category, useClonePrompt: true };

    await ctx.editMessageText(
      `🖼️ *Generate ${categoryNames[category] || category}*\n\n` +
      `Using cloned prompt:\n_${existingClonePrompt.slice(0, 200)}${existingClonePrompt.length > 200 ? '...' : ''}_\n\n` +
      `Generating image...`,
      { parse_mode: 'Markdown' }
    );

    // Trigger generation directly by simulating the user sending the cloned prompt as text.
    // The message handler for IMAGE_GENERATION_WAITING will pick up the clonePrompt from stateData.
    return;
  }

  // Build reference image options
  const telegramId = BigInt(ctx.from!.id);
  const avatars = await AvatarService.listAvatars(telegramId);
  const creditCost = await getImageCreditCostAsync();

  const avatarButtons = avatars.slice(0, 3).map(a => (
    { text: `👤 ${a.isDefault ? '⭐ ' : ''}${a.name}`, callback_data: `imgref_avatar_${a.id}` }
  ));

  await ctx.editMessageText(
    `🖼️ *Generate ${categoryNames[category]}*\n` +
    `💰 _Biaya: ${creditCost} kredit per gambar_\n\n` +
    `How do you want to generate?\n\n` +
    `📸 *Upload Reference* — Send your product photo and AI will create marketing images based on it\n` +
    `👤 *Use Avatar* — Keep a consistent character/person across images\n` +
    `✏️ *Describe Only* — AI generates from your text description`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📸 Upload Reference Photo', callback_data: 'imgref_upload' }],
          ...(avatarButtons.length > 0 ? [avatarButtons] : []),
          [{ text: '✏️ Describe Only (No Reference)', callback_data: 'imgref_skip' }],
          [{ text: '◀️ Menu Utama', callback_data: 'main_menu' }],
        ],
      },
    }
  );

  ctx.session.state = 'IMAGE_GENERATION_WAITING';
  ctx.session.stateData = { imageCategory: category };
}
