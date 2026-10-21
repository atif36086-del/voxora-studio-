'use client';

import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight, FileText, Upload } from 'lucide-react';

interface ScriptUploadCardProps {
  script: string;
  onScriptChange: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const SAMPLE_SCRIPTS = [
  {
    label: '⚡ Shonen Battle',
    text: 'Jab usne apni aakhri taaqat ko sameta, toh poora maidaan neeli roshni se jagmaga utha! "Yeh ladayi main nahi haar sakta!"',
  },
  {
    label: '🎙️ Episode Recap',
    text: 'Pichle episode mein, Ren ne apne purane dushman ka saamna kiya tha. Lekin is baar, uske paas ek aisi taaqat hai jo kisi ne pehle nahi dekhi thi.',
  },
  {
    label: '✨ Emotional Lore',
    text: 'Kaha jaata hai ki is jheel ke paas jo bhi ata hai, uski aawaz hamesha ke liye hawaaon mein goonjti rehti hai...',
  },
  {
    label: '🌀 Reincarnate / Isekai',
    text: 'Jab main is fantasy world mein reincarnate hua, toh mujhe laga main ek aam insaan hunga. Lekin system ne mujhe sabse overpowered magic aur forbidden skills de di!',
  },
];

export const ScriptUploadCard: React.FC<ScriptUploadCardProps> = ({
  script,
  onScriptChange,
  onNext,
  onBack,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onScriptChange(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onScriptChange(content);
      }
    };
    reader.readAsText(file);
  };

  const charCount = script.length;
  const maxChars = 5000;

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

      <h2 className="wizard-heading">Upload Your Script</h2>
      <p className="wizard-subhead">
        Paste your text or upload a file. We&apos;ll handle the rest.
      </p>

      {/* Drag & Drop File Zone */}
      <div
        className="dropzone-container"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.docx,.srt,.vtt"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <div className="dropzone-icon-box">
          <FileText size={26} />
        </div>
        <div className="dropzone-main-text">Drag & drop your file here</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0' }}>or</div>
        <div className="dropzone-choose-pill">Choose File</div>
        <div className="dropzone-hint">Supports: .txt, .docx, .srt, .vtt</div>
      </div>

      {/* Or Paste Script Section */}
      <label className="paste-script-label" htmlFor="script-textarea">
        Or paste your script
      </label>
      <div className="script-textarea-wrap">
        <textarea
          id="script-textarea"
          className="script-saas-textarea"
          value={script}
          onChange={(e) => onScriptChange(e.target.value.slice(0, maxChars))}
          placeholder="e.g. In a world where technology and imagination come together, anything is possible..."
        />
        <span className="char-counter-tag">
          {charCount}/{maxChars}
        </span>
      </div>

      {/* Quick Sample Prompts */}
      <div className="sample-scripts-pill-row">
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
          Quick load:
        </span>
        {SAMPLE_SCRIPTS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            className="sample-chip"
            onClick={() => onScriptChange(s.text)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Bottom CTA Button */}
      <button
        type="button"
        className="saas-btn-vibrant-blue"
        disabled={!script.trim()}
        onClick={onNext}
      >
        <span>Next</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};
