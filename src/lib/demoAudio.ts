/**
 * Generates a valid standard RIFF WAV base64 string for audio player preview/testing.
 * Creates an authentic 4-second melodic tone (440Hz / 554Hz / 659Hz A-major triad with decay)
 * at 22,050 Hz Mono 16-bit PCM.
 */
export function generateDemoAudioBase64(durationSeconds: number = 3.5): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const bufferSize = 44 + dataSize;

  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // RIFF identifier 'RIFF'
  writeString(view, 0, 'RIFF');
  // file length minus RIFF header
  view.setUint32(4, 36 + dataSize, true);
  // 'WAVE'
  writeString(view, 8, 'WAVE');
  // 'fmt ' chunk
  writeString(view, 12, 'fmt ');
  // format length (16 for PCM)
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate
  view.setUint32(28, byteRate, true);
  // block align
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitsPerSample, true);
  // 'data' chunk
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Write synthesized audio waveform
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Harmonic progression
    const env = Math.exp(-t * 0.8) * Math.min(1, t * 15);
    const wave =
      0.5 * Math.sin(2 * Math.PI * 440 * t) +
      0.3 * Math.sin(2 * Math.PI * 554.37 * t) +
      0.2 * Math.sin(2 * Math.PI * 659.25 * t);
    const sample = Math.max(-1, Math.min(1, wave * env));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  if (typeof btoa === 'function') {
    return btoa(binary);
  } else if (typeof Buffer !== 'undefined') {
    return Buffer.from(binary, 'binary').toString('base64');
  }
  return '';
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
