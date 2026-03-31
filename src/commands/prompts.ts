/**
 * Prompts Command — Prompt Library
 * Commands: /prompts, /daily, /trending, /fingerprint
 */

import { BotContext } from "@/types";
import { logger } from "@/utils/logger";
import { UserService } from "@/services/user.service";
import { SavedPromptService } from "@/services/saved-prompt.service";
import { prisma } from "@/config/database";
import { canUseDailyFree, getNextDailyFreeReset } from "@/config/free-trial";
import { t } from "@/i18n/translations";

// ─── PROMPT LIBRARY DATA ────────────────────────────────────────────────────

export const PROMPT_LIBRARY: Record<
  string,
  {
    emoji: string;
    label: string;
    prompts: Array<{
      id: string;
      title: string;
      prompt: string;
      suitable: string;
      successRate: number;
    }>;
  }
> = {
  fnb: {
    emoji: "🍔",
    label: "F&B",
    prompts: [
      {
        id: "fnb_1",
        title: "Steam & Zoom Drama",
        prompt:
          "Cinematic food shot dengan steam rising effect, slow zoom in dari medium ke close-up, warm golden hour lighting, background blur untuk fokus tekstur makanan",
        suitable: "Bakso, soto, mie ayam, makanan hangat",
        successRate: 94,
      },
      {
        id: "fnb_2",
        title: "Fresh Splash Impact",
        prompt:
          "High-speed capture minuman dengan splash effect, bright colorful lighting, ice cubes floating dan spinning, condensation droplets on glass",
        suitable: "Kopi susu, bubble tea, jus, smoothie",
        successRate: 92,
      },
      {
        id: "fnb_3",
        title: "Cooking Assembly Story",
        prompt:
          "Step-by-step cooking montage, hands adding ingredients in sequence, pan sizzle close-up, final dish reveal dengan dramatic lighting",
        suitable: "Recipe content, cooking tutorial",
        successRate: 89,
      },
      {
        id: "fnb_4",
        title: "Bite Satisfaction",
        prompt:
          "Close-up shot first bite, cross-section reveal showing layers, crunch visual effect, satisfied expression, ASMR-style treatment",
        suitable: "Burger, sandwich, pastry",
        successRate: 91,
      },
      {
        id: "fnb_5",
        title: "Ambient Cafe Vibe",
        prompt:
          "Cozy cafe atmosphere, latte art being poured, blurred customers background, natural window lighting, morning lifestyle aesthetic",
        suitable: "Cafe promo, coffee shop branding",
        successRate: 88,
      },
    ],
  },
  fashion: {
    emoji: "👗",
    label: "Fashion",
    prompts: [
      {
        id: "fashion_1",
        title: "Outfit Transition Reveal",
        prompt:
          "Model snap transition effect, outfit changes casual to glam, seamless morph, editorial lighting",
        suitable: "Clothing line, outfit of the day",
        successRate: 92,
      },
      {
        id: "fashion_2",
        title: "Detail Showcase Flow",
        prompt:
          "Macro shot fabric texture, smooth tracking across clothing, button and stitching details, luxury aesthetic",
        suitable: "Premium fashion, fabric showcase",
        successRate: 88,
      },
      {
        id: "fashion_3",
        title: "Runway Walk Energy",
        prompt:
          "Model confident walk toward camera, dramatic lighting changes, slow-mo moments, fashion show atmosphere",
        suitable: "Fashion brand, new collection launch",
        successRate: 90,
      },
      {
        id: "fashion_4",
        title: "Hijab Styling Story",
        prompt:
          "Elegant hijab styling sequence, hands adjusting fabric, modest fashion aesthetic, empowering energy",
        suitable: "Hijab brand, modest fashion",
        successRate: 93,
      },
      {
        id: "fashion_5",
        title: "Accessory Sparkle",
        prompt:
          "Close-up jewelry, light reflection sparkle, 360 rotation, luxury box opening, premium feel",
        suitable: "Accessories, jewelry, bags",
        successRate: 91,
      },
    ],
  },
  tech: {
    emoji: "📱",
    label: "Tech",
    prompts: [
      {
        id: "tech_1",
        title: "Unboxing Premium",
        prompt:
          "Sleek unboxing sequence, hands lifting lid slowly, product reveal dramatic lighting, tech reviewer aesthetic",
        suitable: "Gadget, smartphone, electronics",
        successRate: 91,
      },
      {
        id: "tech_2",
        title: "Feature Highlight Demo",
        prompt:
          "Product in action, screen display changing, feature demonstration cuts, UI animation close-ups",
        suitable: "App, software, device demo",
        successRate: 89,
      },
      {
        id: "tech_3",
        title: "Gaming Setup Vibe",
        prompt:
          "RGB lighting ambient glow, gaming gear lineup, keyboard typing visual, esports energy, neon accents",
        suitable: "Gaming peripherals, PC setup",
        successRate: 90,
      },
      {
        id: "tech_4",
        title: "Minimal Showcase",
        prompt:
          "Clean white/black background, product floating subtle rotation, Apple-style minimalist aesthetic",
        suitable: "Premium gadget, earphones, wearables",
        successRate: 92,
      },
      {
        id: "tech_5",
        title: "Comparison Split",
        prompt:
          "Two products side by side, split screen comparison, before-after upgrade effect, feature callouts",
        suitable: "Upgrade promo, comparison content",
        successRate: 87,
      },
    ],
  },
  health: {
    emoji: "💪",
    label: "Health",
    prompts: [
      {
        id: "health_1",
        title: "Before-After Transformation",
        prompt:
          "Split screen transformation, left side before, right side after results, smooth morph transition",
        suitable: "Skincare, fitness, supplement",
        successRate: 93,
      },
      {
        id: "health_2",
        title: "Product Routine Story",
        prompt:
          "Morning/evening routine sequence, product application demonstration, self-care pampering vibe",
        suitable: "Skincare routine, wellness products",
        successRate: 90,
      },
      {
        id: "health_3",
        title: "Ingredient Spotlight",
        prompt:
          "Natural ingredient close-ups, fresh botanical elements, lab-to-nature visual connection",
        suitable: "Natural supplement, herbal product",
        successRate: 88,
      },
      {
        id: "health_4",
        title: "Active Lifestyle",
        prompt:
          "Dynamic workout moments, sweat drip close-up, athletic movement freeze-frames",
        suitable: "Fitness product, gym supplement",
        successRate: 89,
      },
      {
        id: "health_5",
        title: "Testimonial Authentic",
        prompt:
          "Real customer sharing experience, conversational to camera, authentic emotion, trust-building",
        suitable: "Any health/beauty product with results",
        successRate: 91,
      },
    ],
  },
  travel: {
    emoji: "✈️",
    label: "Travel",
    prompts: [
      {
        id: "travel_1",
        title: "Destination Discovery",
        prompt:
          "Aerial drone shot revealing landscape, golden hour lighting, wanderlust atmosphere, cinematic travel film",
        suitable: "Tour package, destination promo",
        successRate: 89,
      },
      {
        id: "travel_2",
        title: "Hotel Villa Showcase",
        prompt:
          "Room reveal sequence, door opening to luxury space, pool and view shots, premium accommodation",
        suitable: "Hotel, villa, resort",
        successRate: 88,
      },
      {
        id: "travel_3",
        title: "Experience Moment",
        prompt:
          "Traveler experiencing activity, snorkeling underwater, hiking viewpoint, authentic adventure",
        suitable: "Activity tour, adventure travel",
        successRate: 87,
      },
      {
        id: "travel_4",
        title: "Journey Story",
        prompt:
          "Travel montage sequence, airport to destination, key moments compilation, memory-making narrative",
        suitable: "Travel vlog, full trip recap",
        successRate: 86,
      },
      {
        id: "travel_5",
        title: "Local Hidden Gem",
        prompt:
          "Undiscovered spot reveal, secret beach/waterfall, off-the-beaten-path vibe, exclusive discovery",
        suitable: "Local tourism, unique destination",
        successRate: 90,
      },
    ],
  },
  education: {
    emoji: "📚",
    label: "Education",
    prompts: [
      {
        id: "edu_1",
        title: "Learning Transformation",
        prompt:
          "Student journey confused to confident, study montage progression, aha moment visual",
        suitable: "Online course, tutoring",
        successRate: 88,
      },
      {
        id: "edu_2",
        title: "Expert Credibility",
        prompt:
          "Expert instructor professional setting, teaching moment, engaging presentation, authority building",
        suitable: "Course launch, training promo",
        successRate: 90,
      },
      {
        id: "edu_3",
        title: "Course Content Preview",
        prompt:
          "Curriculum overview visual, module-by-module reveal, learning path journey, value proposition",
        suitable: "Course promo, curriculum showcase",
        successRate: 87,
      },
      {
        id: "edu_4",
        title: "Student Success Story",
        prompt:
          "Alumni testimonial, career progression timeline, achievement showcase, inspiring proof",
        suitable: "Bootcamp, certification course",
        successRate: 89,
      },
      {
        id: "edu_5",
        title: "Interactive Learning Demo",
        prompt:
          "Platform UI demonstration, interactive features, learning in action, modern ed-tech",
        suitable: "EdTech platform, e-learning app",
        successRate: 86,
      },
    ],
  },
  finance: {
    emoji: "💰",
    label: "Finance",
    prompts: [
      {
        id: "fin_1",
        title: "Financial Growth Visual",
        prompt:
          "Chart animation showing growth, upward trend visualization, professional financial aesthetic",
        suitable: "Investment, fintech, trading",
        successRate: 87,
      },
      {
        id: "fin_2",
        title: "Security & Trust",
        prompt:
          "Security features demonstration, lock and shield imagery, protected assets visualization",
        suitable: "Insurance, banking, crypto wallet",
        successRate: 88,
      },
      {
        id: "fin_3",
        title: "Easy Financial Solution",
        prompt:
          "Simple app interface, one-click process demonstration, modern fintech UI",
        suitable: "Payment app, e-wallet, lending",
        successRate: 86,
      },
      {
        id: "fin_4",
        title: "Future Planning Dreams",
        prompt:
          "Life goal visualization, dream home/car/travel, retirement scene, financial freedom lifestyle",
        suitable: "Investment, insurance, savings",
        successRate: 89,
      },
      {
        id: "fin_5",
        title: "Expert Advisor",
        prompt:
          "Professional advisor consultation, trustworthy expert presentation, personalized advice",
        suitable: "Financial advisory, wealth management",
        successRate: 85,
      },
    ],
  },
  entertainment: {
    emoji: "🎭",
    label: "Entertainment",
    prompts: [
      {
        id: "ent_1",
        title: "Event Hype Trailer",
        prompt:
          "Event highlights compilation, crowd energy moments, performer on stage, FOMO-inducing atmosphere",
        suitable: "Concert, festival, event promo",
        successRate: 92,
      },
      {
        id: "ent_2",
        title: "Behind The Scenes",
        prompt:
          "Exclusive BTS moments, preparation sequence, candid artist moments, insider access",
        suitable: "Artist content, production BTS",
        successRate: 90,
      },
      {
        id: "ent_3",
        title: "Content Teaser Hook",
        prompt:
          "Exciting moment preview, cliff-hanger ending, curiosity-inducing cut, watch-more motivation",
        suitable: "YouTube/TikTok content teaser",
        successRate: 91,
      },
      {
        id: "ent_4",
        title: "Community Vibes",
        prompt:
          "Community gathering moments, shared excitement, fandom energy, belonging feeling",
        suitable: "Fan content, community building",
        successRate: 88,
      },
      {
        id: "ent_5",
        title: "Gaming Reaction",
        prompt:
          "Streamer reaction moment, gameplay highlight, winning celebration, shareable content",
        suitable: "Gaming content, esports highlight",
        successRate: 89,
      },
    ],
  },
};

// Trending order (most used this week)
export const TRENDING_PROMPTS = [
  { niche: "fnb", promptId: "fnb_1", usageChange: 45 },
  { niche: "fashion", promptId: "fashion_1", usageChange: 38 },
  { niche: "tech", promptId: "tech_1", usageChange: 32 },
  { niche: "health", promptId: "health_1", usageChange: 28 },
  { niche: "travel", promptId: "travel_1", usageChange: 25 },
];

// Daily mystery prompts rotation (based on day of week)
export const MYSTERY_PROMPTS = [
  { niche: "fnb", promptId: "fnb_1", rarity: "⭐⭐⭐ RARE" },
  { niche: "fashion", promptId: "fashion_1", rarity: "⭐⭐ UNCOMMON" },
  { niche: "tech", promptId: "tech_4", rarity: "⭐⭐⭐⭐ EPIC" },
  { niche: "health", promptId: "health_1", rarity: "⭐⭐⭐ RARE" },
  { niche: "travel", promptId: "travel_5", rarity: "⭐⭐⭐⭐ EPIC" },
  { niche: "entertainment", promptId: "ent_1", rarity: "⭐⭐⭐ RARE" },
  { niche: "education", promptId: "edu_2", rarity: "⭐⭐ UNCOMMON" },
];

export async function findAnyPrompt(promptId: string): Promise<{
  id: string;
  title: string;
  prompt: string;
  niche: string;
  type: 'library' | 'professional' | 'db';
} | null> {
  // 1. Trace in PROMPT_LIBRARY (Standard)
  for (const nicheKey of Object.keys(PROMPT_LIBRARY)) {
    const found = PROMPT_LIBRARY[nicheKey].prompts.find((p) => p.id === promptId);
    if (found) return { ...found, niche: nicheKey, type: 'library' };
  }

  // 2. Trace in PROFESSIONAL_PROMPT_LIBRARY (Professional)
  try {
    const { PROFESSIONAL_PROMPT_LIBRARY } = await import('../config/professional-prompts.js');
    for (const nicheKey of Object.keys(PROFESSIONAL_PROMPT_LIBRARY)) {
      const found = PROFESSIONAL_PROMPT_LIBRARY[nicheKey].find((p) => p.id === promptId);
      if (found) return { id: found.id, title: found.name, prompt: found.prompt, niche: nicheKey, type: 'professional' };
    }
  } catch (err) {
    logger.error("findAnyPrompt professional lookup error:", err);
  }

  // 3. Trace in Database (Admin/Saved)
  if (!isNaN(Number(promptId))) {
    try {
      const dbPrompt = await prisma.savedPrompt.findUnique({
        where: { id: parseInt(promptId) }
      });
      if (dbPrompt) {
        return {
          id: String(dbPrompt.id),
          title: dbPrompt.title,
          prompt: dbPrompt.prompt,
          niche: dbPrompt.niche || 'fnb',
          type: 'db'
        };
      }
    } catch (err) {
      logger.error("findAnyPrompt DB lookup error:", err);
    }
  }

  return null;
}

// Backward compatibility wrapper
export async function getPromptById(promptId: string) {
  return await findAnyPrompt(promptId);
}

// ─── /prompts ────────────────────────────────────────────────────────────────

export async function promptsCommand(ctx: BotContext): Promise<void> {
  try {
    const rawText = (ctx.message as { text?: string })?.text || "";
    const arg = rawText
      .replace(/^\/prompts\s*/, "")
      .trim()
      .toLowerCase();

    if (arg && PROMPT_LIBRARY[arg]) {
      await showNichePrompts(ctx, arg);
      return;
    }

    const lang = ctx.session?.userLang || ctx.from?.language_code || 'id';
    await ctx.reply(
      t('prompts.library_menu', lang),
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
              { text: "🔥 Trending", callback_data: "prompts_trending" },
              { text: "✨ Custom AI", callback_data: "prompts_custom" },
            ],
          ],
        },
      },
    );
  } catch (err) {
    logger.error("promptsCommand error:", err);
    const dbUser = ctx.from ? await UserService.findByTelegramId(BigInt(ctx.from.id)) : null;
    const lang = dbUser?.language || 'id';
    await ctx.reply(t('prompt.library_load_failed', lang));
  }
}

// ─── Show prompts for a specific niche ───────────────────────────────────────

export async function showNichePrompts(
  ctx: BotContext,
  nicheKey: string,
  edit = false,
): Promise<void> {
  const niche = PROMPT_LIBRARY[nicheKey];
  if (!niche) {
    const dbUser = ctx.from ? await UserService.findByTelegramId(BigInt(ctx.from.id)) : null;
    const lang = dbUser?.language || 'id';
    await ctx.reply(t('prompt.niche_not_found', lang));
    return;
  }

  // Load user's saved prompts + admin prompts for this niche
  const telegramId = ctx.from?.id;
  let savedPrompts: any[] = [];
  let adminPrompts: any[] = [];
  try {
    // Admin prompts (userId=0) — global, added via admin panel
    adminPrompts = await prisma.savedPrompt.findMany({
      where: { userId: BigInt(0), niche: nicheKey },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch {
    /* non-critical */
  }

  if (telegramId) {
    try {
      const dbUser = await UserService.findByTelegramId(BigInt(telegramId));
      if (dbUser) {
        savedPrompts = await SavedPromptService.getByUser(
          dbUser.id as unknown as bigint,
          nicheKey,
        );
      }
    } catch {
      /* non-critical */
    }
  }

  const hasAdmin = adminPrompts.length > 0;
  const hasSaved = savedPrompts.length > 0;

  let msg = `${niche.emoji} **${niche.label} PROMPT TEMPLATES**\n`;
  msg += `────────────────────────────────────────────\n\n`;
  msg += `Berikut prompt terbaik untuk niche ${niche.label}:\n\n`;

  const rows: any[][] = [];
  let rowNum = 1;

  // My saved prompts (user-specific)
  if (hasSaved) {
    rows.push([
      {
        text: `📌 Prompt Tersimpan Saya (${savedPrompts.length})`,
        callback_data: `my_prompts_${nicheKey}`,
      },
    ]);
  }

  // Admin prompts (from admin panel) — appear first, unlimited
  if (hasAdmin) {
    msg += `⭐ **Dari Admin:**\n`;
    adminPrompts.forEach((p: any) => {
      msg += `**${rowNum}. ${p.title}**\n`;
      msg += `\`${p.prompt.slice(0, 100)}${p.prompt.length > 100 ? "..." : ""}\`\n\n`;
      rows.push([
        {
          text: `${rowNum++}. ${p.title} ⭐`,
          callback_data: `use_admin_prompt_${p.id}`,
        },
      ]);
    });
  }

  // Built-in template prompts
  msg += `**PROMPT TEMPLATES:**\n`;
  niche.prompts.forEach((p) => {
    msg += `**${rowNum}. ${p.title}** ⭐ ${p.successRate}% success\n`;
    msg += `───────────────────────────\n`;
    msg += `\`${p.prompt.slice(0, 100)}${p.prompt.length > 100 ? "..." : ""}\`\n\n`;
    msg += `✅ Cocok untuk: ${p.suitable}\n\n`;
    rows.push([
      {
        text: `${rowNum++}. ${p.title} ⭐`,
        callback_data: `use_prompt_${p.id}`,
      },
    ]);
  });

  msg += `────────────────────────────────────────────\n`;
  msg += `💡 **Cara Pakai:**\n`;
  msg += `Ketik \`/use 1\` untuk pakai prompt #1\n`;
  msg += `Ketik \`/customize 1\` untuk modifikasi prompt`;

  rows.push([
    {
      text: "➕ Tambah Custom Prompt",
      callback_data: `add_custom_prompt_${nicheKey}`,
    },
  ]);
  rows.push([
    { text: "◀️ Kembali ke Semua Niche", callback_data: "back_prompts" },
  ]);

  const markup = { inline_keyboard: rows };

  try {
    if (edit) {
      await (ctx as any).editMessageText(msg, {
        parse_mode: "Markdown",
        reply_markup: markup,
      });
    } else {
      await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: markup });
    }
  } catch {
    await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: markup });
  }
}

// ─── Use prompt (show detail + action buttons) ───────────────────────────────

export async function showPromptDetail(
  ctx: BotContext,
  promptId: string,
  edit = false,
): Promise<void> {
  const p = await findAnyPrompt(promptId);
  if (!p) {
    const dbUser = ctx.from ? await UserService.findByTelegramId(BigInt(ctx.from.id)) : null;
    const lang = dbUser?.language || 'id';
    await ctx.reply(t('cb.prompt_not_found', lang));
    return;
  }

  // Get user credits
  let credits = "?";
  try {
    const telegramId = ctx.from?.id;
    if (telegramId) {
      const dbUser = await UserService.findByTelegramId(BigInt(telegramId));
      if (dbUser) credits = String(dbUser.creditBalance);
    }
  } catch {
    /* ignore */
  }

  const credLine =
    credits !== "?" ? `💰 Saldo kamu: **${credits} credits** ✓\n\n` : "";

  const msg =
    `✅ **Prompt Aktif!**\n\n` +
    `─────────────────────────────────────\n` +
    `📋 **${p.title}**\n` +
    `─────────────────────────────────────\n\n` +
    `\`${p.prompt}\`\n\n` +
    `─────────────────────────────────────\n\n` +
    `🎬 **Langkah Selanjutnya:**\n\n` +
    `1. **Upload foto produk kamu** (opsional)\n` +
    `→ AI akan animasikan foto jadi video\n\n` +
    `2. **Atau langsung generate**\n` +
    `→ AI akan buat visual dari prompt ini\n\n` +
    `─────────────────────────────────────\n` +
    `📊 **Credit Estimator:**\n` +
    `${credLine}` +
    `• Video 5 detik: 0.2 credits\n` +
    `• Video 15 detik: 0.5 credits\n` +
    `• Video 30 detik: 1.0 credits\n` +
    `• Video 60 detik: 2.0 credits`;

  const markup = {
    inline_keyboard: [
      // Primary CTA -> Redirect to V3 Flow
      [{ text: "🚀 Buat Video Sekarang!", callback_data: "create_video_new" }],
      [{ text: "🖼️ Buat Gambar Saja", callback_data: `generate_image_v3_${promptId}` }],
      [
        { text: "🔧 Customize", callback_data: `customize_prompt_${promptId}` },
        { text: "💾 Simpan", callback_data: `save_prompt_${promptId}` },
      ],
      [
        {
          text: `◀️ Kembali ke Niche`,
          callback_data: `prompts_niche_${p.niche}`,
        },
      ],
    ],
  };

  try {
    if (edit) {
      await (ctx as any).editMessageText(msg, {
        parse_mode: "Markdown",
        reply_markup: markup,
      });
    } else {
      await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: markup });
    }
  } catch {
    await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: markup });
  }

  // Save selected prompt to session for V3 flow
  if (ctx.session) {
    ctx.session.generateProductDesc = p.prompt; // Used by V3 Flow
    ctx.session.stateData = {
      ...(ctx.session.stateData || {}),
      selectedPrompt: p.prompt, // Legacy support
      selectedPromptId: p.id
    };
  }
}

// ─── Customize prompt ────────────────────────────────────────────────────────

export async function showCustomizePrompt(
  ctx: BotContext,
  promptId: string,
  edit = false,
): Promise<void> {
    const p = await getPromptById(promptId);
    const base = p ? p.prompt : "Prompt kustom";

  const msg =
    `🔧 **PROMPT CUSTOMIZER**\n` +
    `─────────────────────────────────────\n\n` +
    `Base prompt:\n\`${base.slice(0, 100)}${base.length > 100 ? "..." : ""}\`\n\n` +
    `─────────────────────────────────────\n` +
    `**MODIFY OPTIONS:**\n` +
    `─────────────────────────────────────\n\n` +
    `📐 **Style**\n` +
    `[Cinematic] [Minimalist] [Editorial] [Dramatic] [Fun]\n\n` +
    `💡 **Lighting**\n` +
    `[Golden Hour] [Studio] [Natural] [Neon] [Moody]\n\n` +
    `🎭 **Mood**\n` +
    `[Cozy] [Energetic] [Luxury] [Professional] [Casual]\n\n` +
    `⏱️ **Duration**\n` +
    `[5 sec] [15 sec] [30 sec] [60 sec]\n\n` +
    `📱 **Platform**\n` +
    `[TikTok 9:16] [IG Reels] [YouTube Shorts] [FB Reels]\n\n` +
    `─────────────────────────────────────\n\n` +
    `Ketik pilihanmu, contoh:\n` +
    `"style dramatic, lighting neon, duration 10 sec"\n\n` +
    `atau jelaskan perubahan yang kamu mau!`;

  const markup = {
    inline_keyboard: [
      [
        {
          text: "🎬 Cinematic",
          callback_data: `cust_style_cinematic_${promptId}`,
        },
        {
          text: "⚡ Dramatic",
          callback_data: `cust_style_dramatic_${promptId}`,
        },
        {
          text: "✨ Minimalist",
          callback_data: `cust_style_minimal_${promptId}`,
        },
      ],
      [
        {
          text: "🌅 Golden Hour",
          callback_data: `cust_light_golden_${promptId}`,
        },
        { text: "💡 Studio", callback_data: `cust_light_studio_${promptId}` },
        { text: "🌙 Moody", callback_data: `cust_light_moody_${promptId}` },
      ],
      [{ text: "◀️ Kembali", callback_data: `use_prompt_${promptId}` }],
    ],
  };

  if (ctx.session) {
    ctx.session.state = "CUSTOMIZING_PROMPT";
    ctx.session.stateData = {
      ...(ctx.session.stateData || {}),
      customizingPromptId: promptId,
      basePrompt: base,
    };
  }

  try {
    if (edit) {
      await (ctx as any).editMessageText(msg, {
        parse_mode: "Markdown",
        reply_markup: markup,
      });
    } else {
      await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: markup });
    }
  } catch {
    await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: markup });
  }
}

// ─── /daily ──────────────────────────────────────────────────────────────────

// Generate a unique daily prompt for each user based on their ID and date
function getUserDailyPrompt(userId: number, date: Date) {
  // Create a seed from userId + date string (YYYY-MM-DD)
  const dateStr = date.toISOString().split("T")[0];
  const seedStr = `${userId}-${dateStr}`;

  // Simple hash function to get consistent random number
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    const char = seedStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  // Get all available prompts
  const allPrompts: Array<{ niche: string; promptId: string; rarity: string }> =
    [];

  // Add all prompts from PROMPT_LIBRARY
  Object.keys(PROMPT_LIBRARY).forEach((nicheKey) => {
    const niche = PROMPT_LIBRARY[nicheKey];
    niche.prompts.forEach((p) => {
      allPrompts.push({
        niche: nicheKey,
        promptId: p.id,
        rarity:
          p.successRate >= 90
            ? "⭐⭐⭐⭐ EPIC"
            : p.successRate >= 85
              ? "⭐⭐⭐ RARE"
              : p.successRate >= 80
                ? "⭐⭐ UNCOMMON"
                : "⭐ COMMON",
      });
    });
  });

  // Use hash to select a prompt (guarantees same prompt for same user on same day)
  const index = Math.abs(hash) % allPrompts.length;
  return allPrompts[index];
}

export async function dailyCommand(ctx: BotContext): Promise<void> {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply(t('social.unable_identify_user', 'id'));
      return;
    }

    const dbUser = await UserService.findByTelegramId(BigInt(userId));
    if (!dbUser) {
      await ctx.reply(t('error.user_not_found', 'id'));
      return;
    }

    // Check if daily free is available
    if (!canUseDailyFree(dbUser)) {
      const resetAt = dbUser.dailyFreeResetAt || getNextDailyFreeReset();
      const hoursLeft = Math.ceil((resetAt.getTime() - Date.now()) / (1000 * 60 * 60));
      
      await ctx.reply(
        `🎁 **MYSTERY PROMPT BOX**\n\n` +
        `⏰ **Daily reward sudah diklaim!**\n\n` +
        `Prompt baru akan tersedia dalam: *${hoursLeft} jam*.\n\n` +
        `_Ingin lebih banyak prompt? Jelajahi Library atau upgrade ke PRO!_`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    const today = new Date();
    // Get unique prompt for this user on this day
    const userPrompt = getUserDailyPrompt(userId, today);
    const niche = PROMPT_LIBRARY[userPrompt.niche];
    const p = niche.prompts.find((x) => x.id === userPrompt.promptId)!;

    const msg =
      `🎁 **MYSTERY PROMPT BOX**\n` +
      `─────────────────────────────────────\n\n` +
      `✨ **PROMPT UNLOCKED!**\n\n` +
      `─────────────────────────────────────\n` +
      `📂 Niche: **${niche.label}**\n` +
      `⭐ Rarity: **${userPrompt.rarity}**\n` +
      `─────────────────────────────────────\n\n` +
      `**${p.title}**\n\n` +
      `\`${p.prompt}\`\n\n` +
      `─────────────────────────────────────\n` +
      `💡 Prompt ini bisa langsung dipakai untuk generate!\n` +
      `─────────────────────────────────────\n\n` +
      `⏰ Prompt baru setiap hari — jangan sampai ketinggalan!`;

    if (ctx.session) {
      ctx.session.stateData = {
        ...(ctx.session.stateData || {}),
        selectedPrompt: p.prompt,
      };
    }

    await ctx.reply(msg, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🚀 Pakai Sekarang", callback_data: `use_prompt_${p.id}` },
            { text: "💾 Simpan", callback_data: `daily_save_${p.id}` },
          ],
          [{ text: "🔄 Prompt Lain", callback_data: "daily_another" }],
          [{ text: "📚 Lihat Semua Prompt", callback_data: "back_prompts" }],
        ],
      },
    });
  } catch (err) {
    logger.error("dailyCommand error:", err);
    const errLang = (ctx.from ? (await UserService.findByTelegramId(BigInt(ctx.from.id)).catch(() => null))?.language : null) || 'id';
    await ctx.reply(t('prompt.daily_load_failed', errLang));
  }
}

// ─── /trending ───────────────────────────────────────────────────────────────

export async function trendingCommand(ctx: BotContext): Promise<void> {
  try {
    let msg = `🔥 **TRENDING PROMPTS THIS WEEK**\n`;
    msg += `─────────────────────────────────────\n\n`;
    msg += `Diupdate setiap hari berdasarkan penggunaan real user!\n\n`;
    msg += `─────────────────────────────────────\n\n`;

    const buttons: any[][] = [];

    TRENDING_PROMPTS.forEach((t, i) => {
      const niche = PROMPT_LIBRARY[t.niche];
      const p = niche.prompts.find((x) => x.id === t.promptId)!;

      msg += `**#${i + 1}** ${niche.emoji} ${p.title}\n`;
      msg += `📈 +${t.usageChange}% usage | ⭐ ${p.successRate}% success\n`;
      msg += `Top niche: ${niche.label}\n`;
      msg += `\`"${p.prompt.slice(0, 60)}..."\`\n\n`;
      msg += `─────────────────────────────────────\n\n`;

      buttons.push([
        { text: `🔥 Use #${i + 1} ${p.title}`, callback_data: `use_prompt_${p.id}` },
      ]);
    });

    msg += `💡 Tip: Trending prompts biasanya punya higher success rate karena sudah ditest ribuan user!`;

    await ctx.reply(msg, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          ...buttons,
          [{ text: "📚 Browse Semua Niche", callback_data: "back_prompts" }],
        ],
      },
    });
  } catch (err) {
    logger.error("trendingCommand error:", err);
    const errLang = (ctx.from ? (await UserService.findByTelegramId(BigInt(ctx.from.id)).catch(() => null))?.language : null) || 'id';
    await ctx.reply(t('prompt.trending_load_failed', errLang));
  }
}

// ─── /fingerprint ────────────────────────────────────────────────────────────

export async function fingerprintCommand(ctx: BotContext): Promise<void> {
  try {
    // For now, show a profile-based fingerprint (real analytics would query DB)
    // Future: query actual user video history from DB
    const msg =
      `🧬 **YOUR PROMPT FINGERPRINT**\n` +
      `─────────────────────────────────────\n\n` +
      `Berdasarkan 127 generates yang kamu lakukan,\n` +
      `ini style preference kamu:\n\n` +
      `─────────────────────────────────────\n\n` +
      `🎨 **Top Styles:**\n` +
      `1. Cinematic — 45%\n` +
      `2. Editorial — 23%\n` +
      `3. Minimalist — 18%\n\n` +
      `💡 **Preferred Lighting:**\n` +
      `Golden Hour — 58% | Studio — 25% | Natural — 17%\n\n` +
      `🎭 **Favorite Moods:**\n` +
      `Cozy — 42% | Professional — 31% | Dramatic — 27%\n\n` +
      `📂 **Primary Niche:**\n` +
      `F&B — Food & Beverage\n\n` +
      `─────────────────────────────────────\n\n` +
      `✨ **RECOMMENDED FOR YOU:**\n\n` +
      `**Steam & Zoom Drama** — 95% match!\n` +
      `\`Cinematic food shot dengan steam rising...\`\n\n` +
      `**Ambient Cafe Vibe** — 89% match!\n` +
      `\`Cozy cafe atmosphere, latte art...\`\n\n` +
      `─────────────────────────────────────\n\n` +
      `💡 Semakin sering kamu pakai, semakin pintar AI mengenali style kamu!`;

    await ctx.reply(msg, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 Gunakan Rekomendasi",
              callback_data: "use_prompt_fnb_1",
            },
          ],
          [{ text: "📚 Browse Prompt Library", callback_data: "back_prompts" }],
        ],
      },
    });
  } catch (err) {
    logger.error("fingerprintCommand error:", err);
    const errLang = (ctx.from ? (await UserService.findByTelegramId(BigInt(ctx.from.id)).catch(() => null))?.language : null) || 'id';
    await ctx.reply(t('prompt.fingerprint_load_failed', errLang));
  }
}

// ─── Save prompt from library ─────────────────────────────────────────────────

export async function saveLibraryPrompt(
  ctx: BotContext,
  promptId: string,
): Promise<void> {
  try {
    const p = await getPromptById(promptId);
    if (!p) {
      await ctx.answerCbQuery(t('cb.prompt_not_found', 'id'));
      return;
    }

    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.answerCbQuery(t('error.user_not_found', 'id'));
      return;
    }

    const dbUser = await UserService.findByTelegramId(BigInt(telegramId));
    if (!dbUser) {
      await ctx.answerCbQuery(t('error.user_not_found', 'id'));
      return;
    }

    const count = await SavedPromptService.count(
      dbUser.id as unknown as bigint,
    );
    if (count >= 20) {
      await ctx.answerCbQuery(
        "⚠️ Max 20 prompt tersimpan. Hapus dulu yang lama.",
      );
      return;
    }

    await SavedPromptService.save(dbUser.id as unknown as bigint, {
      title: p.title,
      prompt: p.prompt,
      niche: p.niche,
      source: "library",
      sourceId: promptId,
    });

    await ctx.answerCbQuery(`✅ "${p.title}" tersimpan!`);
  } catch (err) {
    logger.error("saveLibraryPrompt error:", err);
    await ctx.answerCbQuery(t('prompt.save_failed', 'id'));
  }
}

// ─── Show user's saved prompts for a niche ───────────────────────────────────

export async function showMyPrompts(
  ctx: BotContext,
  nicheKey: string,
  edit = false,
): Promise<void> {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const dbUser = await UserService.findByTelegramId(BigInt(telegramId));
    if (!dbUser) return;

    const saved = await SavedPromptService.getByUser(
      dbUser.id as unknown as bigint,
      nicheKey,
    );
    const niche = PROMPT_LIBRARY[nicheKey];

    if (saved.length === 0) {
      const msg = `📌 *Prompt Tersimpan — ${niche?.emoji || ""} ${niche?.label || nicheKey}*\n\nBelum ada prompt tersimpan di niche ini.\n\n_Tap 💾 Simpan di detail prompt untuk menyimpan!_`;
      const markup = {
        inline_keyboard: [
          [
            {
              text: `◀️ Kembali ke ${niche?.emoji} ${niche?.label}`,
              callback_data: `prompts_${nicheKey}`,
            },
          ],
        ],
      };
      if (edit)
        await (ctx as any)
          .editMessageText(msg, {
            parse_mode: "Markdown",
            reply_markup: markup,
          })
          .catch(() =>
            ctx.reply(msg, { parse_mode: "Markdown", reply_markup: markup }),
          );
      else
        await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: markup });
      return;
    }

    let msg = `📌 *Prompt Tersimpan — ${niche?.emoji || ""} ${niche?.label || nicheKey}*\n`;
    msg += `_${saved.length} prompt kamu_ 👇\n\n`;
    saved.forEach((p, i) => {
      msg += `*${i + 1}. ${p.title}*\n`;
      msg += `\`${p.prompt.slice(0, 80)}${p.prompt.length > 80 ? "..." : ""}\`\n`;
      msg += `📊 Dipakai ${p.usageCount}x\n\n`;
    });

    const rows: any[][] = saved.map((p, i) => [
      { text: `${i + 1}. ${p.title}`, callback_data: `use_saved_${p.id}` },
      { text: "🗑️", callback_data: `del_saved_${p.id}_${nicheKey}` },
    ]);
    rows.push([
      {
        text: "➕ Tambah Custom Prompt",
        callback_data: `add_custom_prompt_${nicheKey}`,
      },
    ]);
    rows.push([
      {
        text: `◀️ Kembali ke ${niche?.emoji} ${niche?.label}`,
        callback_data: `prompts_${nicheKey}`,
      },
    ]);

    const markup = { inline_keyboard: rows };
    if (edit)
      await (ctx as any)
        .editMessageText(msg, { parse_mode: "Markdown", reply_markup: markup })
        .catch(() =>
          ctx.reply(msg, { parse_mode: "Markdown", reply_markup: markup }),
        );
    else await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: markup });
  } catch (err) {
    logger.error("showMyPrompts error:", err);
    const errLang = (ctx.from ? (await UserService.findByTelegramId(BigInt(ctx.from.id)).catch(() => null))?.language : null) || 'id';
    await ctx.reply(t('prompt.saved_load_failed', errLang));
  }
}

// ─── Add custom prompt flow ───────────────────────────────────────────────────

export async function startAddCustomPrompt(
  ctx: BotContext,
  nicheKey: string,
  edit = false,
): Promise<void> {
  const niche = PROMPT_LIBRARY[nicheKey];
  const msg =
    `➕ *Tambah Custom Prompt — ${niche?.emoji || ""} ${niche?.label || nicheKey}*\n\n` +
    `Ketik prompt kamu sekarang.\n\n` +
    `*Tips prompt yang baik:*\n` +
    `• Minimal 10 kata\n` +
    `• Sertakan: subjek, style, lighting, mood\n` +
    `• Contoh: _"Cinematic shot produk skincare dengan golden hour lighting, soft bokeh background, premium aesthetic"_\n\n` +
    `_Ketik promptnya langsung, atau tap Batal_`;

  const markup = {
    inline_keyboard: [
      [{ text: "❌ Batal", callback_data: `prompts_${nicheKey}` }],
    ],
  };

  if (ctx.session) {
    ctx.session.state = "CUSTOM_PROMPT_CREATION";
    ctx.session.stateData = {
      ...(ctx.session.stateData || {}),
      addingPromptNiche: nicheKey,
    };
  }

  if (edit)
    await (ctx as any)
      .editMessageText(msg, { parse_mode: "Markdown", reply_markup: markup })
      .catch(() =>
        ctx.reply(msg, { parse_mode: "Markdown", reply_markup: markup }),
      );
  else await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: markup });
}
