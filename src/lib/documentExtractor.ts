// @ts-ignore
import mammoth from 'mammoth';
import {
  DetectedEpisode,
  ScriptMetadata,
  WorkflowChunk,
} from './types';

/**
 * Extracts plain text from a buffer based on file extension / mime type.
 */
export async function extractTextFromFileBuffer(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (ext === 'txt') {
    return buffer.toString('utf-8');
  }

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  if (ext === 'pdf') {
    try {
      // unpdf provides zero-worker, high-performance web standard PDF text extraction
      const { extractText } = await import('unpdf');
      const uint8 = new Uint8Array(buffer);
      const res = await extractText(uint8);
      if (Array.isArray(res.text)) {
        return res.text.join('\n');
      }
      return typeof res.text === 'string' ? res.text : '';
    } catch (pdfErr) {
      console.error('PDF parsing error:', pdfErr);
      throw new Error(`Failed to parse PDF document: ${pdfErr instanceof Error ? pdfErr.message : 'Invalid PDF'}`);
    }
  }

  // Fallback to text
  return buffer.toString('utf-8');
}

/**
 * Cleans up raw extracted text while preserving:
 * - Episode headings
 * - Paragraphs
 * - Scene order
 * - Narration & dialogue
 * - Story events
 *
 * Removes meaningless control chars but strictly preserves all narrative text.
 */
export function normalizeExtractedText(raw: string): string {
  if (!raw) return '';

  return (
    raw
      // Replace Windows CRLF and CR with LF
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Clean non-printable control characters except tab and newline
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Replace consecutive blank lines (>2) with two newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Regex patterns to detect episode or chapter divisions in anime scripts.
 * Matches:
 * "Episode 1", "Episode 01: The Awakening", "EPISODE 2", "Ep. 3", "Ep 4",
 * "Chapter 1", "Part 1", "Scene 1", "Arc 1"
 */
const EPISODE_PATTERNS = [
  /^(?:#+\s*)?(?:episode|ep\.?|chapter|part|scene|arc)\s+(\d+)[:\s\-–—]*(.*)$/im,
  /^(?:\[\s*(?:episode|ep\.?|chapter|part)\s+(\d+)\s*\])[:\s\-–—]*(.*)$/im,
];

/**
 * Automatically detects episode sections from full script text.
 * If no explicit episode headers are found, creates a unified single episode
 * or natural large divisions.
 */
export function detectEpisodes(fullText: string): DetectedEpisode[] {
  const lines = fullText.split('\n');
  const sections: { title: string; lines: string[]; episodeNumber: number }[] = [];

  let currentTitle = 'Episode 1: Script Start';
  let currentEpisodeNumber = 1;
  let currentLines: string[] = [];
  let foundExplicitHeaders = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      currentLines.push(lines[i]);
      continue;
    }

    let matchedHeader = false;
    for (const pattern of EPISODE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        foundExplicitHeaders = true;
        // If we already have accumulated text in currentLines, save previous section
        if (currentLines.join('\n').trim().length > 0) {
          sections.push({
            title: currentTitle,
            lines: [...currentLines],
            episodeNumber: currentEpisodeNumber,
          });
          currentLines = [];
        }

        const epNum = parseInt(match[1], 10) || currentEpisodeNumber + 1;
        const subTitle = (match[2] || '').trim();
        currentEpisodeNumber = epNum;
        currentTitle = subTitle
          ? `Episode ${epNum}: ${subTitle}`
          : `Episode ${epNum}`;
        matchedHeader = true;
        break;
      }
    }

    if (!matchedHeader) {
      currentLines.push(lines[i]);
    }
  }

  // Push final section
  if (currentLines.join('\n').trim().length > 0) {
    sections.push({
      title: currentTitle,
      lines: [...currentLines],
      episodeNumber: currentEpisodeNumber,
    });
  }

  // If no explicit episode headings were matched, check if script is large and can be divided
  // or return as single episode
  if (!foundExplicitHeaders || sections.length === 0) {
    const cleanFull = fullText.trim();
    const words = cleanFull.split(/\s+/).filter(Boolean).length;
    return [
      {
        episodeNumber: 1,
        title: 'Episode 1: Full Script',
        text: cleanFull,
        charCount: cleanFull.length,
        wordCount: words,
      },
    ];
  }

  return sections.map((sec, idx) => {
    const text = sec.lines.join('\n').trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    return {
      episodeNumber: sec.episodeNumber || idx + 1,
      title: sec.title || `Episode ${idx + 1}`,
      text,
      charCount: text.length,
      wordCount: words,
    };
  });
}

/**
 * Calculates accurate cost estimations and duration for the uploaded script.
 */
export function calculateScriptMetadata(
  fileName: string,
  fileSize: number,
  episodes: DetectedEpisode[]
): ScriptMetadata {
  const totalCharacters = episodes.reduce((acc, ep) => acc + ep.charCount, 0);
  const totalWords = episodes.reduce((acc, ep) => acc + ep.wordCount, 0);

  // Gemini 2.5 Flash translation pricing:
  // ~4 chars per token.
  // Input tokens: totalCharacters / 4. Output tokens: totalCharacters / 4 (approx 1:1 in Roman Hinglish)
  // Input: $0.075 / 1,000,000 tokens. Output: $0.30 / 1,000,000 tokens.
  const estTokens = Math.ceil(totalCharacters / 4);
  const translationUSD =
    (estTokens / 1_000_000) * 0.075 + (estTokens / 1_000_000) * 0.30;
  // Floor at $0.001 if script exists
  const estTranslationCostUSD =
    totalCharacters > 0 ? Math.max(0.001, parseFloat(translationUSD.toFixed(4))) : 0;
  const estTranslationCostINR = parseFloat(
    (estTranslationCostUSD * 86.5).toFixed(2)
  );

  // TTS Cost estimate:
  // Google Gemini TTS: ~1 free tier quota or standard character cost
  const ttsRatePer10kCharsINR = 0.15;
  const estTTSCostINR = parseFloat(
    ((totalCharacters / 10000) * ttsRatePer10kCharsINR).toFixed(2)
  );
  const estTTSCostUSD = parseFloat((estTTSCostINR / 86.5).toFixed(3));

  // Audio duration: ~140 words per minute
  const estDurationMinutes = parseFloat(
    (totalWords > 0 ? (totalWords / 140) : 0).toFixed(1)
  );

  return {
    fileName,
    fileSize,
    detectedEpisodes: episodes,
    totalCharacters,
    totalWords,
    estTranslationCostUSD,
    estTranslationCostINR,
    estTTSCostUSD,
    estTTSCostINR,
    estDurationMinutes,
  };
}

/**
 * Intelligent Chunking System for long scripts.
 * Splits episode text into cohesive chunks:
 * 1. Episode boundaries (handled at higher level)
 * 2. Scene boundaries
 * 3. Paragraph boundaries (\n\n)
 * 4. Sentence boundaries (., !, ?, ।, ;)
 * Never intentionally cuts in the middle of a sentence!
 */
export function chunkEpisodeText(
  episodeNumber: number,
  episodeTitle: string,
  text: string,
  targetChunkChars = 1400,
  maxChunkChars = 1800
): WorkflowChunk[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // If text is already under maxChunkChars, keep as 1 chunk
  if (trimmed.length <= maxChunkChars) {
    return [
      {
        id: `ep${episodeNumber}_chunk1`,
        episodeNumber,
        episodeTitle,
        chunkIndex: 1,
        totalChunksInEpisode: 1,
        originalText: trimmed,
        translatedText: '',
        status: 'pending',
        terminology: {},
        audioStatus: 'idle',
        updatedAt: Date.now(),
      },
    ];
  }

  const rawChunks: string[] = [];
  let remaining = trimmed;

  while (remaining.length > 0) {
    if (remaining.length <= maxChunkChars) {
      rawChunks.push(remaining.trim());
      break;
    }

    const searchSlice = remaining.slice(0, maxChunkChars);
    let splitIndex = maxChunkChars;

    // 1. Look for paragraph breaks (\n\n) in the acceptable range (> 50% target)
    const paraBreak = searchSlice.lastIndexOf('\n\n');
    if (paraBreak > targetChunkChars * 0.55) {
      splitIndex = paraBreak + 2;
    } else {
      // 2. Look for sentence terminators: Hindi purna viram (।), English (. ! ? ;)
      const lastPunctuation = Math.max(
        searchSlice.lastIndexOf('।'),
        searchSlice.lastIndexOf('. '),
        searchSlice.lastIndexOf('!\n'),
        searchSlice.lastIndexOf('! '),
        searchSlice.lastIndexOf('?\n'),
        searchSlice.lastIndexOf('? '),
        searchSlice.lastIndexOf(';\n')
      );

      if (lastPunctuation > targetChunkChars * 0.5) {
        // Cut right after punctuation and space
        splitIndex = lastPunctuation + 1;
      } else {
        // 3. Fallback to newline
        const lastNewline = searchSlice.lastIndexOf('\n');
        if (lastNewline > targetChunkChars * 0.5) {
          splitIndex = lastNewline + 1;
        } else {
          // 4. Fallback to space
          const lastSpace = searchSlice.lastIndexOf(' ');
          if (lastSpace > targetChunkChars * 0.4) {
            splitIndex = lastSpace + 1;
          }
        }
      }
    }

    const chunkContent = remaining.slice(0, splitIndex).trim();
    remaining = remaining.slice(splitIndex).trim();

    if (chunkContent) {
      rawChunks.push(chunkContent);
    }
  }

  const total = rawChunks.length;
  return rawChunks.map((content, idx) => ({
    id: `ep${episodeNumber}_chunk${idx + 1}`,
    episodeNumber,
    episodeTitle,
    chunkIndex: idx + 1,
    totalChunksInEpisode: total,
    originalText: content,
    translatedText: '',
    status: 'pending',
    terminology: {},
    audioStatus: 'idle',
    updatedAt: Date.now(),
  }));
}
