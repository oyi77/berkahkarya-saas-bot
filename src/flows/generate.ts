/**
 * Create Command v3 — Basic/Smart/Pro Mode
 * 
 * Implements the 3-mode generation flow from Master Document v3.0:
 * - Basic: Full auto (AI picks everything, 6 interactions total)
 * - Smart: Choose preset + platform (8 interactions)
 * - Pro: Full control per-scene (11+ interactions)
 * 
 * Entry: /create or tap "Generate Konten" in main menu
 */

import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';
import { UNIT_COSTS, creditsToUnits } from '@/config/pricing';
import { detectIndustry, generateVideoScenePrompts, HPAS_SCENES, DURATION_PRESETS, buildCustomPresetConfig } from '@/config/hpas-engine';
import { CampaignService } from '@/services/campaign.service';
import { ContentAnalysisService } from '@/services/content-analysis.service';
import { ImageGenerationService } from '@/services/image.service';
import { enqueueVideoGeneration } from '@/config/queue';
import { generateVideoAsync } from '@/commands/create';
import type { DurationPreset } from '@/config/hpas-engine';

const execFileAsync = promisify(execFile);
const VIDEO_DIR = process.env.VIDEO_DIR || '/tmp/videos';

/** Download a URL to a local file. Returns the local path or null on failure. */
async function downloadToLocal(url: string, filename: string): Promise<string | null> {
  try {
    if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });
    const localPath = path.join(VIDEO_DIR, filename);
    await execFileAsync('wget', ['-q', '-O', localPath, url]);
    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) return localPath;
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  } catch (err) {
    logger.warn('downloadToLocal failed:', err);
  }
  return null;
}

type GenerateMode = 'basic' | 'smart' | 'pro';
type GenerateAction = 'image_set' | 'video' | 'clone_style' | 'campaign';
type Platform = 'tiktok' | 'instagram' | 'youtube' | 'square';

// ── Step 3 Handler: Product Input (photo or text) ─────────────────────────────

export async function handleProductInput(ctx: BotContext, message: any): Promise<void> {
  try {
    const action = ctx.session?.generateAction as GenerateAction || 'video';
    let productDesc = '';
    let photoUrl: string | undefined;

    // Extract input
    if (message.photo) {
      const largest = message.photo[message.photo.length - 1];
      const fileLink = await ctx.telegram.getFileLink(largest.file_id);
      photoUrl = fileLink.toString();

      await ctx.reply('🔍 *Menganalisis foto produk...*', { parse_mode: 'Markdown' });

      const analysis = await ContentAnalysisService.extractPrompt(photoUrl, 'image');
      productDesc = analysis.success && analysis.prompt ? analysis.prompt : 'produk dari foto yang dikirim';
    } else if (message.text && !message.text.startsWith('/')) {
      productDesc = message.text;
    } else {
      await ctx.reply('❌ Kirim foto produk atau ketik deskripsi produk.');
      return;
    }

    // Save to session
    if (ctx.session) {
      ctx.session.generateProductDesc = productDesc;
      if (photoUrl) ctx.session.generatePhotoUrl = photoUrl;
      ctx.session.state = 'DASHBOARD';
    }

    const mode = ctx.session?.generateMode as GenerateMode || 'basic';

    // Basic mode → straight to confirm
    if (mode === 'basic') {
      await showConfirmScreen(ctx);
      return;
    }

    // Smart mode → if preset+platform already set (user went through smart flow), go to confirm
    if (mode === 'smart' && action === 'video') {
      if (ctx.session?.generatePreset && ctx.session?.generatePlatform) {
        await showConfirmScreen(ctx);
      } else {
        await showSmartPresetSelection(ctx);
      }
      return;
    }

    // Pro mode → show scene review
    if (mode === 'pro' && action === 'video') {
      await showProSceneReview(ctx, productDesc);
      return;
    }

    // Image set / campaign → go to confirm
    await showConfirmScreen(ctx);
  } catch (err) {
    logger.error('handleProductInput error', err);
    await ctx.reply('❌ Gagal memproses input. Coba lagi.');
  }
}

// ── Execution Engine ──────────────────────────────────────────────────────────

export async function executeGeneration(ctx: BotContext): Promise<void> {
  const session = ctx.session;
  if (!session) return;

  const telegramId = BigInt(ctx.from!.id);

  // Idempotency lock: prevent double-click from deducting credits twice
  const { redis } = await import('../config/redis.js');
  const lockKey = `generating:${telegramId}`;
  const lockAcquired = await redis.set(lockKey, '1', 'EX', 30, 'NX');
  if (lockAcquired !== 'OK') {
    await ctx.reply('⏳ Sedang diproses... mohon tunggu.');
    return;
  }

  const action = session.generateAction as GenerateAction || 'video';
  const productDesc = session.generateProductDesc as string || '';
  const rawPhotoUrl = session.generatePhotoUrl as string | undefined;
  const preset = (session.generatePreset as DurationPreset) || 'standard';
  const platform = session.generatePlatform as Platform || 'tiktok';

  // Download reference image to local file so providers can read it (they check fs.existsSync)
  let photoUrl: string | undefined;
  if (rawPhotoUrl) {
    const localRef = await downloadToLocal(rawPhotoUrl, `ref_${telegramId}_${Date.now()}.jpg`);
    photoUrl = localRef || rawPhotoUrl; // Fall back to URL if download fails
  }

  const presetConfig = preset === 'custom' && session.customPresetConfig
    ? session.customPresetConfig as typeof DURATION_PRESETS['standard']
    : DURATION_PRESETS[preset];
  const industry = detectIndustry(productDesc);

  try {
    const user = await UserService.findByTelegramId(telegramId);
    if (!user) { await ctx.reply('❌ User tidak ditemukan.'); return; }

    const unitBalance = creditsToUnits(Number(user.creditBalance));

    // Cost check
    let cost = 0;
    if (action === 'image_set') cost = UNIT_COSTS.IMAGE_SET_7_SCENE;
    else if (action === 'video') cost = presetConfig.creditCost;
    else if (action === 'clone_style') cost = UNIT_COSTS.CLONE_STYLE;
    else if (action === 'campaign') cost = CampaignService.getCampaignCost((session.generateCampaignSize as 5 | 10) || 5);

    if (unitBalance < cost) {
      const costCredits = cost / 10;
      const balCredits = unitBalance / 10;
      await ctx.reply(
        `❌ *Kredit tidak cukup*\n\nDibutuhkan: ${costCredits} kredit\nSaldo: ${balCredits} kredit\n\nGunakan /topup untuk menambah kredit.`,
        { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '💳 Top Up Kredit', callback_data: 'topup' }]] } }
      );
      return;
    }

    await ctx.reply('⏳ *Generating konten...*\n\nMohon tunggu ~30-60 detik 🚀', { parse_mode: 'Markdown' });

    // Image Set (7 scene HPAS)
    if (action === 'image_set') {
      const scenes = generateVideoScenePrompts(industry, productDesc, 'standard', 'id');
      const creditCost = cost / 10;

      const results: string[] = [];
      const isLocalRef = photoUrl && !photoUrl.startsWith('http');
      const imgParams = {
        category: industry,
        aspectRatio: '9:16' as const,
        style: 'commercial',
        referenceImageUrl: photoUrl && !isLocalRef ? photoUrl : undefined,
        referenceImagePath: isLocalRef ? photoUrl : undefined,
        mode: (photoUrl ? 'img2img' : 'text2img') as 'img2img' | 'text2img',
      };
      for (let i = 0; i < Math.min(scenes.length, 7); i++) {
        const scene = scenes[i];
        await ctx.reply(`🎨 Generating scene ${i + 1}/7: *${HPAS_SCENES[scene.sceneId]?.nameId || scene.sceneId}*...`, { parse_mode: 'Markdown' });
        let result = await ImageGenerationService.generateImage({ prompt: scene.prompt, ...imgParams });
        // Single retry on failure before skipping
        if (!result.success || !result.imageUrl) {
          logger.warn(`Image scene ${i + 1} failed, retrying once...`);
          result = await ImageGenerationService.generateImage({ prompt: scene.prompt, ...imgParams });
        }
        if (result.success && result.imageUrl) results.push(result.imageUrl);
      }

      if (results.length === 0) {
        await ctx.reply('❌ Gagal generate semua scene. Kredit tidak ditagih.');
        return;
      }

      // Only charge after at least one scene succeeds; scale cost proportionally
      const proportionalCost = Math.ceil(creditCost * results.length / 7 * 10) / 10;
      await UserService.deductCredits(telegramId, proportionalCost);

      const mediaGroup = results.map((url, i) => ({
        type: 'photo' as const,
        media: url,
        ...(i === 0 ? { caption: `✅ *${results.length}/7 scene berhasil!*\n🏭 Industri: ${industry}`, parse_mode: 'Markdown' as const } : {}),
      }));
      await ctx.replyWithMediaGroup(mediaGroup);
      await showPostDelivery(ctx);
      return;
    }

    // Video generation
    if (action === 'video') {
      const scenes = generateVideoScenePrompts(industry, productDesc, preset, 'id');
      const creditCost = cost / 10;

      const { VideoService: VS } = await import('../services/video.service.js');
      const video = await VS.createJob({
        userId: telegramId,
        niche: industry,
        platform,
        duration: presetConfig.totalSeconds,
        scenes: scenes.length,
        title: `Video ${new Date().toLocaleDateString('id-ID')}`,
      });

      // Deduct after job is created (worker refunds on failure)
      await UserService.deductCredits(telegramId, creditCost);

      try {
        const { position } = await enqueueVideoGeneration({
          jobId: video.jobId,
          niche: industry,
          platform,
          duration: presetConfig.totalSeconds,
          scenes: scenes.length,
          storyboard: scenes.map((s, i) => ({ scene: i + 1, duration: s.durationSeconds, description: s.prompt })),
          referenceImage: photoUrl || null,
          userId: telegramId.toString(),
          chatId: ctx.chat!.id,
          enableVO: true,
          enableSubtitles: true,
          language: user.language || 'id',
        });
        await ctx.reply(`✅ Video masuk antrian #${position}\n\nKamu akan dinotifikasi saat selesai.`);
      } catch {
        generateVideoAsync(ctx, video.jobId, industry, platform, presetConfig.totalSeconds, scenes.map((s, i) => ({ scene: i + 1, duration: s.durationSeconds, description: s.prompt }))).catch(async (err) => {
          logger.error('Video generateVideoAsync failed:', err);
          await UserService.refundCredits(telegramId, creditCost, video.jobId, err?.message || 'fallback failure').catch((refundErr) => logger.error('CRITICAL: refundCredits failed', { telegramId: telegramId.toString(), creditCost, err: refundErr }));
          await ctx.telegram.sendMessage(ctx.chat!.id, '❌ Video gagal diproses. Kredit dikembalikan.').catch(() => {});
        });
        await ctx.reply('✅ Video sedang diproses. Kamu akan dinotifikasi saat selesai.');
      }
      await showPostDelivery(ctx);
      return;
    }

    // Clone Style — extract style from reference photo and queue a video
    if (action === 'clone_style') {
      const creditCost = cost / 10;
      let styleHint = '';

      if (photoUrl) {
        try {
          const analysis = await ContentAnalysisService.extractPrompt(photoUrl, 'image');
          styleHint = analysis.success && analysis.prompt ? `, ${analysis.prompt}` : '';
        } catch {
          // Non-fatal: proceed without style hint
        }
      }

      const combinedPrompt = `${productDesc}${styleHint}`;
      const scenes = generateVideoScenePrompts(industry, combinedPrompt, 'standard', 'id');

      const { VideoService: VS2 } = await import('../services/video.service.js');
      const video2 = await VS2.createJob({
        userId: telegramId,
        niche: industry,
        platform,
        duration: DURATION_PRESETS['standard'].totalSeconds,
        scenes: scenes.length,
        title: `Clone Style — ${new Date().toLocaleDateString('id-ID')}`,
      });

      await UserService.deductCredits(telegramId, creditCost);

      try {
        const { position } = await enqueueVideoGeneration({
          jobId: video2.jobId,
          niche: industry,
          platform,
          duration: DURATION_PRESETS['standard'].totalSeconds,
          scenes: scenes.length,
          storyboard: scenes.map((s, i) => ({ scene: i + 1, duration: s.durationSeconds, description: s.prompt })),
          referenceImage: photoUrl || null,
          userId: telegramId.toString(),
          chatId: ctx.chat!.id,
          enableVO: true,
          enableSubtitles: true,
          language: user.language || 'id',
        });
        await ctx.reply(`✅ Clone Style video masuk antrian #${position}\n\nKamu akan dinotifikasi saat selesai.`);
      } catch {
        generateVideoAsync(ctx, video2.jobId, industry, platform, DURATION_PRESETS['standard'].totalSeconds, scenes.map((s, i) => ({ scene: i + 1, duration: s.durationSeconds, description: s.prompt }))).catch(async (err) => {
          logger.error('Clone style generateVideoAsync failed:', err);
          await UserService.refundCredits(telegramId, creditCost, video2.jobId, err?.message || 'fallback failure').catch((refundErr) => logger.error('CRITICAL: refundCredits failed', { telegramId: telegramId.toString(), creditCost, err: refundErr }));
          await ctx.telegram.sendMessage(ctx.chat!.id, '❌ Clone Style gagal diproses. Kredit dikembalikan.').catch(() => {});
        });
        await ctx.reply('✅ Clone Style video sedang diproses. Kamu akan dinotifikasi saat selesai.');
      }
      await showPostDelivery(ctx);
      return;
    }

    // Campaign — 1 video with N hook-variation scenes (NOT N separate videos)
    if (action === 'campaign') {
      const campSize = (session.generateCampaignSize as 5 | 10) || 5;
      const creditCost = cost / 10;
      const hookVariations = CampaignService.getHookVariations(campSize);

      // Build a single storyboard: each scene = a different hook variation
      const storyboard = hookVariations.map((hookVar, i) => {
        const hookPrompt = hookVar.promptTemplate
          .replace('{product}', productDesc)
          .replace('{problem}', `masalah ${industry}`);
        return { scene: i + 1, duration: 5, description: `[${hookVar.name}] ${hookPrompt}` };
      });

      const totalDuration = storyboard.reduce((s, sc) => s + sc.duration, 0);
      await UserService.deductCredits(telegramId, creditCost);

      const { VideoService: VS3 } = await import('../services/video.service.js');
      try {
        const vid = await VS3.createJob({
          userId: telegramId,
          niche: industry,
          platform,
          duration: totalDuration,
          scenes: campSize,
          title: `Campaign ${campSize} Scene — ${productDesc.slice(0, 40)}`,
        });

        try {
          const { position } = await enqueueVideoGeneration({
            jobId: vid.jobId,
            niche: industry,
            platform,
            duration: totalDuration,
            scenes: campSize,
            storyboard,
            referenceImage: photoUrl || null,
            userId: telegramId.toString(),
            chatId: ctx.chat!.id,
            enableVO: true,
            enableSubtitles: true,
            language: user.language || 'id',
          });
          await ctx.reply(
            `⏳ *Campaign ${campSize} scene masuk antrian #${position}!*\n\n` +
            `1 video dengan ${campSize} hook berbeda.\n` +
            `Kamu akan dinotifikasi saat selesai.`,
            { parse_mode: 'Markdown' },
          );
        } catch {
          generateVideoAsync(ctx, vid.jobId, industry, platform, totalDuration, storyboard).catch(async (err) => {
            logger.error('Campaign generateVideoAsync failed:', err);
            await UserService.refundCredits(telegramId, creditCost, vid.jobId, err?.message || 'campaign failure').catch((refundErr) => logger.error('CRITICAL: refundCredits failed', { telegramId: telegramId.toString(), creditCost, err: refundErr }));
            await ctx.telegram.sendMessage(ctx.chat!.id, '❌ Campaign gagal diproses. Kredit dikembalikan.').catch(() => {});
          });
          await ctx.reply(`⏳ *Campaign ${campSize} scene sedang diproses!*\n\nKamu akan dinotifikasi saat selesai.`, { parse_mode: 'Markdown' });
        }
      } catch (jobErr) {
        logger.error('Campaign job creation failed:', jobErr);
        await UserService.refundCredits(telegramId, creditCost, `campaign-${Date.now()}`, 'campaign job failed').catch((refundErr) => logger.error('CRITICAL: refundCredits failed', { telegramId: telegramId.toString(), creditCost, err: refundErr }));
        await ctx.reply('❌ *Campaign Gagal*\n\nGagal membuat video. Kredit dikembalikan.', { parse_mode: 'Markdown' });
        return;
      }
      await showPostDelivery(ctx);
      return;
    }

  } catch (err) {
    logger.error('executeGeneration error', err);
    await ctx.reply('❌ Gagal generate. Coba lagi atau hubungi /support.');
  } finally {
    // Release idempotency lock
    await redis.del(lockKey).catch(() => {});
    // Cleanup temp reference image file
    if (photoUrl && !photoUrl.startsWith('http') && fs.existsSync(photoUrl)) {
      try { fs.unlinkSync(photoUrl); } catch { /* ignore */ }
    }
  }
}

// ── Step 1: Mode Selection ────────────────────────────────────────────────────

export async function showGenerateMode(ctx: BotContext): Promise<void> {
  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery().catch(() => {});

    const prefilledPrompt = ctx.session?.generateProductDesc;
    const text = prefilledPrompt 
      ? `🎬 *Generate Konten*\n\nPrompt: \`${prefilledPrompt.slice(0, 50)}${prefilledPrompt.length > 50 ? '...' : ''}\`\n\nPilih mode:`
      : `🎬 *Generate Konten*\n\nPilih mode:`;

    const markup = {
      inline_keyboard: [
        [{ text: '⚡ Basic — Full Auto', callback_data: 'mode_basic' }],
        [{ text: '🎯 Smart — Pilih Preset', callback_data: 'mode_smart' }],
        [{ text: '👑 Pro — Full Control', callback_data: 'mode_pro' }],
        [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
      ],
    };

    if (ctx.callbackQuery) {
      try {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      } catch {
        await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
    } else {
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: markup });
    }
  } catch (err) {
    logger.error('showGenerateMode error', err);
  }
}

// ── Step 2: Action Selection ──────────────────────────────────────────────────

export async function showGenerateAction(ctx: BotContext, mode: GenerateMode): Promise<void> {
  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery().catch(() => {});

    const modeLabel = mode === 'basic' ? '⚡ Basic' : mode === 'smart' ? '🎯 Smart' : '👑 Pro';

    if (ctx.session) {
      ctx.session.generateMode = mode;
    }

    const text = `${modeLabel} Mode\n\nPilih aksi:`;

    const markup = {
      inline_keyboard: [
        [{ text: `📸 Image Set (7 scene) — ${UNIT_COSTS.IMAGE_SET_7_SCENE / 10} kredit`, callback_data: 'action_image_set' }],
        [{ text: `🎥 Video Iklan — mulai ${UNIT_COSTS.VIDEO_15S / 10} kredit`, callback_data: 'action_video' }],
        [{ text: `🔄 Clone Style — ${UNIT_COSTS.CLONE_STYLE / 10} kredit`, callback_data: 'action_clone_style' }],
        [{ text: `📦 Campaign (5/10 scene) — ${UNIT_COSTS.CAMPAIGN_5_VIDEO / 10}/${UNIT_COSTS.CAMPAIGN_10_VIDEO / 10} kredit`, callback_data: 'action_campaign' }],
        [{ text: '◀️ Kembali', callback_data: 'generate_start' }],
        [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
      ],
    };
    try {
      if (ctx.callbackQuery) await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      else await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: markup });
    } catch { await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: markup }); }
  } catch (err) {
    logger.error('showGenerateAction error', err);
  }
}

// ── Step 3: Input Prompt ──────────────────────────────────────────────────────

export async function requestProductInput(ctx: BotContext, action: GenerateAction): Promise<void> {
  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery().catch(() => {});

    if (ctx.session) {
      ctx.session.generateAction = action;
    }

    // If prompt is already pre-filled from library, show image preference before continuing
    const prefilledPrompt = ctx.session?.generateProductDesc;
    if (prefilledPrompt && action !== 'clone_style') {
      if (ctx.session) ctx.session.state = 'DASHBOARD';
      // If user already uploaded a photo, skip image preference
      if (ctx.session?.generatePhotoUrl) {
        await continueAfterImagePreference(ctx);
      } else {
        await showImagePreference(ctx);
      }
      return;
    }

    if (ctx.session) {
      ctx.session.state = 'AWAITING_PRODUCT_INPUT';
    }

    const actionLabels: Record<GenerateAction, string> = {
      image_set: '7 gambar (1 per scene HPAS)',
      video: 'video iklan HPAS',
      clone_style: 'clone style + generate',
      campaign: '5 atau 10 video batch',
    };

    const text = action === 'clone_style'
      ? `🔄 *Clone Style*\n\nKirim foto **referensi gaya** yang ingin ditiru.\n(Setelah itu kirim foto produk kamu)`
      : `📸 *Upload Foto Produk*\n\nKirim foto produk atau ketik deskripsi produk.\n\nOutput: ${actionLabels[action]}`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err) {
    logger.error('requestProductInput error', err);
  }
}

// ── Image Preference (for prompt library / pre-filled prompts) ────────────────

/** Show image preference screen: user can upload a reference image or skip */
export async function showImagePreference(ctx: BotContext): Promise<void> {
  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery().catch(() => {});

    const text = `📸 *Foto Referensi*\n\n` +
      `Ingin menggunakan foto referensi untuk hasil yang lebih bagus?\n\n` +
      `• Kirim foto untuk mode *Image-to-Video*\n` +
      `• Atau skip untuk *Text-to-Video*`;

    const markup = {
      inline_keyboard: [
        [{ text: '📸 Upload Foto Referensi', callback_data: 'image_pref_upload' }],
        [{ text: '🚀 Langsung Generate (Tanpa Foto)', callback_data: 'image_pref_skip' }],
        [{ text: '◀️ Kembali', callback_data: 'generate_start' }],
      ],
    };
    try {
      if (ctx.callbackQuery) await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      else await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: markup });
    } catch { await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: markup }); }
  } catch (err) {
    logger.error('showImagePreference error', err);
  }
}

/** Continue the flow after image preference has been resolved (uploaded or skipped) */
export async function continueAfterImagePreference(ctx: BotContext): Promise<void> {
  const mode = ctx.session?.generateMode as GenerateMode || 'basic';
  const action = ctx.session?.generateAction as GenerateAction || 'video';
  const prefilledPrompt = ctx.session?.generateProductDesc as string || '';

  if (mode === 'basic') {
    await showConfirmScreen(ctx);
    return;
  }
  if (mode === 'smart' && action === 'video') {
    if (ctx.session?.generatePreset && ctx.session?.generatePlatform) {
      await showConfirmScreen(ctx);
    } else {
      await showSmartPresetSelection(ctx);
    }
    return;
  }
  if (mode === 'pro' && action === 'video') {
    await showProSceneReview(ctx, prefilledPrompt);
    return;
  }
  await showConfirmScreen(ctx);
}

// ── Smart Mode: Preset Selection ──────────────────────────────────────────────

export async function showSmartPresetSelection(ctx: BotContext): Promise<void> {
  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery().catch(() => {});

    const text = `🎯 *Smart Mode*\n\nPilih durasi video:`;

    const markup = {
      inline_keyboard: [
        [{ text: `⚡ Quick — 15 detik (${UNIT_COSTS.VIDEO_15S / 10} kredit)`, callback_data: 'preset_quick' }],
        [{ text: `🎯 Standard — 30 detik (${UNIT_COSTS.VIDEO_30S / 10} kredit)`, callback_data: 'preset_standard' }],
        [{ text: `📽️ Extended — 60 detik (${UNIT_COSTS.VIDEO_60S / 10} kredit)`, callback_data: 'preset_extended' }],
        [{ text: '⏱️ Custom — Pilih Durasi Sendiri', callback_data: 'preset_custom' }],
        [{ text: '◀️ Kembali', callback_data: 'action_video' }],
        [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
      ],
    };
    try {
      if (ctx.callbackQuery) await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      else await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: markup });
    } catch { await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: markup }); }
  } catch (err) {
    logger.error('showSmartPresetSelection error', err);
  }
}

export async function showSmartPlatformSelection(ctx: BotContext, preset: DurationPreset): Promise<void> {
  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery().catch(() => {});

    if (ctx.session) {
      ctx.session.generatePreset = preset;
    }

    const text = `Platform tujuan:`;

    const markup = {
      inline_keyboard: [
        [{ text: '🎵 TikTok (9:16)', callback_data: 'platform_tiktok' }],
        [{ text: '📸 Instagram (9:16)', callback_data: 'platform_instagram' }],
        [{ text: '▶️ YouTube (16:9)', callback_data: 'platform_youtube' }],
        [{ text: '⬛ Square (1:1)', callback_data: 'platform_square' }],
        [{ text: '◀️ Kembali', callback_data: 'action_video' }],
        [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
      ],
    };
    try {
      if (ctx.callbackQuery) await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      else await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: markup });
    } catch { await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: markup }); }
  } catch (err) {
    logger.error('showSmartPlatformSelection error', err);
  }
}

// ── Pro Mode: Scene Review ────────────────────────────────────────────────────

export async function showProSceneReview(
  ctx: BotContext,
  productDescription: string
): Promise<void> {
  try {
    const industry = detectIndustry(productDescription);
    const scenes = generateVideoScenePrompts(industry, productDescription, 'standard', 'id');

    if (ctx.session) {
      ctx.session.generateScenes = scenes;
    }

    const sceneList = scenes
      .map((s, i) => `${i + 1}. *${HPAS_SCENES[s.sceneId].nameId}* (${s.durationSeconds}s)\n   ${s.prompt.slice(0, 60)}...`)
      .join('\n\n');

    const text = `👑 *Pro Mode — Review Scene*\n\nIndustri terdeteksi: *${industry}*\n\n${sceneList}\n\nTap scene untuk edit, atau lanjut:`;

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          ...scenes.map((s, i) => [{ text: `✏️ Edit Scene ${i + 1}: ${HPAS_SCENES[s.sceneId].nameId}`, callback_data: `edit_scene_${s.sceneId}` }]),
          [{ text: '✅ Lanjut ke Pilih Durasi', callback_data: 'pro_select_duration' }],
          [{ text: '◀️ Kembali', callback_data: 'action_video' }],
          [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
        ],
      },
    });
  } catch (err) {
    logger.error('showProSceneReview error', err);
  }
}

// ── Confirm Screen ────────────────────────────────────────────────────────────

export async function showConfirmScreen(ctx: BotContext): Promise<void> {
  try {
    const session = ctx.session;
    if (!session) return;

    const mode = session.generateMode as GenerateMode || 'basic';
    const action = session.generateAction as GenerateAction || 'video';
    const preset = (session.generatePreset as DurationPreset) || 'standard';
    const platform = session.generatePlatform as Platform || 'tiktok';
    const productDesc = session.generateProductDesc as string || '';

    const presetConfig = preset === 'custom' && session.customPresetConfig
      ? session.customPresetConfig as typeof DURATION_PRESETS['standard']
      : DURATION_PRESETS[preset];
    const industry = detectIndustry(productDesc);

    let cost = 0;
    let actionLabel = '';

    if (action === 'image_set') { cost = UNIT_COSTS.IMAGE_SET_7_SCENE; actionLabel = '📸 Image Set 7 Scene'; }
    else if (action === 'video') { cost = presetConfig.creditCost; actionLabel = `🎥 Video ${presetConfig.totalSeconds}s`; }
    else if (action === 'clone_style') { cost = UNIT_COSTS.CLONE_STYLE; actionLabel = '🔄 Clone Style'; }
    else if (action === 'campaign') {
      const campSize = (session.generateCampaignSize as 5 | 10) || 5;
      cost = CampaignService.getCampaignCost(campSize);
      actionLabel = `📦 Campaign ${campSize} Video`;
    }

    const modeLabel = mode === 'basic' ? '⚡ Basic' : mode === 'smart' ? '🎯 Smart' : '👑 Pro';
    const platformLabel: Record<Platform, string> = { tiktok: '🎵 TikTok 9:16', instagram: '📸 Instagram 9:16', youtube: '▶️ YouTube 16:9', square: '⬛ Square 1:1' };

    const text = `✅ *Konfirmasi Generate*\n\n` +
      `Mode: ${modeLabel}\n` +
      `Aksi: ${actionLabel}\n` +
      `Platform: ${platformLabel[platform]}\n` +
      `Industri: ${industry}\n` +
      `Produk: ${productDesc.slice(0, 60)}${productDesc.length > 60 ? '...' : ''}\n\n` +
      `💰 Biaya: **${cost / 10} kredit**`;

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: `✅ Generate Sekarang (${cost / 10} kredit)`, callback_data: 'generate_confirm' }],
          [{ text: '◀️ Kembali', callback_data: 'generate_start' }],
          [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
        ],
      },
    });
  } catch (err) {
    logger.error('showConfirmScreen error', err);
  }
}

// ── Post-Delivery Nagih Loop ──────────────────────────────────────────────────

export async function showPostDelivery(ctx: BotContext): Promise<void> {
  try {
    // Clear session fields from previous generation to prevent stale data leaking into next flow
    if (ctx.session) {
      delete ctx.session.generateProductDesc;
      delete ctx.session.generatePhotoUrl;
      delete ctx.session.generatePreset;
      delete ctx.session.generatePlatform;
      delete ctx.session.generateAction;
      delete ctx.session.generateScenes;
      delete ctx.session.generateMode;
      delete ctx.session.generateCampaignSize;
      delete ctx.session.customPresetConfig;
    }

    const text = `✨ *Konten berhasil dibuat!*\n\nMau apa selanjutnya?`;

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄 Variasi Lain', callback_data: 'generate_start' },
            { text: '📦 Campaign', callback_data: 'action_campaign' },
          ],
          [
            { text: '⭐ Rate Hasil', callback_data: 'generate_rate' },
            { text: '👥 Refer Teman', callback_data: 'referral_menu' },
          ],
          [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
        ],
      },
    });
  } catch (err) {
    logger.error('showPostDelivery error', err);
  }
}

// ── Callback Router ───────────────────────────────────────────────────────────

export async function handleGenerateCallback(ctx: BotContext, data: string): Promise<boolean> {
  if (!data.startsWith('generate_') || data.startsWith('mode_') || data.startsWith('action_') || data.startsWith('preset_') || data.startsWith('platform_') || data.startsWith('campaign_size')) return false;

  try {
    if (data === 'generate_start') { await showGenerateMode(ctx); return true; }

    // Mode selection
    if (data === 'mode_basic') { await showGenerateAction(ctx, 'basic'); return true; }
    if (data === 'mode_smart') { await showGenerateAction(ctx, 'smart'); return true; }
    if (data === 'mode_pro') { await showGenerateAction(ctx, 'pro'); return true; }

    // Action selection
    if (data === 'action_image_set') { await requestProductInput(ctx, 'image_set'); return true; }
    if (data === 'action_clone_style') { await requestProductInput(ctx, 'clone_style'); return true; }
    if (data === 'action_campaign') { await requestProductInput(ctx, 'campaign'); return true; }
    if (data === 'action_video') {
      const mode = ctx.session?.generateMode as GenerateMode || 'basic';
      if (mode === 'smart') { await showSmartPresetSelection(ctx); return true; }
      if (mode === 'basic') { await requestProductInput(ctx, 'video'); return true; }
      await requestProductInput(ctx, 'video');
      return true;
    }

    // Smart mode
    if (data.startsWith('preset_')) {
      const preset = data.replace('preset_', '') as DurationPreset;
      await showSmartPlatformSelection(ctx, preset);
      return true;
    }

    if (data.startsWith('platform_')) {
      const platform = data.replace('platform_', '') as Platform;
      if (ctx.session) ctx.session.generatePlatform = platform;
      await requestProductInput(ctx, 'video');
      return true;
    }

    // Campaign size
    if (data === 'campaign_size_5') { if (ctx.session) ctx.session.generateCampaignSize = 5; await showConfirmScreen(ctx); return true; }
    if (data === 'campaign_size_10') { if (ctx.session) ctx.session.generateCampaignSize = 10; await showConfirmScreen(ctx); return true; }

    // Confirm → execute
    if (data === 'generate_confirm') {
      await ctx.answerCbQuery?.('⏳ Memproses...');
      await executeGeneration(ctx);
      return true;
    }
  } catch (err) {
    logger.error('handleGenerateCallback error', err);
  }

  return false;
}
