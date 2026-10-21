'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FolderOpen,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Layers,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { WorkflowProject } from '@/lib/types';

interface ProjectSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: WorkflowProject) => void;
  onNewProject: () => void;
  currentProjectId?: string;
}

interface ProjectSummary {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  currentStep: string;
  totalEpisodes: number;
  totalChunks: number;
  completedChunks: number;
  fileName: string;
  hasFinalAudio: boolean;
}

export const ProjectSelectorModal: React.FC<ProjectSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  onNewProject,
  currentProjectId,
}) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/anime-script/projects');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Failed to list projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoad = async (id: string) => {
    setLoadingProjectId(id);
    try {
      const res = await fetch(`/api/anime-script/projects?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (res.ok && data.success && data.project) {
        onSelectProject(data.project);
        onClose();
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoadingProjectId(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/anime-script/projects?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div
        className="studio-limits-modal-dialog project-manager-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header-bar">
          <div className="modal-title-left">
            <FolderOpen size={18} className="modal-title-icon" />
            <h3 className="modal-title-text">VOXORA Voiceover Projects</h3>
            <span className="modal-badge">{projects.length} Saved</span>
          </div>

          <div className="modal-header-actions">
            <button
              type="button"
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className="new-project-pill-btn"
            >
              <Plus size={14} />
              <span>New Project</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="modal-close-icon-btn"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-scrollable-body">
          {isLoading ? (
            <div className="modal-loading-state">
              <Loader2 size={24} className="spinning-sync-icon" />
              <span>Loading saved projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="modal-empty-state" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem', maxWidth: '100%' }}>
                <img
                  src="/assets/voxora-empty-robot.jpg"
                  alt="No saved projects yet"
                  className="dubbing-empty-modal-img"
                  style={{
                    width: '100%',
                    maxWidth: '340px',
                    height: 'auto',
                    borderRadius: '12px',
                    border: '1px solid rgba(40, 211, 249, 0.3)',
                    boxShadow: '0 8px 30px rgba(40, 211, 249, 0.2)',
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-pure)' }}>No Saved Projects Yet</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '360px', margin: '0.4rem auto 1.25rem' }}>
                Upload an anime or manhwa script to automatically create your first persistent voiceover project.
              </p>
              <button
                type="button"
                onClick={() => {
                  onNewProject();
                  onClose();
                }}
                className="studio-generate-btn"
                style={{ maxWidth: '240px', margin: '0 auto' }}
              >
                <Plus size={15} />
                <span>Create First Project</span>
              </button>
            </div>
          ) : (
            <div className="projects-grid-list">
              {projects.map((proj) => {
                const isCurrent = proj.id === currentProjectId;
                const isLoadingThis = loadingProjectId === proj.id;
                const isDeletingThis = deletingId === proj.id;
                const progressPct =
                  proj.totalChunks > 0
                    ? Math.round((proj.completedChunks / proj.totalChunks) * 100)
                    : 0;

                return (
                  <div
                    key={proj.id}
                    onClick={() => handleLoad(proj.id)}
                    className={`project-list-card ${isCurrent ? 'current-active' : ''}`}
                  >
                    <div className="project-card-top">
                      <div className="project-name-group">
                        <h4 className="project-name-text">{proj.name}</h4>
                        <span className="project-file-tag">{proj.fileName}</span>
                      </div>

                      <div className="project-card-actions">
                        <button
                          type="button"
                          onClick={(e) => handleDelete(proj.id, e)}
                          disabled={isDeletingThis}
                          className="project-delete-btn"
                          title="Delete project"
                        >
                          {isDeletingThis ? (
                            <Loader2 size={13} className="spinning-sync-icon" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="project-card-meta-row">
                      <span className="meta-item">
                        <Layers size={12} />
                        {proj.totalEpisodes} {proj.totalEpisodes === 1 ? 'Episode' : 'Episodes'} • {proj.totalChunks} Chunks
                      </span>
                      <span className="meta-item">
                        <Calendar size={12} />
                        {new Date(proj.updatedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="project-card-progress">
                      <div className="progress-labels">
                        <span>Translation Progress</span>
                        <span>{progressPct}% ({proj.completedChunks}/{proj.totalChunks})</span>
                      </div>
                      <div className="mini-track-bar">
                        <div
                          className="mini-fill-bar"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="project-card-footer">
                      <span className="step-status-chip">
                        Step: {proj.currentStep.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        className="open-project-btn"
                        disabled={isLoadingThis}
                      >
                        {isLoadingThis ? (
                          <Loader2 size={13} className="spinning-sync-icon" />
                        ) : (
                          <>
                            <span>Open</span>
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
