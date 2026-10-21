'use client';

import React from 'react';
import { TTSProvider } from '@/lib/types';
import {
  History,
  Play,
  Pause,
  Download,
  Trash2,
  Volume2,
  Sparkles,
  Layers,
} from 'lucide-react';

export interface AudioTake {
  id: string;
  timestamp: string;
  provider: TTSProvider;
  model: string;
  speaker: string;
  pace?: number;
  stylePreset?: string;
  snippet: string;
  audioBase64: string;
  durationFormatted?: string;
}

interface TakesHistoryProps {
  takes: AudioTake[];
  activeTakeId?: string;
  onSelectTake: (take: AudioTake) => void;
  onDeleteTake: (takeId: string) => void;
  onClearTakes: () => void;
}

export const TakesHistory: React.FC<TakesHistoryProps> = ({
  takes,
  activeTakeId,
  onSelectTake,
  onDeleteTake,
  onClearTakes,
}) => {
  if (takes.length === 0) return null;

  const handleDownloadTake = (take: AudioTake, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = `data:audio/wav;base64,${take.audioBase64}`;
    const cleanSnippet = (take.snippet || '')
      .replace(/[^\w\s]/gi, '')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join('_') || 'Take';
    const dateTag = new Date().toISOString().slice(0, 10);
    const providerTag = 'Gemini';
    link.download = `VOXORA_${providerTag}_${take.speaker}_${cleanSnippet}_${dateTag}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="takes-history-container">
      <div className="takes-history-header">
        <div className="takes-title-group">
          <History size={14} className="takes-icon" />
          <span className="takes-title">Generation History</span>
          <span className="takes-count-pill">{takes.length}</span>
        </div>
        <button
          type="button"
          onClick={onClearTakes}
          className="clear-takes-btn"
          title="Clear session takes history"
        >
          <Trash2 size={12} />
          <span>Clear All</span>
        </button>
      </div>

      <div className="takes-list">
        {takes.map((take, index) => {
          const isActive = take.id === activeTakeId;
          const isGoogle = take.provider === 'google';

          return (
            <div
              key={take.id}
              onClick={() => onSelectTake(take)}
              className={`take-row-item ${isActive ? 'active' : ''}`}
            >
              <div className="take-left-group">
                <span className="take-number">#{takes.length - index}</span>
                <div className="take-avatar gemini">
                  {take.speaker.slice(0, 2).toUpperCase()}
                </div>
                <div className="take-meta-col">
                  <div className="take-headline">
                    <span className="take-speaker-name">{take.speaker}</span>
                    <span className="take-engine-tag gemini">Gemini</span>
                    {take.stylePreset && (
                      <span className="take-style-tag">{take.stylePreset}</span>
                    )}
                    {take.pace && (
                      <span className="take-pace-tag">{take.pace.toFixed(2)}x</span>
                    )}
                  </div>
                  <p className="take-snippet-text">"{take.snippet}"</p>
                </div>
              </div>

              <div className="take-actions-right">
                <button
                  type="button"
                  onClick={(e) => handleDownloadTake(take, e)}
                  className="take-action-btn download"
                  title="Download WAV"
                >
                  <Download size={13} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTake(take.id);
                  }}
                  className="take-action-btn delete"
                  title="Delete take"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
