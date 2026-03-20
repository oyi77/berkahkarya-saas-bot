/**
 * OmniRoute Service — OpenAI-compatible chat completions via OmniRoute proxy.
 * Supports per-user conversation history and model listing.
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '@/utils/logger';

const OMNIROUTE_URL = process.env.OMNIROUTE_URL || 'http://localhost:20128/v1';
const OMNIROUTE_API_KEY = process.env.OMNIROUTE_API_KEY || '';
const DEFAULT_MODEL = process.env.OMNIROUTE_DEFAULT_MODEL || 'antigravity/gemini-2.5-flash';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  success: boolean;
  content?: string;
  model?: string;
  error?: string;
}

export class OmniRouteService {
  private client: AxiosInstance;
  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: OMNIROUTE_URL,
      timeout: 120_000,
      headers: {
        'Content-Type': 'application/json',
        ...(OMNIROUTE_API_KEY ? { 'Authorization': `Bearer ${OMNIROUTE_API_KEY}` } : {}),
      },
    });
  }

  async chat(userId: string, message: string, model?: string): Promise<ChatResponse> {
    const history = this.conversationHistory.get(userId) || [];
    history.push({ role: 'user', content: message });

    try {
      const response = await this.client.post('/chat/completions', {
        model: model || DEFAULT_MODEL,
        messages: history.slice(-20),
        temperature: 0.7,
        max_tokens: 4096,
      });

      const content = response.data?.choices?.[0]?.message?.content || '';
      const usedModel = response.data?.model || model || DEFAULT_MODEL;

      history.push({ role: 'assistant', content });
      this.conversationHistory.set(userId, history);

      return { success: true, content, model: usedModel };
    } catch (error: any) {
      const errMsg = error.response?.data?.error?.message || error.message || 'Unknown error';
      logger.error('OmniRoute chat error:', errMsg);
      return { success: false, error: errMsg };
    }
  }

  clearHistory(userId: string): void {
    this.conversationHistory.delete(userId);
  }

  async isAlive(): Promise<boolean> {
    try {
      await this.client.get('/models', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/models', { timeout: 10000 });
      return (response.data?.data || []).map((m: any) => m.id).slice(0, 30);
    } catch {
      return [];
    }
  }
}

let _instance: OmniRouteService | null = null;

export function getOmniRouteService(): OmniRouteService {
  if (!_instance) {
    _instance = new OmniRouteService();
  }
  return _instance;
}
