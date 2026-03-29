import { BotContext } from "@/types";
import { logger } from "@/utils/logger";
import { prisma } from "@/config/database";
import { UserService } from "@/services/user.service";
import { VideoService } from "@/services/video.service";

export async function handleLegacyCreationCallback(ctx: BotContext, data: string): Promise<boolean> {
    // ── Legacy vcreate_* → redirect to V3 flow ───────────────────────────────
    if (data.startsWith("vcreate_") && data !== "vcreate_confirm") {
      const { showGenerateMode } = await import("../../flows/generate.js");
      await showGenerateMode(ctx);
      return true;
    }

    if (data === "vcreate_confirm") {
      await ctx.answerCbQuery();

      if (
        !ctx.session?.videoCreationNew ||
        !ctx.session.videoCreationNew.template
      ) {
        await ctx.reply("❌ Session expired. Mulai lagi dengan /start");
        return true;
      }

      const { getTemplateById } = await import("../../config/templates.js");
      const template = getTemplateById(ctx.session.videoCreationNew.template);

      if (!template) {
        await ctx.reply("❌ Template tidak ditemukan");
        return true;
      }

      const user = ctx.from;
      if (!user) return true;

      const telegramId = BigInt(user.id);
      const dbUser = await UserService.findByTelegramId(telegramId);

      if (!dbUser || Number(dbUser.creditBalance) < template.creditCost) {
        await ctx.editMessageText(
          `❌ *Kredit tidak cukup*\n\n` +
          `Butuh: ${template.creditCost} kredit\n` +
          `Saldo: ${dbUser?.creditBalance || 0} kredit`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "💰 Beli Kredit", callback_data: "topup" }],
                [{ text: "◀️ Kembali", callback_data: "main_menu" }],
              ],
            },
          },
        );
        return true;
      }

      // Deduct credits
      await UserService.deductCredits(telegramId, template.creditCost);

      // Build prompt from template + user input
      const textInput = ctx.session.videoCreationNew.textInput || "";

      let prompt = `Create a ${template.name} video with ${template.sceneCount} scenes. `;
      prompt += `Theme: ${template.theme}, Vibe: ${template.vibe}, Mood: ${template.mood}. `;
      prompt += `Lighting: ${template.lighting}, Colors: ${template.colors.join(", ")}. `;
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
          platform: "tiktok",
          duration,
          scenes: template.sceneCount,
          title: `${template.name} - ${new Date().toLocaleDateString("id-ID")}`,
        });

        const actualJobId = video.jobId;

        // Trigger actual video generation
        const { generateVideoWithFallback } =
          await import("../../services/video-fallback.service.js");

        // Download reference image if uploaded
        let referenceImageUrl: string | null = null;
        if (
          ctx.session.videoCreationNew.uploadedPhotos &&
          ctx.session.videoCreationNew.uploadedPhotos.length > 0
        ) {
          try {
            const fileId =
              ctx.session.videoCreationNew.uploadedPhotos[0].fileId;
            const fileLink = await ctx.telegram.getFileLink(fileId);
            referenceImageUrl = fileLink.toString();
            logger.info(`📸 Reference image downloaded: ${referenceImageUrl}`);
          } catch (err) {
            logger.error("Failed to download reference image:", err);
          }
        }

        // Start generation in background
        generateVideoWithFallback({
          prompt,
          duration,
          aspectRatio: "9:16",
          style: template.vibe,
          niche: template.theme,
          referenceImage: referenceImageUrl,
        })
          .then(async (result) => {
            if (result.success && result.videoUrl) {
              // Update video record
              await prisma.video.update({
                where: { jobId: actualJobId },
                data: {
                  status: "completed",
                  progress: 100,
                  videoUrl: result.videoUrl,
                  thumbnailUrl: result.thumbnailUrl,
                },
              });

              // Send video to user
              await ctx.telegram.sendVideo(ctx.chat!.id, result.videoUrl, {
                caption: `✅ *Video Selesai!*\n\n📋 ${template.name}\n🎬 ${template.sceneCount} scene • ${duration} detik`,
                parse_mode: "Markdown",
              });
            } else {
              throw new Error(result.error || "Generation failed");
            }
          })
          .catch(async (error) => {
            logger.error("Video generation failed:", error);
            await UserService.refundCredits(
              telegramId,
              template.creditCost,
              actualJobId,
              error.message,
            );
            await ctx.telegram.sendMessage(
              ctx.chat!.id,
              `❌ *Generation Failed*\n\n` +
              `Job: ${actualJobId}\n` +
              `${error.message}\n\n` +
              `Kredit kamu sudah di-refund.`,
              { parse_mode: "Markdown" },
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
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🎞 Video Saya", callback_data: "videos_list" }],
                [{ text: "🏠 Menu Utama", callback_data: "main_menu" }],
              ],
            },
          },
        );

        // Clear session
        if (ctx.session) {
          ctx.session.videoCreationNew = undefined;
          ctx.session.state = "DASHBOARD";
        }
      } catch (error: any) {
        logger.error("Video generation failed:", error);
        // Refund credits
        await UserService.refundCredits(
          telegramId,
          template.creditCost,
          jobId,
          error.message,
        );
        await ctx.reply(
          `❌ *Generation Failed*\n\n` +
          `${error.message}\n\n` +
          `Kredit kamu sudah di-refund.`,
          { parse_mode: "Markdown" },
        );
      }
      return true;
    }

    if (data === "create_image_new") {
      await ctx.answerCbQuery(
        "🚧 Alur Buat Gambar baru segera hadir! Gunakan menu lama sementara.",
      );
      // Fallback to old flow
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
      return true;
    }
    
    return false;
}
