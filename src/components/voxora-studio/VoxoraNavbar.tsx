'use client';

import React, { useState } from 'react';
import { ArrowRight, ChevronDown, Menu, X, Home, Mic, FolderOpen, Layers, Sparkles } from 'lucide-react';

interface VoxoraNavbarProps {
  currentView: 'home' | 'studio' | 'projects' | 'anime-workflow';
  onNavigate: (view: 'home' | 'studio' | 'projects' | 'anime-workflow') => void;
  onStartCreating: () => void;
}

export const VoxoraNavbar: React.FC<VoxoraNavbarProps> = ({
  currentView,
  onNavigate,
  onStartCreating,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: 'home' | 'studio' | 'projects' | 'anime-workflow') => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  const handleCtaClick = () => {
    onStartCreating();
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="saas-navbar">
        <div className="saas-brand" onClick={() => handleNavClick('home')}>
          <img
            src="/voxora-logo.png"
            alt="VOXORA"
            className="saas-brand-logo"
          />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="saas-nav-links">
          <button
            type="button"
            className={`saas-nav-link ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            Home
          </button>
          <button
            type="button"
            className={`saas-nav-link ${currentView === 'studio' ? 'active' : ''}`}
            onClick={() => handleNavClick('studio')}
          >
            Studio
          </button>
          <button
            type="button"
            className={`saas-nav-link ${currentView === 'projects' ? 'active' : ''}`}
            onClick={() => handleNavClick('projects')}
          >
            Projects
          </button>
          <button
            type="button"
            className={`saas-nav-link ${currentView === 'anime-workflow' ? 'active' : ''}`}
            onClick={() => handleNavClick('anime-workflow')}
          >
            Dubbing Suite
          </button>
          <button type="button" className="saas-nav-link">
            Resources <ChevronDown size={14} />
          </button>
        </nav>

        {/* Desktop Nav Right Actions */}
        <div className="saas-nav-right">
          <button
            type="button"
            className="saas-btn-text"
            onClick={() => handleNavClick('studio')}
          >
            Sign in
          </button>
          <button
            type="button"
            className="saas-btn-primary"
            onClick={handleCtaClick}
          >
            <span>Get Started</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Mobile Header Actions: Quick Start + Hamburger Toggle */}
        <div className="saas-mobile-nav-actions">
          <button
            type="button"
            className="saas-btn-primary saas-mobile-quick-cta"
            onClick={handleCtaClick}
          >
            <span>Start</span>
            <ArrowRight size={13} />
          </button>

          <button
            type="button"
            className="saas-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="saas-mobile-menu-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer / Dropdown Menu */}
      <div className={`saas-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="saas-mobile-drawer-header">
          <div className="saas-brand" onClick={() => handleNavClick('home')}>
            <img
              src="/voxora-logo.png"
              alt="VOXORA"
              className="saas-brand-logo"
            />
          </div>
          <button
            type="button"
            className="saas-mobile-menu-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="saas-mobile-nav-list">
          <button
            type="button"
            className={`saas-mobile-nav-item ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            <div className="mobile-nav-icon">
              <Home size={18} />
            </div>
            <span>Home</span>
          </button>

          <button
            type="button"
            className={`saas-mobile-nav-item ${currentView === 'studio' ? 'active' : ''}`}
            onClick={() => handleNavClick('studio')}
          >
            <div className="mobile-nav-icon">
              <Mic size={18} />
            </div>
            <span>AI Studio</span>
          </button>

          <button
            type="button"
            className={`saas-mobile-nav-item ${currentView === 'projects' ? 'active' : ''}`}
            onClick={() => handleNavClick('projects')}
          >
            <div className="mobile-nav-icon">
              <FolderOpen size={18} />
            </div>
            <span>My Projects</span>
          </button>

          <button
            type="button"
            className={`saas-mobile-nav-item ${currentView === 'anime-workflow' ? 'active' : ''}`}
            onClick={() => handleNavClick('anime-workflow')}
          >
            <div className="mobile-nav-icon">
              <Layers size={18} />
            </div>
            <span>Dubbing Suite</span>
          </button>
        </nav>

        <div className="saas-mobile-drawer-footer">
          <button
            type="button"
            className="saas-btn-vibrant-blue"
            style={{ width: '100%', marginBottom: '0.75rem' }}
            onClick={handleCtaClick}
          >
            <Sparkles size={16} />
            <span>Start Creating Free</span>
          </button>

          <button
            type="button"
            className="saas-btn-text"
            style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
            onClick={() => handleNavClick('studio')}
          >
            Sign in to Account
          </button>
        </div>
      </div>
    </>
  );
};
