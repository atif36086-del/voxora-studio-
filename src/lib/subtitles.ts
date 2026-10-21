/**
 * Subtitle Generator & Exporter (.SRT / .VTT) for Anime Voiceovers
 * Formats timestamps with millisecond accuracy for Premiere Pro, CapCut, DaVinci Resolve, and VLC.
 */

export interface SubtitleCue {
  index: number;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

/**
 * Formats seconds into standard SRT timestamp: HH:MM:SS,mmm
 * Example: 75.42 -> "00:01:15,420"
 */
export function formatSrtTimestamp(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = Math.floor(safeSeconds % 60);
  const millis = Math.floor((safeSeconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(millis, 3)}`;
}

/**
 * Breaks a script into natural phrases / sentences for subtitle captions.
 */
export function splitScriptIntoCues(scriptText: string, totalDuration: number): SubtitleCue[] {
  const clean = (scriptText || '').trim();
  if (!clean || totalDuration <= 0) return [];

  // Split by common punctuation marks or newlines
  const rawParts = clean
    .split(/([।!?\n]+|\.\s+)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^[।!?.]+$/.test(s));

  // If a part is too long (> 12 words), break it down further by commas or word blocks
  const chunks: string[] = [];
  for (const part of rawParts) {
    const words = part.split(/\s+/);
    if (words.length > 12) {
      for (let i = 0; i < words.length; i += 8) {
        chunks.push(words.slice(i, i + 8).join(' '));
      }
    } else {
      chunks.push(part);
    }
  }

  if (chunks.length === 0) return [];

  // Calculate timing proportionally based on character count
  const totalChars = chunks.reduce((acc, c) => acc + c.length, 0);
  let currentStart = 0;
  const cues: SubtitleCue[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const fraction = totalChars > 0 ? chunk.length / totalChars : 1 / chunks.length;
    let chunkDuration = fraction * totalDuration;

    // Minimum cue duration safeguard (1.2s)
    if (chunkDuration < 1.2 && totalDuration >= chunks.length * 1.2) {
      chunkDuration = 1.2;
    }

    const start = currentStart;
    const end = Math.min(totalDuration, start + chunkDuration);

    cues.push({
      index: i + 1,
      startTime: start,
      endTime: end,
      text: chunk,
    });

    currentStart = end;
  }

  // Ensure last cue reaches the very end
  if (cues.length > 0) {
    cues[cues.length - 1].endTime = totalDuration;
  }

  return cues;
}

/**
 * Generates valid .SRT file content from script text and total duration.
 */
export function generateSrtContent(scriptText: string, totalDuration: number): string {
  const cues = splitScriptIntoCues(scriptText, totalDuration);
  if (cues.length === 0) return '';

  return cues
    .map((cue) => {
      const start = formatSrtTimestamp(cue.startTime);
      const end = formatSrtTimestamp(cue.endTime);
      return `${cue.index}\n${start} --> ${end}\n${cue.text}\n`;
    })
    .join('\n');
}

/**
 * Triggers instant browser download of the .SRT file
 */
export function downloadSrtFile(filename: string, srtContent: string): void {
  const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = filename.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  a.download = `${safeName}_subtitles.srt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
