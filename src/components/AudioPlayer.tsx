'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Radio,
  FileAudio,
} from 'lucide-react';
import { TTSProvider, GOOGLE_VOICES } from '@/lib/types';

interface AudioPlayerProps {
  base64Audio: string;
  provider?: TTSProvider;
  model?: string;
  speaker: string;
  pace?: number;
  stylePreset?: string;
  scriptSnippet: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  base64Audio,
  provider = 'google',
  model,
  speaker,
  pace,
  stylePreset,
  scriptSnippet,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const speakerInfo = GOOGLE_VOICES.find(
    (s) => s.id.toLowerCase() === speaker.toLowerCase()
  );

  const audioSrc = `data:audio/wav;base64,${base64Audio}`;

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [base64Audio]);

  const togglePlay = useCallback(() => {
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
  }, [isPlaying]);

  const handleReplay = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => console.error('Audio replay error:', err));
  }, []);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = audioSrc;
    const cleanSlug = (scriptSnippet || '')
      .replace(/[^\w\s]/gi, '')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join('_') || 'Take';
    const dateTag = new Date().toISOString().slice(0, 10);
    const timeTag = new Date().toTimeString().slice(0, 5).replace(':', '');
    const providerTag = 'Gemini';
    link.download = `VOXORA_${providerTag}_${speaker}_${cleanSlug}_${dateTag}_${timeTag}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player-card gemini-card">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Track info bar */}
      <div className="player-top-row">
        <div className="player-track-info">
          <div className="player-status-dot-wrap">
            <span className={`player-live-dot ${isPlaying ? 'playing' : ''}`} />
          </div>
          <div className="player-titles">
            <div className="player-voice-headline">
              <span className="player-speaker-name">{speakerInfo?.name || speaker}</span>
              <span className="player-gender-tag">{speakerInfo?.gender || 'Voice'}</span>
              <span className="player-engine-tag">
                {model?.includes('flash-lite')
                  ? 'Gemini 3.8 Flash-Lite'
                  : model?.includes('flash-tts')
                  ? 'Gemini 3.8 Flash Studio'
                  : model?.includes('3.1')
                  ? 'Gemini 3.1 Flash'
                  : 'Gemini 2.5 Flash'}
              </span>
            </div>
            <span className="player-setting-caption">
              Style: {stylePreset || 'Normal'}
            </span>
          </div>
        </div>

        <div className="player-right-stats">
          <span className="player-format-chip">
            <FileAudio size={12} />
            24kHz WAV
          </span>
          <span className="player-time-readout">
            <span className="current-time">{formatTime(currentTime)}</span>
            <span className="time-sep">/</span>
            <span className="total-time">{formatTime(duration)}</span>
          </span>
        </div>
      </div>

      {/* Waveform Visualization Canvas */}
      <div className="waveform-container" onClick={togglePlay} title="Click to play / pause">
        <div className="waveform-bar-strip">
          {Array.from({ length: 36 }).map((_, i) => {
            const heightPercent = 20 + Math.sin(i * 0.45) * 45 + (i % 4) * 10;
            const isPlayed = (i / 36) * 100 <= progressPercent;
            return (
              <span
                key={i}
                className={`daw-wave-bar ${isPlaying ? 'active' : ''} ${isPlayed ? 'played' : ''}`}
                style={{
                  height: `${Math.max(16, Math.min(96, heightPercent))}%`,
                  animationDelay: `${(i % 6) * 0.12}s`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Scrub Timeline */}
      <div
        className="scrub-timeline-track"
        ref={progressBarRef}
        onClick={handleSeek}
        role="slider"
        aria-label="Audio scrubber"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration || 1}
      >
        <div className="scrub-rail">
          <div className="scrub-fill" style={{ width: `${progressPercent}%` }}>
            <div className="scrub-handle" />
          </div>
        </div>
      </div>

      {/* Bottom Transport Controls */}
      <div className="transport-controls-row">
        <div className="playback-btns">
          <button
            type="button"
            onClick={togglePlay}
            className={`daw-play-btn ${isPlaying ? 'playing' : ''}`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} className="play-icon-offset" />}
          </button>

          <button
            type="button"
            onClick={handleReplay}
            className="daw-replay-btn"
            aria-label="Replay from start"
            title="Replay from start"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Volume & Mute */}
        <div className="daw-volume-group">
          <button
            type="button"
            onClick={toggleMute}
            className="daw-mute-btn"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="daw-volume-slider"
            aria-label="Volume slider"
          />
        </div>

        {/* Download Action */}
        <button
          type="button"
          onClick={handleDownload}
          className="daw-download-btn"
          title="Download master WAV audio file"
        >
          <Download size={14} />
          <span>Download Audio (.wav)</span>
        </button>
      </div>

      {scriptSnippet && (
        <div className="daw-script-snippet">
          <span className="snippet-caption">Script Take:</span>
          <p className="snippet-quote">"{scriptSnippet}"</p>
        </div>
      )}
    </div>
  );
};
