/**
 * Video Service
 * 
 * Handles AI video generation via GeminiGen.ai
 */

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { Video } from '@prisma/client';

// GeminiGen configuration (for future use)
// const GEMINIGEN_EMAIL = process.env.GEMINIGEN_EMAIL || 'grahainsanmandiri@gmail.com';
// const GEMINIGEN_PASSWORD = process.env.GEMINIGEN_PASSWORD || '';

// Credit costs
const CREDIT_COSTS = {
  '15s': 0.5,
  '30s': 1.0,
  '60s': 2.0,
  '120s': 4.0,
};

// Platform specs
const PLATFORM_SPECS = {
  tiktok: { aspectRatio: '9:16', resolution: '1080x1920', maxDuration: 60 },
  instagram: { aspectRatio: '9:16', resolution: '1080x1920', maxDuration: 90 },
  youtube: { aspectRatio: '9:16', resolution: '1080x1920', maxDuration: 60 },
  facebook: { aspectRatio: '4:5', resolution: '1080x1350', maxDuration: 240 },
  twitter: { aspectRatio: '1:1', resolution: '1080x1080', maxDuration: 140 },
};

// Niche templates
const NICHE_TEMPLATES = {
  fnb: {
    name: 'Food & Beverage',
    promptStyle: 'appetizing, warm lighting, steam, fresh ingredients, close-up shots',
  },
  beauty: {
    name: 'Beauty & Wellness',
    promptStyle: 'soft lighting, before-after transformation, professional results',
  },
  retail: {
    name: 'Retail & E-commerce',
    promptStyle: 'product showcase, unboxing style, lifestyle context',
  },
  services: {
    name: 'Services',
    promptStyle: 'professional, process showcase, testimonial style',
  },
  professional: {
    name: 'Professional Services',
    promptStyle: 'trust-building, educational, expert showcase',
  },
  hospitality: {
    name: 'Hospitality',
    promptStyle: 'room tour, ambience, experience-focused',
  },
};

export class VideoService {
  /**
   * Create video job
   */
  static async createJob(params: {
    userId: bigint;
    niche: string;
    platform: string;
    duration: number;
    scenes: number;
    title?: string;
  }): Promise<Video> {
    // Calculate credit cost
    const durationKey = params.duration <= 15 ? '15s' : 
                        params.duration <= 30 ? '30s' : 
                        params.duration <= 60 ? '60s' : '120s';
    const creditCost = CREDIT_COSTS[durationKey as keyof typeof CREDIT_COSTS];

    // Generate job ID
    const jobId = `VID-${Date.now()}-${params.userId}-${Math.random().toString(36).substring(2, 8)}`;

    // Create video record
    const video = await prisma.video.create({
      data: {
        userId: params.userId,
        jobId,
        title: params.title || `Video ${new Date().toLocaleDateString('id-ID')}`,
        niche: params.niche,
        platform: params.platform,
        duration: params.duration,
        scenes: params.scenes,
        status: 'processing',
        progress: 0,
        creditsUsed: creditCost,
      },
    });

    logger.info(`Created video job: ${jobId}`);
    return video;
  }

  /**
   * Update video progress
   */
  static async updateProgress(jobId: string, progress: number, status?: string): Promise<Video> {
    return prisma.video.update({
      where: { jobId },
      data: {
        progress,
        status: status || undefined,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
    });
  }

  /**
   * Set video output URLs
   */
  static async setOutput(jobId: string, urls: {
    thumbnailUrl?: string;
    videoUrl?: string;
    downloadUrl?: string;
  }): Promise<Video> {
    return prisma.video.update({
      where: { jobId },
      data: {
        ...urls,
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Get video by job ID
   */
  static async getByJobId(jobId: string): Promise<Video | null> {
    return prisma.video.findUnique({
      where: { jobId },
    });
  }

  /**
   * Get user's videos
   */
  static async getUserVideos(userId: bigint, limit = 10): Promise<Video[]> {
    return prisma.video.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Generate video prompt
   */
  static generatePrompt(params: {
    niche: string;
    platform: string;
    duration: number;
    productDescription?: string;
  }): string {
    const nicheTemplate = NICHE_TEMPLATES[params.niche as keyof typeof NICHE_TEMPLATES];
    const platformSpec = PLATFORM_SPECS[params.platform as keyof typeof PLATFORM_SPECS];

    const prompt = `
Create a ${params.duration}-second marketing video for ${nicheTemplate?.name || 'general'} niche.
Style: ${nicheTemplate?.promptStyle || 'professional'}
Platform: ${params.platform} (${platformSpec?.aspectRatio || '9:16'})
${params.productDescription ? `Product: ${params.productDescription}` : ''}

Structure:
- Hook (0-3s): Attention-grabbing opening
- Problem (3-10s): Pain point
- Solution (10-25s): Product showcase
- CTA (25-30s): Call to action

Visual style: Cinematic, high quality, engaging transitions.
    `.trim();

    return prompt;
  }

  /**
   * Get credit cost for video
   */
  static getCreditCost(duration: number): number {
    const durationKey = duration <= 15 ? '15s' : 
                        duration <= 30 ? '30s' : 
                        duration <= 60 ? '60s' : '120s';
    return CREDIT_COSTS[durationKey as keyof typeof CREDIT_COSTS];
  }

  /**
   * Get available niches
   */
  static getNiches() {
    return Object.entries(NICHE_TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
    }));
  }

  /**
   * Get available platforms
   */
  static getPlatforms() {
    return Object.entries(PLATFORM_SPECS).map(([id, spec]) => ({
      id,
      ...spec,
    }));
  }
}
