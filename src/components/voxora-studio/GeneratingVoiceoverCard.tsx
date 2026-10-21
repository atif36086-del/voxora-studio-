'use client';

import React, { useEffect, useState } from 'react';
import { Check, Lightbulb } from 'lucide-react';

interface GeneratingVoiceoverCardProps {
  onComplete: () => void;
  error?: string | null;
}

export const GeneratingVoiceoverCard: React.FC<GeneratingVoiceoverCardProps> = ({
  onComplete,
  error,
}) => {
  const [percent, setPercent] = useState(15);
  const [currentStep, setCurrentStep] = useState<number>(1); // 0: analyzing, 1: matching, 2: generating, 3: finalizing

  useEffect(() => {
    // Smooth progress simulation while real synthesis executes
    const timer1 = setTimeout(() => {
      setPercent(38);
      setCurrentStep(1);
    }, 600);

    const timer2 = setTimeout(() => {
      setPercent(68);
      setCurrentStep(2);
    }, 1400);

    const timer3 = setTimeout(() => {
      setPercent(92);
      setCurrentStep(3);
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const strokeDashoffset = 314 - (314 * percent) / 100;

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
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #28d3f9, #0066ff)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          V
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 className="wizard-heading">Generating Your Voiceover</h2>
        <p className="wizard-subhead" style={{ marginBottom: '1.25rem' }}>
          Our AI is processing your script. This may take a few moments.
        </p>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              color: '#dc2626',
              fontSize: '0.8rem',
              marginBottom: '1rem',
              textAlign: 'left',
            }}
          >
            {error}
          </div>
        )}

        <div className="generating-center-box">
          {/* Circular Progress Ring */}
          <div className="progress-circle-wrap">
            <svg className="progress-circle-svg" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="voxora-circle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#28d3f9" />
                  <stop offset="100%" stopColor="#0066ff" />
                </linearGradient>
              </defs>
              <circle
                className="progress-circle-bg"
                cx="60"
                cy="60"
                r="50"
              />
              <circle
                className="progress-circle-bar"
                cx="60"
                cy="60"
                r="50"
                strokeDasharray="314"
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <span className="progress-percent-label">{percent}%</span>
          </div>

          {/* Animated Waveform Visualizer */}
          <div className="waveform-anim-bars">
            {Array.from({ length: 32 }).map((_, i) => (
              <span
                key={i}
                className="waveform-bar"
                style={{
                  animationDelay: `${(i * 0.05).toFixed(2)}s`,
                  height: `${10 + Math.sin(i * 0.4) * 16}px`,
                }}
              />
            ))}
          </div>

          {/* Stepper Checklist */}
          <div className="stepper-checklist">
            <div className={`step-check-item ${percent >= 30 ? 'completed' : 'active'}`}>
              <div className={`step-check-icon-circle ${percent >= 30 ? 'done' : 'spinning'}`}>
                {percent >= 30 ? <Check size={12} /> : null}
              </div>
              <span>Analyzing script</span>
            </div>

            <div className={`step-check-item ${percent >= 60 ? 'completed' : percent >= 30 ? 'active' : ''}`}>
              <div className={`step-check-icon-circle ${percent >= 60 ? 'done' : percent >= 30 ? 'spinning' : 'pending'}`}>
                {percent >= 60 ? <Check size={12} /> : null}
              </div>
              <span>Matching voice style</span>
            </div>

            <div className={`step-check-item ${percent >= 90 ? 'completed' : percent >= 60 ? 'active' : ''}`}>
              <div className={`step-check-icon-circle ${percent >= 90 ? 'done' : percent >= 60 ? 'spinning' : 'pending'}`}>
                {percent >= 90 ? <Check size={12} /> : null}
              </div>
              <span>Generating audio</span>
            </div>

            <div className={`step-check-item ${percent >= 100 ? 'completed' : percent >= 90 ? 'active' : ''}`}>
              <div className={`step-check-icon-circle ${percent >= 100 ? 'done' : percent >= 90 ? 'spinning' : 'pending'}`}>
                {percent >= 100 ? <Check size={12} /> : null}
              </div>
              <span>Finalizing</span>
            </div>
          </div>

          {/* Pro Tip Box */}
          <div className="pro-tip-box">
            <Lightbulb size={16} style={{ color: '#0066ff', flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Pro tip:</strong> You can edit the audio, add pauses, or adjust the speed in the next step.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
