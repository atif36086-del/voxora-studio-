'use client';

import React from 'react';
import { TTSProvider, GoogleTTSModel, getEngineLimits } from '@/lib/types';

interface ProviderSwitcherProps {
  provider: TTSProvider;
  geminiModel?: GoogleTTSModel;
  onSelectProvider: (provider: TTSProvider) => void;
  disabled?: boolean;
}

export const ProviderSwitcher: React.FC<ProviderSwitcherProps> = ({
  provider,
  geminiModel = 'gemini-3.8-flash-tts',
  onSelectProvider,
  disabled = false,
}) => {
  const sarvamLimits = getEngineLimits('sarvam');
  const geminiLimits = getEngineLimits('google', geminiModel);

  return (
    <div className="provider-switcher-container">
      <div className="provider-switcher-header">
        <span className="control-label">TTS Provider</span>
        <span className="provider-live-tag">
          {provider === 'sarvam'
            ? `Sarvam AI • ${sarvamLimits.maxChars.toLocaleString()} chars`
            : `${geminiLimits.shortName} • ${geminiLimits.maxChars.toLocaleString()} chars`}
        </span>
      </div>

      <div className="segmented-provider-track" role="tablist" aria-label="Select TTS Provider">
        {/* Sarvam AI Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={provider === 'sarvam'}
          disabled={disabled}
          onClick={() => onSelectProvider('sarvam')}
          className={`provider-segment-btn ${provider === 'sarvam' ? 'active sarvam' : ''}`}
        >
          <div className="segment-indicator-dot" />
          <div className="segment-text-group">
            <span className="segment-title">Sarvam AI</span>
            <span className="segment-subtitle">Bulbul v3 • 2,500 chars</span>
          </div>
        </button>

        {/* Google Gemini Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={provider === 'google'}
          disabled={disabled}
          onClick={() => onSelectProvider('google')}
          className={`provider-segment-btn ${provider === 'google' ? 'active google' : ''}`}
        >
          <div className="segment-indicator-dot" />
          <div className="segment-text-group">
            <span className="segment-title">Google Gemini</span>
            <span className="segment-subtitle">30 Voices • Up to 4,000 chars</span>
          </div>
        </button>
      </div>
    </div>
  );
};
