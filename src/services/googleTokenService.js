/**
 * Google Token Service
 * Manages Google Drive provider tokens, expiration calculations, and token validation.
 * Complies with strict security rules:
 * - Never stores sensitive refresh tokens in localStorage
 * - Stores session-scoped access token in memory / sessionStorage
 * - Detects 1-hour access token expiration and 7-day Testing mode expiration
 */

import { DRIVE_CONNECTION_STATUS } from '../constants';

// In-memory token cache
let currentAccessToken = null;
let tokenExpiresAt = 0; // Epoch timestamp in ms
let statusListeners = new Set();

const SESSION_TOKEN_KEY = 'sd_vault_google_at';
const SESSION_EXPIRY_KEY = 'sd_vault_google_exp';

export const googleTokenService = {
  /**
   * Initialize tokens from session storage if available
   */
  initFromSession() {
    try {
      const storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
      const storedExp = sessionStorage.getItem(SESSION_EXPIRY_KEY);

      if (storedToken && storedExp) {
        const expMs = parseInt(storedExp, 10);
        // Only accept if at least 60 seconds are left
        if (expMs > Date.now() + 60000) {
          currentAccessToken = storedToken;
          tokenExpiresAt = expMs;
          return { token: currentAccessToken, isValid: true };
        }
      }
    } catch {
      // Session storage unavailable or restricted
    }
    return { token: null, isValid: false };
  },

  /**
   * Set and securely retain the Google access token in memory and sessionStorage
   * @param {string} token 
   * @param {number} expiresInSeconds (defaults to 3600 seconds)
   */
  setToken(token, expiresInSeconds = 3600) {
    if (!token) return;
    currentAccessToken = token;
    // Calculate expiration with a 2-minute safety margin
    tokenExpiresAt = Date.now() + (expiresInSeconds - 120) * 1000;

    try {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      sessionStorage.setItem(SESSION_EXPIRY_KEY, tokenExpiresAt.toString());
    } catch {
      // Ignore sessionStorage errors
    }

    this.notifyStatus(DRIVE_CONNECTION_STATUS.CONNECTED);
  },

  /**
   * Returns the current access token if it has not expired
   * @returns {string|null}
   */
  getAccessToken() {
    if (!currentAccessToken) {
      // Try restoring from sessionStorage
      const { token, isValid } = this.initFromSession();
      if (!isValid) return null;
      return token;
    }

    // Check expiration
    if (Date.now() >= tokenExpiresAt) {
      console.warn('[googleTokenService] Google Drive access token has expired.');
      this.clearToken();
      this.notifyStatus(DRIVE_CONNECTION_STATUS.EXPIRED);
      return null;
    }

    return currentAccessToken;
  },

  /**
   * Returns remaining token lifespan in human-readable format
   */
  getRemainingLifespan() {
    if (!tokenExpiresAt || Date.now() >= tokenExpiresAt) {
      return { expired: true, minutesLeft: 0, text: 'Expired' };
    }
    const msLeft = tokenExpiresAt - Date.now();
    const minutesLeft = Math.floor(msLeft / 60000);
    return {
      expired: false,
      minutesLeft,
      text: `${minutesLeft} min remaining`
    };
  },

  /**
   * Verifies whether the access token is valid by querying the Google Drive about endpoint
   * @param {string} [token]
   * @returns {Promise<boolean>}
   */
  async verifyTokenAlive(token) {
    const at = token || this.getAccessToken();
    if (!at) return false;

    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          Authorization: `Bearer ${at}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        console.warn('[googleTokenService] Google API responded with authorization failure:', response.status);
        this.clearToken();
        this.notifyStatus(DRIVE_CONNECTION_STATUS.EXPIRED);
        return false;
      }

      return response.ok;
    } catch (e) {
      console.warn('[googleTokenService] Network error checking Google token:', e);
      // In offline / network glitch, don't immediately revoke if token hasn't locally expired
      return Date.now() < tokenExpiresAt;
    }
  },

  /**
   * Clears Google token from memory and session storage
   */
  clearToken() {
    currentAccessToken = null;
    tokenExpiresAt = 0;
    try {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_EXPIRY_KEY);
    } catch {
      // Ignore
    }
  },

  /**
   * Subscribe to token / connection status changes
   */
  subscribeStatus(listener) {
    statusListeners.add(listener);
    return () => statusListeners.delete(listener);
  },

  notifyStatus(status) {
    statusListeners.forEach(fn => {
      try {
        fn(status);
      } catch (e) {
        console.error(e);
      }
    });
  }
};

