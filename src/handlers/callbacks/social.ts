import { BotContext } from "@/types";
import { logger } from "@/utils/logger";
import { VideoService } from "@/services/video.service";
import { PostAutomationService } from "@/services/postautomation.service";
import { t } from "@/i18n/translations";

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

async function handlePublishVideo(ctx: BotContext, jobId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

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

  const accounts = await PostAutomationService.getUserAccounts(BigInt(userId));

  const keyboard: any[][] = [];

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

  ctx.session.selectedPlatforms = [];
  ctx.session.currentJobId = jobId;
}

async function handlePublishPlatformSelection(
  ctx: BotContext,
  jobId: string,
  platformOrAccountId: string,
) {
  const userId = ctx.from?.id;
  if (!userId) return;

  if (!ctx.session.selectedPlatforms) {
    ctx.session.selectedPlatforms = [];
  }

  if (platformOrAccountId === "all") {
    const accounts = await PostAutomationService.getUserAccounts(
      BigInt(userId),
    );
    ctx.session.selectedPlatforms = accounts.map((acc) => acc.id);
  } else {
    const accountId = parseInt(platformOrAccountId);
    const index = ctx.session.selectedPlatforms.indexOf(accountId);

    if (index > -1) {
      ctx.session.selectedPlatforms.splice(index, 1);
    } else {
      ctx.session.selectedPlatforms.push(accountId);
    }
  }

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

async function handleConfirmPublish(ctx: BotContext, jobId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const lang = ctx.session?.userLang || 'id';
  await ctx.editMessageText(
    t('cb2.publishing_progress', lang),
    { parse_mode: "Markdown" },
  );

  try {
    const video = await VideoService.getByJobId(jobId);
    if (!video || !video.videoUrl) {
      throw new Error("Video not found");
    }

    if (video.userId !== BigInt(userId)) {
      const lang = ctx.session?.userLang || 'id';
      await ctx.editMessageText(t('cb.access_denied', lang));
      return;
    }

    const accounts = await PostAutomationService.getUserAccounts(
      BigInt(userId),
    );

    const results = await PostAutomationService.publish({
      userId: BigInt(userId),
      mediaUrl: video.videoUrl,
      caption:
        ctx.session.caption ||
        `${video.title || "Check this out!"} #viral #fyp`,
      platformAccountIds: accounts.map((a) => a.id),
    });

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

async function handleAutoPostToAll(ctx: BotContext, jobId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const lang = ctx.session?.userLang || 'id';
  await ctx.answerCbQuery(t('cb.publishing', lang));

  try {
    const video = await VideoService.getByJobId(jobId);
    if (!video || !video.videoUrl) {
      await ctx.reply(t('cb.video_not_found_url', lang));
      return;
    }

    if (video.userId !== BigInt(userId)) {
      await ctx.reply(t('cb.access_denied', lang));
      return;
    }

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

    const platformNames = accounts
      .map((a) => `${getPlatformEmoji(a.platform)} ${a.platform}`)
      .join(", ");
    await ctx.reply(
      t('cb2.auto_posting', lang, { count: accounts.length, platforms: platformNames }),
      { parse_mode: "Markdown" },
    );

    const results = await PostAutomationService.publish({
      userId: BigInt(userId),
      mediaUrl: video.videoUrl,
      caption:
        ctx.session?.caption ||
        `${video.title || "Check this out!"} #viral #fyp`,
      platformAccountIds: accounts.map((a) => a.id),
    });

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

async function handleConnectAccount(ctx: BotContext, platform: string) {
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

async function handleDisconnectAccount(ctx: BotContext, accountId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  await PostAutomationService.disconnectAccount(
    BigInt(userId),
    parseInt(accountId),
  );

  const lang = ctx.session?.userLang || 'id';
  await ctx.answerCbQuery(t('cb.account_disconnected', lang));

  await handleManageAccounts(ctx);
}

export async function handleSocialCallbacks(ctx: BotContext, data: string): Promise<boolean> {
  if (data.startsWith("auto_post_")) {
    const jobId = data.replace("auto_post_", "");
    await handleAutoPostToAll(ctx, jobId);
    return true;
  }

  if (data.startsWith("publish_video_")) {
    const jobId = data.replace("publish_video_", "");
    await handlePublishVideo(ctx, jobId);
    return true;
  }

  if (data.startsWith("select_platform_")) {
    const jobId = data.split("_")[2];
    const platform = data.split("_")[3];
    await handlePublishPlatformSelection(ctx, jobId, platform);
    return true;
  }

  if (data.startsWith("confirm_publish_")) {
    const jobId = data.replace("confirm_publish_", "");
    await handleConfirmPublish(ctx, jobId);
    return true;
  }

  if (data === "manage_accounts") {
    await handleManageAccounts(ctx);
    return true;
  }

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
    return true;
  }

  if (data.startsWith("connect_account_")) {
    const platform = data.replace("connect_account_", "");
    await handleConnectAccount(ctx, platform);
    return true;
  }

  if (data.startsWith("disconnect_account_")) {
    const accountId = data.replace("disconnect_account_", "");
    await handleDisconnectAccount(ctx, accountId);
    return true;
  }

  return false;
}
