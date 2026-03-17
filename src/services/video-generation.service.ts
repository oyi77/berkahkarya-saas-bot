/**
 * Video Generation Service - Unified Interface
 * 
 * Handles AI video generation with fallback chain:
 * 1. GeminiGen.ai (primary)
 * 2. Kling AI (fallback)
 * 3. Demo mode (fallback for testing)
 */

import { logger } from '@/utils/logger';
import axios from 'axios';
import FormData from 'form-data';
import { Video } from '@prisma/client';

// Configuration
const GEMINIGEN_API_KEY = process.env.GEMINIGEN_API_KEY || '';
const GEMINIGEN_API_BASE = 'https://api.geminigen.ai/uapi/v1';

// Demo mode - returns sample video URLs for testing
const DEMO_MODE = process.env.DEMO_MODE === 'true' || !GEMINIGEN_API_KEY;

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  provider?: string;
  jobId?: string;
}

export interface VideoGenerationParams {
  prompt: string;
  duration: number; // 4-15 seconds for AI
  aspectRatio: string; // 9:16, 16:9, 1:1, 4:5
  style?: string;
  referenceImageUrl?: string;
}

/**
 * Main video generation function with fallback chain
 */
export async function generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult> {
  logger.info(`🎬 Starting video generation: ${params.prompt.slice(0, 50)}...`);

  // Validate duration (must be 4-15 seconds for AI)
  const duration = Math.max(4, Math.min(15, params.duration));

  // Try GeminiGen first
  if (GEMINIGEN_API_KEY) {
    try {
      const result = await generateWithGeminiGen({
        ...params,
        duration,
      });
      
      if (result.success) {
        return { ...result, provider: 'geminigen' };
      }
      
      logger.warn(`GeminiGen failed: ${result.error}, trying fallback...`);
    } catch (error: any) {
      logger.warn(`GeminiGen error: ${error.message}, trying fallback...`);
    }
  }

  // Try Kling AI as fallback
  try {
    const result = await generateWithKling({
      ...params,
      duration,
    });
    
    if (result.success) {
      return { ...result, provider: 'kling' };
    }
    
    logger.warn(`Kling failed: ${result.error}, trying demo mode...`);
  } catch (error: any) {
    logger.warn(`Kling error: ${error.message}, trying demo mode...`);
  }

  // Fallback to demo mode
  if (DEMO_MODE) {
    logger.info('Using demo mode - returning sample video');
    return generateDemoVideo(params, duration);
  }

  return {
    success: false,
    error: 'All video generation providers failed',
  };
}

/**
 * Generate video using GeminiGen.ai
 */
async function generateWithGeminiGen(params: VideoGenerationParams): Promise<VideoGenerationResult> {
  const formData = new FormData();
  formData.append('prompt', params.prompt);
  formData.append('model', 'grok-3');
  formData.append('resolution', '480p');
  formData.append('aspect_ratio', mapAspectRatio(params.aspectRatio));
  formData.append('duration', params.duration.toString());
  formData.append('mode', 'custom');

  const response = await axios.post(
    `${GEMINIGEN_API_BASE}/video-gen/grok`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'x-api-key': GEMINIGEN_API_KEY,
      },
      timeout: 30000,
    }
  );

  const { uuid, status } = response.data;
  logger.info(`📋 GeminiGen job started: ${uuid}, status: ${status}`);

  // Poll for completion
  const result = await pollGeminiGen(uuid, 60);

  if (result.success && result.videoUrl) {
    return {
      success: true,
      videoUrl: result.videoUrl,
      thumbnailUrl: result.thumbnailUrl,
      jobId: uuid,
    };
  }

  return {
    success: false,
    error: result.error || 'Video generation failed',
    jobId: uuid,
  };
}

/**
 * Poll GeminiGen for completion
 */
async function pollGeminiGen(uuid: string, maxAttempts = 60): Promise<VideoGenerationResult> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(
        `${GEMINIGEN_API_BASE}/history/${uuid}`,
        {
          headers: { 'x-api-key': GEMINIGEN_API_KEY },
        }
      );

      const { status, status_percentage, generated_video, thumbnail_url, error_message } = response.data;
      logger.info(`⏳ GeminiGen status: ${status_percentage}% (${status})`);

      // Status: 1 = processing, 2 = completed, 3 = failed
      if (status === 2 && generated_video && generated_video.length > 0) {
        const videoUrl = generated_video[0].video_url || generated_video[0].video_uri;
        return {
          success: true,
          videoUrl,
          thumbnailUrl: thumbnail_url || '',
        };
      }

      if (status === 3) {
        return {
          success: false,
          error: error_message || 'Video generation failed',
        };
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error: any) {
      logger.error(`Poll attempt ${i + 1} failed:`, error.message);
    }
  }

  return {
    success: false,
    error: 'Video generation timeout after 5 minutes',
  };
}

/**
 * Generate video using Kling AI (placeholder for now)
 */
async function generateWithKling(params: VideoGenerationParams): Promise<VideoGenerationResult> {
  // TODO: Implement Kling AI integration when API is available
  // For now, this serves as a placeholder for the fallback chain
  
  const klingApiKey = process.env.KLING_API_KEY;
  
  if (!klingApiKey) {
    return {
      success: false,
      error: 'Kling API not configured',
    };
  }

  // Placeholder - would implement actual Kling API call here
  throw new Error('Kling AI not yet implemented');
}

/**
 * Generate demo video for testing
 */
function generateDemoVideo(params: VideoGenerationParams, duration: number): VideoGenerationResult {
  // Return a sample video URL for demo purposes
  // In production, this would be replaced with actual AI-generated content
  
  const sampleVideos = [
    'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  ];
  
  const videoUrl = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];
  
  logger.info(`🎬 Demo mode: returning sample video (duration: ${duration}s)`);
  
  return {
    success: true,
    videoUrl,
    thumbnailUrl: 'https://via.placeholder.com/360x640.png?text=Video+Thumbnail',
    provider: 'demo',
    jobId: `demo-${Date.now()}`,
  };
}

/**
 * Map aspect ratio to provider format
 */
function mapAspectRatio(ratio: string): string {
  const ratioMap: Record<string, string> = {
    '9:16': 'portrait',
    '16:9': 'landscape',
    '1:1': 'square',
    '4:5': 'vertical',
    '3:2': 'horizontal',
  };
  return ratioMap[ratio] || 'portrait';
}

/**
 * Get aspect ratio for platform
 */
export function getAspectRatioForPlatform(platform: string): string {
  const ratios: Record<string, string> = {
    tiktok: '9:16',
    instagram: '9:16',
    youtube: '9:16',
    facebook: '4:5',
    twitter: '1:1',
    linkedin: '1:1',
    shorts: '9:16',
    reels: '9:16',
  };
  return ratios[platform.toLowerCase()] || '9:16';
}

/**
 * Get style for niche
 */
export function getStyleForNiche(niche: string): string {
  const styles: Record<string, string> = {
    fnb: 'cinematic food, appetizing, warm lighting, restaurant quality',
    beauty: 'beauty commercial, soft lighting, elegant, professional',
    retail: 'product showcase, clean background, premium feel',
    services: 'professional service, corporate, clean studio',
    professional: 'corporate, educational, expert demonstration',
    hospitality: 'luxury real estate, room tour, elegant decor',
    car: 'automotive, cinematic, showroom lighting, luxury',
    realestate: 'real estate, wide angle, luxury home, cinematic',
  };
  return styles[niche.toLowerCase()] || 'cinematic, professional';
}

/**
 * Build video prompt from parameters
 */
export function buildVideoPrompt(
  niche: string,
  platform: string,
  duration: number,
  description?: string
): string {
  const style = getStyleForNiche(niche);
  const aspectRatio = getAspectRatioForPlatform(platform);
  
  let prompt = `Create a ${duration}-second marketing video. `;
  prompt += `Style: ${style}. `;
  prompt += `Aspect ratio: ${aspectRatio}. `;
  
  if (description) {
    prompt += `Content: ${description}. `;
  }
  
  prompt += 'High quality, cinematic, engaging, viral potential, professional editing.';
  
  return prompt;
}

/**
 * Get credit cost for video duration
 */
export function getCreditCost(duration: number): number {
  if (duration <= 5) return 0.5;
  if (duration <= 10) return 0.5;
  if (duration <= 15) return 0.5;
  return 1.0;
}

/**
 * Process video job - main entry point for video generation
 */
export async function processVideoJob(video: Video): Promise<VideoGenerationResult> {
  const { niche, platform, duration, jobId } = video;
  
  // Build prompt
  const prompt = buildVideoPrompt(niche, platform, duration);
  
  // Get aspect ratio
  const aspectRatio = getAspectRatioForPlatform(platform);
  
  // Generate video
  const result = await generateVideo({
    prompt,
    duration,
    aspectRatio,
    style: getStyleForNiche(niche),
  });

  if (!result.success) {
    logger.error(`Video generation failed for ${jobId}: ${result.error}`);
  } else {
    logger.info(`Video generated successfully for ${jobId} via ${result.provider}`);
  }

  return result;
}
