import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lock, HardDrive, KeyRound, Sun, Moon, AlertTriangle, Play, RotateCcw, X, ShieldCheck } from 'lucide-react';
import { MechanicalVaultDoor, playVaultAcoustics } from '../components/vault/MechanicalVaultDoor';
import { VAULT_ANIMATION_STATES } from '../constants';
import { useTheme } from '../hooks/useTheme';
import { validateEnv } from '../config/env';
import './LoginPage.css';

export function LoginPage({
  vaultState,
  isAuthenticated = false,
  onInitiateLogin,
  onVaultAnimationStep,
  isLoading
}) {
  const { isDark, toggleTheme } = useTheme();
  const envStatus = validateEnv();

  // Terminal popup visibility (defaults to false so the user beholds the locked vault door first)
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const autoHideTimerRef = useRef(null);

  // Check if returning from successful OAuth waiting for decompression
  const isPostAuthReady =
    isAuthenticated &&
    vaultState === VAULT_ANIMATION_STATES.LOCKED &&
    typeof window !== 'undefined' &&
    sessionStorage.getItem('sd_vault_play_unlock_anim') === 'true';

  // 10-second auto-hide timer for terminal overlay
  const resetAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
    }
    autoHideTimerRef.current = setTimeout(() => {
      setIsTerminalOpen(false);
    }, 10000);
  }, []);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, []);

  // When user clicks anywhere on the locked vault door
  const handleDoorClick = () => {
    if (isPostAuthReady) {
      handleTriggerDecompression();
      return;
    }
    if (vaultState === VAULT_ANIMATION_STATES.LOCKED) {
      setIsTerminalOpen(prev => !prev);
      resetAutoHideTimer();
    }
  };

  const handleCloseTerminal = (e) => {
    e?.stopPropagation();
    setIsTerminalOpen(false);
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
  };

  // Safe Preview Simulation: Door opens, displays inside preview, and relocks gracefully
  const handleStartPreview = () => {
    setIsTerminalOpen(false);
    setIsPreviewActive(true);
    onVaultAnimationStep(VAULT_ANIMATION_STATES.UNLOCKING);
  };

  const handleRelockPreview = () => {
    onVaultAnimationStep(VAULT_ANIMATION_STATES.CLOSING);
    setTimeout(() => {
      setIsPreviewActive(false);
    }, 2800);
  };

  // Initiating Google login
  const handleLoginClick = () => {
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    onInitiateLogin();
  };

  // Decompress vault after OAuth with user gesture to guarantee Web Audio starts at full volume
  const handleTriggerDecompression = () => {
    playVaultAcoustics('hydraulic_disengage');
    onVaultAnimationStep(VAULT_ANIMATION_STATES.UNLOCKING);
  };

  return (
    <div className="login-container">
      {/* Top Bar */}
      <header className="login-header">
        <div className="brand-badge">
          <div className="brand-icon-shield">
            <img src="/favicon.svg" alt="SD-Vault" style={{ width: 28, height: 28, display: 'block' }} />
          </div>
          <div className="brand-text">
            <h1>SD-VAULT</h1>
            <span>Zero-Knowledge BYOS</span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-secondary)',
            padding: '8px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Center Stage: The Mechanical Vault Door */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <MechanicalVaultDoor
          state={vaultState}
          onAnimationComplete={onVaultAnimationStep}
          onDoorClick={handleDoorClick}
        >
          {/* Content revealed inside illuminated tunnel during simulation */}
          {isPreviewActive && vaultState === VAULT_ANIMATION_STATES.OPEN && (
            <div className="vault-demo-portal">
              <span className="demo-badge">DECOMPRESSION COMPLETE</span>
              <h3 style={{ color: 'var(--color-vault-gold)', margin: '8px 0', fontSize: '1.25rem' }}>
                SD-Vault Core Access
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', maxWidth: 300, textAlign: 'center', lineHeight: 1.4 }}>
                Private Google Drive storage is air-gapped until operator authentication is confirmed.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  className="toolbar-btn toolbar-btn-primary"
                  onClick={handleLoginClick}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Authenticate Now
                </button>
                <button
                  className="toolbar-btn"
                  onClick={handleRelockPreview}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <RotateCcw size={14} /> Seal Door
                </button>
              </div>
            </div>
          )}
        </MechanicalVaultDoor>

        {/* Post-OAuth Unseal Trigger (Guarantees user gesture for Web Audio playback) */}
        {isPostAuthReady && (
          <div
            className="vault-unseal-prompt"
            onClick={handleTriggerDecompression}
            role="button"
            tabIndex={0}
            aria-label="Credentials verified. Click to unseal vault"
          >
            <div className="unseal-badge-icon">
              <ShieldCheck size={22} color="var(--color-vault-gold)" />
            </div>
            <div className="unseal-badge-text">
              <span className="unseal-sub-title">CREDENTIALS VERIFIED</span>
              <span className="unseal-main-title">TAP TO UNSEAL VAULT</span>
            </div>
          </div>
        )}

        {/* Ambient Tap Hit Area over locked door center (Invisible/Transparent) */}
        {vaultState === VAULT_ANIMATION_STATES.LOCKED && !isTerminalOpen && !isPostAuthReady && (
          <div
            className="vault-tap-prompt"
            onClick={handleDoorClick}
            role="button"
            tabIndex={0}
            aria-label="Tap vault door to access terminal"
          />
        )}

        {/* Floating Auth Terminal Overlay when tapped */}
        {vaultState === VAULT_ANIMATION_STATES.LOCKED && isTerminalOpen && (
          <div
            className="login-overlay-wrapper"
            onMouseMove={resetAutoHideTimer}
            onClick={resetAutoHideTimer}
            onKeyDown={resetAutoHideTimer}
          >
            <div className="login-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="login-card-badge">
                  <Lock size={12} />
                  <span>Security Clearance Required</span>
                </div>
                <button
                  onClick={handleCloseTerminal}
                  className="terminal-close-btn"
                  title="Close Terminal (or auto-hides in 10s)"
                  aria-label="Close Terminal"
                >
                  <X size={16} />
                </button>
              </div>

              <h2 className="login-card-title">Access Secure Vault</h2>
              <p className="login-card-desc">
                Bring-Your-Own-Storage client connected directly to your Google Drive. Supabase metadata with Row Level Security.
              </p>

              <button
                className="btn-google-auth"
                onClick={handleLoginClick}
                disabled={isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {isLoading ? 'Unlocking Vault...' : 'Sign in with Google Drive'}
              </button>

              {!envStatus.isConfigured && (
                <div className="env-warning-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontWeight: 700 }}>
                    <AlertTriangle size={14} />
                    <span>Configuration Pending in .env</span>
                  </div>
                  <div>
                    Missing: {envStatus.missingKeys.join(', ')}
                  </div>
                  <div style={{ marginTop: 4, opacity: 0.85 }}>
                    Enter your Supabase URL & Key in <code>.env</code> to enable live OAuth. You can test the door mechanics below!
                  </div>
                </div>
              )}

              <div className="features-pill-row">
                <span className="feature-pill"><HardDrive size={12} /> BYO Storage</span>
                <span className="feature-pill"><KeyRound size={12} /> drive.file Scope</span>
                <span className="feature-pill"><ShieldCheck size={12} /> Zero Backend</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simulator bar for interactive testing */}
      <footer className="anim-demo-bar">
        <span>Vault Door Controls:</span>
        {vaultState === VAULT_ANIMATION_STATES.LOCKED && (
          <button
            className="btn-demo-trigger"
            onClick={handleStartPreview}
          >
            <Play size={12} style={{ display: 'inline', marginRight: 4 }} />
            Preview Unlock Sequence
          </button>
        )}
        {vaultState === VAULT_ANIMATION_STATES.OPEN && isPreviewActive && (
          <button
            className="btn-demo-trigger"
            onClick={handleRelockPreview}
          >
            <RotateCcw size={12} style={{ display: 'inline', marginRight: 4 }} />
            Seal Vault Door
          </button>
        )}
        <span style={{ opacity: 0.6 }}>State: {vaultState}</span>
      </footer>
    </div>
  );
}
