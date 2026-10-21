/**
 * VOXORA Background Music (BGM) & Auto-Ducking Studio Mixer
 * Mixes voiceover speech with selected anime background music using Web Audio API OfflineAudioContext.
 */

export interface BgmTrack {
  id: string;
  name: string;
  genre: string;
  url: string;
  icon: string;
}

export const BGM_TRACKS: BgmTrack[] = [
  {
    id: 'none',
    name: 'None (Voice Only)',
    genre: 'Acapella',
    url: '',
    icon: '🔇',
  },
  {
    id: 'emotional-piano',
    name: 'Emotional Piano',
    genre: 'Nostalgic / Drama',
    url: '/assets/bgm/bgm-emotional-piano.wav',
    icon: '🎹',
  },
  {
    id: 'epic-battle',
    name: 'Epic Battle',
    genre: 'Orchestral / Action',
    url: '/assets/bgm/bgm-epic-battle.wav',
    icon: '⚔️',
  },
  {
    id: 'mystery-dark',
    name: 'Dark Suspense',
    genre: 'Mystery / Tension',
    url: '/assets/bgm/bgm-mystery-dark.wav',
    icon: '🌑',
  },
  {
    id: 'lofi-chill',
    name: 'Lo-Fi Chill',
    genre: 'Aesthetic / Relaxed',
    url: '/assets/bgm/bgm-lofi-chill.wav',
    icon: '☕',
  },
];

/**
 * Mixes voiceover audio with BGM and applies intelligent auto-ducking.
 * - While voiceover is active, BGM is ducked (e.g. 15% volume).
 * - During pauses, BGM rises to normal background volume (e.g. 35%).
 */
export async function mixVoiceWithBgm(
  voiceoverBase64OrUrl: string,
  bgmTrackId: string,
  bgmVolume = 0.25,
  autoDucking = true
): Promise<Blob> {
  const selectedTrack = BGM_TRACKS.find((b) => b.id === bgmTrackId);
  if (!selectedTrack || selectedTrack.id === 'none') {
    // Return original audio as blob
    return fetchAudioBlob(voiceoverBase64OrUrl);
  }

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    return fetchAudioBlob(voiceoverBase64OrUrl);
  }

  const audioCtx = new AudioContextClass();

  try {
    // 1. Decode Voiceover Audio
    const voiceBlob = await fetchAudioBlob(voiceoverBase64OrUrl);
    const voiceArrayBuffer = await voiceBlob.arrayBuffer();
    const voiceBuffer = await audioCtx.decodeAudioData(voiceArrayBuffer);

    // 2. Decode BGM Track
    const bgmRes = await fetch(selectedTrack.url);
    const bgmArrayBuffer = await bgmRes.arrayBuffer();
    const bgmBuffer = await audioCtx.decodeAudioData(bgmArrayBuffer);

    // 3. Create OfflineAudioContext with the length of the voiceover
    const sampleRate = voiceBuffer.sampleRate;
    const totalDuration = voiceBuffer.duration;
    const offlineCtx = new OfflineAudioContext(
      voiceBuffer.numberOfChannels,
      Math.ceil(totalDuration * sampleRate),
      sampleRate
    );

    // Source 1: Voiceover node
    const voiceSource = offlineCtx.createBufferSource();
    voiceSource.buffer = voiceBuffer;
    const voiceGain = offlineCtx.createGain();
    voiceGain.gain.value = 1.0;
    voiceSource.connect(voiceGain);
    voiceGain.connect(offlineCtx.destination);

    // Source 2: BGM loopable node
    const bgmSource = offlineCtx.createBufferSource();
    bgmSource.buffer = bgmBuffer;
    bgmSource.loop = true;

    const bgmGain = offlineCtx.createGain();
    const duckedVolume = bgmVolume * 0.45; // Ducked down during speech
    const normalVolume = bgmVolume;       // Full BGM during silence

    if (autoDucking) {
      // Analyze voice speech envelope in 100ms windows
      const voiceData = voiceBuffer.getChannelData(0);
      const windowSize = Math.floor(sampleRate * 0.1);
      const numWindows = Math.floor(voiceData.length / windowSize);

      bgmGain.gain.setValueAtTime(normalVolume, 0);

      for (let w = 0; w < numWindows; w++) {
        let sum = 0;
        const startIdx = w * windowSize;
        for (let s = 0; s < windowSize; s++) {
          sum += Math.abs(voiceData[startIdx + s]);
        }
        const avgAmplitude = sum / windowSize;
        const timeSec = w * 0.1;
        const targetVol = avgAmplitude > 0.03 ? duckedVolume : normalVolume;
        bgmGain.gain.setTargetAtTime(targetVol, timeSec, 0.08);
      }
    } else {
      bgmGain.gain.value = bgmVolume;
    }

    bgmSource.connect(bgmGain);
    bgmGain.connect(offlineCtx.destination);

    voiceSource.start(0);
    bgmSource.start(0);

    // Render mixed master
    const renderedBuffer = await offlineCtx.startRendering();
    audioCtx.close();

    return audioBufferToWavBlob(renderedBuffer);
  } catch (err) {
    console.error('Error mixing audio:', err);
    audioCtx.close();
    return fetchAudioBlob(voiceoverBase64OrUrl);
  }
}

async function fetchAudioBlob(source: string): Promise<Blob> {
  if (source.startsWith('data:')) {
    const res = await fetch(source);
    return res.blob();
  }
  const res = await fetch(source);
  return res.blob();
}

/**
 * Converts an AudioBuffer into a valid RIFF WAV Blob.
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = length * blockAlign;

  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channels
  let offset = 44;
  const channels = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
