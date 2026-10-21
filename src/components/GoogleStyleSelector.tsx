'use client';

import React from 'react';
import { GOOGLE_STYLE_PRESETS, GoogleStylePreset } from '@/lib/types';
import { Sparkles, MessageSquareQuote } from 'lucide-react';

interface GoogleStyleSelectorProps {
  selectedPreset: GoogleStylePreset;
  onSelectPreset: (preset: GoogleStylePreset) => void;
  disabled?: boolean;
}

export const GoogleStyleSelector: React.FC<GoogleStyleSelectorProps> = ({
  selectedPreset,
  onSelectPreset,
  disabled = false,
}) => {
  const currentPresetInfo =
    GOOGLE_STYLE_PRESETS.find((p) => p.id === selectedPreset) ||
    GOOGLE_STYLE_PRESETS[0];

  return (
    <div className="control-section google-style-section">
      <div className="section-header">
        <label className="control-label">Acting Style & Delivery</label>
        <span className="rack-value-pill">{selectedPreset}</span>
      </div>

      <div className="google-style-grid">
        {GOOGLE_STYLE_PRESETS.map((preset) => {
          const isSelected = selectedPreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPreset(preset.id)}
              className={`google-style-btn ${isSelected ? 'active' : ''}`}
            >
              <div className="style-btn-top">
                <span className="style-btn-name">{preset.name}</span>
                {isSelected && <Sparkles size={11} className="style-active-sparkle" />}
              </div>
              <span className="style-btn-desc">{preset.description}</span>
            </button>
          );
        })}
      </div>

      <div className="style-instruction-preview">
        <div className="preview-top-row">
          <MessageSquareQuote size={12} className="quote-icon" />
          <span className="preview-label">Active Prompting Directive:</span>
        </div>
        <p className="preview-quote">"{currentPresetInfo.instruction}"</p>
      </div>
    </div>
  );
};
