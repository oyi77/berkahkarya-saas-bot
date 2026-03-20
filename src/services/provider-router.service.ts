/**
 * Smart Provider Router
 *
 * Scores and orders video providers dynamically based on:
 *   - Base priority from PROVIDER_CONFIG
 *   - Niche/strength match bonus
 *   - Style/avoid list penalty
 *   - Circuit breaker health
 *   - Historical success/failure rate (from Redis)
 *
 * Replaces the static getProviders() ordering in video-fallback.service.ts.
 */

import { PROVIDER_CONFIG, VideoProviderConfig } from '@/config/providers';
import { CircuitBreaker } from './circuit-breaker.service';
import { redis } from '@/config/redis';
import { logger } from '@/utils/logger';

// Redis key prefix for provider history counters
const HISTORY_PREFIX = 'provider:history:';
const HISTORY_TTL = 3600; // 1 hour window

interface ProviderScore {
  key: string;
  config: VideoProviderConfig;
  score: number;
}

// Re-export the VideoProvider interface that video-fallback uses
export interface VideoProvider {
  key: string;
  name: string;
  enabled: boolean;
  supportsRefImage: boolean;
  generate: (params: any) => Promise<any>;
}

export class ProviderRouter {
  /**
   * Return providers ordered by computed score (highest first).
   * This replaces the static priority-sorted list with a dynamic ranking.
   */
  static async getOrderedProviders(
    niche: string,
    styles: string[]
  ): Promise<Array<{ key: string; config: VideoProviderConfig; score: number }>> {
    const entries = Object.entries(PROVIDER_CONFIG.video);
    const scored: ProviderScore[] = [];

    for (const [key, config] of entries) {
      const score = await this.scoreProvider(key, config, niche, styles);
      scored.push({ key, config, score });
    }

    // Sort descending by score (higher = better)
    scored.sort((a, b) => b.score - a.score);

    logger.debug(
      `Provider routing for niche="${niche}" styles=[${styles.join(',')}]: ` +
      scored.map((s) => `${s.key}(${s.score})`).join(' > ')
    );

    return scored;
  }

  /**
   * Compute a numeric score for a single provider.
   *
   * Scoring formula:
   *   base  = (10 - priority) * 10   (lower priority number = higher base)
   *   +20   if niche matches any provider strength
   *   -50   if any style is in provider avoid list
   *   -100  if circuit breaker is open
   *   +10   per recent success (capped at 50)
   *   -10   per recent failure (capped at -50)
   */
  static async scoreProvider(
    key: string,
    config: VideoProviderConfig,
    niche: string,
    styles: string[]
  ): Promise<number> {
    // Base score from priority (priority 1 = score 90, priority 9 = score 10)
    let score = (10 - config.priority) * 10;

    // Niche match bonus
    const nicheLower = niche.toLowerCase();
    const hasNicheMatch = config.strengths.some(
      (s) => nicheLower.includes(s.toLowerCase()) || s.toLowerCase().includes(nicheLower)
    );
    if (hasNicheMatch) {
      score += 20;
    }

    // Style avoid penalty
    const stylesLower = styles.map((s) => s.toLowerCase());
    const hasAvoidMatch = config.avoid.some((a) =>
      stylesLower.some((s) => s.includes(a.toLowerCase()) || a.toLowerCase().includes(s))
    );
    if (hasAvoidMatch) {
      score -= 50;
    }

    // Circuit breaker health
    try {
      const canExecute = await CircuitBreaker.canExecute(key);
      if (!canExecute) {
        score -= 100;
      }
    } catch (_) {
      // If circuit breaker check fails, don't penalise
    }

    // Historical success/failure rate
    try {
      const [successStr, failureStr] = await Promise.all([
        redis.get(`${HISTORY_PREFIX}${key}:success`),
        redis.get(`${HISTORY_PREFIX}${key}:failure`),
      ]);
      const successes = Math.min(parseInt(successStr || '0', 10), 5);
      const failures = Math.min(parseInt(failureStr || '0', 10), 5);
      score += successes * 10;
      score -= failures * 10;
    } catch (_) {
      // Redis unavailable — skip history scoring
    }

    return score;
  }

  /**
   * Record a successful generation for a provider (used by fallback service).
   */
  static async recordSuccess(providerKey: string): Promise<void> {
    try {
      const key = `${HISTORY_PREFIX}${providerKey}:success`;
      await redis.incr(key);
      await redis.expire(key, HISTORY_TTL);
    } catch (_) {
      // Best-effort
    }
  }

  /**
   * Record a failed generation for a provider (used by fallback service).
   */
  static async recordFailure(providerKey: string): Promise<void> {
    try {
      const key = `${HISTORY_PREFIX}${providerKey}:failure`;
      await redis.incr(key);
      await redis.expire(key, HISTORY_TTL);
    } catch (_) {
      // Best-effort
    }
  }

  /**
   * Get ordered provider keys as a simple string array (convenience method).
   */
  static async getOrderedProviderKeys(niche: string, styles: string[]): Promise<string[]> {
    const ordered = await this.getOrderedProviders(niche, styles);
    return ordered.map((p) => p.key);
  }
}
