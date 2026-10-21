import { TTSRequestBody, TTSResponseBody } from './types';
import { generateSarvamSpeech } from './sarvam';
import { generateGeminiSpeech } from './gemini';

/**
 * Clean Unified Provider Abstraction.
 * Routes TTS generation requests to either Sarvam AI Bulbul v3 or Google Gemini 3.8 Flash-Lite TTS.
 */
export async function executeTTS(
  params: TTSRequestBody
): Promise<TTSResponseBody> {
  const provider = params.provider || 'google';

  if (provider === 'sarvam') {
    const sarvamResult = await generateSarvamSpeech(params);
    return {
      ...sarvamResult,
      provider: 'sarvam',
      model: 'bulbul:v3',
      speaker: params.speaker || 'shubh',
    };
  }

  // Default: Google Gemini TTS
  return generateGeminiSpeech(params);
}
