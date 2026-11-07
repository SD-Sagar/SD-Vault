/**
 * Safe Local Storage Utility
 */

export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = window.localStorage.getItem(`sd_vault_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`[storage] Error reading key "${key}":`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      window.localStorage.setItem(`sd_vault_${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[storage] Error writing key "${key}":`, e);
      return false;
    }
  },

  remove(key) {
    try {
      window.localStorage.removeItem(`sd_vault_${key}`);
      return true;
    } catch (e) {
      console.warn(`[storage] Error removing key "${key}":`, e);
      return false;
    }
  }
};

