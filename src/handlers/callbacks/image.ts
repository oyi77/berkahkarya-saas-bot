import { BotContext } from "@/types";
import { logger } from "@/utils/logger";
import { AvatarService } from "@/services/avatar.service";
import { ImageGenerationService } from "@/services/image.service";
import { UserService } from "@/services/user.service";
import {
  getImageCreditCostAsync,
} from "@/config/pricing";
import { t } from "@/i18n/translations";

const btnBackMain = (lang: string) => ({ text: t('btn.main_menu', lang), callback_data: "main_menu" });

const categoryNames: Record<string, string> = {
  product: "🛍️ Product Photo",
  fnb: "🍔 F&B Food",
  realestate: "🏠 Real Estate",
  car: "🚗 Car/Automotive",
};

export async function handleImageGeneration(ctx: BotContext, category: string) {
  const existingClonePrompt = ctx.session?.stateData?.clonePrompt as
    | string
    | undefined;

  if (existingClonePrompt) {
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

  ctx.session.stateData = { ...ctx.session.stateData, imageCategory: category };
}

export async function handleImageCallbacks(ctx: BotContext, data: string): Promise<boolean> {
  // image_generate menu
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
    return true;
  }

  // img_gen_menu
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
    return true;
  }

  // image_from_prompt
  if (data === "image_from_prompt") {
    await ctx.answerCbQuery();
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
    return true;
  }

  // img_*
  if (data.startsWith("img_")) {
    const category = data.replace("img_", "");
    await handleImageGeneration(ctx, category);
    return true;
  }

  // Avatar management
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
    return true;
  }

  if (data === "avatar_add") {
    const lang = ctx.session?.userLang || 'id';
    await ctx.editMessageText(
      t('cb.avatar_add', lang),
      { parse_mode: "Markdown" },
    );
    ctx.session.state = "AVATAR_UPLOAD_WAITING";
    ctx.session.stateData = {};
    return true;
  }

  if (data.startsWith("avatar_view_")) {
    const avatarId = parseInt(data.replace("avatar_view_", ""), 10);
    const avatar = await AvatarService.getAvatar(avatarId);
    if (!avatar) {
      const lang = ctx.session?.userLang || 'id';
      await ctx.answerCbQuery(t('misc.avatar_not_found', lang));
      return true;
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
    return true;
  }

  if (data.startsWith("avatar_default_")) {
    const avatarId = parseInt(data.replace("avatar_default_", ""), 10);
    const telegramId = BigInt(ctx.from!.id);
    await AvatarService.setDefault(telegramId, avatarId);
    const lang = ctx.session?.userLang || 'id';
    await ctx.answerCbQuery(t('misc.avatar_set_default', lang));
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
    return true;
  }

  if (data.startsWith("avatar_delete_")) {
    const avatarId = parseInt(data.replace("avatar_delete_", ""), 10);
    const telegramId = BigInt(ctx.from!.id);
    const lang = ctx.session?.userLang || 'id';
    const deleted = await AvatarService.deleteAvatar(telegramId, avatarId);
    await ctx.answerCbQuery(
      deleted ? t('cb.avatar_deleted', lang) : t('cb.avatar_not_found_del', lang),
    );
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
    return true;
  }

  // imgref_upload
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
    return true;
  }

  // imgref_skip
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
    return true;
  }

  // imgref_avatar_
  if (data.startsWith("imgref_avatar_")) {
    const avatarId = parseInt(data.replace("imgref_avatar_", ""), 10);
    const avatar = await AvatarService.getAvatar(avatarId);
    if (!avatar) {
      const lang = ctx.session?.userLang || 'id';
      await ctx.answerCbQuery(t('misc.avatar_not_found', lang));
      return true;
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
    return true;
  }

  // generate_image_v3_
  if (data.startsWith("generate_image_v3_")) {
    await ctx.answerCbQuery();
    const promptId = data.replace("generate_image_v3_", "");
    const { findAnyPrompt } = await import("../../commands/prompts.js");
    const prompt = await findAnyPrompt(promptId);
    if (!prompt) {
      const lang = ctx.session?.userLang || 'id';
      await ctx.reply(t('cb.prompt_not_found', lang));
      return true;
    }
    // Route to generate_free_ flow which handles image generation
    const { handlePromptsCallback } = await import("./prompts.js");
    await handlePromptsCallback(ctx, `generate_free_${promptId}`);
    return true;
  }

  return false;
}
