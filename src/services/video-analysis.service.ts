/**
 * Video Analysis Service
 *
 * Downloads a video URL, extracts frames with ffmpeg, sends to Gemini Vision
 * for storyboard / transcript / scene prompt extraction.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@/utils/logger';
import axios from 'axios';

const execAsync = promisify(exec);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface AnalyzedScene {
  scene: number;
  startTime: number;
  duration: number;
  description: string;
  prompt: string;
}

export interface VideoAnalysisResult {
  success: boolean;
  niche?: string;
  style?: string;
  totalDuration?: number;
  transcript?: string;
  storyboard?: AnalyzedScene[];
  keyFramePaths?: string[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a URL as base64 for Gemini inline_data.
 * Handles application/octet-stream by inferring MIME from URL or magic bytes.
 */
async function fetchMediaAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30_000,
  });

  let contentType: string = response.headers['content-type'] || 'video/mp4';

  if (
    contentType === 'application/octet-stream' ||
    (!contentType.startsWith('video/') && !contentType.startsWith('image/'))
  ) {
    if (url.includes('.mp4')) contentType = 'video/mp4';
    else if (url.includes('.webm')) contentType = 'video/webm';
    else if (url.includes('.mov')) contentType = 'video/quicktime';
    else if (url.includes('.jpg') || url.includes('.jpeg')) contentType = 'image/jpeg';
    else if (url.includes('.png')) contentType = 'image/png';
    else {
      const buf = Buffer.from(response.data);
      // MP4 ftyp box starts at offset 4
      const isMP4 =
        buf.length > 8 &&
        buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70;
      contentType = isMP4 ? 'video/mp4' : 'video/mp4';
    }
  }

  const base64 = Buffer.from(response.data).toString('base64');
  return { data: base64, mimeType: contentType };
}

/**
 * Extract JSON from a string that may contain markdown code fences or extra text.
 */
function extractJSON(text: string): string {
  // Strip ```json ... ``` fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  // Find first { ... } block
  const bare = text.match(/\{[\s\S]*\}/);
  if (bare) return bare[0];

  return text;
}

/**
 * Build a minimal fallback storyboard from a URL when Gemini is unavailable.
 */
function buildFallbackResult(videoUrl: string): VideoAnalysisResult {
  return {
    success: true,
    niche: 'general',
    style: 'unknown',
    totalDuration: 15,
    transcript: '',
    storyboard: [
      {
        scene: 1,
        startTime: 0,
        duration: 15,
        description: 'Full video content (analysis unavailable)',
        prompt: `cinematic video recreation based on source: ${videoUrl.slice(0, 80)}`,
      },
    ],
    keyFramePaths: [],
  };
}

// ---------------------------------------------------------------------------
// Main service
// ---------------------------------------------------------------------------

export class VideoAnalysisService {
  /**
   * Full pipeline: download → extract frames → Gemini analysis → return result.
   */
  static async analyze(videoUrl: string): Promise<VideoAnalysisResult> {
    const jobId = Date.now().toString();
    const tmpDir = '/tmp/videos';
    const framesDir = `/tmp/video_frames/${jobId}`;
    const tempPath = `${tmpDir}/analyze_${jobId}.mp4`;

    // Ensure directories exist
    for (const dir of [tmpDir, framesDir]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    // ── 1. Download video ──────────────────────────────────────────────────
    const isSocialPlatform = /tiktok\.com|instagram\.com|youtube\.com|youtu\.be|twitter\.com|x\.com|facebook\.com|fb\.watch|pinterest\.com|bilibili\.com/i.test(videoUrl);
    try {
      logger.info(`[VideoAnalysis] Downloading video (${isSocialPlatform ? 'yt-dlp' : 'wget'}): ${videoUrl.slice(0, 80)}`);
      if (isSocialPlatform) {
        // Use yt-dlp for social platforms (handles auth-less public videos)
        await execAsync(
          `yt-dlp --no-playlist -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" ` +
          `--merge-output-format mp4 -o "${tempPath}" "${videoUrl}"`,
          { timeout: 120_000 },
        );
      } else {
        await execAsync(`wget -q -O "${tempPath}" "${videoUrl}"`, { timeout: 60_000 });
      }
      if (!fs.existsSync(tempPath) || fs.statSync(tempPath).size === 0) {
        throw new Error('Downloaded file is empty');
      }
    } catch (err: any) {
      logger.warn(`[VideoAnalysis] Download failed: ${err.message}`);
      if (!GEMINI_API_KEY) return buildFallbackResult(videoUrl);
      // Try to proceed with Gemini using the original URL directly
      return VideoAnalysisService._analyzeViaUrl(videoUrl);
    }

    // ── 2. Get duration ────────────────────────────────────────────────────
    let totalDuration = 15;
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of csv=p=0 "${tempPath}"`,
        { timeout: 15_000 },
      );
      const parsed = parseFloat(stdout.trim());
      if (!isNaN(parsed)) totalDuration = Math.round(parsed);
    } catch (err: any) {
      logger.warn(`[VideoAnalysis] ffprobe failed: ${err.message}`);
    }

    // ── 3. Extract frames (1 per 5s, max 8) ───────────────────────────────
    const keyFramePaths: string[] = [];
    try {
      await execAsync(
        `ffmpeg -y -i "${tempPath}" -vf "fps=1/5,scale=640:-1" -q:v 2 "${framesDir}/frame_%03d.jpg"`,
        { timeout: 15_000 },
      );
      const files = fs.readdirSync(framesDir)
        .filter(f => f.endsWith('.jpg'))
        .sort()
        .slice(0, 8)
        .map(f => path.join(framesDir, f));
      keyFramePaths.push(...files);
    } catch (err: any) {
      logger.warn(`[VideoAnalysis] ffmpeg frame extraction failed: ${err.message}`);
    }

    // ── 4. Gemini analysis ─────────────────────────────────────────────────
    let analysisResult: VideoAnalysisResult;
    if (!GEMINI_API_KEY) {
      logger.warn('[VideoAnalysis] GEMINI_API_KEY not set — using fallback result');
      analysisResult = buildFallbackResult(videoUrl);
      analysisResult.totalDuration = totalDuration;
      analysisResult.keyFramePaths = keyFramePaths;
    } else {
      analysisResult = await VideoAnalysisService._callGemini(tempPath, videoUrl, keyFramePaths);
      // Merge real duration from ffprobe if Gemini didn't parse it
      if (!analysisResult.totalDuration) analysisResult.totalDuration = totalDuration;
      analysisResult.keyFramePaths = keyFramePaths;
    }

    // ── 5. Cleanup temp video (keep frames for caller) ─────────────────────
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {
      // Non-fatal
    }

    return analysisResult;
  }

  // ── Private: call Gemini with the local video file as base64 ────────────

  private static async _callGemini(
    tempPath: string,
    originalUrl: string,
    keyFramePaths: string[],
  ): Promise<VideoAnalysisResult> {
    const systemPrompt = `Analyze this video carefully and return ONLY a valid JSON object (no markdown, no explanation):
{
  "niche": "one of: fitness, food, travel, business, fashion, education, tech, beauty, real_estate, automotive, general",
  "style": "brief visual style description (lighting, color, mood, camera work)",
  "totalDuration": <number in seconds>,
  "transcript": "exact spoken words verbatim (empty string if no speech)",
  "storyboard": [
    {
      "scene": 1,
      "startTime": 0,
      "duration": <seconds>,
      "description": "detailed visual description of what happens",
      "prompt": "cinematic AI video generation prompt for recreating this scene"
    }
  ]
}
Break the video into 1 scene per ~5 seconds (max 8 scenes total). Make each prompt detailed enough to regenerate the scene independently.`;

    // Try to send video as base64 first; fall back to URL-as-text if file missing
    let inlinePart: Record<string, unknown>;
    try {
      if (fs.existsSync(tempPath)) {
        const { data, mimeType } = await fetchMediaAsBase64(
          `file://${tempPath}`,
        ).catch(async () => {
          // file:// not supported by axios — read directly
          const buf = fs.readFileSync(tempPath);
          return { data: buf.toString('base64'), mimeType: 'video/mp4' };
        });
        inlinePart = { inline_data: { mime_type: mimeType, data } };
      } else {
        throw new Error('temp file missing');
      }
    } catch {
      // Fall back: use first extracted frame if available, else text description
      if (keyFramePaths.length > 0) {
        const buf = fs.readFileSync(keyFramePaths[0]);
        inlinePart = {
          inline_data: {
            mime_type: 'image/jpeg',
            data: buf.toString('base64'),
          },
        };
      } else {
        inlinePart = { text: `Video URL: ${originalUrl}` };
      }
    }

    const requestBody = {
      contents: [
        {
          parts: [
            inlinePart,
            { text: systemPrompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    };

    let responseText = '';
    try {
      const response = await axios.post(GEMINI_VISION_URL, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60_000,
      });
      responseText =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err: any) {
      logger.error(`[VideoAnalysis] Gemini API error: ${err.message}`);
      return { success: false, error: `Gemini API error: ${err.message}` };
    }

    // ── Parse JSON ──────────────────────────────────────────────────────────
    try {
      const jsonStr = extractJSON(responseText);
      const parsed = JSON.parse(jsonStr);

      const storyboard: AnalyzedScene[] = (parsed.storyboard || [])
        .slice(0, 8)
        .map((s: any, idx: number) => ({
          scene: s.scene ?? idx + 1,
          startTime: s.startTime ?? 0,
          duration: s.duration ?? 5,
          description: s.description ?? '',
          prompt: s.prompt ?? '',
        }));

      if (!storyboard.length) {
        return { success: false, error: 'Could not parse analysis' };
      }

      return {
        success: true,
        niche: parsed.niche || 'general',
        style: parsed.style || '',
        totalDuration: parsed.totalDuration || undefined,
        transcript: parsed.transcript || '',
        storyboard,
      };
    } catch (parseErr: any) {
      logger.warn(`[VideoAnalysis] JSON parse failed: ${parseErr.message}`);
      // Regex fallback
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          const storyboard: AnalyzedScene[] = (parsed.storyboard || [])
            .slice(0, 8)
            .map((s: any, idx: number) => ({
              scene: s.scene ?? idx + 1,
              startTime: s.startTime ?? 0,
              duration: s.duration ?? 5,
              description: s.description ?? '',
              prompt: s.prompt ?? '',
            }));
          if (storyboard.length) {
            return {
              success: true,
              niche: parsed.niche || 'general',
              style: parsed.style || '',
              totalDuration: parsed.totalDuration || undefined,
              transcript: parsed.transcript || '',
              storyboard,
            };
          }
        } catch {
          // fall through
        }
      }
      return { success: false, error: 'Could not parse analysis' };
    }
  }

  // ── Private: analyze via direct URL (when download failed) ────────────

  private static async _analyzeViaUrl(videoUrl: string): Promise<VideoAnalysisResult> {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text:
                `Analyze this video URL (assume you can access it): ${videoUrl}\n\n` +
                `Return ONLY a valid JSON object:\n` +
                `{"niche":"general","style":"unknown","totalDuration":15,"transcript":"","storyboard":[{"scene":1,"startTime":0,"duration":15,"description":"Full video content","prompt":"cinematic video recreation"}]}`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
    };

    try {
      const response = await axios.post(GEMINI_VISION_URL, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30_000,
      });
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonStr = extractJSON(text);
      const parsed = JSON.parse(jsonStr);
      const storyboard: AnalyzedScene[] = (parsed.storyboard || [])
        .slice(0, 8)
        .map((s: any, idx: number) => ({
          scene: s.scene ?? idx + 1,
          startTime: s.startTime ?? 0,
          duration: s.duration ?? 5,
          description: s.description ?? '',
          prompt: s.prompt ?? '',
        }));
      return {
        success: true,
        niche: parsed.niche || 'general',
        style: parsed.style || '',
        totalDuration: parsed.totalDuration || 15,
        transcript: parsed.transcript || '',
        storyboard: storyboard.length ? storyboard : buildFallbackResult(videoUrl).storyboard,
        keyFramePaths: [],
      };
    } catch {
      return buildFallbackResult(videoUrl);
    }
  }
}
