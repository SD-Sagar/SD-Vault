import React, { useEffect, useMemo, useRef } from 'react';
import { VAULT_ANIMATION_STATES } from '../../constants';
import './MechanicalVaultDoor.css';

/**
 * Enhanced Web Audio API Heavy Industrial Sound Synthesizer
 * Generates cinematic hydraulic clenches, pneumatic steam releases, track rumbles, and massive iron blast slams.
 */
export function playVaultAcoustics(action) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    if (action === 'hydraulic_disengage') {
      // 1. Heavy mechanical sub-bass clank
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(24, now + 0.45);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);

      // 2. Motorized servo gear whine
      const servoOsc = ctx.createOscillator();
      const servoGain = ctx.createGain();
      servoOsc.type = 'sawtooth';
      servoOsc.frequency.setValueAtTime(180, now + 0.05);
      servoOsc.frequency.linearRampToValueAtTime(320, now + 0.5);
      servoGain.gain.setValueAtTime(0.12, now + 0.05);
      servoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      servoOsc.connect(servoGain);
      servoGain.connect(ctx.destination);
      servoOsc.start(now + 0.05);
      servoOsc.stop(now + 0.5);

      // 3. High pressure steam release hiss
      const bufferSize = Math.floor(ctx.sampleRate * 0.55);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now + 0.08);
      filter.frequency.exponentialRampToValueAtTime(650, now + 0.55);
      filter.Q.value = 3.0;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, now + 0.08);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now + 0.08);
    } else if (action === 'track_roll') {
      // Deep mechanical rumbling of iron wheels on steel track
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(42, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.7);
      osc.frequency.linearRampToValueAtTime(32, now + 1.4);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.4);

      // Rail friction resonance
      const oscFriction = ctx.createOscillator();
      const frictionGain = ctx.createGain();
      oscFriction.type = 'sine';
      oscFriction.frequency.setValueAtTime(560, now + 0.2);
      oscFriction.frequency.linearRampToValueAtTime(480, now + 0.8);
      frictionGain.gain.setValueAtTime(0.06, now + 0.2);
      frictionGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      oscFriction.connect(frictionGain);
      frictionGain.connect(ctx.destination);
      oscFriction.start(now + 0.2);
      oscFriction.stop(now + 0.9);
    } else if (action === 'heavy_slam') {
      // Massive iron blast door slamming home into bulkhead
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);

      // Mechanical bolt latch clicks
      const boltOsc = ctx.createOscillator();
      const boltGain = ctx.createGain();
      boltOsc.type = 'triangle';
      boltOsc.frequency.setValueAtTime(820, now + 0.04);
      boltOsc.frequency.setValueAtTime(640, now + 0.12);
      boltGain.gain.setValueAtTime(0.3, now + 0.04);
      boltGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      boltOsc.connect(boltGain);
      boltGain.connect(ctx.destination);
      boltOsc.start(now + 0.04);
      boltOsc.stop(now + 0.25);

      // Metal ring reverberation decay
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(360, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(80, now + 0.55);
      gain2.gain.setValueAtTime(0.25, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.55);
    }
  } catch {
    // AudioContext blocked or not supported
  }
}

export function MechanicalVaultDoor({
  state = VAULT_ANIMATION_STATES.LOCKED,
  onAnimationComplete,
  onDoorClick,
  children
}) {
  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Map state to CSS class
  const doorStateClass = useMemo(() => {
    switch (state) {
      case VAULT_ANIMATION_STATES.LOCKED: return 'state-locked';
      case VAULT_ANIMATION_STATES.UNLOCKING: return 'state-unlocking';
      case VAULT_ANIMATION_STATES.OPENING: return 'state-opening';
      case VAULT_ANIMATION_STATES.OPEN: return 'state-open';
      case VAULT_ANIMATION_STATES.CLOSING: return 'state-closing';
      case VAULT_ANIMATION_STATES.LOCKING: return 'state-locking';
      default: return 'state-locked';
    }
  }, [state]);

  const isLightBloomActive =
    state === VAULT_ANIMATION_STATES.OPENING ||
    state === VAULT_ANIMATION_STATES.OPEN ||
    state === VAULT_ANIMATION_STATES.CLOSING;

  // Sound triggers
  useEffect(() => {
    if (state === VAULT_ANIMATION_STATES.UNLOCKING) {
      playVaultAcoustics('hydraulic_disengage');
    } else if (state === VAULT_ANIMATION_STATES.OPENING) {
      playVaultAcoustics('track_roll');
    } else if (state === VAULT_ANIMATION_STATES.CLOSING) {
      playVaultAcoustics('track_roll');
    } else if (state === VAULT_ANIMATION_STATES.LOCKING) {
      playVaultAcoustics('heavy_slam');
    }
  }, [state]);

  // Timed state machine transitions (cinematic Fallout-inspired mechanical sequence)
  useEffect(() => {
    let timer;
    if (state === VAULT_ANIMATION_STATES.UNLOCKING) {
      // 1. Unlocking (Hydraulic clamp disengages & door unmeshes) -> transitions to OPENING
      timer = setTimeout(() => {
        onAnimationComplete?.(VAULT_ANIMATION_STATES.OPENING);
      }, 1150);
    } else if (state === VAULT_ANIMATION_STATES.OPENING) {
      // 2. Door rolls along monorail track -> transitions to OPEN
      timer = setTimeout(() => {
        onAnimationComplete?.(VAULT_ANIMATION_STATES.OPEN);
      }, 1750);
    } else if (state === VAULT_ANIMATION_STATES.CLOSING) {
      // 3. Reverse on logout: Door rolls back over opening -> transitions to LOCKING
      timer = setTimeout(() => {
        onAnimationComplete?.(VAULT_ANIMATION_STATES.LOCKING);
      }, 1550);
    } else if (state === VAULT_ANIMATION_STATES.LOCKING) {
      // 4. Door rams forward into bulkhead frame -> transitions to LOCKED
      timer = setTimeout(() => {
        onAnimationComplete?.(VAULT_ANIMATION_STATES.LOCKED);
      }, 950);
    }

    return () => clearTimeout(timer);
  }, [state, onAnimationComplete]);

  // HUD LED and label
  const hudStatus = useMemo(() => {
    switch (state) {
      case VAULT_ANIMATION_STATES.OPEN:
        return { led: 'emerald', label: 'VAULT ACCESS GRANTED • DECOMPRESSION COMPLETE' };
      case VAULT_ANIMATION_STATES.UNLOCKING:
        return { led: 'amber', label: 'DISENGAGING HYDRAULIC CLAMPS • STAND CLEAR' };
      case VAULT_ANIMATION_STATES.OPENING:
        return { led: 'amber', label: 'TRAVERSING MONORAIL TRACK' };
      case VAULT_ANIMATION_STATES.CLOSING:
        return { led: 'amber', label: 'ROLLING BLAST DOOR • CLEAR PORTAL' };
      case VAULT_ANIMATION_STATES.LOCKING:
        return { led: 'amber', label: 'ENGAGING COG TEETH • SEALING BULKHEAD' };
      default:
        return { led: 'red', label: 'VAULT SEALED • SECURITY LEVEL 5' };
    }
  }, [state]);

  const isDoorInteractive = state === VAULT_ANIMATION_STATES.LOCKED;

  return (
    <div className="vault-stage">
      <div className="vault-backdrop-grid" />

      {/* Main Bulkhead Housing */}
      <div className="vault-bulkhead-frame">
        {/* Overhead Monorail Track */}
        <div className="vault-monorail-track">
          <div className="track-teeth" />
        </div>

        {/* Illuminated Tunnel Interior */}
        <div className="vault-interior-tunnel">
          <div className={`tunnel-light-bloom ${isLightBloomActive ? 'active' : ''}`} />
          {children}
        </div>

        {/* The Massive Cog Gear Blast Door (Matches the official SD-Vault logo vector geometry) */}
        <div
          className={`vault-cog-door ${doorStateClass} ${isDoorInteractive ? 'door-interactive' : ''}`}
          onClick={isDoorInteractive ? onDoorClick : undefined}
          role={isDoorInteractive ? 'button' : undefined}
          tabIndex={isDoorInteractive ? 0 : -1}
          aria-label={isDoorInteractive ? 'Click to open vault access terminal' : undefined}
          title={isDoorInteractive ? 'Click or tap door to authenticate' : undefined}
          aria-hidden={state === VAULT_ANIMATION_STATES.OPEN}
        >
          {/* Steam particle effects */}
          <div className="steam-puff" style={{ top: '15%', left: '20%' }} />
          <div className="steam-puff" style={{ bottom: '18%', right: '22%' }} />

          {/* Authentic Vector Vault Blast Door */}
          <svg
            className="vault-door-svg"
            viewBox="0 0 512 512"
            width="100%"
            height="100%"
          >
            <defs>
              <linearGradient id="vaultDoorGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>

              <linearGradient id="vaultDoorSteel" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0b0f17" />
              </linearGradient>

              <radialGradient id="vaultDoorCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="65%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>

              <linearGradient id="vaultDoorTeeth" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>

              <filter id="vaultDoorDepth" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000000" floodOpacity="0.85" />
              </filter>
            </defs>

            <g filter="url(#vaultDoorDepth)" transform="translate(256, 256)">
              {/* 12 Industrial Vault Cog Teeth */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => (
                <path
                  key={angle}
                  d="M-22,-242 L22,-242 L18,-205 L-18,-205 Z"
                  fill="url(#vaultDoorTeeth)"
                  transform={`rotate(${angle})`}
                />
              ))}

              {/* Heavy Outer Blast Ring (Steel with Gold border) */}
              <circle cx="0" cy="0" r="215" fill="url(#vaultDoorSteel)" stroke="url(#vaultDoorGold)" strokeWidth="12" />

              {/* Hazard Ring with subtle grooves */}
              <circle cx="0" cy="0" r="185" fill="none" stroke="#050811" strokeWidth="8" strokeDasharray="24 16" />

              {/* Inner Armor Bulkhead */}
              <circle cx="0" cy="0" r="165" fill="url(#vaultDoorCore)" stroke="url(#vaultDoorGold)" strokeWidth="5" />

              {/* 8 Heavy Industrial Hex Bolts */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
                const rad = (deg * Math.PI) / 180;
                const bx = 138 * Math.cos(rad);
                const by = 138 * Math.sin(rad);
                return (
                  <circle
                    key={deg}
                    cx={bx}
                    cy={by}
                    r="9"
                    fill="#0f172a"
                    stroke="#fbbf24"
                    strokeWidth="3"
                  />
                );
              })}

              {/* Structural Cross Braces */}
              <line x1="-150" y1="0" x2="150" y2="0" stroke="rgba(245, 185, 76, 0.25)" strokeWidth="4" />
              <line x1="0" y1="-150" x2="0" y2="150" stroke="rgba(245, 185, 76, 0.25)" strokeWidth="4" />

              {/* Central Wheel Hub Rim */}
              <circle cx="0" cy="0" r="108" fill="#070a10" stroke="url(#vaultDoorGold)" strokeWidth="6" />

              {/* Central "SD" Monogram Typography */}
              <text
                x="0"
                y="26"
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
                fontSize="90"
                fontWeight="900"
                letterSpacing="2"
                fill="url(#vaultDoorGold)"
              >SD</text>

              {/* Subtitle Vault Arc text */}
              <text
                x="0"
                y="74"
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
                fontSize="20"
                fontWeight="800"
                letterSpacing="6"
                fill="#94a3b8"
              >VAULT</text>
            </g>
          </svg>
        </div>

        {/* Status HUD */}
        <div className="vault-status-hud">
          <div className={`vault-hud-led ${hudStatus.led}`} />
          <span className="vault-hud-title">{hudStatus.label}</span>
        </div>
      </div>
    </div>
  );
}
