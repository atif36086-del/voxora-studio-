'use client';

import React from 'react';
import { AlertCircle, X, KeyRound, ExternalLink } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  details?: string;
  onDismiss: () => void;
  onTryDemo?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  details,
  onDismiss,
  onTryDemo,
}) => {
  if (!message) return null;

  const isGoogleKey = message.toLowerCase().includes('google_api_key');
  const isSarvamKey = message.toLowerCase().includes('sarvam_api_key');
  const isAuthIssue =
    message.toLowerCase().includes('authentication') ||
    message.toLowerCase().includes('api key') ||
    isGoogleKey ||
    isSarvamKey;

  return (
    <div className="error-alert-banner" role="alert">
      <div className="alert-content-wrap">
        <div className="alert-icon-col">
          {isAuthIssue ? (
            <KeyRound size={20} className="alert-icon key-icon" />
          ) : (
            <AlertCircle size={20} className="alert-icon" />
          )}
        </div>

        <div className="alert-text-col">
          <h4 className="alert-title">{message}</h4>
          {details && <p className="alert-details">{details}</p>}

          {isAuthIssue && (
            <div className="api-key-help-box">
              <span className="api-key-step">
                1. Open <code className="code-badge">.env.local</code> in project root
              </span>
              <span className="api-key-step">
                2. Set{' '}
                <code className="code-badge">
                  {isGoogleKey ? 'GOOGLE_API_KEY=your_key_here' : 'SARVAM_API_KEY=your_key_here'}
                </code>
              </span>
              <div className="api-key-action-links">
                {isGoogleKey ? (
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="api-key-link"
                  >
                    <span>Get Gemini API Key (Google AI Studio)</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <a
                    href="https://dashboard.sarvam.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="api-key-link"
                  >
                    <span>Get API key from Sarvam AI Dashboard</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                {onTryDemo && (
                  <button
                    type="button"
                    onClick={onTryDemo}
                    className="demo-preview-btn"
                  >
                    <span>Preview Audio Player with Demo Sound</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="alert-close-btn"
        aria-label="Dismiss error"
      >
        <X size={16} />
      </button>
    </div>
  );
};
