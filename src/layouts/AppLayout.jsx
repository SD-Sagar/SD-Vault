import React, { useState } from 'react';
import {
  Search,
  HardDrive,
  FolderLock,
  Clock,
  Star,
  Trash2,
  Settings,
  LogOut,
  Sun,
  Moon,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { DRIVE_CONNECTION_STATUS } from '../constants';
import './AppLayout.css';

export function AppLayout({
  user,
  driveStatus = DRIVE_CONNECTION_STATUS.CONNECTED,
  quota = { usedFormatted: '0 B', totalFormatted: '15 GB', percent: 0, driveUsageFormatted: '0 B', trashUsageFormatted: '0 B', totalUsageFormatted: '0 B' },
  onInitiateLogout,
  onReconnectDrive,
  activeTab = 'all',
  onSelectTab,
  searchQuery = '',
  onSearchChange,
  children
}) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <header className="app-header">
        <div className="header-left">
          <div className="brand-mini">
            <div className="brand-mini-shield">
              <img src="/favicon.svg" alt="SD-Vault Logo" style={{ width: 22, height: 22, display: 'block' }} />
            </div>
            <span className="brand-mini-name">SD-VAULT</span>
          </div>

          <div className="header-search">
            <Search size={16} className="header-search-icon" />
            <input
              type="text"
              placeholder="Search files in vault..."
              value={searchQuery}
              onChange={e => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>

        <div className="header-right">
          {/* Drive Status Badge */}
          {driveStatus === DRIVE_CONNECTION_STATUS.CONNECTED && (
            <div className="drive-status-badge connected" title="Google Drive API Connected (drive.file scope)">
              <CheckCircle2 size={13} />
              <span>Drive Active</span>
            </div>
          )}

          {driveStatus === DRIVE_CONNECTION_STATUS.EXPIRED && (
            <button
              className="drive-status-badge reconnect"
              onClick={onReconnectDrive}
              title="Click to reconnect Google Drive"
            >
              <AlertCircle size={13} />
              <span>Reconnect Drive</span>
            </button>
          )}

          {/* Storage Quota Meter */}
          <div
            className="storage-pill"
            title={`Drive: ${quota.driveUsageFormatted || quota.usedFormatted || '0 B'} / ${quota.totalFormatted || '15 GB'} (${quota.percent || 0}% used)\nTrash: ${quota.trashUsageFormatted || '0 B'}\nTotal Google Account (incl. Gmail & Photos): ${quota.totalUsageFormatted || quota.usageFormatted || '0 B'}`}
          >
            <HardDrive size={13} />
            <span>{quota.usedFormatted || '0 B'} / {quota.totalFormatted || '15 GB'}</span>
            <div className="storage-bar-mini">
              <div
                className="storage-fill-mini"
                style={{ width: `${Math.min(quota.percent || 0, 100)}%` }}
              />
            </div>
          </div>

          {/* Theme Switcher */}
          <button
            className="btn-icon"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* User Profile & Sign Out */}
          <div className="user-menu">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.email}
                className="user-avatar"
              />
            ) : (
              <div
                className="user-avatar"
                style={{
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--color-vault-gold)'
                }}
              >
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}

            <button
              className="btn-icon"
              onClick={onInitiateLogout}
              title="Secure Vault Logout (Reverse Seal)"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="app-body">
        {/* Sidebar */}
        <aside className="app-sidebar">
          <nav>
            <ul className="nav-list">
              <li>
                <button
                  className={`nav-item-btn ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => onSelectTab?.('all')}
                >
                  <FolderLock size={18} />
                  <span>Vault Files</span>
                </button>
              </li>
              <li>
                <button
                  className={`nav-item-btn ${activeTab === 'recent' ? 'active' : ''}`}
                  onClick={() => onSelectTab?.('recent')}
                >
                  <Clock size={18} />
                  <span>Recent</span>
                </button>
              </li>
              <li>
                <button
                  className={`nav-item-btn ${activeTab === 'starred' ? 'active' : ''}`}
                  onClick={() => onSelectTab?.('starred')}
                >
                  <Star size={18} />
                  <span>Starred</span>
                </button>
              </li>
              <li>
                <button
                  className={`nav-item-btn ${activeTab === 'trash' ? 'active' : ''}`}
                  onClick={() => onSelectTab?.('trash')}
                >
                  <Trash2 size={18} />
                  <span>Trash</span>
                </button>
              </li>
            </ul>
          </nav>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <button
              className={`nav-item-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => onSelectTab?.('settings')}
            >
              <Settings size={18} />
              <span>Vault Settings</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="app-content">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Phone Screens) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button
          className={`mobile-nav-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => onSelectTab?.('all')}
        >
          <FolderLock size={19} />
          <span>Files</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => onSelectTab?.('recent')}
        >
          <Clock size={19} />
          <span>Recent</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeTab === 'starred' ? 'active' : ''}`}
          onClick={() => onSelectTab?.('starred')}
        >
          <Star size={19} />
          <span>Starred</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeTab === 'trash' ? 'active' : ''}`}
          onClick={() => onSelectTab?.('trash')}
        >
          <Trash2 size={19} />
          <span>Trash</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab?.('settings')}
        >
          <Settings size={19} />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}

