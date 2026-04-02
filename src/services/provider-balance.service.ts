import axios from "axios";
import { getConfig } from "@/config/env";
import { redis } from "@/config/redis";
import { logger } from "@/utils/logger";

export interface BalanceResult {
  provider: string;
  balance: number | null;
  currency: string;
  status: "ok" | "error" | "not_configured" | "not_supported";
  error?: string;
}

export interface ModelResult {
  provider: string;
  models: string[];
  cached: boolean;
}

const BALANCE_CACHE_TTL = 300;
const MODELS_CACHE_TTL = 3600;

const ALL_PROVIDER_KEYS = [
  "omniroute",
  "byteplus",
  "xai",
  "laozhang",
  "evolink",
  "hypereal",
  "siliconflow",
  "falai",
  "kie",
  "piapi",
  "geminigen",
  "lingyaai",
  "getgoapi",
  "apiyi",
  "runware",
  "wavespeed",
  "zai_video",
  "together",
  "segmind",
  "nvidia",
  "gemini",
  "groq",
  "agentrouter",
];

const API_KEY_MAP: Record<string, string> = {
  omniroute: "OMNIROUTE_API_KEY",
  byteplus: "BYTEPLUS_API_KEY",
  xai: "XAI_API_KEY",
  laozhang: "LAOZHANG_API_KEY",
  evolink: "EVOLINK_API_KEY",
  hypereal: "HYPEREAL_API_KEY",
  siliconflow: "SILICONFLOW_API_KEY",
  falai: "FALAI_API_KEY",
  kie: "KIE_API_KEY",
  piapi: "PIAPI_API_KEY",
  geminigen: "GEMINIGEN_API_KEY",
  lingyaai: "LINGYAAI_API_KEY",
  getgoapi: "GETGOAPI_API_KEY",
  apiyi: "APIYI_API_KEY",
  runware: "RUNWARE_API_KEY",
  wavespeed: "WAVESPEED_API_KEY",
  zai_video: "ZAI_API_KEY",
  together: "TOGETHER_API_KEY",
  segmind: "SEGMIND_API_KEY",
  nvidia: "NVIDIA_API_KEY",
  gemini: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
  agentrouter: "AGENTROUTER_API_KEY",
};

const NO_BALANCE_ENDPOINT = ["geminigen", "byteplus", "hypereal", "kie"];

export class ProviderBalanceService {
  static async fetchBalance(providerKey: string): Promise<BalanceResult> {
    const config = getConfig();
    const apiKeyEnv = API_KEY_MAP[providerKey];
    const apiKey = apiKeyEnv ? (config as any)[apiKeyEnv] : undefined;
    if (!apiKey)
      return {
        provider: providerKey,
        balance: null,
        currency: "",
        status: "not_configured",
      };
    if (NO_BALANCE_ENDPOINT.includes(providerKey))
      return {
        provider: providerKey,
        balance: null,
        currency: "",
        status: "not_supported",
      };

    const cacheKey = `provider:balance:${providerKey}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {}

    const omnirouteUrl = config.OMNIROUTE_URL || "http://localhost:20128";

    const urlMap: Record<string, string> = {
      omniroute: `${omnirouteUrl}/v1/models`,
      groq: "https://api.groq.com/openai/v1/models",
      lingyaai: "https://api.lingyaai.cn/dashboard/billing/usage",
      getgoapi: "https://api.getgoapi.com/api/user/balance",
      apiyi: "https://api.apiyi.com/dashboard/billing/usage",
      runware: "https://api.runware.ai/v1/models",
      wavespeed: "https://api.wavespeed.ai/v1/models",
      zai_video: "https://api.z.ai/v1/models",
      falai: "https://rest.fal.ai/credits",
      siliconflow: "https://api.siliconflow.cn/v1/user/info",
      laozhang: "https://api.laozhang.ai/dashboard/billing/usage",
      evolink: "https://api.evolink.ai/v1/user",
      piapi: "https://api.piapi.ai/api/v1/user",
      agentrouter: "https://agentrouter.org/v1/models",
      together: "https://api.together.xyz/v1/dashboard/billing/usage",
      nvidia: "https://integrate.api.nvidia.com/v1/models",
      xai: "https://api.x.ai/v1/models",
      segmind: "https://api.segmind.com/v1/models",
    };

    const url = urlMap[providerKey];
    if (!url)
      return {
        provider: providerKey,
        balance: null,
        currency: "",
        status: "not_supported",
      };

    const authHeaders: Record<string, string> = {};
    if (providerKey === "falai") authHeaders["Authorization"] = `Key ${apiKey}`;
    else if (providerKey === "segmind") authHeaders["x-api-key"] = apiKey;
    else if (providerKey === "piapi") authHeaders["x-api-key"] = apiKey;
    else if (providerKey === "gemini") {
      /* key in URL */
    } else authHeaders["Authorization"] = `Bearer ${apiKey}`;

    try {
      const resp = await axios.get(url, {
        headers: { ...authHeaders, "Content-Type": "application/json" },
        timeout: 10000,
      });
      let balance: number | null = null;
      let currency = "USD";

      if (
        [
          "omniroute",
          "groq",
          "runware",
          "wavespeed",
          "zai_video",
          "agentrouter",
          "nvidia",
          "xai",
          "apiyi",
        ].includes(providerKey)
      ) {
        balance = 1;
        currency = "key_valid";
      } else if (providerKey === "together")
        balance = resp.data?.credits?.remaining ?? null;
      else if (providerKey === "siliconflow") {
        balance = resp.data?.data?.balance ?? resp.data?.balance ?? null;
        currency = "CNY";
      } else if (providerKey === "laozhang")
        balance =
          resp.data?.total_balance ?? resp.data?.data?.total_balance ?? null;
      else if (providerKey === "evolink")
        balance = resp.data?.credits ?? resp.data?.data?.credits ?? null;
      else if (providerKey === "piapi")
        balance = resp.data?.data?.balance ?? resp.data?.balance ?? null;
      else if (providerKey === "falai")
        balance = resp.data?.credit_balance ?? resp.data?.balance ?? null;
      else if (providerKey === "segmind") {
        balance = 1;
        currency = "key_valid";
      } else {
        balance = 1;
        currency = "key_valid";
      }

      const result: BalanceResult = {
        provider: providerKey,
        balance,
        currency,
        status: "ok",
      };
      try {
        await redis.set(
          cacheKey,
          JSON.stringify(result),
          "EX",
          BALANCE_CACHE_TTL,
        );
      } catch {}
      return result;
    } catch (err: any) {
      return {
        provider: providerKey,
        balance: null,
        currency: "",
        status: "error",
        error: (err.message || "").slice(0, 100),
      };
    }
  }

  static async fetchAllBalances(): Promise<BalanceResult[]> {
    const results: BalanceResult[] = [];
    for (const key of ALL_PROVIDER_KEYS) {
      results.push(await this.fetchBalance(key));
    }
    return results;
  }

  static async fetchModels(providerKey: string): Promise<ModelResult> {
    const config = getConfig();
    const apiKeyEnv = API_KEY_MAP[providerKey];
    const apiKey = apiKeyEnv ? (config as any)[apiKeyEnv] : undefined;
    if (!apiKey) return { provider: providerKey, models: [], cached: false };

    const cacheKey = `provider:models:${providerKey}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached)
        return {
          provider: providerKey,
          models: JSON.parse(cached),
          cached: true,
        };
    } catch {}

    const omnirouteUrl = config.OMNIROUTE_URL || "http://localhost:20128";

    const urlMap: Record<string, string> = {
      omniroute: `${omnirouteUrl}/v1/models`,
      groq: "https://api.groq.com/openai/v1/models",
      lingyaai: "https://api.lingyaai.cn/v1/models",
      getgoapi: "https://api.getgoapi.com/v1/models",
      apiyi: "https://api.apiyi.com/v1/models",
      agentrouter: "https://agentrouter.org/v1/models",
      together: "https://api.together.xyz/v1/models",
      laozhang: "https://api.laozhang.ai/v1/models",
    };
    const url = urlMap[providerKey];
    if (!url) return { provider: providerKey, models: [], cached: false };

    try {
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000,
      });
      const models = (resp.data?.data || [])
        .map((m: any) => m.id)
        .filter(Boolean);
      try {
        await redis.set(
          cacheKey,
          JSON.stringify(models),
          "EX",
          MODELS_CACHE_TTL,
        );
      } catch {}
      return { provider: providerKey, models, cached: false };
    } catch {
      return { provider: providerKey, models: [], cached: false };
    }
  }

  static async fetchAllModels(): Promise<ModelResult[]> {
    const results: ModelResult[] = [];
    for (const key of ALL_PROVIDER_KEYS) {
      results.push(await this.fetchModels(key));
    }
    return results;
  }

  static async testProvider(
    providerKey: string,
  ): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const result = await this.fetchBalance(providerKey);
      const latencyMs = Date.now() - start;
      if (result.status === "ok" || result.status === "not_supported")
        return { success: true, latencyMs };
      if (result.status === "not_configured")
        return { success: false, latencyMs, error: "API key not configured" };
      return {
        success: false,
        latencyMs,
        error: result.error || "Unknown error",
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        error: err.message,
      };
    }
  }
}
