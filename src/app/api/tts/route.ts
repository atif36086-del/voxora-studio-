import { NextRequest, NextResponse } from 'next/server';
import { executeTTS } from '@/lib/ttsProvider';
import {
  TTSRequestBody,
  GOOGLE_VOICES,
  SARVAM_SPEAKERS,
  getEngineLimits,
} from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution timeout for long TTS audio synthesis

const VALID_SARVAM_SPEAKERS = SARVAM_SPEAKERS.map((s) => s.id);
const VALID_GOOGLE_VOICES = GOOGLE_VOICES.map((v) => v.id.toLowerCase());
const VALID_GEMINI_MODELS = [
  'gemini-3.8-flash-tts',
  'gemini-3.8-flash-lite-tts',
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts',
];

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<TTSRequestBody>;

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const {
      provider = 'google',
      text,
      speaker = 'Puck',
      pace = 1.0,
      stylePreset = 'Normal',
      customStyle,
      geminiModel = 'gemini-3.8-flash-lite-tts',
      autoFallbackToSarvam = false,
    } = body;

    // Validate presence of text
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Script text is required.' },
        { status: 400 }
      );
    }

    // Validate provider
    if (provider !== 'sarvam' && provider !== 'google') {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid provider "${provider}". Allowed: "sarvam" or "google".`,
        },
        { status: 400 }
      );
    }

    // Provider-specific speaker validation
    if (provider === 'sarvam') {
      const spk = speaker || 'shubh';
      if (!VALID_SARVAM_SPEAKERS.includes(spk)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid Sarvam voice "${spk}". Allowed: ${VALID_SARVAM_SPEAKERS.join(', ')}.`,
          },
          { status: 400 }
        );
      }

      // Validate pace range (0.5 to 2.0)
      const numPace = Number(pace);
      if (isNaN(numPace) || numPace < 0.5 || numPace > 2.0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Pace must be a number between 0.5 and 2.0 for Sarvam Bulbul v3.',
          },
          { status: 400 }
        );
      }
    } else if (provider === 'google') {
      const spk = (speaker || 'Puck').toLowerCase();
      if (!VALID_GOOGLE_VOICES.includes(spk)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid Google voice "${speaker}".`,
          },
          { status: 400 }
        );
      }

      if (geminiModel && !VALID_GEMINI_MODELS.includes(geminiModel)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid Gemini TTS model "${geminiModel}".`,
          },
          { status: 400 }
        );
      }
    }

    // Validate character length against active engine limit
    const limits = getEngineLimits(provider, geminiModel);
    if (text.trim().length > limits.maxChars) {
      return NextResponse.json(
        {
          success: false,
          error: `Script exceeds ${limits.maxChars.toLocaleString()} characters limit for ${limits.name}.`,
          details: `Current script length: ${text.trim().length.toLocaleString()} characters. Max allowed: ${limits.maxChars.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    // Execute through provider abstraction
    const result = await executeTTS({
      provider,
      text: text.trim(),
      speaker: speaker || (provider === 'google' ? 'Puck' : 'shubh'),
      pace: Number(pace) || 1.0,
      stylePreset,
      customStyle,
      geminiModel,
      autoFallbackToSarvam,
    });

    if (!result.success) {
      let statusCode = 400;
      if (
        result.error?.includes('SARVAM_API_KEY') ||
        result.error?.includes('GOOGLE_API_KEY')
      ) {
        statusCode = 401;
      } else if (result.error?.includes('Authentication failed')) {
        statusCode = 403;
      } else if (
        result.error?.includes('rate limit') ||
        result.error?.includes('quota')
      ) {
        statusCode = 429;
      } else if (result.error?.includes('unavailable') || result.error?.includes('temporarily')) {
        statusCode = 502;
      }

      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      {
        success: false,
        error: 'An internal server error occurred while processing the narration request.',
        details: message,
      },
      { status: 500 }
    );
  }
}
