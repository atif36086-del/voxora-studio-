'use client';

import React, { useEffect } from 'react';
import {
  TTSProvider,
  GoogleTTSModel,
  ENGINE_LIMITS,
  getEngineLimits,
} from '@/lib/types';
import {
  X,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Disc3,
  Layers,
  Sparkles,
} from 'lucide-react';

interface EngineLimitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: TTSProvider;
  geminiModel: GoogleTTSModel;
  currentCharCount: number;
}

export const EngineLimitsModal: React.FC<EngineLimitsModalProps> = ({
  isOpen,
  onClose,
  provider,
  geminiModel,
  currentCharCount,
}) => {
  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentLimits = getEngineLimits(provider, geminiModel);
  const percentUsed = Math.min(
    100,
    Math.round((currentCharCount / currentLimits.maxChars) * 100)
  );
  const isOver = currentCharCount > currentLimits.maxChars;
  const isNear = currentCharCount > currentLimits.maxChars * 0.8 && !isOver;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-window engine-limits-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (Pinned at Top) */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Gauge size={18} />
            </div>
            <div>
              <h3 className="modal-title">Engine Limits & Audio Specifications</h3>
              <p className="modal-subtitle">
                Live character capacities, audio bitrate & recommended script lengths
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            title="Close dialog (Esc)"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="modal-content">
          {/* Active Engine Live Status Card */}
          <div className="active-engine-live-card">
            <div className="live-card-header">
              <div className="live-card-title">
                <span className="live-dot" />
                <span className="live-engine-label">Active Engine:</span>
                <span className="live-engine-name">{currentLimits.name}</span>
              </div>
              <div className={`live-meter-pill ${isOver ? 'over' : isNear ? 'warn' : 'ok'}`}>
                {isOver ? (
                  <>
                    <AlertTriangle size={12} />
                    <span>+{(currentCharCount - currentLimits.maxChars).toLocaleString()} Chars Over Limit</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={12} />
                    <span>{(currentLimits.maxChars - currentCharCount).toLocaleString()} Chars Available</span>
                  </>
                )}
              </div>
            </div>

            {/* Live Progress Bar */}
            <div className="live-progress-container">
              <div className="live-progress-bar-bg">
                <div
                  className={`live-progress-fill ${isOver ? 'over' : isNear ? 'warn' : 'ok'}`}
                  style={{ width: `${Math.min(100, (currentCharCount / currentLimits.maxChars) * 100)}%` }}
                />
              </div>
              <div className="live-progress-labels">
                <span className="live-used-text">
                  <strong>{currentCharCount.toLocaleString()}</strong> / {currentLimits.maxChars.toLocaleString()} characters ({percentUsed}%)
                </span>
                <span className="live-dur-text">
                  Max capacity: {currentLimits.estMaxDuration}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed All-Engine Comparison Matrix (Horizontal & Vertical Scrollable) */}
          <div className="limits-table-wrapper">
            <table className="limits-table">
              <thead>
                <tr>
                  <th>TTS Engine</th>
                  <th>Character Cap</th>
                  <th>Audio Spec</th>
                  <th>Est. Duration</th>
                  <th>Best Suited For</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(ENGINE_LIMITS).map((item) => {
                  const isCurrent = geminiModel === item.modelId;

                  return (
                    <tr
                      key={`${item.provider}-${item.modelId}`}
                      className={isCurrent ? 'active-row' : ''}
                    >
                      <td className="engine-cell">
                        <div className="engine-cell-title">
                          <span className="engine-cell-name">{item.name}</span>
                          {isCurrent && (
                            <span className="engine-cell-badge">ACTIVE</span>
                          )}
                        </div>
                        <span className="engine-cell-note">{item.rateLimitNote}</span>
                      </td>
                      <td className="limit-cell">
                        <span className="limit-number">{item.maxChars.toLocaleString()}</span>
                        <span className="limit-sub">chars / req</span>
                      </td>
                      <td className="spec-cell">
                        <span className="spec-format">{item.sampleRate}</span>
                        <span className="spec-depth">{item.bitDepth}</span>
                      </td>
                      <td className="duration-cell">
                        <span>{item.estMaxDuration}</span>
                      </td>
                      <td className="desc-cell">
                        <span className="desc-text">{item.description}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Reset Schedule & Quota Information */}
          <div className="reset-schedule-card">
            <div className="reset-card-header">
              <Clock size={15} className="reset-header-icon" />
              <span className="reset-card-title">Quota & Rate Limits Reset Schedule (लिमिट कब रीसेट होती है?)</span>
            </div>
            <div className="reset-grid">
              <div className="reset-item">
                <div className="reset-item-top">
                  <span className="reset-badge minute-badge">HAR 60 SECONDS</span>
                  <span className="reset-name">Per-Minute Rate Limit (RPM)</span>
                </div>
                <p className="reset-desc">
                  Agar aapko <em>"Resource Exhausted / 429"</em> ka error aaye, toh ye sirf <strong>30 se 60 seconds</strong> me reset ho jata hai. Ya fir aap turant doosra model (jaise Gemini 3.1 Flash Preview ya Gemini 2.5 Flash) select karke bina ruke generate kar sakte hain.
                </p>
              </div>

              <div className="reset-item">
                <div className="reset-item-top">
                  <span className="reset-badge daily-badge">DAILY 1:30 PM IST</span>
                  <span className="reset-name">Daily Free Tier Quota (RPD)</span>
                </div>
                <p className="reset-desc">
                  Google Gemini ka 24-hour daily free quota har roz <strong>Midnight Pacific Time (12:00 AM PST)</strong> par reset hota hai, jo Indian Standard Time ke mutabiq <strong>Dopahar 1:30 PM IST</strong> hota hai.
                </p>
              </div>

              <div className="reset-item">
                <div className="reset-item-top">
                  <span className="reset-badge cap-badge">INSTANT / NO WAIT</span>
                  <span className="reset-name">Character Cap (2,500 - 4,000 Chars)</span>
                </div>
                <p className="reset-desc">
                  Character limit koi daily quota nahi hai balki <strong>ek single audio file ka maximum size</strong> hai. Ek audio generate hote hi aap agle 3,500 characters turant paste karke agla audio bina kisi delay ke bana sakte hain!
                </p>
              </div>
            </div>
          </div>

          {/* Anime YouTuber Pro Tip Callout */}
          <div className="modal-pro-tip">
            <Sparkles size={16} className="tip-icon" />
            <div className="tip-text">
              <strong>Pro Tip for Anime & Manhwa Creators:</strong> For a 10-minute recap video, we recommend generating narration in <strong>2 to 3-minute chunks (1,200 to 2,000 characters)</strong>. This guarantees natural breathing pauses, zero rate limit spikes, and makes video editing in Premiere or DaVinci Resolve seamless to align.
            </div>
          </div>
        </div>

        {/* Modal Footer (Pinned at Bottom) */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="modal-action-btn primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
