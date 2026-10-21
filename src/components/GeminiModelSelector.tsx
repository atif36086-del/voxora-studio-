'use client';

import React from 'react';
import { GoogleTTSModel, GEMINI_TTS_MODELS, ENGINE_LIMITS } from '@/lib/types';
import { Sparkles, Zap, Radio, ShieldCheck } from 'lucide-react';

interface GeminiModelSelectorProps {
  model: GoogleTTSModel;
  onSelectModel: (model: GoogleTTSModel) => void;
  disabled?: boolean;
}

const MODEL_ICONS: Record<GoogleTTSModel, React.ReactNode> = {
  'gemini-3.8-flash-tts': <Sparkles size={13} className="model-card-icon flash-hd-icon" />,
  'gemini-3.8-flash-lite-tts': <Zap size={13} className="model-card-icon flash-lite-icon" />,
  'gemini-3.1-flash-tts-preview': <Radio size={13} className="model-card-icon flash-preview-icon" />,
  'gemini-2.5-flash-preview-tts': <ShieldCheck size={13} className="model-card-icon flash-stable-icon" />,
};

const BADGE_CLASSES: Record<string, string> = {
  FLAGSHIP: 'hd-chip',
  FAST: 'speed-chip',
  PREVIEW: 'preview-chip',
  STABLE: 'stable-chip',
};

export const GeminiModelSelector: React.FC<GeminiModelSelectorProps> = ({
  model,
  onSelectModel,
  disabled = false,
}) => {
  const currentModelInfo =
    GEMINI_TTS_MODELS.find((m) => m.id === model) || GEMINI_TTS_MODELS[0];
  const currentLimits = ENGINE_LIMITS[model];

  return (
    <div className="control-section gemini-model-section">
      <div className="section-header">
        <label className="control-label">Gemini Speech Model</label>
        <span className="rack-value-pill">
          {currentModelInfo.name} • {currentLimits?.maxChars.toLocaleString()} chars
        </span>
      </div>

      <div className="gemini-model-grid">
        {GEMINI_TTS_MODELS.map((item) => {
          const isActive = model === item.id;
          const limits = ENGINE_LIMITS[item.id];

          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectModel(item.id)}
              className={`gemini-model-card ${isActive ? 'active' : ''}`}
            >
              <div className="model-card-top">
                {MODEL_ICONS[item.id]}
                <span className="model-card-name">{item.name}</span>
                <span className={`model-chip ${BADGE_CLASSES[item.badge] || 'speed-chip'}`}>
                  {item.badge}
                </span>
              </div>
              <p className="model-card-desc">{item.description}</p>
              <div className="model-card-footer">
                <span className="model-limit-tag">{limits?.maxChars.toLocaleString()} chars max</span>
                <span className="model-duration-tag">{limits?.estMaxDuration}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
