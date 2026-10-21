'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  Gauge,
  Sliders,
  Sparkles,
  Music,
  PlusCircle,
  FileCheck,
  FileText,
  CheckCircle2,
  Volume2,
  Loader2,
} from 'lucide-react';
import { CharacterVoice } from '@/lib/characterVoices';
import { BGM_TRACKS, mixVoiceWithBgm } from '@/lib/bgmMixer';
import { generateSrtContent, downloadSrtFile } from '@/lib/subtitles';

interface ProjectEditorCardProps {
  projectTitle: string;
  onUpdateTitle: (title: string) => void;
  voice: CharacterVoice;
  audioBase64: string | null;
  scriptText: string;
  onCreateNew: () => void;
}

export const ProjectEditorCard: React.FC<ProjectEditorCardProps> = ({
  projectTitle,
  onUpdateTitle,
  voice,
  audioBase64,
  scriptText,
  onCreateNew,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(42); // default 42s display if empty
  const [exportFormat, setExportFormat] = useState<'mp3' | 'wav'>('mp3');

  // Sliders
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0);
  const [stability, setStability] = useState<number>(70);
  const [style, setStyle] = useState<string>('Normal');

  // BGM & Subtitles states
  const [selectedBgm, setSelectedBgm] = useState<string>('none');
  const [bgmVolume, setBgmVolume] = useState<number>(0.25);
  const [autoDucking, setAutoDucking] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [srtDownloaded, setSrtDownloaded] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Manage Voiceover Audio setup
  useEffect(() => {
    if (audioBase64) {
      const audioUrl = audioBase64.startsWith('data:')
        ? audioBase64
        : `data:audio/wav;base64,${audioBase64}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(Math.floor(audio.duration));
        }
      };

      audio.ontimeupdate = () => {
        setCurrentTime(Math.floor(audio.currentTime));
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (bgmAudioRef.current) {
          bgmAudioRef.current.pause();
          bgmAudioRef.current.currentTime = 0;
        }
      };

      return () => {
        audio.pause();
        if (bgmAudioRef.current) {
          bgmAudioRef.current.pause();
        }
      };
    }
  }, [audioBase64]);

  // Manage BGM track switching and volume
  useEffect(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      bgmAudioRef.current = null;
    }
    const track = BGM_TRACKS.find((b) => b.id === selectedBgm);
    if (track && track.url) {
      const bgmAudio = new Audio(track.url);
      bgmAudio.loop = true;
      bgmAudio.volume = isPlaying && autoDucking ? bgmVolume * 0.45 : bgmVolume;
      bgmAudioRef.current = bgmAudio;
      if (isPlaying) {
        bgmAudio.play().catch(console.error);
      }
    }
    return () => {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
      }
    };
  }, [selectedBgm, bgmVolume, autoDucking, isPlaying]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = speed;
      audioRef.current.play().catch(console.error);
      if (bgmAudioRef.current) {
        bgmAudioRef.current.volume = autoDucking ? bgmVolume * 0.45 : bgmVolume;
        bgmAudioRef.current.play().catch(console.error);
      }
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleExportDownload = async () => {
    if (!audioBase64) return;
    setIsExporting(true);
    try {
      if (selectedBgm !== 'none') {
        // Render master with BGM & auto-ducking!
        const mixedBlob = await mixVoiceWithBgm(
          audioBase64,
          selectedBgm,
          bgmVolume,
          autoDucking
        );
        const url = URL.createObjectURL(mixedBlob);
        const link = document.createElement('a');
        link.href = url;
        const bgmName = selectedBgm.replace(/[^a-z0-9]/g, '_');
        link.download = `${projectTitle.toLowerCase().replace(/\s+/g, '_')}_master_${bgmName}.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const link = document.createElement('a');
        link.href = audioBase64.startsWith('data:')
          ? audioBase64
          : `data:audio/wav;base64,${audioBase64}`;
        link.download = `${projectTitle.toLowerCase().replace(/\s+/g, '_')}_${voice.name.toLowerCase()}.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSrt = () => {
    if (!scriptText) return;
    const srtContent = generateSrtContent(scriptText, duration);
    downloadSrtFile(projectTitle, srtContent);
    setSrtDownloaded(true);
    setTimeout(() => setSrtDownloaded(false), 3000);
  };

  return (
    <div className="project-editor-container">
      {/* Top Header Bar */}
      <div className="project-editor-top-bar">
        <h2 className="project-title-heading">
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="project-title-input"
            aria-label="Project Title"
          />
          <span style={{ fontSize: '1.1rem', color: '#94a3b8', flexShrink: 0 }}>✏️</span>
        </h2>
        <span className="project-saved-time">Saved just now</span>
      </div>

      {/* Main Two-Card Studio Grid */}
      <div className="editor-cards-grid">
        {/* Left Card: Audio Player & Waveform Studio */}
        <div className="player-main-card">
          <div className="player-meta-row">
            <img
              src={voice.avatar}
              alt={voice.name}
              className="player-thumb-avatar"
            />
            <div>
              <h3 className="player-meta-title">Anime Script Voiceover</h3>
              <p className="player-meta-specs">
                {voice.name} • {formatTime(duration)} • 24kHz / 192 kbps
              </p>
            </div>
          </div>

          {/* Waveform Player Box */}
          <div className="player-waveform-box">
            <div className="waveform-time-row">
              <button
                type="button"
                className="waveform-play-circle-btn"
                onClick={togglePlayback}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
              </button>

              <div className="waveform-visual-track">
                {Array.from({ length: 48 }).map((_, i) => {
                  const progressFraction = currentTime / (duration || 1);
                  const isPast = i / 48 <= progressFraction;
                  const height = 12 + Math.sin(i * 0.35) * 18;
                  return (
                    <span
                      key={i}
                      className={`waveform-tick ${isPast ? 'active' : ''}`}
                      style={{ height: `${height}px` }}
                      onClick={() => {
                        if (audioRef.current && duration) {
                          const targetTime = (i / 48) * duration;
                          audioRef.current.currentTime = targetTime;
                          setCurrentTime(Math.floor(targetTime));
                        }
                      }}
                    />
                  );
                })}
              </div>

              <span className="waveform-time-counter">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Audio Controls Sliders Row */}
          <div className="audio-controls-row">
            {/* Speed */}
            <div className="control-item-col">
              <div className="control-item-label">
                <Gauge size={13} />
                <span>Speed</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="control-slider-input"
              />
              <span className="control-value-badge">{speed.toFixed(2)}x</span>
            </div>

            {/* Pitch */}
            <div className="control-item-col">
              <div className="control-item-label">
                <Sliders size={13} />
                <span>Pitch</span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={pitch}
                onChange={(e) => setPitch(parseInt(e.target.value))}
                className="control-slider-input"
              />
              <span className="control-value-badge">{pitch > 0 ? `+${pitch}%` : `${pitch}%`}</span>
            </div>

            {/* Stability */}
            <div className="control-item-col">
              <div className="control-item-label">
                <Sparkles size={13} />
                <span>Stability</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={stability}
                onChange={(e) => setStability(parseInt(e.target.value))}
                className="control-slider-input"
              />
              <span className="control-value-badge">{stability}%</span>
            </div>

            {/* Style */}
            <div className="control-item-col">
              <div className="control-item-label">
                <Music size={13} />
                <span>Style</span>
              </div>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '0.2rem 0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="Normal">Normal</option>
                <option value="Energetic">Energetic</option>
                <option value="Dramatic">Dramatic</option>
                <option value="Calm">Calm</option>
              </select>
              <span className="control-value-badge">{style}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Studio Master Export & BGM Panel */}
        <div className="export-panel-card">
          <h3 className="export-card-title">Studio Master & Export</h3>

          {/* Background Music (BGM) & Auto-Ducking Section */}
          <div className="bgm-selector-block" style={{ marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                <Music size={15} style={{ color: '#0066ff' }} />
                <span>Background Music (BGM)</span>
              </div>
              {selectedBgm !== 'none' && (
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '6px', background: '#eff6ff', color: '#0066ff', fontWeight: 600 }}>
                  Ready to Mix
                </span>
              )}
            </div>

            <select
              value={selectedBgm}
              onChange={(e) => setSelectedBgm(e.target.value)}
              className="bgm-track-select"
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '9px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#1e293b',
                outline: 'none',
                cursor: 'pointer',
                marginBottom: '0.75rem',
              }}
            >
              {BGM_TRACKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name} ({t.genre})
                </option>
              ))}
            </select>

            {selectedBgm !== 'none' && (
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {/* Volume slider */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>BGM Volume</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0066ff' }}>{Math.round(bgmVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#0066ff' }}
                />

                {/* Auto Ducking toggle */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sparkles size={13} style={{ color: '#0066ff' }} />
                    <span>Auto-Ducking (Smart Volume Drop)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoDucking}
                    onChange={(e) => setAutoDucking(e.target.checked)}
                    style={{ accentColor: '#0066ff', width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                </label>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#64748b', lineHeight: 1.3 }}>
                  Automatically lowers BGM during dialogue and raises it during pauses.
                </p>
              </div>
            )}
          </div>

          {/* Audio Format Selection */}
          <div className="export-format-options" style={{ marginBottom: '1rem' }}>
            <div
              className={`format-option-row ${exportFormat === 'mp3' ? 'selected' : ''}`}
              onClick={() => setExportFormat('mp3')}
            >
              <div className="format-option-left">
                <div className="format-badge-icon">MP3</div>
                <div>
                  <h4 className="format-name">MP3 Master</h4>
                  <p className="format-desc">Streaming Ready (192kbps)</p>
                </div>
              </div>
              <div className="voice-radio-circle">
                {exportFormat === 'mp3' && <div className="voice-radio-inner" />}
              </div>
            </div>

            <div
              className={`format-option-row ${exportFormat === 'wav' ? 'selected' : ''}`}
              onClick={() => setExportFormat('wav')}
            >
              <div className="format-option-left">
                <div className="format-badge-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                  WAV
                </div>
                <div>
                  <h4 className="format-name">WAV Master</h4>
                  <p className="format-desc">Lossless Studio PCM (24kHz)</p>
                </div>
              </div>
              <div className="voice-radio-circle">
                {exportFormat === 'wav' && <div className="voice-radio-inner" />}
              </div>
            </div>
          </div>

          {/* Download Action Buttons */}
          <button
            type="button"
            className="saas-btn-vibrant-blue"
            onClick={handleExportDownload}
            disabled={isExporting}
            style={{ marginBottom: '0.75rem', width: '100%' }}
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Mixing Audio & Exporting...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>{selectedBgm !== 'none' ? `Export Audio + BGM (${exportFormat.toUpperCase()})` : `Export Audio (${exportFormat.toUpperCase()})`}</span>
              </>
            )}
          </button>

          {/* 1-Click Auto .SRT Subtitles Export */}
          <button
            type="button"
            onClick={handleDownloadSrt}
            className="saas-btn-outline"
            style={{
              width: '100%',
              padding: '0.7rem 1.25rem',
              borderRadius: '9999px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#1e293b',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              transition: 'all 0.2s ease',
            }}
            title="Download synced subtitles for CapCut, Premiere Pro, or DaVinci Resolve"
          >
            {srtDownloaded ? (
              <>
                <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                <span style={{ color: '#10b981' }}>Subtitles Downloaded (.SRT)!</span>
              </>
            ) : (
              <>
                <FileText size={16} style={{ color: '#0066ff' }} />
                <span>Download Subtitles (.SRT)</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="saas-btn-text"
            style={{
              width: '100%',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              color: '#64748b',
            }}
            onClick={onCreateNew}
          >
            <PlusCircle size={14} />
            <span>Create New Voiceover</span>
          </button>
        </div>
      </div>
    </div>
  );
};
