export interface VideoProviderConfig {
  name: string;
  priority: number;
  timeout: number;
  failureThreshold: number;
  recoveryTimeout: number;
  strengths: string[];
  quirks: string;
  avoid: string[];
  tokenLimit: number;
  supportsImg2Video: boolean;
  maxDuration: number;
  local?: boolean;
}

export interface ImageProviderConfig {
  name: string;
  priority: number;
  timeout: number;
  failureThreshold: number;
  recoveryTimeout: number;
  strengths: string[];
  quirks: string;
  tokenLimit: number;
}

export const PROVIDER_CONFIG: {
  video: Record<string, VideoProviderConfig>;
  image: Record<string, ImageProviderConfig>;
} = {
  video: {
    byteplus: {
      name: 'BytePlus Seedance',
      priority: 1,
      timeout: 30000,
      failureThreshold: 3,
      recoveryTimeout: 60000,
      strengths: ['realistic', 'smooth_motion', 'product_focus'],
      quirks: 'prefers detailed lighting, responds to "commercial quality"',
      avoid: ['anime', 'cartoon'],
      tokenLimit: 500,
      supportsImg2Video: true,
      maxDuration: 10,
    },
    xai: {
      name: 'XAI Grok Aurora',
      priority: 2,
      timeout: 25000,
      failureThreshold: 3,
      recoveryTimeout: 45000,
      strengths: ['creative', 'dynamic', 'text_understanding'],
      quirks: 'excellent at complex directions, good with creative styles',
      avoid: ['overly_technical_specs'],
      tokenLimit: 1000,
      supportsImg2Video: true,
      maxDuration: 15,
    },
    laozhang: {
      name: 'LaoZhang',
      priority: 3,
      timeout: 35000,
      failureThreshold: 5,
      recoveryTimeout: 90000,
      strengths: ['anime', 'stylized', 'character_focus'],
      quirks: 'optimized for eastern animation',
      avoid: ['photorealistic', 'western_commercial'],
      tokenLimit: 400,
      supportsImg2Video: false,
      maxDuration: 8,
    },
    evolink: {
      name: 'EvoLink',
      priority: 4,
      timeout: 40000,
      failureThreshold: 5,
      recoveryTimeout: 120000,
      strengths: ['versatile', 'async_processing'],
      quirks: 'webhook-based, good for long videos',
      avoid: [],
      tokenLimit: 600,
      supportsImg2Video: true,
      maxDuration: 12,
    },
    hypereal: {
      name: 'Hypereal',
      priority: 5,
      timeout: 35000,
      failureThreshold: 4,
      recoveryTimeout: 90000,
      strengths: ['aspect_ratio_control', 'stable'],
      quirks: 'specific aspect ratios',
      avoid: [],
      tokenLimit: 500,
      supportsImg2Video: true,
      maxDuration: 12,
    },
    siliconflow: {
      name: 'SiliconFlow',
      priority: 6,
      timeout: 30000,
      failureThreshold: 5,
      recoveryTimeout: 60000,
      strengths: ['balanced', 'img2video'],
      quirks: 'standard API, reliable',
      avoid: [],
      tokenLimit: 500,
      supportsImg2Video: true,
      maxDuration: 10,
    },
    falai_video: {
      name: 'Fal.ai Video',
      priority: 7,
      timeout: 45000,
      failureThreshold: 4,
      recoveryTimeout: 120000,
      strengths: ['fast', 'good_motion', 'versatile'],
      quirks: 'queue-based, clear subject isolation',
      avoid: ['overly_complex_scenes'],
      tokenLimit: 300,
      supportsImg2Video: true,
      maxDuration: 20,
    },
    kie: {
      name: 'Kie.ai',
      priority: 8,
      timeout: 50000,
      failureThreshold: 5,
      recoveryTimeout: 180000,
      strengths: ['character_animation', 'smooth'],
      quirks: 'specialized in character movement',
      avoid: [],
      tokenLimit: 400,
      supportsImg2Video: true,
      maxDuration: 15,
    },
    remotion: {
      name: 'Remotion+FFmpeg',
      priority: 9,
      timeout: 120000,
      failureThreshold: 1,
      recoveryTimeout: 300000,
      strengths: ['reliable', 'local', 'slideshow'],
      quirks: 'resource intensive, last resort',
      avoid: [],
      tokenLimit: 1000,
      supportsImg2Video: false,
      maxDuration: 300,
      local: true,
    },
  },

  image: {
    geminigen: {
      name: 'GeminiGen',
      priority: 1,
      timeout: 20000,
      failureThreshold: 3,
      recoveryTimeout: 60000,
      strengths: ['style_consistency', 'quality'],
      quirks: 'best for commercial use',
      tokenLimit: 500,
    },
    nvidia: {
      name: 'NVIDIA Flux',
      priority: 2,
      timeout: 15000,
      failureThreshold: 3,
      recoveryTimeout: 45000,
      strengths: ['fast', 'photorealistic'],
      quirks: 'fast inference',
      tokenLimit: 500,
    },
    replicate: {
      name: 'Replicate',
      priority: 3,
      timeout: 30000,
      failureThreshold: 4,
      recoveryTimeout: 90000,
      strengths: ['diverse_models', 'controlnet'],
      quirks: 'many model options',
      tokenLimit: 500,
    },
    falai: {
      name: 'Fal.ai Image',
      priority: 4,
      timeout: 25000,
      failureThreshold: 4,
      recoveryTimeout: 90000,
      strengths: ['artistic', 'styles'],
      quirks: 'artistic specialization',
      tokenLimit: 400,
    },
    huggingface: {
      name: 'HuggingFace',
      priority: 5,
      timeout: 35000,
      failureThreshold: 5,
      recoveryTimeout: 120000,
      strengths: ['cost_effective', 'open_source'],
      quirks: 'inference endpoints',
      tokenLimit: 500,
    },
  },
};

// Sorted provider lists by priority
export const VIDEO_PROVIDERS_SORTED = Object.entries(PROVIDER_CONFIG.video)
  .sort(([, a], [, b]) => a.priority - b.priority)
  .map(([key, config]) => ({ key, ...config }));

export const IMAGE_PROVIDERS_SORTED = Object.entries(PROVIDER_CONFIG.image)
  .sort(([, a], [, b]) => a.priority - b.priority)
  .map(([key, config]) => ({ key, ...config }));
