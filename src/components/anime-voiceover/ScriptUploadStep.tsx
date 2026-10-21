'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Layers,
  Clock,
  Coins,
  ArrowRight,
  Sparkles,
  FileCheck,
  AlertCircle,
  Loader2,
  BookOpen,
} from 'lucide-react';
import {
  ScriptMetadata,
  WorkflowChunk,
  DetectedEpisode,
} from '@/lib/types';

interface ScriptUploadStepProps {
  onScriptReady: (
    metadata: ScriptMetadata,
    chunks: WorkflowChunk[],
    projectName: string
  ) => void;
  initialMetadata?: ScriptMetadata;
  initialProjectName?: string;
}

const SAMPLE_ANIME_SCRIPT = `Episode 1: The Dark Gate Opens

It was an ordinary morning in Seoul when the red notification gate materialized above the city skyline. Hunter Sung Jin-woo checked his shattered dagger, knowing full well that as the lowest E-Rank hunter, even the weakest goblin could end his life. 

Hunter Song turned to the raid party with a grim expression. "Listen carefully. This dungeon's mana signature is fluctuating dangerously. Keep your guards up and do not touch the ancient stone statues."

Jin-woo gripped his weapon tightly. "I have to survive this raid. My mother's hospital bills depend on today's mana crystals." 

Suddenly, the heavy double doors slammed shut behind them with a deafening boom. The glowing blue eyes of the towering God Statue shifted toward the hunters. In an instant, crimson heat beams incinerated three hunters where they stood. Panic erupted throughout the chamber as Song screamed for everyone to bow before the statue.

Episode 2: Awakening of the Shadow Monarch

Pinned against the stone altar, blood dripping from his side, Jin-woo stared directly into the terrifying face of death. Every other hunter had already fled through the closing entrance, leaving him behind as a sacrifice. 

"Is this really how it ends?" Jin-woo whispered, his consciousness slipping away as the giant statues raised their weapons above him. "If I had just one more chance... just one more chance to become stronger..."

[QUEST: COURAGE OF THE WEAK COMPLETED]
[YOU HAVE QUALIFIED TO BECOME A PLAYER]

A translucent holographic system screen materialized in mid-air right before his dying eyes. A surge of pure darkness erupted from his chest, shattering the stone statues into millions of fragments. The mysterious prompt hovered in front of him with a single pulsing command: 'Arise'. Jin-woo looked at his trembling hands, sensing an incomprehensible surge of sovereign power flowing through his veins.`;

export const ScriptUploadStep: React.FC<ScriptUploadStepProps> = ({
  onScriptReady,
  initialMetadata,
  initialProjectName = 'Solo Leveling: Double Dungeon Arc',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [projectName, setProjectName] = useState<string>(initialProjectName);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Extracted preview state
  const [metadata, setMetadata] = useState<ScriptMetadata | null>(
    initialMetadata || null
  );
  const [chunks, setChunks] = useState<WorkflowChunk[]>([]);
  const [selectedEpisodeIdx, setSelectedEpisodeIdx] = useState<number>(0);

  const handleProcessFile = async (file: File) => {
    setError(null);
    setIsExtracting(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/anime-script/extract', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract text from file.');
      }

      setMetadata(data.metadata);
      setChunks(data.chunks);

      // Auto-populate project name with clean file name
      const cleanFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setProjectName(cleanFileName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown extraction error';
      setError(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleProcessText = async (text: string, title: string) => {
    setError(null);
    setIsExtracting(true);

    try {
      const res = await fetch('/api/anime-script/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          fileName: `${title.replace(/\s+/g, '_')}.txt`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse script text.');
      }

      setMetadata(data.metadata);
      setChunks(data.chunks);
      setProjectName(title);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Extraction error';
      setError(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleProceed = () => {
    if (!metadata || chunks.length === 0) return;
    onScriptReady(metadata, chunks, projectName || 'Untitled Anime Project');
  };

  const currentEp = metadata?.detectedEpisodes[selectedEpisodeIdx];

  return (
    <div className="upload-step-container">
      {/* Project Identity Row */}
      <div className="upload-header-row">
        <div className="upload-title-block">
          <h2 className="step-main-heading">1. Upload Anime Script</h2>
          <p className="step-sub-desc">
            Upload your complete episode script in PDF, TXT, or DOCX format. We will automatically detect episodes, compute character & token costs, and partition the script into narrative chunks.
          </p>
        </div>

        <div className="project-name-input-group">
          <label htmlFor="project-name-field" className="input-field-label">
            Project Title:
          </label>
          <input
            id="project-name-field"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. MHA Vigilantes Season 2"
            className="studio-text-input"
          />
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="step-error-banner">
          <AlertCircle size={16} className="error-banner-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* 3D Holographic Script Scanner Showcase Banner */}
      <div className="dubbing-hero-showcase-banner script-scanner-hero-card">
        <div className="dubbing-banner-text-col">
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.2rem 0.55rem',
              borderRadius: '4px',
              background: 'var(--voxora-gradient)',
              color: '#ffffff',
              display: 'inline-block',
              marginBottom: '0.45rem',
            }}
          >
            Neural Document Scanner
          </span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '0.3rem' }}>
            Instant Anime Script Parsing & Dialogue Extraction
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Upload raw PDF, Word DOCX, or TXT manuscripts. VOXORA automatically detects episode boundaries, filters narrator dialogue, and partitions scripts into optimal narration chunks.
          </p>
        </div>
        <div className="dubbing-hero-img-wrap">
          <img
            src="/assets/voxora-script-scanner.jpg"
            alt="VOXORA 3D Script Scanner"
            className="dubbing-hero-img"
          />
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        className={`upload-dropzone ${isDragging ? 'drag-active' : ''} ${isExtracting ? 'extracting' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isExtracting && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {isExtracting ? (
          <div className="dropzone-loading-content">
            <Loader2 size={36} className="spinning-sync-icon" />
            <h3 className="dropzone-title">Extracting Complete Script...</h3>
            <p className="dropzone-subtitle">
              Parsing document structure, detecting episode boundaries, and running chunk validation.
            </p>
          </div>
        ) : (
          <div className="dropzone-idle-content">
            <div className="dropzone-icon-circle">
              <UploadCloud size={30} />
            </div>
            <h3 className="dropzone-title">
              Click to browse or drag & drop script here
            </h3>
            <p className="dropzone-subtitle">
              Supports <strong>PDF</strong>, <strong>DOCX</strong>, and <strong>TXT</strong> files of any length.
            </p>
            <div className="dropzone-format-tags">
              <span className="format-tag">.PDF</span>
              <span className="format-tag">.DOCX</span>
              <span className="format-tag">.TXT</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Sample Button */}
      {!metadata && (
        <div className="sample-script-prompt">
          <span className="sample-prompt-text">Don't have a script file right now?</span>
          <button
            type="button"
            onClick={() =>
              handleProcessText(SAMPLE_ANIME_SCRIPT, 'Solo Leveling: Double Dungeon Arc')
            }
            className="load-sample-script-btn"
          >
            <Sparkles size={14} />
            <span>Load 2-Episode Anime Sample Script</span>
          </button>
        </div>
      )}

      {/* Extracted Metadata & Cost Projections */}
      {metadata && (
        <div className="extracted-metadata-deck">
          <div className="deck-header-row">
            <div className="deck-title-group">
              <FileCheck size={18} className="deck-icon" />
              <h3 className="deck-title">Script Analysis & Cost Estimation</h3>
              <span className="file-pill">{metadata.fileName}</span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="change-file-btn"
            >
              Replace File
            </button>
          </div>

          {/* 4 Stat Cards */}
          <div className="stats-metric-grid">
            <div className="metric-card">
              <div className="metric-header">
                <Layers size={14} />
                <span>Episodes / Sections</span>
              </div>
              <div className="metric-value">
                {metadata.detectedEpisodes.length}
                <span className="metric-unit">
                  {metadata.detectedEpisodes.length === 1 ? 'Episode' : 'Episodes'}
                </span>
              </div>
              <p className="metric-subtext">
                {chunks.length} smart narrative chunks
              </p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <FileText size={14} />
                <span>Total Content</span>
              </div>
              <div className="metric-value">
                {metadata.totalCharacters.toLocaleString()}
                <span className="metric-unit">chars</span>
              </div>
              <p className="metric-subtext">
                ~{metadata.totalWords.toLocaleString()} words extracted
              </p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <Clock size={14} />
                <span>Est. Voiceover Time</span>
              </div>
              <div className="metric-value">
                ~{metadata.estDurationMinutes}
                <span className="metric-unit">min</span>
              </div>
              <p className="metric-subtext">Based on 140 WPM narration</p>
            </div>

            <div className="metric-card cost-highlight-card">
              <div className="metric-header">
                <Coins size={14} />
                <span>Estimated Cost</span>
              </div>
              <div className="metric-value">
                ₹{metadata.estTranslationCostINR + metadata.estTTSCostINR}
                <span className="metric-unit">
                  (~${(metadata.estTranslationCostUSD + metadata.estTTSCostUSD).toFixed(3)})
                </span>
              </div>
              <p className="metric-subtext">
                Translation: ₹{metadata.estTranslationCostINR} • TTS: ₹{metadata.estTTSCostINR}
              </p>
            </div>
          </div>

          {/* Detected Episode Selector & Preview */}
          <div className="episode-preview-section">
            <div className="episode-tabs-header">
              <div className="tabs-title">
                <BookOpen size={14} />
                <span>Detected Episodes & Sections ({metadata.detectedEpisodes.length}):</span>
              </div>
              <div className="episode-pill-list">
                {metadata.detectedEpisodes.map((ep, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedEpisodeIdx(idx)}
                    className={`episode-tab-pill ${selectedEpisodeIdx === idx ? 'active' : ''}`}
                  >
                    <span>{ep.title}</span>
                    <span className="pill-chars">{ep.charCount.toLocaleString()} ch</span>
                  </button>
                ))}
              </div>
            </div>

            {currentEp && (
              <div className="episode-content-preview-box">
                <div className="box-top-meta">
                  <span className="box-title">{currentEp.title}</span>
                  <span className="box-stats">
                    {currentEp.charCount.toLocaleString()} characters • {currentEp.wordCount.toLocaleString()} words •{' '}
                    {chunks.filter((c) => c.episodeNumber === currentEp.episodeNumber).length} chunks
                  </span>
                </div>
                <div className="box-text-scroll">
                  <pre className="script-preview-pre">{currentEp.text}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <div className="step-cta-row">
            <button
              type="button"
              id="start-translation-btn"
              onClick={handleProceed}
              className="studio-generate-btn primary-workflow-cta"
            >
              <span>Proceed to AI Translation</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
