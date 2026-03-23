/**
 * New Video Creation Flow (Redesign 2026-03-24)
 * 
 * Simplified 10-step flow:
 * 1. Pilih sumber konten (Foto/Teks/Foto+Teks)
 * 2. Upload materi atau tulis naskah
 * 3. Pilih tipe konten (Video Penuh/Image Only/Image+Video)
 * 4. Pilih kategori template (Tema/Vibe/Scene Count)
 * 5. Pilih template spesifik
 * 6. Sesuaikan vibe & scene count (opsional)
 * 7. Preview & konfirmasi
 * 8. Proses & hasil
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';

/**
 * Step 1: Pilih sumber konten
 */
export async function startVideoCreationNew(ctx: BotContext): Promise<void> {
  try {
    await ctx.answerCbQuery();

    // Initialize new video creation session
    if (ctx.session) {
      ctx.session.state = 'VIDEO_CREATE_SOURCE';
      ctx.session.videoCreationNew = {
        step: 1,
        source: null,
        contentType: null,
        theme: null,
        vibe: null,
        sceneCount: null,
        template: null,
      };
    }

    await ctx.editMessageText(
      `🎬 *Buat Video Baru*\n\n` +
      `**Step 1/7:** Pilih sumber konten\n\n` +
      `Dari mana kamu mau mulai?`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📸 Foto Produk', callback_data: 'vcreate_source_photo' }],
            [{ text: '✍️ Teks/Script', callback_data: 'vcreate_source_text' }],
            [{ text: '📸+✍️ Foto + Teks', callback_data: 'vcreate_source_both' }],
            [{ text: '🔄 Clone Video (Gaya)', callback_data: 'vcreate_source_clone' }],
            [{ text: '◀️ Menu Utama', callback_data: 'main_menu' }],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('Error starting video creation:', error);
    await ctx.answerCbQuery('❌ Terjadi kesalahan. Coba lagi.');
  }
}

/**
 * Step 2: Upload materi atau tulis naskah
 */
export async function handleVideoSourceSelection(ctx: BotContext, source: string): Promise<void> {
  try {
    await ctx.answerCbQuery();

    if (!ctx.session?.videoCreationNew) {
      await ctx.reply('❌ Session expired. Mulai lagi dengan /start');
      return;
    }

    ctx.session.videoCreationNew.source = source;
    ctx.session.videoCreationNew.step = 2;

    const instructions: Record<string, string> = {
      photo: '📸 *Upload Foto Produk*\n\nKirim foto produk kamu sekarang.\n\n_Tip: Foto dengan pencahayaan baik menghasilkan video lebih bagus._',
      text: '✍️ *Tulis Naskah/Deskripsi*\n\nDeskripsikan video yang kamu mau.\n\n_Contoh: "Video promosi skincare untuk kulit berminyak, tone calm & natural, durasi 15 detik"_',
      both: '📸+✍️ *Upload Foto + Tulis Deskripsi*\n\nKirim foto produk dulu, lalu tulis deskripsi tambahan.',
      clone: '🔄 *Clone Gaya Video*\n\nKirim link video (YouTube/IG/TikTok) atau deskripsikan gaya yang kamu mau tiru.\n\n_Catatan: Hanya gaya visual/pacing yang ditiru, bukan konten persis._',
    };

    ctx.session.state = source === 'photo' || source === 'both' ? 'VIDEO_CREATE_UPLOAD' : 'VIDEO_CREATE_TEXT';

    await ctx.editMessageText(
      instructions[source] || instructions.text,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '◀️ Kembali', callback_data: 'create_video_new' }],
            [{ text: '❌ Batal', callback_data: 'main_menu' }],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('Error handling video source selection:', error);
  }
}

/**
 * Step 3: Pilih tipe konten
 */
export async function showContentTypeSelection(ctx: BotContext): Promise<void> {
  try {
    if (!ctx.session?.videoCreationNew) return;

    ctx.session.videoCreationNew.step = 3;
    ctx.session.state = 'VIDEO_CREATE_CONTENT_TYPE';

    await ctx.reply(
      `🎬 *Step 3/7: Pilih Tipe Konten*\n\n` +
      `Mau hasil seperti apa?`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎥 Video Penuh (Gambar + Audio + Transisi)', callback_data: 'vcreate_type_full' }],
            [{ text: '🖼 Image Only (Seri Gambar)', callback_data: 'vcreate_type_image' }],
            [{ text: '🎬+🖼 Image + Video (Kombinasi)', callback_data: 'vcreate_type_hybrid' }],
            [{ text: '◀️ Kembali', callback_data: 'create_video_new' }],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('Error showing content type selection:', error);
  }
}

/**
 * Step 4: Pilih kategori template
 */
export async function showTemplateCategorySelection(ctx: BotContext): Promise<void> {
  try {
    if (!ctx.session?.videoCreationNew) return;

    ctx.session.videoCreationNew.step = 4;
    ctx.session.state = 'VIDEO_CREATE_CATEGORY';

    await ctx.editMessageText(
      `🎨 *Step 4/7: Pilih Kategori Template*\n\n` +
      `Pilih tema/konsep:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏢 Editorial', callback_data: 'vcreate_theme_editorial' }],
            [{ text: '👕 Streetwear', callback_data: 'vcreate_theme_streetwear' }],
            [{ text: '💎 Luxury', callback_data: 'vcreate_theme_luxury' }],
            [{ text: '🌿 Lifestyle', callback_data: 'vcreate_theme_lifestyle' }],
            [{ text: '🍔 F&B', callback_data: 'vcreate_theme_fnb' }],
            [{ text: '💻 Tech', callback_data: 'vcreate_theme_tech' }],
            [{ text: '💄 Beauty', callback_data: 'vcreate_theme_beauty' }],
            [{ text: '◀️ Kembali', callback_data: 'create_video_new' }],
          ],
        },
      }
    );
  } catch (error) {
    logger.error('Error showing template category:', error);
  }
}

/**
 * Step 5: Pilih template spesifik
 */
export async function showTemplateSelection(ctx: BotContext, theme: string): Promise<void> {
  try {
    if (!ctx.session?.videoCreationNew) return;

    const { getTemplatesByTheme } = await import('../config/templates.js');
    const templates = getTemplatesByTheme(theme);

    if (templates.length === 0) {
      await ctx.answerCbQuery('🚧 Template untuk tema ini segera hadir!');
      return;
    }

    ctx.session.videoCreationNew.step = 5;
    ctx.session.videoCreationNew.theme = theme;
    ctx.session.state = 'VIDEO_CREATE_TEMPLATE';

    const themeLabels: Record<string, string> = {
      editorial: '🏢 Editorial',
      streetwear: '👕 Streetwear',
      luxury: '💎 Luxury',
      lifestyle: '🌿 Lifestyle',
      fnb: '🍔 F&B',
      tech: '💻 Tech',
      beauty: '💄 Beauty',
    };

    let message = `🎨 *Step 5/7: Pilih Template*\n\n`;
    message += `Tema: ${themeLabels[theme] || theme}\n\n`;
    message += `Pilih template yang sesuai:\n\n`;

    const buttons: Array<Array<{ text: string; callback_data: string }>> = [];

    templates.forEach((template, idx) => {
      const emoji = template.isPopular ? '⭐' : template.isTrending ? '🔥' : '📋';
      message += `${idx + 1}. ${emoji} *${template.name}*\n`;
      message += `   ${template.sceneCount} scene • ${template.creditCost} kredit\n`;
      message += `   _${template.description}_\n\n`;

      buttons.push([{
        text: `${emoji} ${template.name} (${template.creditCost} kredit)`,
        callback_data: `vcreate_template_${template.id}`,
      }]);
    });

    buttons.push([{ text: '◀️ Kembali', callback_data: 'vcreate_back_category' }]);
    buttons.push([{ text: '❌ Batal', callback_data: 'main_menu' }]);

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons },
    });
  } catch (error) {
    logger.error('Error showing template selection:', error);
  }
}

/**
 * Step 6: Preview & konfirmasi (skip customize untuk MVP)
 */
export async function showTemplatePreview(ctx: BotContext, templateId: string): Promise<void> {
  try {
    if (!ctx.session?.videoCreationNew) return;

    const { getTemplateById } = await import('../config/templates.js');
    const template = getTemplateById(templateId);

    if (!template) {
      await ctx.answerCbQuery('❌ Template tidak ditemukan');
      return;
    }

    ctx.session.videoCreationNew.step = 6;
    ctx.session.videoCreationNew.template = templateId;
    ctx.session.state = 'VIDEO_CREATE_PREVIEW';

    const user = ctx.from;
    if (!user) return;
    const dbUser = await UserService.findByTelegramId(BigInt(user.id));
    const credBal = dbUser ? Number(dbUser.creditBalance) : 0;

    const sourceLabels: Record<string, string> = {
      photo: '📸 Foto Produk',
      text: '✍️ Teks/Script',
      both: '📸+✍️ Foto + Teks',
      clone: '🔄 Clone Gaya',
    };

    const typeLabels: Record<string, string> = {
      full: '🎥 Video Penuh',
      image: '🖼 Image Only',
      hybrid: '🎬+🖼 Hybrid',
    };

    const source = ctx.session.videoCreationNew.source || 'text';
    const contentType = ctx.session.videoCreationNew.contentType || 'full';

    let message = `✅ *Step 6/7: Preview & Konfirmasi*\n\n`;
    message += `📋 *Ringkasan:*\n`;
    message += `• Sumber: ${sourceLabels[source] || source}\n`;
    message += `• Tipe: ${typeLabels[contentType] || contentType}\n`;
    message += `• Template: ${template.name}\n`;
    message += `• Scene: ${template.sceneCount}\n`;
    message += `• Vibe: ${template.vibe}\n`;
    message += `• Mood: ${template.mood}\n\n`;
    message += `💰 *Biaya: ${template.creditCost} kredit*\n`;
    message += `💳 Saldo: ${credBal} kredit\n\n`;

    if (credBal < template.creditCost) {
      message += `⚠️ *Kredit tidak cukup!*\n`;
      message += `Butuh ${template.creditCost - credBal} kredit lagi.\n`;

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Beli Kredit', callback_data: 'topup' }],
            [{ text: '◀️ Pilih Template Lain', callback_data: `vcreate_theme_${template.theme}` }],
            [{ text: '❌ Batal', callback_data: 'main_menu' }],
          ],
        },
      });
      return;
    }

    message += `Siap generate?`;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Generate Sekarang!', callback_data: 'vcreate_confirm' }],
          [{ text: '⚙️ Opsi Lanjutan (Customize)', callback_data: 'vcreate_customize' }],
          [{ text: '💾 Simpan sebagai Favorit', callback_data: 'vcreate_save_favorite' }],
          [{ text: '◀️ Pilih Template Lain', callback_data: `vcreate_theme_${template.theme}` }],
          [{ text: '❌ Batal', callback_data: 'main_menu' }],
        ],
      },
    });
  } catch (error) {
    logger.error('Error showing template preview:', error);
  }
}

/**
 * Placeholder: Full implementation akan dilanjutkan
 */
export async function handleTemplateCategorySelection(ctx: BotContext, theme: string): Promise<void> {
  await showTemplateSelection(ctx, theme);
}
