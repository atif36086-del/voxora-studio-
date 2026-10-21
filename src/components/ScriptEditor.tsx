'use client';

import React, { useState } from 'react';
import {
  TTSProvider,
  GoogleTTSModel,
  getEngineLimits,
} from '@/lib/types';
import { SAMPLE_SCRIPTS, ScriptSample } from '@/lib/samples';
import { splitScriptIntoScenes, ScriptChunk } from '@/lib/scriptSplitter';
import { optimizeAnimeScript } from '@/lib/animeGlossary';
import {
  FileText,
  Clipboard,
  Trash2,
  AlertTriangle,
  Sparkles,
  Clock,
  AlignLeft,
  Gauge,
  Scissors,
  Layers,
  Wand2,
  CheckCircle2,
} from 'lucide-react';

interface ScriptEditorProps {
  script: string;
  onChangeScript: (text: string) => void;
  onLoadSample: (sample: ScriptSample) => void;
  pace?: number;
  provider?: TTSProvider;
  geminiModel?: GoogleTTSModel;
  onOpenLimitsModal?: () => void;
  disabled?: boolean;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  onChangeScript,
  onLoadSample,
  pace = 1.0,
  provider = 'google',
  geminiModel = 'gemini-3.8-flash-tts',
  onOpenLimitsModal,
  disabled = false,
}) => {
  const [splitChunks, setSplitChunks] = useState<ScriptChunk[]>([]);
  const [activeChunkIndex, setActiveChunkIndex] = useState<number | null>(null);
  const [fullMasterScript, setFullMasterScript] = useState<string>('');
  const [optimizeNotice, setOptimizeNotice] = useState<string | null>(null);

  const engineLimits = getEngineLimits(provider, geminiModel);
  const maxChars = engineLimits.maxChars;

  const charCount = script.length;
  const isOverLimit = charCount > maxChars;
  const isNearLimit = charCount > maxChars * 0.85 && !isOverLimit;
  const percentUsed = Math.min(100, Math.round((charCount / maxChars) * 100));
  const remainingChars = maxChars - charCount;

  // Words count calculation
  const wordsCount = script.trim() ? script.trim().split(/\s+/).length : 0;

  // Estimated duration in seconds (average ~135 words per minute in Hindi narration at 1.0x pace)
  const baseWpm = 135;
  const effectiveWpm = baseWpm * (pace || 1.0);
  const estimatedSeconds = wordsCount > 0 ? Math.round((wordsCount / effectiveWpm) * 60) : 0;

  const formatDuration = (secs: number) => {
    if (secs < 60) return `~${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `~${m}m ${s > 0 ? `${s}s` : ''}`;
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChangeScript(text);
        setSplitChunks([]);
        setActiveChunkIndex(null);
      }
    } catch {
      // In case clipboard API is restricted
    }
  };

  const handleClear = () => {
    onChangeScript('');
    setSplitChunks([]);
    setActiveChunkIndex(null);
  };

  const handleTrimToLimit = () => {
    if (script.length <= maxChars) return;
    const slice = script.slice(0, maxChars);
    const lastPunct = Math.max(
      slice.lastIndexOf('।'),
      slice.lastIndexOf('.'),
      slice.lastIndexOf('?'),
      slice.lastIndexOf('!'),
      slice.lastIndexOf('\n')
    );
    if (lastPunct > maxChars * 0.75) {
      onChangeScript(slice.slice(0, lastPunct + 1).trim());
    } else {
      onChangeScript(slice.trim());
    }
  };

  // 1-Click Auto Scene Splitter
  const handleSplitScript = () => {
    const targetCap = Math.min(2200, Math.round(maxChars * 0.85));
    const chunks = splitScriptIntoScenes(script, targetCap, maxChars);
    if (chunks.length <= 1) return;

    setFullMasterScript(script);
    setSplitChunks(chunks);
    setActiveChunkIndex(0);
    onChangeScript(chunks[0].text);
  };

  const handleSelectChunk = (idx: number) => {
    setActiveChunkIndex(idx);
    onChangeScript(splitChunks[idx].text);
  };

  const handleShowFullScript = () => {
    if (fullMasterScript) {
      onChangeScript(fullMasterScript);
    }
    setSplitChunks([]);
    setActiveChunkIndex(null);
  };

  // 1-Click Anime Phonetics Optimizer
  const handleOptimizeAnimeTerms = () => {
    const res = optimizeAnimeScript(script);
    if (res.replacementsCount > 0) {
      onChangeScript(res.optimizedScript);
      setOptimizeNotice(
        `✓ Optimized ${res.replacementsCount} anime terms: ${res.replacedTerms.slice(0, 2).join(', ')}${
          res.replacedTerms.length > 2 ? '...' : ''
        }`
      );
      setTimeout(() => setOptimizeNotice(null), 4500);
    } else {
      setOptimizeNotice('All anime terms in this script are already phonetically optimal!');
      setTimeout(() => setOptimizeNotice(null), 3000);
    }
  };

  return (
    <div className="script-editor-container">
      {/* Editor top bar */}
      <div className="editor-top-bar">
        <div className="editor-title-wrap">
          <div className="title-icon-badge">
            <FileText size={16} />
          </div>
          <div>
            <h2 className="editor-title">Narration Script</h2>
            <span className="editor-subtitle">
              {maxChars.toLocaleString()} chars capacity • {engineLimits.shortName}
            </span>
          </div>
        </div>

        <div className="editor-actions">
          {/* Anime Phonetics Fixer */}
          <button
            type="button"
            onClick={handleOptimizeAnimeTerms}
            disabled={disabled || !script.trim()}
            className="editor-tool-btn anime-fixer-btn"
            title="Auto-optimize Japanese/Manhwa names (Sukuna, Gojo, Sung Jin-woo, Bankai) for flawless Hindi pronunciation"
          >
            <Wand2 size={13} className="wand-icon" />
            <span>Fix Anime Words</span>
          </button>

          {/* Auto Scene Splitter */}
          {(charCount > maxChars || splitChunks.length > 0) && (
            <button
              type="button"
              onClick={splitChunks.length > 0 ? handleShowFullScript : handleSplitScript}
              disabled={disabled}
              className="editor-tool-btn splitter-btn"
              title="Split long script into manageable video scene parts"
            >
              <Layers size={13} />
              <span>{splitChunks.length > 0 ? 'Exit Scene Split' : 'Split Scenes'}</span>
            </button>
          )}

          {onOpenLimitsModal && (
            <button
              type="button"
              onClick={onOpenLimitsModal}
              className="editor-tool-btn limits-btn"
              title="View all engine character limits & specs"
            >
              <Gauge size={13} />
              <span>Limits & Specs</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePasteClipboard}
            disabled={disabled}
            className="editor-tool-btn"
            title="Paste from clipboard"
          >
            <Clipboard size={14} />
            <span>Paste</span>
          </button>

          {script && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="editor-tool-btn danger"
              title="Clear script"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Phonetic Optimization Notice Banner */}
      {optimizeNotice && (
        <div className="anime-optimize-banner">
          <CheckCircle2 size={14} className="banner-icon" />
          <span>{optimizeNotice}</span>
        </div>
      )}

      {/* Scene Split Parts Tabs (When script is partitioned) */}
      {splitChunks.length > 1 && (
        <div className="scene-parts-toolbar">
          <div className="scene-toolbar-label">
            <Layers size={12} />
            <span>Scenes:</span>
          </div>
          <div className="scene-parts-list">
            <button
              type="button"
              onClick={handleShowFullScript}
              className={`scene-part-chip ${activeChunkIndex === null ? 'active' : ''}`}
            >
              Full Script ({fullMasterScript.length}c)
            </button>
            {splitChunks.map((chunk, idx) => (
              <button
                key={chunk.partNumber}
                type="button"
                onClick={() => handleSelectChunk(idx)}
                className={`scene-part-chip ${activeChunkIndex === idx ? 'active' : ''}`}
              >
                Part {chunk.partNumber} ({chunk.charCount}c • {chunk.estDuration})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Anituber Sample Scripts Bar */}
      <div className="samples-pill-row">
        <div className="samples-pill-label">
          <Sparkles size={13} className="sparkle-icon" />
          <span>Templates:</span>
        </div>
        <div className="samples-pills-list">
          {SAMPLE_SCRIPTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                onLoadSample(sample);
                setSplitChunks([]);
                setActiveChunkIndex(null);
              }}
              className="sample-pill-btn"
              title={`Load ${sample.title} (${sample.anime})`}
            >
              <span className="pill-anime">{sample.anime}</span>
              <span className="pill-sep">•</span>
              <span className="pill-title">{sample.title.split(':')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea Container */}
      <div className={`textarea-wrapper ${isOverLimit ? 'has-error' : ''}`}>
        <textarea
          value={script}
          onChange={(e) => {
            onChangeScript(e.target.value);
            if (activeChunkIndex !== null) {
              setSplitChunks([]);
              setActiveChunkIndex(null);
            }
          }}
          placeholder="Paste your anime script here... (Supports Devanagari Hindi, Hinglish, character names like Gojo, Sukuna, Naruto, Sung Jinwoo, and power names)"
          disabled={disabled}
          className="script-textarea"
          spellCheck={false}
          rows={11}
          aria-label="Anime script text input"
        />

        {/* Live Visual Limit Meter / Progress Bar */}
        <div
          className="editor-progress-container"
          title={`${charCount} / ${maxChars} characters used (${percentUsed}%)`}
        >
          <div className="editor-progress-track">
            <div
              className={`editor-progress-fill ${
                isOverLimit ? 'over' : isNearLimit ? 'warn' : 'normal'
              }`}
              style={{ width: `${Math.min(100, (charCount / maxChars) * 100)}%` }}
            />
          </div>
        </div>

        {/* Character & Reading Metrics Bar */}
        <div className="editor-bottom-bar">
          <div className="editor-metrics-left">
            <div className="metric-item" title="Word count">
              <AlignLeft size={13} className="metric-icon" />
              <span>{wordsCount.toLocaleString()} words</span>
            </div>

            {wordsCount > 0 && (
              <div
                className="metric-item duration-metric"
                title="Estimated audio narration duration"
              >
                <Clock size={13} className="metric-icon" />
                <span>
                  Est. Audio: {formatDuration(estimatedSeconds)} ({pace.toFixed(2)}x)
                </span>
              </div>
            )}

            {isOverLimit && (
              <div className="limit-warning-row">
                <span className="limit-warning error">
                  <AlertTriangle size={13} />
                  Over by {(charCount - maxChars).toLocaleString()} chars
                </span>
                <button
                  type="button"
                  onClick={handleSplitScript}
                  className="split-auto-btn"
                  title="Split into sequential parts matching engine character cap"
                >
                  <Layers size={11} />
                  <span>Split into Parts</span>
                </button>
                <button
                  type="button"
                  onClick={handleTrimToLimit}
                  className="trim-limit-btn"
                  title={`Trim script to sentence boundary within ${maxChars.toLocaleString()} characters`}
                >
                  <Scissors size={11} />
                  <span>Trim</span>
                </button>
              </div>
            )}

            {isNearLimit && !isOverLimit && (
              <span className="limit-warning caution">
                <AlertTriangle size={13} />
                {remainingChars.toLocaleString()} chars left ({percentUsed}%)
              </span>
            )}
          </div>

          <div
            className={`character-counter-badge ${
              isOverLimit ? 'over' : isNearLimit ? 'warn' : ''
            }`}
            onClick={onOpenLimitsModal}
            style={{ cursor: onOpenLimitsModal ? 'pointer' : 'default' }}
            title="Click to view full engine limits breakdown"
          >
            <span className="char-current">{charCount.toLocaleString()}</span>
            <span className="char-divider">/</span>
            <span className="char-max">{maxChars.toLocaleString()} chars</span>
            <span className="char-percent">({percentUsed}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
