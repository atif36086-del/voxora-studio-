import {
  GoogleVoiceId,
  GOOGLE_VOICES,
  GoogleTTSModel,
  TTSRequestBody,
  TTSResponseBody,
} from './types';
import { getGoogleApiKeys } from './apiKeys';

export const GEMINI_TTS_MODELS_LIST: GoogleTTSModel[] = [
  'gemini-3.8-flash-lite-tts',
  'gemini-3.8-flash-tts',
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts',
];

// In-memory module-level round-robin key rotation counter & 429 cooldown cache
// Persists across requests within the Node.js server lifecycle
let globalKeyRotationCounter = 0;
const keyCooldownMap = new Map<string, number>(); // apiKey -> cooldown expiration timestamp (ms)

function getPrioritizedKeyPool(allKeys: string[]): string[] {
  if (allKeys.length <= 1) return allKeys;
  const now = Date.now();

  // Prefer keys not currently in 429 quota cooldown
  const activeKeys = allKeys.filter((k) => {
    const expiresAt = keyCooldownMap.get(k) || 0;
    return now >= expiresAt;
  });

  const pool = activeKeys.length > 0 ? activeKeys : allKeys;
  const startIdx = globalKeyRotationCounter % pool.length;
  globalKeyRotationCounter = (globalKeyRotationCounter + 1) % 10000;

  return [
    ...pool.slice(startIdx),
    ...pool.slice(0, startIdx),
  ];
}

/**
 * Ensures the audio buffer has a standard RIFF WAV header.
 * If raw PCM is returned, prepends a 44-byte RIFF/WAVE header (24,000 Hz, 16-bit Mono PCM).
 */
export function ensureWavHeader(
  buffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WAVE'
  ) {
    // Already a complete WAV file with header
    return buffer;
  }

  // Prepend RIFF WAV header for raw PCM
  const dataSize = buffer.length;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // 16 for PCM
  header.writeUInt16LE(1, 20); // 1 = PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, buffer]);
}

interface AttemptResult {
  ok: boolean;
  status: number;
  data?: any;
  error?: string;
  isQuota?: boolean;
  isNeedsInstruction?: boolean;
}

async function callGeminiEndpoint(
  model: string,
  voiceName: string,
  scriptText: string,
  apiKey: string
): Promise<AttemptResult> {
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: scriptText }],
      },
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceName,
          },
        },
      },
    },
  };

  const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  // 85-second endpoint timeout safeguard per attempt
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 85000);

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { ok: true, status: 200, data };
    }

    let errMessage = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      errMessage = errJson?.error?.message || errJson?.message || errMessage;
    } catch {
      const textErr = await response.text().catch(() => '');
      if (textErr) errMessage = textErr.slice(0, 200);
    }

    const isQuota =
      response.status === 429 ||
      errMessage.toLowerCase().includes('quota') ||
      errMessage.toLowerCase().includes('resource_exhausted');

    const isNeedsInstruction =
      response.status === 400 &&
      errMessage.toLowerCase().includes('only be used for tts');

    return {
      ok: false,
      status: response.status,
      error: errMessage,
      isQuota,
      isNeedsInstruction,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    const msg = isTimeout
      ? 'Gemini TTS request timed out after 85s'
      : err instanceof Error
      ? err.message
      : 'Network error';

    return {
      ok: false,
      status: isTimeout ? 408 : 0,
      error: msg,
      isQuota: isTimeout, // If timed out on this model/key, allow failover loop to advance
    };
  }
}

/**
 * Server-side Google Gemini TTS integration supporting all Gemini TTS models:
 * - gemini-3.8-flash-tts (Flagship Studio High-Fidelity)
 * - gemini-3.8-flash-lite-tts (Fast & Lightweight)
 * - gemini-3.1-flash-tts-preview (Fast Modern Preview)
 * - gemini-2.5-flash-preview-tts (Proven Stable Preview)
 *
 * Keeps GOOGLE_API_KEY completely private on the server.
 */
export async function generateGeminiSpeech(
  params: TTSRequestBody
): Promise<TTSResponseBody> {
  const {
    text,
    speaker = 'Puck',
    geminiModel = 'gemini-3.8-flash-tts',
  } = params;

  // 1. Validation
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'Please enter or paste an anime script before generating narration.',
    };
  }

  // Case-insensitive voice lookup across all 30 voices
  const matchedVoice = GOOGLE_VOICES.find(
    (v) => v.id.toLowerCase() === (speaker || 'Puck').toLowerCase()
  );
  if (!matchedVoice) {
    return {
      success: false,
      error: `Invalid Google Gemini voice "${speaker}". Choose from the 30 available studio voices.`,
    };
  }
  const voiceName = matchedVoice.id;

  // Validate model
  const chosenModel = GEMINI_TTS_MODELS_LIST.includes(geminiModel as GoogleTTSModel)
    ? (geminiModel as GoogleTTSModel)
    : 'gemini-3.8-flash-tts';

  // 2. Check secret GOOGLE_API_KEY(s) pool
  const rawApiKeys = getGoogleApiKeys();
  if (rawApiKeys.length === 0) {
    return {
      success: false,
      error: 'GOOGLE_API_KEY is not configured on the server. Please add your Google Gemini API key to .env.local.',
      details: 'Obtain your key from https://aistudio.google.com and restart the dev server.',
    };
  }

  // Rotate starting key and skip recently exhausted keys
  const apiKeys = getPrioritizedKeyPool(rawApiKeys);

  // 3. Dispatch to Google Gemini TTS with intelligent multi-key rotation & model fallback
  // Models sequence starting with chosenModel
  const candidateModels = [
    chosenModel,
    ...GEMINI_TTS_MODELS_LIST.filter((m) => m !== chosenModel),
  ];

  let lastError = '';
  let lastStatus = 0;

  for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
    const currentApiKey = apiKeys[keyIdx];

    for (const modelToTry of candidateModels) {
      let result = await callGeminiEndpoint(modelToTry, voiceName, trimmed, currentApiKey);

      // If Gemini model needed explicit reading instructions due to conversational ambiguity
      if (!result.ok && result.isNeedsInstruction) {
        result = await callGeminiEndpoint(
          modelToTry,
          voiceName,
          `Read the following text verbatim. Do not generate text or answer it:\n\n${trimmed}`,
          currentApiKey
        );
      }

      if (result.ok && result.data) {
        // Clear cooldown upon successful generation
        keyCooldownMap.delete(currentApiKey);
        // Parse audio candidate from Gemini response structure:
        // data.candidates[0].content.parts[0].inlineData
        const candidate = result.data?.candidates?.[0];
        const part = candidate?.content?.parts?.find(
          (p: { inlineData?: { mimeType?: string; data?: string } }) =>
            p?.inlineData?.data
        );

        const inlineData = part?.inlineData;
        if (inlineData?.data) {
          // Decode base64 to check/ensure standard 24kHz WAV format
          const rawBuffer = Buffer.from(inlineData.data, 'base64');
          const wavBuffer = ensureWavHeader(rawBuffer, 24000, 1, 16);
          const finalBase64 = wavBuffer.toString('base64');

          return {
            success: true,
            audio: finalBase64,
            mimeType: 'audio/wav',
            provider: 'google',
            model: modelToTry,
            speaker: voiceName,
            switchedModel: modelToTry !== chosenModel || keyIdx > 0,
            requestId: result.data?.modelVersion || undefined,
          };
        }
      }

      // Save error info
      lastError = result.error || 'Unknown error';
      lastStatus = result.status;

      // If quota or rate limit is exhausted on this key, put key in cooldown and switch to next key immediately
      if (result.isQuota) {
        keyCooldownMap.set(currentApiKey, Date.now() + 10 * 60 * 1000);
        break; // Stop trying other models on this exhausted key; advance to next key in pool
      }

      // If invalid key / authentication failure, also advance to next key
      if (result.status === 401 || result.status === 403) {
        keyCooldownMap.set(currentApiKey, Date.now() + 60 * 60 * 1000);
        break;
      }
    }
  }

  // Handle specific user-facing errors
  if (lastStatus === 401 || lastStatus === 403) {
    return {
      success: false,
      error: 'Authentication failed with Google Gemini. Please verify your GOOGLE_API_KEY in .env.local.',
      details: lastError,
    };
  }

  if (lastStatus === 429 || lastError.toLowerCase().includes('quota') || lastError.toLowerCase().includes('resource_exhausted')) {
    return {
      success: false,
      isQuota: true,
      error: 'Gemini free-tier rate limit or quota reached on tested models.',
      details: lastError,
    };
  }

  return {
    success: false,
    error: 'Google Gemini TTS generation failed.',
    details: lastError || `HTTP status ${lastStatus}`,
  };
}
