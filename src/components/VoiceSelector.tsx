'use client';

import React, { useState, useMemo } from 'react';
import { VoiceInfo } from '@/lib/types';
import { Check, Volume2, Search, X } from 'lucide-react';

interface VoiceSelectorProps {
  title?: string;
  voices: VoiceInfo[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  disabled?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  title = 'Select Voice',
  voices,
  selectedVoice,
  onSelectVoice,
  disabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');

  const currentVoice =
    voices.find((v) => v.id.toLowerCase() === selectedVoice.toLowerCase()) ||
    voices[0];

  const filteredVoices = useMemo(() => {
    return voices.filter((v) => {
      const matchesSearch =
        !searchQuery.trim() ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        v.tagline.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        v.recommendedFor.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchesGender =
        genderFilter === 'All' || v.gender.toLowerCase() === genderFilter.toLowerCase();

      return matchesSearch && matchesGender;
    });
  }, [voices, searchQuery, genderFilter]);

  const maleCount = useMemo(() => voices.filter((v) => v.gender === 'Male').length, [voices]);
  const femaleCount = useMemo(() => voices.filter((v) => v.gender === 'Female').length, [voices]);

  const hasManyVoices = voices.length > 4;

  return (
    <div className="control-section voice-selector-section">
      <div className="section-header">
        <label className="control-label">
          {title} {hasManyVoices ? `(${voices.length})` : ''}
        </label>
        <span className="rack-value-pill">
          {currentVoice?.name} • {currentVoice?.gender}
        </span>
      </div>

      {hasManyVoices && (
        <div className="voice-filter-toolbar">
          {/* Search box */}
          <div className="voice-search-box">
            <Search size={13} className="voice-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 30 studio voices..."
              className="voice-search-input"
              disabled={disabled}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="voice-search-clear"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Gender Filter Chips */}
          <div className="voice-gender-chips">
            <button
              type="button"
              onClick={() => setGenderFilter('All')}
              className={`gender-filter-chip ${genderFilter === 'All' ? 'active' : ''}`}
            >
              All ({voices.length})
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('Male')}
              className={`gender-filter-chip ${genderFilter === 'Male' ? 'active' : ''}`}
            >
              Male ({maleCount})
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('Female')}
              className={`gender-filter-chip ${genderFilter === 'Female' ? 'active' : ''}`}
            >
              Female ({femaleCount})
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Voice Cards List */}
      <div className="voice-list" role="radiogroup" aria-label={title}>
        {filteredVoices.length > 0 ? (
          filteredVoices.map((voice) => {
            const isSelected = selectedVoice.toLowerCase() === voice.id.toLowerCase();
            const isMale = voice.gender === 'Male';

            return (
              <button
                key={voice.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => onSelectVoice(voice.id)}
                className={`voice-row-card ${isSelected ? 'active' : ''}`}
              >
                <div className="voice-row-left">
                  <div className={`voice-avatar-badge ${isMale ? 'male' : 'female'}`}>
                    {voice.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="voice-text-meta">
                    <div className="voice-headline-row">
                      <span className="voice-title">{voice.name}</span>
                      <span className={`voice-gender-tag ${isMale ? 'male' : 'female'}`}>
                        {voice.gender}
                      </span>
                      {voice.isDefault && (
                        <span className="voice-badge-default">DEFAULT</span>
                      )}
                    </div>
                    <span className="voice-caption">{voice.tagline}</span>
                  </div>
                </div>

                <div className="voice-row-right">
                  {isSelected && (
                    <div className="voice-playing-icon" title="Active voice">
                      <Volume2 size={13} className="sound-wave-icon" />
                    </div>
                  )}
                  <div className={`voice-radio-dot ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <Check size={11} strokeWidth={3} />}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="no-voices-match">
            <span>No voices match "{searchQuery}"</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setGenderFilter('All');
              }}
              className="reset-filter-btn"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
