export interface MergedAudioResult {
  success: boolean;
  wavBuffer?: Buffer;
  mp3Buffer?: Buffer;
  wavBase64?: string;
  mp3Base64?: string;
  durationSec: number;
  sampleRate: number;
  channels: number;
  totalSizeMb: number;
  error?: string;
}

/**
 * Extracts PCM audio samples and metadata from a WAV buffer.
 */
function parseWavBuffer(wavBuffer: Buffer): {
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  pcmData: Buffer;
} | null {
  if (
    wavBuffer.length < 44 ||
    wavBuffer.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    wavBuffer.subarray(8, 12).toString('ascii') !== 'WAVE'
  ) {
    // If raw PCM without RIFF header, default to 24kHz 16-bit mono
    return {
      channels: 1,
      sampleRate: 24000,
      bitsPerSample: 16,
      pcmData: wavBuffer,
    };
  }

  // Find 'fmt ' and 'data' chunks
  let pos = 12;
  let channels = 1;
  let sampleRate = 24000;
  let bitsPerSample = 16;
  let pcmData: Buffer | null = null;

  while (pos + 8 <= wavBuffer.length) {
    const chunkId = wavBuffer.subarray(pos, pos + 4).toString('ascii');
    const chunkSize = wavBuffer.readUInt32LE(pos + 4);

    if (chunkId === 'fmt ') {
      channels = wavBuffer.readUInt16LE(pos + 10);
      sampleRate = wavBuffer.readUInt32LE(pos + 12);
      bitsPerSample = wavBuffer.readUInt16LE(pos + 22);
    } else if (chunkId === 'data') {
      const dataStart = pos + 8;
      const dataEnd = Math.min(wavBuffer.length, dataStart + chunkSize);
      pcmData = wavBuffer.subarray(dataStart, dataEnd);
      break;
    }

    pos += 8 + chunkSize;
  }

  if (!pcmData) {
    pcmData = wavBuffer.subarray(44);
  }

  return {
    channels: channels || 1,
    sampleRate: sampleRate || 24000,
    bitsPerSample: bitsPerSample || 16,
    pcmData,
  };
}

/**
 * Creates a RIFF WAV file buffer from raw PCM samples.
 */
function createWavHeader(
  pcmLength: number,
  sampleRate: number,
  channels: number,
  bitsPerSample: number
): Buffer {
  const header = Buffer.alloc(44);
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // 16 for PCM
  header.writeUInt16LE(1, 20); // 1 = PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmLength, 40);

  return header;
}

/**
 * Encodes 16-bit PCM audio samples to an MP3 buffer using modern @breezystack/lamejs.
 */
async function encodePcmToMp3(
  pcmBuffer: Buffer,
  sampleRate: number,
  channels: number,
  kbps = 192
): Promise<Buffer> {
  const { Mp3Encoder } = await import('@breezystack/lamejs');

  const int16Samples = new Int16Array(
    pcmBuffer.buffer,
    pcmBuffer.byteOffset,
    pcmBuffer.byteLength / 2
  );

  const mp3encoder = new Mp3Encoder(channels, sampleRate, kbps);
  const mp3Data: Uint8Array[] = [];
  const sampleBlockSize = 1152;

  if (channels === 1) {
    for (let i = 0; i < int16Samples.length; i += sampleBlockSize) {
      const sampleChunk = int16Samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
      if (mp3buf && mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
    }
  } else {
    // Interleaved stereo to mono split
    const left = new Int16Array(int16Samples.length / 2);
    const right = new Int16Array(int16Samples.length / 2);
    for (let i = 0; i < left.length; i++) {
      left[i] = int16Samples[i * 2];
      right[i] = int16Samples[i * 2 + 1];
    }
    for (let i = 0; i < left.length; i += sampleBlockSize) {
      const leftChunk = left.subarray(i, i + sampleBlockSize);
      const rightChunk = right.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf && mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
    }
  }

  // Flush remaining MP3 buffer
  const finalMp3 = mp3encoder.flush();
  if (finalMp3 && finalMp3.length > 0) {
    mp3Data.push(new Uint8Array(finalMp3));
  }

  return Buffer.concat(mp3Data.map((arr) => Buffer.from(arr)));
}

/**
 * Merges an array of base64 WAV chunks in strict sequential order.
 * Generates both master RIFF WAV and master MP3 with duration metadata.
 */
export async function mergeAudioChunks(
  base64Chunks: string[],
  silenceBetweenChunksMs = 350
): Promise<MergedAudioResult> {
  if (!base64Chunks || base64Chunks.length === 0) {
    return {
      success: false,
      durationSec: 0,
      sampleRate: 24000,
      channels: 1,
      totalSizeMb: 0,
      error: 'No audio chunks provided for merging.',
    };
  }

  const pcmList: Buffer[] = [];
  let sampleRate = 24000;
  let channels = 1;
  let bitsPerSample = 16;

  for (let i = 0; i < base64Chunks.length; i++) {
    const rawBuffer = Buffer.from(base64Chunks[i], 'base64');
    const parsed = parseWavBuffer(rawBuffer);

    if (parsed) {
      if (i === 0) {
        sampleRate = parsed.sampleRate;
        channels = parsed.channels;
        bitsPerSample = parsed.bitsPerSample;
      }
      pcmList.push(parsed.pcmData);

      // Add a small natural pause between chunks if not the last chunk
      if (i < base64Chunks.length - 1 && silenceBetweenChunksMs > 0) {
        const bytesPerSec = (sampleRate * channels * bitsPerSample) / 8;
        const silenceBytes = Math.floor(
          (silenceBetweenChunksMs / 1000) * bytesPerSec
        );
        const alignedSilence = silenceBytes - (silenceBytes % 2);
        if (alignedSilence > 0) {
          pcmList.push(Buffer.alloc(alignedSilence, 0));
        }
      }
    }
  }

  if (pcmList.length === 0) {
    return {
      success: false,
      durationSec: 0,
      sampleRate: 24000,
      channels: 1,
      totalSizeMb: 0,
      error: 'Failed to extract valid PCM data from audio chunks.',
    };
  }

  const combinedPcm = Buffer.concat(pcmList);
  const wavHeader = createWavHeader(
    combinedPcm.length,
    sampleRate,
    channels,
    bitsPerSample
  );
  const masterWav = Buffer.concat([wavHeader, combinedPcm]);

  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const durationSec = parseFloat((combinedPcm.length / byteRate).toFixed(2));

  // Encode to MP3 using @breezystack/lamejs
  let masterMp3: Buffer | null = null;
  try {
    masterMp3 = await encodePcmToMp3(combinedPcm, sampleRate, channels, 192);
  } catch (err) {
    console.error('MP3 encoding error:', err);
  }

  const totalSizeMb = parseFloat(
    (masterWav.length / (1024 * 1024)).toFixed(2)
  );

  // Only convert to base64 if under 15MB to prevent V8 RangeError: Invalid string length
  const MAX_B64_BYTES = 15 * 1024 * 1024;
  const wavBase64 = masterWav.length <= MAX_B64_BYTES ? masterWav.toString('base64') : undefined;
  const mp3Base64 = masterMp3 && masterMp3.length <= MAX_B64_BYTES ? masterMp3.toString('base64') : undefined;

  return {
    success: true,
    wavBuffer: masterWav,
    mp3Buffer: masterMp3 || undefined,
    wavBase64,
    mp3Base64,
    durationSec,
    sampleRate,
    channels,
    totalSizeMb,
  };
}
