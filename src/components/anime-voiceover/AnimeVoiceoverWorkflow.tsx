'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  WorkflowProject,
  WorkflowStep,
  WorkflowChunk,
  ScriptMetadata,
  WorkflowProjectSettings,
} from '@/lib/types';
import { WorkflowStepper } from './WorkflowStepper';
import { ScriptUploadStep } from './ScriptUploadStep';
import { TranslationStep } from './TranslationStep';
import { TranslationEditorStep } from './TranslationEditorStep';
import { TTSGenerationStep } from './TTSGenerationStep';
import { MasterExportStep } from './MasterExportStep';
import { ProjectSelectorModal } from './ProjectSelectorModal';
import { Loader2 } from 'lucide-react';

const DEFAULT_SETTINGS: WorkflowProjectSettings = {
  translationModel: 'gemini-2.0-flash',
  ttsProvider: 'google',
  ttsVoice: 'Puck',
  ttsPace: 1.05,
  ttsStylePreset: 'Normal',
  geminiTTSModel: 'gemini-3.8-flash-lite-tts',
  chunkSize: 1600,
  temperature: 0.4,
  autoFailoverModels: true,
  crossEngineFallback: true,
};

function createInitialProject(): WorkflowProject {
  const randSuffix = Math.random().toString(36).substring(2, 7);
  const id = `proj_${Date.now()}_${randSuffix}`;
  return {
    id,
    name: 'New VOXORA Voiceover Project',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    currentStep: 'upload',
    metadata: {
      fileName: 'script.txt',
      fileSize: 0,
      detectedEpisodes: [],
      totalCharacters: 0,
      totalWords: 0,
      estTranslationCostUSD: 0,
      estTranslationCostINR: 0,
      estTTSCostUSD: 0,
      estTTSCostINR: 0,
      estDurationMinutes: 0,
    },
    chunks: [],
    terminologyMemory: {},
    settings: DEFAULT_SETTINGS,
  };
}

export const AnimeVoiceoverWorkflow: React.FC = () => {
  const [project, setProject] = useState<WorkflowProject>(createInitialProject);
  const [isLoadingProject, setIsLoadingProject] = useState<boolean>(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [isMergingAudio, setIsMergingAudio] = useState<boolean>(false);

  // Auto-save project whenever it changes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-restore ongoing project on mount so user's work is NEVER lost
  useEffect(() => {
    let isCancelled = false;

    // Safety timeout: loader will NEVER hang for more than 2 seconds under any circumstance
    const safetyTimeout = setTimeout(() => {
      setIsLoadingProject(false);
    }, 2000);

    async function restoreActiveProject() {
      try {
        const savedId = typeof window !== 'undefined' ? (localStorage.getItem('voxora_active_project_id') || localStorage.getItem('animevoice_active_project_id')) : null;

        // If explicitly set to 'new', start clean immediately
        if (savedId === 'new') {
          clearTimeout(safetyTimeout);
          setIsLoadingProject(false);
          return;
        }

        // Fast path: If saved project ID exists, fetch it directly
        if (savedId) {
          try {
            const projectRes = await fetch(`/api/anime-script/projects?id=${encodeURIComponent(savedId)}`);
            if (projectRes.ok) {
              const projectData = await projectRes.json();
              if (projectData?.project && !isCancelled) {
                setProject(projectData.project);
                clearTimeout(safetyTimeout);
                setIsLoadingProject(false);
                return;
              }
            }
          } catch {
            // Project was deleted or unavailable
          }
          // If specified savedId was deleted or unavailable, start fresh
          clearTimeout(safetyTimeout);
          setIsLoadingProject(false);
          return;
        }

        // If no saved ID was found, don't auto-load ancient completed projects
        clearTimeout(safetyTimeout);
        setIsLoadingProject(false);
      } catch (err) {
        console.error('Error auto-restoring ongoing project:', err);
      } finally {
        clearTimeout(safetyTimeout);
        setIsLoadingProject(false);
      }
    }

    restoreActiveProject();
    return () => {
      isCancelled = true;
      clearTimeout(safetyTimeout);
    };
  }, []);

  const saveProjectToServer = async (projToSave: WorkflowProject) => {
    // Only save if script metadata or chunks are populated
    if (projToSave.chunks.length === 0 && projToSave.metadata.totalCharacters === 0) {
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('voxora_active_project_id', projToSave.id);
    }

    try {
      await fetch('/api/anime-script/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projToSave),
      });
    } catch (err) {
      console.error('Error auto-saving project:', err);
    }
  };

  const updateProject = (updater: (prev: WorkflowProject) => WorkflowProject) => {
    setProject((prev) => {
      const next = updater(prev);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveProjectToServer(next);
      }, 1000);
      return next;
    });
  };

  // Determine which steps are completed
  const completedSteps: WorkflowStep[] = [];
  if (project.metadata.totalCharacters > 0 && project.chunks.length > 0) {
    completedSteps.push('upload');
  }
  const allTranslated =
    project.chunks.length > 0 &&
    project.chunks.every((c) => c.status === 'completed' && Boolean(c.translatedText));
  if (allTranslated) {
    completedSteps.push('translate');
    completedSteps.push('review');
  }
  const allAudioGenerated =
    project.chunks.length > 0 &&
    project.chunks.every(
      (c) => c.audioStatus === 'completed' && Boolean(c.audioBase64 || c.audioUrl)
    );
  if (allAudioGenerated) {
    completedSteps.push('tts');
  }
  if (
    project.finalAudio?.wavBase64 ||
    project.finalAudio?.mp3Base64 ||
    project.finalAudio?.wavUrl
  ) {
    completedSteps.push('export');
  }

  // Step 1: Upload Complete Callback
  const handleScriptReady = (
    metadata: ScriptMetadata,
    chunks: WorkflowChunk[],
    projectName: string
  ) => {
    updateProject((prev) => ({
      ...prev,
      name: projectName,
      metadata,
      chunks,
      currentStep: 'translate',
      updatedAt: Date.now(),
    }));
  };

  // Chunk Update Callback
  const handleUpdateChunk = (updatedChunk: WorkflowChunk) => {
    updateProject((prev) => ({
      ...prev,
      chunks: prev.chunks.map((c) => (c.id === updatedChunk.id ? updatedChunk : c)),
      updatedAt: Date.now(),
    }));
  };

  // Terminology Memory Update Callback
  const handleUpdateTerminology = (newTerms: Record<string, string>) => {
    updateProject((prev) => ({
      ...prev,
      terminologyMemory: {
        ...prev.terminologyMemory,
        ...newTerms,
      },
      updatedAt: Date.now(),
    }));
  };

  // Settings Update Callback
  const handleUpdateSettings = (newSettings: Partial<WorkflowProjectSettings>) => {
    updateProject((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
      updatedAt: Date.now(),
    }));
  };

  // Merge Audio and Proceed to Master Export
  const handleMergeAndProceed = async () => {
    const readyChunks = project.chunks.filter(
      (c) => c.audioStatus === 'completed' && Boolean(c.audioBase64 || c.audioUrl)
    );

    if (readyChunks.length === 0) {
      alert('Please generate audio for at least one chunk before merging.');
      return;
    }

    setIsMergingAudio(true);

    try {
      const response = await fetch('/api/anime-script/merge-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          chunks: readyChunks.map((c) => ({
            id: c.id,
            audioBase64: c.audioBase64,
          })),
          pauseMs: 350,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        updateProject((prev) => ({
          ...prev,
          currentStep: 'export',
          finalAudio: {
            wavBase64: data.wavBase64,
            mp3Base64: data.mp3Base64,
            wavUrl: data.wavUrl,
            mp3Url: data.mp3Url,
            durationSec: data.durationSec,
            totalSizeMb: data.totalSizeMb,
            mergedAt: Date.now(),
          },
          updatedAt: Date.now(),
        }));
      } else {
        alert(data.error || 'Failed to merge audio chunks.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      alert(`Audio merge failed: ${msg}`);
    } finally {
      setIsMergingAudio(false);
    }
  };

  const handleResetProject = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('voxora_active_project_id', 'new');
    }
    setProject(createInitialProject());
  };

  if (isLoadingProject) {
    return (
      <div className="anime-workflow-layout">
        <div
          className="workflow-step-view-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '4.5rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <Loader2 size={38} className="spinning-sync-icon" style={{ color: '#2563eb' }} />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
              Restoring Ongoing VOXORA Voiceover Project...
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Loading your script chunks, translations and audio takes from disk.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsLoadingProject(false)}
            style={{
              marginTop: '0.5rem',
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: '0.8rem',
              color: '#475569',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Skip Waiting &amp; Open Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="anime-workflow-layout">
      {/* Top Stepper Track */}
      <WorkflowStepper
        currentStep={project.currentStep}
        onSelectStep={(step) => updateProject((prev) => ({ ...prev, currentStep: step }))}
        projectName={project.name}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onResetProject={handleResetProject}
        completedSteps={completedSteps}
      />

      {/* Step Render Area */}
      <div className="workflow-step-view-card">
        {project.currentStep === 'upload' && (
          <ScriptUploadStep
            onScriptReady={handleScriptReady}
            initialMetadata={project.metadata.totalCharacters > 0 ? project.metadata : undefined}
            initialProjectName={project.name}
          />
        )}

        {project.currentStep === 'translate' && (
          <TranslationStep
            metadata={project.metadata}
            chunks={project.chunks}
            settings={project.settings}
            terminologyMemory={project.terminologyMemory}
            onUpdateChunk={handleUpdateChunk}
            onUpdateTerminology={handleUpdateTerminology}
            onProceedToReview={() =>
              updateProject((prev) => ({ ...prev, currentStep: 'review' }))
            }
          />
        )}

        {project.currentStep === 'review' && (
          <TranslationEditorStep
            episodes={project.metadata.detectedEpisodes}
            chunks={project.chunks}
            settings={project.settings}
            terminologyMemory={project.terminologyMemory}
            onUpdateChunk={handleUpdateChunk}
            onProceedToTTS={() =>
              updateProject((prev) => ({ ...prev, currentStep: 'tts' }))
            }
          />
        )}

        {project.currentStep === 'tts' && (
          <TTSGenerationStep
            projectId={project.id}
            chunks={project.chunks}
            settings={project.settings}
            onUpdateSettings={handleUpdateSettings}
            onUpdateChunk={handleUpdateChunk}
            onMergeAndProceed={handleMergeAndProceed}
            isMerging={isMergingAudio}
          />
        )}

        {project.currentStep === 'export' && (
          <MasterExportStep
            project={project}
            onBackToEdit={() =>
              updateProject((prev) => ({ ...prev, currentStep: 'review' }))
            }
            onStartNewProject={handleResetProject}
          />
        )}
      </div>

      {/* Project Manager Modal */}
      <ProjectSelectorModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSelectProject={(loadedProj) => setProject(loadedProj)}
        onNewProject={handleResetProject}
        currentProjectId={project.id}
      />
    </div>
  );
};
