import { SpeakerId, TTSRequestBody, TTSResponseBody } from './types';
import { getSarvamApiKeys } from './apiKeys';

const SARVAM_API_URL = 'https://api.sarvam.ai/text-to-speech';
const ALLOWED_SPEAKERS: SpeakerId[] = ['shubh', 'ashutosh', 'priya', 'suhani'];

/**
 * Server-side Sarvam Bulbul v3 TTS caller.
 * Keeps SARVAM_API_KEY completely private on the server.
 */
export async function generateSarvamSpeech(
  params: TTSRequestBody
): Promise<TTSResponseBody> {
  const { text, speaker = 'shubh', pace } = params;

  // 1. Validation
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'Please enter or paste an anime script before generating narration.',
    };
  }

  if (trimmed.length > 2500) {
    return {
      success: false,
      error: `Script exceeds the 2,500 character limit (Current: ${trimmed.length.toLocaleString()} characters). Please shorten your script.`,
    };
  }

  if (!ALLOWED_SPEAKERS.includes(speaker as SpeakerId)) {
    return {
      success: false,
      error: `Invalid speaker "${speaker}". Must be one of: ${ALLOWED_SPEAKERS.join(', ')}.`,
    };
  }

  const clampedPace = Math.min(Math.max(Number(pace) || 1.0, 0.5), 2.0);

  // 2. Secret API Key check (Strictly server-side)
  const apiKeys = getSarvamApiKeys();

  if (apiKeys.length === 0) {
    return {
      success: false,
      error: 'SARVAM_API_KEY is not configured on the server. Please add your Sarvam AI API key to .env.local.',
      details: 'Get your key at https://dashboard.sarvam.ai and restart the dev server.',
    };
  }

  // 3. Dispatch to Sarvam AI Bulbul v3 with multi-key pool rotation
  let lastErrorResult: TTSResponseBody = {
    success: false,
    error: 'Sarvam AI generation failed.',
  };

  for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
    const apiKey = apiKeys[keyIdx];

    try {
      const payload = {
        text: trimmed,
        language_code: 'hi-IN',
        model: 'bulbul:v3',
        speaker: speaker.toLowerCase(),
        pace: clampedPace,
      };

      const response = await fetch(SARVAM_API_URL, {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `Sarvam API returned error status ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch {
          const textErr = await response.text().catch(() => '');
          if (textErr) errorMessage = textErr.slice(0, 200);
        }

        // If credits exhausted (402) or rate limited (429), try next key if available
        if ((response.status === 402 || response.status === 429) && keyIdx < apiKeys.length - 1) {
          continue;
        }

        switch (response.status) {
          case 400:
            return {
              success: false,
              error: 'Bad Request: The script format or speaker parameters were rejected by Sarvam AI.',
              details: errorMessage,
            };
          case 401:
          case 403:
            return {
              success: false,
              error: 'Authentication failed with Sarvam AI. Please verify your SARVAM_API_KEY in .env.local.',
              details: 'Ensure your subscription key is active on dashboard.sarvam.ai.',
            };
          case 402:
            return {
              success: false,
              error: 'Sarvam AI credits khatam ho gaye hain (Payment Required / No credits available).',
              details: 'Please recharge your wallet on dashboard.sarvam.ai or add a new free API key in .env.local.',
            };
          case 422:
            return {
              success: false,
              error: 'Unprocessable content. Ensure text does not contain unsupported control characters.',
              details: errorMessage,
            };
          case 429:
            return {
              success: false,
              error: 'Sarvam AI rate limit reached. Please wait a moment before generating another narration.',
              details: errorMessage,
            };
          case 500:
          case 502:
          case 503:
            return {
              success: false,
              error: 'Sarvam AI TTS servers are temporarily experiencing issues. Please try again shortly.',
              details: errorMessage,
            };
          default:
            return {
              success: false,
              error: `Sarvam AI returned error (${response.status}).`,
              details: errorMessage,
            };
        }
      }

      const data = await response.json();

      if (!data?.audios || !Array.isArray(data.audios) || data.audios.length === 0) {
        return {
          success: false,
          error: 'Sarvam AI did not return any audio in the response.',
          details: JSON.stringify(data),
        };
      }

      const base64Audio = data.audios[0];
      return {
        success: true,
        audio: base64Audio,
        mimeType: 'audio/wav',
        provider: 'sarvam',
        model: 'bulbul:v3',
        speaker,
        requestId: data.request_id || undefined,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown network failure';
      lastErrorResult = {
        success: false,
        error: 'Network connection failed while calling Sarvam AI.',
        details: msg,
      };
      if (keyIdx < apiKeys.length - 1) continue;
    }
  }

  return lastErrorResult;
}
