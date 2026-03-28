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

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';
import { UNIT_COSTS, CREDIT_PACKAGES_V3, creditsToUnits } from '@/config/pricing';
import { detectIndustry, generateVideoScenePrompts, HPAS_SCENES, DURATION_PRESETS } from '@/config/hpas-engine';
import { CampaignService } from '@/services/campaign.service';
import type { IndustryId, DurationPreset } from '@/config/hpas-engine';

type GenerateMode = 'basic' | 'smart' | 'pro';
type GenerateAction = 'image_set' | 'video' | 'clone_style' | 'campaign';
type Platform = 'tiktok' | 'instagram' | 'youtube' | 'square';

// ── Step 1: Mode Selection ────────────────────────────────────────────────────

export async function showModeSelection(ctx: BotContext): Promise<void> {
  try {
    await ctx.answerCbQuery?.();

    const text = `🎬 *Generate Konten*\n\nPilih mode:`;

    await ctx.editMessageText?.(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⚡ Basic — Full Auto', callback_data: 'v3_mode_basic' }],
          [{ text: '🎯 Smart — Pilih Preset', callback_data: 'v3_mode_smart' }],
          [{ text: '👑 Pro — Full Control', callback_data: 'v3_mode_pro' }],
          [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
        ],
      },
    }) ?? await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⚡ Basic — Full Auto', callback_data: 'v3_mode_basic' }],
          [{ text: '🎯 Smart — Pilih Preset', callback_data: 'v3_mode_smart' }],
          [{ text: '👑 Pro — Full Control', callback_data: 'v3_mode_pro' }],
          [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }],
        ],
      },
    });
  } catch (err) {
    logger.error('showModeSelection error', err);
  }
}

// ── Step 2: Action Selection ──────────────────────────────────────────────────

export async function showActionSelection(ctx: BotContext, mode: GenerateMode): Promise<void> {
  try {
    await ctx.answerCbQuery?.();

    const modeLabel = mode === 'basic' ? '⚡ Basic' : mode === 'smart' ? '🎯 Smart' : '👑 Pro';

    if (ctx.session) {
      ctx.session.v3Mode = mode;
    }

    const text = `${modeLabel} Mode\n\nPilih aksi:`;

    await ctx.editMessageText?.(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: `📸 Image Set (7 scene) — ${UNIT_COSTS.IMAGE_SET_7_SCENE} unit`, callback_data: `v3_action_image_set` }],
          [{ text: `🎥 Video Iklan — mulai ${UNIT_COSTS.VIDEO_15S} unit`, callback_data: `v3_action_video` }],
          [{ text: `🔄 Clone Style — ${UNIT_COSTS.CLONE_STYLE} unit`, callback_data: `v3_action_clone_style` }],
          [{ text: `📦 Campaign (5/10 video) — ${UNIT_COSTS.CAMPAIGN_5_VIDEO}/${UNIT_COSTS.CAMPAIGN_10_VIDEO} unit`, callback_data: `v3_action_campaign` }],
          [{ text: '◀️ Kembali', callback_data: 'v3_start' }],
        ],
      },
    }) ?? await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err) {
    logger.error('showActionSelection error', err);
  }
}

// ── Step 3: Input Prompt ──────────────────────────────────────────────────────

export async function requestProductInput(ctx: BotContext, action: GenerateAction): Promise<void> {
  try {
    await ctx.answerCbQuery?.();

    if (ctx.session) {
      ctx.session.v3Action = action;
      ctx.session.state = 'V3_AWAITING_PRODUCT';
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

// ── Smart Mode: Preset Selection ──────────────────────────────────────────────

export async function showSmartPresetSelection(ctx: BotContext): Promise<void> {
  try {
    await ctx.answerCbQuery?.();

    const text = `🎯 *Smart Mode*\n\nPilih durasi video:`;

    await ctx.editMessageText?.(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: `⚡ Quick — 15 detik (${UNIT_COSTS.VIDEO_15S} unit)`, callback_data: 'v3_preset_quick' }],
          [{ text: `🎯 Standard — 30 detik (${UNIT_COSTS.VIDEO_30S} unit)`, callback_data: 'v3_preset_standard' }],
          [{ text: `📽️ Extended — 60 detik (${UNIT_COSTS.VIDEO_60S} unit)`, callback_data: 'v3_preset_extended' }],
          [{ text: '◀️ Kembali', callback_data: 'v3_action_video' }],
        ],
      },
    }) ?? await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err) {
    logger.error('showSmartPresetSelection error', err);
  }
}

export async function showSmartPlatformSelection(ctx: BotContext, preset: DurationPreset): Promise<void> {
  try {
    await ctx.answerCbQuery?.();

    if (ctx.session) {
      ctx.session.v3Preset = preset;
    }

    const text = `Platform tujuan:`;

    await ctx.editMessageText?.(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎵 TikTok (9:16)', callback_data: 'v3_platform_tiktok' }],
          [{ text: '📸 Instagram (9:16)', callback_data: 'v3_platform_instagram' }],
          [{ text: '▶️ YouTube (16:9)', callback_data: 'v3_platform_youtube' }],
          [{ text: '⬛ Square (1:1)', callback_data: 'v3_platform_square' }],
          [{ text: '◀️ Kembali', callback_data: 'v3_action_video' }],
        ],
      },
    }) ?? await ctx.reply(text, { parse_mode: 'Markdown' });
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
      ctx.session.v3Scenes = scenes;
    }

    const sceneList = scenes
      .map((s, i) => `${i + 1}. *${HPAS_SCENES[s.sceneId].nameId}* (${s.durationSeconds}s)\n   ${s.prompt.slice(0, 60)}...`)
      .join('\n\n');

    const text = `👑 *Pro Mode — Review Scene*\n\nIndustri terdeteksi: *${industry}*\n\n${sceneList}\n\nTap scene untuk edit, atau lanjut:`;

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          ...scenes.map((s, i) => [{ text: `✏️ Edit Scene ${i + 1}: ${HPAS_SCENES[s.sceneId].nameId}`, callback_data: `v3_edit_scene_${s.sceneId}` }]),
          [{ text: '✅ Lanjut ke Pilih Durasi', callback_data: 'v3_pro_select_duration' }],
          [{ text: '◀️ Kembali', callback_data: 'v3_action_video' }],
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

    const mode = session.v3Mode as GenerateMode || 'basic';
    const action = session.v3Action as GenerateAction || 'video';
    const preset = (session.v3Preset as DurationPreset) || 'standard';
    const platform = session.v3Platform as Platform || 'tiktok';
    const productDesc = session.v3ProductDesc as string || '';

    const presetConfig = DURATION_PRESETS[preset];
    const industry = detectIndustry(productDesc);

    let cost = 0;
    let actionLabel = '';

    if (action === 'image_set') { cost = UNIT_COSTS.IMAGE_SET_7_SCENE; actionLabel = '📸 Image Set 7 Scene'; }
    else if (action === 'video') { cost = presetConfig.creditCost; actionLabel = `🎥 Video ${presetConfig.totalSeconds}s`; }
    else if (action === 'clone_style') { cost = UNIT_COSTS.CLONE_STYLE; actionLabel = '🔄 Clone Style'; }
    else if (action === 'campaign') {
      const campSize = (session.v3CampaignSize as 5 | 10) || 5;
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
      `💰 Biaya: **${cost} unit**`;

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: `✅ Generate Sekarang (${cost} unit)`, callback_data: 'v3_confirm_generate' }],
          [{ text: '◀️ Kembali', callback_data: 'v3_start' }],
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
    const text = `✨ *Konten berhasil dibuat!*\n\nMau apa selanjutnya?`;

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄 Variasi Lain', callback_data: 'v3_start' },
            { text: '📦 Campaign', callback_data: 'v3_action_campaign' },
          ],
          [
            { text: '⭐ Rate Hasil', callback_data: 'v3_rate' },
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

export async function handleV3Callback(ctx: BotContext, data: string): Promise<boolean> {
  if (!data.startsWith('v3_')) return false;

  try {
    if (data === 'v3_start') { await showModeSelection(ctx); return true; }

    // Mode selection
    if (data === 'v3_mode_basic') { await showActionSelection(ctx, 'basic'); return true; }
    if (data === 'v3_mode_smart') { await showActionSelection(ctx, 'smart'); return true; }
    if (data === 'v3_mode_pro') { await showActionSelection(ctx, 'pro'); return true; }

    // Action selection
    if (data === 'v3_action_image_set') { await requestProductInput(ctx, 'image_set'); return true; }
    if (data === 'v3_action_clone_style') { await requestProductInput(ctx, 'clone_style'); return true; }
    if (data === 'v3_action_campaign') { await requestProductInput(ctx, 'campaign'); return true; }
    if (data === 'v3_action_video') {
      const mode = ctx.session?.v3Mode as GenerateMode || 'basic';
      if (mode === 'smart') { await showSmartPresetSelection(ctx); return true; }
      if (mode === 'basic') { await requestProductInput(ctx, 'video'); return true; }
      await requestProductInput(ctx, 'video');
      return true;
    }

    // Smart mode
    if (data.startsWith('v3_preset_')) {
      const preset = data.replace('v3_preset_', '') as DurationPreset;
      await showSmartPlatformSelection(ctx, preset);
      return true;
    }

    if (data.startsWith('v3_platform_')) {
      const platform = data.replace('v3_platform_', '') as Platform;
      if (ctx.session) ctx.session.v3Platform = platform;
      await requestProductInput(ctx, 'video');
      return true;
    }

    // Campaign size
    if (data === 'v3_campaign_5') { if (ctx.session) ctx.session.v3CampaignSize = 5; await showConfirmScreen(ctx); return true; }
    if (data === 'v3_campaign_10') { if (ctx.session) ctx.session.v3CampaignSize = 10; await showConfirmScreen(ctx); return true; }

    // Confirm
    if (data === 'v3_confirm_generate') {
      await ctx.answerCbQuery?.('⏳ Memproses...');
      await ctx.reply('⏳ Generating konten... Mohon tunggu ~30-60 detik');
      // Actual generation is handled by message handler + existing video/image services
      return true;
    }
  } catch (err) {
    logger.error('handleV3Callback error', err);
  }

  return false;
}
