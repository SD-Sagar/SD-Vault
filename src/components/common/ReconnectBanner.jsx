import React from 'react';
import { AlertTriangle, RefreshCw, KeyRound } from 'lucide-react';
import './ReconnectBanner.css';

export function ReconnectBanner({ onReconnect, isReconnecting }) {
  return (
    <aside className="reconnect-banner" role="alert" aria-label="Google Drive authorization expired">
      <div className="reconnect-banner-left">
        <div className="reconnect-banner-icon">
          <AlertTriangle size={18} />
        </div>
        <div className="reconnect-banner-text">
          <strong>Google Drive Authorization Expired (7-Day Testing Mode Limit)</strong>
          <span>Your Supabase session remains active. Reconnect Google Drive to resume reading and uploading files.</span>
        </div>
      </div>

      <div className="reconnect-banner-actions">
        <button
          className="btn-reconnect-action"
          onClick={onReconnect}
          disabled={isReconnecting}
        >
          <RefreshCw size={14} className={isReconnecting ? 'spin' : ''} />
          <span>{isReconnecting ? 'Connecting...' : 'Reconnect Google Drive'}</span>
        </button>
      </div>
    </aside>
  );
}

