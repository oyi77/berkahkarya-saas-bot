/**
 * Type Definitions
 * 
 * Centralized TypeScript type definitions
 */

import { Context } from 'telegraf';

// =============================================================================
// BOT CONTEXT
// =============================================================================

// Use a simple session augmentation instead of extending Context
declare module 'telegraf' {
  interface Context {
    session: SessionData;
  }
}

export type BotContext = Context;

export interface SessionData {
  state: BotState;
  stateData: Record<string, unknown>;
  lastActivity: Date;
  creditBalance?: number;
  tier?: string;
  videoCreation?: {
    mode?: string;
    niche?: string;
    platform?: string;
    totalDuration?: number;
    scenes?: number;
    storyboard?: Array<any>;
    jobId?: string;
    waitingForImage?: boolean;
    waitingForCustomPrompt?: boolean;
    customPrompt?: string;
    referenceImage?: string | null;
    uploadedPhotos?: Array<{ fileId: string; localPath?: string }>;
    visionAnalysis?: string;
    enableVO?: boolean;
    enableSubtitles?: boolean;
  };
  videoCreationNew?: {
    step: number;
    source: string | null;
    contentType: string | null;
    theme: string | null;
    vibe: string | null;
    sceneCount: number | null;
    template: string | null;
    uploadedPhotos?: Array<{ fileId: string; localPath?: string }>;
    textInput?: string;
    cloneUrl?: string;
  };
  selectedNiche?: string;
  selectedStyles?: string[];
  selectedPlatforms?: number[];
  currentJobId?: string;
  caption?: string;
  connectingPlatform?: string;

  // v3.0 Basic/Smart/Pro mode state
  generateMode?: 'basic' | 'smart' | 'pro';
  generateAction?: 'image_set' | 'video' | 'clone_style' | 'campaign';
  generatePreset?: 'quick' | 'standard' | 'extended' | 'custom';
  generatePlatform?: 'tiktok' | 'instagram' | 'youtube' | 'square';
  generateProductDesc?: string;
  generateCampaignSize?: 5 | 10;
  generateScenes?: Array<{ sceneId: string; prompt: string; durationSeconds: number }>;
  generatePhotoUrl?: string;
  customPresetConfig?: any; // DurationPresetConfig for custom durations
  cloneRefUrl?: string;
}

export type BotState =
  | 'START'
  | 'ONBOARDING_LANGUAGE'
  | 'DASHBOARD'
  | 'CREATE_VIDEO_UPLOAD'
  | 'CREATE_VIDEO_NICHE'
  | 'CREATE_VIDEO_PLATFORM'
  | 'CREATE_VIDEO_BRIEF'
  | 'CREATE_VIDEO_CONFIRM'
  | 'CREATE_VIDEO_PROCESSING'
  | 'VIDEO_CREATE_SOURCE'
  | 'VIDEO_CREATE_UPLOAD'
  | 'VIDEO_CREATE_TEXT'
  | 'VIDEO_CREATE_CONTENT_TYPE'
  | 'VIDEO_CREATE_CATEGORY'
  | 'VIDEO_CREATE_TEMPLATE'
  | 'VIDEO_CREATE_CUSTOMIZE'
  | 'VIDEO_CREATE_PREVIEW'
  | 'CUSTOM_DURATION_INPUT'
  | 'CUSTOM_DURATION_INPUT_V3'
  | 'CUSTOM_PROMPT_INPUT'
  | 'CLONE_VIDEO_WAITING'
  | 'CLONE_EDIT_DESC_WAITING'
  | 'CLONE_IMAGE_WAITING'
  | 'DISASSEMBLE_WAITING'
  | 'REPURPOSE_VIDEO_URL'
  | 'REPURPOSE_CONFIRM'
  | 'IMAGE_GENERATION_WAITING'
  | 'IMAGE_REFERENCE_WAITING'
  | 'AVATAR_UPLOAD_WAITING'
  | 'AVATAR_NAME_WAITING'
  | 'WAITING_ACCOUNT_ID'
  | 'CUSTOMIZING_PROMPT'
  | 'CUSTOM_PROMPT_CREATION'
  | 'AWAITING_PRODUCT_INPUT'
  | 'AWAITING_CLONE_REF'
  | 'AWAITING_CLONE_PRODUCT'
  | 'AWAITING_SCENE_EDIT'
  | 'GENERATE_PROCESSING';

// =============================================================================
// USER TYPES
// =============================================================================

export type UserTier = 'free' | 'basic' | 'pro' | 'agency';
export type UserLanguage = string;

export interface User {
  id: number;
  telegramId: number;
  uuid: string;
  username?: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  tier: UserTier;
  creditBalance: number;
  creditExpiresAt?: Date;
  referralCode?: string;
  referredBy?: string;
  referralTier: number;
  language: UserLanguage;
  notificationsEnabled: boolean;
  autoRenewal: boolean;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

// =============================================================================
// VIDEO TYPES
// =============================================================================

export type VideoStatus = 'processing' | 'completed' | 'failed' | 'expired';
export type VideoPlatform = 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'twitter' | 'linkedin';
export type VideoNiche = 'fnb' | 'beauty' | 'retail' | 'services' | 'professional' | 'hospitality';

export interface VideoParams {
  niche: VideoNiche;
  platform: VideoPlatform;
  duration: number;
  scenes: number;
  images: string[];
  brief?: string;
  angles?: number;
}

// =============================================================================
// PAYMENT TYPES
// =============================================================================

export type TransactionStatus = 'pending' | 'processing' | 'success' | 'failed' | 'expired' | 'refunded';
export type TransactionType = 'topup' | 'subscription' | 'refund' | 'bonus' | 'adjustment';
export type PaymentGateway = 'midtrans' | 'tripay' | 'duitku' | 'nowpayments' | 'internal' | 'admin_transfer';

export interface TopupPackage {
  id: string;
  name: string;
  nameId: string;
  priceIdr: number;
  credits: number;
  bonus: number;
  expiryDays: number | null;
  savingsPercent: number;
}

// =============================================================================
// REFERRAL TYPES
// =============================================================================

export type CommissionStatus = 'pending' | 'available' | 'withdrawn';

export interface ReferralStats {
  totalReferrals: number;
  tier1Referrals: number;
  tier2Referrals: number;
  totalCommission: number;
  pendingCommission: number;
  availableCommission: number;
  withdrawnCommission: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export class BotError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'BotError';
  }
}

export class ValidationError extends BotError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class InsufficientCreditsError extends BotError {
  constructor(message: string = 'Insufficient credits') {
    super(message, 'INSUFFICIENT_CREDITS', 402);
    this.name = 'InsufficientCreditsError';
  }
}

export class RateLimitError extends BotError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}
