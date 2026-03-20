/**
 * Image Generation Service — Multi-Provider Fallback Chain
 *
 * Uses the same providers as video generation where they support image models:
 *   1. GeminiGen (primary — nano-banana-pro)
 *   2. Fal.ai (flux/dev — shared key with video)
 *   3. SiliconFlow (SDXL/Flux — shared key with video)
 *   4. NVIDIA (SDXL — shared key with video)
 *   5. GeminiGen via Gemini API (Imagen)
 *   → Demo fallback (category-matched placeholders)
 */

import { logger } from '@/utils/logger';
import { CircuitBreaker } from './circuit-breaker.service';
import { PromptEngine } from '@/config/prompt-engine';
import { AIPromptOptimizer } from './ai-prompt-optimizer.service';
import axios from 'axios';
import FormData from 'form-data';

// ── Provider API keys (shared with video providers where applicable) ──
const GEMINIGEN_API_KEY = process.env.GEMINIGEN_API_KEY || '';
const GEMINIGEN_API_BASE = 'https://api.geminigen.ai/uapi/v1';

const FALAI_API_KEY = process.env.FALAI_API_KEY || '';
const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || '';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const DEMO_MODE = process.env.DEMO_MODE === 'true';

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  provider?: string;
}

export interface ImageGenerationParams {
  prompt: string;
  style?: string;
  aspectRatio?: string;
  category: string;
}

// Category-specific demo images — last-resort fallback
const DEMO_IMAGES: Record<string, string[]> = {
  product: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1024',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1024',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1024',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1024',
  ],
  fnb: [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1024',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1024',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1024',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1024',
  ],
  realestate: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1024',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1024',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1024',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1024',
  ],
  car: [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1024',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1024',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1024',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1024',
  ],
};

// ── Provider implementations ──

type ProviderFn = (prompt: string, params: ImageGenerationParams) => Promise<ImageGenerationResult>;

interface ImageProvider {
  key: string;
  name: string;
  enabled: boolean;
  generate: ProviderFn;
}

/** Tier 1: GeminiGen — nano-banana-pro */
async function generateViaGeminiGen(prompt: string, params: ImageGenerationParams): Promise<ImageGenerationResult> {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('model', 'nano-banana-pro');
  formData.append('style', 'Photorealistic');
  formData.append('output_format', 'jpeg');
  formData.append('resolution', '1K');
  formData.append('aspect_ratio', mapAspectRatio(params.aspectRatio));

  const response = await axios.post(`${GEMINIGEN_API_BASE}/generate_image`, formData, {
    headers: { 'x-api-key': GEMINIGEN_API_KEY, ...formData.getHeaders() },
    timeout: 60000,
  });

  const { uuid, status } = response.data;
  if (status === 2 || status === 1) {
    for (let i = 0; i < 30; i++) {
      const poll = await axios.get(`${GEMINIGEN_API_BASE}/history/${uuid}`, {
        headers: { 'x-api-key': GEMINIGEN_API_KEY },
        timeout: 10000,
      });
      const { status: s, generated_image, thumbnail_url } = poll.data;
      if (s === 2 && generated_image?.length > 0) {
        return {
          success: true,
          imageUrl: generated_image[0].image_url || '',
          thumbnailUrl: thumbnail_url || generated_image[0].thumbnails?.[0]?.url || '',
          provider: 'geminigen',
        };
      }
      if (s === 3) throw new Error('GeminiGen: generation failed');
      await new Promise(r => setTimeout(r, 3000));
    }
    throw new Error('GeminiGen: poll timeout');
  }
  throw new Error(`GeminiGen: unexpected status ${status}`);
}

/** Tier 2: Fal.ai — flux/dev (same FALAI_API_KEY as video) */
async function generateViaFalai(prompt: string, params: ImageGenerationParams): Promise<ImageGenerationResult> {
  const response = await axios.post(
    'https://fal.run/fal-ai/flux/dev',
    {
      prompt,
      image_size: params.aspectRatio === '16:9' ? 'landscape_16_9'
        : params.aspectRatio === '9:16' ? 'portrait_16_9'
        : 'square_hd',
      num_images: 1,
    },
    {
      headers: { Authorization: `Key ${FALAI_API_KEY}`, 'Content-Type': 'application/json' },
      timeout: 60000,
    }
  );

  const images = response.data?.images;
  if (images?.length > 0 && images[0].url) {
    return { success: true, imageUrl: images[0].url, provider: 'falai' };
  }
  throw new Error('Fal.ai: no images returned');
}

/** Tier 3: SiliconFlow — Flux/SDXL (same SILICONFLOW_API_KEY as video) */
async function generateViaSiliconFlow(prompt: string, params: ImageGenerationParams): Promise<ImageGenerationResult> {
  const response = await axios.post(
    'https://api.siliconflow.cn/v1/images/generations',
    {
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt,
      image_size: params.aspectRatio === '16:9' ? '1024x576'
        : params.aspectRatio === '9:16' ? '576x1024'
        : '1024x1024',
      num_inference_steps: 20,
    },
    {
      headers: { Authorization: `Bearer ${SILICONFLOW_API_KEY}`, 'Content-Type': 'application/json' },
      timeout: 60000,
    }
  );

  const images = response.data?.images || response.data?.data;
  if (images?.length > 0) {
    const url = images[0].url || images[0].b64_json;
    if (url) {
      const imageUrl = url.startsWith('data:') || url.startsWith('http') ? url : `data:image/png;base64,${url}`;
      return { success: true, imageUrl, provider: 'siliconflow' };
    }
  }
  throw new Error('SiliconFlow: no images returned');
}

/** Tier 4: NVIDIA — SDXL (same NVIDIA_API_KEY as workspace) */
async function generateViaNvidia(prompt: string, params: ImageGenerationParams): Promise<ImageGenerationResult> {
  const response = await axios.post(
    'https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl',
    {
      text_prompts: [{ text: prompt, weight: 1 }],
      cfg_scale: 7,
      height: params.aspectRatio === '16:9' ? 576 : params.aspectRatio === '9:16' ? 1024 : 1024,
      width: params.aspectRatio === '16:9' ? 1024 : params.aspectRatio === '9:16' ? 576 : 1024,
      samples: 1,
      steps: 30,
    },
    {
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    }
  );

  const artifacts = response.data?.artifacts;
  if (artifacts?.length > 0 && artifacts[0].base64) {
    return { success: true, imageUrl: `data:image/png;base64,${artifacts[0].base64}`, provider: 'nvidia' };
  }
  throw new Error('NVIDIA: no artifacts returned');
}

/** Tier 5: Google Gemini — Imagen (via Gemini API) */
async function generateViaGemini(prompt: string, _params: ImageGenerationParams): Promise<ImageGenerationResult> {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      contents: [{
        parts: [{ text: `Generate a high-quality image: ${prompt}` }],
      }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
  );

  const parts = response.data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return {
        success: true,
        imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        provider: 'gemini',
      };
    }
  }
  throw new Error('Gemini: no image in response');
}

// ── Provider chain (priority order) ──

function getProviders(): ImageProvider[] {
  return [
    { key: 'geminigen', name: 'GeminiGen', enabled: !!GEMINIGEN_API_KEY, generate: generateViaGeminiGen },
    { key: 'falai', name: 'Fal.ai Flux', enabled: !!FALAI_API_KEY, generate: generateViaFalai },
    { key: 'siliconflow', name: 'SiliconFlow Flux', enabled: !!SILICONFLOW_API_KEY, generate: generateViaSiliconFlow },
    { key: 'nvidia', name: 'NVIDIA SDXL', enabled: !!NVIDIA_API_KEY, generate: generateViaNvidia },
    { key: 'gemini', name: 'Google Gemini', enabled: !!GEMINI_API_KEY, generate: generateViaGemini },
  ];
}

// ── Main service ──

export class ImageGenerationService {
  static async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    if (DEMO_MODE) {
      logger.warn('🖼️ DEMO_MODE forced — returning placeholder');
      return this.generateDemoImage(params);
    }

    const enrichedBase = PromptEngine.enrichForImage(params.prompt, params.category, {
      aspectRatio: params.aspectRatio,
    });

    // AI-optimise the enriched prompt (LLM rotation with fallback)
    const optimizedFull = await AIPromptOptimizer.optimize(enrichedBase.full, {
      niche: params.category,
      style: params.style || 'commercial',
      category: params.category,
    }).catch(() => enrichedBase.full);

    const enriched = {
      ...enrichedBase,
      full: optimizedFull || enrichedBase.full,
    };

    logger.info(`🖼️ Enriched prompt (${enriched.full.length} chars): ${enriched.full.slice(0, 100)}...`);

    const providers = getProviders();
    const enabledProviders = providers.filter(p => p.enabled);

    if (enabledProviders.length === 0) {
      logger.warn('🖼️ No image providers configured — returning demo image');
      return this.generateDemoImage(params);
    }

    logger.info(`🖼️ ${enabledProviders.length} providers available: ${enabledProviders.map(p => p.name).join(', ')}`);

    // Try each provider in priority order with circuit breaker
    for (const provider of enabledProviders) {
      const canExecute = await CircuitBreaker.canExecute(provider.key).catch(() => true);
      if (!canExecute) {
        logger.info(`🖼️ Circuit breaker OPEN for ${provider.name} — skipping`);
        continue;
      }

      try {
        logger.info(`🖼️ Trying ${provider.name}...`);
        // Use full prompt for capable providers, hint for token-limited
        const promptForProvider = ['geminigen', 'falai', 'siliconflow'].includes(provider.key)
          ? enriched.full
          : enriched.provider_hint;
        const result = await provider.generate(promptForProvider, params);

        if (result.success) {
          await CircuitBreaker.recordSuccess(provider.key).catch(() => {});
          logger.info(`🖼️ ${provider.name} succeeded`);
          return result;
        }
      } catch (error: any) {
        await CircuitBreaker.recordFailure(provider.key).catch(() => {});
        logger.warn(`🖼️ ${provider.name} failed: ${error.message}`);
      }
    }

    logger.error(`🖼️ All ${enabledProviders.length} providers failed — demo fallback`);
    return this.generateDemoImage(params);
  }

  private static generateDemoImage(params: ImageGenerationParams): ImageGenerationResult {
    const categoryImages = DEMO_IMAGES[params.category] || DEMO_IMAGES.product;
    const demoImage = categoryImages[Math.floor(Math.random() * categoryImages.length)];

    return {
      success: true,
      imageUrl: demoImage,
      thumbnailUrl: demoImage.replace('w=1024', 'w=256'),
      provider: 'demo',
    };
  }

  // buildPrompt replaced by PromptEngine.enrichForImage() — see config/prompt-engine.ts

  static async generateProductImage(description: string): Promise<ImageGenerationResult> {
    return this.generateImage({ prompt: description, category: 'product', aspectRatio: '1:1', style: 'commercial' });
  }

  static async generateFoodImage(description: string): Promise<ImageGenerationResult> {
    return this.generateImage({ prompt: description, category: 'fnb', aspectRatio: '4:5', style: 'food photography' });
  }

  static async generateRealEstateImage(description: string): Promise<ImageGenerationResult> {
    return this.generateImage({ prompt: description, category: 'realestate', aspectRatio: '16:9', style: 'architectural' });
  }

  static async generateCarImage(description: string): Promise<ImageGenerationResult> {
    return this.generateImage({ prompt: description, category: 'car', aspectRatio: '16:9', style: 'automotive' });
  }
}

function mapAspectRatio(ratio?: string): string {
  const map: Record<string, string> = { '1:1': 'square', '16:9': 'landscape', '9:16': 'portrait' };
  return map[ratio || '1:1'] || 'square';
}
