/**
 * Video Service
 * 
 * Handles AI video generation via GeminiGen.ai
 */

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { Video } from '@prisma/client';
import { processVideoJob, getCreditCost } from './video-generation.service';

// GeminiGen configuration (for future use)
// const GEMINIGEN_EMAIL = process.env.GEMINIGEN_EMAIL || 'grahainsanmandiri@gmail.com';
// const GEMINIGEN_PASSWORD = process.env.GEMINIGEN_PASSWORD || '';

// Credit costs based on HPP: 1 min video spent ~IDR 6000 -> Retail IDR 10000
// Pricing logic: Extra credit usage should be more expensive than subscription
const CREDIT_COSTS = {
  '15s': 0.5,  // IDR 5,000 unit
  '30s': 1.0,  // IDR 10,000 unit
  '60s': 2.0,  // IDR 20,000 unit
  '120s': 4.5, // IDR 45,000 unit (Higher per-duration cost for long videos)
};

// Platform specs
const PLATFORM_SPECS = {
  tiktok: { aspectRatio: '9:16', resolution: '1080x1920', maxDuration: 60 },
  instagram: { aspectRatio: '9:16', resolution: '1080x1920', maxDuration: 90 },
  youtube: { aspectRatio: '9:16', resolution: '1080x1920', maxDuration: 60 },
  facebook: { aspectRatio: '4:5', resolution: '1080x1350', maxDuration: 240 },
  twitter: { aspectRatio: '1:1', resolution: '1080x1080', maxDuration: 140 },
};

// Niche templates - Updated for Berkah Karya workflows
const NICHE_TEMPLATES = {
  fnb: {
    name: '🍔 F&B / Food & Beverage',
    promptStyle: 'appetizing, warm lighting, steam, fresh ingredients, close-up shots, sizzling, pouring, plating',
    storyboardTemplate: [
      { scene: 1, duration: 3, type: 'hook', description: 'Close-up of signature dish/drink' },
      { scene: 2, duration: 5, type: 'process', description: 'Cooking/preparation action' },
      { scene: 3, duration: 4, type: 'result', description: 'Final presentation with steam/garnish' },
      { scene: 4, duration: 3, type: 'cta', description: 'Restaurant logo + promo' },
    ],
  },
  realestate: {
    name: '🏠 Real Estate',
    promptStyle: 'wide angle, bright natural lighting, spacious feel, luxury amenities, drone shots, walkthrough',
    storyboardTemplate: [
      { scene: 1, duration: 3, type: 'hook', description: 'Exterior curb appeal' },
      { scene: 2, duration: 5, type: 'tour', description: 'Living room walkthrough' },
      { scene: 3, duration: 4, type: 'features', description: 'Kitchen & amenities highlight' },
      { scene: 4, duration: 4, type: 'bedroom', description: 'Master bedroom/bathroom' },
      { scene: 5, duration: 3, type: 'cta', description: 'Agent info + contact' },
    ],
  },
  product: {
    name: '🛍️ Product / E-commerce',
    promptStyle: 'studio lighting, product showcase, unboxing style, lifestyle context, detail shots, 360 rotation',
    storyboardTemplate: [
      { scene: 1, duration: 2, type: 'hook', description: 'Product hero shot' },
      { scene: 2, duration: 4, type: 'features', description: 'Key features demonstration' },
      { scene: 3, duration: 4, type: 'benefits', description: 'Usage in daily life' },
      { scene: 4, duration: 3, type: 'cta', description: 'Price + buy now' },
    ],
  },
  car: {
    name: '🚗 Car Showroom / Dealership',
    promptStyle: 'cinematic automotive, showroom lighting, exterior angles, interior luxury, engine detail, driving shots',
    storyboardTemplate: [
      { scene: 1, duration: 3, type: 'hook', description: 'Exterior front 3/4 angle' },
      { scene: 2, duration: 4, type: 'exterior', description: 'Walkaround exterior' },
      { scene: 3, duration: 4, type: 'interior', description: 'Interior luxury features' },
      { scene: 4, duration: 3, type: 'engine', description: 'Engine/performance specs' },
      { scene: 5, duration: 3, type: 'cta', description: 'Dealership info + price' },
    ],
  },
  beauty: {
    name: '💄 Beauty & Wellness',
    promptStyle: 'soft lighting, before-after transformation, professional results, skincare routine, makeup application',
    storyboardTemplate: [
      { scene: 1, duration: 2, type: 'hook', description: 'Before state / problem' },
      { scene: 2, duration: 5, type: 'process', description: 'Product application' },
      { scene: 3, duration: 4, type: 'result', description: 'After transformation' },
      { scene: 4, duration: 3, type: 'cta', description: 'Product + buy link' },
    ],
  },
  services: {
    name: '💼 Professional Services',
    promptStyle: 'professional, trust-building, process showcase, testimonial style, expert showcase',
    storyboardTemplate: [
      { scene: 1, duration: 3, type: 'hook', description: 'Problem statement' },
      { scene: 2, duration: 5, type: 'solution', description: 'Service explanation' },
      { scene: 3, duration: 4, type: 'proof', description: 'Results/testimonials' },
      { scene: 4, duration: 3, type: 'cta', description: 'Book consultation' },
    ],
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
   * Update video status
   */
  static async updateStatus(jobId: string, status: string, errorMessage?: string): Promise<Video> {
    return prisma.video.update({
      where: { jobId },
      data: {
        status,
        errorMessage,
        ...(status === 'completed' ? { completedAt: new Date(), progress: 100 } : {}),
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
   * Delete video by job ID
   */
  static async deleteVideo(jobId: string): Promise<void> {
    await prisma.video.delete({
      where: { jobId },
    });
    logger.info(`Deleted video: ${jobId}`);
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

  /**
   * Generate storyboard for niche
   */
  static generateStoryboard(params: {
    niche: string;
    duration: number;
    productDescription?: string;
    customScenes?: Array<{ scene: number; duration: number; type: string; description: string }>;
  }): {
    scenes: Array<{ scene: number; duration: number; type: string; description: string; prompt: string }>;
    totalDuration: number;
    caption: string;
  } {
    const nicheTemplate = NICHE_TEMPLATES[params.niche as keyof typeof NICHE_TEMPLATES];
    const baseScenes = params.customScenes || nicheTemplate?.storyboardTemplate || [];
    
    // Adjust scene count based on duration
    const scenesNeeded = params.duration <= 15 ? 3 : params.duration <= 30 ? 5 : 8;
    const adjustedScenes = baseScenes.slice(0, scenesNeeded);
    
    // Generate scene prompts
    const scenes = adjustedScenes.map((scene, idx) => ({
      ...scene,
      scene: idx + 1,
      prompt: this.generateScenePrompt({
        niche: params.niche,
        sceneType: scene.type,
        description: scene.description,
        productDescription: params.productDescription,
      }),
    }));

    // Generate caption
    const caption = this.generateCaption({
      niche: params.niche,
      productDescription: params.productDescription,
      sceneCount: scenes.length,
    });

    return {
      scenes,
      totalDuration: scenes.reduce((acc, s) => acc + s.duration, 0),
      caption,
    };
  }

  /**
   * Generate scene prompt for AI video generation
   */
  static generateScenePrompt(params: {
    niche: string;
    sceneType: string;
    description: string;
    productDescription?: string;
  }): string {
    const nicheTemplate = NICHE_TEMPLATES[params.niche as keyof typeof NICHE_TEMPLATES];
    const style = nicheTemplate?.promptStyle || 'professional';
    
    return `${params.description}, ${style}, cinematic, 4K, high quality${params.productDescription ? `, ${params.productDescription}` : ''}`;
  }

  /**
   * Generate caption for video
   */
  static generateCaption(params: {
    niche: string;
    productDescription?: string;
    sceneCount: number;
  }): string {
    const nicheTemplate = NICHE_TEMPLATES[params.niche as keyof typeof NICHE_TEMPLATES];
    const nicheName = nicheTemplate?.name?.replace(/^[^\s]+\s/, '') || 'Professional';
    
    const captions: Record<string, string[]> = {
      fnb: [
        '🔥 Craving satisfied! Who wants a bite? 👇',
        '😋 Fresh from the kitchen to your screen!',
        '✨ Taste the difference. Order now!',
      ],
      realestate: [
        '🏠 Your dream home awaits! DM for tour 📩',
        '✨ Luxury living at its finest.',
        '🔑 Ready to move in? Contact us today!',
      ],
      product: [
        '🛍️ Limited stock! Get yours now! 🔥',
        '✨ Game-changer alert! Link in bio 👆',
        '💯 Quality you can trust. Shop now!',
      ],
      car: [
        '🚗 Your dream ride is here! 💫',
        '🔥 Luxury meets performance. Book test drive!',
        '✨ Turn heads everywhere. Available now!',
      ],
      beauty: [
        '✨ Glow up in seconds! Try it yourself 💫',
        '💕 Self-care essentials. Link in bio!',
        '🔥 Transform your routine today!',
      ],
      services: [
        '💼 Expert solutions for your needs. DM us!',
        '✨ Professional service, guaranteed results.',
        '🎯 Let us help you succeed. Book now!',
      ],
    };

    const nicheCaptions = captions[params.niche] || captions.services;
    const baseCaption = nicheCaptions[Math.floor(Math.random() * nicheCaptions.length)];
    
    if (params.productDescription) {
      return `${params.productDescription}\n\n${baseCaption}`;
    }
    
    return baseCaption;
  }

  /**
   * Get storyboard template for niche
   */
  static getStoryboardTemplate(niche: string) {
    const nicheTemplate = NICHE_TEMPLATES[niche as keyof typeof NICHE_TEMPLATES];
    return nicheTemplate?.storyboardTemplate || [];
  }

  /**
   * Update storyboard (admin function)
   */
  static updateStoryboardTemplate(niche: string, scenes: Array<{ scene: number; duration: number; type: string; description: string }>) {
    if (NICHE_TEMPLATES[niche as keyof typeof NICHE_TEMPLATES]) {
      (NICHE_TEMPLATES[niche as keyof typeof NICHE_TEMPLATES] as any).storyboardTemplate = scenes;
    }
    return true;
  }

  static async processJob(jobId: string): Promise<void> {
    const video = await prisma.video.findUnique({ where: { jobId } });
    if (!video) {
      logger.error(`Video job not found: ${jobId}`);
      return;
    }

    try {
      await prisma.video.update({ where: { jobId }, data: { status: 'processing', progress: 10 } });
      
      const result = await processVideoJob(video);
      
      if (result.success) {
        await prisma.video.update({
          where: { jobId },
          data: {
            status: 'completed',
            progress: 100,
            videoUrl: result.videoUrl,
            thumbnailUrl: result.thumbnailUrl,
            completedAt: new Date(),
          },
        });
        logger.info(`Video job completed: ${jobId} via ${result.provider}`);
      } else {
        await prisma.video.update({
          where: { jobId },
          data: { status: 'failed', errorMessage: result.error },
        });
        logger.error(`Video job failed: ${jobId} - ${result.error}`);
      }
    } catch (error: any) {
      logger.error(`Video job error: ${jobId}`, error);
      await prisma.video.update({
        where: { jobId },
        data: { status: 'failed', errorMessage: error.message },
      });
    }
  }
}
