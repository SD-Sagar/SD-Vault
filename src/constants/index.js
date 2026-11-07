/**
 * SD-Vault Application Constants
 */

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system'
};

export const VAULT_ANIMATION_STATES = {
  LOCKED: 'LOCKED',
  UNLOCKING: 'UNLOCKING',       // Wheel spins, bolts retract inward
  OPENING: 'OPENING',           // Vault door swings open
  OPEN: 'OPEN',                 // Vault door fully open, dashboard displayed
  CLOSING: 'CLOSING',           // Vault door swings shut
  LOCKING: 'LOCKING'            // Bolts extend, wheel spins in reverse
};

export const GOOGLE_DRIVE = {
  ROOT_FOLDER_NAME: 'SD-Vault',
  SCOPE: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file',
  MIME_TYPES: {
    FOLDER: 'application/vnd.google-apps.folder',
    SHORTCUT: 'application/vnd.google-apps.shortcut'
  },
  MAX_MULTIPART_UPLOAD_SIZE: 5 * 1024 * 1024 // 5 MB threshold
};

export const AUTH_STATUS = {
  CHECKING: 'CHECKING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED'
};

export const DRIVE_CONNECTION_STATUS = {
  NOT_CONNECTED: 'NOT_CONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  EXPIRED: 'EXPIRED',
  ERROR: 'ERROR'
};

