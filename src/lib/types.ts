export type TTSProvider = 'sarvam' | 'google';

export type SarvamSpeakerId = 'shubh' | 'ashutosh' | 'priya' | 'suhani';

export type GoogleTTSModel =
  | 'gemini-3.8-flash-tts'
  | 'gemini-3.8-flash-lite-tts'
  | 'gemini-3.1-flash-tts-preview'
  | 'gemini-2.5-flash-preview-tts';

export interface GeminiModelInfo {
  id: GoogleTTSModel;
  name: string;
  badge: 'FLAGSHIP' | 'FAST' | 'PREVIEW' | 'STABLE';
  description: string;
  latency: string;
}

export const GEMINI_TTS_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-3.8-flash-tts',
    name: '3.8 Flash Studio',
    badge: 'FLAGSHIP',
    description: 'Flagship studio quality, richest dynamic audio & cinematic expression',
    latency: 'Studio HD',
  },
  {
    id: 'gemini-3.8-flash-lite-tts',
    name: '3.8 Flash-Lite',
    badge: 'FAST',
    description: 'High-throughput, rapid narration for fast drafts and recaps',
    latency: 'Sub-second',
  },
  {
    id: 'gemini-3.1-flash-tts-preview',
    name: '3.1 Flash Preview',
    badge: 'PREVIEW',
    description: 'Crisp Hindi cadence with natural storyteller inflection',
    latency: 'Fast',
  },
  {
    id: 'gemini-2.5-flash-preview-tts',
    name: '2.5 Flash Preview',
    badge: 'STABLE',
    description: 'Proven foundation model with maximum availability & stability',
    latency: 'Balanced',
  },
];

export type Gender = 'Male' | 'Female';

export interface VoiceInfo {
  id: string;
  name: string;
  gender: Gender;
  tagline: string;
  recommendedFor: string;
  isDefault?: boolean;
}

export type GoogleStylePreset = 'Normal' | 'Energetic' | 'Dramatic' | 'Calm';

export interface GoogleStyleInfo {
  id: GoogleStylePreset;
  name: string;
  instruction: string;
  description: string;
}

export const GOOGLE_STYLE_PRESETS: GoogleStyleInfo[] = [
  {
    id: 'Normal',
    name: 'Normal',
    instruction:
      'Speak naturally and conversationally like an experienced Indian anime YouTuber explaining a story to viewers.',
    description: 'Conversational, balanced storytelling pace',
  },
  {
    id: 'Energetic',
    name: 'Energetic',
    instruction:
      'Speak with energetic, confident YouTube narration. Keep the delivery natural and engaging.',
    description: 'High energy for shonen battle showdowns',
  },
  {
    id: 'Dramatic',
    name: 'Dramatic',
    instruction:
      'Use controlled cinematic emphasis and meaningful pauses for important moments. Avoid excessive acting.',
    description: 'Tension, cliffhangers & plot twists',
  },
  {
    id: 'Calm',
    name: 'Calm',
    instruction:
      'Speak clearly and calmly with relaxed pacing and natural conversational delivery.',
    description: 'Deep lore breakdowns & character backstories',
  },
];

export const SARVAM_SPEAKERS: VoiceInfo[] = [
  {
    id: 'shubh',
    name: 'Shubh',
    gender: 'Male',
    tagline: 'Deep, engaging & cinematic',
    recommendedFor: 'Anituber recaps & serious showdowns',
    isDefault: true,
  },
  {
    id: 'ashutosh',
    name: 'Ashutosh',
    gender: 'Male',
    tagline: 'High energy & crisp',
    recommendedFor: 'Shonen battle recaps & hype commentary',
  },
  {
    id: 'priya',
    name: 'Priya',
    gender: 'Female',
    tagline: 'Expressive & clear',
    recommendedFor: 'Character backstories & manhwa explanations',
  },
  {
    id: 'suhani',
    name: 'Suhani',
    gender: 'Female',
    tagline: 'Smooth & dramatic',
    recommendedFor: 'Plot twists, romance & dark fantasy lore',
  },
];

export const GOOGLE_VOICES: VoiceInfo[] = [
  // Top Featured Studio Voices
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Male',
    tagline: 'Upbeat, lively & engaging',
    recommendedFor: 'Anime recap storytelling & dialogue breakdowns',
    isDefault: true,
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male',
    tagline: 'Calm, authoritative & deep',
    recommendedFor: 'Serious lore explanations & power scaling analysis',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    tagline: 'Passionate & high energy',
    recommendedFor: 'Epic battle narration & tournament showdowns',
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    tagline: 'Firm, strong & expressive',
    recommendedFor: 'Manhwa recaps & emotional character arcs',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Female',
    tagline: 'Relaxed, natural & breezy',
    recommendedFor: 'Mystery plots, dark fantasy lore & summaries',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Female',
    tagline: 'Smooth, bright & clear',
    recommendedFor: 'Fast-paced episode summaries & reviews',
  },

  // Complete Extended Prebuilt Studio Voices (24 additional voices)
  {
    id: 'Algenib',
    name: 'Algenib',
    gender: 'Male',
    tagline: 'Gravelly, grounded & hard-hitting',
    recommendedFor: 'Dramatic villain reveals & intense showdowns',
  },
  {
    id: 'Umbriel',
    name: 'Umbriel',
    gender: 'Male',
    tagline: 'Easy-going, mysterious & laid-back',
    recommendedFor: 'Dark fantasy lore & casual explainers',
  },
  {
    id: 'Achird',
    name: 'Achird',
    gender: 'Male',
    tagline: 'Friendly, approachable & warm',
    recommendedFor: 'Casual walkthroughs & anime episode vlogs',
  },
  {
    id: 'Algieba',
    name: 'Algieba',
    gender: 'Male',
    tagline: 'Smooth, relaxed & polished',
    recommendedFor: 'Polished explanations & video essays',
  },
  {
    id: 'Alnilam',
    name: 'Alnilam',
    gender: 'Male',
    tagline: 'Firm, commanding & authoritative',
    recommendedFor: 'Power scaling & universe hierarchy breakdowns',
  },
  {
    id: 'Enceladus',
    name: 'Enceladus',
    gender: 'Male',
    tagline: 'Breathy, intimate & soft-spoken',
    recommendedFor: 'Intimate storytelling & sad character backstories',
  },
  {
    id: 'Iapetus',
    name: 'Iapetus',
    gender: 'Male',
    tagline: 'Clear, crisp & articulate',
    recommendedFor: 'Detailed technique & domain expansion breakdowns',
  },
  {
    id: 'Orus',
    name: 'Orus',
    gender: 'Male',
    tagline: 'Firm, serious & no-nonsense',
    recommendedFor: 'Battle tactical readouts & serious recaps',
  },
  {
    id: 'Rasalgethi',
    name: 'Rasalgethi',
    gender: 'Male',
    tagline: 'Informative, measured & balanced',
    recommendedFor: 'Anime history, lore & world-building audiobooks',
  },
  {
    id: 'Sadachbia',
    name: 'Sadachbia',
    gender: 'Male',
    tagline: 'Lively, animated & engaging',
    recommendedFor: 'Fast-paced daily anime digests & podcasts',
  },
  {
    id: 'Sadaltager',
    name: 'Sadaltager',
    gender: 'Male',
    tagline: 'Knowledgeable, deep & steady',
    recommendedFor: 'Scientific explanations & complex magic systems',
  },
  {
    id: 'Schedar',
    name: 'Schedar',
    gender: 'Male',
    tagline: 'Even, balanced & steady',
    recommendedFor: 'Neutral narration & episode summaries',
  },
  {
    id: 'Zubenelgenubi',
    name: 'Zubenelgenubi',
    gender: 'Male',
    tagline: 'Conversational, grounded & laid-back',
    recommendedFor: 'YouTuber reaction style recaps & casual commentary',
  },
  {
    id: 'Achernar',
    name: 'Achernar',
    gender: 'Female',
    tagline: 'Soft, calm & soothing',
    recommendedFor: 'Quiet or emotional character moments',
  },
  {
    id: 'Autonoe',
    name: 'Autonoe',
    gender: 'Female',
    tagline: 'Bright, positive & enthusiastic',
    recommendedFor: 'Hype top 10 lists & seasonal anime previews',
  },
  {
    id: 'Callirrhoe',
    name: 'Callirrhoe',
    gender: 'Female',
    tagline: 'Easy-going, relaxed & casual',
    recommendedFor: 'Friendly episode guides & casual manhwa chats',
  },
  {
    id: 'Despina',
    name: 'Despina',
    gender: 'Female',
    tagline: 'Smooth, mellow & polished',
    recommendedFor: 'Manhwa character arcs & romance recaps',
  },
  {
    id: 'Erinome',
    name: 'Erinome',
    gender: 'Female',
    tagline: 'Clear, articulate & precise',
    recommendedFor: 'Plot breakdown walkthroughs & summaries',
  },
  {
    id: 'Gacrux',
    name: 'Gacrux',
    gender: 'Female',
    tagline: 'Mature, authoritative & commanding',
    recommendedFor: 'Grand fantasy lore & serious presentations',
  },
  {
    id: 'Laomedeia',
    name: 'Laomedeia',
    gender: 'Female',
    tagline: 'Upbeat, energetic & vibrant',
    recommendedFor: 'Fast-paced manhwa recap reels & shorts',
  },
  {
    id: 'Leda',
    name: 'Leda',
    gender: 'Female',
    tagline: 'Youthful, vibrant & expressive',
    recommendedFor: 'Pop culture anime, gaming & modern isekai recaps',
  },
  {
    id: 'Pulcherrima',
    name: 'Pulcherrima',
    gender: 'Female',
    tagline: 'Confident, direct & forward',
    recommendedFor: 'Action commentary & high-stakes moments',
  },
  {
    id: 'Sulafat',
    name: 'Sulafat',
    gender: 'Female',
    tagline: 'Warm, inviting & comforting',
    recommendedFor: 'Emotional anime endings & warm intros',
  },
  {
    id: 'Vindemiatrix',
    name: 'Vindemiatrix',
    gender: 'Female',
    tagline: 'Gentle, mild & calming',
    recommendedFor: 'Slice-of-life anime recaps & calm lore',
  },
];

// Backwards compatibility alias
export const AVAILABLE_SPEAKERS = SARVAM_SPEAKERS;
export type SpeakerId = SarvamSpeakerId;
export type SpeakerInfo = VoiceInfo;
export type GoogleVoiceId = string;

export interface TTSRequestBody {
  provider?: TTSProvider;
  text: string;
  speaker?: string; // Sarvam or Google voice name
  pace?: number; // Sarvam pace (0.5 to 2.0)
  stylePreset?: GoogleStylePreset; // Google style preset
  customStyle?: string; // Optional custom instruction
  geminiModel?: GoogleTTSModel; // 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts' | ...
  autoFallbackToSarvam?: boolean; // When Gemini quota exhausts, automatically fallback to Sarvam Bulbul v3
}

export interface TTSResponseBody {
  success: boolean;
  audio?: string; // Base64 WAV data
  mimeType?: string;
  requestId?: string;
  provider?: TTSProvider;
  model?: string;
  speaker?: string;
  error?: string;
  details?: string;
  isDemo?: boolean;
  isQuota?: boolean;
  switchedModel?: boolean;
  fallbackNotice?: string;
}

export interface EngineLimitsInfo {
  provider: TTSProvider;
  modelId: string;
  name: string;
  shortName: string;
  maxChars: number;
  recommendedChars: number;
  estMaxDuration: string;
  sampleRate: string;
  bitDepth: string;
  rateLimitNote: string;
  description: string;
}

export const ENGINE_LIMITS: Record<string, EngineLimitsInfo> = {
  'gemini-3.8-flash-tts': {
    provider: 'google',
    modelId: 'gemini-3.8-flash-tts',
    name: 'Gemini 3.8 Flash Studio',
    shortName: '3.8 Flash Studio',
    maxChars: 3500,
    recommendedChars: 2500,
    estMaxDuration: '~5.0 min audio',
    sampleRate: '24,000 Hz',
    bitDepth: '16-bit Mono RIFF WAV',
    rateLimitNote: 'Studio HD Audio (Multi-model auto-fallback)',
    description: 'Flagship high-fidelity studio model with acoustic presence and rich anime acting nuance.',
  },
  'gemini-3.8-flash-lite-tts': {
    provider: 'google',
    modelId: 'gemini-3.8-flash-lite-tts',
    name: 'Gemini 3.8 Flash-Lite',
    shortName: '3.8 Flash-Lite',
    maxChars: 4000,
    recommendedChars: 3000,
    estMaxDuration: '~6.0 min audio',
    sampleRate: '24,000 Hz',
    bitDepth: '16-bit Mono RIFF WAV',
    rateLimitNote: 'High throughput, fast drafts',
    description: 'Optimized for high-speed generation and longer narration scripts.',
  },
  'gemini-3.1-flash-tts-preview': {
    provider: 'google',
    modelId: 'gemini-3.1-flash-tts-preview',
    name: 'Gemini 3.1 Flash Preview',
    shortName: '3.1 Flash Preview',
    maxChars: 3500,
    recommendedChars: 2500,
    estMaxDuration: '~5.0 min audio',
    sampleRate: '24,000 Hz',
    bitDepth: '16-bit Mono RIFF WAV',
    rateLimitNote: 'Crisp Hindi cadence, low latency',
    description: 'Natural storyteller cadence with crisp Hindi phonetics and smooth pacing.',
  },
  'gemini-2.5-flash-preview-tts': {
    provider: 'google',
    modelId: 'gemini-2.5-flash-preview-tts',
    name: 'Gemini 2.5 Flash Preview',
    shortName: '2.5 Flash Preview',
    maxChars: 3000,
    recommendedChars: 2200,
    estMaxDuration: '~4.5 min audio',
    sampleRate: '24,000 Hz',
    bitDepth: '16-bit Mono RIFF WAV',
    rateLimitNote: 'Proven stability & wide quotas',
    description: 'Battle-tested fallback engine ensuring uninterrupted generation.',
  },
};

export function getEngineLimits(
  provider: TTSProvider = 'google',
  geminiModel?: GoogleTTSModel
): EngineLimitsInfo {
  const key = geminiModel || 'gemini-3.8-flash-tts';
  return ENGINE_LIMITS[key] || ENGINE_LIMITS['gemini-3.8-flash-tts'];
}

export const MAX_SCRIPT_LENGTH = 4000; // Default max script length for Gemini TTS

// ============================================================================
// Anime Script Translation + Voiceover Workflow Types
// ============================================================================

export type AppMode = 'studio' | 'anime-workflow';

export type WorkflowStep = 'upload' | 'translate' | 'review' | 'tts' | 'export';

export interface DetectedEpisode {
  episodeNumber: number;
  title: string;
  text: string;
  charCount: number;
  wordCount: number;
}

export interface ScriptMetadata {
  fileName: string;
  fileSize: number;
  detectedEpisodes: DetectedEpisode[];
  totalCharacters: number;
  totalWords: number;
  estTranslationCostUSD: number;
  estTranslationCostINR: number;
  estTTSCostUSD: number;
  estTTSCostINR: number;
  estDurationMinutes: number;
}

export type ChunkStatus =
  | 'pending'
  | 'translating'
  | 'completed'
  | 'failed'
  | 'needs_review';

export type AudioChunkStatus = 'idle' | 'generating' | 'completed' | 'failed';

export interface QualityCheckResult {
  passed: boolean;
  score: number;
  notes: string[];
  issues?: string[];
  retried?: boolean;
}

export interface WorkflowChunk {
  id: string;
  episodeNumber: number;
  episodeTitle: string;
  chunkIndex: number;
  totalChunksInEpisode: number;
  originalText: string;
  translatedText: string;
  status: ChunkStatus;
  qualityCheck?: QualityCheckResult;
  error?: string;
  terminology: Record<string, string>;
  audioBase64?: string;
  audioUrl?: string;
  audioStatus: AudioChunkStatus;
  audioDurationSec?: number;
  audioError?: string;
  updatedAt: number;
}

export interface WorkflowProjectSettings {
  translationModel: string;
  ttsProvider: TTSProvider;
  ttsVoice: string;
  ttsPace: number;
  ttsStylePreset?: GoogleStylePreset;
  geminiTTSModel?: GoogleTTSModel;
  chunkSize: number;
  temperature: number;
  autoFailoverModels?: boolean;
  crossEngineFallback?: boolean;
}

export interface WorkflowProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  currentStep: WorkflowStep;
  metadata: ScriptMetadata;
  chunks: WorkflowChunk[];
  terminologyMemory: Record<string, string>;
  settings: WorkflowProjectSettings;
  finalAudio?: {
    wavBase64?: string;
    mp3Base64?: string;
    wavUrl?: string;
    mp3Url?: string;
    durationSec: number;
    totalSizeMb: number;
    mergedAt: number;
  };
}

