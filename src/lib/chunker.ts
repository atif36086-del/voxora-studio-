import { MAX_SCRIPT_LENGTH } from './types';

/**
 * Validates script length against Sarvam Bulbul v3 REST limits (2500 chars).
 * Strictly prevents silent truncation.
 */
export function validateScriptLength(text: string): {
  valid: boolean;
  length: number;
  max: number;
  error?: string;
} {
  const length = (text || '').trim().length;
  if (length === 0) {
    return {
      valid: false,
      length: 0,
      max: MAX_SCRIPT_LENGTH,
      error: 'Script is empty. Please enter or paste your anime script.',
    };
  }

  if (length > MAX_SCRIPT_LENGTH) {
    return {
      valid: false,
      length,
      max: MAX_SCRIPT_LENGTH,
      error: `Maximum ${MAX_SCRIPT_LENGTH.toLocaleString()} characters per generation. Your script has ${length.toLocaleString()} characters.`,
    };
  }

  return {
    valid: true,
    length,
    max: MAX_SCRIPT_LENGTH,
  };
}

/**
 * Architecture readiness for future multi-chunk script generation.
 * Splits long scripts at natural sentence boundaries (Hindi Purna Viram ।, ., !, ?, newlines)
 * so anime dialog and narration pacing remain cohesive across chunks.
 */
export function splitScriptIntoChunks(
  text: string,
  maxChunkSize: number = MAX_SCRIPT_LENGTH
): string[] {
  if (!text || text.trim().length <= maxChunkSize) {
    return text ? [text.trim()] : [];
  }

  const chunks: string[] = [];
  // Split on paragraph or sentence terminators: ।, \n\n, \n, ., !, ?
  const sentences = text
    .replace(/([।\.\!\?]\s*)/g, '$1|SPLIT|')
    .replace(/(\n+)/g, '$1|SPLIT|')
    .split('|SPLIT|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).trim().length <= maxChunkSize) {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      // If a single sentence exceeds maxChunkSize, slice it carefully
      if (sentence.length > maxChunkSize) {
        let remaining = sentence;
        while (remaining.length > maxChunkSize) {
          const sliceIndex = remaining.lastIndexOf(' ', maxChunkSize);
          const cutAt = sliceIndex > 0 ? sliceIndex : maxChunkSize;
          chunks.push(remaining.substring(0, cutAt).trim());
          remaining = remaining.substring(cutAt).trim();
        }
        currentChunk = remaining;
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
