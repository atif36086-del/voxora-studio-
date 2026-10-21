'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  FileText,
  FileCheck,
  Disc3,
  Archive,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import {
  WorkflowChunk,
  DetectedEpisode,
  WorkflowProject,
} from '@/lib/types';
import {
  buildFormattedHinglishText,
  generateScriptPdfBlob,
  triggerFileDownload,
  downloadMasterZipBundle,
} from '@/lib/exportBundle';
import { generateSrtContent, downloadSrtFile } from '@/lib/subtitles';

interface MasterExportStepProps {
  project: WorkflowProject;
  onBackToEdit: () => void;
  onStartNewProject: () => void;
}

export const MasterExportStep: React.FC<MasterExportStepProps> = ({
  project,
  onBackToEdit,
  onStartNewProject,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(
    project.finalAudio?.durationSec || 0
  );
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [srtDownloaded, setSrtDownloaded] = useState<boolean>(false);

  const finalAudio = project.finalAudio;
  const audioSrc = finalAudio?.mp3Url
    ? finalAudio.mp3Url
    : finalAudio?.wavUrl
    ? finalAudio.wavUrl
    : finalAudio?.mp3Base64
    ? `data:audio/mp3;base64,${finalAudio.mp3Base64}`
    : finalAudio?.wavBase64
    ? `data:audio/wav;base64,${finalAudio.wavBase64}`
    : '';

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [audioSrc]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Audio play error:', err));
    }
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => console.error('Replay error:', err));
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || project.finalAudio?.durationSec || 0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Download handlers
  const handleDownloadTxt = () => {
    const text = buildFormattedHinglishText(
      project.name,
      project.metadata.detectedEpisodes,
      project.chunks
    );
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const cleanName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'VOXORA';
    triggerFileDownload(blob, `${cleanName}_Hinglish_Script.txt`);
  };

  const handleDownloadPdf = () => {
    const blob = generateScriptPdfBlob(
      project.name,
      project.metadata.detectedEpisodes,
      project.chunks
    );
    const cleanName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'VOXORA';
    triggerFileDownload(blob, `${cleanName}_Hinglish_Script.pdf`, 'application/pdf');
  };

  const handleDownloadMp3 = () => {
    const cleanName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'VOXORA';
    if (finalAudio?.mp3Url) {
      const link = document.createElement('a');
      link.href = `${finalAudio.mp3Url}&download=1`;
      link.download = `${cleanName}_Final_Voiceover.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    if (!finalAudio?.mp3Base64) return;
    triggerFileDownload(
      finalAudio.mp3Base64,
      `${cleanName}_Final_Voiceover.mp3`,
      'audio/mp3'
    );
  };

  const handleDownloadWav = () => {
    const cleanName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'VOXORA';
    if (finalAudio?.wavUrl) {
      const link = document.createElement('a');
      link.href = `${finalAudio.wavUrl}&download=1`;
      link.download = `${cleanName}_Final_Voiceover.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    if (!finalAudio?.wavBase64) return;
    triggerFileDownload(
      finalAudio.wavBase64,
      `${cleanName}_Final_Voiceover.wav`,
      'audio/wav'
    );
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      await downloadMasterZipBundle(
        project.name,
        project.metadata.detectedEpisodes,
        project.chunks,
        finalAudio?.mp3Base64,
        finalAudio?.wavBase64,
        finalAudio?.mp3Url,
        finalAudio?.wavUrl
      );
    } catch (err) {
      console.error('ZIP generation error:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSrt = () => {
    const fullText = project.chunks
      .map((c) => (c.translatedText || c.originalText || '').trim())
      .filter((t) => t.length > 0)
      .join('\n\n');

    if (!fullText) return;
    const srtContent = generateSrtContent(fullText, duration || 60);
    downloadSrtFile(project.name, srtContent);
    setSrtDownloaded(true);
    setTimeout(() => setSrtDownloaded(false), 3000);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="export-step-container">
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          preload="auto"
        />
      )}

      {/* Top Banner */}
      <div className="export-header-row">
        <div className="header-info-group">
          <div className="success-tag-pill">
            <CheckCircle2 size={14} />
            <span>Master Production Complete</span>
          </div>
          <h2 className="step-main-heading">{project.name}</h2>
          <p className="step-sub-desc">
            All anime script chunks have been translated into Roman Hinglish, quality verified, voiced by your TTS engine, and merged in sequential order.
          </p>
        </div>

        <div className="header-actions-group">
          <button
            type="button"
            onClick={onBackToEdit}
            className="back-btn"
          >
            <ArrowLeft size={14} />
            <span>Edit Script</span>
          </button>
          <button
            type="button"
            onClick={onStartNewProject}
            className="new-project-btn"
          >
            <Sparkles size={14} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* 3D Master Mixing Console Showcase Banner */}
      <div className="dubbing-hero-showcase-banner master-console-hero-banner">
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
            Digital Audio Mastering & Export
          </span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '0.3rem' }}>
            Seamless Chunk Stitching & Studio Lossless Export
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            All narration chunks seamlessly concatenated without gaps or pops. Export production-ready high-bitrate MP3 or lossless broadcast WAV files ready for CapCut, Premiere Pro, and YouTube.
          </p>
        </div>
        <div className="dubbing-hero-img-wrap">
          <img
            src="/assets/voxora-master-console.jpg"
            alt="VOXORA 3D Master Console"
            className="dubbing-hero-img"
          />
        </div>
      </div>

      {/* Master Audio Player Card */}
      {audioSrc ? (
        <div className="master-player-card">
          <div className="master-player-header">
            <div className="player-meta-left">
              <span className="live-pulse-dot" />
              <div className="track-titles">
                <span className="master-title">{project.name} • Master Audio</span>
                <span className="master-engine">
                  Engine: Google Gemini TTS • Voice: {project.settings.ttsVoice || 'Puck'}
                </span>
              </div>
            </div>

            <div className="player-meta-right">
              <span className="spec-tag">
                <Disc3 size={12} />
                {finalAudio?.mp3Url || finalAudio?.mp3Base64 ? 'Master MP3 + WAV' : 'Master WAV'}
              </span>
              <span className="time-badge">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Waveform graphic */}
          <div
            className="master-waveform-canvas"
            onClick={togglePlay}
            title="Click to play / pause master audio"
          >
            {Array.from({ length: 48 }).map((_, i) => {
              const height = 25 + Math.sin(i * 0.35) * 45 + (i % 5) * 8;
              const isPlayed = (i / 48) * 100 <= progressPercent;
              return (
                <span
                  key={i}
                  className={`master-wave-bar ${isPlaying ? 'animating' : ''} ${isPlayed ? 'played' : ''}`}
                  style={{
                    height: `${Math.max(18, Math.min(95, height))}%`,
                    animationDelay: `${(i % 8) * 0.1}s`,
                  }}
                />
              );
            })}
          </div>

          {/* Scrubber */}
          <div
            className="master-scrub-rail"
            ref={progressBarRef}
            onClick={handleSeek}
          >
            <div className="scrub-fill" style={{ width: `${progressPercent}%` }}>
              <div className="scrub-head" />
            </div>
          </div>

          {/* Transport Controls */}
          <div className="master-transport-bar">
            <div className="transport-left-buttons">
              <button
                type="button"
                onClick={togglePlay}
                className={`master-play-btn ${isPlaying ? 'playing' : ''}`}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="play-icon-offset" />}
              </button>
              <button
                type="button"
                onClick={handleReplay}
                className="master-replay-btn"
                title="Replay from beginning"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            <div className="master-volume-group">
              <button
                type="button"
                onClick={() => {
                  if (!audioRef.current) return;
                  if (isMuted) {
                    audioRef.current.muted = false;
                    setIsMuted(false);
                  } else {
                    audioRef.current.muted = true;
                    setIsMuted(true);
                  }
                }}
                className="volume-mute-btn"
              >
                {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (audioRef.current) {
                    audioRef.current.volume = val;
                    setIsMuted(val === 0);
                  }
                }}
                className="volume-slider"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="no-audio-notice-card">
          <p>Audio merging was not completed yet. You can still export the translated Hinglish script below.</p>
        </div>
      )}

      {/* Export Options Hub */}
      <div className="export-hub-grid">
        {/* Full ZIP Master Bundle */}
        <div className="export-card primary-bundle-card">
          <div className="card-badge">RECOMMENDED FOR YOUTUBE</div>
          <div className="card-icon-circle">
            <Archive size={26} />
          </div>
          <h3 className="export-card-title">Download Master ZIP Bundle</h3>
          <p className="export-card-desc">
            Get the full production package in 1 download: translated Hinglish script (.txt), formatted script PDF (.pdf), and final complete MP3 audio (.mp3).
          </p>
          <button
            type="button"
            id="download-zip-btn"
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="export-action-btn primary-bundle-btn"
          >
            <Download size={15} />
            <span>{isZipping ? 'Packaging ZIP...' : 'Download Complete ZIP (.zip)'}</span>
          </button>
        </div>

        {/* Master MP3 Audio */}
        <div className="export-card">
          <div className="card-icon-circle">
            <Disc3 size={24} />
          </div>
          <h3 className="export-card-title">Master MP3 Audio</h3>
          <p className="export-card-desc">
            Complete high-fidelity merged MP3 audio file (192kbps), ready for your video editor (Premiere, DaVinci, CapCut).
          </p>
          <button
            type="button"
            id="download-mp3-btn"
            onClick={handleDownloadMp3}
            disabled={!finalAudio?.mp3Base64 && !finalAudio?.mp3Url}
            className="export-action-btn"
          >
            <Download size={15} />
            <span>Download Final Audio (.mp3)</span>
          </button>
        </div>

        {/* Master WAV Audio */}
        <div className="export-card">
          <div className="card-icon-circle">
            <Disc3 size={24} />
          </div>
          <h3 className="export-card-title">Master WAV Audio</h3>
          <p className="export-card-desc">
            Uncompressed studio master RIFF WAV audio (24kHz / 22kHz, 16-bit Mono PCM) with zero compression artifacts.
          </p>
          <button
            type="button"
            id="download-wav-btn"
            onClick={handleDownloadWav}
            disabled={!finalAudio?.wavBase64 && !finalAudio?.wavUrl}
            className="export-action-btn"
          >
            <Download size={15} />
            <span>Download Final Audio (.wav)</span>
          </button>
        </div>

        {/* Formatted Script PDF */}
        <div className="export-card">
          <div className="card-icon-circle">
            <FileCheck size={24} />
          </div>
          <h3 className="export-card-title">Formatted Script PDF</h3>
          <p className="export-card-desc">
            Formatted multi-page PDF with episode banners, scene chunks, and clean reading typography for teleprompters.
          </p>
          <button
            type="button"
            id="download-pdf-btn"
            onClick={handleDownloadPdf}
            className="export-action-btn"
          >
            <Download size={15} />
            <span>Download Script (.pdf)</span>
          </button>
        </div>

        {/* Plain Text Hinglish Script */}
        <div className="export-card">
          <div className="card-icon-circle">
            <FileText size={24} />
          </div>
          <h3 className="export-card-title">Hinglish Script (.txt)</h3>
          <p className="export-card-desc">
            Standard UTF-8 text file containing the entire translated Roman Hinglish script partitioned by episode.
          </p>
          <button
            type="button"
            id="download-txt-btn"
            onClick={handleDownloadTxt}
            className="export-action-btn"
          >
            <Download size={15} />
            <span>Download Script (.txt)</span>
          </button>
        </div>

        {/* 1-Click Synced Subtitles (.srt) */}
        <div className="export-card">
          <div className="card-icon-circle" style={{ background: '#eff6ff', color: '#0066ff' }}>
            <FileText size={24} />
          </div>
          <h3 className="export-card-title">Synced Subtitles (.srt)</h3>
          <p className="export-card-desc">
            Frame-accurate synchronized captions (.SRT) ready for instant drag-and-drop into CapCut, Premiere Pro, and DaVinci Resolve.
          </p>
          <button
            type="button"
            id="download-srt-btn"
            onClick={handleDownloadSrt}
            className="export-action-btn"
            style={{
              background: srtDownloaded ? '#10b981' : undefined,
              borderColor: srtDownloaded ? '#10b981' : undefined,
              color: srtDownloaded ? '#ffffff' : undefined,
            }}
          >
            {srtDownloaded ? (
              <>
                <CheckCircle2 size={15} />
                <span>Subtitles Downloaded (.srt)!</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Download Subtitles (.srt)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
