/**
 * Smart Script Splitter for Anime & Manhwa YouTubers.
 * Splits long scripts (5,000 to 15,000+ characters) into natural,
 * narrative-friendly scene chunks at sentence or paragraph boundaries.
 */

export interface ScriptChunk {
  partNumber: number;
  title: string;
  text: string;
  charCount: number;
  wordCount: number;
  estDuration: string;
}

export function splitScriptIntoScenes(
  fullScript: string,
  targetChunkChars = 2000,
  maxChunkChars = 2400
): ScriptChunk[] {
  const trimmed = fullScript.trim();
  if (!trimmed) return [];

  // If already under targetChunkChars, only 1 part is needed
  if (trimmed.length <= maxChunkChars) {
    const words = trimmed.split(/\s+/).length;
    const secs = Math.round((words / 135) * 60);
    return [
      {
        partNumber: 1,
        title: 'Full Script',
        text: trimmed,
        charCount: trimmed.length,
        wordCount: words,
        estDuration: secs < 60 ? `~${secs}s` : `~${Math.floor(secs / 60)}m ${secs % 60}s`,
      },
    ];
  }

  const chunks: ScriptChunk[] = [];
  let remaining = trimmed;
  let partNumber = 1;

  while (remaining.length > 0) {
    if (remaining.length <= maxChunkChars) {
      const words = remaining.split(/\s+/).length;
      const secs = Math.round((words / 135) * 60);
      chunks.push({
        partNumber,
        title: `Part ${partNumber}`,
        text: remaining,
        charCount: remaining.length,
        wordCount: words,
        estDuration: secs < 60 ? `~${secs}s` : `~${Math.floor(secs / 60)}m ${secs % 60}s`,
      });
      break;
    }

    // Find the best split point before maxChunkChars, ideally near targetChunkChars
    let sliceEnd = maxChunkChars;
    const searchSlice = remaining.slice(0, maxChunkChars);

    // Prioritize double newline (paragraph boundary)
    const paraBreak = searchSlice.lastIndexOf('\n\n');
    if (paraBreak > targetChunkChars * 0.6) {
      sliceEnd = paraBreak;
    } else {
      // Prioritize sentence boundaries: Hindi danda (।), English period (.), exclamation (!), question (?)
      const danda = searchSlice.lastIndexOf('।');
      const dot = searchSlice.lastIndexOf('.');
      const qmark = searchSlice.lastIndexOf('?');
      const exclaim = searchSlice.lastIndexOf('!');
      const newline = searchSlice.lastIndexOf('\n');

      const bestPunct = Math.max(danda, dot, qmark, exclaim, newline);

      if (bestPunct > targetChunkChars * 0.65) {
        sliceEnd = bestPunct + 1;
      } else {
        // Fallback to space
        const lastSpace = searchSlice.lastIndexOf(' ');
        if (lastSpace > targetChunkChars * 0.5) {
          sliceEnd = lastSpace;
        }
      }
    }

    const currentText = remaining.slice(0, sliceEnd).trim();
    remaining = remaining.slice(sliceEnd).trim();

    if (currentText) {
      const words = currentText.split(/\s+/).length;
      const secs = Math.round((words / 135) * 60);
      chunks.push({
        partNumber,
        title: `Part ${partNumber}`,
        text: currentText,
        charCount: currentText.length,
        wordCount: words,
        estDuration: secs < 60 ? `~${secs}s` : `~${Math.floor(secs / 60)}m ${secs % 60}s`,
      });
      partNumber++;
    }
  }

  return chunks;
}
