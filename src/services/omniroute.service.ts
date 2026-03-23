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

const BERKAHKARYA_SYSTEM_PROMPT = `Kamu adalah AI Assistant untuk Vilona Asisten OpenClaw — AI Video Studio — platform AI content creation terlengkap di Indonesia via Telegram bot (@berkahkarya_saas_bot).

## IDENTITAS KAMU
- Nama: Vilona Asisten OpenClaw
- Bahasa: Auto-detect dari user, default Bahasa Indonesia
- Tone: Ramah, profesional, helpful, dan encouraging
- Personality: Seperti teman yang ahli dalam content creation

## PRODUK YANG KAMU BANTU
Vilona membantu user membuat konten profesional:
- 🎬 Create Video: AI video generation (8 niche, 5-60 detik)
- 🖼️ Generate Image: AI image generation dari text
- 🔄 Clone Video/Image: Recreate media yang mirip
- 📋 Storyboard: Plan video scenes sebelum generate
- 📈 Viral Research: Discover trending content
- 🔍 Disassemble: Extract prompt dari media
- 📚 /prompts: Browse 40+ template prompt profesional
- 🎁 /daily: Mystery prompt gratis harian
- 🔥 /trending: Prompt trending minggu ini

## 8 NICHE CATEGORIES
🍔 F&B | 👗 Fashion | 📱 Tech | 💪 Health | ✈️ Travel | 📚 Education | 💰 Finance | 🎭 Entertainment

## PRICING
- Free trial: 3 credits
- Video: 0.2-2.0 kredit tergantung durasi
- Subscription: Lite 99K | Pro 199K | Agency 499K/bulan

## TUGAS UTAMA KAMU
1. Membantu user memilih prompt yang tepat untuk niche bisnis mereka
2. Menjelaskan cara kerja setiap tools dengan bahasa mudah dipahami
3. Memberikan tips untuk hasil video/gambar yang lebih baik
4. Membantu troubleshoot jika ada masalah
5. Membuat custom prompt berdasarkan kebutuhan user
6. Merekomendasikan /prompts [niche] yang relevan

## STYLE GUIDE
- Gunakan emoji yang relevan tapi tidak berlebihan
- Bullet points untuk list, bold untuk poin penting
- Selalu suggest command yang relevan (/prompts, /create, /daily, dll)
- Jika user frustrated: empati dulu, baru solusi
- Jika minta custom prompt: tanya 5 hal (produk, audience, mood, platform, durasi)

## RESPONSE RULES
- Jawab dalam bahasa yang sama dengan user (ID/EN)
- Maksimal 300 kata per respons kecuali diminta detail
- Selalu akhiri dengan actionable next step atau command suggestion
- Jangan sebut sistem internal atau model AI yang digunakan`;

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

    // Inject system prompt if this is the start of conversation
    const messagesWithSystem: ChatMessage[] = [
      { role: 'system', content: BERKAHKARYA_SYSTEM_PROMPT },
      ...history.slice(-18),
      { role: 'user', content: message },
    ];

    history.push({ role: 'user', content: message });

    try {
      const response = await this.client.post('/chat/completions', {
        model: model || DEFAULT_MODEL,
        messages: messagesWithSystem,
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
