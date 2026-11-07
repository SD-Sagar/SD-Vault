import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  Lock,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { googleTokenService } from '../services/googleTokenService';
import { DRIVE_CONNECTION_STATUS, GOOGLE_DRIVE } from '../constants';
import './SettingsPage.css';

export function SettingsPage() {
  const { user, driveStatus, reconnectDrive } = useAuth();
  const [tokenLifespan, setTokenLifespan] = useState(() => googleTokenService.getRemainingLifespan());
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTokenLifespan(googleTokenService.getRemainingLifespan());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualReconnect = async () => {
    setIsReconnecting(true);
    try {
      await reconnectDrive();
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Vault Security & Connection Settings</h2>
        <p>Manage Supabase authentication, Google Drive tokens, and storage permissions.</p>
      </div>

      <div className="settings-grid">
        {/* Google Drive Status Card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <HardDrive size={20} />
            </div>
            <div>
              <h3>Google Drive Connection</h3>
              <span>Provider storage authorization</span>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="status-row">
              <span className="label">Status:</span>
              {driveStatus === DRIVE_CONNECTION_STATUS.CONNECTED ? (
                <span className="badge badge-success">
                  <CheckCircle2 size={13} /> Active & Connected
                </span>
              ) : driveStatus === DRIVE_CONNECTION_STATUS.EXPIRED ? (
                <span className="badge badge-warning">
                  <AlertTriangle size={13} /> Authorization Expired
                </span>
              ) : (
                <span className="badge badge-muted">Not Connected</span>
              )}
            </div>

            <div className="status-row">
              <span className="label">Access Token Lifespan:</span>
              <span className="value font-mono">{tokenLifespan.text}</span>
            </div>

            <div className="status-row">
              <span className="label">Active Scope:</span>
              <span className="value font-mono" style={{ fontSize: '0.78rem' }}>{GOOGLE_DRIVE.SCOPE}</span>
            </div>

            <div className="status-row">
              <span className="label">Root Folder:</span>
              <span className="value font-mono">Google Drive / {GOOGLE_DRIVE.ROOT_FOLDER_NAME}</span>
            </div>

            <div className="notice-box">
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-vault-gold)' }} />
                <p>
                  <strong>Google External Testing Mode:</strong> Refresh tokens expire after 7 days.
                  When authorization expires, click <strong>Reconnect</strong> to obtain fresh credentials.
                  Your Supabase user session will not be interrupted.
                </p>
              </div>
            </div>

            <button
              className="btn-settings-action"
              onClick={handleManualReconnect}
              disabled={isReconnecting}
            >
              <RefreshCw size={14} className={isReconnecting ? 'spin' : ''} />
              <span>{isReconnecting ? 'Connecting...' : 'Reconnect Google Drive'}</span>
            </button>
          </div>
        </div>

        {/* Supabase Account Card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Shield size={20} />
            </div>
            <div>
              <h3>Supabase Authentication</h3>
              <span>Session & Row-Level Security</span>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="status-row">
              <span className="label">Account Email:</span>
              <span className="value">{user?.email || 'operator@sd-vault.internal'}</span>
            </div>

            <div className="status-row">
              <span className="label">User ID:</span>
              <span className="value font-mono" style={{ fontSize: '0.78rem' }}>
                {user?.id || 'demo-session-operator'}
              </span>
            </div>

            <div className="status-row">
              <span className="label">Auth Provider:</span>
              <span className="value">Google (Supabase Federated)</span>
            </div>

            <div className="status-row">
              <span className="label">Security Architecture:</span>
              <span className="value">BYOS Zero-Backend</span>
            </div>

            <div className="notice-box" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <UserCheck size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-vault-emerald)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  <strong>Client-Side Vault Isolation:</strong> All file binary payloads stream directly between your browser and Google Drive API. No third-party server intercepts your vault contents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

