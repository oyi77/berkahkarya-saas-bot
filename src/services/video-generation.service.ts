/**
 * Video Generation Service - Multi-Provider with Niche/Style Selection
 * 
 * Handles AI video generation with fallback chain:
 * 1. GeminiGen.ai (primary)
 * 2. BytePlus Seedance (fallback)
 * 3. Demo mode (fallback for testing)
 */

import { logger } from '@/utils/logger';
import axios from 'axios';
import FormData from 'form-data';
import { CircuitBreaker } from '@/services/circuit-breaker.service';
import { PromptOptimizer } from '@/services/prompt-optimizer.service';
import { VIDEO_PROVIDERS_SORTED } from '@/config/providers';
import { getVideoCreditCost } from '@/config/pricing';

// Configuration
const GEMINIGEN_API_KEY = process.env.GEMINIGEN_API_KEY || '';
const GEMINIGEN_API_BASE = 'https://api.geminigen.ai/uapi/v1';
const BYTEPLUS_API_KEY = process.env.BYTEPLUS_API_KEY || process.env.AIML_API_KEY || '';

// Demo mode - returns sample video URLs for testing
// DEMO_MODE evaluated lazily so tests can override process.env
function isDemoMode(): boolean { return process.env.DEMO_MODE === 'true' || !process.env.GEMINIGEN_API_KEY; }

// ============================================================================
// NICHES & STYLES
// ============================================================================

export const NICHES = {
  fnb: { name: 'Food & Beverage', emoji: '🍔', styles: ['appetizing', 'cozy', 'energetic'] },
  fashion: { name: 'Fashion & Beauty', emoji: '👗', styles: ['elegant', 'trendy', 'playful'] },
  tech: { name: 'Tech & Gadget', emoji: '📱', styles: ['modern', 'sleek', 'futuristic'] },
  health: { name: 'Health & Fitness', emoji: '💪', styles: ['energetic', 'motivational', 'clean'] },
  travel: { name: 'Travel & Lifestyle', emoji: '✈️', styles: ['cinematic', 'adventurous', 'dreamy'] },
  education: { name: 'Education', emoji: '📚', styles: ['professional', 'engaging', 'clear'] },
  finance: { name: 'Finance & Business', emoji: '💰', styles: ['professional', 'trustworthy', 'modern'] },
  entertainment: { name: 'Entertainment', emoji: '🎭', styles: ['vibrant', 'exciting', 'bold'] },
} as const;

export const PROVIDERS = {
  geminigen: {
    name: 'GeminiGen',
    apiKey: GEMINIGEN_API_KEY,
    priority: 1,
    maxDuration: 5,
  },
  byteplus: {
    name: 'BytePlus Seedance',
    apiKey: BYTEPLUS_API_KEY,
    priority: 2,
    maxDuration: 5,
  },
  demo: {
    name: 'Demo',
    apiKey: 'demo',
    priority: 99,
    maxDuration: 300,
  },
};

// ============================================================================
// TYPES
// ============================================================================

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  provider?: string;
  jobId?: string;
}

export interface VideoGenerationParams {
  prompt?: string;
  niche?: string;
  styles?: string[];
  duration: number;
  aspectRatio?: string;
  style?: string;
  referenceImageUrl?: string;
  scenes?: number;
  userId?: bigint;
  jobId?: string;
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Main video generation function with multi-provider fallback
 */
export async function generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult> {
  const niche = params.niche || 'fnb';
  const styles = params.styles || ['appetizing'];
  logger.info(
    `🎬 Starting video generation: niche=${niche}, styles=${styles.join(',')}, duration=${params.duration}s`
  );

  const duration = Math.max(4, Math.min(15, params.duration));

  let prompt = params.prompt;
  if (!prompt) {
    prompt = generatePromptFromNiche(niche, styles, duration);
  }

  if (GEMINIGEN_API_KEY) {
    try {
      logger.info('🤖 Trying GeminiGen (priority 0)...');
      const result = await generateWithGeminiGen({
        ...params,
        prompt,
        duration,
      });

      if (result.success) {
        return { ...result, provider: 'geminigen' };
      }

      logger.warn(`❌ GeminiGen failed: ${result.error}`);
    } catch (error: any) {
      logger.warn(`❌ GeminiGen error: ${error.message}`);
    }
  }

  for (const provider of VIDEO_PROVIDERS_SORTED) {
    const providerKey = provider.key;

    if (PromptOptimizer.shouldAvoidProvider(providerKey, styles)) {
      logger.info(`⏭️ Skipping ${provider.name}: incompatible with styles [${styles.join(',')}]`);
      continue;
    }

    const canExecute = await CircuitBreaker.canExecute(providerKey);
    if (!canExecute) {
      logger.info(`⏭️ Skipping ${provider.name}: circuit breaker open`);
      continue;
    }

    const optimizedPrompt = await PromptOptimizer.optimizeForProvider(
      prompt,
      providerKey,
      niche,
      styles
    );

    try {
      logger.info(`🤖 Trying ${provider.name} (priority ${provider.priority})...`);
      const result = await dispatchToProvider(providerKey, {
        ...params,
        prompt: optimizedPrompt,
        duration: Math.min(provider.maxDuration, duration),
      });

      if (result.success) {
        await CircuitBreaker.recordSuccess(providerKey);
        return { ...result, provider: providerKey };
      }

      await CircuitBreaker.recordFailure(providerKey);
      logger.warn(`❌ ${provider.name} failed: ${result.error}`);
    } catch (error: any) {
      await CircuitBreaker.recordFailure(providerKey);
      logger.warn(`❌ ${provider.name} error: ${error.message}`);
    }
  }

  if (isDemoMode()) {
    logger.info('📺 Using demo mode - returning sample video');
    return generateDemoVideo(params, duration, niche, styles);
  }

  return {
    success: false,
    error: 'All video generation providers failed',
  };
}

// ============================================================================
// PROVIDER DISPATCH
// ============================================================================

async function dispatchToProvider(
  providerKey: string,
  params: VideoGenerationParams
): Promise<VideoGenerationResult> {
  switch (providerKey) {
    case 'geminigen':
      return generateWithGeminiGen(params);
    case 'byteplus':
      return generateWithByteplus(params);
    default:
      logger.warn(`No implementation for provider: ${providerKey}`);
      return {
        success: false,
        error: `Provider ${providerKey} not yet implemented`,
      };
  }
}

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

/**
 * Generate video using GeminiGen.ai
 */
async function generateWithGeminiGen(params: VideoGenerationParams): Promise<VideoGenerationResult> {
  const formData = new FormData();
  formData.append('prompt', params.prompt || '');
  formData.append('model', 'grok-3');
  formData.append('aspect_ratio', mapAspectRatio(params.aspectRatio || '9:16'));
  formData.append('duration', Math.min(5, params.duration).toString());

  try {
    const response = await axios.post(`${GEMINIGEN_API_BASE}/video-gen/grok`, formData, {
      headers: {
        ...formData.getHeaders(),
        'x-api-key': GEMINIGEN_API_KEY,
      },
      timeout: 30000,
    });

    const { uuid, status } = response.data;
    logger.info(`📋 GeminiGen job started: ${uuid}, status: ${status}`);

    // Poll for completion
    const result = await pollGeminiGen(uuid, 60);
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate video using BytePlus Seedance via AIML API
 */
async function generateWithByteplus(params: VideoGenerationParams): Promise<VideoGenerationResult> {
  const payload = {
    model: 'bytedance/seedance-1-0-lite-t2v',
    prompt: params.prompt || '',
    resolution: '480p',
    duration: 5,
    aspect_ratio: mapAspectRatio(params.aspectRatio || '9:16'),
    watermark: false,
  };

  try {
    const response = await axios.post('https://api.aimlapi.com/v2/video/generations', payload, {
      headers: {
        Authorization: `Bearer ${BYTEPLUS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const { id, status } = response.data;
    logger.info(`📋 BytePlus job started: ${id}, status: ${status}`);

    // Poll for completion
    const result = await pollByteplus(id, 60);
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Poll GeminiGen for video completion
 */
async function pollGeminiGen(jobId: string, maxAttempts: number): Promise<VideoGenerationResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await axios.get(`${GEMINIGEN_API_BASE}/history/${jobId}`, {
        headers: {
          'x-api-key': GEMINIGEN_API_KEY,
        },
        timeout: 10000,
      });

      const { status, data } = response.data;

      if (status === 'completed' && data?.video_url) {
        logger.info(`✅ GeminiGen video completed: ${data.video_url}`);
        return {
          success: true,
          videoUrl: data.video_url,
          thumbnailUrl: data.thumbnail_url,
          jobId,
        };
      }

      if (status === 'failed') {
        return {
          success: false,
          error: `GeminiGen job failed: ${data?.error || 'Unknown error'}`,
        };
      }

      logger.info(`⏳ GeminiGen still processing... (attempt ${attempt + 1}/${maxAttempts})`);
      await new Promise((r) => setTimeout(r, 2000)); // Wait 2s before retry
    } catch (error: any) {
      logger.error(`Error polling GeminiGen: ${error.message}`);
      if (attempt === maxAttempts - 1) {
        return {
          success: false,
          error: `Polling failed: ${error.message}`,
        };
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return {
    success: false,
    error: 'GeminiGen polling timeout',
  };
}

/**
 * Poll BytePlus for video completion
 */
async function pollByteplus(jobId: string, maxAttempts: number): Promise<VideoGenerationResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await axios.get(`https://queue.fal.run/fal-ai/bytedance-seedance/requests/${jobId}`, {
        headers: {
          Authorization: `Bearer ${BYTEPLUS_API_KEY}`,
        },
        timeout: 10000,
      });

      const { status, output } = response.data;

      if (status === 'completed' && output?.video_url) {
        logger.info(`✅ BytePlus video completed: ${output.video_url}`);
        return {
          success: true,
          videoUrl: output.video_url,
          thumbnailUrl: output.thumbnail_url,
          jobId,
        };
      }

      if (status === 'failed') {
        return {
          success: false,
          error: `BytePlus job failed: ${output?.error || 'Unknown error'}`,
        };
      }

      logger.info(`⏳ BytePlus still processing... (attempt ${attempt + 1}/${maxAttempts})`);
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error: any) {
      logger.error(`Error polling BytePlus: ${error.message}`);
      if (attempt === maxAttempts - 1) {
        return {
          success: false,
          error: `Polling failed: ${error.message}`,
        };
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return {
    success: false,
    error: 'BytePlus polling timeout',
  };
}

// ============================================================================
// DEMO MODE
// ============================================================================

/**
 * Generate demo video for testing
 */
function generateDemoVideo(
  _params: VideoGenerationParams,
  _duration: number,
  _niche: string,
  _styles: string[]
): VideoGenerationResult {
  const sampleVideos = [
    'https://media.giphy.com/media/RJ8SJ3dIKdCf2/giphy.mp4',
    'https://media.giphy.com/media/3o7TKQfp3x8G5hLJiE/giphy.mp4',
    'https://media.giphy.com/media/26uf1EKv0ZN5sKtJS/giphy.mp4',
    'https://media.giphy.com/media/jW38p3xgeF23rW6KG8/giphy.mp4',
    'https://media.giphy.com/media/12NlCFUvTokWXe/giphy.mp4',
  ];

  const randomVideo = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];

  return {
    success: true,
    videoUrl: randomVideo,
    thumbnailUrl: 'https://via.placeholder.com/1080x1920/000000/ffffff?text=Demo+Video',
    jobId: `demo-${Date.now()}`,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Map aspect ratio string to provider format
 */
function mapAspectRatio(aspectRatio: string): string {
  const map: Record<string, string> = {
    '9:16': 'portrait',
    '16:9': 'landscape',
    '1:1': 'square',
    '4:5': 'portrait',
  };
  return map[aspectRatio] || 'portrait';
}

/**
 * Generate prompt based on niche and styles
 */
export function generatePromptFromNiche(niche: string, styles: string[], duration: number): string {
  const nicheKey = niche as keyof typeof NICHES;
  const _nicheConfig = NICHES[nicheKey] || NICHES.fnb;
  const styleStr = styles.join(', ');

  const templates: Record<string, string> = {
    fnb: `Create a ${styleStr} food video showing delicious ${niche} content, cinematic quality, trending on TikTok, ${duration}s duration`,
    fashion: `Create a ${styleStr} fashion and beauty video showcasing trendy styles, professional lighting, ${duration}s duration`,
    tech: `Create a ${styleStr} tech gadget demo video with modern aesthetic, product showcase, ${duration}s duration`,
    health: `Create a ${styleStr} fitness and health workout video with energetic energy, demonstration moves, ${duration}s duration`,
    travel: `Create a ${styleStr} travel vlog video with stunning locations, cinematic shots, ${duration}s duration`,
    education: `Create a ${styleStr} educational explainer video with clear visuals, ${duration}s duration`,
    finance: `Create a ${styleStr} finance and business content video with professional presentation, ${duration}s duration`,
    entertainment: `Create a ${styleStr} entertaining and fun short video, trending format, ${duration}s duration`,
  };

  return templates[nicheKey] || templates.fnb;
}

/**
 * Generate storyboard for multi-scene videos
 */
export function generateStoryboard(
  niche: string,
  styles: string[],
  duration: number,
  scenes: number
): Array<{ scene: number; duration: number; description: string; prompt: string }> {
  const durationPerScene = 5; // Standard 5s per scene

  const templates: Record<string, string[]> = {
    fnb: [
      'Wide shot of ingredients laid out beautifully',
      'Close-up of preparation process',
      'Cooking/mixing action shot',
      'Final plating and garnish',
      'Enjoying the finished product',
      'Reaction shot to taste',
      'Aesthetic flat lay of the dish',
      'Call-to-action with recipe mention',
    ],
    fashion: [
      'Full outfit showcase with spinning',
      'Close-up of accessories and details',
      'Styling tips or matching combinations',
      'Walking or runway moment',
      'Makeup or grooming detail',
      'Transformation before/after',
      'Confidence boost final look',
      'Share your style tag',
    ],
    tech: [
      'Product unboxing or intro',
      'Key features showcase',
      'Close-up of innovative details',
      'In-action demonstration',
      'Comparison with alternatives',
      'Performance testing',
      'Use case scenario',
      'Call-to-action',
    ],
    health: [
      'Warm-up and preparation',
      'Exercise demonstration',
      'Proper form coaching',
      'Challenge moment',
      'Recovery and stretching',
      'Transformation showcase',
      'Motivational message',
      'Share your fitness journey',
    ],
    travel: [
      'Scenic landscape reveal',
      'Destination intro and vibe',
      'Local attractions and activities',
      'Cultural or authentic moments',
      'Food and dining experience',
      'Adventure moment',
      'Sunset or golden hour shot',
      'Save to travel bucket list',
    ],
    education: [
      'Hook and topic intro',
      'Problem statement',
      'Key concept explanation',
      'Example or case study',
      'Step-by-step walkthrough',
      'Common mistakes to avoid',
      'Key takeaways summary',
      'Call-to-action to learn more',
    ],
    finance: [
      'Business or money concept intro',
      'Problem identification',
      'Solution explanation',
      'Real-world example',
      'Numbers and statistics',
      'Action steps',
      'Success story or result',
      'Join for more financial tips',
    ],
    entertainment: [
      'Eye-catching hook',
      'Setup and premise',
      'Comedy or surprise moment',
      'Build tension or excitement',
      'Climax or payoff',
      'Reaction moment',
      'Witty conclusion',
      'Tag for engagement',
    ],
  };

  const sceneTemplates = templates[niche as keyof typeof templates] || templates.fnb;

  return Array.from({ length: scenes }).map((_, i) => ({
    scene: i + 1,
    duration: durationPerScene,
    description: sceneTemplates[Math.min(i, sceneTemplates.length - 1)] || `Scene ${i + 1}`,
    prompt: `[Scene ${i + 1}/${scenes}] ${sceneTemplates[Math.min(i, sceneTemplates.length - 1)] || `Scene ${i + 1}`}, ${styles.join(', ')} style, ${durationPerScene}s`,
  }));
}

/**
 * Get credit cost for video
 */
export function getCreditCost(duration: number): number {
  return getVideoCreditCost(duration);
}

/**
 * Process video job (stub for backwards compatibility)
 */
export async function processVideoJob(video: any): Promise<VideoGenerationResult> {
  logger.info(`Processing video job: ${video.jobId}`);
  return generateVideo({
    prompt: video.prompt,
    duration: video.duration,
    niche: video.niche,
    styles: video.styles,
    aspectRatio: '9:16',
  });
}
