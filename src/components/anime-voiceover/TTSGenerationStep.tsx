'use client';

import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Disc3,
  SlidersHorizontal,
  FileAudio,
  X,
} from 'lucide-react';
import {
  WorkflowChunk,
  WorkflowProjectSettings,
  TTSProvider,
  GOOGLE_VOICES,
  GoogleTTSModel,
  GoogleVoiceId,
  GoogleStylePreset,
} from '@/lib/types';
import { VoiceSelector } from '@/components/VoiceSelector';
import { GeminiModelSelector } from '@/components/GeminiModelSelector';
import { GoogleStyleSelector } from '@/components/GoogleStyleSelector';

interface TTSGenerationStepProps {
  projectId?: string;
  chunks: WorkflowChunk[];
  settings: WorkflowProjectSettings;
  onUpdateSettings: (newSettings: Partial<WorkflowProjectSettings>) => void;
  onUpdateChunk: (chunk: WorkflowChunk) => void;
  onMergeAndProceed: () => void;
  isMerging?: boolean;
}

export const TTSGenerationStep: React.FC<TTSGenerationStepProps> = ({
  projectId,
  chunks,
  settings,
  onUpdateSettings,
  onUpdateChunk,
  onMergeAndProceed,
  isMerging = false,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentChunkIdx, setCurrentChunkIdx] = useState<number>(-1);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to synthesize speech');
  const [cooldownSec, setCooldownSec] = useState<number | null>(null);
  const [playingChunkId, setPlayingChunkId] = useState<string | null>(null);
  const [concurrency, setConcurrency] = useState<number>(3);
  const [activeGeneratingIds, setActiveGeneratingIds] = useState<string[]>([]);

  const isPausedRef = useRef<boolean>(false);
  const chunksRef = useRef<WorkflowChunk[]>(chunks);
  chunksRef.current = chunks;

  const totalChunks = chunks.length;
  const completedChunks = chunks.filter(
    (c) => c.audioStatus === 'completed' && Boolean(c.audioBase64 || c.audioUrl)
  ).length;
  const failedChunks = chunks.filter((c) => c.audioStatus === 'failed').length;
  const progressPercent =
    totalChunks > 0 ? Math.round((completedChunks / totalChunks) * 100) : 0;

  const autoFailover = settings.autoFailoverModels !== false;
  const crossEngine = settings.crossEngineFallback !== false;

  // Single chunk audio playback toggle (supports streaming audioUrl or base64)
  const handlePlayChunkAudio = (chunk: WorkflowChunk) => {
    const hasAudio = Boolean(chunk.audioBase64 || chunk.audioUrl || projectId);
    if (!hasAudio) return;

    if (playingChunkId === chunk.id) {
      setPlayingChunkId(null);
    } else {
      setPlayingChunkId(chunk.id);
    }
  };

  const hasUnfinishedAudio = completedChunks < totalChunks;

  // Ordered fallback models for Google Gemini (Fastest & highest rate limit first)
  const GEMINI_FALLBACK_SEQUENCE: GoogleTTSModel[] = [
    'gemini-3.8-flash-lite-tts',
    'gemini-3.8-flash-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-2.5-flash-preview-tts',
  ];

  const generateChunkTTS = async (
    chunk: WorkflowChunk,
    overrideModel?: GoogleTTSModel,
    overrideProvider?: TTSProvider,
    retryCount = 0
  ): Promise<{ success: boolean; error?: string; switchedModel?: boolean; modelUsed?: string }> => {
    const textToSpeak = (chunk.translatedText || chunk.originalText || '').trim();
    if (!textToSpeak) return { success: false, error: 'Empty script' };

    const activeProvider = overrideProvider || settings.ttsProvider;
    const activeGeminiModel =
      overrideModel || settings.geminiTTSModel || 'gemini-3.8-flash-lite-tts';

    const payload = {
      provider: 'google',
      text: textToSpeak,
      speaker: settings.ttsVoice || 'Puck',
      stylePreset: settings.ttsStylePreset || 'Normal',
      geminiModel: activeGeminiModel,
    };

    try {
      // 120-second network timeout safeguard to prevent premature aborts on large chunks
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok && data.success && data.audio) {
        let streamUrl = chunk.audioUrl;

        // Persist audio directly to disk via /api/anime-script/audio to keep React state & JSON tiny
        if (projectId) {
          try {
            const diskRes = await fetch('/api/anime-script/audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId,
                chunkId: chunk.id,
                audioBase64: data.audio,
              }),
            });
            if (diskRes.ok) {
              const diskData = await diskRes.json();
              if (diskData.audioUrl) streamUrl = diskData.audioUrl;
            }
          } catch (e) {
            console.error('Failed to write audio to disk route:', e);
          }
        }

        onUpdateChunk({
          ...chunk,
          audioUrl: streamUrl || (projectId ? `/api/anime-script/audio?projectId=${encodeURIComponent(projectId)}&chunkId=${encodeURIComponent(chunk.id)}` : undefined),
          audioBase64: streamUrl ? undefined : data.audio,
          audioStatus: 'completed',
          audioError: undefined,
          updatedAt: Date.now(),
        });

        // If the server auto-switched models, notify and update settings
        if (data.switchedModel && data.model && data.model !== settings.geminiTTSModel) {
          onUpdateSettings({ geminiTTSModel: data.model as GoogleTTSModel });
        }

        return {
          success: true,
          switchedModel: Boolean(data.switchedModel),
          modelUsed: data.model || activeGeminiModel,
        };
      }

      // Check if it failed due to rate limit or quota
      const isQuotaOrLimit =
        response.status === 429 ||
        response.status === 402 ||
        data.isQuota ||
        data.error?.toLowerCase().includes('quota') ||
        data.error?.toLowerCase().includes('rate limit') ||
        data.error?.toLowerCase().includes('credits') ||
        data.details?.toLowerCase().includes('quota');

      // Auto-switch model if enabled and not already overriding
      if (isQuotaOrLimit && autoFailover) {
        const nextFallback = GEMINI_FALLBACK_SEQUENCE.find(
          (m) => m !== activeGeminiModel
        );

        if (nextFallback) {
          setStatusMessage(
            `Quota hit on ${activeGeminiModel}. Auto-switching to ${nextFallback}...`
          );
          onUpdateSettings({ geminiTTSModel: nextFallback });
          await new Promise((r) => setTimeout(r, 1200));
          return generateChunkTTS(chunk, nextFallback, 'google');
        }
      }

      const errMsg = data.error || 'TTS synthesis failed';
      onUpdateChunk({
        ...chunk,
        audioStatus: 'failed',
        audioError: errMsg,
        updatedAt: Date.now(),
      });
      return { success: false, error: errMsg };
    } catch (err: unknown) {
      let msg = 'Network error';
      if (err instanceof Error) {
        msg = err.name === 'AbortError' ? 'Request timed out after 120s' : err.message;
      }

      // Auto-retry transient network/timeout errors on mobile devices up to 2 times
      if (retryCount < 2 && !isPausedRef.current) {
        setStatusMessage(
          `Part ${chunk.chunkIndex} network hiccup (${msg}). Auto-retrying (attempt ${retryCount + 2}/3)...`
        );
        await new Promise((r) => setTimeout(r, 1500));
        return generateChunkTTS(chunk, overrideModel, overrideProvider, retryCount + 1);
      }

      onUpdateChunk({
        ...chunk,
        audioStatus: 'failed',
        audioError: msg,
        updatedAt: Date.now(),
      });
      return { success: false, error: msg };
    }
  };

  // Unified Concurrent Batch Processor
  const runConcurrentBatch = async (indicesToRun: number[]) => {
    if (indicesToRun.length === 0) return;

    isPausedRef.current = false;
    setIsRunning(true);
    setCooldownSec(null);

    // Keep mobile screen awake during voiceover generation if supported
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let wakeLockSentinel: any = null;
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      } catch {
        // Wake lock can fail if battery saver is on; silently continue
      }
    }

    const activeMap = new Map<number, number>(); // chunkIndex -> elapsed seconds
    let queueIdx = 0;
    const workerCount = Math.min(concurrency, indicesToRun.length);

    // Dynamic ticker to increment elapsed seconds and show parallel progress
    const ticker = setInterval(() => {
      if (activeMap.size === 0) return;
      activeMap.forEach((sec, idx) => {
        activeMap.set(idx, sec + 1);
      });
      const parts: string[] = [];
      activeMap.forEach((sec, idx) => {
        const c = chunksRef.current[idx];
        if (c) parts.push(`Part ${c.chunkIndex} (${sec}s)`);
      });
      setStatusMessage(
        `Synthesizing ${activeMap.size} take${activeMap.size > 1 ? 's' : ''} in parallel: ${parts.join(' • ')}`
      );
    }, 1000);

    const worker = async () => {
      while (!isPausedRef.current && queueIdx < indicesToRun.length) {
        const i = indicesToRun[queueIdx++];
        const chunk = chunksRef.current[i];
        if (!chunk) continue;
        // Instantly skip already completed chunks!
        if (chunk.audioStatus === 'completed' && (chunk.audioBase64 || chunk.audioUrl)) {
          continue;
        }

        activeMap.set(i, 0);
        setActiveGeneratingIds(
          Array.from(activeMap.keys())
            .map((idx) => chunksRef.current[idx]?.id)
            .filter(Boolean) as string[]
        );

        onUpdateChunk({
          ...chunk,
          audioStatus: 'generating',
          audioError: undefined,
          updatedAt: Date.now(),
        });

        const res = await generateChunkTTS(chunk);
        activeMap.delete(i);
        setActiveGeneratingIds(
          Array.from(activeMap.keys())
            .map((idx) => chunksRef.current[idx]?.id)
            .filter(Boolean) as string[]
        );

        if (isPausedRef.current) break;

        if (!res.success) {
          if (res.error?.toLowerCase().includes('rate limit') || res.error?.includes('429')) {
            // Global rate limit cooldown
            for (let sec = 10; sec > 0; sec--) {
              if (isPausedRef.current) break;
              setCooldownSec(sec);
              setStatusMessage(`API Rate Limit reached. Cooling down for ${sec}s...`);
              await new Promise((r) => setTimeout(r, 1000));
            }
            setCooldownSec(null);
          } else {
            setStatusMessage(
              `Part ${chunk.chunkIndex} encountered an issue (${res.error}). Continuing remaining takes...`
            );
          }
        }
      }
    };

    try {
      const workerPromises = Array.from({ length: workerCount }, () => worker());
      await Promise.all(workerPromises);
    } finally {
      if (wakeLockSentinel) {
        try {
          await wakeLockSentinel.release();
        } catch {
          // Ignore
        }
      }
    }

    clearInterval(ticker);
    setActiveGeneratingIds([]);
    setIsRunning(false);
    setCurrentChunkIdx(-1);
    setCooldownSec(null);

    const latestCompleted = chunksRef.current.filter(
      (c) => c.audioStatus === 'completed' && Boolean(c.audioBase64 || c.audioUrl)
    ).length;

    if (latestCompleted >= totalChunks) {
      setStatusMessage(`All ${totalChunks} parts synthesized successfully! Ready to merge master audio.`);
    } else if (isPausedRef.current) {
      setStatusMessage('Voiceover paused. Click "Resume Audio Generation" anytime to continue.');
    } else {
      setStatusMessage(`Synthesis batch completed. ${latestCompleted}/${totalChunks} ready.`);
    }
  };

  const runAllTTSLoop = async () => {
    const list = chunksRef.current;
    const pendingIndices = list
      .map((_, i) => i)
      .filter((i) => {
        const c = list[i];
        return !(c.audioStatus === 'completed' && (c.audioBase64 || c.audioUrl));
      });
    await runConcurrentBatch(pendingIndices);
  };

  const handlePause = () => {
    isPausedRef.current = true;
    setIsRunning(false);
    setCooldownSec(null);
    setStatusMessage('Pausing voiceover generation...');
  };

  const handleRetrySingleChunk = async (chunk: WorkflowChunk) => {
    onUpdateChunk({ ...chunk, audioStatus: 'generating', audioError: undefined });
    setStatusMessage(`Retrying ${chunk.episodeTitle} Part ${chunk.chunkIndex}...`);
    const res = await generateChunkTTS(chunk);
    if (res.success) {
      setStatusMessage(`Part ${chunk.chunkIndex} succeeded!`);
    } else {
      setStatusMessage(`Part ${chunk.chunkIndex} retry failed: ${res.error}`);
    }
  };

  const handleRetryAllFailed = async () => {
    const list = chunksRef.current;
    const failedIndices = list
      .map((_, i) => i)
      .filter((i) => list[i].audioStatus === 'failed');
    await runConcurrentBatch(failedIndices);
  };

  const isGoogle = settings.ttsProvider === 'google';

  return (
    <div className="tts-step-container">
      {/* Top Controls & Voice Config Rack */}
      <div className="tts-rack-card">
        <div className="rack-card-top-row">
          <div className="rack-headline-block">
            <h2 className="step-main-heading">4. Smart Audio Synthesis</h2>
            <p className="step-sub-desc">
              Generate studio audio chunk-by-chunk with automatic model failover. Chunks 1 to {completedChunks} are preserved and saved permanently. Failures can be retried without re-generating from scratch.
            </p>
          </div>

          <div className="rack-cta-group">
            {isRunning ? (
              <button
                type="button"
                onClick={handlePause}
                className="pause-translation-btn"
              >
                <Pause size={15} />
                <span>Pause Generation</span>
              </button>
            ) : hasUnfinishedAudio ? (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  id="generate-voiceover-btn"
                  onClick={runAllTTSLoop}
                  disabled={isMerging}
                  className="studio-generate-btn primary-workflow-cta"
                >
                  <Play size={15} />
                  <span>
                    {completedChunks > 0
                      ? `Resume Audio Generation (Part ${completedChunks + 1} of ${totalChunks})`
                      : 'Generate Voiceover (All Chunks)'}
                  </span>
                </button>

                {failedChunks > 0 && (
                  <button
                    type="button"
                    onClick={handleRetryAllFailed}
                    disabled={isMerging}
                    className="pause-translation-btn"
                    style={{ background: '#fff1f2', borderColor: '#fecdd3', color: '#be123c' }}
                  >
                    <RotateCcw size={14} />
                    <span>Retry Failed ({failedChunks})</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onMergeAndProceed}
                disabled={isMerging}
                className="studio-generate-btn primary-workflow-cta"
              >
                {isMerging ? (
                  <>
                    <Loader2 size={15} className="spinning-sync-icon" />
                    <span>Merging Master Audio...</span>
                  </>
                ) : (
                  <>
                    <Disc3 size={15} />
                    <span>Merge Chunks & Export Final Audio</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 3D Voiceover Synthesis Studio Showcase Banner */}
        <div className="dubbing-hero-showcase-banner voiceover-studio-hero-banner">
          <div className="dubbing-banner-text-col">
            <span
              style={{
                fontSize: '0.675rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0.18rem 0.5rem',
                borderRadius: '4px',
                background: 'var(--voxora-gradient)',
                color: '#ffffff',
                display: 'inline-block',
                marginBottom: '0.4rem',
              }}
            >
              Studio Voiceover Synthesis
            </span>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '0.25rem' }}>
              Multi-Model Gemini HD Speech & Expressive Anime Delivery
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Choose from 30 studio voices, dynamic storyteller cadences, and parallel generation threads. High-fidelity 24kHz audio synthesis tailored for Hindi anime creators.
            </p>
          </div>
          <div className="dubbing-hero-img-wrap">
            <img
              src="/assets/voxora-voiceover-studio.jpg"
              alt="VOXORA 3D Voiceover Studio"
              className="dubbing-hero-img"
            />
          </div>
        </div>

        {/* Engine & Voice Selector Controls (Google Gemini Studio) */}
        <div className="voice-settings-strip">
          <div className="settings-engine-params" style={{ width: '100%', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            <GeminiModelSelector
              model={settings.geminiTTSModel || 'gemini-3.8-flash-tts'}
              onSelectModel={(m) => onUpdateSettings({ geminiTTSModel: m })}
              disabled={isRunning || isMerging}
            />

            <VoiceSelector
              title="Studio Voice"
              voices={GOOGLE_VOICES}
              selectedVoice={settings.ttsVoice || 'Puck'}
              onSelectVoice={(v) => onUpdateSettings({ ttsVoice: v })}
              disabled={isRunning || isMerging}
            />

            <GoogleStyleSelector
              selectedPreset={settings.ttsStylePreset || 'Normal'}
              onSelectPreset={(st) => onUpdateSettings({ ttsStylePreset: st })}
              disabled={isRunning || isMerging}
            />
          </div>
        </div>

        {/* Automatic Failover & Safety Options */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.65rem 0.85rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '0.78rem'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#1e293b' }}>
              <input
                type="checkbox"
                checked={settings.autoFailoverModels !== false}
                onChange={(e) => onUpdateSettings({ autoFailoverModels: e.target.checked })}
                disabled={isRunning}
              />
              <span>Auto-Failover Google Models on Quota/Rate Limit</span>
            </label>
          </div>

          {/* Parallel Workers Concurrency Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ffffff', padding: '3px 8px', borderRadius: '7px', border: '1px solid #cbd5e1' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>Parallel Workers:</span>
            {[
              { level: 1, label: '1x (Safe)' },
              { level: 2, label: '2x' },
              { level: 3, label: '3x (Fast)' },
              { level: 4, label: '4x (Turbo)' },
            ].map(({ level, label }) => (
              <button
                key={level}
                type="button"
                onClick={() => setConcurrency(level)}
                disabled={isRunning}
                style={{
                  padding: '3px 8px',
                  borderRadius: '5px',
                  fontSize: '0.72rem',
                  fontWeight: concurrency === level ? 700 : 500,
                  background: concurrency === level ? '#2563eb' : '#f1f5f9',
                  color: concurrency === level ? '#ffffff' : '#475569',
                  border: concurrency === level ? '1px solid #1d4ed8' : '1px solid #e2e8f0',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title={level === 1 ? 'Sequential (1 chunk at a time)' : `${level} chunks synthesized concurrently`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Audio Generation Progress Deck */}
        <div className="tts-progress-deck">
          <div className="progress-info-row">
            <div className="progress-left-stats">
              <span className="progress-stat-pill">
                <FileAudio size={13} />
                <span>
                  {completedChunks} of {totalChunks} audio takes generated
                </span>
              </span>
              {failedChunks > 0 && (
                <span className="failed-stat-pill">
                  <AlertTriangle size={13} />
                  <span>{failedChunks} failed takes</span>
                </span>
              )}
            </div>

            <div className="progress-right-readout">
              <span className="progress-percent-text">{progressPercent}% Audio Synthesized</span>
            </div>
          </div>

          <div className="progress-track-bar">
            <div
              className="progress-fill-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Current Operation Banner */}
          <div className="current-operation-banner" style={cooldownSec !== null ? { background: '#fffbeb', borderColor: '#fde68a', color: '#b45309' } : undefined}>
            {cooldownSec !== null ? (
              <>
                <Loader2 size={14} className="spinning-sync-icon" style={{ color: '#d97706' }} />
                <span className="operation-text" style={{ fontWeight: 700 }}>
                  API Cooldown Active: Waiting {cooldownSec}s before next chunk to respect rate limits...
                </span>
              </>
            ) : isRunning ? (
              <>
                <Loader2 size={14} className="spinning-sync-icon" />
                <span className="operation-text">{statusMessage}</span>
              </>
            ) : completedChunks >= totalChunks ? (
              <>
                <CheckCircle2 size={14} className="success-icon" />
                <span className="operation-text">{statusMessage}</span>
              </>
            ) : (
              <>
                <Volume2 size={14} className="sparkle-icon" />
                <span className="operation-text">{statusMessage}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Audio Chunks List & Previews */}
      <div className="tts-chunks-grid">
        {chunks.map((chunk, idx) => {
          const isDone = chunk.audioStatus === 'completed' && Boolean(chunk.audioBase64 || chunk.audioUrl);
          const isFailed = chunk.audioStatus === 'failed';
          const isGenerating =
            chunk.audioStatus === 'generating' || activeGeneratingIds.includes(chunk.id);
          const isPlaying = playingChunkId === chunk.id;

          const displayText = chunk.translatedText || chunk.originalText || '';

          return (
            <div
              key={chunk.id}
              className={`tts-chunk-card ${isDone ? 'audio-done' : ''} ${isFailed ? 'audio-failed' : ''} ${isGenerating ? 'audio-generating' : ''}`}
            >
              <div className="tts-chunk-header">
                <div className="chunk-id-title">
                  <span className="chunk-part-badge">Part {chunk.chunkIndex}</span>
                  <span className="chunk-ep-name">{chunk.episodeTitle}</span>
                  <span className="chunk-chars">{displayText.length.toLocaleString()} chars</span>
                </div>

                <div className="chunk-audio-actions">
                  {/* Status Chip */}
                  {isDone && (
                    <span className="status-chip success">
                      <CheckCircle2 size={12} />
                      <span>Ready</span>
                    </span>
                  )}
                  {isGenerating && (
                    <span className="status-chip active">
                      <Loader2 size={12} className="spinning-sync-icon" />
                      <span>Rendering...</span>
                    </span>
                  )}
                  {isFailed && (
                    <span className="status-chip error">
                      <AlertTriangle size={12} />
                      <span>Failed</span>
                    </span>
                  )}

                  {/* Play Chunk Audio */}
                  {isDone && (
                    <button
                      type="button"
                      onClick={() => handlePlayChunkAudio(chunk)}
                      className={`chunk-play-btn ${isPlaying ? 'playing' : ''}`}
                      title={isPlaying ? 'Pause' : 'Listen to this chunk take'}
                    >
                      {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                      <span>{isPlaying ? 'Playing' : 'Listen Take'}</span>
                    </button>
                  )}

                  {/* Retry Button */}
                  {isFailed && (
                    <button
                      type="button"
                      onClick={() => handleRetrySingleChunk(chunk)}
                      disabled={isGenerating}
                      className="chunk-retry-btn"
                      title="Retry synthesizing this chunk"
                    >
                      <RotateCcw size={13} />
                      <span>Retry Take</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Text Snippet */}
              <p className="tts-chunk-text">"{displayText}"</p>

              {/* Inline Audio Player for Listen Take */}
              {isDone && isPlaying && (
                <div className="chunk-inline-audio-player">
                  <div className="player-top-header">
                    <span className="player-title">
                      <Volume2 size={13} style={{ color: '#2563eb' }} />
                      <span>Take Preview: Part {chunk.chunkIndex} ({chunk.episodeTitle})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlayingChunkId(null)}
                      className="player-close-btn"
                      title="Close audio preview"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <audio
                    key={chunk.id}
                    controls
                    autoPlay
                    preload="auto"
                    src={chunk.audioUrl || (chunk.audioBase64 ? `data:audio/wav;base64,${chunk.audioBase64}` : (projectId ? `/api/anime-script/audio?projectId=${encodeURIComponent(projectId)}&chunkId=${encodeURIComponent(chunk.id)}` : undefined))}
                    onEnded={() => setPlayingChunkId(null)}
                    onError={(e) => {
                      console.error('Audio playback error for chunk:', chunk.id, e);
                    }}
                  />
                </div>
              )}

              {chunk.audioError && (
                <div className="chunk-error-msg">
                  <AlertTriangle size={12} />
                  <span>{chunk.audioError}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="step-bottom-bar">
        <div className="bottom-bar-left">
          <span className="bar-info-text">
            {completedChunks} of {totalChunks} chunks synthesized ({progressPercent}%)
          </span>
        </div>

        <button
          type="button"
          onClick={onMergeAndProceed}
          disabled={completedChunks === 0 || isMerging}
          className="studio-generate-btn primary-workflow-cta"
        >
          {isMerging ? (
            <>
              <Loader2 size={15} className="spinning-sync-icon" />
              <span>Merging Audio Chunks...</span>
            </>
          ) : (
            <>
              <Disc3 size={15} />
              <span>Merge & Proceed to Master Export</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
