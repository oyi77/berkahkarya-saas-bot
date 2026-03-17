/**
 * Image Generation Service
 * 
 * Handles AI image generation via GeminiGen API
 */

import { logger } from '@/utils/logger';
import axios from 'axios';

const GEMINIGEN_API_KEY = process.env.GEMINIGEN_API_KEY || 'geminiai-04db42d9b996e147df5e33d8b7d42ac3';
const GEMINIGEN_API_BASE = 'https://api.geminigen.ai/uapi/v1';

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface ImageGenerationParams {
  prompt: string;
  style?: string;
  aspectRatio?: string;
  category: string;
}

/**
 * Generate image using GeminiGen API
 */
export class ImageGenerationService {
  
  /**
   * Generate image from prompt
   */
  static async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    try {
      logger.info(`🖼️ Starting image generation: ${params.prompt.slice(0, 50)}...`);

      // Build prompt based on category
      const enhancedPrompt = this.buildPrompt(params);

      // Call GeminiGen image API
      const response = await axios.post(
        `${GEMINIGEN_API_BASE}/image-gen`,
        {
          prompt: enhancedPrompt,
          model: 'gemini-2.0-flash',
          aspect_ratio: params.aspectRatio || '1:1',
          style: params.style || 'photorealistic',
        },
        {
          headers: {
            'x-api-key': GEMINIGEN_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      const { status, image_url } = response.data;

      if (status === 2 && image_url) {
        return {
          success: true,
          imageUrl: image_url,
        };
      }

      return {
        success: false,
        error: 'Image generation failed',
      };

    } catch (error: any) {
      logger.error('Image generation failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_message || error.message || 'Unknown error',
      };
    }
  }

  /**
   * Build enhanced prompt based on category
   */
  private static buildPrompt(params: ImageGenerationParams): string {
    const categoryPrompts: Record<string, string> = {
      product: 'Professional product photography, studio lighting, clean background, high-end commercial quality, sharp focus,',
      fnb: 'Food photography, appetizing, fresh, steam, professional lighting, restaurant quality, mouth-watering,',
      realestate: 'Real estate photography, interior design, spacious, bright, professional wide-angle, luxury property,',
      car: 'Automotive photography, showroom quality, dramatic lighting, sleek, premium, professional car photography,',
    };

    const prefix = categoryPrompts[params.category] || categoryPrompts.product;
    return `${prefix} ${params.prompt}. 4K quality, professional, high resolution.`;
  }

  /**
   * Generate product image
   */
  static async generateProductImage(description: string): Promise<ImageGenerationResult> {
    return this.generateImage({
      prompt: description,
      category: 'product',
      aspectRatio: '1:1',
      style: 'commercial',
    });
  }

  /**
   * Generate food image
   */
  static async generateFoodImage(description: string): Promise<ImageGenerationResult> {
    return this.generateImage({
      prompt: description,
      category: 'fnb',
      aspectRatio: '4:5',
      style: 'food photography',
    });
  }

  /**
   * Generate real estate image
   */
  static async generateRealEstateImage(description: string): Promise<ImageGenerationResult> {
    return this.generateImage({
      prompt: description,
      category: 'realestate',
      aspectRatio: '16:9',
      style: 'architectural',
    });
  }

  /**
   * Generate car image
   */
  static async generateCarImage(description: string): Promise<ImageGenerationResult> {
    return this.generateImage({
      prompt: description,
      category: 'car',
      aspectRatio: '16:9',
      style: 'automotive',
    });
  }
}
