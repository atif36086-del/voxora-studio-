'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, Sparkles, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on load
    inputRef.current?.focus();
  }, []);

  const handleVerify = async (pinToTest: string) => {
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToTest }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Success: Redirect to home page
        window.location.href = '/';
      } else {
        setError(data.error || 'Incorrect PIN. Please try again.');
        setPin('');
        inputRef.current?.focus();
      }
    } catch {
      setError('Connection failed. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (loading) return;
    if (val === 'backspace') {
      setPin((prev) => prev.slice(0, -1));
      setError('');
      return;
    }

    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        handleVerify(newPin);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
    setError('');
    if (val.length === 4) {
      handleVerify(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4) {
      handleVerify(pin);
    } else {
      setError('Please enter a 4-digit PIN');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 50%, #020617 100%)',
        color: '#f8fafc',
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '24px',
          padding: '2.25rem 1.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Glowing Badge */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Lock size={32} color="#ffffff" />
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            margin: '0 0 0.5rem 0',
            background: 'linear-gradient(to right, #ffffff, #c7d2fe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          VOXORA STUDIO
        </h1>
        <p
          style={{
            fontSize: '0.9rem',
            color: '#94a3b8',
            margin: '0 0 1.75rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <ShieldCheck size={16} color="#818cf8" /> Private Access • Enter 4-Digit PIN
        </p>

        {/* Invisible Input for real keyboard */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={handleInputChange}
            style={{
              position: 'absolute',
              opacity: 0,
              pointerEvents: 'none',
              height: 0,
              width: 0,
            }}
          />

          {/* 4 Pin Dots Box */}
          <div
            onClick={() => inputRef.current?.focus()}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '1.75rem',
              cursor: 'pointer',
            }}
          >
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    border: isFilled
                      ? '2px solid #818cf8'
                      : '2px solid rgba(148, 163, 184, 0.2)',
                    background: isFilled
                      ? 'rgba(99, 102, 241, 0.15)'
                      : 'rgba(30, 41, 59, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isFilled
                      ? '0 0 15px rgba(99, 102, 241, 0.35)'
                      : 'none',
                  }}
                >
                  {isFilled ? '•' : ''}
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                color: '#f87171',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '0.6rem 0.8rem',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* On-Screen Numeric Keypad for Mobile Convenience */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              width: '100%',
              marginBottom: '1.5rem',
            }}
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => {
              const isAction = key === 'C' || key === '⌫';
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === 'C') {
                      setPin('');
                      setError('');
                    } else if (key === '⌫') {
                      handleKeypadPress('backspace');
                    } else {
                      handleKeypadPress(key);
                    }
                  }}
                  style={{
                    height: '52px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: isAction
                      ? 'rgba(30, 41, 59, 0.5)'
                      : 'rgba(30, 41, 59, 0.8)',
                    color: isAction ? '#94a3b8' : '#f8fafc',
                    fontSize: isAction ? '1rem' : '1.35rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    userSelect: 'none',
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = isAction
                      ? 'rgba(30, 41, 59, 0.5)'
                      : 'rgba(30, 41, 59, 0.8)';
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = isAction
                      ? 'rgba(30, 41, 59, 0.5)'
                      : 'rgba(30, 41, 59, 0.8)';
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || pin.length < 4}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '14px',
              border: 'none',
              background:
                pin.length === 4
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(99, 102, 241, 0.3)',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: pin.length === 4 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow:
                pin.length === 4
                  ? '0 10px 25px rgba(99, 102, 241, 0.4)'
                  : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? (
              <span>Verifying...</span>
            ) : (
              <>
                <span>Unlock Studio</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p
          style={{
            fontSize: '0.75rem',
            color: '#64748b',
            marginTop: '1.25rem',
            marginBottom: 0,
          }}
        >
          Protected Session • Auto-saved on your device
        </p>
      </div>
    </div>
  );
}
