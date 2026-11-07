/**
 * Clipboard Service
 * Application-managed virtual clipboard that works seamlessly across vault directory navigation.
 * Supports 'copy' and 'cut' (move) operations.
 */

let clipboardState = {
  items: [],
  operation: null, // 'copy' | 'cut'
  sourceFolderId: null
};

let listeners = new Set();

export const clipboardService = {
  getClipboard() {
    return { ...clipboardState };
  },

  hasItems() {
    return clipboardState.items.length > 0;
  },

  copy(items = [], sourceFolderId) {
    clipboardState = {
      items: [...items],
      operation: 'copy',
      sourceFolderId
    };
    this.notify();
  },

  cut(items = [], sourceFolderId) {
    clipboardState = {
      items: [...items],
      operation: 'cut',
      sourceFolderId
    };
    this.notify();
  },

  clear() {
    clipboardState = {
      items: [],
      operation: null,
      sourceFolderId: null
    };
    this.notify();
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  notify() {
    listeners.forEach(fn => {
      try {
        fn({ ...clipboardState });
      } catch (e) {
        console.error(e);
      }
    });
  }
};

