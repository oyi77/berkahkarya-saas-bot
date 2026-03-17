/**
 * GeminiGen Video Generation Service
 * 
 * Handles AI video generation via GeminiGen.ai API
 */

import { logger } from '@/utils/logger';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import * as fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

const exec = promisify(execCallback);

// GeminiGen configuration
const GEMINIGEN_API_KEY = process.env.GEMINIGEN_API_KEY || '';
const GEMINIGEN_API_BASE = 'https://api.geminigen.ai/uapi/v1';

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  jobId?: string;
}

export interface VideoGenerationParams {
  prompt: string;
  duration: number;
  aspectRatio: string;
  style?: string;
  model?: string;
  resolution?: string;
  referenceImage?: string | null;  // Add reference image support
}

/**
 * GeminiGen Service
 */
export class GeminiGenService {
  /**
   * Generate video using GeminiGen.ai API
   */
  static async generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult> {
    return generateVideo(params);
  }

  /**
   * Generate video from images
   */
  static async generateFromImages(
    imageUrls: string[],
    params: {
      niche: string;
      platform: string;
      duration: number;
      brief?: string;
    }
  ): Promise<VideoGenerationResult> {
    return generateFromImages(imageUrls, params);
  }
}

/**
 * Generate video using GeminiGen.ai API
 */
export async function generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult> {
  try {
    logger.info(`🎬 Starting video generation: ${params.prompt.slice(0, 50)}...`);

    if (!GEMINIGEN_API_KEY) {
      return {
        success: false,
        error: 'GEMINIGEN_API_KEY not configured',
      };
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('prompt', params.prompt);
    formData.append('model', params.model || 'grok-3');
    formData.append('resolution', params.resolution || '480p');
    formData.append('aspect_ratio', mapAspectRatio(params.aspectRatio));
    formData.append('duration', params.duration.toString());
    formData.append('mode', 'custom');

    // Add reference image if provided
    if (params.referenceImage) {
      formData.append('files', fs.createReadStream(params.referenceImage));
      logger.info('📸 Reference image attached to request');
    }

    // Call GeminiGen API
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
    logger.info(`📋 Video generation started: ${uuid}, status: ${status}`);

    // Poll for completion
    const result = await pollForCompletion(uuid);

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

  } catch (error: any) {
    logger.error('Video generation failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error_message || error.message || 'Unknown error',
    };
  }
}

/**
 * Poll for video completion
 */
async function pollForCompletion(uuid: string, maxAttempts = 60): Promise<VideoGenerationResult> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(
        `${GEMINIGEN_API_BASE}/history/${uuid}`,
        {
          headers: {
            'x-api-key': GEMINIGEN_API_KEY,
          },
        }
      );

      const { status, status_percentage, generated_video, thumbnail_url, error_message } = response.data;

      logger.info(`⏳ Video status: ${status_percentage}% (${status})`);

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

      // Wait 5 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error: any) {
      logger.error(`Poll attempt ${i + 1} failed:`, error.message);
      // Continue polling even if one attempt fails
    }
  }

  return {
    success: false,
    error: 'Video generation timeout after 5 minutes',
  };
}

/**
 * Map aspect ratio to GeminiGen format
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
 * Generate video from product images
 */
export async function generateFromImages(
  imageUrls: string[],
  params: {
    niche: string;
    platform: string;
    duration: number;
    brief?: string;
  }
): Promise<VideoGenerationResult> {
  // Build prompt from niche and images
  const prompt = buildVideoPrompt(params.niche, params.platform, params.duration, params.brief);
  
  // Get aspect ratio for platform
  const aspectRatio = getAspectRatio(params.platform);
  
  return generateVideo({
    prompt,
    duration: params.duration,
    aspectRatio,
    style: getStyleForNiche(params.niche),
  });
}

/**
 * Build video prompt from parameters
 */
function buildVideoPrompt(
  niche: string,
  platform: string,
  duration: number,
  brief?: string
): string {
  const nicheStyles: Record<string, string> = {
    fnb: 'appetizing food photography, steam, fresh ingredients, warm lighting, close-up shots, restaurant quality',
    beauty: 'soft lighting, before-after transformation, professional results, elegant presentation, glow effect',
    retail: 'product showcase, unboxing style, lifestyle context, clean background, premium feel',
    services: 'professional service, process showcase, customer satisfaction, trust-building, expert delivery',
    professional: 'corporate professional, educational content, expert demonstration, clean studio',
    hospitality: 'room tour, luxury ambience, relaxing atmosphere, premium experience, elegant decor',
  };

  const style = nicheStyles[niche] || nicheStyles.retail;
  
  let prompt = `Create a ${duration}-second marketing video. Style: ${style}.`;
  
  if (brief) {
    prompt += ` Message: ${brief}.`;
  }
  
  prompt += ' High quality, cinematic, engaging transitions, viral potential.';

  return prompt;
}

/**
 * Get aspect ratio for platform
 */
function getAspectRatio(platform: string): string {
  const ratios: Record<string, string> = {
    tiktok: '9:16',
    instagram: '9:16',
    youtube: '9:16',
    facebook: '4:5',
    twitter: '1:1',
    linkedin: '1:1',
  };
  
  return ratios[platform] || '9:16';
}

/**
 * Get style for niche
 */
function getStyleForNiche(niche: string): string {
  const styles: Record<string, string> = {
    fnb: 'cinematic food',
    beauty: 'beauty commercial',
    retail: 'product showcase',
    services: 'professional service',
    professional: 'corporate',
    hospitality: 'luxury real estate',
  };
  
  return styles[niche] || 'cinematic';
}
