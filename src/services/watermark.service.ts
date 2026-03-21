/**
 * Watermark Detection & Removal Service
 *
 * Uses Gemini Vision (free) for detection and FFmpeg delogo (free) for removal.
 * Zero external cost — no paid APIs needed.
 *
 * Usage:
 *   - Pre-process reference images before img2img generation
 *   - Post-process video output from providers that add watermarks
 */

import { logger } from '@/utils/logger';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const WORK_DIR = process.env.VIDEO_DIR || '/tmp/videos';

export interface WatermarkDetection {
  hasWatermark: boolean;
  regions: WatermarkRegion[];
  confidence: number;
}

export interface WatermarkRegion {
  x: number;      // percentage from left (0-100)
  y: number;      // percentage from top (0-100)
  width: number;  // percentage of image width (0-100)
  height: number; // percentage of image height (0-100)
  type: string;   // 'text' | 'logo' | 'overlay'
}

export class WatermarkService {

  /**
   * Detect watermarks in an image using Gemini Vision (free).
   * Returns bounding box regions as percentages of image dimensions.
   */
  static async detect(imageUrl: string): Promise<WatermarkDetection> {
    if (!GEMINI_API_KEY) {
      return { hasWatermark: false, regions: [], confidence: 0 };
    }

    try {
      // Download image as base64
      const imgResp = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
      const base64 = Buffer.from(imgResp.data).toString('base64');
      let mimeType = imgResp.headers['content-type'] || 'image/jpeg';
      if (!mimeType.startsWith('image/')) mimeType = 'image/jpeg';

      const response = await axios.post(GEMINI_VISION_URL, {
        contents: [{
          parts: [
            {
              text: `Analyze this image for watermarks, logos, or text overlays that are NOT part of the main content.

If watermarks exist, respond in this EXACT JSON format:
{"hasWatermark": true, "confidence": 0.9, "regions": [{"x": 70, "y": 90, "width": 25, "height": 8, "type": "text"}]}

Where x, y, width, height are PERCENTAGES of the image dimensions (0-100).
x = distance from left edge, y = distance from top edge.

If NO watermarks exist, respond: {"hasWatermark": false, "confidence": 0.9, "regions": []}

Common watermark locations: bottom-right corner, center of image, bottom strip.
Only report actual watermarks/logos, NOT text that is part of the product/scene.
Respond with ONLY the JSON, no other text.`,
            },
            {
              inline_data: { mime_type: mimeType, data: base64 },
            },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse JSON from response (handle markdown code blocks)
      const jsonStr = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const result = JSON.parse(jsonStr);

      logger.info(`🔍 Watermark detection: ${result.hasWatermark ? 'FOUND' : 'clean'} (confidence: ${result.confidence})`);
      return {
        hasWatermark: !!result.hasWatermark,
        regions: Array.isArray(result.regions) ? result.regions : [],
        confidence: result.confidence || 0,
      };
    } catch (err: any) {
      logger.warn(`Watermark detection failed: ${err.message}`);
      return { hasWatermark: false, regions: [], confidence: 0 };
    }
  }

  /**
   * Remove watermarks from an image using FFmpeg delogo filter.
   * Returns path to cleaned image file.
   */
  static async removeFromImage(
    inputPath: string,
    regions: WatermarkRegion[],
  ): Promise<string> {
    if (regions.length === 0) return inputPath;

    // Get image dimensions
    const { stdout: probeOut } = await exec(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${inputPath}"`,
    );
    const [imgW, imgH] = probeOut.trim().split(',').map(Number);
    if (!imgW || !imgH) return inputPath;

    // Build delogo filter chain for each region
    const filters = regions.map((r) => {
      const x = Math.max(0, Math.floor((r.x / 100) * imgW));
      const y = Math.max(0, Math.floor((r.y / 100) * imgH));
      const w = Math.min(imgW - x, Math.max(10, Math.floor((r.width / 100) * imgW)));
      const h = Math.min(imgH - y, Math.max(10, Math.floor((r.height / 100) * imgH)));
      return `delogo=x=${x}:y=${y}:w=${w}:h=${h}`;
    });

    const outputPath = inputPath.replace(/(\.\w+)$/, '_clean$1');
    const filterStr = filters.join(',');

    await exec(`ffmpeg -y -i "${inputPath}" -vf "${filterStr}" "${outputPath}" 2>/dev/null`);

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      logger.info(`🧹 Watermark removed from image: ${outputPath}`);
      return outputPath;
    }
    return inputPath; // Fallback to original
  }

  /**
   * Remove watermarks from a video using FFmpeg delogo filter.
   * Returns path to cleaned video file.
   */
  static async removeFromVideo(
    inputPath: string,
    regions: WatermarkRegion[],
  ): Promise<string> {
    if (regions.length === 0) return inputPath;

    // Get video dimensions
    const { stdout: probeOut } = await exec(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${inputPath}"`,
    );
    const [vidW, vidH] = probeOut.trim().split(',').map(Number);
    if (!vidW || !vidH) return inputPath;

    const filters = regions.map((r) => {
      const x = Math.max(0, Math.floor((r.x / 100) * vidW));
      const y = Math.max(0, Math.floor((r.y / 100) * vidH));
      const w = Math.min(vidW - x, Math.max(10, Math.floor((r.width / 100) * vidW)));
      const h = Math.min(vidH - y, Math.max(10, Math.floor((r.height / 100) * vidH)));
      return `delogo=x=${x}:y=${y}:w=${w}:h=${h}`;
    });

    const outputPath = inputPath.replace(/(\.\w+)$/, '_clean$1');
    const filterStr = filters.join(',');

    await exec(
      `ffmpeg -y -i "${inputPath}" -vf "${filterStr}" -c:a copy "${outputPath}" 2>/dev/null`,
      { timeout: 120000 },
    );

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      logger.info(`🧹 Watermark removed from video: ${outputPath}`);
      return outputPath;
    }
    return inputPath;
  }

  /**
   * Full pipeline: detect + remove watermark from an image URL.
   * Downloads the image, cleans it, returns the cleaned local path.
   * If no watermark found, returns null (use original).
   */
  static async cleanImage(imageUrl: string): Promise<string | null> {
    try {
      const detection = await this.detect(imageUrl);
      if (!detection.hasWatermark || detection.regions.length === 0) {
        return null; // No watermark, use original
      }

      // Download image to temp file
      if (!fs.existsSync(WORK_DIR)) fs.mkdirSync(WORK_DIR, { recursive: true });
      const tmpFile = path.join(WORK_DIR, `wm_${Date.now()}.jpg`);
      const imgResp = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
      fs.writeFileSync(tmpFile, Buffer.from(imgResp.data));

      const cleanedPath = await this.removeFromImage(tmpFile, detection.regions);

      // Cleanup temp file if different from output
      if (cleanedPath !== tmpFile && fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }

      return cleanedPath;
    } catch (err: any) {
      logger.warn(`Watermark clean failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Full pipeline: detect + remove watermark from a video file.
   * Returns the cleaned path, or the original if no watermark.
   */
  static async cleanVideo(videoPath: string): Promise<string> {
    try {
      // Extract a frame from the middle to detect watermarks
      const framePath = path.join(WORK_DIR, `wm_frame_${Date.now()}.jpg`);
      await exec(
        `ffmpeg -y -i "${videoPath}" -vf "select=eq(n\\,30)" -frames:v 1 "${framePath}" 2>/dev/null`,
      );

      if (!fs.existsSync(framePath)) return videoPath;

      // Detect watermark on the extracted frame
      const frameBase64 = fs.readFileSync(framePath).toString('base64');
      const detection = await this.detectFromBase64(frameBase64, 'image/jpeg');

      // Cleanup frame
      fs.unlinkSync(framePath);

      if (!detection.hasWatermark || detection.regions.length === 0) {
        return videoPath;
      }

      logger.info(`🔍 Watermark detected in video, removing ${detection.regions.length} region(s)...`);
      return this.removeFromVideo(videoPath, detection.regions);
    } catch (err: any) {
      logger.warn(`Video watermark clean failed: ${err.message}`);
      return videoPath;
    }
  }

  /**
   * Detect watermark from base64 image data (avoids re-download).
   */
  private static async detectFromBase64(base64: string, mimeType: string): Promise<WatermarkDetection> {
    if (!GEMINI_API_KEY) {
      return { hasWatermark: false, regions: [], confidence: 0 };
    }

    try {
      const response = await axios.post(GEMINI_VISION_URL, {
        contents: [{
          parts: [
            {
              text: `Does this image have any watermarks, logos, or text overlays that are NOT part of the main content? Respond in JSON: {"hasWatermark": true/false, "confidence": 0.0-1.0, "regions": [{"x": %, "y": %, "width": %, "height": %, "type": "text|logo|overlay"}]}. x/y/width/height are percentages of image size. Only JSON, no other text.`,
            },
            {
              inline_data: { mime_type: mimeType, data: base64 },
            },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000,
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonStr = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const result = JSON.parse(jsonStr);

      return {
        hasWatermark: !!result.hasWatermark,
        regions: Array.isArray(result.regions) ? result.regions : [],
        confidence: result.confidence || 0,
      };
    } catch {
      return { hasWatermark: false, regions: [], confidence: 0 };
    }
  }
}
