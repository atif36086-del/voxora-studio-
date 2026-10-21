'use client';

import React, { useState } from 'react';
import {
  Save,
  Undo2,
  Redo2,
  RefreshCw,
  Check,
  ArrowRight,
  ShieldCheck,
  Search,
  BookOpen,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  WorkflowChunk,
  DetectedEpisode,
  WorkflowProjectSettings,
} from '@/lib/types';

interface TranslationEditorStepProps {
  episodes: DetectedEpisode[];
  chunks: WorkflowChunk[];
  settings: WorkflowProjectSettings;
  terminologyMemory: Record<string, string>;
  onUpdateChunk: (chunk: WorkflowChunk) => void;
  onProceedToTTS: () => void;
}

export const TranslationEditorStep: React.FC<TranslationEditorStepProps> = ({
  episodes,
  chunks,
  settings,
  terminologyMemory,
  onUpdateChunk,
  onProceedToTTS,
}) => {
  const [selectedEpisode, setSelectedEpisode] = useState<number>(
    episodes[0]?.episodeNumber || 1
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [regeneratingChunkId, setRegeneratingChunkId] = useState<string | null>(null);
  const [customPromptGuidance, setCustomPromptGuidance] = useState<string>('');

  // History stack per chunk for Undo / Redo
  const [historyMap, setHistoryMap] = useState<Record<string, { past: string[]; future: string[] }>>({});
  // Track saved state
  const [savedStatusMap, setSavedStatusMap] = useState<Record<string, boolean>>({});

  const filteredChunks = chunks.filter((c) => {
    const matchesEp = c.episodeNumber === selectedEpisode;
    if (!searchQuery.trim()) return matchesEp;
    const q = searchQuery.toLowerCase();
    return (
      matchesEp &&
      (c.originalText.toLowerCase().includes(q) ||
        (c.translatedText || '').toLowerCase().includes(q))
    );
  });

  const handleTextChange = (chunk: WorkflowChunk, newText: string) => {
    const currentText = chunk.translatedText || '';
    const chunkHist = historyMap[chunk.id] || { past: [], future: [] };

    // Push previous text to past history
    setHistoryMap((prev) => ({
      ...prev,
      [chunk.id]: {
        past: [...chunkHist.past, currentText],
        future: [],
      },
    }));

    setSavedStatusMap((prev) => ({ ...prev, [chunk.id]: false }));

    onUpdateChunk({
      ...chunk,
      translatedText: newText,
      updatedAt: Date.now(),
    });
  };

  const handleUndo = (chunk: WorkflowChunk) => {
    const chunkHist = historyMap[chunk.id];
    if (!chunkHist || chunkHist.past.length === 0) return;

    const previous = chunkHist.past[chunkHist.past.length - 1];
    const newPast = chunkHist.past.slice(0, -1);

    setHistoryMap((prev) => ({
      ...prev,
      [chunk.id]: {
        past: newPast,
        future: [chunk.translatedText || '', ...chunkHist.future],
      },
    }));

    onUpdateChunk({
      ...chunk,
      translatedText: previous,
      updatedAt: Date.now(),
    });
  };

  const handleRedo = (chunk: WorkflowChunk) => {
    const chunkHist = historyMap[chunk.id];
    if (!chunkHist || chunkHist.future.length === 0) return;

    const next = chunkHist.future[0];
    const newFuture = chunkHist.future.slice(1);

    setHistoryMap((prev) => ({
      ...prev,
      [chunk.id]: {
        past: [...chunkHist.past, chunk.translatedText || ''],
        future: newFuture,
      },
    }));

    onUpdateChunk({
      ...chunk,
      translatedText: next,
      updatedAt: Date.now(),
    });
  };

  const handleSaveChunk = (chunkId: string) => {
    setSavedStatusMap((prev) => ({ ...prev, [chunkId]: true }));
    setTimeout(() => {
      setSavedStatusMap((prev) => ({ ...prev, [chunkId]: false }));
    }, 2500);
  };

  const handleRegenerateParagraph = async (chunk: WorkflowChunk) => {
    if (regeneratingChunkId) return;

    setRegeneratingChunkId(chunk.id);

    try {
      const response = await fetch('/api/anime-script/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: chunk.originalText,
          chunkId: chunk.id,
          model: settings.translationModel || 'gemini-2.0-flash',
          terminologyMemory,
          episodeTitle: chunk.episodeTitle,
          chunkNumber: chunk.chunkIndex,
          totalChunks: chunk.totalChunksInEpisode,
          customGuidance: customPromptGuidance.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.translatedText) {
        // Record undo history
        const chunkHist = historyMap[chunk.id] || { past: [], future: [] };
        setHistoryMap((prev) => ({
          ...prev,
          [chunk.id]: {
            past: [...chunkHist.past, chunk.translatedText || ''],
            future: [],
          },
        }));

        onUpdateChunk({
          ...chunk,
          translatedText: data.translatedText,
          qualityCheck: data.qualityCheck,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      console.error('Failed to regenerate paragraph:', err);
    } finally {
      setRegeneratingChunkId(null);
    }
  };

  const totalTranslated = chunks.filter((c) => Boolean(c.translatedText?.trim())).length;

  return (
    <div className="editor-step-container">
      {/* Top Bar with Navigation & Actions */}
      <div className="editor-control-header">
        <div className="header-info-group">
          <h2 className="step-main-heading">3. Side-by-Side Script Review</h2>
          <p className="step-sub-desc">
            Compare the original English against the Roman Hinglish translation. Edit any paragraph freely, use Undo/Redo, or regenerate individual sections without modifying the rest of the script.
          </p>
        </div>

        <button
          type="button"
          onClick={onProceedToTTS}
          className="studio-generate-btn primary-workflow-cta"
        >
          <span>Approve & Generate Voiceover</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Episode Tabs & Search Bar */}
      <div className="editor-nav-strip">
        <div className="episode-selector-tabs">
          {episodes.map((ep) => (
            <button
              key={ep.episodeNumber}
              type="button"
              onClick={() => setSelectedEpisode(ep.episodeNumber)}
              className={`episode-tab-pill ${selectedEpisode === ep.episodeNumber ? 'active' : ''}`}
            >
              <BookOpen size={13} />
              <span>{ep.title}</span>
              <span className="pill-chunk-count">
                {chunks.filter((c) => c.episodeNumber === ep.episodeNumber).length} chunks
              </span>
            </button>
          ))}
        </div>

        <div className="editor-search-box">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search characters, attacks, or terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Side-by-Side Dual Column Grid */}
      <div className="dual-column-editor-grid">
        {filteredChunks.map((chunk) => {
          const isRegenerating = regeneratingChunkId === chunk.id;
          const chunkHist = historyMap[chunk.id];
          const canUndo = (chunkHist?.past.length || 0) > 0;
          const canRedo = (chunkHist?.future.length || 0) > 0;
          const isSaved = savedStatusMap[chunk.id];

          const hinglishText = chunk.translatedText || '';
          const wordCount = hinglishText.split(/\s+/).filter(Boolean).length;
          const charCount = hinglishText.length;

          return (
            <div key={chunk.id} className="editor-row-pair-card">
              {/* Card Meta Bar */}
              <div className="row-card-top-bar">
                <div className="row-id-pill">
                  <span>Part {chunk.chunkIndex}</span>
                  <span className="meta-sep">•</span>
                  <span>{chunk.episodeTitle}</span>
                </div>

                <div className="row-actions-group">
                  {/* Quality Badge */}
                  {chunk.qualityCheck && (
                    <div className="mini-qc-badge">
                      <ShieldCheck size={12} />
                      <span>{chunk.qualityCheck.score}% Match</span>
                    </div>
                  )}

                  {/* Undo Button */}
                  <button
                    type="button"
                    onClick={() => handleUndo(chunk)}
                    disabled={!canUndo || isRegenerating}
                    className="editor-icon-btn"
                    title="Undo"
                  >
                    <Undo2 size={13} />
                  </button>

                  {/* Redo Button */}
                  <button
                    type="button"
                    onClick={() => handleRedo(chunk)}
                    disabled={!canRedo || isRegenerating}
                    className="editor-icon-btn"
                    title="Redo"
                  >
                    <Redo2 size={13} />
                  </button>

                  {/* Regenerate Paragraph */}
                  <button
                    type="button"
                    onClick={() => handleRegenerateParagraph(chunk)}
                    disabled={isRegenerating}
                    className="editor-action-btn regen-btn"
                    title="Regenerate this chunk with Gemini"
                  >
                    {isRegenerating ? (
                      <Loader2 size={13} className="spinning-sync-icon" />
                    ) : (
                      <RefreshCw size={13} />
                    )}
                    <span>{isRegenerating ? 'Regenerating...' : 'Regen Paragraph'}</span>
                  </button>

                  {/* Save Button */}
                  <button
                    type="button"
                    onClick={() => handleSaveChunk(chunk.id)}
                    className={`editor-action-btn save-btn ${isSaved ? 'saved' : ''}`}
                    title="Save changes"
                  >
                    {isSaved ? <Check size={13} /> : <Save size={13} />}
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </div>

              {/* Side-by-side Dual Textboxes */}
              <div className="dual-textboxes-container">
                {/* LEFT: English Source */}
                <div className="editor-column left-source">
                  <div className="column-header-tag">English Source Script</div>
                  <div className="source-text-display">
                    {chunk.originalText}
                  </div>
                  <div className="column-footer-stats">
                    {chunk.originalText.length.toLocaleString()} chars •{' '}
                    {chunk.originalText.split(/\s+/).filter(Boolean).length} words
                  </div>
                </div>

                {/* RIGHT: Roman Hinglish Translation */}
                <div className="editor-column right-hinglish">
                  <div className="column-header-tag">Roman Hinglish (Editable)</div>
                  <textarea
                    rows={6}
                    value={hinglishText}
                    onChange={(e) => handleTextChange(chunk, e.target.value)}
                    placeholder="Enter or refine Hinglish narration..."
                    className="hinglish-editor-textarea"
                    disabled={isRegenerating}
                  />
                  <div className="column-footer-stats">
                    {charCount.toLocaleString()} chars • {wordCount} words
                    {isSaved && <span className="saved-confirm-pill">Changes saved</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Action Row */}
      <div className="step-bottom-bar">
        <div className="bottom-bar-left">
          <span className="bar-info-text">
            {totalTranslated} of {chunks.length} chunks approved and ready for voiceover
          </span>
        </div>

        <button
          type="button"
          onClick={onProceedToTTS}
          className="studio-generate-btn primary-workflow-cta"
        >
          <span>Approve Script & Proceed to Voiceover</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};
