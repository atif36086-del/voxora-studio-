'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  Play,
  Pause,
  Activity,
  Globe2,
  Sparkles,
  Volume2,
  FileText,
  Mic,
  Users,
  Download,
} from 'lucide-react';

interface LandingHeroViewProps {
  onStartCreating: () => void;
}

export const LandingHeroView: React.FC<LandingHeroViewProps> = ({
  onStartCreating,
}) => {
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    const audio = new Audio('/assets/voxora-demo-intro.wav?v=hindi');
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleEnded = () => setIsPlayingDemo(false);
    const handlePause = () => setIsPlayingDemo(false);
    const handlePlay = () => setIsPlayingDemo(true);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleDemoAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingDemo) {
      audioRef.current.pause();
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  };

  return (
    <div className="landing-view-wrapper">
      {/* Screen 1: Top Hero Section */}
      <section className="hero-container">
        <div className="hero-grid">
          {/* Left Column: Copy & Actions */}
          <div className="hero-left-content">
            <div className="hero-badge">
              <span style={{ fontSize: '0.6rem' }}>●</span>
              <span>AI VOICEOVER STUDIO</span>
            </div>

            <h1 className="hero-title">
              Turn Your Scripts
              <br />
              Into Powerful{' '}
              <span className="hero-title-gradient">Voices</span>
            </h1>

            <p className="hero-subhead">
              Create natural, high-quality voiceovers for your anime, videos, and content — in minutes, not days.
            </p>

            <div className="hero-cta-group">
              <button
                type="button"
                className="saas-btn-primary"
                style={{ padding: '0.8rem 1.6rem', fontSize: '0.95rem' }}
                onClick={onStartCreating}
              >
                <span>Start Creating Free</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className={`hero-demo-btn ${isPlayingDemo ? 'playing-active' : ''}`}
                onClick={toggleDemoAudio}
                title={isPlayingDemo ? 'Pause Introduction Audio' : 'Play Voxora Introduction Voiceover'}
              >
                <div className="play-circle">
                  {isPlayingDemo ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: 2 }} />}
                </div>
                <span>{isPlayingDemo ? 'Playing Intro...' : 'Watch Demo'}</span>
                <span style={{ fontSize: '0.75rem', color: isPlayingDemo ? '#0066ff' : '#94a3b8', fontWeight: 600 }}>
                  {isPlayingDemo ? '● Audio Active' : '22s'}
                </span>
              </button>
            </div>

            {/* 4 Feature Badges Row */}
            <div className="hero-feature-pills-row">
              <div className="hero-feature-item">
                <div className="hero-feature-icon">
                  <Activity size={16} />
                </div>
                <span className="hero-feature-label">AI Powered Voices</span>
              </div>

              <div className="hero-feature-item">
                <div className="hero-feature-icon">
                  <Globe2 size={16} />
                </div>
                <span className="hero-feature-label">Multiple Languages</span>
              </div>

              <div className="hero-feature-item">
                <div className="hero-feature-icon">
                  <Sparkles size={16} />
                </div>
                <span className="hero-feature-label">Instant Generation</span>
              </div>

              <div className="hero-feature-item">
                <div className="hero-feature-icon">
                  <Volume2 size={16} />
                </div>
                <span className="hero-feature-label">High Quality Audio</span>
              </div>
            </div>

            {/* Social Proof */}
            <div className="hero-social-proof">
              <div className="hero-avatar-stack">
                <img
                  src="/assets/avatars/avatar-aoi.jpg"
                  alt="Creator 1"
                  className="hero-avatar-img"
                />
                <img
                  src="/assets/avatars/avatar-ren.jpg"
                  alt="Creator 2"
                  className="hero-avatar-img"
                />
                <img
                  src="/assets/avatars/avatar-sora.jpg"
                  alt="Creator 3"
                  className="hero-avatar-img"
                />
                <img
                  src="/assets/avatars/avatar-mika.jpg"
                  alt="Creator 4"
                  className="hero-avatar-img"
                />
              </div>
              <span className="hero-social-text">
                Loved by 10,000+ creators{' '}
                <span className="hero-social-stars">★★★★★ 4.9/5</span>
              </span>
            </div>
          </div>

          {/* Right Column: Hero Visual Card */}
          <div className="hero-visual-card">
            <div className="hero-image-wrapper">
              <img
                src="/assets/voxora-hero-banner.jpg"
                alt="Anime Voice Character"
                className="hero-character-img"
              />
              <button
                type="button"
                className="hero-play-overlay-btn"
                onClick={toggleDemoAudio}
                aria-label="Play sample voiceover"
              >
                {isPlayingDemo ? <Pause size={26} /> : <Play size={26} style={{ marginLeft: 3 }} />}
              </button>
            </div>

            {/* Floating Glassmorphic Badge */}
            <div
              className={`hero-floating-glass-badge ${isPlayingDemo ? 'badge-audio-playing' : ''}`}
              onClick={toggleDemoAudio}
              style={{ cursor: 'pointer' }}
              title="Click to play / pause Voxora demo intro"
            >
              <div className="badge-wave-icon">
                {isPlayingDemo ? <Volume2 size={20} /> : <Activity size={20} />}
              </div>
              <div>
                <div className="badge-text-title">{isPlayingDemo ? 'Voxora Voice Demo' : 'Your story.'}</div>
                <div className="badge-text-sub">{isPlayingDemo ? 'Gemini 3.8 Studio TTS' : 'Our voice.'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screen 7: Why Voxora / Feature Grid */}
      <section className="why-voxora-section">
        <span className="section-tag-pill">Why Voxora</span>
        <h2 className="section-headline">
          Everything You Need for Professional Voiceovers
        </h2>
        <p className="section-subhead">
          Powerful features designed for creators, storytellers and dreamers.
        </p>

        <div className="features-2x2-grid">
          {/* Feature 1 */}
          <div className="feature-grid-card">
            <div className="feature-card-icon-wrap">
              <FileText size={22} />
            </div>
            <h3 className="feature-card-title">Script Scanner</h3>
            <p className="feature-card-desc">
              Upload & analyze anime scripts instantly with smart optical text parsing.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="feature-grid-card">
            <div className="feature-card-icon-wrap">
              <Mic size={22} />
            </div>
            <h3 className="feature-card-title">AI Voice Wave</h3>
            <p className="feature-card-desc">
              Natural & expressive voiceovers powered by Google Gemini Studio TTS.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="feature-grid-card">
            <div className="feature-card-icon-wrap">
              <Users size={22} />
            </div>
            <h3 className="feature-card-title">Multi-Speaker</h3>
            <p className="feature-card-desc">
              Multiple voices & characters in one project with distinct personalities.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="feature-grid-card">
            <div className="feature-card-icon-wrap">
              <Download size={22} />
            </div>
            <h3 className="feature-card-title">Instant WAV Export</h3>
            <p className="feature-card-desc">
              High-quality audio in one click with lossless 24kHz studio master sound.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
