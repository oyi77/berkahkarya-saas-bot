/**
 * Prompt Engine — Production-grade prompt generation for hyper-realistic,
 * ads-ready, content-post-ready image & video generation.
 *
 * Adapted from Content Kingdom quality standards and Flosia scene prompt system.
 * Each prompt has 6 layers: Subject, Environment, Lighting, Camera, Style, Negative
 *
 * V3 Integration: enrichForVideo() and enrichForImage() now delegate to the
 * Video Engine V3 and Image Engine configs for industry-specific prompt
 * composition, while preserving the original 6-layer structure as an overlay.
 */

import { resolveVideoPrompt } from "./video-engine-v3.js";
import { resolveImagePrompt } from "./image-engine.js";

// ── Types ──

export interface PromptLayer {
  subject: string;
  environment: string;
  lighting: string;
  camera: string;
  style: string;
  negative: string;
}

export interface EnrichedPrompt {
  full: string; // Complete prompt for generation
  negative: string; // Negative prompt (for providers that support it)
  provider_hint: string; // Short version for token-limited providers
}

// ── Photography Specs Database ──
// Inspired by Flosia deterjen scene prompts — professional-grade direction

const CAMERA_PRESETS = {
  product_hero:
    "shot on Canon EOS R5, 85mm lens, f/2.8, ISO 200, sharp focus on product, shallow depth of field",
  product_detail:
    "shot on Canon EOS R5, 100mm macro lens, f/5.6, ISO 400, extreme detail, tack sharp",
  lifestyle:
    "shot on Sony A7IV, 50mm lens, f/2.0, ISO 400, natural perspective, bokeh background",
  food_overhead:
    "shot on Canon EOS R5, 35mm lens, f/4.0, ISO 320, top-down flat lay, even sharpness",
  food_closeup:
    "shot on Sony A7IV, 85mm lens, f/1.8, ISO 250, selective focus on hero element, steam visible",
  architecture:
    "shot on Sony A7RIV, 16-35mm f/2.8, ISO 100, wide angle, leading lines, deep depth of field",
  automotive:
    "shot on Canon EOS R5, 70-200mm f/2.8, ISO 200, dramatic angle, reflections visible",
  portrait:
    "shot on Sony A7IV, 85mm f/1.4, ISO 320, eye-level, catchlights in eyes, skin detail preserved",
} as const;

const LIGHTING_PRESETS = {
  studio_product:
    "professional studio lighting, large softbox camera-left, fill light camera-right, rim light for edge separation, even illumination, no harsh shadows",
  natural_warm:
    "golden hour natural light, soft warm tones, gentle shadows, color temperature 5500K, ambient fill",
  food_appetizing:
    "warm directional light from side, highlighting steam and texture, color temperature 3500K warm, soft shadows to create depth, backlight for translucency",
  real_estate:
    "bright natural daylight, wide-angle lighting, HDR-balanced exposure, all areas visible, window light dominant",
  automotive_dramatic:
    "dramatic studio lighting, sharp edge lights, dark moody backdrop, specular highlights on paint, controlled reflections",
  commercial_clean:
    "even diffused lighting, minimal shadows, bright key light, white background illumination, commercial polish",
  lifestyle_natural:
    "soft natural window light, slight warm cast, gentle shadows, authentic feel, not over-lit",
} as const;

const STYLE_SIGNATURES = {
  hyperreal_commercial:
    "photorealistic, 8K resolution, commercial-grade quality, magazine-worthy composition, professional color grading, Kodak Portra 400 emulation",
  ads_ready:
    "advertising photography, product clearly visible, hero placement, clean composition, aspirational mood, brand-safe, no text overlays",
  content_post:
    "social media optimized, scroll-stopping composition, vibrant but natural colors, Instagram aesthetic, engagement-optimized framing",
  premium_product:
    "luxury product photography, meticulous detail, premium feel, sophisticated color palette, high-end retouching, gallery-worthy",
  food_commercial:
    "food styling photography, appetizing color science, steam and freshness emphasized, restaurant-quality plating, warm inviting mood",
  architectural_luxury:
    "architectural photography, spacious feel, luxury finish visible, bright airy atmosphere, aspirational lifestyle",
} as const;

const NEGATIVE_PROMPTS = {
  universal:
    "blurry, low quality, distorted, deformed, ugly, duplicate, watermark, text overlay, logo, signature, cropped, out of frame, worst quality, low resolution, jpeg artifacts, noise, grain",
  product:
    "cartoon, anime, illustration, painting, 3d render, artificial looking, floating objects, unrealistic shadows, hands holding incorrectly, wrong proportions",
  food: "artificial looking food, plastic food, inedible appearance, unappetizing, cold food when should be hot, no steam, dull colors, fast food aesthetic",
  realestate:
    "cluttered, messy, small cramped space, poor lighting, distorted walls, fisheye distortion, unrealistic furniture scale, empty lifeless rooms",
  car: "toy car, miniature, cartoon car, damaged vehicle, dirty vehicle, unrealistic reflections, floating car, wrong proportions, cheap appearance",
  person:
    "extra fingers, extra limbs, deformed face, asymmetric eyes, uncanny valley, plastic skin, mannequin-like, zombie appearance",
} as const;

// ── Category-Specific Enrichment Templates ──
// These transform a simple user description into a professional-grade prompt

interface CategoryTemplate {
  subjectEnricher: (desc: string) => string;
  environmentDefault: string;
  lightingPreset: keyof typeof LIGHTING_PRESETS;
  cameraPreset: keyof typeof CAMERA_PRESETS;
  styleSignature: keyof typeof STYLE_SIGNATURES;
  negativePreset: keyof typeof NEGATIVE_PROMPTS;
  qualityBoost: string;
}

const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  product: {
    subjectEnricher: (desc) =>
      `${desc}, positioned as hero subject, product clearly visible from optimal angle, every detail sharp and defined, clean professional staging`,
    environmentDefault:
      "clean minimal studio environment, subtle gradient background, reflective surface for premium feel, no distracting elements",
    lightingPreset: "studio_product",
    cameraPreset: "product_hero",
    styleSignature: "premium_product",
    negativePreset: "product",
    qualityBoost:
      "advertising campaign quality, e-commerce hero shot, ready for product listing and social media ads",
  },
  fnb: {
    subjectEnricher: (desc) =>
      `${desc}, food styled to perfection, steam rising naturally, fresh ingredients visible, appetizing colors enhanced, textures sharp and inviting`,
    environmentDefault:
      "warm restaurant or kitchen setting, wooden surface or marble countertop, subtle props (herbs, spices, utensils) for context, depth visible in background",
    lightingPreset: "food_appetizing",
    cameraPreset: "food_closeup",
    styleSignature: "food_commercial",
    negativePreset: "food",
    qualityBoost:
      "food magazine cover quality, appetizing enough to taste, ready for restaurant menu and food delivery app",
  },
  realestate: {
    subjectEnricher: (desc) =>
      `${desc}, spacious and inviting composition, luxury finishes visible, well-maintained and staged, aspirational living space`,
    environmentDefault:
      "bright modern interior or stunning exterior, lush landscaping or contemporary furnishings, high ceilings and open floor plan feel",
    lightingPreset: "real_estate",
    cameraPreset: "architecture",
    styleSignature: "architectural_luxury",
    negativePreset: "realestate",
    qualityBoost:
      "real estate listing hero photo quality, MLS-ready, property portal optimized, makes viewer want to schedule a viewing",
  },
  car: {
    subjectEnricher: (desc) =>
      `${desc}, vehicle positioned at dramatic three-quarter angle, paint reflections visible, wheels turned slightly for dynamic pose, showroom condition`,
    environmentDefault:
      "dramatic environment complementing the vehicle, either clean studio with dark backdrop or scenic outdoor location, reflective floor surface",
    lightingPreset: "automotive_dramatic",
    cameraPreset: "automotive",
    styleSignature: "hyperreal_commercial",
    negativePreset: "car",
    qualityBoost:
      "automotive magazine cover quality, dealership-ready hero shot, ready for car listing and social media showcase",
  },
};

// ── Main Prompt Engine ──

export class PromptEngine {
  /**
   * Transform a simple user description into a production-grade prompt
   * with 6 layers of professional specification.
   */
  static enrichForImage(
    userDescription: string,
    category: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: {
      aspectRatio?: string;
      styleOverride?: string;
      includeNegative?: boolean;
    },
  ): EnrichedPrompt {
    const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.product;

    // ── V3 Image Engine enrichment ──
    // Delegate to the Image Engine for industry-specific style, effects, and
    // auto-detected category prompt composition.
    const engineResult = resolveImagePrompt(userDescription, category);

    // Layer 1: Subject enrichment (original 6-layer)
    const subject = template.subjectEnricher(userDescription);

    // Layer 2: Environment
    const environment = template.environmentDefault;

    // Layer 3: Lighting
    const lighting = LIGHTING_PRESETS[template.lightingPreset];

    // Layer 4: Camera specs
    const camera = CAMERA_PRESETS[template.cameraPreset];

    // Layer 5: Style signature (merge engine style into existing signature)
    const style = STYLE_SIGNATURES[template.styleSignature];

    // Layer 6: Quality boost
    const quality = template.qualityBoost;

    // Compose full prompt — combine 6-layer base with Image Engine enrichment
    const full = [
      subject,
      environment,
      lighting,
      camera,
      style,
      quality,
      engineResult.full,
    ].join(". ");

    // Compose negative prompt
    const negative = [
      NEGATIVE_PROMPTS.universal,
      NEGATIVE_PROMPTS[template.negativePreset],
    ].join(", ");

    // Short version for token-limited providers (include engine category hint)
    const provider_hint = [
      subject,
      `${STYLE_SIGNATURES[template.styleSignature]}, ${template.qualityBoost}`,
      `[${engineResult.category}] ${engineResult.style}`,
    ].join(". ");

    return { full, negative, provider_hint };
  }

  /**
   * Transform a user description into a video-optimized prompt
   * with motion and timing direction.
   */
  static enrichForVideo(
    userDescription: string,
    niche: string,
    style: string,
    duration: number,
    sceneNumber?: number,
    totalScenes?: number,
    hasReferenceImage?: boolean,
  ): EnrichedPrompt {
    const sceneLabel =
      sceneNumber && totalScenes
        ? `[Scene ${sceneNumber}/${totalScenes}] `
        : "";

    // ── V3 Video Engine enrichment ──
    // Delegate to Video Engine V3 for industry-specific motion, camera, speed,
    // and mood composition. The niche is mapped to V3 categories internally.
    const engineResult = resolveVideoPrompt(niche, undefined, userDescription);

    // Legacy motion directions kept as a secondary layer for backwards compat.
    const motionDirections: Record<string, string> = {
      fnb: "slow dolly-in revealing texture and steam, gentle camera movement, smooth stabilized footage",
      fashion:
        "smooth tracking shot, model movement with confidence, elegant slow-motion details",
      tech: "slow orbit around product, clean precise camera movement, reveal of key features",
      health: "dynamic follow-cam, energetic movement, motivational pacing",
      travel:
        "epic establishing shot with slow reveal, cinematic drone-like movement, golden hour magic",
      education:
        "steady focus shot, clean minimal movement, professional presentation",
      finance:
        "subtle push-in for emphasis, professional steady cam, trust-building visual pace",
      entertainment:
        "dynamic quick cuts, playful camera angles, high energy movement",
    };

    const legacyMotion = motionDirections[niche] || motionDirections.tech;

    // ── Reference image identity lock ──
    const refImagePositive = hasReferenceImage
      ? ", same exact subject as reference image, consistent visual identity, no variation in key features, locked character/product identity, reference image is the identity anchor, image reference strength: 0.85, motion: low-to-medium for identity preservation"
      : "";

    const refImageNegative = hasReferenceImage
      ? ", different subject, identity change, face distortion, inconsistent character, new person, altered product appearance"
      : "";

    // Compose full prompt — V3 engine output first, then legacy layers
    const full =
      [
        `${sceneLabel}${duration}s ${style} video`,
        engineResult.full,
        legacyMotion,
        "smooth 60fps",
        `cinematic color grading, engaging content ready for TikTok and Instagram Reels`,
        STYLE_SIGNATURES.ads_ready,
      ].join(", ") + refImagePositive;

    const negative =
      NEGATIVE_PROMPTS.universal +
      ", static image, slideshow, no movement, choppy, amateur" +
      refImageNegative;

    const refHintSuffix = hasReferenceImage
      ? ", CRITICAL: maintain exact visual identity from reference image, same subject/character/product, no identity drift, reference strength 0.85, locked identity anchor"
      : "";
    const provider_hint = `${sceneLabel}${userDescription}, ${style}, ${duration}s, cinematic 4K, mood: ${engineResult.mood}${refHintSuffix}`;

    return { full, negative, provider_hint };
  }

  /**
   * Get negative prompt for a category (for providers that support it)
   */
  static getNegativePrompt(category: string): string {
    const catNeg =
      NEGATIVE_PROMPTS[category as keyof typeof NEGATIVE_PROMPTS] || "";
    return `${NEGATIVE_PROMPTS.universal}${catNeg ? ", " + catNeg : ""}`;
  }
}
