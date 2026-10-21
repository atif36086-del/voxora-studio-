'use client';

import React from 'react';
import {
  UploadCloud,
  Languages,
  FileEdit,
  Mic,
  Download,
  FolderOpen,
  CheckCircle2,
  LucideIcon,
} from 'lucide-react';
import { WorkflowStep } from '@/lib/types';

interface WorkflowStepperProps {
  currentStep: WorkflowStep;
  onSelectStep: (step: WorkflowStep) => void;
  projectName: string;
  onOpenProjectModal: () => void;
  onResetProject?: () => void;
  completedSteps: WorkflowStep[];
  disabled?: boolean;
}

const STEPS: { id: WorkflowStep; label: string; number: number; icon: LucideIcon }[] = [
  { id: 'upload', label: '1. Script Upload', number: 1, icon: UploadCloud },
  { id: 'translate', label: '2. AI Translation', number: 2, icon: Languages },
  { id: 'review', label: '3. Review & Edit', number: 3, icon: FileEdit },
  { id: 'tts', label: '4. Voiceover (TTS)', number: 4, icon: Mic },
  { id: 'export', label: '5. Master & Export', number: 5, icon: Download },
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentStep,
  onSelectStep,
  projectName,
  onOpenProjectModal,
  onResetProject,
  completedSteps,
  disabled = false,
}) => {
  return (
    <div className="workflow-stepper-card">
      <div className="stepper-top-bar">
        <div className="stepper-project-info">
          <span className="stepper-badge">VOXORA WORKFLOW</span>
          <span className="stepper-project-title" title={projectName}>
            {projectName}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onResetProject && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Do you want to reset and start a fresh new project? Current workspace will be cleared.')) {
                  onResetProject();
                }
              }}
              className="stepper-reset-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '7px',
                border: '1px solid #fecdd3',
                background: '#fff1f2',
                color: '#e11d48',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Start a fresh new project"
            >
              <span>+ New Project</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenProjectModal}
            className="stepper-projects-btn"
            title="Open Project Manager"
          >
            <FolderOpen size={14} />
            <span>Projects</span>
          </button>
        </div>
      </div>

      <div className="stepper-steps-track">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => !disabled && onSelectStep(step.id)}
                disabled={disabled}
                className={`stepper-step-pill ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                <span className="step-icon-wrap">
                  {isCompleted && !isActive ? (
                    <CheckCircle2 size={14} className="step-check-icon" />
                  ) : (
                    <Icon size={14} />
                  )}
                </span>
                <span className="step-label-text">{step.label}</span>
              </button>

              {idx < STEPS.length - 1 && <span className="stepper-line-separator" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
