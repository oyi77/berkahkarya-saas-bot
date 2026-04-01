export interface NicheConfig {
  id: string;
  name: string;
  emoji: string;
  defaultAspectRatio: string;
  sceneTemplates: {
    intro: string[];
    body: string[];
    outro: string[];
  };
  keywords: string[];
  colorPalettes: string[];
  negativeKeywords?: string[];
}

export const NICHE_CONFIG: Record<string, NicheConfig> = {
  fashion_lifestyle: {
    id: 'fashion_lifestyle',
    name: 'Fashion & Lifestyle',
    emoji: '👗',
    defaultAspectRatio: '9:16',
    sceneTemplates: {
      intro: [
        'flat lay on {surface} with {lighting}',
        'model holding {product} in {setting}',
        'wardrobe reveal with {product} as focal point',
      ],
      body: [
        'outfit transition with {product} detail shot',
        'street style walking with {product} visible',
        'mirror selfie aesthetic showcasing {product}',
      ],
      outro: [
        'final look pose with {product} highlighted',
        'accessories close-up including {product}',
        'brand tag reveal with {product}',
      ],
    },
    keywords: ['trendy', 'aesthetic', 'OOTD', 'styling', 'fashion'],
    colorPalettes: ['neutral tones', 'pastel', 'monochrome', 'vibrant'],
  },

  food_culinary: {
    id: 'food_culinary',
    name: 'Food & Culinary',
    emoji: '🍜',
    defaultAspectRatio: '9:16',
    sceneTemplates: {
      intro: [
        'ingredients flat lay with {product} as hero',
        'sizzling {product} in {cooking_method}',
        'table setting with {product} centerpiece',
      ],
      body: [
        'cooking process showing {product} transformation',
        'plating technique with {product} garnish',
        'steam rising from fresh {product}',
      ],
      outro: [
        'satisfaction shot of {product} being enjoyed',
        'final dish beauty shot with {product}',
        "chef's kiss moment with {product}",
      ],
    },
    keywords: ['delicious', 'fresh', 'homemade', 'satisfying', 'foodie'],
    colorPalettes: ['warm tones', 'rustic', 'bright', 'moody'],
  },

  tech_gadgets: {
    id: 'tech_gadgets',
    name: 'Tech & Gadgets',
    emoji: '📱',
    defaultAspectRatio: '9:16',
    sceneTemplates: {
      intro: [
        'unboxing reveal of {product} with dramatic lighting',
        '{product} on minimal desk setup',
        'macro shot of {product} design details',
      ],
      body: [
        'feature demonstration of {product} capability',
        'comparison scale with hand holding {product}',
        'screen glow illuminating {product} interface',
      ],
      outro: [
        'lifestyle shot with {product} in use',
        'specs highlight floating around {product}',
        'call-to-action with {product} front center',
      ],
    },
    keywords: ['innovative', 'sleek', 'powerful', 'minimal', 'tech'],
    colorPalettes: ['neon accents', 'dark mode', 'white space', 'metallic'],
  },

  beauty_skincare: {
    id: 'beauty_skincare',
    name: 'Beauty & Skincare',
    emoji: '💄',
    defaultAspectRatio: '9:16',
    sceneTemplates: {
      intro: [
        'vanity setup with {product} among essentials',
        'texture close-up of {product} formula',
        'packaging reveal of {product}',
      ],
      body: [
        'application process using {product}',
        'before/after transition with {product}',
        'routine integration of {product}',
      ],
      outro: [
        'glowing skin result from {product}',
        'shelfie with {product} featured',
        'satisfaction selfie with {product}',
      ],
    },
    keywords: ['glowing', 'radiant', 'luxury', 'self-care', 'beauty'],
    colorPalettes: ['soft pink', 'rose gold', 'clean white', 'natural'],
  },

  travel_adventure: {
    id: 'travel_adventure',
    name: 'Travel & Adventure',
    emoji: '✈️',
    defaultAspectRatio: '9:16',
    sceneTemplates: {
      intro: [
        'destination reveal with {product} in frame',
        'packing moment with {product} being placed',
        'travel flat lay featuring {product}',
      ],
      body: [
        '{product} in use at scenic location',
        'local culture interaction with {product}',
        'adventure moment showcasing {product} durability',
      ],
      outro: [
        'sunset silhouette with {product}',
        'travel diary entry with {product} memory',
        'wanderlust shot featuring {product}',
      ],
    },
    keywords: ['adventure', 'wanderlust', 'explore', 'freedom', 'travel'],
    colorPalettes: ['golden hour', 'tropical', 'earthy', 'vibrant'],
  },

  fitness_health: {
    id: 'fitness_health',
    name: 'Fitness & Health',
    emoji: '💪',
    defaultAspectRatio: '9:16',
    sceneTemplates: {
      intro: [
        'gym bag reveal with {product}',
        'pre-workout ritual with {product}',
        'motivation setup featuring {product}',
      ],
      body: [
        'workout in progress with {product} visible',
        'sweat and effort moment with {product}',
        'progress check using {product}',
      ],
      outro: [
        'post-workout satisfaction with {product}',
        'transformation reveal with {product}',
        'community moment sharing {product}',
      ],
    },
    keywords: ['strong', 'healthy', 'energy', 'discipline', 'fitness'],
    colorPalettes: ['high contrast', 'neon', 'natural', 'bold'],
  },

  home_decor: {
    id: 'home_decor',
    name: 'Home & Decor',
    emoji: '🏠',
    defaultAspectRatio: '9:16',
    sceneTemplates: {
      intro: [
        'room transformation before with {product}',
        'cozy corner featuring {product}',
        'styling process with {product}',
      ],
      body: [
        'detail shot of {product} in context',
        'lifestyle moment with {product} functional',
        'seasonal styling with {product} adapted',
      ],
      outro: [
        'final reveal with {product} integrated',
        'room tour highlight of {product}',
        'satisfaction moment enjoying {product}',
      ],
    },
    keywords: ['cozy', 'aesthetic', 'organized', 'warm', 'home'],
    colorPalettes: ['neutral', 'scandinavian', 'boho', 'modern'],
  },

  business_finance: {
    id: 'business_finance',
    name: 'Business & Finance',
    emoji: '💼',
    defaultAspectRatio: '9:16',
    sceneTemplates: {
      intro: [
        'professional desk setup with {product}',
        'productivity tools featuring {product}',
        'morning routine with {product}',
      ],
      body: [
        'workflow demonstration of {product}',
        'success metrics visualization with {product}',
        'professional using {product} effectively',
      ],
      outro: [
        'achievement moment with {product}',
        'growth chart alongside {product}',
        'professional recommendation of {product}',
      ],
    },
    keywords: ['professional', 'growth', 'success', 'efficiency', 'business'],
    colorPalettes: ['corporate blue', 'minimal', 'luxury', 'trust'],
  },

  education_knowledge: {
    id: 'education_knowledge',
    name: 'Education & Learning',
    emoji: '📚',
    defaultAspectRatio: '9:16',
    sceneTemplates: {
      intro: [
        'study setup with {product} ready',
        'knowledge tools featuring {product}',
        'learning environment with {product}',
      ],
      body: [
        'demonstration of {product} feature',
        'problem-solving with {product}',
        'aha moment using {product}',
      ],
      outro: [
        'mastery showcase with {product}',
        'sharing knowledge about {product}',
        'achievement unlock with {product}',
      ],
    },
    keywords: ['smart', 'insightful', 'curious', 'knowledge', 'learn'],
    colorPalettes: ['clean', 'focused', 'inspiring', 'academic'],
  },
};

export const NICHE_LIST = Object.values(NICHE_CONFIG);
export const NICHE_IDS = Object.keys(NICHE_CONFIG);

// Cache for 5 minutes
let nicheCache: any[] | null = null;
let nicheCacheTime = 0;
const NICHE_CACHE_TTL = 5 * 60 * 1000;

export async function getNichesAsync(): Promise<typeof NICHE_LIST> {
  if (nicheCache && Date.now() - nicheCacheTime < NICHE_CACHE_TTL) {
    return nicheCache as typeof NICHE_LIST;
  }
  try {
    const { prisma } = await import('./database.js');
    const dbNiches = await prisma.pricingConfig.findMany({
      where: { category: 'niche' },
    });
    if (dbNiches.length > 0) {
      const parsed = dbNiches.map((n: any) => ({
        id: n.key,
        ...((typeof n.value === 'string' ? JSON.parse(n.value) : n.value) as any),
      }));
      nicheCache = parsed;
      nicheCacheTime = Date.now();
      return parsed;
    }
  } catch (err) {
    const { logger } = await import('../utils/logger.js');
    logger.warn('Failed to load niches from DB, using static config', { error: (err as Error).message });
  }
  return NICHE_LIST;
}
