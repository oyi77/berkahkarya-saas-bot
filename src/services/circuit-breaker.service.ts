/**
 * Circuit Breaker Service
 *
 * Manages circuit breaker state per provider using Redis.
 * States: closed (normal) -> open (failing) -> half-open (testing recovery)
 */

import { redis } from "@/config/redis.js";
import { logger } from "@/utils/logger.js";
import { PROVIDER_CONFIG } from "@/config/providers.js";

const CB_PREFIX = "cb:";

interface CircuitBreakerState {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailure: number | null;
  lastSuccess: number | null;
}

export class CircuitBreaker {
  /**
   * Check if a provider can be executed (circuit is not open)
   */
  static async canExecute(provider: string): Promise<boolean> {
    const config =
      PROVIDER_CONFIG.video[provider] || PROVIDER_CONFIG.image[provider];
    if (!config) return true; // Unknown providers default to allowed

    const state = await this.getState(provider);

    if (state.state === "closed") return true;

    if (state.state === "open") {
      // Check if recovery timeout has passed
      const now = Date.now();
      if (
        state.lastFailure &&
        now - state.lastFailure >= config.recoveryTimeout
      ) {
        // Transition to half-open
        await this.setState(provider, { ...state, state: "half-open" });
        logger.info(`Circuit breaker for ${provider}: open -> half-open`);
        return true;
      }
      return false;
    }

    // half-open: allow one request to test
    return true;
  }

  /**
   * Record a successful call for a provider
   */
  static async recordSuccess(provider: string): Promise<void> {
    await this.setState(provider, {
      state: "closed",
      failureCount: 0,
      lastFailure: null,
      lastSuccess: Date.now(),
    });
  }

  /**
   * Record a failed call for a provider
   */
  static async recordFailure(provider: string): Promise<void> {
    const config =
      PROVIDER_CONFIG.video[provider] || PROVIDER_CONFIG.image[provider];
    if (!config) return;

    const state = await this.getState(provider);
    const newFailureCount = state.failureCount + 1;

    if (newFailureCount >= config.failureThreshold) {
      await this.setState(provider, {
        state: "open",
        failureCount: newFailureCount,
        lastFailure: Date.now(),
        lastSuccess: state.lastSuccess,
      });
      logger.warn(
        `Circuit breaker OPENED for ${provider} (${newFailureCount} failures)`,
      );
    } else {
      await this.setState(provider, {
        ...state,
        failureCount: newFailureCount,
        lastFailure: Date.now(),
      });
    }
  }

  /**
   * Get circuit breaker state from Redis
   */
  private static async getState(
    provider: string,
  ): Promise<CircuitBreakerState> {
    try {
      const raw = await redis.get(`${CB_PREFIX}${provider}`);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      logger.error(`Error reading circuit breaker state for ${provider}:`, err);
    }
    return {
      state: "closed",
      failureCount: 0,
      lastFailure: null,
      lastSuccess: null,
    };
  }

  /**
   * Set circuit breaker state in Redis (TTL = 10 min)
   */
  private static async setState(
    provider: string,
    state: CircuitBreakerState,
  ): Promise<void> {
    try {
      await redis.set(
        `${CB_PREFIX}${provider}`,
        JSON.stringify(state),
        "EX",
        600,
      );
    } catch (err) {
      logger.error(`Error writing circuit breaker state for ${provider}:`, err);
    }
  }

  /**
   * Reset all circuit breakers
   */
  static async resetAll(): Promise<void> {
    const providers = [
      ...Object.keys(PROVIDER_CONFIG.video),
      ...Object.keys(PROVIDER_CONFIG.image),
    ];
    for (const p of providers) {
      await redis.del(`${CB_PREFIX}${p}`);
    }
    logger.info("All circuit breakers reset");
  }
}
