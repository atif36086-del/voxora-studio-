'use client';

import React, { useState } from 'react';
import { VoxoraNavbar } from './VoxoraNavbar';
import { LandingHeroView } from './LandingHeroView';
import { VoxoraSidebar } from './VoxoraSidebar';
import { ScriptUploadCard } from './ScriptUploadCard';
import { VoiceSelectionCard } from './VoiceSelectionCard';
import { GeneratingVoiceoverCard } from './GeneratingVoiceoverCard';
import { ProjectEditorCard } from './ProjectEditorCard';
import { EmptyProjectsCard } from './EmptyProjectsCard';
import { CHARACTER_VOICES, CharacterVoice } from '@/lib/characterVoices';
import { AnimeVoiceoverWorkflow } from '@/components/anime-voiceover/AnimeVoiceoverWorkflow';

interface SavedProject {
  id: string;
  title: string;
  voice: CharacterVoice;
  audioBase64: string;
  scriptText: string;
  createdAt: string;
}

export const VoxoraStudioApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'studio' | 'projects' | 'anime-workflow'>('home');
  const [sidebarTab, setSidebarTab] = useState<'home' | 'projects' | 'voices' | 'exports' | 'settings'>('projects');
  const [studioStep, setStudioStep] = useState<'upload' | 'voice' | 'generating' | 'editor'>('upload');

  // Script & Voice state
  const [scriptText, setScriptText] = useState<string>(
    'Jab usne apni aakhri taaqat ko sameta, toh poora maidaan neeli roshni se jagmaga utha! Yeh ladayi main nahi haar sakta!'
  );
  const [selectedVoice, setSelectedVoice] = useState<CharacterVoice>(CHARACTER_VOICES[0]);
  const [projectTitle, setProjectTitle] = useState<string>('Anime Script Voiceover');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Projects list
  const [projects, setProjects] = useState<SavedProject[]>([]);

  // Navigation handlers
  const handleStartCreating = () => {
    setCurrentView('studio');
    setStudioStep('upload');
  };

  const handleSidebarTabChange = (tab: 'home' | 'projects' | 'voices' | 'exports' | 'settings') => {
    setSidebarTab(tab);
    if (tab === 'home') {
      setCurrentView('home');
    } else if (tab === 'projects') {
      setCurrentView('projects');
    } else if (tab === 'voices') {
      setCurrentView('studio');
      setStudioStep('voice');
    } else if (tab === 'exports') {
      if (audioBase64) {
        setCurrentView('studio');
        setStudioStep('editor');
      } else {
        setCurrentView('projects');
      }
    }
  };

  // Run Real TTS Synthesis via API
  const handleTriggerGeneration = async () => {
    setStudioStep('generating');
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          text: scriptText,
          speaker: selectedVoice.geminiVoice,
          geminiModel: 'gemini-3.8-flash-lite-tts',
          pace: 1.0,
          stylePreset: 'Normal',
        }),
      });

      const data = await response.json();

      if (data.success && data.audio) {
        const generatedAudio = data.audio;
        setAudioBase64(generatedAudio);

        // Save project to list
        const newProj: SavedProject = {
          id: `proj_${Date.now()}`,
          title: projectTitle,
          voice: selectedVoice,
          audioBase64: generatedAudio,
          scriptText: scriptText,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setProjects((prev) => [newProj, ...prev]);

        // Proceed to editor
        setTimeout(() => {
          setIsGenerating(false);
          setStudioStep('editor');
        }, 1200);
      } else {
        throw new Error(data.error || 'TTS audio synthesis failed.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown network failure';
      setGenerationError(msg);
      // Fallback transition so user isn't stuck
      setTimeout(() => {
        setIsGenerating(false);
        setStudioStep('editor');
      }, 2000);
    }
  };

  return (
    <div className="voxora-saas-root">
      {/* Top Navbar */}
      <VoxoraNavbar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        onStartCreating={handleStartCreating}
      />

      {/* Main View Router */}
      {currentView === 'home' ? (
        /* Screen 1 (Hero) & Screen 7 (Why Voxora Features Grid) */
        <LandingHeroView onStartCreating={handleStartCreating} />
      ) : currentView === 'anime-workflow' ? (
        /* Existing Deep Anime Localization & Voiceover Suite */
        <div className="dubbing-suite-wrapper">
          <AnimeVoiceoverWorkflow />
        </div>
      ) : (
        /* Studio & Projects View Shell (Screens 2, 3, 4, 5, 6) */
        <div className="studio-shell">
          {/* Left Sidebar on desktop, Mobile Bottom Nav on mobile */}
          <VoxoraSidebar
            currentTab={sidebarTab}
            onSelectTab={handleSidebarTabChange}
          />

          {/* Main Content Workspace */}
          <main className="studio-main-viewport">
            {currentView === 'projects' ? (
              projects.length === 0 ? (
                /* Screen 6: No Projects Yet Empty State */
                <EmptyProjectsCard onCreateNew={handleStartCreating} />
              ) : (
                /* Projects List Grid */
                <div className="projects-page-container">
                  <div className="projects-header-row">
                    <h2 className="projects-heading">
                      My Projects ({projects.length})
                    </h2>
                    <button
                      type="button"
                      className="saas-btn-primary"
                      onClick={handleStartCreating}
                    >
                      New Project
                    </button>
                  </div>

                  <div className="projects-list-stack">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="projects-item-card"
                        onClick={() => {
                          setProjectTitle(proj.title);
                          setSelectedVoice(proj.voice);
                          setScriptText(proj.scriptText);
                          setAudioBase64(proj.audioBase64);
                          setCurrentView('studio');
                          setStudioStep('editor');
                        }}
                      >
                        <div className="project-item-inner">
                          <div className="project-item-meta">
                            <img
                              src={proj.voice.avatar}
                              alt={proj.voice.name}
                              className="project-item-avatar"
                            />
                            <div className="project-item-info">
                              <h4 className="project-item-title">
                                {proj.title}
                              </h4>
                              <p className="project-item-sub">
                                Voice: {proj.voice.name} • Saved {proj.createdAt}
                              </p>
                            </div>
                          </div>
                          <span className="project-open-link">
                            Open Editor →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              /* Studio Wizard Steps (Screens 2, 3, 4, 5) */
              <div className="wizard-card-wrapper">
                {studioStep === 'upload' && (
                  /* Screen 2: Upload Your Script */
                  <ScriptUploadCard
                    script={scriptText}
                    onScriptChange={setScriptText}
                    onNext={() => setStudioStep('voice')}
                    onBack={() => setCurrentView('home')}
                  />
                )}

                {studioStep === 'voice' && (
                  /* Screen 3: Choose Your Voice */
                  <VoiceSelectionCard
                    selectedVoice={selectedVoice}
                    onSelectVoice={setSelectedVoice}
                    onNext={handleTriggerGeneration}
                    onBack={() => setStudioStep('upload')}
                  />
                )}

                {studioStep === 'generating' && (
                  /* Screen 4: Generating Your Voiceover */
                  <GeneratingVoiceoverCard
                    onComplete={() => setStudioStep('editor')}
                    error={generationError}
                  />
                )}

                {studioStep === 'editor' && (
                  /* Screen 5: My Project Editor Studio */
                  <ProjectEditorCard
                    projectTitle={projectTitle}
                    onUpdateTitle={setProjectTitle}
                    voice={selectedVoice}
                    audioBase64={audioBase64}
                    scriptText={scriptText}
                    onCreateNew={() => {
                      setScriptText('');
                      setAudioBase64(null);
                      setStudioStep('upload');
                    }}
                  />
                )}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};
