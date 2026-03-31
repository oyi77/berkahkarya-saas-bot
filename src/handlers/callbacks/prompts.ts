import { BotContext } from "@/types";
import { prisma } from "@/config/database";
import { UserService } from "@/services/user.service";
import { logger } from "@/utils/logger";

export async function handlePromptsCallback(ctx: BotContext, data: string): Promise<boolean> {
    // ── PROMPT LIBRARY HANDLERS ───────────────────────────────────────────
    if (data.startsWith("prompts_niche_")) {
      const niche = data.replace("prompts_niche_", "");
      await ctx.answerCbQuery();

      const { getPromptsByNiche } =
        await import("../../config/professional-prompts.js");
      const prompts = getPromptsByNiche(niche);

      if (prompts.length === 0) {
        await ctx.editMessageText(
          `⚠️ Prompt library untuk niche ${niche} belum tersedia.\n\n` +
          `Silakan pilih niche lain atau hubungi support.`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "◀️ Kembali", callback_data: "main_menu" }],
              ],
            },
          },
        );
        return true;
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

      let message = `📚 *Prompt Library: ${nicheLabels[niche] || niche}*\n\n`;
      message += `Pilih prompt profesional untuk generate image:\n\n`;

      const buttons: Array<Array<{ text: string; callback_data: string }>> = [];

      prompts.forEach((prompt, idx) => {
        message += `${idx + 1}. *${prompt.name}*\n`;
        message += `   _${prompt.bestFor}_\n\n`;

        buttons.push([
          {
            text: `${idx + 1}. ${prompt.name}`,
            callback_data: `use_prompt_${prompt.id}`,
          },
        ]);
      });

      buttons.push([
        { text: "◀️ Pilih Niche Lain", callback_data: "onboard_claim_trial" },
      ]);
      buttons.push([{ text: "🏠 Menu Utama", callback_data: "main_menu" }]);

      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: buttons },
      });
      return true;
    }

    if (data.startsWith("use_prompt_") || data.startsWith("use_admin_prompt_") || data.startsWith("use_saved_")) {
      const promptId = data.replace(/use_(prompt|admin_prompt|saved)_/, "");
      await ctx.answerCbQuery();

      const { findAnyPrompt } = await import("../../commands/prompts.js");
      const prompt = await findAnyPrompt(promptId);

      if (!prompt) {
        await ctx.reply("❌ Prompt tidak ditemukan.");
        return true;
      }

      // Check if user can use free trial
      const user = ctx.from;
      if (!user) return true;

      const telegramId = BigInt(user.id);
      const dbUser = await UserService.findByTelegramId(telegramId);

      if (!dbUser) {
        await ctx.reply("❌ User tidak ditemukan. Silakan /start ulang.");
        return true;
      }

      // Save to session for V3 flow
      if (ctx.session) {
        ctx.session.generateProductDesc = prompt.prompt;
        ctx.session.stateData = {
          ...(ctx.session.stateData || {}),
          selectedPrompt: prompt.prompt,
          selectedPromptId: prompt.id
        };
      }

      const { canUseWelcomeBonus, canUseDailyFree } =
        await import("../../config/free-trial.js");

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

      const bonusType = hasCredits
        ? "Kredit"
        : canUseWelcome
          ? "Welcome Bonus"
          : "Daily Free";
      const costInfo = hasCredits
        ? `💳 Biaya: 0.2 kredit (sisa: ${dbUser.creditBalance})`
        : `🎁 Menggunakan: ${bonusType}`;

      await ctx.editMessageText(
        `✅ *Prompt Dipilih!*\n\n` +
        `📋 ${prompt.title}\n` +
        `🎨 Niche: ${prompt.niche.toUpperCase()}\n\n` +
        `${costInfo}\n` +
        `🎬 **Opsi Generate:**`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🎥 Buat Video (HPAS V3)",
                  callback_data: "create_video_new",
                },
              ],
              [
                {
                  text: "🎨 Generate Image Saja",
                  callback_data: `generate_free_${prompt.id}`,
                },
              ],
              [
                {
                  text: "◀️ Pilih Prompt Lain",
                  callback_data: `prompts_niche_${prompt.niche}`,
                },
              ],
            ],
          },
        },
      );
      return true;
    }

    if (data.startsWith("generate_free_")) {
      const promptId = data.replace("generate_free_", "");
      await ctx.answerCbQuery();

      const { findAnyPrompt } = await import("../../commands/prompts.js");
      const found = await findAnyPrompt(promptId);

      if (!found) {
        await ctx.reply("❌ Prompt tidak ditemukan.");
        return true;
      }

      // Adapt to the shape expected below
      const prompt = { id: found.id, name: found.title, prompt: found.prompt, niche: found.niche, bestFor: '' };

      const user = ctx.from;
      if (!user) return true;

      const telegramId = BigInt(user.id);
      const dbUser = await UserService.findByTelegramId(telegramId);

      if (!dbUser) {
        await ctx.reply("❌ User tidak ditemukan. Silakan /start ulang.");
        return true;
      }

      const { canUseWelcomeBonus, canUseDailyFree, getNextDailyFreeReset } =
        await import("../../config/free-trial.js");

      const hasCredits = Number(dbUser.creditBalance) > 0;
      const canUseWelcome = canUseWelcomeBonus(dbUser);
      const canUseDaily = canUseDailyFree(dbUser);

      // If user has no credits and no free trial, block
      if (!hasCredits && !canUseWelcome && !canUseDaily) {
        await ctx.editMessageText(
          `⚠️ *Free Trial sudah habis!*\n\n` + `Beli kredit untuk melanjutkan.`,
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

      const bonusType = hasCredits
        ? "credit"
        : canUseWelcome
          ? "welcome"
          : "daily";
      const costText = hasCredits
        ? "0.2 kredit"
        : bonusType === "welcome"
          ? "Welcome Bonus"
          : "Daily Free";

      await ctx.editMessageText(
        `⏳ *Generating...*\n\n` +
        `📋 ${prompt.name}\n` +
        `💳 Menggunakan: ${costText}\n\n` +
        `Mohon tunggu 10-30 detik...`,
        { parse_mode: "Markdown" },
      );

      try {
        // Generate image with Google Gemini (free provider)
        const { ImageGenerationService } =
          await import("../../services/image.service.js");

        const result = await ImageGenerationService.generateImage({
          prompt: prompt.prompt,
          category: prompt.niche,
          aspectRatio: "1:1",
          style: "professional",
        });

        if (!result.success || !result.imageUrl) {
          throw new Error(result.error || "Generation failed");
        }

        // Deduct credits or mark bonus as used
        if (bonusType === "credit") {
          // Deduct 0.2 credits for paid users
          await UserService.deductCredits(telegramId, 0.2);
        } else if (bonusType === "welcome") {
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
        const balanceText =
          bonusType === "credit"
            ? `💳 Sisa kredit: ${updatedUser?.creditBalance || 0}`
            : `🎁 ${bonusType === "welcome" ? "Welcome Bonus" : "Daily Free"} digunakan`;

        // Send image — refund if Telegram rejects
        try {
          await ctx.replyWithPhoto(result.imageUrl, {
            caption:
              `✅ *Gambar Berhasil!*\n\n` +
              `📋 ${prompt.name}\n` +
              `${balanceText}\n\n` +
              `Suka hasilnya? Generate lebih banyak!`,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔄 Generate Lagi",
                    callback_data: `prompts_niche_${prompt.niche}`,
                  },
                ],
                [{ text: "💰 Beli Kredit", callback_data: "topup" }],
                [{ text: "🏠 Menu Utama", callback_data: "main_menu" }],
              ],
            },
          });
        } catch (sendErr) {
          logger.error('replyWithPhoto failed after credit deduction:', sendErr);
          if (bonusType === "credit") {
            await UserService.refundCredits(telegramId, 0.2, `prompt-img-${prompt.id}`, 'sendPhoto failed')
              .catch((err: any) => logger.error('CRITICAL: prompt image refund failed', err));
          }
          await ctx.reply('❌ Gagal mengirim gambar. Kredit dikembalikan.');
        }
      } catch (error) {
        console.error("Free trial generation error:", error);

        await ctx.reply(
          `❌ *Generation Gagal*\n\n` +
          `Terjadi error saat generate image.\n` +
          `Bonus Anda tidak terpakai.\n\n` +
          `Silakan coba lagi atau hubungi support.`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔄 Coba Lagi",
                    callback_data: `generate_free_${promptId}`,
                  },
                ],
                [
                  {
                    text: "◀️ Pilih Prompt Lain",
                    callback_data: `prompts_niche_${prompt.niche}`,
                  },
                ],
                [{ text: "🏠 Menu Utama", callback_data: "main_menu" }],
              ],
            },
          },
        );
      }

      return true;
    }

    return false;
}
