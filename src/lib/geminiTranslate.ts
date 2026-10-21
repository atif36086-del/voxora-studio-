import { QualityCheckResult } from './types';
import { getGoogleApiKeys } from './apiKeys';

export const GEMINI_TRANSLATION_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];


export interface TranslationRequestOptions {
  model?: string;
  sourceText: string;
  previousHinglishContext?: string;
  upcomingSourceContext?: string;
  terminologyMemory?: Record<string, string>;
  episodeTitle?: string;
  chunkNumber?: number;
  totalChunks?: number;
  customGuidance?: string;
  retryReason?: string;
}

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  newTerminology?: Record<string, string>;
  qualityCheck: QualityCheckResult;
  modelUsed?: string;
  error?: string;
  details?: string;
}

/**
 * Builds the high-fidelity YouTuber Hinglish system instruction.
 */
export function buildTranslationPrompt(options: TranslationRequestOptions): string {
  const {
    sourceText,
    previousHinglishContext,
    upcomingSourceContext,
    terminologyMemory = {},
    episodeTitle,
    chunkNumber,
    totalChunks,
    customGuidance,
    retryReason,
  } = options;

  const glossaryList = Object.entries(terminologyMemory)
    .map(([eng, rom]) => `- "${eng}": keep as "${rom}"`)
    .join('\n');

  return `You are a top-tier Indian Anime YouTuber and narrator (like AnimeTM, BnfTV, SuperHero Fan, Not Your Type) recording a professional voiceover recap and explanation.

YOUR TASK:
Translate the provided English anime script chunk into natural, highly engaging Roman-script Hinglish for text-to-speech voiceover.

CRITICAL RULES (STRICT COMPLIANCE REQUIRED):
1. **FULL TRANSLATION - ABSOLUTELY NO SUMMARIZATION**:
   - Translate EVERY SINGLE SENTENCE, scene event, character movement, explanation, and reaction.
   - Do NOT skip or shorten paragraphs.
   - Do NOT combine multiple sentences into a brief summary.
   - The output must be comprehensive and retain 100% of the narrative detail.

2. **YOUTUBER HINGLISH NARRATION TONE**:
   - Write in conversational, fluent Roman-script Hinglish (Hindi written in English alphabet).
   - Use engaging narration cadences typical of Indian anime explainers.
   - Example style:
     * BAD: "After seeing this, Kohici realizes that something is wrong and immediately follows them."
     * BAD: "Yeh dekhne ke pashchat, Kohici ko gyat hota hai..." (too formal/archaic)
     * GOOD: "Ye sab dekhne ke baad Kohici ko samajh aa jata hai ki kuch toh gadbad hai, isliye woh turant unka peecha karne lagta hai."
   - Keep flow dynamic, rhythmic, and natural to speak aloud for TTS.

3. **PRESERVE ALL PROPER NAMES & ANIME TERMS VERBATIM**:
   - Character names: Kohici, Deku, Bakugo, All Might, Gojo, Sukuna, Sung Jin-woo, etc. (Keep in English spelling)
   - Quirks & Abilities: One For All, All For One, Limitless, Hollow Purple, Domain Expansion, Gear 5, Bankai, Rasengan, etc.
   - Attack names: Getsuga Tensho, Detroit Smash, United States of Smash, etc.
   - Organizations & Places: U.A. High, League of Villains, Soul Society, Shibuya, etc.
   - Standard anime terms: Sensei, Senpai, Nakama, Shonen, Isekai, Manhwa, etc.
   - DO NOT translate proper names into Hindi words.

4. **FILLER CLEANUP**:
   - Clean out meaningless vocal filler like: "uh", "um", "hmm", "[screaming]", "[music plays]", "haha".
   - HOWEVER, preserve all spoken dialogue and reactions by seamlessly integrating them into natural storytelling narration.

5. **TERMINOLOGY MEMORY**:
${glossaryList.length > 0 ? glossaryList : 'No prior terms recorded yet. Maintain strict consistency.'}

${previousHinglishContext ? `PREVIOUS TRANSLATED CHUNK CONTEXT (for voice & tone continuity):\n"${previousHinglishContext}"\n` : ''}
${upcomingSourceContext ? `UPCOMING SOURCE TEXT PREVIEW (for immediate context):\n"${upcomingSourceContext}"\n` : ''}
${episodeTitle ? `EPISODE / SECTION: ${episodeTitle} (Part ${chunkNumber || 1} of ${totalChunks || 1})\n` : ''}
${customGuidance ? `USER GUIDANCE: ${customGuidance}\n` : ''}
${retryReason ? `⚠️ PREVIOUS ATTEMPT FAILED QUALITY CHECK FOR THIS REASON:\n${retryReason}\nPlease fix this immediately! Ensure no story event is omitted.\n` : ''}

CURRENT ENGLISH SCRIPT TO TRANSLATE (FULL TEXT):
"""
${sourceText}
"""

OUTPUT FORMAT:
Respond in valid JSON format with exactly these fields:
{
  "translatedText": "Your complete, line-by-line Roman-script Hinglish translation here...",
  "newTerms": { "EnglishTerm": "PreservedTerm" }
}
Do NOT include markdown formatting other than raw JSON or json code block.`;
}

/**
 * Validates translation quality against summarization, dropouts, and untranslated English.
 */
export function validateHinglishTranslation(
  source: string,
  translated: string
): QualityCheckResult {
  const issues: string[] = [];
  const notes: string[] = [];
  let score = 100;

  const sourceWords = source.trim().split(/\s+/).filter(Boolean);
  const transWords = translated.trim().split(/\s+/).filter(Boolean);

  // 1. Ratio check: Hinglish narration typically has 85% to 160% of source word count
  const wordRatio = transWords.length / Math.max(1, sourceWords.length);

  if (wordRatio < 0.65) {
    issues.push(
      `Possible summarization detected: Translation length is only ${(wordRatio * 100).toFixed(0)}% of source text.`
    );
    score -= 35;
  } else if (wordRatio >= 0.85) {
    notes.push('Complete narrative length preserved.');
  }

  // 2. Untranslated English sentences check:
  // Check if substantial blocks of English sentences were passed through without Hinglish translation
  const englishSentenceMatches = translated.match(
    /[A-Z][^.!?]*\b(the|and|with|that|this|which|because|from|their|there)\b[^.!?]*[.!?]/g
  );
  if (englishSentenceMatches && englishSentenceMatches.length > 2) {
    // If multiple complete pure-English grammatical sentences exist
    issues.push(
      'Detected potential untranslated English sentences in Hinglish script.'
    );
    score -= 20;
  } else {
    notes.push('Consistent Roman Hinglish vocabulary.');
  }

  // 3. Hinglish verb/connective marker check
  const hinglishMarkers = [
    /\b(hai|hain|tha|thi|the|karta|karte|karti|raha|rahe|rahi|gaya|gaye|gayi|diya|diye)\b/i,
    /\b(lekin|par|magar|isliye|kyunki|tabhi|phir|jab|jabki|jaise|waisa)\b/i,
    /\b(samajh|dekh|sun|bol|keh|jaate|aate|chalta|shuru|lagta|kuch)\b/i,
  ];

  let markersFound = 0;
  for (const marker of hinglishMarkers) {
    if (marker.test(translated)) markersFound++;
  }

  if (markersFound < 2 && transWords.length > 25) {
    issues.push('Translation lacks natural Hindi verbal flow or connectors.');
    score -= 25;
  } else {
    notes.push('Natural Hindi cadence and conversational connectors verified.');
  }

  // 4. Proper name capitalization & consistency check
  const sourceCapitalized = source.match(/\b[A-Z][a-z]{3,}\b/g) || [];
  const uniqueNames = Array.from(new Set(sourceCapitalized)).slice(0, 5);
  let preservedNamesCount = 0;

  for (const name of uniqueNames) {
    if (new RegExp(`\\b${name}\\b`, 'i').test(translated)) {
      preservedNamesCount++;
    }
  }

  if (uniqueNames.length > 0 && preservedNamesCount === 0 && sourceWords.length > 40) {
    issues.push('Character or location names may have been omitted or distorted.');
    score -= 15;
  } else {
    notes.push('Key proper names preserved.');
  }

  const passed = score >= 70 && !issues.some((i) => i.includes('summarization'));

  return {
    passed,
    score: Math.max(0, score),
    notes,
    issues: issues.length > 0 ? issues : undefined,
  };
}

/**
 * Calls Google Gemini REST API to translate script chunk.
 */
async function callGeminiTranslateAPI(
  model: string,
  prompt: string,
  apiKey: string,
  temperature = 0.4
): Promise<{ ok: boolean; status: number; text?: string; error?: string }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: 8192,
        },
      }),
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { ok: true, status: 200, text: rawText };
    }

    let errDetail = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      errDetail = errJson?.error?.message || errDetail;
    } catch {
      const textErr = await response.text().catch(() => '');
      if (textErr) errDetail = textErr.slice(0, 200);
    }

    return { ok: false, status: response.status, error: errDetail };
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    const msg = isTimeout
      ? 'Request timed out after 20s'
      : err instanceof Error
      ? err.message
      : 'Network error';
    return { ok: false, status: isTimeout ? 408 : 0, error: msg };
  }
}

/**
 * Parses LLM response text and extracts JSON cleanly.
 */
export function parseTranslationJson(raw: string): {
  translatedText: string;
  newTerms: Record<string, string>;
} {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      translatedText: (parsed.translatedText || '').trim(),
      newTerms: parsed.newTerms || {},
    };
  } catch {
    // If JSON parsing fails, extract text intelligently
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          translatedText: (parsed.translatedText || '').trim(),
          newTerms: parsed.newTerms || {},
        };
      } catch {
        // Fallback
      }
    }

    // Direct fallback to cleaned text
    return {
      translatedText: cleaned,
      newTerms: {},
    };
  }
}

export const parseGeminiJson = parseTranslationJson;

/**
 * Main translation function with automatic multi-model fallback and quality retry.
 */
export async function translateAnimeScriptChunk(
  options: TranslationRequestOptions
): Promise<TranslationResult> {
  const apiKeys = getGoogleApiKeys();
  if (apiKeys.length === 0) {
    return {
      success: false,
      qualityCheck: { passed: false, score: 0, notes: [] },
      error: 'GOOGLE_API_KEY is not configured on the server.',
      details: 'Please set your valid Google Gemini API key in .env.local.',
    };
  }

  const rawModel = options.model || 'gemini-flash-lite-latest';
  const requestedModel =
    rawModel.includes('2.5') || rawModel.includes('2.0') || rawModel.includes('1.5')
      ? 'gemini-flash-lite-latest'
      : rawModel;
  const modelsToTry = [
    requestedModel,
    ...GEMINI_TRANSLATION_MODELS.filter((m) => m !== requestedModel),
  ];

  let currentRetry = 0;
  const maxRetries = 2;
  let retryReason = options.retryReason;

  while (currentRetry <= maxRetries) {
    const prompt = buildTranslationPrompt({
      ...options,
      retryReason,
    });

    for (const apiKey of apiKeys) {
      for (const model of modelsToTry) {
        const response = await callGeminiTranslateAPI(model, prompt, apiKey);

        if (response.ok && response.text) {
          const { translatedText, newTerms } = parseGeminiJson(response.text);

          if (translatedText) {
            // Perform automatic quality check
            const qc = validateHinglishTranslation(
              options.sourceText,
              translatedText
            );

            // If validation failed and we have retries remaining, loop with retry reason
            if (!qc.passed && currentRetry < maxRetries) {
              currentRetry++;
              retryReason = qc.issues?.join('; ') || 'Quality check failed';
              break; // Break inner model loop to retry with prompt correction
            }

            if (currentRetry > 0) {
              qc.retried = true;
            }

            return {
              success: true,
              translatedText,
              newTerminology: newTerms,
              qualityCheck: qc,
              modelUsed: model,
            };
          }
        }

        // If rate limited (429) or high demand (503) or deprecated model (404) or timeout (408), try next model immediately
        if (
          response.status === 429 ||
          response.status === 503 ||
          response.status === 404 ||
          response.status === 408
        ) {
          continue;
        }

        // If fatal error (e.g. 401 auth), break to try next key or return
        if (response.status === 401 || response.status === 403) {
          break;
        }
      }
    }

    currentRetry++;
  }

  return {
    success: false,
    qualityCheck: { passed: false, score: 0, notes: [] },
    error: 'Translation failed across all candidate Gemini models.',
    details: 'Please check your connection and Google Gemini API quota.',
  };
}
