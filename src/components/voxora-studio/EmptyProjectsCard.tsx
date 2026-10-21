'use client';

import React from 'react';
import { ArrowRight, FileAudio } from 'lucide-react';

interface EmptyProjectsCardProps {
  onCreateNew: () => void;
}

export const EmptyProjectsCard: React.FC<EmptyProjectsCardProps> = ({
  onCreateNew,
}) => {
  return (
    <div className="empty-projects-container">
      <div className="empty-doc-illustration">
        <FileAudio size={64} style={{ color: '#0066ff' }} />
      </div>

      <h3 className="empty-projects-title">No Projects Yet</h3>
      <p className="empty-projects-sub">
        Create your first project and bring your ideas to life with AI voices.
      </p>

      <button
        type="button"
        className="saas-btn-vibrant-blue"
        style={{ width: 'auto', padding: '0.75rem 2rem' }}
        onClick={onCreateNew}
      >
        <span>Create New Project</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};
