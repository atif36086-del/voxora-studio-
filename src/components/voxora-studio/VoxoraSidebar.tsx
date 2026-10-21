'use client';

import React from 'react';
import { Home, FolderOpen, Radio, Download, Settings, Crown } from 'lucide-react';

interface VoxoraSidebarProps {
  currentTab: 'home' | 'projects' | 'voices' | 'exports' | 'settings';
  onSelectTab: (tab: 'home' | 'projects' | 'voices' | 'exports' | 'settings') => void;
}

export const VoxoraSidebar: React.FC<VoxoraSidebarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  return (
    <>
      {/* Desktop Sidebar (hidden on mobile <= 860px) */}
      <aside className="studio-sidebar">
        <div className="sidebar-top-section">
          <div className="sidebar-nav-list">
            <button
              type="button"
              className={`sidebar-nav-item ${currentTab === 'home' ? 'active' : ''}`}
              onClick={() => onSelectTab('home')}
            >
              <Home size={18} />
              <span>Home</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${currentTab === 'projects' ? 'active' : ''}`}
              onClick={() => onSelectTab('projects')}
            >
              <FolderOpen size={18} />
              <span>Projects</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${currentTab === 'voices' ? 'active' : ''}`}
              onClick={() => onSelectTab('voices')}
            >
              <Radio size={18} />
              <span>Voice Library</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${currentTab === 'exports' ? 'active' : ''}`}
              onClick={() => onSelectTab('exports')}
            >
              <Download size={18} />
              <span>Exports</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${currentTab === 'settings' ? 'active' : ''}`}
              onClick={() => onSelectTab('settings')}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </div>
        </div>

        <div className="sidebar-bottom-section">
          <div className="sidebar-pro-card">
            <div className="pro-card-icon">
              <Crown size={16} />
            </div>
            <div>
              <div className="pro-card-title">Pro Plan</div>
              <div className="pro-card-sub">Unlimited exports</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Studio Bottom Navigation Bar (visible on mobile <= 860px) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Studio Navigation">
        <button
          type="button"
          className={`mobile-bottom-nav-item ${currentTab === 'home' ? 'active' : ''}`}
          onClick={() => onSelectTab('home')}
        >
          <Home size={19} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className={`mobile-bottom-nav-item ${currentTab === 'projects' ? 'active' : ''}`}
          onClick={() => onSelectTab('projects')}
        >
          <FolderOpen size={19} />
          <span>Projects</span>
        </button>

        <button
          type="button"
          className={`mobile-bottom-nav-item ${currentTab === 'voices' ? 'active' : ''}`}
          onClick={() => onSelectTab('voices')}
        >
          <Radio size={19} />
          <span>Voices</span>
        </button>

        <button
          type="button"
          className={`mobile-bottom-nav-item ${currentTab === 'exports' ? 'active' : ''}`}
          onClick={() => onSelectTab('exports')}
        >
          <Download size={19} />
          <span>Exports</span>
        </button>

        <button
          type="button"
          className={`mobile-bottom-nav-item ${currentTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab('settings')}
        >
          <Settings size={19} />
          <span>Settings</span>
        </button>
      </nav>
    </>
  );
};
