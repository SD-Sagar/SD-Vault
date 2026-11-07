/**
 * Auth Controller
 * Coordinates Supabase authentication, Google token lifecycle, and vault animation sequencing.
 */

import { supabaseService } from '../services/supabaseService';
import { googleAuthService } from '../services/googleAuthService';
import { googleTokenService } from '../services/googleTokenService';
import { AUTH_STATUS, DRIVE_CONNECTION_STATUS, VAULT_ANIMATION_STATES } from '../constants';
import { validateEnv } from '../config/env';

export const authController = {
  /**
   * Restores user session and checks Google Drive authorization status
   */
  async restoreSession() {
    const { isConfigured } = validateEnv();
    if (!isConfigured) {
      return {
        user: null,
        authStatus: AUTH_STATUS.UNAUTHENTICATED,
        driveStatus: DRIVE_CONNECTION_STATUS.NOT_CONNECTED,
        vaultState: VAULT_ANIMATION_STATES.LOCKED
      };
    }

    const isCallback = googleAuthService.hasOAuthCallbackInUrl();

    // 1. Safely extract any provider_token in URL without wiping out Supabase parameters
    googleAuthService.extractTokensFromUrl();

    // 2. Fetch Supabase session
    const { session, error } = await supabaseService.getSession();

    if (error || !session) {
      // If there's an active OAuth callback in the URL, don't immediately clear;
      // onAuthStateChange will fire momentarily with the exchanged session.
      if (!isCallback) {
        googleTokenService.clearToken();
      }

      return {
        user: null,
        authStatus: isCallback ? AUTH_STATUS.CHECKING : AUTH_STATUS.UNAUTHENTICATED,
        driveStatus: DRIVE_CONNECTION_STATUS.NOT_CONNECTED,
        vaultState: VAULT_ANIMATION_STATES.LOCKED
      };
    }

    const user = session.user;

    // 3. Extract or restore Google Drive provider token
    if (session.provider_token) {
      googleTokenService.setToken(session.provider_token, session.expires_in || 3600);
    }

    const token = googleTokenService.getAccessToken();

    let driveStatus = DRIVE_CONNECTION_STATUS.NOT_CONNECTED;
    if (token) {
      const isAlive = await googleTokenService.verifyTokenAlive(token);
      driveStatus = isAlive ? DRIVE_CONNECTION_STATUS.CONNECTED : DRIVE_CONNECTION_STATUS.EXPIRED;
    } else {
      driveStatus = DRIVE_CONNECTION_STATUS.EXPIRED;
    }

    // Clean URL now that session has been verified
    googleAuthService.cleanUrlAfterAuth();

    return {
      user,
      authStatus: AUTH_STATUS.AUTHENTICATED,
      driveStatus,
      // If returning from Google OAuth, play the cinematic vault door unlocking sequence!
      // If restored from existing storage, open immediately.
      vaultState: isCallback ? VAULT_ANIMATION_STATES.UNLOCKING : VAULT_ANIMATION_STATES.OPEN
    };
  },

  /**
   * Initiates Google Sign-In with Drive scope
   */
  async initiateLogin() {
    const { isConfigured, missingKeys } = validateEnv();
    if (!isConfigured) {
      throw new Error(`Please configure your .env file first with: ${missingKeys.join(', ')}`);
    }

    return await googleAuthService.signInWithGoogle({ isReconnect: false });
  },

  /**
   * Reconnects Google Drive without signing out of Supabase
   */
  async reconnectDrive() {
    return await googleAuthService.reconnectGoogleDrive();
  },

  /**
   * Initiates Logout with reverse vault door closing sequence
   */
  async initiateLogout({ setVaultState, onComplete }) {
    setVaultState(VAULT_ANIMATION_STATES.CLOSING);
    googleTokenService.clearToken();
    await supabaseService.signOut();
  }
};
