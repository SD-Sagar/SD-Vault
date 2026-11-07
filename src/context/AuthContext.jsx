/**
 * AuthContext using useReducer for predictable state transitions
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authController } from '../controllers/authController';
import { supabaseService } from '../services/supabaseService';
import { googleAuthService } from '../services/googleAuthService';
import { googleTokenService } from '../services/googleTokenService';
import { AUTH_STATUS, DRIVE_CONNECTION_STATUS, VAULT_ANIMATION_STATES } from '../constants';
import { validateEnv } from '../config/env';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  authStatus: AUTH_STATUS.CHECKING,
  driveStatus: DRIVE_CONNECTION_STATUS.NOT_CONNECTED,
  vaultState: VAULT_ANIMATION_STATES.LOCKED,
  error: null,
  isConfigured: false
};

const ACTIONS = {
  SET_INITIAL_STATE: 'SET_INITIAL_STATE',
  SET_AUTH_STATUS: 'SET_AUTH_STATUS',
  SET_DRIVE_STATUS: 'SET_DRIVE_STATUS',
  SET_VAULT_STATE: 'SET_VAULT_STATE',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  RESET_STATE: 'RESET_STATE'
};

function authReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_INITIAL_STATE:
      return {
        ...state,
        ...action.payload,
        error: null
      };

    case ACTIONS.SET_AUTH_STATUS:
      return {
        ...state,
        authStatus: action.payload
      };

    case ACTIONS.SET_DRIVE_STATUS:
      return {
        ...state,
        driveStatus: action.payload
      };

    case ACTIONS.SET_VAULT_STATE:
      return {
        ...state,
        vaultState: action.payload
      };

    case ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };

    case ACTIONS.RESET_STATE:
      return {
        ...initialState,
        authStatus: AUTH_STATUS.UNAUTHENTICATED,
        vaultState: VAULT_ANIMATION_STATES.LOCKED,
        isConfigured: state.isConfigured
      };

    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    ...initialState,
    isConfigured: validateEnv().isConfigured
  });

  // Restore session on app mount and handle OAuth callback
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const { isConfigured } = validateEnv();
      if (!isConfigured) {
        if (isMounted) {
          dispatch({
            type: ACTIONS.SET_INITIAL_STATE,
            payload: {
              authStatus: AUTH_STATUS.UNAUTHENTICATED,
              driveStatus: DRIVE_CONNECTION_STATUS.NOT_CONNECTED,
              vaultState: VAULT_ANIMATION_STATES.LOCKED,
              isConfigured: false
            }
          });
        }
        return;
      }

      try {
        const restored = await authController.restoreSession();
        if (isMounted) {
          const shouldPlayUnlock = sessionStorage.getItem('sd_vault_play_unlock_anim') === 'true';
          dispatch({
            type: ACTIONS.SET_INITIAL_STATE,
            payload: {
              ...restored,
              vaultState: shouldPlayUnlock ? VAULT_ANIMATION_STATES.LOCKED : restored.vaultState,
              isConfigured: true
            }
          });
        }
      } catch (err) {
        console.error('[AuthContext] Session restore error:', err);
        if (isMounted) {
          dispatch({
            type: ACTIONS.SET_INITIAL_STATE,
            payload: {
              user: null,
              authStatus: AUTH_STATUS.UNAUTHENTICATED,
              driveStatus: DRIVE_CONNECTION_STATUS.NOT_CONNECTED,
              vaultState: VAULT_ANIMATION_STATES.LOCKED,
              isConfigured: true
            }
          });
        }
      }
    }

    checkSession();

    // Listen for Google Token expiration events
    const unsubTokenStatus = googleTokenService.subscribeStatus(newStatus => {
      dispatch({ type: ACTIONS.SET_DRIVE_STATUS, payload: newStatus });
    });

    // Listen for Supabase Auth state changes (crucial for OAuth callbacks!)
    const { data: authListener } = supabaseService.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        if (session.provider_token) {
          googleTokenService.setToken(session.provider_token, session.expires_in || 3600);
          dispatch({ type: ACTIONS.SET_DRIVE_STATUS, payload: DRIVE_CONNECTION_STATUS.CONNECTED });
        }

        dispatch({ type: ACTIONS.SET_USER, payload: session.user });
        dispatch({ type: ACTIONS.SET_AUTH_STATUS, payload: AUTH_STATUS.AUTHENTICATED });

        const isCallback = googleAuthService.hasOAuthCallbackInUrl() || sessionStorage.getItem('sd_vault_pending_oauth');
        if (isCallback) {
          sessionStorage.removeItem('sd_vault_pending_oauth');
          sessionStorage.setItem('sd_vault_play_unlock_anim', 'true');
        }

        const shouldPlayUnlock = sessionStorage.getItem('sd_vault_play_unlock_anim') === 'true';

        dispatch({
          type: ACTIONS.SET_VAULT_STATE,
          payload: shouldPlayUnlock ? VAULT_ANIMATION_STATES.LOCKED : VAULT_ANIMATION_STATES.OPEN
        });

        googleAuthService.cleanUrlAfterAuth();
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: ACTIONS.RESET_STATE });
      }
    });

    return () => {
      isMounted = false;
      unsubTokenStatus?.();
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  // Set vault animation state
  const setVaultState = useCallback((nextState) => {
    dispatch({ type: ACTIONS.SET_VAULT_STATE, payload: nextState });
    if (nextState === VAULT_ANIMATION_STATES.OPEN) {
      sessionStorage.removeItem('sd_vault_play_unlock_anim');
    }
    if (nextState === VAULT_ANIMATION_STATES.LOCKED) {
      sessionStorage.removeItem('sd_vault_play_unlock_anim');
      googleTokenService.clearToken();
      supabaseService.signOut().catch(() => {});
      dispatch({ type: ACTIONS.RESET_STATE });
    }
  }, []);

  // Initiate Login
  const login = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    try {
      if (!state.isConfigured) {
        dispatch({ type: ACTIONS.SET_VAULT_STATE, payload: VAULT_ANIMATION_STATES.UNLOCKING });
        dispatch({
          type: ACTIONS.SET_USER,
          payload: { email: 'operator@sd-vault.internal', user_metadata: { full_name: 'Demo Vault Operator' } }
        });
        dispatch({ type: ACTIONS.SET_DRIVE_STATUS, payload: DRIVE_CONNECTION_STATUS.CONNECTED });
        return;
      }

      await authController.initiateLogin();
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message || 'Login failed' });
    }
  }, [state.isConfigured]);

  // Initiate Logout (reverse seal animation)
  const logout = useCallback(() => {
    // Kick off reverse closing animation across the entire viewport
    setVaultState(VAULT_ANIMATION_STATES.CLOSING);
  }, [setVaultState]);

  // Reconnect Google Drive without logging out of Supabase
  const reconnectDrive = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    try {
      if (!state.isConfigured) {
        dispatch({ type: ACTIONS.SET_DRIVE_STATUS, payload: DRIVE_CONNECTION_STATUS.CONNECTED });
        alert('Simulator: Google Drive reconnected.');
        return;
      }
      await authController.reconnectDrive();
    } catch (err) {
      console.error('[AuthContext] Reconnect error:', err);
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message || 'Reconnection failed' });
    }
  }, [state.isConfigured]);

  const value = {
    ...state,
    login,
    logout,
    reconnectDrive,
    setVaultState
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
