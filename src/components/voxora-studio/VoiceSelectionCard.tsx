'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Play, Pause, Search, Volume2 } from 'lucide-react';
import { CHARACTER_VOICES, CharacterVoice } from '@/lib/characterVoices';

interface VoiceSelectionCardProps {
  selectedVoice: CharacterVoice;
  onSelectVoice: (voice: CharacterVoice) => void;
  onNext: () => void;
  onBack: () => void;
}

const CATEGORIES = ['All', 'Anime', 'Narration', 'Expressive', 'Young'] as const;

export const VoiceSelectionCard: React.FC<VoiceSelectionCardProps> = ({
  selectedVoice,
  onSelectVoice,
  onNext,
  onBack,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const filteredVoices = CHARACTER_VOICES.filter((voice) => {
    const matchesCategory =
      activeCategory === 'All' ||
      voice.category === activeCategory ||
      voice.tags.includes(activeCategory);

    const matchesSearch =
      voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voice.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const handleTogglePreview = (e: React.MouseEvent, voice: CharacterVoice) => {
    e.stopPropagation();

    if (previewingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPreviewingVoiceId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const previewUrl = `/assets/previews/preview-${voice.id}.wav`;
    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    setPreviewingVoiceId(voice.id);

    audio.onended = () => {
      setPreviewingVoiceId(null);
    };

    audio.onerror = () => {
      setPreviewingVoiceId(null);
    };

    audio.play().catch((err) => {
      console.warn('Audio preview play error:', err);
      setPreviewingVoiceId(null);
    });
  };

  return (
    <div className="saas-wizard-box">
      {/* Top Header */}
      <div className="wizard-top-header">
        <div className="wizard-brand-tag">
          <img
            src="/voxora-logo.png"
            alt="VOXORA"
            style={{ height: '24px', width: 'auto' }}
          />
        </div>
        <button type="button" className="wizard-back-btn" onClick={onBack}>
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      <h2 className="wizard-heading">Choose Your Voice</h2>
      <p className="wizard-subhead">
        Pick from our diverse range of AI voices. Preview and select the one that fits your style.
      </p>

      {/* Filter Chips & Search Bar */}
      <div className="voice-filters-header-row">
        <div className="voice-filter-chips-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="voice-search-box-wrap">
          <Search size={14} className="voice-search-icon" />
          <input
            type="text"
            placeholder="Search voice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="voice-search-input"
          />
        </div>
      </div>

      {/* Voice List Cards */}
      <div className="voice-list-stack">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoice.id === voice.id;
          const isPlaying = previewingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              className={`voice-row-card ${isSelected ? 'selected' : ''} ${isPlaying ? 'preview-playing' : ''}`}
              onClick={() => onSelectVoice(voice)}
            >
              <div className="voice-card-left">
                <img
                  src={voice.avatar}
                  alt={voice.name}
                  className="voice-avatar-circle"
                />
                <div>
                  <h4 className="voice-meta-name">{voice.name}</h4>
                  <p className="voice-meta-tags">
                    {isPlaying ? (
                      <span style={{ color: '#0066ff', fontWeight: 600 }}>
                        ● Playing: &ldquo;{voice.sampleText.slice(0, 36)}...&rdquo;
                      </span>
                    ) : (
                      voice.tags.join(' • ')
                    )}
                  </p>
                </div>
              </div>

              <div className="voice-card-right">
                <button
                  type="button"
                  className={`voice-preview-btn ${isPlaying ? 'playing' : ''}`}
                  onClick={(e) => handleTogglePreview(e, voice)}
                  aria-label={`Preview ${voice.name}`}
                  title={isPlaying ? `Pause ${voice.name}` : `Listen to ${voice.name} anime voice`}
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: 2 }} />}
                </button>

                <div className="voice-radio-circle">
                  {isSelected && <div className="voice-radio-inner" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA Button */}
      <button
        type="button"
        className="saas-btn-vibrant-blue"
        onClick={onNext}
      >
        <span>Next</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};
