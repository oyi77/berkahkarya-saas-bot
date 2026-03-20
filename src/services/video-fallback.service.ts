/**
 * Video Fallback Service — Multi-provider video generation with real fallback chain.
 *
 * Priority chain (all 9 providers):
 *   1. GeminiGen (grok-3, supports ref image + extend)
 *   2. Fal.ai (kling-video / minimax)
 *   3. SiliconFlow (Wan-AI video)
 *   4. XAI (via GeminiGen proxy or direct xAI API)
 *   5. LaoZhang (OpenAI-compatible, sora_video2)
 *   6. EvoLink (wan2.5-text-to-video, async polling)
 *   7. Hypereal (kling-3-0-std-t2v, async polling)
 *   8. BytePlus Seedance (via AIML API)
 *   9. Kie.ai (runway, async polling)
 *   -> Refund on all-fail
 *
 * Each provider is tried in order with circuit breaker checks.
 * Reference images are passed where supported.
 */

import { logger } from '@/utils/logger';
import { CircuitBreaker } from './circuit-breaker.service';
import { ProviderRouter } from './provider-router.service';
import { PromptEngine } from '@/config/prompt-engine';
import { AIPromptOptimizer } from './ai-prompt-optimizer.service';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

// ── Provider Keys ──
const GEMINIGEN_API_KEY = process.env.GEMINIGEN_API_KEY || '';
const GEMINIGEN_API_BASE = 'https://api.geminigen.ai/uapi/v1';
const FALAI_API_KEY = process.env.FALAI_API_KEY || '';
const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || '';
const XAI_API_KEY = process.env.XAI_API_KEY || '';
const LAOZHANG_API_KEY = process.env.LAOZHANG_API_KEY || '';
const EVOLINK_API_KEY = process.env.EVOLINK_API_KEY || '';
const HYPEREAL_API_KEY = process.env.HYPEREAL_API_KEY || '';
const BYTEPLUS_API_KEY = process.env.BYTEPLUS_API_KEY || '';
const KIE_API_KEY = process.env.KIE_API_KEY || '';

export interface VideoFallbackParams {
  prompt: string;
  duration: number;
  aspectRatio: string;
  style?: string;
  niche?: string;
  referenceImage?: string | null;
}

export interface VideoFallbackResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  jobId?: string;
  error?: string;
  provider?: string;
}

// ── Provider type ──
interface VideoProvider {
  key: string;
  name: string;
  enabled: boolean;
  supportsRefImage: boolean;
  generate: (params: VideoFallbackParams) => Promise<VideoFallbackResult>;
}

// ── Helpers ──

const POLL_INTERVAL = 5000;
const POLL_MAX_ATTEMPTS = 60;

function mapAspectRatio(ratio: string): string {
  const map: Record<string, string> = { '9:16': 'portrait', '16:9': 'landscape', '1:1': 'square' };
  return map[ratio] || 'portrait';
}

function mapAspectRatioSimple(ratio: string): string {
  if (ratio === '9:16') return '9:16';
  if (ratio === '1:1') return '1:1';
  return '16:9';
}

function readRefImageBase64(refPath: string): string | null {
  if (refPath && fs.existsSync(refPath) && fs.statSync(refPath).size > 0) {
    return `data:image/jpeg;base64,${fs.readFileSync(refPath).toString('base64')}`;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ── Provider implementations ──

/** Tier 1: GeminiGen — grok-3 model */
async function generateViaGeminiGen(params: VideoFallbackParams): Promise<VideoFallbackResult> {
  const formData = new FormData();
  formData.append('prompt', params.prompt);
  formData.append('model', 'grok-3');

  const allowedDurations = [6, 10, 15];
  const duration = allowedDurations.reduce((prev, curr) =>
    Math.abs(curr - params.duration) < Math.abs(prev - params.duration) ? curr : prev
  , allowedDurations[0]);
  formData.append('duration', duration.toString());

  formData.append('aspect_ratio', mapAspectRatio(params.aspectRatio));

  if (params.referenceImage && fs.existsSync(params.referenceImage) && fs.statSync(params.referenceImage).size > 0) {
    formData.append('ref_image', fs.readFileSync(params.referenceImage), {
      filename: path.basename(params.referenceImage),
      contentType: 'image/jpeg',
    });
  }

  const response = await axios.post(`${GEMINIGEN_API_BASE}/video-gen/grok`, formData, {
    headers: { 'x-api-key': GEMINIGEN_API_KEY, ...formData.getHeaders() },
    timeout: 30000,
  });

  const { uuid } = response.data;
  logger.info(`GeminiGen video started: ${uuid}`);

  // Poll
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const poll = await axios.get(`${GEMINIGEN_API_BASE}/history/${uuid}`, {
      headers: { 'x-api-key': GEMINIGEN_API_KEY },
      timeout: 10000,
    });
    const { status: s, generated_video, error_message } = poll.data;
    if (s === 2 && generated_video?.length > 0) {
      const videoUrl = generated_video[0].video_url || generated_video[0].video_uri;
      return { success: true, videoUrl, jobId: uuid, provider: 'geminigen' };
    }
    if (s === 3) throw new Error(error_message || 'GeminiGen generation failed');
    await sleep(POLL_INTERVAL);
  }
  throw new Error('GeminiGen poll timeout');
}

/** Tier 2: Fal.ai — kling-video or minimax */
async function generateViaFalai(params: VideoFallbackParams): Promise<VideoFallbackResult> {
  const payload: any = {
    prompt: params.prompt,
    duration: String(Math.min(10, params.duration)),
    aspect_ratio: mapAspectRatioSimple(params.aspectRatio),
  };

  // Use image-to-video if reference image exists
  const model = params.referenceImage ? 'fal-ai/kling-video/v1/standard/image-to-video' : 'fal-ai/minimax-video/image-to-video';
  if (params.referenceImage && fs.existsSync(params.referenceImage)) {
    const imgBase64 = readRefImageBase64(params.referenceImage);
    if (imgBase64) payload.image_url = imgBase64;
  }

  const response = await axios.post(`https://fal.run/${model}`, payload, {
    headers: { Authorization: `Key ${FALAI_API_KEY}`, 'Content-Type': 'application/json' },
    timeout: 120000,
  });

  const videoUrl = response.data?.video?.url || response.data?.video_url;
  if (videoUrl) {
    return { success: true, videoUrl, provider: 'falai' };
  }
  throw new Error('Fal.ai: no video URL in response');
}

/** Tier 3: SiliconFlow — Wan-AI video */
async function generateViaSiliconFlow(params: VideoFallbackParams): Promise<VideoFallbackResult> {
  const payload: any = {
    model: 'Wan-AI/Wan2.1-T2V-14B',
    prompt: params.prompt,
    image_size: params.aspectRatio === '9:16' ? '480x832' : params.aspectRatio === '1:1' ? '640x640' : '832x480',
  };

  if (params.referenceImage && fs.existsSync(params.referenceImage)) {
    payload.model = 'Wan-AI/Wan2.1-I2V-14B-720P';
    const imgBase64 = readRefImageBase64(params.referenceImage);
    if (imgBase64) payload.image = imgBase64;
  }

  const response = await axios.post('https://api.siliconflow.cn/v1/video/submit', payload, {
    headers: { Authorization: `Bearer ${SILICONFLOW_API_KEY}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  const requestId = response.data?.requestId;
  if (!requestId) throw new Error('SiliconFlow: no requestId');

  // Poll for result
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const poll = await axios.post('https://api.siliconflow.cn/v1/video/status', { requestId }, {
      headers: { Authorization: `Bearer ${SILICONFLOW_API_KEY}`, 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    const status = poll.data?.status;
    if (status === 'Succeed' && poll.data?.results?.videos?.[0]?.url) {
      return { success: true, videoUrl: poll.data.results.videos[0].url, provider: 'siliconflow' };
    }
    if (status === 'Failed') throw new Error(`SiliconFlow: ${poll.data?.reason || 'generation failed'}`);
    await sleep(POLL_INTERVAL);
  }
  throw new Error('SiliconFlow poll timeout');
}

/** Tier 4: XAI — via GeminiGen proxy endpoint (same base, different model path) */
async function generateViaXAI(params: VideoFallbackParams): Promise<VideoFallbackResult> {
  // XAI uses the GeminiGen proxy at api.geminigen.ai/uapi/v1/video-gen/grok
  // with xAI-specific model. Falls back to direct xAI API if XAI_API_KEY is set.
  const formData = new FormData();
  formData.append('prompt', params.prompt);
  formData.append('model', 'grok-2-1212');

  const allowedDurations = [5, 10];
  const duration = allowedDurations.reduce((prev, curr) =>
    Math.abs(curr - params.duration) < Math.abs(prev - params.duration) ? curr : prev
  , allowedDurations[0]);
  formData.append('duration', duration.toString());
  formData.append('aspect_ratio', mapAspectRatio(params.aspectRatio));

  if (params.referenceImage && fs.existsSync(params.referenceImage) && fs.statSync(params.referenceImage).size > 0) {
    formData.append('ref_image', fs.readFileSync(params.referenceImage), {
      filename: path.basename(params.referenceImage),
      contentType: 'image/jpeg',
    });
  }

  // Try via GeminiGen proxy first (uses GEMINIGEN_API_KEY)
  const apiKey = GEMINIGEN_API_KEY || XAI_API_KEY;
  if (!apiKey) throw new Error('XAI: no API key available');

  const response = await axios.post(`${GEMINIGEN_API_BASE}/video-gen/grok`, formData, {
    headers: { 'x-api-key': apiKey, ...formData.getHeaders() },
    timeout: 30000,
  });

  const { uuid } = response.data;
  logger.info(`XAI video started via proxy: ${uuid}`);

  // Poll using GeminiGen history endpoint
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const poll = await axios.get(`${GEMINIGEN_API_BASE}/history/${uuid}`, {
      headers: { 'x-api-key': apiKey },
      timeout: 10000,
    });
    const { status: s, generated_video, error_message } = poll.data;
    if (s === 2 && generated_video?.length > 0) {
      const videoUrl = generated_video[0].video_url || generated_video[0].video_uri;
      return { success: true, videoUrl, jobId: uuid, provider: 'xai' };
    }
    if (s === 3) throw new Error(error_message || 'XAI generation failed');
    await sleep(POLL_INTERVAL);
  }
  throw new Error('XAI poll timeout');
}

/** Tier 5: LaoZhang — OpenAI-compatible chat completions, model sora_video2 */
async function generateViaLaoZhang(params: VideoFallbackParams): Promise<VideoFallbackResult> {
  const content: any[] = [{ type: 'text', text: params.prompt }];

  // LaoZhang supports image_url in content array for image-to-video
  if (params.referenceImage && fs.existsSync(params.referenceImage)) {
    const imgBase64 = readRefImageBase64(params.referenceImage);
    if (imgBase64) {
      content.push({
        type: 'image_url',
        image_url: { url: imgBase64 },
      });
    }
  }

  // Choose model variant based on aspect ratio and duration
  let model = 'sora_video2';
  if (params.aspectRatio === '16:9' || params.aspectRatio === 'landscape') {
    model = params.duration > 10 ? 'sora_video2-landscape-15s' : 'sora_video2-landscape';
  } else if (params.duration > 10) {
    model = 'sora_video2-15s';
  }

  const body = {
    model,
    messages: [
      {
        role: 'user',
        content,
      },
    ],
    stream: false,
    max_tokens: params.duration * 30,
  };

  const response = await axios.post('https://api.laozhang.ai/v1/chat/completions', body, {
    headers: {
      Authorization: `Bearer ${LAOZHANG_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 120000,
  });

  const choices = response.data?.choices;
  if (!choices?.length) throw new Error('LaoZhang: no choices in response');

  const messageContent = choices[0]?.message?.content || '';

  // Extract video URL from response text
  const urlMatch = typeof messageContent === 'string'
    ? messageContent.match(/https?:\/\/[^\s"'<>]+/)
    : null;

  if (!urlMatch) {
    throw new Error(`LaoZhang: no video URL found in response: ${String(messageContent).substring(0, 200)}`);
  }

  return { success: true, videoUrl: urlMatch[0], provider: 'laozhang' };
}

/** Tier 6: EvoLink — wan2.5-text-to-video, poll at /v1/tasks/{task_id} */
async function generateViaEvoLink(params: VideoFallbackParams): Promise<VideoFallbackResult> {
  const body: any = {
    model: 'wan2.5-text-to-video',
    prompt: params.prompt,
  };

  if (params.referenceImage && fs.existsSync(params.referenceImage)) {
    const imgBase64 = readRefImageBase64(params.referenceImage);
    if (imgBase64) body.image_url = imgBase64;
  }

  if (params.aspectRatio) {
    body.aspect_ratio = mapAspectRatioSimple(params.aspectRatio);
  }

  const response = await axios.post('https://api.evolink.ai/v1/videos/generations', body, {
    headers: {
      Authorization: `Bearer ${EVOLINK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  const taskId = response.data?.id;
  if (!taskId) {
    const errMsg = response.data?.error?.message || JSON.stringify(response.data);
    throw new Error(`EvoLink: no task ID: ${errMsg}`);
  }

  // Check for credits/access errors
  const errorMsg = response.data?.error?.message || '';
  if (errorMsg.toLowerCase().includes('insufficient') || errorMsg.toLowerCase().includes('permanently rejected')) {
    throw new Error(`EvoLink: credits/access denied: ${errorMsg}`);
  }

  // Poll for completion
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const poll = await axios.get(`https://api.evolink.ai/v1/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${EVOLINK_API_KEY}` },
      timeout: 10000,
    });

    const status = poll.data?.status;
    if (status === 'completed') {
      let videoUrl = '';
      const results = poll.data?.results;
      if (Array.isArray(results) && results.length > 0) {
        const first = results[0];
        videoUrl = typeof first === 'object' ? (first.url || '') : String(first);
      }
      if (!videoUrl) {
        videoUrl = poll.data?.output?.url || poll.data?.video_url || '';
      }
      if (videoUrl) {
        return { success: true, videoUrl, jobId: taskId, provider: 'evolink' };
      }
      throw new Error('EvoLink: completed but no video URL');
    }
    if (status === 'failed' || status === 'error') {
      throw new Error(`EvoLink: task failed: ${poll.data?.error || 'Unknown error'}`);
    }
    await sleep(POLL_INTERVAL);
  }
  throw new Error('EvoLink poll timeout');
}

/** Tier 7: Hypereal — kling-3-0-std-t2v, poll at /v1/jobs/{jobId}?model={model}&type=video */
async function generateViaHypereal(params: VideoFallbackParams): Promise<VideoFallbackResult> {
  // Choose model based on whether we have a reference image
  const model = params.referenceImage ? 'kling-3-0-std-i2v' : 'kling-3-0-std-t2v';

  const input: any = {
    prompt: params.prompt,
  };

  if (params.referenceImage && fs.existsSync(params.referenceImage)) {
    const imgBase64 = readRefImageBase64(params.referenceImage);
    if (imgBase64) input.image = imgBase64;
  }

  if (params.duration) {
    input.duration = params.duration;
  }

  const body = {
    model,
    input,
  };

  const response = await axios.post('https://api.hypereal.tech/v1/videos/generate', body, {
    headers: {
      Authorization: `Bearer ${HYPEREAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  const jobId = response.data?.jobId;
  if (!jobId) throw new Error(`Hypereal: no jobId in response: ${JSON.stringify(response.data)}`);

  logger.info(`Hypereal video started: ${jobId}`);

  // Poll for completion
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const poll = await axios.get(
      `https://api.hypereal.tech/v1/jobs/${jobId}?model=${encodeURIComponent(model)}&type=video`,
      {
        headers: { Authorization: `Bearer ${HYPEREAL_API_KEY}` },
        timeout: 10000,
      }
    );

    const status = poll.data?.status;
    if (status === 'completed') {
      const videoUrl = poll.data?.outputUrl || poll.data?.output_url || '';
      if (videoUrl) {
        return { success: true, videoUrl, jobId, provider: 'hypereal' };
      }
      throw new Error('Hypereal: completed but no video URL');
    }
    if (status === 'failed') {
      throw new Error(`Hypereal: job failed: ${poll.data?.error || 'Unknown error'}`);
    }
    await sleep(POLL_INTERVAL);
  }
  throw new Error('Hypereal poll timeout');
}

/** Tier 8: BytePlus Seedance via AIML API */
async function generateViaByteplus(params: VideoFallbackParams): Promise<VideoFallbackResult> {
  const payload = {
    model: 'bytedance/seedance-1-0-lite-t2v',
    prompt: params.prompt,
    resolution: '480p',
    duration: Math.min(5, params.duration),
    aspect_ratio: mapAspectRatio(params.aspectRatio),
    watermark: false,
  };

  const response = await axios.post('https://api.aimlapi.com/v2/video/generations', payload, {
    headers: { Authorization: `Bearer ${BYTEPLUS_API_KEY}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  const id = response.data?.id;
  if (!id) throw new Error('BytePlus: no job id');

  // Poll
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const poll = await axios.get(`https://api.aimlapi.com/v2/video/generations/${id}`, {
      headers: { Authorization: `Bearer ${BYTEPLUS_API_KEY}` },
      timeout: 10000,
    });
    if (poll.data?.status === 'completed' && poll.data?.output?.video_url) {
      return { success: true, videoUrl: poll.data.output.video_url, provider: 'byteplus' };
    }
    if (poll.data?.status === 'failed') throw new Error(`BytePlus: ${poll.data?.error || 'failed'}`);
    await sleep(POLL_INTERVAL);
  }
  throw new Error('BytePlus poll timeout');
}

/** Tier 9: Kie.ai — runway model, poll at /api/v1/runway/record-detail?taskId={taskId} */
async function generateViaKie(params: VideoFallbackParams): Promise<VideoFallbackResult> {
  const body: any = {
    prompt: params.prompt,
    duration: Math.min(10, params.duration),
    quality: '720p',
    waterMark: 'kie.ai',
  };

  if (params.referenceImage && fs.existsSync(params.referenceImage)) {
    const imgBase64 = readRefImageBase64(params.referenceImage);
    if (imgBase64) body.imageUrl = imgBase64;
  }

  // Only set aspectRatio when no reference image (per Python implementation)
  if (!params.referenceImage) {
    body.aspectRatio = mapAspectRatioSimple(params.aspectRatio);
  }

  const response = await axios.post('https://api.kie.ai/api/v1/runway/generate', body, {
    headers: {
      Authorization: `Bearer ${KIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  if (response.data?.code !== 200) {
    throw new Error(`Kie.ai API error: ${response.data?.msg || 'Unknown error'}`);
  }

  // Check for credits/balance error even with code 200
  const msg = response.data?.msg || '';
  if (msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('balance')) {
    throw new Error(`Kie.ai credits insufficient: ${msg}`);
  }

  const taskId = response.data?.data?.taskId;
  if (!taskId) throw new Error(`Kie.ai: no taskId in response: ${JSON.stringify(response.data)}`);

  logger.info(`Kie.ai video started: ${taskId}`);

  // Poll for completion
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const poll = await axios.get(`https://api.kie.ai/api/v1/runway/record-detail?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${KIE_API_KEY}` },
      timeout: 10000,
    });

    if (poll.data?.code !== 200) {
      await sleep(POLL_INTERVAL);
      continue;
    }

    const data = poll.data?.data || {};
    const status = data.state || data.status;

    if (status === 'success' || status === 'completed') {
      const videoUrl = data.videoInfo?.videoUrl || data.videoUrl || '';
      if (videoUrl) {
        return { success: true, videoUrl, jobId: taskId, provider: 'kie' };
      }
      throw new Error('Kie.ai: completed but no video URL');
    }
    if (status === 'failed' || status === 'error' || status === 'fail') {
      throw new Error(`Kie.ai task failed: ${data.msg || 'Unknown error'}`);
    }
    await sleep(POLL_INTERVAL);
  }
  throw new Error('Kie.ai poll timeout');
}

// ── Provider chain ──

function getProviders(): VideoProvider[] {
  return [
    { key: 'geminigen', name: 'GeminiGen', enabled: !!GEMINIGEN_API_KEY, supportsRefImage: true, generate: generateViaGeminiGen },
    { key: 'falai', name: 'Fal.ai Video', enabled: !!FALAI_API_KEY, supportsRefImage: true, generate: generateViaFalai },
    { key: 'siliconflow', name: 'SiliconFlow Video', enabled: !!SILICONFLOW_API_KEY, supportsRefImage: true, generate: generateViaSiliconFlow },
    { key: 'xai', name: 'XAI Grok', enabled: !!(GEMINIGEN_API_KEY || XAI_API_KEY), supportsRefImage: true, generate: generateViaXAI },
    { key: 'laozhang', name: 'LaoZhang Sora', enabled: !!LAOZHANG_API_KEY, supportsRefImage: true, generate: generateViaLaoZhang },
    { key: 'evolink', name: 'EvoLink Video', enabled: !!EVOLINK_API_KEY, supportsRefImage: true, generate: generateViaEvoLink },
    { key: 'hypereal', name: 'Hypereal AI', enabled: !!HYPEREAL_API_KEY, supportsRefImage: true, generate: generateViaHypereal },
    { key: 'byteplus', name: 'BytePlus Seedance', enabled: !!BYTEPLUS_API_KEY, supportsRefImage: false, generate: generateViaByteplus },
    { key: 'kie', name: 'Kie.ai', enabled: !!KIE_API_KEY, supportsRefImage: true, generate: generateViaKie },
  ];
}

// ── Main fallback function ──

/**
 * Generate a video using multi-provider fallback chain.
 * Tries each provider in priority order with circuit breaker.
 */
export async function generateVideoWithFallback(params: VideoFallbackParams): Promise<VideoFallbackResult> {
  const allProviders = getProviders().filter(p => p.enabled);

  if (allProviders.length === 0) {
    return { success: false, error: 'No video providers configured' };
  }

  // Enrich prompt with V3 engine
  const enrichedBase = PromptEngine.enrichForVideo(
    params.prompt,
    params.niche || 'tech',
    params.style || 'professional',
    params.duration,
    undefined,
    undefined,
    !!params.referenceImage
  );

  // AI-optimise the enriched prompt (LLM rotation with fallback)
  const optimizedFull = await AIPromptOptimizer.optimize(enrichedBase.full, {
    niche: params.niche || 'tech',
    style: params.style || 'professional',
    hasReferenceImage: !!params.referenceImage,
  }).catch(() => enrichedBase.full);

  const enriched = {
    ...enrichedBase,
    full: optimizedFull || enrichedBase.full,
  };

  // Use smart router to order providers by score
  let orderedKeys: string[];
  try {
    orderedKeys = await ProviderRouter.getOrderedProviderKeys(
      params.niche || 'tech',
      params.style ? [params.style] : []
    );
  } catch (routerErr) {
    // If router fails, fall back to static priority ordering
    logger.warn('Provider router failed, using static ordering:', routerErr);
    orderedKeys = allProviders.map(p => p.key);
  }

  // Build ordered provider list from scored keys
  const providerMap = new Map(allProviders.map(p => [p.key, p]));
  const providers: VideoProvider[] = [];
  for (const key of orderedKeys) {
    const p = providerMap.get(key);
    if (p) providers.push(p);
  }
  // Add any enabled providers not in the router output (safety net)
  for (const p of allProviders) {
    if (!providers.find(x => x.key === p.key)) {
      providers.push(p);
    }
  }

  logger.info(`${providers.length} video providers (smart-routed): ${providers.map(p => p.name).join(', ')}`);

  for (const provider of providers) {
    // Skip providers that don't support ref image if we have one
    if (params.referenceImage && !provider.supportsRefImage) {
      logger.info(`Skipping ${provider.name}: no ref image support`);
      continue;
    }

    const canExecute = await CircuitBreaker.canExecute(provider.key).catch(() => true);
    if (!canExecute) {
      logger.info(`Circuit breaker OPEN for ${provider.name} -- skipping`);
      continue;
    }

    try {
      logger.info(`Trying ${provider.name}...`);

      // Use enriched prompt for the provider
      const enrichedParams = { ...params, prompt: enriched.provider_hint };
      const result = await provider.generate(enrichedParams);

      if (result.success) {
        await CircuitBreaker.recordSuccess(provider.key).catch(() => {});
        await ProviderRouter.recordSuccess(provider.key).catch(() => {});
        logger.info(`${provider.name} succeeded!`);
        return result;
      }
    } catch (error: any) {
      await CircuitBreaker.recordFailure(provider.key).catch(() => {});
      await ProviderRouter.recordFailure(provider.key).catch(() => {});
      logger.warn(`${provider.name} failed: ${error.message}`);
    }
  }

  return { success: false, error: `All ${providers.length} video providers failed` };
}
