'use client';

import React from 'react';

interface PaceControllerProps {
  pace: number;
  onChangePace: (pace: number) => void;
  disabled?: boolean;
}

interface PacePreset {
  name: string;
  value: number;
  label: string;
}

const PRESETS: PacePreset[] = [
  { name: 'Calm', value: 0.9, label: '0.90x' },
  { name: 'Normal', value: 1.0, label: '1.00x' },
  { name: 'Dramatic', value: 1.08, label: '1.08x' },
  { name: 'Energetic', value: 1.15, label: '1.15x' },
];

export const PaceController: React.FC<PaceControllerProps> = ({
  pace,
  onChangePace,
  disabled = false,
}) => {
  const isSweetSpot = pace >= 1.05 && pace <= 1.15;

  return (
    <div className="control-section pace-controller-section">
      <div className="section-header">
        <label htmlFor="pace-slider" className="control-label">
          Speed & Pacing
        </label>
        <div className="pace-header-metrics">
          {isSweetSpot && (
            <span className="sweet-spot-chip">YouTube Optimal</span>
          )}
          <span className="pace-readout-pill">{pace.toFixed(2)}x</span>
        </div>
      </div>

      {/* Modern Slider */}
      <div className="slider-wrapper">
        <input
          id="pace-slider"
          type="range"
          min="0.5"
          max="2.0"
          step="0.01"
          value={pace}
          disabled={disabled}
          onChange={(e) => onChangePace(parseFloat(e.target.value))}
          className="pace-range-input"
          aria-label="Speech Speed Pace"
        />
        <div className="slider-ticks">
          <span className="tick-label">0.5x Slow</span>
          <span className="tick-label">1.0x Normal</span>
          <span className="tick-label tick-highlight">1.1x YouTube</span>
          <span className="tick-label">2.0x Fast</span>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="presets-row">
        <div className="presets-btn-group">
          {PRESETS.map((preset) => {
            const isActive = Math.abs(pace - preset.value) < 0.02;
            return (
              <button
                key={preset.name}
                type="button"
                disabled={disabled}
                onClick={() => onChangePace(preset.value)}
                className={`preset-btn ${isActive ? 'active' : ''}`}
                title={`Set speed to ${preset.label}`}
              >
                <span className="preset-name">{preset.name}</span>
                <span className="preset-val">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
