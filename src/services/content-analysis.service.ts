/**
 * Content Analysis Service
 *
 * Handles content cloning, prompt extraction, and viral research
 * Uses Gemini Vision API for media analysis
 */

import { logger } from '@/utils/logger';
import axios from 'axios';
import { trackTokens } from '@/services/token-tracker.service';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface AnalysisResult {
  success: boolean;
  prompt?: string;
  style?: string;
  elements?: string[];
  storyboard?: Array<{ scene: number; duration: number; description: string }>;
  error?: string;
}

export interface ViralTrend {
  niche: string;
  patterns: string[];
  hashtags: string[];
  audioTypes: string[];
  editStyles: string[];
  topPerformers: string[];
}

/**
 * Fetch media as base64 for Gemini inline_data
 */
async function fetchMediaAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });

  // Telegram often returns 'application/octet-stream' — detect real type from URL or magic bytes
  let contentType = response.headers['content-type'] || 'image/jpeg';
  if (contentType === 'application/octet-stream' || !contentType.startsWith('image/')) {
    // Infer from URL extension
    if (url.includes('.jpg') || url.includes('.jpeg')) contentType = 'image/jpeg';
    else if (url.includes('.png')) contentType = 'image/png';
    else if (url.includes('.webp')) contentType = 'image/webp';
    else if (url.includes('.gif')) contentType = 'image/gif';
    else if (url.includes('.mp4')) contentType = 'video/mp4';
    else {
      // Check magic bytes
      const buf = Buffer.from(response.data);
      if (buf[0] === 0xFF && buf[1] === 0xD8) contentType = 'image/jpeg';
      else if (buf[0] === 0x89 && buf[1] === 0x50) contentType = 'image/png';
      else contentType = 'image/jpeg'; // safe default for Gemini
    }
  }

  const base64 = Buffer.from(response.data).toString('base64');
  return { data: base64, mimeType: contentType };
}

/**
 * Parse Gemini response text into structured AnalysisResult
 */
function parseGeminiResponse(text: string): AnalysisResult {
  // Extract style from the response
  const styleMatch = text.match(/(?:style|aesthetic|mood)[:\s]*([^\n.]+)/i);
  const style = styleMatch ? styleMatch[1].trim() : 'commercial';

  // Extract elements - look for list items or comma-separated keywords
  const elements: string[] = [];
  const listMatches = text.match(/[-*]\s*(.+)/g);
  if (listMatches) {
    listMatches.slice(0, 6).forEach(item => {
      elements.push(item.replace(/^[-*]\s*/, '').trim());
    });
  }

  if (elements.length === 0) {
    // Fallback: extract key phrases
    const sentences = text.split(/[.\n]/).filter(s => s.trim().length > 10);
    sentences.slice(0, 5).forEach(s => elements.push(s.trim()));
  }

  return {
    success: true,
    prompt: text.trim(),
    style,
    elements,
  };
}

/**
 * Content Analysis and Cloning Service
 */
export class ContentAnalysisService {

  /**
   * Extract prompt from video/image using Gemini Vision API
   */
  static async extractPrompt(mediaUrl: string, mediaType: 'video' | 'image'): Promise<AnalysisResult> {
    try {
      logger.info(`Extracting prompt from ${mediaType}: ${mediaUrl.slice(0, 50)}...`);

      if (!GEMINI_API_KEY) {
        logger.warn('GEMINI_API_KEY not set, returning fallback response');
        return this.getFallbackResult(mediaType);
      }

      const systemPrompt = mediaType === 'image'
        ? 'Analyze this image and describe it in detail as an AI image generation prompt. Include: subject, environment, lighting, camera angle, style, and mood. Be specific about colors, textures, and composition. Output only the prompt text.'
        : 'Analyze this video in detail. Describe:\n\nVISUAL: subject, scenes, camera movements, transitions, lighting, color grading, effects\nAUDIO: voiceover text/transcript, background music type, sound effects\nSTORYBOARD: break down into individual scenes with timing\n\nOutput as a comprehensive recreation prompt.';

      // Fetch media and convert to base64
      const media = await fetchMediaAsBase64(mediaUrl);

      const requestBody = {
        contents: [{
          parts: [
            { text: systemPrompt },
            {
              inline_data: {
                mime_type: media.mimeType,
                data: media.data,
              },
            },
          ],
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      };

      const response = await axios.post(GEMINI_VISION_URL, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });

      const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        logger.warn('Gemini returned empty response');
        return this.getFallbackResult(mediaType);
      }

      const usageMeta = response.data?.usageMetadata;
      if (usageMeta) {
        trackTokens({ provider: 'gemini-direct', model: 'gemini-2.5-flash', service: 'content_analysis', promptTokens: usageMeta.promptTokenCount || 0, completionTokens: usageMeta.candidatesTokenCount || 0 }).catch(() => {});
      }

      return parseGeminiResponse(generatedText);

    } catch (error: any) {
      logger.error('Prompt extraction failed:', error.message);

      // If API fails, return fallback instead of crashing
      if (error.response?.status === 400 || error.response?.status === 403) {
        logger.warn('Gemini API error, returning fallback');
        return this.getFallbackResult(mediaType);
      }

      return {
        success: false,
        error: error.message || 'Failed to extract prompt',
      };
    }
  }

  /**
   * Clone video style using Gemini Vision analysis
   */
  static async cloneVideo(sourceUrl: string): Promise<AnalysisResult> {
    try {
      logger.info(`Cloning video: ${sourceUrl.slice(0, 50)}...`);

      if (!GEMINI_API_KEY) {
        logger.warn('GEMINI_API_KEY not set, returning fallback response');
        const fallback = this.getFallbackResult('video');
        fallback.prompt = `Clone style: ${fallback.prompt}`;
        return fallback;
      }

      const media = await fetchMediaAsBase64(sourceUrl);

      const systemPrompt =
        'Analyze this video/media and create a detailed recreation prompt. Describe:\n' +
        '1. Visual style (cinematography, color grading, lighting)\n' +
        '2. Scene composition and camera angles\n' +
        '3. Transitions and editing techniques\n' +
        '4. Subject and action\n' +
        '5. Mood and atmosphere\n' +
        '6. Text overlays or effects if visible\n' +
        '7. Audio: voiceover transcript, background music type, sound effects\n\n' +
        'IMPORTANT: Also break down the video into individual scenes with timing.\n' +
        'After the prompt, output a STORYBOARD section in this exact format:\n' +
        'STORYBOARD:\n' +
        'Scene 1 | 3s | Description of scene 1\n' +
        'Scene 2 | 5s | Description of scene 2\n' +
        '(continue for all scenes)\n\n' +
        'First output the comprehensive recreation prompt, then the STORYBOARD section.';

      const requestBody = {
        contents: [{
          parts: [
            { text: systemPrompt },
            {
              inline_data: {
                mime_type: media.mimeType,
                data: media.data,
              },
            },
          ],
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      };

      const response = await axios.post(GEMINI_VISION_URL, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });

      const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        const fallback = this.getFallbackResult('video');
        fallback.prompt = `Clone style: ${fallback.prompt}`;
        return fallback;
      }

      const result = parseGeminiResponse(generatedText);

      // Parse storyboard from the response
      const storyboard = this.parseStoryboard(generatedText);
      if (storyboard.length > 0) {
        result.storyboard = storyboard;
      }

      return result;

    } catch (error: any) {
      logger.error('Video cloning failed:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to clone video',
      };
    }
  }

  /**
   * Clone image style using Gemini Vision analysis
   */
  static async cloneImage(sourceUrl: string): Promise<AnalysisResult> {
    try {
      logger.info(`Cloning image: ${sourceUrl.slice(0, 50)}...`);

      if (!GEMINI_API_KEY) {
        logger.warn('GEMINI_API_KEY not set, returning fallback response');
        const fallback = this.getFallbackResult('image');
        fallback.prompt = `Clone style: ${fallback.prompt}`;
        return fallback;
      }

      const media = await fetchMediaAsBase64(sourceUrl);

      const systemPrompt =
        'Analyze this image and create a detailed recreation prompt. Describe:\n' +
        '1. Subject and composition\n' +
        '2. Lighting setup (direction, quality, color temperature)\n' +
        '3. Color palette and grading\n' +
        '4. Camera angle and lens characteristics\n' +
        '5. Background and environment\n' +
        '6. Art style and aesthetic\n' +
        '7. Mood and atmosphere\n\n' +
        'Format as a single comprehensive AI image generation prompt.';

      const requestBody = {
        contents: [{
          parts: [
            { text: systemPrompt },
            {
              inline_data: {
                mime_type: media.mimeType,
                data: media.data,
              },
            },
          ],
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      };

      const response = await axios.post(GEMINI_VISION_URL, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });

      const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        const fallback = this.getFallbackResult('image');
        fallback.prompt = `Clone style: ${fallback.prompt}`;
        return fallback;
      }

      return parseGeminiResponse(generatedText);

    } catch (error: any) {
      const detail = error.response?.data ? JSON.stringify(error.response.data).slice(0, 300) : error.message;
      logger.error(`Image cloning failed: ${detail}`);
      return {
        success: false,
        error: error.message || 'Failed to clone image',
      };
    }
  }

  /**
   * Parse storyboard section from Gemini response text
   */
  private static parseStoryboard(text: string): Array<{ scene: number; duration: number; description: string }> {
    const storyboard: Array<{ scene: number; duration: number; description: string }> = [];

    // Look for STORYBOARD: section
    const storyboardMatch = text.match(/STORYBOARD[:\s]*\n([\s\S]+?)(?:\n\n|$)/i);
    if (!storyboardMatch) return storyboard;

    const lines = storyboardMatch[1].split('\n').filter(l => l.trim());
    for (const line of lines) {
      // Match pattern: Scene N | Xs | Description
      const match = line.match(/Scene\s*(\d+)\s*\|\s*(\d+)s?\s*\|\s*(.+)/i);
      if (match) {
        storyboard.push({
          scene: parseInt(match[1], 10),
          duration: parseInt(match[2], 10),
          description: match[3].trim(),
        });
      }
    }

    return storyboard;
  }

  /**
   * Fallback result when API key is missing or API fails
   */
  private static getFallbackResult(mediaType: 'video' | 'image'): AnalysisResult {
    const templates: Record<string, string> = {
      video: 'Create a dynamic marketing video with quick cuts, engaging transitions, and professional editing. Include product showcase, lifestyle shots, and call-to-action. Use trending audio and text overlays.',
      image: 'Professional product photography with studio lighting, clean composition, and commercial quality. Sharp focus, vibrant colors, and premium aesthetic.',
    };

    return {
      success: true,
      prompt: templates[mediaType],
      style: 'commercial',
      elements: [
        'Professional lighting',
        'Clean composition',
        'High-quality visuals',
        'Engaging content',
        'Commercial aesthetic',
      ],
    };
  }

  /**
   * Get viral trends for niche
   */
  static async getViralTrends(niche: string): Promise<ViralTrend> {
    logger.info(`Fetching viral trends for: ${niche}`);

    // Trend data (would be dynamic in production)
    const trendData: Record<string, ViralTrend> = {
      viral: {
        niche: 'viral',
        patterns: [
          'Quick cuts (0.5-1s per scene)',
          'Beat-matching edits',
          'ASMR audio layer',
          'Text-to-speech overlay (Female voice)',
          'Hook in first 3 seconds',
          'Surprise ending',
        ],
        hashtags: ['#fyp', '#viral', '#trending', '#foryou', '#viral2026'],
        audioTypes: ['Trending sounds', 'ASMR', 'Text-to-speech', 'Background music'],
        editStyles: ['Fast-paced', 'Smooth transitions', 'Dynamic zoom', 'Text overlays'],
        topPerformers: ['@user1', '@user2', '@user3'],
      },
      fnb: {
        niche: 'fnb',
        patterns: [
          'Food porn shots',
          'Steam/smoke effects',
          'Close-up texture shots',
          'Before/after reveal',
          'ASMR eating sounds',
          'Recipe steps',
        ],
        hashtags: ['#food', '#foodporn', '#yummy', '#delicious', '#foodie'],
        audioTypes: ['ASMR', 'Cooking sounds', 'Upbeat music', 'Voice-over'],
        editStyles: ['Slow motion', 'Top-down shots', 'Close-ups', 'Time-lapse'],
        topPerformers: ['@foodie1', '@chef2', '@restaurant3'],
      },
      realestate: {
        niche: 'realestate',
        patterns: [
          'Room tours',
          'Drone shots',
          'Before/after renovation',
          'Luxury amenities showcase',
          'Walkthrough style',
          'Ambient music',
        ],
        hashtags: ['#realestate', '#property', '#home', '#luxury', '#interior'],
        audioTypes: ['Ambient music', 'Voice-over', 'Nature sounds', 'Classical'],
        editStyles: ['Smooth pans', 'Wide angles', 'Steady cam', 'Professional'],
        topPerformers: ['@realtor1', '@property2', '@luxury3'],
      },
      ecom: {
        niche: 'ecom',
        patterns: [
          'Product unboxing',
          'Feature highlights',
          'User testimonials',
          'Before/after comparison',
          'Discount urgency',
          'Call-to-action',
        ],
        hashtags: ['#product', '#shopping', '#deal', '#sale', '#musthave'],
        audioTypes: ['Upbeat music', 'Voice-over', 'ASMR', 'Trending sounds'],
        editStyles: ['Product focus', 'Lifestyle shots', 'Quick cuts', 'Text overlays'],
        topPerformers: ['@seller1', '@brand2', '@shop3'],
      },
    };

    return trendData[niche] || trendData.viral;
  }

  /**
   * Generate storyboard from analysis
   */
  static async generateStoryboard(niche: string, duration: number): Promise<any> {
    const _scenes = Math.ceil(duration / 5); // 5 seconds per scene

    const storyboardTemplates: Record<string, any> = {
      product: {
        scenes: [
          { time: '0-3s', description: 'Hook: Product reveal with dramatic lighting', text: 'Wait for it...' },
          { time: '3-8s', description: 'Feature 1: Close-up of key feature', text: 'Feature highlight' },
          { time: '8-13s', description: 'Feature 2: Different angle/use case', text: 'Versatile design' },
          { time: '13-18s', description: 'Lifestyle: Product in real-world setting', text: 'Perfect for...' },
          { time: '18-25s', description: 'Social proof: Testimonials/reviews', text: '5-star reviews' },
          { time: '25-30s', description: 'CTA: Price + urgency + link', text: 'Limited offer! Link in bio' },
        ],
        caption: 'Check out this amazing product! Limited time offer. Link in bio! #product #musthave #viral',
      },
      fnb: {
        scenes: [
          { time: '0-3s', description: 'Hook: Appetizing food shot', text: 'This is NOT what you think...' },
          { time: '3-8s', description: 'Preparation: Cooking process', text: 'Made fresh daily' },
          { time: '8-13s', description: 'Steam/close-up: Texture and details', text: 'Sizzling hot!' },
          { time: '13-18s', description: 'Plating: Final presentation', text: 'Restaurant quality' },
          { time: '18-25s', description: 'Eating: Satisfaction/ASMR', text: 'So delicious!' },
          { time: '25-30s', description: 'CTA: Location + hours', text: 'Visit us today!' },
        ],
        caption: 'You HAVE to try this! Best [food] in town! Location in bio #food #foodie #yummy',
      },
    };

    return storyboardTemplates[niche] || storyboardTemplates.product;
  }
}
