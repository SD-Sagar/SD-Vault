import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VaultProvider, useVault } from './context/VaultContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import { RecentActivityPage } from './pages/RecentActivityPage';
import { TrashPage } from './pages/TrashPage';
import { VaultExplorerPage } from './pages/VaultExplorerPage';
import { AppLayout } from './layouts/AppLayout';
import { MechanicalVaultDoor } from './components/vault/MechanicalVaultDoor';
import { ReconnectBanner } from './components/common/ReconnectBanner';
import { VAULT_ANIMATION_STATES, DRIVE_CONNECTION_STATUS, AUTH_STATUS } from './constants';
import { ShieldCheck, WifiOff } from 'lucide-react';
import './App.css';

function AuthenticatedVault() {
  const { user, driveStatus, logout, reconnectDrive } = useAuth();
  const { storageQuota, searchQuery, setSearchQuery } = useVault();
  const [activeTab, setActiveTab] = useState('all');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await reconnectDrive();
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <AppLayout
      user={user}
      driveStatus={driveStatus}
      quota={storageQuota}
      onInitiateLogout={logout}
      onReconnectDrive={handleReconnect}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* Offline Alert */}
      {!isOnline && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 10,
          padding: '10px 16px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--color-vault-ruby)',
          fontSize: '0.85rem'
        }}>
          <WifiOff size={16} />
          <span>You are currently offline. Changes will resume when your internet connection is restored.</span>
        </div>
      )}

      {/* Warning banner when Google Drive token is expired */}
      {driveStatus === DRIVE_CONNECTION_STATUS.EXPIRED && (
        <ReconnectBanner
          onReconnect={handleReconnect}
          isReconnecting={isReconnecting}
        />
      )}

      {/* View routing based on activeTab */}
      {activeTab === 'settings' ? (
        <SettingsPage />
      ) : activeTab === 'recent' || activeTab === 'starred' ? (
        <RecentActivityPage view={activeTab} />
      ) : activeTab === 'trash' ? (
        <TrashPage />
      ) : (
        <VaultExplorerPage />
      )}
    </AppLayout>
  );
}

function SDVaultContent() {
  const {
    user,
    authStatus,
    vaultState,
    login,
    setVaultState
  } = useAuth();

  const isClosingTransition =
    vaultState === VAULT_ANIMATION_STATES.CLOSING ||
    vaultState === VAULT_ANIMATION_STATES.LOCKING;

  const isOpeningTransition =
    vaultState === VAULT_ANIMATION_STATES.UNLOCKING ||
    vaultState === VAULT_ANIMATION_STATES.OPENING;

  const isAuthenticated = Boolean(user) && authStatus === AUTH_STATUS.AUTHENTICATED;

  // Authenticated Vault is mounted ONLY when user is authenticated AND door is completely OPEN
  const showAuthenticatedDashboard = isAuthenticated && vaultState === VAULT_ANIMATION_STATES.OPEN;

  return (
    <div className="sd-vault-root">
      {/* Reverse closing animation overlay during sign out */}
      {isClosingTransition && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <MechanicalVaultDoor
            state={vaultState}
            onAnimationComplete={setVaultState}
          />
        </div>
      )}

      {/* Main Authenticated Dashboard */}
      {showAuthenticatedDashboard ? (
        <VaultProvider>
          <AuthenticatedVault />
        </VaultProvider>
      ) : (
        /* Vault Door and Login Terminal */
        !isClosingTransition && (
          <LoginPage
            vaultState={vaultState}
            isAuthenticated={isAuthenticated}
            onInitiateLogin={login}
            onVaultAnimationStep={setVaultState}
            isLoading={isOpeningTransition}
          />
        )
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SDVaultContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
