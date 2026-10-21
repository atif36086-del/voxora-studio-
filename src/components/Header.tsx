'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Disc3, Sparkles, Sun, Moon } from 'lucide-react';
import { TTSProvider, GoogleTTSModel, getEngineLimits } from '@/lib/types';

interface HeaderProps {
  provider?: TTSProvider;
  geminiModel?: GoogleTTSModel;
  onOpenLimitsModal?: () => void;
  mode?: 'studio' | 'anime-workflow';
  onSelectMode?: (mode: 'studio' | 'anime-workflow') => void;
}

export const Header: React.FC<HeaderProps> = ({
  provider = 'google',
  geminiModel = 'gemini-3.8-flash-tts',
  onOpenLimitsModal,
  mode = 'studio',
  onSelectMode,
}) => {
  const limits = getEngineLimits('google', geminiModel);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = (localStorage.getItem('voxora_theme') as 'light' | 'dark') || 'light';
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const handleToggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('voxora_theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  return (
    <header className="header-container">
      {/* Top Row: Brand & Status Badges */}
      <div className="header-top-row">
        {/* Official VOXORA Brand Identity */}
        <div className="brand-group">
          <img
            src="/voxora-logo.png"
            alt="VOXORA"
            className="brand-logo-img"
            style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
          />
          <div className="brand-meta">
            <div className="brand-name-row">
              <span className="brand-tag">Studio</span>
            </div>
            <p className="brand-desc">Hindi & Hinglish Anime Narration Suite</p>
          </div>
        </div>

        {/* Engine status & metadata badges */}
        <div className="header-badges">
          <div className="status-pill engine-pill gemini">
            <span className="status-indicator-dot" />
            <span className="pill-primary">{limits.shortName}</span>
            <span className="pill-secondary">hi-IN</span>
          </div>

          <div className="status-pill spec-pill">
            <Disc3 size={13} className="spec-icon" />
            <span>{limits.sampleRate} WAV</span>
          </div>

          <button
            type="button"
            onClick={onOpenLimitsModal}
            className="status-pill limit-pill interactive-limit-pill"
            title="View engine limits, character capacities & quota reset times"
          >
            <Layers size={13} className="spec-icon" />
            <span className="limit-pill-text">{limits.maxChars.toLocaleString()} chars cap</span>
          </button>

          {/* VOXORA Theme Preview Switcher */}
          <div className="status-pill theme-toggle-pill" title="Preview VOXORA Theme: Clean Light vs Cyber-Obsidian Dark">
            <button
              type="button"
              onClick={() => handleToggleTheme('light')}
              className={`theme-pill-btn ${theme === 'light' ? 'active' : ''}`}
              title="Preview Clean Light Theme (with VOXORA Cyan-Blue Accents)"
            >
              <Sun size={12} />
              <span>Light</span>
            </button>
            <span className="theme-pill-sep">|</span>
            <button
              type="button"
              onClick={() => handleToggleTheme('dark')}
              className={`theme-pill-btn ${theme === 'dark' ? 'active' : ''}`}
              title="Preview Cyber-Obsidian Dark Theme (Matching Logo Black & Cyan)"
            >
              <Moon size={12} />
              <span>Dark</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Switcher Navigation Toolbar */}
      {onSelectMode && (
        <div className="header-nav-toolbar">
          <div className="mode-toggle-group">
            <button
              type="button"
              id="switch-mode-studio"
              onClick={() => onSelectMode('studio')}
              className={`mode-toggle-tab ${mode === 'studio' ? 'active' : ''}`}
            >
              <span className="tab-title">TTS Studio</span>
              <span className="tab-subtag">Single Take Narration</span>
            </button>

            <button
              type="button"
              id="switch-mode-workflow"
              onClick={() => onSelectMode('anime-workflow')}
              className={`mode-toggle-tab ${mode === 'anime-workflow' ? 'active' : ''}`}
            >
              <img
                src="/voxora-icon.png"
                alt="VOXORA"
                className="tab-voxora-icon"
                style={{ width: '16px', height: '16px', objectFit: 'contain', display: 'inline-block' }}
              />
              <span className="tab-title">VOXORA Voiceover Workflow</span>
              <span className="tab-badge-new">NEW • Full Script Translation & TTS</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
