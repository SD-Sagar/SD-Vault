/**
 * Google Auth Service
 * Coordinates Supabase Google OAuth, Drive Scope requesting, and Provider Token extraction.
 */

import { supabaseService } from './supabaseService';
import { googleTokenService } from './googleTokenService';
import { GOOGLE_DRIVE } from '../constants';
import { ENV } from '../config/env';

export const googleAuthService = {
  /**
   * Initiates Google OAuth with drive.file scope and offline access
   * @param {Object} options
   * @param {boolean} options.isReconnect - Whether this is a reconnect without signing out of Supabase
   */
  async signInWithGoogle({ isReconnect = false } = {}) {
    const client = supabaseService.getClient();
    if (!client) {
      throw new Error('Supabase is not configured. Please check your .env file.');
    }

    sessionStorage.setItem('sd_vault_pending_oauth', 'true');
    if (isReconnect) {
      sessionStorage.setItem('sd_vault_is_reconnecting', 'true');
    }

    const redirectTo = ENV.APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: GOOGLE_DRIVE.SCOPE,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        },
        redirectTo
      }
    });

    if (error) {
      sessionStorage.removeItem('sd_vault_pending_oauth');
      sessionStorage.removeItem('sd_vault_is_reconnecting');
      console.error('[googleAuthService] signInWithOAuth failed:', error);
      throw error;
    }

    return data;
  },

  /**
   * Reconnects Google Drive authorization while keeping the existing Supabase session intact
   */
  async reconnectGoogleDrive() {
    return this.signInWithGoogle({ isReconnect: true });
  },

  /**
   * Checks if URL currently contains OAuth callback parameters (hash or query)
   */
  hasOAuthCallbackInUrl() {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash;
    const search = window.location.search;
    return (
      hash.includes('access_token=') ||
      hash.includes('provider_token=') ||
      search.includes('code=') ||
      sessionStorage.getItem('sd_vault_pending_oauth') === 'true'
    );
  },

  /**
   * Extracts provider_token safely WITHOUT wiping out Supabase's access_token/code before Supabase reads it
   */
  extractTokensFromUrl() {
    if (typeof window === 'undefined') return { providerToken: null, isReconnect: false };

    let providerToken = null;
    const isReconnect = sessionStorage.getItem('sd_vault_is_reconnecting') === 'true';

    // 1. Check URL Hash (e.g. #access_token=...&provider_token=...)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      providerToken = hashParams.get('provider_token');

      if (providerToken) {
        googleTokenService.setToken(providerToken, 3600);
      }
    }

    // 2. Check query params if provider_token is passed directly
    if (!providerToken && window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      providerToken = searchParams.get('provider_token');

      if (providerToken) {
        googleTokenService.setToken(providerToken, 3600);
      }
    }

    return { providerToken, isReconnect };
  },

  /**
   * Cleans OAuth parameters from the browser address bar AFTER Supabase has established the session
   */
  cleanUrlAfterAuth() {
    sessionStorage.removeItem('sd_vault_pending_oauth');
    sessionStorage.removeItem('sd_vault_is_reconnecting');

    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      // Only clean if there were auth params in hash or query
      if (window.location.hash || window.location.search.includes('code=')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }
};
