'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Bookmark,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  WorkflowChunk,
  ScriptMetadata,
  WorkflowProjectSettings,
} from '@/lib/types';

interface TranslationStepProps {
  metadata: ScriptMetadata;
  chunks: WorkflowChunk[];
  settings: WorkflowProjectSettings;
  terminologyMemory: Record<string, string>;
  onUpdateChunk: (chunk: WorkflowChunk) => void;
  onUpdateTerminology: (newTerms: Record<string, string>) => void;
  onProceedToReview: () => void;
}

export const TranslationStep: React.FC<TranslationStepProps> = ({
  metadata,
  chunks,
  settings,
  terminologyMemory,
  onUpdateChunk,
  onUpdateTerminology,
  onProceedToReview,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(-1);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to start translation');
  const [activeFilterEp, setActiveFilterEp] = useState<number | 'all'>('all');
  const [concurrency, setConcurrency] = useState<number>(3);
  const [activeTranslatingIds, setActiveTranslatingIds] = useState<string[]>([]);
  const [cooldownSec, setCooldownSec] = useState<number | null>(null);

  // Abort controller ref for pausing
  const isPausedRef = useRef<boolean>(false);
  const chunksRef = useRef<WorkflowChunk[]>(chunks);
  const retryCountRef = useRef<Record<string, number>>({});
  chunksRef.current = chunks;

  const totalChunks = chunks.length;
  const completedChunks = chunks.filter((c) => c.status === 'completed').length;
  const failedChunks = chunks.filter((c) => c.status === 'failed').length;
  const progressPercent = totalChunks > 0 ? Math.round((completedChunks / totalChunks) * 100) : 0;

  const hasUnfinishedChunks = completedChunks < totalChunks;

  // Single chunk translate worker
  const translateSingleChunk = async (
    chunk: WorkflowChunk,
    idx: number
  ): Promise<{ success: boolean; error?: string; isRateLimit?: boolean }> => {
    // Find previous translated chunk for conversational continuity
    const prevChunk = idx > 0 ? chunksRef.current[idx - 1] : undefined;
    const previousHinglishContext = prevChunk?.translatedText
      ? prevChunk.translatedText.slice(-300)
      : undefined;

    const nextChunk =
      idx + 1 < chunksRef.current.length ? chunksRef.current[idx + 1] : undefined;
    const upcomingSourceContext = nextChunk?.originalText
      ? nextChunk.originalText.slice(0, 200)
      : undefined;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch('/api/anime-script/translate', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: chunk.originalText,
          chunkId: chunk.id,
          model: settings.translationModel || 'gemini-2.0-flash',
          previousHinglishContext,
          upcomingSourceContext,
          terminologyMemory,
          episodeTitle: chunk.episodeTitle,
          chunkNumber: chunk.chunkIndex,
          totalChunks: chunk.totalChunksInEpisode,
        }),
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.success && data.translatedText) {
        if (data.newTerminology && Object.keys(data.newTerminology).length > 0) {
          onUpdateTerminology(data.newTerminology);
        }

        const completedChunk: WorkflowChunk = {
          ...chunk,
          translatedText: data.translatedText,
          status: 'completed',
          qualityCheck: data.qualityCheck,
          terminology: data.newTerminology || {},
          error: undefined,
          updatedAt: Date.now(),
        };
        chunksRef.current[idx] = completedChunk;
        onUpdateChunk(completedChunk);
        return { success: true };
      }

      const isRateLimit =
        response.status === 429 ||
        data.error?.toLowerCase().includes('quota') ||
        data.error?.toLowerCase().includes('rate limit');

      retryCountRef.current[chunk.id] = (retryCountRef.current[chunk.id] || 0) + 1;
      const failedChunk: WorkflowChunk = {
        ...chunk,
        status: 'failed',
        error: data.error || 'Translation request failed',
        updatedAt: Date.now(),
      };
      chunksRef.current[idx] = failedChunk;
      onUpdateChunk(failedChunk);
      return { success: false, error: data.error || 'Translation failed', isRateLimit };
    } catch (err: unknown) {
      retryCountRef.current[chunk.id] = (retryCountRef.current[chunk.id] || 0) + 1;
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      const msg = isTimeout
        ? 'Translation timed out (60s)'
        : err instanceof Error
        ? err.message
        : 'Network error';
      const failedChunk: WorkflowChunk = {
        ...chunk,
        status: 'failed',
        error: msg,
        updatedAt: Date.now(),
      };
      chunksRef.current[idx] = failedChunk;
      onUpdateChunk(failedChunk);
      return { success: false, error: msg };
    }
  };

  // Parallel Concurrent Worker Loop
  const runParallelTranslation = async (indicesToRun?: number[]) => {
    isPausedRef.current = false;
    setIsRunning(true);
    setCooldownSec(null);

    const list = chunksRef.current;
    const targetIndices =
      indicesToRun && indicesToRun.length > 0
        ? indicesToRun
        : list
            .map((_, i) => i)
            .filter((i) => list[i].status !== 'completed');

    if (targetIndices.length === 0) {
      setIsRunning(false);
      return;
    }

    const activeMap = new Map<number, number>(); // chunkIndex -> elapsed seconds
    let queueIdx = 0;
    const workerCount = Math.min(concurrency, targetIndices.length);

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
        `Translating ${activeMap.size} part${activeMap.size > 1 ? 's' : ''} in parallel: ${parts.join(' • ')}`
      );
    }, 1000);

    const worker = async () => {
      while (!isPausedRef.current && queueIdx < targetIndices.length) {
        const i = targetIndices[queueIdx++];
        const chunk = chunksRef.current[i];
        if (!chunk || chunk.status === 'completed') continue;

        activeMap.set(i, 0);
        setActiveTranslatingIds(
          Array.from(activeMap.keys())
            .map((idx) => chunksRef.current[idx]?.id)
            .filter(Boolean) as string[]
        );

        // Mark as translating
        const inProgressChunk: WorkflowChunk = {
          ...chunk,
          status: 'translating',
          updatedAt: Date.now(),
        };
        chunksRef.current[i] = inProgressChunk;
        onUpdateChunk(inProgressChunk);

        const res = await translateSingleChunk(chunk, i);

        activeMap.delete(i);
        setActiveTranslatingIds(
          Array.from(activeMap.keys())
            .map((idx) => chunksRef.current[idx]?.id)
            .filter(Boolean) as string[]
        );

        if (isPausedRef.current) break;

        if (!res.success && res.isRateLimit) {
          for (let sec = 10; sec > 0; sec--) {
            if (isPausedRef.current) break;
            setCooldownSec(sec);
            setStatusMessage(`Gemini Rate Limit reached. Cooling down for ${sec}s...`);
            await new Promise((r) => setTimeout(r, 1000));
          }
          setCooldownSec(null);
        }

        // Slight 200ms stagger between worker iterations to avoid thundering herds
        await new Promise((r) => setTimeout(r, 200));
      }
    };

    const workerPromises = Array.from({ length: workerCount }, () => worker());
    await Promise.all(workerPromises);

    clearInterval(ticker);
    setActiveTranslatingIds([]);
    setIsRunning(false);
    setCurrentChunkIndex(-1);
    setCooldownSec(null);

    const latestCompleted = chunksRef.current.filter((c) => c.status === 'completed').length;
    if (latestCompleted >= totalChunks) {
      setStatusMessage('Translation complete! All chunks validated.');
    } else if (isPausedRef.current) {
      setStatusMessage('Translation paused. Click "Resume Translation" anytime to continue.');
    } else {
      setStatusMessage(`Parallel translation batch completed. ${latestCompleted}/${totalChunks} ready.`);
    }
  };

  const handlePause = () => {
    isPausedRef.current = true;
    setIsRunning(false);
    setStatusMessage('Pausing translation...');
  };

  const handleRetryFailed = () => {
    retryCountRef.current = {};
    const failedIndices = chunksRef.current
      .map((_, i) => i)
      .filter((i) => chunksRef.current[i].status === 'failed');
    runParallelTranslation(failedIndices.length > 0 ? failedIndices : undefined);
  };

  const runSingleChunkTranslation = async (idx: number) => {
    const chunk = chunksRef.current[idx];
    if (!chunk || isRunning) return;

    setActiveTranslatingIds([chunk.id]);
    const inProgressChunk: WorkflowChunk = {
      ...chunk,
      status: 'translating',
      updatedAt: Date.now(),
    };
    chunksRef.current[idx] = inProgressChunk;
    onUpdateChunk(inProgressChunk);
    setStatusMessage(`Translating ${chunk.episodeTitle} (Part ${chunk.chunkIndex})...`);

    await translateSingleChunk(chunk, idx);
    setActiveTranslatingIds([]);
    setStatusMessage(`Chunk ${chunk.chunkIndex} completed.`);
  };

  const filteredChunks =
    activeFilterEp === 'all'
      ? chunks
      : chunks.filter((c) => c.episodeNumber === activeFilterEp);

  const termCount = Object.keys(terminologyMemory).length;

  return (
    <div className="translation-step-container">
      {/* Top Banner & Control Deck */}
      <div className="translation-control-card">
        <div className="control-card-top-row">
          <div className="left-headline-group">
            <h2 className="step-main-heading">2. AI Script Translation</h2>
            <p className="step-sub-desc">
              Translating English to natural Roman Hinglish using Indian Anituber persona. Complete narrative preservation with automatic terminology memory and parallel Gemini processing.
            </p>
          </div>

          <div className="action-buttons-group" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Parallel Workers Concurrency Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff', padding: '3px 8px', borderRadius: '7px', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>Parallel Workers:</span>
              {[
                { level: 1, label: '1x' },
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
                  title={`${level} chunks translated concurrently`}
                >
                  {label}
                </button>
              ))}
            </div>

            {isRunning ? (
              <button
                type="button"
                onClick={handlePause}
                className="pause-translation-btn"
              >
                <Pause size={15} />
                <span>Pause Translation</span>
              </button>
            ) : hasUnfinishedChunks ? (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  id="resume-translation-btn"
                  onClick={() => runParallelTranslation()}
                  className="studio-generate-btn primary-workflow-cta"
                >
                  <Play size={15} />
                  <span>
                    {completedChunks > 0 ? `Resume Translation (${completedChunks}/${totalChunks})` : 'Start Translation'}
                  </span>
                </button>

                {failedChunks > 0 && (
                  <button
                    type="button"
                    onClick={handleRetryFailed}
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
                onClick={onProceedToReview}
                className="studio-generate-btn primary-workflow-cta"
              >
                <span>Proceed to Review & Edit</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>

        {/* 3D Neural Translation Showcase Banner */}
        <div className="dubbing-hero-showcase-banner translation-engine-hero-banner">
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
              Neural Anime Translation Engine
            </span>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '0.25rem' }}>
              Dual-Stream Japanese, Hindi & Hinglish Persona
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Powered by deep scene context, anime emotion matching, and continuous terminology memory. Translates raw manuscripts into natural storytelling cadences.
            </p>
          </div>
          <div className="dubbing-hero-img-wrap">
            <img
              src="/assets/voxora-translation-engine.jpg"
              alt="VOXORA 3D Neural Translation Engine"
              className="dubbing-hero-img"
            />
          </div>
        </div>

        {/* Live Progress Bar */}
        <div className="translation-progress-deck">
          <div className="progress-info-row">
            <div className="progress-left-stats">
              <span className="progress-stat-pill">
                <Layers size={13} />
                <span>
                  {completedChunks} of {totalChunks} chunks translated
                </span>
              </span>
              {failedChunks > 0 && (
                <span className="failed-stat-pill">
                  <AlertTriangle size={13} />
                  <span>{failedChunks} failed</span>
                </span>
              )}
            </div>

            <div className="progress-right-readout">
              <span className="progress-percent-text">{progressPercent}% Complete</span>
            </div>
          </div>

          <div className="progress-track-bar">
            <div
              className="progress-fill-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Current Live Operation Pill */}
          <div className="current-operation-banner">
            {isRunning ? (
              <Loader2 size={14} className="spinning-sync-icon" />
            ) : completedChunks >= totalChunks ? (
              <CheckCircle2 size={14} className="success-icon" />
            ) : (
              <Sparkles size={14} className="sparkle-icon" />
            )}
            <span className="operation-text">{statusMessage}</span>
          </div>
        </div>

        {/* Terminology Memory Live Counter */}
        {termCount > 0 && (
          <div className="terminology-live-card">
            <div className="terminology-header">
              <Bookmark size={13} />
              <span>Terminology Memory ({termCount} anime terms preserved consistently):</span>
            </div>
            <div className="terms-bubble-wrap">
              {Object.entries(terminologyMemory).map(([eng, rom], i) => (
                <span key={i} className="term-bubble">
                  <strong>{eng}</strong>
                  {rom !== eng && <span className="term-arrow">→ {rom}</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Episode Filter Tabs */}
      <div className="episode-filter-bar">
        <span className="filter-label">Filter Episodes:</span>
        <button
          type="button"
          onClick={() => setActiveFilterEp('all')}
          className={`episode-tab-pill ${activeFilterEp === 'all' ? 'active' : ''}`}
        >
          All ({chunks.length} chunks)
        </button>
        {metadata.detectedEpisodes.map((ep) => (
          <button
            key={ep.episodeNumber}
            type="button"
            onClick={() => setActiveFilterEp(ep.episodeNumber)}
            className={`episode-tab-pill ${activeFilterEp === ep.episodeNumber ? 'active' : ''}`}
          >
            {ep.title} ({chunks.filter((c) => c.episodeNumber === ep.episodeNumber).length})
          </button>
        ))}
      </div>

      {/* Chunks Stream List */}
      <div className="chunks-stream-grid">
        {filteredChunks.map((chunk) => {
          const isDone = chunk.status === 'completed';
          const isFailed = chunk.status === 'failed';
          const isTranslating = chunk.status === 'translating' || activeTranslatingIds.includes(chunk.id);

          return (
            <div
              key={chunk.id}
              className={`chunk-stream-card ${isDone ? 'status-done' : ''} ${isFailed ? 'status-failed' : ''} ${isTranslating ? 'status-translating' : ''}`}
            >
              <div className="chunk-card-header">
                <div className="chunk-id-group">
                  <span className="chunk-number-tag">
                    {chunk.episodeTitle} • Part {chunk.chunkIndex}
                  </span>
                  <span className="chunk-chars-count">
                    {chunk.originalText.length.toLocaleString()} chars
                  </span>
                </div>

                <div className="chunk-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {isDone && (
                    <span className="status-chip success">
                      <CheckCircle2 size={12} />
                      <span>Translated ({chunk.qualityCheck?.score || 95}%)</span>
                    </span>
                  )}
                  {isTranslating && (
                    <span className="status-chip active">
                      <Loader2 size={12} className="spinning-sync-icon" />
                      <span>Translating...</span>
                    </span>
                  )}
                  {isFailed && (
                    <span className="status-chip error">
                      <AlertTriangle size={12} />
                      <span>Failed</span>
                    </span>
                  )}
                  {chunk.status === 'pending' && !isTranslating && (
                    <span className="status-chip pending">Pending</span>
                  )}

                  {!isTranslating && !isRunning && (
                    <button
                      type="button"
                      onClick={() => runSingleChunkTranslation(chunksRef.current.findIndex((c) => c.id === chunk.id))}
                      title="Translate or re-run this specific part"
                      style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        fontSize: '0.72rem',
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <RotateCcw size={11} />
                      <span>{isDone ? 'Re-run' : 'Translate'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dual Content Preview */}
              <div className="chunk-dual-preview">
                <div className="preview-column source-preview">
                  <span className="column-label">English Source:</span>
                  <p className="column-text">{chunk.originalText}</p>
                </div>

                <div className="preview-column hinglish-preview">
                  <span className="column-label">Roman Hinglish Translation:</span>
                  {chunk.translatedText ? (
                    <p className="column-text hinglish-text">{chunk.translatedText}</p>
                  ) : (
                    <p className="column-placeholder">
                      {isTranslating ? 'Generating translation with Gemini...' : 'Awaiting translation...'}
                    </p>
                  )}
                </div>
              </div>

              {/* Quality Check Notes */}
              {chunk.qualityCheck && (
                <div className="chunk-qc-footer">
                  <ShieldCheck size={13} className="qc-icon" />
                  <span className="qc-notes">
                    Quality Pass: {chunk.qualityCheck.notes.join(' • ') || 'Full story detail verified'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="step-bottom-bar">
        <div className="bottom-bar-left">
          <span className="bar-info-text">
            {completedChunks} of {totalChunks} chunks translated ({progressPercent}%)
          </span>
        </div>

        <button
          type="button"
          onClick={onProceedToReview}
          className="studio-generate-btn primary-workflow-cta"
        >
          <span>Review & Edit Translations</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};
