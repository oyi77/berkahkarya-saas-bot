/**
 * Image Engine — Production-grade image prompt orchestration config.
 *
 * Consolidated from 6 source modules:
 *   1. Additional_Categories (kids, auto, pets, health, jewelry, sports)
 *   2. Home_Decor_Furniture_Master
 *   3. Electronics_Lifestyle_Matching
 *   4. Fashion_Ultra_Realistic_Master
 *   5. FnB_Global_Engine
 *   6. Skincare_Kosmetik
 *
 * Provides a unified resolveImagePrompt() that auto-detects the product
 * category from user description keywords and composes a rich prompt.
 */

// ── Types ──

export interface ProductDetectionEntry {
  keywords: string[];
  label: string;
  focus: string;
  default_style: string;
}

export interface StyleEntry {
  label: string;
  prompt_val: string;
}

export interface MaterialEntry {
  label: string;
  prompt_val: string;
}

export interface ImagePromptResult {
  full: string;
  style: string;
  effects: string[];
  category: string;
}

// ── Module 1: Additional Categories ──

export const ADDITIONAL_CATEGORIES_DETECTION: Record<string, ProductDetectionEntry> = {
  kids_baby_goods: {
    keywords: ['toy', 'doll', 'baby clothes', 'stroller', 'diaper', 'milk bottle', 'bib'],
    label: 'Kids & Baby',
    focus: 'soft edges, safety material, playful colors',
    default_style: 'soft_pastel',
  },
  automotive_parts: {
    keywords: ['helmet', 'tire', 'rim', 'oil', 'car accessories', 'spark plug', 'muffler'],
    label: 'Automotive',
    focus: 'glossy finish, metal reflection, rugged texture',
    default_style: 'masculine_industrial',
  },
  pet_supplies: {
    keywords: ['pet food', 'cat tree', 'leash', 'collar', 'aquarium', 'pet toy'],
    label: 'Pet Supplies',
    focus: 'fur interaction, food freshness, durable fabric',
    default_style: 'playful_natural',
  },
  health_medical: {
    keywords: ['mask', 'vitamin', 'medicine', 'thermometer', 'stethoscope', 'bandage'],
    label: 'Health & Medical',
    focus: 'sterile packaging, clinical precision, clean label',
    default_style: 'clinical_clean',
  },
  jewelry_luxury: {
    keywords: ['ring', 'necklace', 'earring', 'bracelet', 'diamond', 'gold', 'silver'],
    label: 'Jewelry',
    focus: 'gemstone sparkle, metal polish, intricate details',
    default_style: 'velvet_luxury',
  },
  sports_outdoor: {
    keywords: ['yoga mat', 'dumbbell', 'tent', 'hiking bag', 'soccer ball', 'bottle'],
    label: 'Sports & Outdoor',
    focus: 'sweat resistance, durable texture, dynamic shape',
    default_style: 'action_lifestyle',
  },
};

export const ADDITIONAL_CATEGORY_STYLES: Record<string, StyleEntry> = {
  soft_pastel: {
    label: 'Soft Pastel',
    prompt_val: 'soft pastel colors, baby pink and blue, bright soft lighting, innocent, safe and clean, dreamy atmosphere',
  },
  playful_colorful: {
    label: 'Playful Colorful',
    prompt_val: 'vibrant colors, playful background, toys scattered, happy vibe, children room setting',
  },
  masculine_industrial: {
    label: 'Masculine Industrial',
    prompt_val: 'industrial garage background, concrete floor, dramatic lighting, masculine, rugged, high contrast',
  },
  glossy_showroom: {
    label: 'Glossy Showroom',
    prompt_val: 'car showroom lighting, glossy floor reflection, sleek, premium automotive display',
  },
  playful_natural: {
    label: 'Natural Pet Vibe',
    prompt_val: 'natural lighting, wooden floor, blurred greenery background, pet-friendly environment',
  },
  cozy_home: {
    label: 'Cozy Home',
    prompt_val: 'living room carpet, soft blanket, warm home atmosphere, cozy',
  },
  clinical_clean: {
    label: 'Clinical Clean',
    prompt_val: 'clean white background, medical blue accents, sterile, professional, scientific, high key lighting',
  },
  lab_professional: {
    label: 'Lab Professional',
    prompt_val: 'blurred laboratory background, scientist in background, professional equipment, trust',
  },
  velvet_luxury: {
    label: 'Velvet Luxury',
    prompt_val: 'black velvet background, spotlight, sparkling gems, high end jewelry, dramatic contrast',
  },
  editorial_fashion: {
    label: 'Editorial Fashion',
    prompt_val: 'vogue magazine style, model neck or hand, fashion editorial, artistic lighting',
  },
  action_lifestyle: {
    label: 'Action Lifestyle',
    prompt_val: 'sweat droplets, dynamic pose, gym background, energetic, high energy lighting',
  },
  outdoor_adventure: {
    label: 'Outdoor Adventure',
    prompt_val: 'mountain peak background, snow or forest, extreme conditions, durable',
  },
};

export const ADDITIONAL_MATERIALS: Record<string, MaterialEntry> = {
  metal_chrome: { label: 'Chrome Metal', prompt_val: 'chrome finish, shiny metal, reflection' },
  gold_silver: { label: 'Precious Metal', prompt_val: 'polished gold, sterling silver, shiny texture' },
  rubber_tire: { label: 'Rubber/Thread', prompt_val: 'rubber texture, tire tread pattern, grippy' },
  plastic_toy: { label: 'Plastic ABS', prompt_val: 'matte plastic, colorful, durable toy material' },
  fabric_sport: { label: 'Sport Fabric', prompt_val: 'breathable fabric texture' },
};

// ── Module 2: Home Decor & Furniture Master ──

export const HOME_DECOR_DETECTION: Record<string, {
  keywords: string[];
  label: string;
  focus_point: string;
  default_subgenre: string;
}> = {
  seating_sofa: {
    keywords: ['sofa', 'couch', 'armchair', 'loveseat', 'sectional', 'ottoman', 'bean bag'],
    label: 'Seating & Sofa',
    focus_point: 'fabric texture, cushion plumpness, ergonomic curves',
    default_subgenre: 'scandinavian_hygge',
  },
  table_desk: {
    keywords: ['table', 'desk', 'coffee table', 'dining table', 'side table', 'console'],
    label: 'Table & Desk',
    focus_point: 'surface finish, leg structure, wood grain or marble vein',
    default_subgenre: 'mid_century_modern',
  },
  bedding_mattress: {
    keywords: ['bed', 'mattress', 'headboard', 'bedframe', 'pillow', 'blanket'],
    label: 'Bedding & Mattress',
    focus_point: 'linen texture, layering, headboard material',
    default_subgenre: 'luxury_hotel_suite',
  },
  lighting_decor: {
    keywords: ['lamp', 'chandelier', 'pendant', 'sconce', 'lantern', 'floor lamp'],
    label: 'Lighting Fixture',
    focus_point: 'material shade, wire detail, light glow temperature',
    default_subgenre: 'moody_ambience',
  },
  decor_accessories: {
    keywords: ['vase', 'planter', 'mirror', 'clock', 'candle', 'frame', 'sculpture'],
    label: 'Decor & Accessories',
    focus_point: 'ceramic glaze, reflection, intricate patterns',
    default_subgenre: 'bohemian_eclectic',
  },
  kitchen_dining: {
    keywords: ['plate', 'bowl', 'cutlery', 'glassware', 'mug', 'jar', 'tray'],
    label: 'Kitchen & Dining Ware',
    focus_point: 'stacking arrangement, food pairing, gloss finish',
    default_subgenre: 'flatlay_editorial',
  },
};

export const INTERIOR_STYLES: Record<string, StyleEntry> = {
  scandinavian_hygge: {
    label: 'Scandinavian Hygge',
    prompt_val: 'scandinavian interior, light wood floors, white walls, minimalist, cozy throws, bright natural light',
  },
  mid_century_modern: {
    label: 'Mid-Century Modern',
    prompt_val: 'mid century modern furniture, tapered legs, rich walnut wood, retro vibe, stylish living room',
  },
  japandi_fusion: {
    label: 'Japandi Zen',
    prompt_val: 'japandi style, low profile furniture, neutral tones, paper lanterns, natural wood, zen atmosphere',
  },
  modern_farmhouse: {
    label: 'Modern Farmhouse',
    prompt_val: 'modern farmhouse interior, shiplap walls, rustic wood, black metal accents, apron sink, cozy',
  },
  luxury_hotel_suite: {
    label: 'Luxury Hotel Suite',
    prompt_val: 'luxury hotel room, king size bed, ambient lighting, city view window, marble details, expensive',
  },
  bohemian_eclectic: {
    label: 'Bohemian Eclectic',
    prompt_val: 'boho chic interior, layered rugs, rattan furniture, hanging plants, macrame, colorful cushions',
  },
  industrial_loft: {
    label: 'Industrial Loft',
    prompt_val: 'converted warehouse, exposed brick walls, concrete floor, steel beams, leather sofa',
  },
};

export const HOME_MATERIAL_ENGINE = {
  wood_finishes: {
    oak_light: { label: 'Light Oak', prompt_val: 'natural light oak wood grain, blonde wood, scandinavian finish' },
    walnut_dark: { label: 'Dark Walnut', prompt_val: 'rich dark walnut wood, deep brown grain, premium varnish' },
    reclaimed_rustic: { label: 'Reclaimed Wood', prompt_val: 'reclaimed barn wood, distressed texture, rustic feel' },
  },
  stone_surfaces: {
    marble_white: { label: 'Carrara Marble', prompt_val: 'white carrara marble surface, soft grey veins, polished' },
    marble_gold: { label: 'Calacatta Gold', prompt_val: 'calacatta gold marble, bold gold veins, dramatic luxury' },
    concrete_raw: { label: 'Raw Concrete', prompt_val: 'industrial concrete surface, micro-cement, smooth grey' },
    terrazzo_speckle: { label: 'Terrazzo', prompt_val: 'colorful terrazzo pattern, speckled surface, modern retro' },
  },
  upholstery_fabric: {
    boucle_curly: { label: 'Boucle', prompt_val: 'boucle fabric texture, curly wool, soft nubby, cozy' },
    velvet_lush: { label: 'Velvet', prompt_val: 'luxurious velvet texture, light catching, soft pile' },
    linen_natural: { label: 'Linen', prompt_val: 'natural linen texture, relaxed wrinkles, breathable' },
    leather_saddle: { label: 'Saddle Leather', prompt_val: 'genuine saddle leather, aged patina, rich brown' },
  },
} as const;

export const HOME_STYLING_PROPS: Record<string, StyleEntry> = {
  coffee_table_styling: { label: 'Coffee Table Vibe', prompt_val: 'decorated with stack of design books, ceramic vase, coffee cup, candle' },
  bed_linen_layering: { label: 'Bed Linen Layering', prompt_val: 'styled with fluffy pillows, duvet cover, folded throw blanket, textured cushion' },
  plant_greenery: { label: 'Greenery Accents', prompt_val: 'surrounded by indoor plants, monstera, potted succulent, fresh flowers' },
  kitchen_prep: { label: 'Kitchen Prep Scene', prompt_val: 'ingredients on counter, cutting board, olive oil, fresh herbs' },
  bathroom_spa: { label: 'Spa Bathroom', prompt_val: 'towel rolled in basket, bath bomb, essential oil, eucalyptus branch' },
};

export const HOME_AMBIENT_MOODS: Record<string, StyleEntry> = {
  golden_hour_magic: { label: 'Golden Hour', prompt_val: 'warm sunset light, sun rays through window, golden glow, cinematic' },
  blue_hour_twilight: { label: 'Blue Hour', prompt_val: 'blue hour lighting, twilight sky, city lights, calm atmosphere' },
  moody_night: { label: 'Moody Night', prompt_val: 'evening ambience, lamp turned on, warm low light, intimate setting' },
  rainy_cozy: { label: 'Rainy Day', prompt_val: 'raindrops on window, grey sky outside, cozy indoor lighting' },
  fireplace_cozy: { label: 'Fireplace Glow', prompt_val: 'glow from fireplace, warm and inviting, winter evening, orange ambient light' },
};

export const HOME_CAMERA_COMPOSITION: Record<string, StyleEntry> = {
  wide_architectural: { label: 'Wide Architectural', prompt_val: 'wide angle lens, architectural photography, full room layout' },
  detail_texture: { label: 'Macro Detail', prompt_val: 'extreme close up, texture focus, fabric weave, wood grain' },
  flatlay_editorial: { label: 'Flatlay Editorial', prompt_val: 'top down view, flat lay, styled arrangement, magazine spread' },
  rule_of_thirds: { label: 'Rule of Thirds', prompt_val: 'product placed on one third, balanced composition, negative space' },
};

// ── Module 3: Electronics Lifestyle Matching ──

export const ELECTRONICS_COLOR_PALETTES: Record<string, StyleEntry> = {
  orange_theme: {
    label: 'Orange / Bronze / Copper',
    prompt_val: 'matching with oranges, autumn leaves, copper metal, terracotta pot, warm sunset vibe, bronze texture',
  },
  blue_theme: {
    label: 'Blue / Navy / Cyan',
    prompt_val: 'matching with blue sky, ocean water, blue denim jeans, blue hydrangea flowers, swimming pool',
  },
  green_theme: {
    label: 'Green / Olive / Mint',
    prompt_val: 'matching with monstera leaves, avocado, matcha latte, grass field, mint ice cream, forest',
  },
  pink_theme: {
    label: 'Pink / Rose / Magenta',
    prompt_val: 'matching with pink flowers, strawberry, pink cotton candy, sunset clouds, rose gold accessories',
  },
  white_silver: {
    label: 'White / Silver / Grey',
    prompt_val: 'matching with white marble, clouds, pearls, silver jewelry, minimalist white room, milk',
  },
  black_dark: {
    label: 'Black / Midnight / Space',
    prompt_val: 'matching with black coffee, dark volcanic rock, midnight sky, shadows, matte black car',
  },
  gold_premium: {
    label: 'Gold / Champagne',
    prompt_val: 'matching with gold jewelry, champagne glass, honey, golden hour sunlight, sand dune',
  },
};

export const ELECTRONICS_LIFESTYLE_VIBES: Record<string, StyleEntry & { desc: string }> = {
  editorial_flatlay: {
    label: 'Editorial Flatlay',
    desc: 'Top-down product shot surrounded by matching objects.',
    prompt_val: 'flat lay photography, top view, arranged neatly on table, aesthetic composition, magazine layout, ample negative space',
  },
  handheld_lifestyle: {
    label: 'Handheld Lifestyle',
    desc: 'Product held in hand with color-matched blur background.',
    prompt_val: 'hand holding the product, blurred background matching the product color, human touch, soft sunlight, outdoor vibe',
  },
  props_matching: {
    label: 'Props & Environment',
    desc: 'Product on surface with surrounding aesthetic props.',
    prompt_val: 'product placed on textured surface, surrounded by aesthetic props like bag, watch, or fruit, fashion style, cozy interior',
  },
  liquid_splash_color: {
    label: 'Colored Liquid Splash',
    desc: 'Color-matched liquid splash effect.',
    prompt_val: 'colored liquid splash matching product color, dynamic motion, frozen action, studio lighting, high speed photography',
  },
};

export const ELECTRONICS_AD_ATMOSPHERE: Record<string, StyleEntry> = {
  soft_natural: {
    label: 'Soft Natural Light',
    prompt_val: 'soft diffused daylight, bright and airy, clean look, morning light',
  },
  warm_golden: {
    label: 'Warm Golden Hour',
    prompt_val: 'warm sunset glow, golden hour, orange tones, cozy feeling',
  },
  studio_clean: {
    label: 'Studio Clean',
    prompt_val: 'professional studio lighting, shadowless, pure white or gradient background',
  },
};

// ── Module 4: Fashion Ultra Realistic Master ──

export const FASHION_DETECTION: Record<string, {
  keywords: string[];
  label: string;
  default_subgenre: string;
  default_lens: string;
}> = {
  tops_shirts: {
    keywords: ['shirt', 't-shirt', 'blouse', 'hoodie', 'sweater', 'jacket', 'blazer', 'polo', 'tank top'],
    label: 'Tops & Outer',
    default_subgenre: 'casual_street',
    default_lens: 'portrait_85mm',
  },
  bottoms_pants: {
    keywords: ['pants', 'jeans', 'trousers', 'skirt', 'shorts', 'leggings', 'cargo'],
    label: 'Bottoms',
    default_subgenre: 'casual_street',
    default_lens: 'wide_angle_24mm',
  },
  footwear_shoes: {
    keywords: ['shoes', 'sneakers', 'heels', 'boots', 'sandals', 'slippers', 'loafers'],
    label: 'Shoes & Sandals',
    default_subgenre: 'casual_street',
    default_lens: 'macro_100mm',
  },
  accessories_jewelry: {
    keywords: ['watch', 'bag', 'necklace', 'ring', 'glasses', 'hat', 'earrings', 'bracelet', 'sunglasses'],
    label: 'Accessories',
    default_subgenre: 'formal_office',
    default_lens: 'macro_100mm',
  },
  full_outfit_dress: {
    keywords: ['dress', 'gown', 'suit', 'jumpsuit', 'robe', 'caftan', 'kimono'],
    label: 'Full Outfit',
    default_subgenre: 'party_glamour',
    default_lens: 'portrait_85mm',
  },
  hijab_modest: {
    keywords: ['hijab', 'scarf', 'veil', 'tudung', 'shawl', 'khimar', 'niqab'],
    label: 'Hijab & Modest Wear',
    default_subgenre: 'traditional_cultural',
    default_lens: 'portrait_85mm',
  },
};

export const FASHION_SUB_GENRES: Record<string, StyleEntry> = {
  casual_street: {
    label: 'Casual & Streetwear',
    prompt_val: 'streetwear fashion, urban vibe, casual look, trendy style, comfortable fit',
  },
  formal_office: {
    label: 'Formal & Office',
    prompt_val: 'business professional attire, office environment, sharp and clean look, formal elegance, corporate style',
  },
  party_glamour: {
    label: 'Party & Glamour',
    prompt_val: 'red carpet look, glamour style, sparkling details, luxury party attire, night event',
  },
  sport_activewear: {
    label: 'Sport & Activewear',
    prompt_val: 'athletic wear, fitness model, dynamic sporty look, sweat glistening, performance gear',
  },
  traditional_cultural: {
    label: 'Traditional & Cultural',
    prompt_val: 'cultural heritage fashion, traditional attire, elegant draping, rich patterns, ceremonial look',
  },
  swimwear_resort: {
    label: 'Swimwear & Resort',
    prompt_val: 'beach resort style, summer vibes, golden sunlight, swimwear photography, exotic location',
  },
};

export const FASHION_CAMERA_SETTINGS = {
  depth_of_field: {
    shallow_dof: {
      label: 'Blur Background (Bokeh)',
      prompt_val: 'shallow depth of field, bokeh background, f/1.8 aperture, subject isolation, sharp focus on product',
    },
    deep_dof: {
      label: 'Sharp All (Landscape)',
      prompt_val: 'deep depth of field, sharp focus throughout, f/11 aperture, environmental context clear',
    },
  },
  lens_simulation: {
    portrait_85mm: {
      label: '85mm Portrait',
      prompt_val: 'shot on 85mm lens, flattering compression, perfect for portrait, natural proportions',
    },
    wide_angle_24mm: {
      label: '24mm Wide',
      prompt_val: 'shot on 24mm wide angle lens, capturing full body and environment, dynamic perspective',
    },
    macro_100mm: {
      label: 'Macro 100mm',
      prompt_val: 'macro photography, extreme detail, texture sharpness, close up focus, fabric threads visible',
    },
  },
  shot_angle: {
    eye_level: { label: 'Eye Level', prompt_val: 'eye level shot, natural perspective' },
    low_angle_hero: { label: 'Low Angle (Heroic)', prompt_val: 'low angle shot, looking up, powerful stance, tall silhouette' },
    high_angle_bird: { label: 'High Angle (Bird Eye)', prompt_val: 'high angle shot, looking down, unique perspective' },
    dutch_angle: { label: 'Dutch Angle', prompt_val: 'tilted frame, dynamic composition, edgy look' },
  },
} as const;

export const FASHION_ENVIRONMENTS: Record<string, StyleEntry> = {
  studio_minimal: {
    label: 'Studio Minimalist',
    prompt_val: 'clean studio background, seamless background paper, professional lighting setup',
  },
  urban_industrial: {
    label: 'Urban Industrial',
    prompt_val: 'concrete wall background, warehouse setting, brick texture, moody city atmosphere',
  },
  nature_outdoors: {
    label: 'Nature Outdoors',
    prompt_val: 'natural outdoor background, park, forest, or beach, soft natural light',
  },
  luxury_interior: {
    label: 'Luxury Interior',
    prompt_val: 'expensive furniture background, hotel lobby, penthouse view, elegant interior design',
  },
  urban_street: {
    label: 'Urban Street',
    prompt_val: 'city street background, neon signs, traffic lights, night city life',
  },
  pastel_dream: {
    label: 'Pastel Dream',
    prompt_val: 'pastel colored background, soft pink or blue, dreamy clouds, surreal atmosphere',
  },
};

export const FASHION_ACCESSORY_EFFECTS: Record<string, StyleEntry> = {
  sparkle_shine: {
    label: 'Sparkle & Shine',
    prompt_val: 'gemstone sparkle, light reflections, jewelry glint, polished metal surface',
  },
  water_droplets: {
    label: 'Fresh Water Drops',
    prompt_val: 'water droplets on product, fresh look, wet surface, hydrating vibe',
  },
  floating_levitation: {
    label: 'Levitation',
    prompt_val: 'product floating in mid air, zero gravity, invisible stand, dynamic view',
  },
  fire_ice: {
    label: 'Fire & Ice',
    prompt_val: 'contrasting elements, fire and ice surrounding product, dramatic effect',
  },
};

export const FASHION_MATERIALS: Record<string, MaterialEntry> = {
  cotton: { label: 'Cotton', prompt_val: 'soft cotton texture, breathable, matte finish' },
  denim: { label: 'Denim', prompt_val: 'classic denim texture, visible weave, rugged' },
  silk: { label: 'Silk', prompt_val: 'shiny silk texture, smooth, luxurious drape' },
  leather: { label: 'Leather', prompt_val: 'genuine leather texture, grain patterns, glossy' },
  wool: { label: 'Wool', prompt_val: 'knitted texture, wool fibers, cozy' },
};

// ── Module 5: FnB Global Engine ──

export const FNB_CATEGORY_DETECTION: Record<string, {
  keywords: string[];
  identified_as: string;
  global_label: string;
  auto_suggestion: {
    style: string;
    angle: string;
    effects: string[];
    reasoning: string;
  };
}> = {
  wet_savory_dishes: {
    keywords: ['soup', 'stew', 'curry', 'broth', 'bowl', 'liquid', 'gravy', 'ramen', 'pho', 'meatball', 'soto', 'gulai'],
    identified_as: 'Soups, Stews & Curries',
    global_label: 'Wet Savory Dishes',
    auto_suggestion: {
      style: 'steamy_cozy',
      angle: 'eye_level_or_close_up',
      effects: ['steam_hot', 'glossy_wet'],
      reasoning: 'Emphasizing the hot broth and glossy texture makes the dish look comforting and savory.',
    },
  },
  dry_carb_main: {
    keywords: ['rice', 'pasta', 'noodle', 'fried rice', 'risotto', 'biriyani', 'spaghetti', 'paella', 'nasi goreng', 'fried noodle'],
    identified_as: 'Rice, Pasta & Noodles',
    global_label: 'Dry Carb Mains',
    auto_suggestion: {
      style: 'appetizing_top_view',
      angle: 'top_view_or_45_degree',
      effects: ['glossy_wet', 'fresh_greens'],
      reasoning: 'Showing the mix of ingredients and sauce coating from an angle highlights the flavor profile.',
    },
  },
  burgers_sandwiches: {
    keywords: ['burger', 'sandwich', 'hotdog', 'bun', 'bread', 'patty', 'kebab', 'subway', 'tacos'],
    identified_as: 'Burgers, Sandwiches & Wraps',
    global_label: 'Handhelds & Sandwiches',
    auto_suggestion: {
      style: 'dark_moody_grill',
      angle: 'close_up_hero',
      effects: ['melting_dripping', 'crispy_texture'],
      reasoning: 'Close-ups with dramatic lighting emphasize the juicy patty and fresh vegetables.',
    },
  },
  pizza_baked_goods: {
    keywords: ['pizza', 'pie', 'pastry', 'baked', 'cheese', 'dough', 'bread', 'croissant', 'flatbread'],
    identified_as: 'Pizza, Pastries & Baked Savory',
    global_label: 'Pizza & Baked Savory',
    auto_suggestion: {
      style: 'rustic_artisan',
      angle: 'close_up_hero',
      effects: ['melting_dripping', 'crispy_texture'],
      reasoning: 'Highlighting the texture of the crust and the melt of the cheese is key.',
    },
  },
  grilled_meats_seafood: {
    keywords: ['steak', 'grill', 'bbq', 'barbecue', 'roast', 'chicken', 'fish', 'shrimp', 'prawn', 'satay', 'skewer'],
    identified_as: 'Grilled Meats & Seafood',
    global_label: 'Grill & Roast',
    auto_suggestion: {
      style: 'dark_moody_grill',
      angle: 'eye_level',
      effects: ['glossy_wet', 'steam_hot'],
      reasoning: 'Side lighting creates shadows that define the meat texture and grill marks.',
    },
  },
  desserts_sweets: {
    keywords: ['cake', 'dessert', 'ice cream', 'chocolate', 'sweet', 'waffle', 'pancake', 'pudding', 'pastry sweet', 'donut'],
    identified_as: 'Desserts & Sweets',
    global_label: 'Desserts',
    auto_suggestion: {
      style: 'bright_lifestyle',
      angle: 'close_up_or_flatlay',
      effects: ['melting_dripping', 'soft_creamy'],
      reasoning: 'Bright, soft lighting makes desserts look delicate and indulgent.',
    },
  },
  cold_beverages: {
    keywords: ['drink', 'beverage', 'juice', 'soda', 'cocktail', 'smoothie', 'milkshake', 'iced', 'coffee cold', 'water'],
    identified_as: 'Cold Beverages',
    global_label: 'Cold Drinks',
    auto_suggestion: {
      style: 'refreshing_splash',
      angle: 'eye_level_or_close_up',
      effects: ['frozen_crystallized', 'splash_explosion'],
      reasoning: 'Condensation and splashes communicate instant freshness and cold temperature.',
    },
  },
  hot_beverages: {
    keywords: ['coffee', 'tea', 'latte', 'cappuccino', 'hot chocolate', 'mug', 'cup', 'steam'],
    identified_as: 'Hot Beverages',
    global_label: 'Hot Drinks',
    auto_suggestion: {
      style: 'cozy_warm',
      angle: 'eye_level_or_top_view',
      effects: ['steam_hot', 'latte_art'],
      reasoning: 'Cozy lighting and steam evoke a warm, relaxing feeling.',
    },
  },
};

export const FNB_STYLE_OPTIONS: Record<string, StyleEntry & { desc: string }> = {
  steamy_cozy: {
    label: 'Steamy & Cozy',
    desc: 'Warm, comfortable — ideal for soups and stews.',
    prompt_val: 'steaming hot, cozy atmosphere, warm tones, comfort food vibe, appetizing',
  },
  dark_moody_grill: {
    label: 'Dark & Moody Grill',
    desc: 'Dramatic, premium — ideal for steak and burgers.',
    prompt_val: 'dark atmospheric background, black table, cinematic side lighting, smoke, grill marks, intense shadows, dramatic food photography',
  },
  bright_lifestyle: {
    label: 'Bright Lifestyle',
    desc: 'Bright, happy — ideal for desserts and drinks.',
    prompt_val: 'bright natural daylight, high key lighting, soft shadows, happy mood, fresh colors',
  },
  refreshing_splash: {
    label: 'Refreshing Splash',
    desc: 'Fresh, dynamic — ideal for cold beverages.',
    prompt_val: 'condensation, ice crystals, water splashes, refreshing feel, freezing cold, dynamic motion',
  },
  rustic_artisan: {
    label: 'Rustic Artisan',
    desc: 'Natural, traditional — ideal for bread and pizza.',
    prompt_val: 'wooden table, flour dust, rustic background, natural textures, artisan look',
  },
  minimalist_commercial: {
    label: 'Minimalist Commercial',
    desc: 'Clean, catalog style.',
    prompt_val: 'clean white background, studio lighting, product photography, sharp focus',
  },
  // Virtual entries for FnB auto_suggestion styles not in style_options
  appetizing_top_view: {
    label: 'Appetizing Top View',
    desc: 'Top-down appetizing presentation.',
    prompt_val: 'top down view, appetizing presentation, colorful ingredients visible, warm tones',
  },
  cozy_warm: {
    label: 'Cozy & Warm',
    desc: 'Warm, relaxing — ideal for hot beverages.',
    prompt_val: 'warm cozy atmosphere, soft warm lighting, wooden table, comfort, relaxing feel',
  },
};

export const FNB_EFFECT_OPTIONS: Record<string, StyleEntry> = {
  steam_hot: { label: 'Hot Steam', prompt_val: 'rising steam, freshly cooked, hot temperature' },
  glossy_wet: { label: 'Glossy/Shiny', prompt_val: 'glistening oil, glossy sauce, shiny surface, wet look' },
  melting_dripping: { label: 'Melting/Dripping', prompt_val: 'melting cheese, dripping sauce, oozing texture' },
  frozen_crystallized: { label: 'Iced/Frozen', prompt_val: 'frosty glass, ice crystals, condensation droplets' },
  splash_explosion: { label: 'Splash/Explosion', prompt_val: 'high speed photography, liquid splash, ingredients flying, dynamic action' },
  fresh_greens: { label: 'Fresh Veggies', prompt_val: 'fresh herbs, green leaves, crisp vegetables, healthy look' },
  // Virtual entries for FnB auto_suggestion effects not in effect_options
  crispy_texture: { label: 'Crispy Texture', prompt_val: 'crispy golden texture, crunchy surface, freshly fried' },
  soft_creamy: { label: 'Soft & Creamy', prompt_val: 'soft creamy texture, smooth surface, delicate, indulgent' },
  latte_art: { label: 'Latte Art', prompt_val: 'beautiful latte art, foam pattern, barista quality' },
};

// ── Module 6: Skincare & Kosmetik ──

export const SKINCARE_PRODUCT_SPECIFICS: Record<string, {
  label: string;
  prompt_hint: string;
}> = {
  serum_face: {
    label: 'Serum Wajah (Botol Kaca/Dropper)',
    prompt_hint: 'glass serum bottle with dropper, skincare product, glowing liquid',
  },
  moisturizer_cream: {
    label: 'Krim Wajah/Tubuh (Jar/Tube)',
    prompt_hint: 'cream jar, moisturizer texture, soft texture, body lotion tube',
  },
  face_mask: {
    label: 'Masker Wajah (Sheet/Clay)',
    prompt_hint: 'sheet mask packaging, clay mask texture, face mask product',
  },
  lipstick_makeup: {
    label: 'Lipstick & Make Up',
    prompt_hint: 'lipstick tube, makeup palette, cosmetic product, vibrant color',
  },
  soap_cleanser: {
    label: 'Sabun & Pembersih',
    prompt_hint: 'bar soap, foam cleanser bottle, hand soap, bubbly texture',
  },
};

export const SKINCARE_STYLE_THEMES: Record<string, StyleEntry & { desc: string }> = {
  natural_organic: {
    label: 'Natural & Organic',
    desc: 'Natural, green, herbal look.',
    prompt_val: 'surrounded by green leaves, aloe vera texture, wood background, natural sunlight, herbal concept, fresh ingredients, eco friendly vibe',
  },
  luxury_elegant: {
    label: 'Luxury & Elegant',
    desc: 'Premium, marble, gold accents.',
    prompt_val: 'placed on white marble surface, gold accents, soft satin cloth, elegant shadows, premium beauty product, cinematic lighting, high class',
  },
  soft_feminine: {
    label: 'Soft & Feminine',
    desc: 'Soft, pastel, flower petals.',
    prompt_val: 'soft pastel pink or lavender background, flower petals, silky texture, dreamy atmosphere, beauty magazine style, romantic mood',
  },
  clinical_clean: {
    label: 'Clinical & Dermatologist',
    desc: 'Medical, sterile, trustworthy.',
    prompt_val: 'clean white laboratory background, medical aesthetic, minimalist, professional lighting, clinical look, trusted brand, sterile',
  },
  minimalist_studio: {
    label: 'Minimalist Studio',
    desc: 'Clean background for catalog.',
    prompt_val: 'solid white background, soft shadows, professional studio photography, product shot, sharp focus, no distraction',
  },
};

export const SKINCARE_TEXTURE_EFFECTS: Record<string, StyleEntry> = {
  none: { label: 'Normal', prompt_val: 'clean surface' },
  water_droplets: { label: 'Water Drops (Dewy)', prompt_val: 'water droplets on bottle, condensation, wet surface, fresh look, hydrating concept' },
  cream_texture: { label: 'Cream Texture', prompt_val: 'visible cream texture, soft scoop, smooth surface, product consistency, close up texture' },
  flower_decor: { label: 'Flower Decoration', prompt_val: 'decorated with fresh flowers, rose petals, lavender, botanical arrangement' },
  splash_liquid: { label: 'Liquid Splash', prompt_val: 'dynamic water splash, liquid explosion, wet look, fresh burst' },
};

export const SKINCARE_LIGHTING: Record<string, StyleEntry> = {
  bright_airry: { label: 'Bright & Airy', prompt_val: 'bright natural daylight, high key lighting, soft shadows, airy atmosphere' },
  golden_hour: { label: 'Golden Hour', prompt_val: 'warm sunlight, golden glow, sunset vibes, cozy feeling' },
  studio_softbox: { label: 'Studio Softbox', prompt_val: 'professional studio lighting, soft box light, balanced exposure, clear detail' },
  moody_dramatic: { label: 'Dramatic & Dark', prompt_val: 'dark background, spotlight effect, low key lighting, elegant and mysterious' },
};

export const SKINCARE_QUALITY_TAGS = [
  '8k resolution',
  'photorealistic',
  'ultra detailed',
  'skin care photography',
  'commercial ad',
  'unreal engine 5',
  'macro lens',
  'sharp focus',
] as const;

// ── Unified keyword detection registry ──
// Merges all detection modules into a single lookup for resolveImagePrompt().

interface DetectedCategory {
  module: string;        // Which engine module matched
  category_key: string;  // Key within that module
  label: string;
  default_style_key: string;
  default_style_prompt: string;
  focus_prompt: string;
  effects: string[];
}

// Build a flat keyword index at module load time for O(1)-ish lookups.
const KEYWORD_INDEX: Array<{
  keyword: string;
  module: string;
  category_key: string;
  label: string;
  default_style_key: string;
  focus: string;
  effects: string[];
}> = [];

// Module 1: Additional Categories
for (const [key, det] of Object.entries(ADDITIONAL_CATEGORIES_DETECTION)) {
  for (const kw of det.keywords) {
    KEYWORD_INDEX.push({
      keyword: kw.toLowerCase(),
      module: 'additional_categories',
      category_key: key,
      label: det.label,
      default_style_key: det.default_style,
      focus: det.focus,
      effects: [],
    });
  }
}

// Module 2: Home Decor
for (const [key, det] of Object.entries(HOME_DECOR_DETECTION)) {
  for (const kw of det.keywords) {
    KEYWORD_INDEX.push({
      keyword: kw.toLowerCase(),
      module: 'home_decor',
      category_key: key,
      label: det.label,
      default_style_key: det.default_subgenre,
      focus: det.focus_point,
      effects: [],
    });
  }
}

// Module 4: Fashion
for (const [key, det] of Object.entries(FASHION_DETECTION)) {
  for (const kw of det.keywords) {
    KEYWORD_INDEX.push({
      keyword: kw.toLowerCase(),
      module: 'fashion',
      category_key: key,
      label: det.label,
      default_style_key: det.default_subgenre,
      focus: '',
      effects: [],
    });
  }
}

// Module 5: FnB
for (const [key, det] of Object.entries(FNB_CATEGORY_DETECTION)) {
  for (const kw of det.keywords) {
    KEYWORD_INDEX.push({
      keyword: kw.toLowerCase(),
      module: 'fnb',
      category_key: key,
      label: det.global_label,
      default_style_key: det.auto_suggestion.style,
      focus: '',
      effects: det.auto_suggestion.effects,
    });
  }
}

// Module 6: Skincare (keyword-based from product_specifics labels + common terms)
const SKINCARE_KEYWORDS: Record<string, string[]> = {
  serum_face: ['serum', 'dropper', 'face serum', 'essence'],
  moisturizer_cream: ['moisturizer', 'cream', 'lotion', 'body cream', 'face cream'],
  face_mask: ['face mask', 'sheet mask', 'clay mask', 'peel off'],
  lipstick_makeup: ['lipstick', 'makeup', 'foundation', 'mascara', 'eyeshadow', 'blush', 'cosmetic'],
  soap_cleanser: ['soap', 'cleanser', 'face wash', 'hand soap', 'body wash'],
};

for (const [key, keywords] of Object.entries(SKINCARE_KEYWORDS)) {
  for (const kw of keywords) {
    KEYWORD_INDEX.push({
      keyword: kw.toLowerCase(),
      module: 'skincare',
      category_key: key,
      label: 'Skincare & Cosmetic',
      default_style_key: 'luxury_elegant',
      focus: SKINCARE_PRODUCT_SPECIFICS[key]?.prompt_hint || '',
      effects: ['water_droplets'],
    });
  }
}

// ── Style lookup helpers ──

function lookupStylePrompt(module: string, styleKey: string): string {
  switch (module) {
    case 'additional_categories':
      return ADDITIONAL_CATEGORY_STYLES[styleKey]?.prompt_val || '';
    case 'home_decor':
      return INTERIOR_STYLES[styleKey]?.prompt_val || '';
    case 'fashion':
      return FASHION_SUB_GENRES[styleKey]?.prompt_val || '';
    case 'fnb':
      return FNB_STYLE_OPTIONS[styleKey]?.prompt_val || '';
    case 'skincare':
      return SKINCARE_STYLE_THEMES[styleKey]?.prompt_val || '';
    default:
      return '';
  }
}

function lookupEffectPrompts(module: string, effectKeys: string[]): string[] {
  const results: string[] = [];
  for (const ek of effectKeys) {
    let val: string | undefined;
    switch (module) {
      case 'fnb':
        val = FNB_EFFECT_OPTIONS[ek]?.prompt_val;
        break;
      case 'skincare':
        val = SKINCARE_TEXTURE_EFFECTS[ek]?.prompt_val;
        break;
      default:
        // Try fashion accessory effects or additional materials as a general fallback
        val = FASHION_ACCESSORY_EFFECTS[ek]?.prompt_val
          || ADDITIONAL_MATERIALS[ek]?.prompt_val;
        break;
    }
    if (val) results.push(val);
  }
  return results;
}

// ── Default / fallback config ──

const DEFAULT_DETECTION: DetectedCategory = {
  module: 'additional_categories',
  category_key: 'generic_product',
  label: 'Product',
  default_style_key: 'clinical_clean',
  default_style_prompt: ADDITIONAL_CATEGORY_STYLES.clinical_clean.prompt_val,
  focus_prompt: 'product photography, hero placement, clean staging',
  effects: [],
};

// ── Niche-to-module mapping ──
// Maps the bot's existing niche IDs to a sensible module + default style.

const NICHE_TO_IMAGE_MODULE: Record<string, { module: string; default_style_key: string; label: string }> = {
  food_culinary: { module: 'fnb', default_style_key: 'steamy_cozy', label: 'Food & Beverage' },
  fnb: { module: 'fnb', default_style_key: 'steamy_cozy', label: 'Food & Beverage' },
  fashion_lifestyle: { module: 'fashion', default_style_key: 'casual_street', label: 'Fashion' },
  fashion: { module: 'fashion', default_style_key: 'casual_street', label: 'Fashion' },
  tech_gadgets: { module: 'additional_categories', default_style_key: 'glossy_showroom', label: 'Electronics' },
  tech: { module: 'additional_categories', default_style_key: 'glossy_showroom', label: 'Electronics' },
  beauty_skincare: { module: 'skincare', default_style_key: 'luxury_elegant', label: 'Skincare & Cosmetic' },
  skincare: { module: 'skincare', default_style_key: 'luxury_elegant', label: 'Skincare & Cosmetic' },
  travel_adventure: { module: 'home_decor', default_style_key: 'luxury_hotel_suite', label: 'Travel & Lifestyle' },
  travel: { module: 'home_decor', default_style_key: 'luxury_hotel_suite', label: 'Travel & Lifestyle' },
  fitness_health: { module: 'additional_categories', default_style_key: 'action_lifestyle', label: 'Health & Fitness' },
  health: { module: 'additional_categories', default_style_key: 'action_lifestyle', label: 'Health & Fitness' },
  home_decor: { module: 'home_decor', default_style_key: 'scandinavian_hygge', label: 'Home & Decor' },
  business_finance: { module: 'additional_categories', default_style_key: 'clinical_clean', label: 'Business & Finance' },
  finance: { module: 'additional_categories', default_style_key: 'clinical_clean', label: 'Business & Finance' },
  education_knowledge: { module: 'additional_categories', default_style_key: 'clinical_clean', label: 'Education' },
  education: { module: 'additional_categories', default_style_key: 'clinical_clean', label: 'Education' },
  entertainment: { module: 'additional_categories', default_style_key: 'playful_colorful', label: 'Entertainment' },
};

// ── Resolver Function ──

/**
 * Resolve a complete image prompt from a user description and optional
 * pre-detected category.
 *
 * 1. Auto-detects the product category from keywords in user description
 * 2. Looks up the matching module and its auto_suggestion/defaults
 * 3. Combines style + effects + environment + camera + material prompt_vals
 * 4. Returns structured result
 */
export function resolveImagePrompt(
  userDescription: string,
  detectedCategory?: string,
): ImagePromptResult {
  const descLower = userDescription.toLowerCase();

  // Step 1: Try keyword detection from user description
  let detected: DetectedCategory | null = null;

  // Sort by keyword length descending so multi-word keywords match first
  const sortedIndex = [...KEYWORD_INDEX].sort((a, b) => b.keyword.length - a.keyword.length);

  for (const entry of sortedIndex) {
    if (descLower.includes(entry.keyword)) {
      const stylePrompt = lookupStylePrompt(entry.module, entry.default_style_key);
      detected = {
        module: entry.module,
        category_key: entry.category_key,
        label: entry.label,
        default_style_key: entry.default_style_key,
        default_style_prompt: stylePrompt,
        focus_prompt: entry.focus,
        effects: entry.effects,
      };
      break;
    }
  }

  // Step 2: If no keyword hit, try niche-based fallback
  if (!detected && detectedCategory) {
    const nicheMapping = NICHE_TO_IMAGE_MODULE[detectedCategory];
    if (nicheMapping) {
      const stylePrompt = lookupStylePrompt(nicheMapping.module, nicheMapping.default_style_key);
      detected = {
        module: nicheMapping.module,
        category_key: detectedCategory,
        label: nicheMapping.label,
        default_style_key: nicheMapping.default_style_key,
        default_style_prompt: stylePrompt,
        focus_prompt: '',
        effects: [],
      };
    }
  }

  // Step 3: Use default if nothing matched
  if (!detected) {
    detected = { ...DEFAULT_DETECTION };
  }

  // Step 4: Compose the full prompt
  const segments: string[] = [];

  // User description first (highest priority subject matter)
  segments.push(userDescription.trim());

  // Focus/product hint
  if (detected.focus_prompt) {
    segments.push(detected.focus_prompt);
  }

  // Style
  if (detected.default_style_prompt) {
    segments.push(detected.default_style_prompt);
  }

  // Effects
  const effectPrompts = lookupEffectPrompts(detected.module, detected.effects);
  if (effectPrompts.length > 0) {
    segments.push(effectPrompts.join(', '));
  }

  // Quality baseline
  segments.push('photorealistic, 8K resolution, ultra detailed, commercial ad quality, sharp focus');

  return {
    full: segments.join(', '),
    style: detected.default_style_key,
    effects: detected.effects,
    category: detected.label,
  };
}
