/**
 * AI Prompt Optimizer Service
 *
 * Enhances prompts using actual LLMs before sending to video/image providers.
 * Wraps the existing rule-based PromptOptimizer as the final fallback.
 *
 * LLM rotation (first success wins):
 *   1. Gemini (GEMINI_API_KEY)
 *   2. OmniRoute (localhost:20128 — OpenAI-compatible)
 *   3. Rule-based fallback (existing PromptOptimizer)
 *
 * Constraints:
 *   - 5-second timeout per LLM call
 *   - Results cached in Redis (1-hour TTL, key = MD5 of rawPrompt + context)
 *   - Never blocks generation on failure — always falls back
 */

import axios from 'axios';
import { createHash } from 'crypto';
import { logger } from '@/utils/logger.js';
import { redis } from '@/config/redis.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OMNIROUTE_URL = process.env.OMNIROUTE_URL || 'http://localhost:20128/v1';
const OMNIROUTE_API_KEY = process.env.OMNIROUTE_API_KEY || '';

const LLM_TIMEOUT = 5000; // 5 seconds per LLM call
const CACHE_TTL = 3600;   // 1 hour in seconds
const CACHE_PREFIX = 'ai_prompt_opt:';

export interface AIPromptOptimizerContext {
  niche: string;
  style: string;
  category?: string;
  hasReferenceImage?: boolean;
}

function buildMetaPrompt(rawPrompt: string, context: AIPromptOptimizerContext): string {
  return (
    `You are an expert AI image/video prompt engineer. Your task is to optimize this prompt for maximum quality in AI generation.\n\n` +
    `Original prompt: ${rawPrompt}\n` +
    `Context: niche=${context.niche}, style=${context.style}\n` +
    `Has reference image: ${context.hasReferenceImage ? 'yes' : 'no'}\n\n` +
    `Rules:\n` +
    `1. Keep the core subject and intent unchanged\n` +
    `2. Add specific technical photography/videography terms\n` +
    `3. Add lighting, camera, and composition details\n` +
    `4. If reference image exists, add "maintain exact visual identity from reference image"\n` +
    `5. Keep under 200 words\n` +
    `6. Output ONLY the optimized prompt, nothing else\n\n` +
    `Optimized prompt:`
  );
}

function buildCacheKey(rawPrompt: string, context: AIPromptOptimizerContext): string {
  const input = `${rawPrompt}|${context.niche}|${context.style}|${context.category || ''}|${context.hasReferenceImage ? '1' : '0'}`;
  return CACHE_PREFIX + createHash('md5').update(input).digest('hex');
}

async function getFromCache(key: string): Promise<string | null> {
  try {
    const cached = await redis.get(key);
    return cached;
  } catch (err) {
    logger.debug('[AIPromptOptimizer] Cache read error:', err);
    return null;
  }
}

async function saveToCache(key: string, value: string): Promise<void> {
  try {
    await redis.set(key, value, 'EX', CACHE_TTL);
  } catch (err) {
    logger.debug('[AIPromptOptimizer] Cache write error:', err);
  }
}

/** Tier 1: Gemini Flash */
async function tryGemini(metaPrompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: metaPrompt }] }],
        generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: LLM_TIMEOUT }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text && text.trim().length > 10) {
      logger.info('[AIPromptOptimizer] Gemini succeeded');
      return text.trim();
    }
    return null;
  } catch (err: any) {
    logger.debug(`[AIPromptOptimizer] Gemini failed: ${err.message}`);
    return null;
  }
}

/** Tier 2: OmniRoute (OpenAI-compatible) */
async function tryOmniRoute(metaPrompt: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (OMNIROUTE_API_KEY) {
      headers['Authorization'] = `Bearer ${OMNIROUTE_API_KEY}`;
    }

    const response = await axios.post(
      `${OMNIROUTE_URL}/chat/completions`,
      {
        model: 'antigravity/gemini-2.5-flash',
        messages: [{ role: 'user', content: metaPrompt }],
        temperature: 0.7,
        max_tokens: 512,
      },
      { headers, timeout: LLM_TIMEOUT }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (content && content.trim().length > 10) {
      logger.info('[AIPromptOptimizer] OmniRoute succeeded');
      return content.trim();
    }
    return null;
  } catch (err: any) {
    logger.debug(`[AIPromptOptimizer] OmniRoute failed: ${err.message}`);
    return null;
  }
}

export class AIPromptOptimizer {
  /**
   * Optimize a prompt using LLM rotation with rule-based fallback.
   * Returns the original prompt if all methods fail (never blocks).
   */
  static async optimize(
    rawPrompt: string,
    context: AIPromptOptimizerContext
  ): Promise<string> {
    try {
      // Check cache first
      const cacheKey = buildCacheKey(rawPrompt, context);
      const cached = await getFromCache(cacheKey);
      if (cached) {
        logger.debug('[AIPromptOptimizer] Cache hit');
        return cached;
      }

      const metaPrompt = buildMetaPrompt(rawPrompt, context);

      // Try LLMs in rotation
      const geminiResult = await tryGemini(metaPrompt);
      if (geminiResult) {
        await saveToCache(cacheKey, geminiResult);
        return geminiResult;
      }

      const omniResult = await tryOmniRoute(metaPrompt);
      if (omniResult) {
        await saveToCache(cacheKey, omniResult);
        return omniResult;
      }

      // All LLMs failed — fall back to raw prompt (rule-based PromptEngine
      // enrichment has already been applied by the caller)
      logger.info('[AIPromptOptimizer] All LLMs failed, using original prompt');
      return rawPrompt;
    } catch (err: any) {
      logger.warn(`[AIPromptOptimizer] Unexpected error: ${err.message}`);
      return rawPrompt;
    }
  }
}
