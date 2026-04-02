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

import axios from "axios";
import { createHash } from "crypto";
import { logger } from "@/utils/logger.js";
import { redis } from "@/config/redis.js";
import { trackTokens } from "@/services/token-tracker.service";
import { getConfig } from "@/config/env";

const LLM_TIMEOUT = 5000; // 5 seconds per LLM call
const CACHE_TTL = 3600; // 1 hour in seconds
const CACHE_PREFIX = "ai_prompt_opt:";

export interface AIPromptOptimizerContext {
  niche: string;
  style: string;
  category?: string;
  hasReferenceImage?: boolean;
}

function buildMetaPrompt(
  rawPrompt: string,
  context: AIPromptOptimizerContext,
): string {
  const imageInstruction = context.hasReferenceImage
    ? `\nCRITICAL: A reference image IS provided. THE SUBJECT IN THE REFERENCE IMAGE IS THE REAL SUBJECT. If the original prompt mentions a specific subject (e.g., "steak", "burger", "watch") that differs from the visual category of the reference image, IGNORE that specific subject name and replace it with a general description of the reference image's subject while keeping the STYLE, LIGHTING, and VIBE of the original prompt.`
    : "";

  // Add variation seed so same prompt produces different enrichments each time
  const variationSeed = Math.random().toString(36).slice(2, 6);

  return (
    `You are an expert AI image/video prompt engineer. Your task is to optimize this prompt for maximum quality in AI generation.\n\n` +
    `Original prompt: ${rawPrompt}\n` +
    `Context: niche=${context.niche}, style=${context.style}\n` +
    `Has reference image: ${context.hasReferenceImage ? "yes" : "no"}${imageInstruction}\n\n` +
    `Rules:\n` +
    `1. Keep the core intent and technical style unchanged.\n` +
    `2. Add specific technical photography/videography terms.\n` +
    `3. Add lighting, camera, and composition details — choose DIFFERENT lighting setups, camera angles, and color palettes each time.\n` +
    `4. If reference image exists, add "Maintain exact visual identity and subject from the provided reference image."\n` +
    `5. Keep under 200 words.\n` +
    `6. Output ONLY the optimized prompt, nothing else.\n` +
    `7. Add creative variation: choose different composition, mood, time of day, or visual accent for uniqueness. Variation seed: ${variationSeed}\n\n` +
    `Optimized prompt:`
  );
}

function buildCacheKey(
  rawPrompt: string,
  context: AIPromptOptimizerContext,
): string {
  // Include timestamp to ensure each generation gets unique optimization
  // (otherwise same prompt always gets same cached result = identical images)
  const input = `${rawPrompt}|${context.niche}|${context.style}|${context.category || ""}|${context.hasReferenceImage ? "1" : "0"}|${Date.now()}`;
  return CACHE_PREFIX + createHash("md5").update(input).digest("hex");
}

async function getFromCache(key: string): Promise<string | null> {
  try {
    const cached = await redis.get(key);
    return cached;
  } catch (err) {
    logger.debug("[AIPromptOptimizer] Cache read error:", err);
    return null;
  }
}

async function saveToCache(key: string, value: string): Promise<void> {
  try {
    await redis.set(key, value, "EX", CACHE_TTL);
  } catch (err) {
    logger.debug("[AIPromptOptimizer] Cache write error:", err);
  }
}

/** Tier 0: Groq (Llama 3.3 70B — fastest, cheapest at ~$0.05/1M tokens) */
async function tryGroq(metaPrompt: string): Promise<string | null> {
  const GROQ_API_KEY = getConfig().GROQ_API_KEY || "";
  if (!GROQ_API_KEY) return null;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: metaPrompt }],
        temperature: 0.7,
        max_tokens: 512,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        timeout: LLM_TIMEOUT,
      },
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (content && content.trim().length > 10) {
      trackTokens({
        provider: "groq",
        model: "llama-3.3-70b-versatile",
        service: "prompt_optimizer",
        promptTokens: response.data?.usage?.prompt_tokens || 0,
        completionTokens: response.data?.usage?.completion_tokens || 0,
      }).catch((err) =>
        logger.warn("Prompt optimizer tracking failed", { error: err.message }),
      );
      logger.info("[AIPromptOptimizer] Groq succeeded");
      return content.trim();
    }
    return null;
  } catch (err: any) {
    logger.debug(`[AIPromptOptimizer] Groq failed: ${err.message}`);
    return null;
  }
}

/** Tier 1: Gemini Flash */
async function tryGemini(metaPrompt: string): Promise<string | null> {
  const GEMINI_API_KEY = getConfig().GEMINI_API_KEY || "";
  if (!GEMINI_API_KEY) return null;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: metaPrompt }] }],
        generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
      },
      { headers: { "Content-Type": "application/json" }, timeout: LLM_TIMEOUT },
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text && text.trim().length > 10) {
      // Track token usage from Gemini usageMetadata
      const usage = response.data?.usageMetadata;
      if (usage) {
        trackTokens({
          provider: "gemini-direct",
          model: "gemini-2.5-flash",
          service: "prompt_optimizer",
          promptTokens: usage.promptTokenCount || 0,
          completionTokens: usage.candidatesTokenCount || 0,
        }).catch((err) =>
          logger.warn("Prompt optimizer tracking failed", {
            error: err.message,
          }),
        );
      }
      logger.info("[AIPromptOptimizer] Gemini succeeded");
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
  const config = getConfig();
  const OMNIROUTE_URL = config.OMNIROUTE_URL || "http://localhost:20128/v1";
  const OMNIROUTE_API_KEY = config.OMNIROUTE_API_KEY || "";
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (OMNIROUTE_API_KEY) {
      headers["Authorization"] = `Bearer ${OMNIROUTE_API_KEY}`;
    }

    const response = await axios.post(
      `${OMNIROUTE_URL}/chat/completions`,
      {
        model: "antigravity/gemini-2.5-flash",
        messages: [{ role: "user", content: metaPrompt }],
        temperature: 0.7,
        max_tokens: 512,
      },
      { headers, timeout: LLM_TIMEOUT },
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (content && content.trim().length > 10) {
      const usage = response.data?.usage;
      if (usage) {
        trackTokens({
          provider: "omniroute",
          model: response.data?.model || "antigravity/gemini-2.5-flash",
          service: "prompt_optimizer",
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
        }).catch((err) =>
          logger.warn("Prompt optimizer tracking failed", {
            error: err.message,
          }),
        );
      }
      logger.info("[AIPromptOptimizer] OmniRoute succeeded");
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
    context: AIPromptOptimizerContext,
  ): Promise<string> {
    try {
      // FORCE REDIS CACHE FLUSH FOR THIS CALL (bypass if it's a critical subject fix)
      // Actually, just add a logger to see what's happening
      logger.info(
        `[AIPromptOptimizer] Optimizing: ${rawPrompt.slice(0, 50)}... | hasRef=${context.hasReferenceImage}`,
      );

      // Check cache first
      const cacheKey = buildCacheKey(rawPrompt, context);
      const cached = await getFromCache(cacheKey);
      if (cached) {
        logger.debug("[AIPromptOptimizer] Cache hit");
        return cached;
      }

      const metaPrompt = buildMetaPrompt(rawPrompt, context);

      // Try LLMs in rotation: Groq (fastest) → Gemini → OmniRoute
      const groqResult = await tryGroq(metaPrompt);
      if (groqResult) {
        await saveToCache(cacheKey, groqResult);
        return groqResult;
      }

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
      logger.info("[AIPromptOptimizer] All LLMs failed, using original prompt");
      return rawPrompt;
    } catch (err: any) {
      logger.warn(`[AIPromptOptimizer] Unexpected error: ${err.message}`);
      return rawPrompt;
    }
  }
}
