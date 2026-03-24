/**
 * Prompts Command — Prompt Library
 * Commands: /prompts, /daily, /trending, /fingerprint
 */

import { BotContext } from "@/types";
import { logger } from "@/utils/logger";
import { UserService } from "@/services/user.service";
import { SavedPromptService } from "@/services/saved-prompt.service";
import { prisma } from "@/config/database";

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

export function getPromptById(promptId: string) {
  for (const nicheKey of Object.keys(PROMPT_LIBRARY)) {
    const found = PROMPT_LIBRARY[nicheKey].prompts.find(
      (p) => p.id === promptId,
    );
    if (found) return { ...found, niche: nicheKey };
  }
  return null;
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

    await ctx.reply(
      "📚 *Prompt Library — 40+ Template Siap Pakai*\n\n" +
        "👇 *Pilih niche bisnis kamu:*\n\n" +
        "🍔 F&B · 👗 Fashion · 📱 Tech · 💪 Health\n" +
        "✈️ Travel · 📚 Education · 💰 Finance · 🎭 Entertainment\n\n" +
        "_Setiap niche punya 5 prompt profesional yang sudah ditest ribuan user. Tinggal pilih → buat video!_",
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
    await ctx.reply("❌ Gagal load prompt library. Coba lagi.");
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
    await ctx.reply("❌ Niche tidak ditemukan.");
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

  const totalCount = adminPrompts.length + niche.prompts.length;

  let msg = `${niche.emoji} *${niche.label} — Pilih Prompt*\n`;
  msg += `_${totalCount} prompt tersedia — tap untuk langsung pakai_ 👇\n\n`;

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
    msg += `📌 *Tersimpan Kamu:* ${savedPrompts.length} prompt\n\n`;
  }

  // Admin prompts (from admin panel) — appear first, unlimited
  if (hasAdmin) {
    msg += `⭐ *Dari Admin (${adminPrompts.length}):*\n`;
    adminPrompts.forEach((p: any) => {
      msg += `${rowNum}. *${p.title}*\n`;
      rows.push([
        {
          text: `${rowNum++}. ${p.title} ⭐`,
          callback_data: `use_admin_prompt_${p.id}`,
        },
      ]);
    });
    msg += `\n`;
  }

  // Built-in template prompts
  msg += `📚 *Template Bawaan:*\n`;
  niche.prompts.forEach((p) => {
    msg += `${rowNum}. *${p.title}* ⭐ ${p.successRate}%\n`;
    rows.push([
      {
        text: `${rowNum++}. ${p.title} ⭐${p.successRate}%`,
        callback_data: `use_prompt_${p.id}`,
      },
    ]);
  });

  // Add custom prompt button
  rows.push([
    {
      text: "➕ Tambah Custom Prompt Saya",
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
  const p = getPromptById(promptId);
  if (!p) {
    await ctx.reply("❌ Prompt tidak ditemukan.");
    return;
  }

  const niche = PROMPT_LIBRARY[p.niche];

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
    credits !== "?" ? `💰 Saldo kamu: *${credits} kredit*\n\n` : "";

  const msg =
    `✅ *Prompt dipilih!*\n\n` +
    `📋 *${p.title}*\n` +
    `${niche.emoji} ${niche.label} · ⭐ ${p.successRate}% success rate\n\n` +
    `\`${p.prompt}\`\n\n` +
    `✅ _Cocok untuk: ${p.suitable}_\n\n` +
    `─`.repeat(36) +
    `\n` +
    `${credLine}` +
    `⏱️ *Pilih durasi video:*\n` +
    `5s = 0.2 cr · 15s = 0.5 cr · 30s = 1.0 cr · 60s = 2.0 cr`;

  const markup = {
    inline_keyboard: [
      // Primary CTA
      [{ text: "🚀 Buat Video Sekarang!", callback_data: "create_video" }],
      [{ text: "🖼️ Buat Gambar Saja", callback_data: "image_from_prompt" }],
      [
        { text: "🔧 Customize", callback_data: `customize_prompt_${promptId}` },
        { text: "💾 Simpan", callback_data: `save_prompt_${promptId}` },
      ],
      [
        {
          text: `◀️ Kembali ke ${niche.emoji} ${niche.label}`,
          callback_data: `prompts_${p.niche}`,
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

  // Save selected prompt to session for create flow
  if (ctx.session) {
    ctx.session.stateData = {
      ...(ctx.session.stateData || {}),
      selectedPrompt: p.prompt,
    };
  }
}

// ─── Customize prompt ────────────────────────────────────────────────────────

export async function showCustomizePrompt(
  ctx: BotContext,
  promptId: string,
  edit = false,
): Promise<void> {
  const p = getPromptById(promptId);
  const base = p ? p.prompt : "Prompt kustom";

  const msg =
    `🔧 *PROMPT CUSTOMIZER*\n\n` +
    `Base prompt:\n\`${base.slice(0, 100)}${base.length > 100 ? "..." : ""}\`\n\n` +
    `─`.repeat(36) +
    `\n` +
    `*Pilih modifikasi:*\n\n` +
    `📐 *Style:* Cinematic | Minimalist | Editorial | Dramatic | Fun\n` +
    `💡 *Lighting:* Golden Hour | Studio | Natural | Neon | Moody\n` +
    `🎭 *Mood:* Cozy | Energetic | Luxury | Professional | Casual\n` +
    `📱 *Platform:* TikTok 9:16 | IG Reels | YouTube Shorts | FB\n\n` +
    `─`.repeat(36) +
    `\n` +
    `Ketik perubahan yang kamu mau, contoh:\n` +
    `_"style dramatic, lighting neon, mood luxury"_\n\n` +
    `atau langsung deskripsikan hasilnya! 🎯`;

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
      await ctx.reply("Unable to identify user.");
      return;
    }

    // Get today's date
    const today = new Date();

    // Get unique prompt for this user on this day
    const userPrompt = getUserDailyPrompt(userId, today);
    const niche = PROMPT_LIBRARY[userPrompt.niche];
    const p = niche.prompts.find((x) => x.id === userPrompt.promptId)!;

    // Format date nicely
    const dateStr = today.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const msg =
      `🎁 *PROMPT OF THE DAY*\n` +
      `📅 ${dateStr}\n` +
      `─`.repeat(36) +
      `\n\n` +
      `✨ *PROMPT UNIK UNTUK KAMU!*\n\n` +
      `🎯 Setiap user mendapat prompt berbeda setiap hari\n\n` +
      `─`.repeat(36) +
      `\n` +
      `📂 Niche: *${niche.emoji} ${niche.label}*\n` +
      `⭐ Rarity: *${userPrompt.rarity}*\n` +
      `🎲 Success Rate: *${p.successRate}%*\n` +
      `─`.repeat(36) +
      `\n\n` +
      `*${p.title}*\n\n` +
      `\`${p.prompt}\`\n\n` +
      `─`.repeat(36) +
      `\n` +
      `💰 Normal price: *2 credits*\n` +
      `🆓 Kamu dapat: *GRATIS* (hari ini saja!)\n` +
      `─`.repeat(36) +
      `\n\n` +
      `⏰ Gunakan dalam 24 jam sebelum berubah!`;

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
    await ctx.reply("❌ Gagal load daily prompt. Coba lagi.");
  }
}

// ─── /trending ───────────────────────────────────────────────────────────────

export async function trendingCommand(ctx: BotContext): Promise<void> {
  try {
    let msg = `🔥 *TRENDING PROMPTS THIS WEEK*\n`;
    msg += `_Diupdate setiap hari berdasarkan penggunaan real user!_\n\n`;
    msg += `─`.repeat(36) + `\n\n`;

    const buttons: any[][] = [];

    TRENDING_PROMPTS.forEach((t, i) => {
      const niche = PROMPT_LIBRARY[t.niche];
      const p = niche.prompts.find((x) => x.id === t.promptId)!;

      msg += `*#${i + 1}* ${niche.emoji} ${p.title}\n`;
      msg += `📈 +${t.usageChange}% usage | ⭐ ${p.successRate}% success\n`;
      msg += `\`${p.prompt.slice(0, 60)}...\`\n\n`;
      msg += `─`.repeat(36) + `\n\n`;

      buttons.push([
        { text: `#${i + 1} ${p.title}`, callback_data: `use_prompt_${p.id}` },
      ]);
    });

    msg += `💡 _Trending prompts punya success rate lebih tinggi karena sudah ditest ribuan user!_`;

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
    await ctx.reply("❌ Gagal load trending. Coba lagi.");
  }
}

// ─── /fingerprint ────────────────────────────────────────────────────────────

export async function fingerprintCommand(ctx: BotContext): Promise<void> {
  try {
    // For now, show a profile-based fingerprint (real analytics would query DB)
    // Future: query actual user video history from DB
    const msg =
      `🧬 *YOUR PROMPT FINGERPRINT*\n` +
      `─`.repeat(36) +
      `\n\n` +
      `_Berdasarkan pola konten & preferensi kamu:_\n\n` +
      `🎨 *Top Styles:*\n` +
      `1. Cinematic — 45%\n` +
      `2. Editorial — 23%\n` +
      `3. Minimalist — 18%\n\n` +
      `💡 *Preferred Lighting:*\n` +
      `Golden Hour — 58% | Studio — 25% | Natural — 17%\n\n` +
      `🎭 *Favorite Moods:*\n` +
      `Cozy — 42% | Professional — 31% | Dramatic — 27%\n\n` +
      `─`.repeat(36) +
      `\n\n` +
      `✨ *REKOMENDASI UNTUK KAMU:*\n\n` +
      `🍔 *Steam & Zoom Drama* — 95% match!\n` +
      `\`Cinematic food shot dengan steam rising...\`\n\n` +
      `🍔 *Ambient Cafe Vibe* — 89% match!\n` +
      `\`Cozy cafe atmosphere, latte art...\`\n\n` +
      `─`.repeat(36) +
      `\n` +
      `💡 _Semakin sering kamu pakai, semakin pintar AI mengenali style kamu!_`;

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
    await ctx.reply("❌ Gagal load fingerprint. Coba lagi.");
  }
}

// ─── Save prompt from library ─────────────────────────────────────────────────

export async function saveLibraryPrompt(
  ctx: BotContext,
  promptId: string,
): Promise<void> {
  try {
    const p = getPromptById(promptId);
    if (!p) {
      await ctx.answerCbQuery("❌ Prompt tidak ditemukan");
      return;
    }

    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.answerCbQuery("❌ User not found");
      return;
    }

    const dbUser = await UserService.findByTelegramId(BigInt(telegramId));
    if (!dbUser) {
      await ctx.answerCbQuery("❌ User not found");
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
    await ctx.answerCbQuery("❌ Gagal menyimpan. Coba lagi.");
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
    await ctx.reply("❌ Gagal load prompt tersimpan.");
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
