/**
 * VaultContext using useReducer
 * Centralized state for Google Drive files, folders, breadcrumbs, search, view modes,
 * selection, file operations, uploads, virtual clipboard, media preview, and modals.
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { driveController } from '../controllers/driveController';
import { folderController } from '../controllers/folderController';
import { fileController } from '../controllers/fileController';
import { clipboardService } from '../services/clipboardService';
import { useAuth } from '../hooks/useAuth';
import { DRIVE_CONNECTION_STATUS } from '../constants';
import { storage } from '../utils/storage';

const VaultContext = createContext(null);

const initialState = {
  rootFolderId: null,
  currentFolderId: null,
  currentFolderName: 'SD-Vault',
  breadcrumbs: [],
  items: [],
  storageQuota: {
    limit: 15 * 1024 * 1024 * 1024,
    usage: 0,
    usageInDrive: 0,
    usageInDriveTrash: 0,
    percent: 0,
    accountPercent: 0,
    limitFormatted: '15 GB',
    driveUsageFormatted: '0 B',
    trashUsageFormatted: '0 B',
    totalUsageFormatted: '0 B',
    usedFormatted: '0 B',
    totalFormatted: '15 GB',
    remainingFormatted: '15 GB'
  },
  isLoading: false,
  error: null,
  searchQuery: '',
  viewMode: storage.get('view_mode', 'grid'),
  selectedItemIds: new Set(),
  isNewFolderModalOpen: false,
  renameModalItem: null,
  deleteModalItems: [],
  mediaPreviewItem: null,
  clipboard: clipboardService.getClipboard(),
  uploads: [],
  isDraggingOver: false
};

const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_INITIAL_DRIVE: 'SET_INITIAL_DRIVE',
  SET_FOLDER_CONTENTS: 'SET_FOLDER_CONTENTS',
  SET_STORAGE_QUOTA: 'SET_STORAGE_QUOTA',
  SET_VIEW_MODE: 'SET_VIEW_MODE',
  TOGGLE_SELECT_ITEM: 'TOGGLE_SELECT_ITEM',
  SELECT_ALL: 'SELECT_ALL',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_NEW_FOLDER_MODAL: 'SET_NEW_FOLDER_MODAL',
  SET_RENAME_MODAL: 'SET_RENAME_MODAL',
  SET_DELETE_MODAL: 'SET_DELETE_MODAL',
  SET_MEDIA_PREVIEW: 'SET_MEDIA_PREVIEW',
  SET_CLIPBOARD: 'SET_CLIPBOARD',
  UPDATE_UPLOAD: 'UPDATE_UPLOAD',
  CLEAR_UPLOADS: 'CLEAR_UPLOADS',
  SET_DRAG_OVER: 'SET_DRAG_OVER',
  SET_ERROR: 'SET_ERROR'
};

function vaultReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload, error: null };

    case ACTIONS.SET_INITIAL_DRIVE:
      return {
        ...state,
        rootFolderId: action.payload.rootFolderId,
        currentFolderId: action.payload.currentFolderId,
        currentFolderName: action.payload.currentFolderName,
        breadcrumbs: action.payload.breadcrumbs,
        items: action.payload.items,
        storageQuota: action.payload.quota || state.storageQuota,
        isLoading: false,
        error: null,
        selectedItemIds: new Set()
      };

    case ACTIONS.SET_FOLDER_CONTENTS:
      return {
        ...state,
        currentFolderId: action.payload.folderId,
        currentFolderName: action.payload.folderName,
        breadcrumbs: action.payload.breadcrumbs,
        items: action.payload.items,
        isLoading: false,
        error: null,
        selectedItemIds: new Set()
      };

    case ACTIONS.SET_STORAGE_QUOTA:
      return { ...state, storageQuota: action.payload };

    case ACTIONS.SET_VIEW_MODE:
      storage.set('view_mode', action.payload);
      return { ...state, viewMode: action.payload };

    case ACTIONS.TOGGLE_SELECT_ITEM: {
      const id = action.payload;
      const next = new Set(state.selectedItemIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { ...state, selectedItemIds: next };
    }

    case ACTIONS.SELECT_ALL: {
      const allIds = new Set(state.items.map(item => item.id));
      return { ...state, selectedItemIds: allIds };
    }

    case ACTIONS.CLEAR_SELECTION:
      return { ...state, selectedItemIds: new Set() };

    case ACTIONS.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload };

    case ACTIONS.SET_NEW_FOLDER_MODAL:
      return { ...state, isNewFolderModalOpen: action.payload };

    case ACTIONS.SET_RENAME_MODAL:
      return { ...state, renameModalItem: action.payload };

    case ACTIONS.SET_DELETE_MODAL:
      return { ...state, deleteModalItems: action.payload };

    case ACTIONS.SET_MEDIA_PREVIEW:
      return { ...state, mediaPreviewItem: action.payload };

    case ACTIONS.SET_CLIPBOARD:
      return { ...state, clipboard: action.payload };

    case ACTIONS.UPDATE_UPLOAD: {
      const { id, updates } = action.payload;
      const existingIdx = state.uploads.findIndex(u => u.id === id);
      let nextUploads;
      if (existingIdx >= 0) {
        nextUploads = [...state.uploads];
        nextUploads[existingIdx] = { ...nextUploads[existingIdx], ...updates };
      } else {
        nextUploads = [...state.uploads, { id, ...updates }];
      }
      return { ...state, uploads: nextUploads };
    }

    case ACTIONS.CLEAR_UPLOADS:
      return { ...state, uploads: [] };

    case ACTIONS.SET_DRAG_OVER:
      return { ...state, isDraggingOver: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    default:
      return state;
  }
}

export function VaultProvider({ children }) {
  const { driveStatus } = useAuth();
  const [state, dispatch] = useReducer(vaultReducer, initialState);

  // Initialize Drive root and load quota when connected
  const initDrive = useCallback(async () => {
    if (driveStatus !== DRIVE_CONNECTION_STATUS.CONNECTED) return;

    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const data = await driveController.initializeDrive();
      dispatch({ type: ACTIONS.SET_INITIAL_DRIVE, payload: data });
    } catch (err) {
      console.error('[VaultProvider] Initialization failed:', err);
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message || 'Failed to initialize SD-Vault folder' });
    }
  }, [driveStatus]);

  useEffect(() => {
    initDrive();
  }, [initDrive]);

  // Subscribe to virtual clipboard changes
  useEffect(() => {
    const unsub = clipboardService.subscribe((newClipboard) => {
      dispatch({ type: ACTIONS.SET_CLIPBOARD, payload: newClipboard });
    });
    return unsub;
  }, []);

  // Refresh current folder
  const refresh = useCallback(async () => {
    if (!state.currentFolderId) return;
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const items = await driveController.refreshFolder(state.currentFolderId, {
        searchQuery: state.searchQuery
      });
      const quota = await driveController.refreshQuota();

      dispatch({
        type: ACTIONS.SET_FOLDER_CONTENTS,
        payload: {
          folderId: state.currentFolderId,
          folderName: state.currentFolderName,
          breadcrumbs: state.breadcrumbs,
          items
        }
      });
      dispatch({ type: ACTIONS.SET_STORAGE_QUOTA, payload: quota });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message });
    }
  }, [state.currentFolderId, state.currentFolderName, state.breadcrumbs, state.searchQuery]);

  // Navigate into subfolder
  const navigateInto = useCallback(async (folderItem) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const result = await folderController.navigateInto(folderItem, state.breadcrumbs);
      dispatch({ type: ACTIONS.SET_FOLDER_CONTENTS, payload: result });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message });
    }
  }, [state.breadcrumbs]);

  // Navigate to breadcrumb
  const navigateToBreadcrumb = useCallback(async (index) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const result = await folderController.navigateToBreadcrumb(index, state.breadcrumbs);
      if (result) {
        dispatch({ type: ACTIONS.SET_FOLDER_CONTENTS, payload: result });
      }
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message });
    }
  }, [state.breadcrumbs]);

  // Navigate Up
  const navigateUp = useCallback(async () => {
    if (state.breadcrumbs.length <= 1) return;
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const result = await folderController.navigateUp(state.breadcrumbs);
      if (result) {
        dispatch({ type: ACTIONS.SET_FOLDER_CONTENTS, payload: result });
      }
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message });
    }
  }, [state.breadcrumbs]);

  // Create subfolder
  const createFolder = useCallback(async (name) => {
    if (!state.currentFolderId) return;
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      await folderController.createFolder(name, state.currentFolderId);
      await refresh();
      dispatch({ type: ACTIONS.SET_NEW_FOLDER_MODAL, payload: false });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message });
    }
  }, [state.currentFolderId, refresh]);

  // Upload individual files
  const uploadFiles = useCallback(async (fileList) => {
    if (!state.currentFolderId) return;
    const files = Array.from(fileList);

    for (const file of files) {
      const uploadId = `${Date.now()}_${file.name}`;
      let abortFn = null;

      dispatch({
        type: ACTIONS.UPDATE_UPLOAD,
        payload: {
          id: uploadId,
          updates: {
            id: uploadId,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'uploading',
            abortFn: (fn) => { abortFn = fn; }
          }
        }
      });

      try {
        await fileController.uploadFiles([file], state.currentFolderId, {
          onProgress: (name, percent) => {
            dispatch({
              type: ACTIONS.UPDATE_UPLOAD,
              payload: {
                id: uploadId,
                updates: { progress: percent }
              }
            });
          },
          onAbortRef: (fn) => {
            dispatch({
              type: ACTIONS.UPDATE_UPLOAD,
              payload: {
                id: uploadId,
                updates: { abortFn: fn }
              }
            });
          }
        });

        dispatch({
          type: ACTIONS.UPDATE_UPLOAD,
          payload: {
            id: uploadId,
            updates: { progress: 100, status: 'completed' }
          }
        });
      } catch (err) {
        dispatch({
          type: ACTIONS.UPDATE_UPLOAD,
          payload: {
            id: uploadId,
            updates: { status: 'error', error: err.message }
          }
        });
      }
    }

    await refresh();
  }, [state.currentFolderId, refresh]);

  // Prompt warning if user tries to close or reload tab while an upload is active
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const isUploading = state.uploads.some(u => u.status === 'uploading');
      if (isUploading) {
        e.preventDefault();
        e.returnValue = 'An upload is currently in progress. If you leave, unfinished uploads will be stopped.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.uploads]);

  // Upload entire folder tree
  const uploadFolder = useCallback(async (fileList) => {
    if (!state.currentFolderId) return;
    const files = Array.from(fileList);
    const folderName = files[0]?.webkitRelativePath?.split('/')[0] || 'Folder';
    const uploadId = `${Date.now()}_${folderName}`;
    let abortFolderFn = null;

    dispatch({
      type: ACTIONS.UPDATE_UPLOAD,
      payload: {
        id: uploadId,
        updates: {
          id: uploadId,
          name: `Folder: ${folderName} (${files.length} files)`,
          size: files.reduce((acc, f) => acc + f.size, 0),
          progress: 0,
          status: 'uploading',
          abortFn: () => {
            if (abortFolderFn) abortFolderFn();
          }
        }
      }
    });

    try {
      await fileController.uploadFolder(files, state.currentFolderId, {
        onProgress: (fileName, percent, currentIdx, total) => {
          const overall = Math.round((currentIdx / total) * 100);
          dispatch({
            type: ACTIONS.UPDATE_UPLOAD,
            payload: {
              id: uploadId,
              updates: {
                name: `[${currentIdx}/${total}] ${fileName}`,
                progress: overall
              }
            }
          });
        },
        onAbortRef: (fn) => {
          abortFolderFn = fn;
        }
      });

      dispatch({
        type: ACTIONS.UPDATE_UPLOAD,
        payload: {
          id: uploadId,
          updates: {
            name: `Folder ${folderName} uploaded successfully`,
            progress: 100,
            status: 'completed'
          }
        }
      });
    } catch (err) {
      dispatch({
        type: ACTIONS.UPDATE_UPLOAD,
        payload: {
          id: uploadId,
          updates: { status: 'error', error: err.message }
        }
      });
    }

    await refresh();
  }, [state.currentFolderId, refresh]);

  // Cancel an active upload
  const cancelUpload = useCallback((uploadId) => {
    const target = state.uploads.find(u => u.id === uploadId);
    if (target?.abortFn) {
      target.abortFn();
    }
    dispatch({
      type: ACTIONS.UPDATE_UPLOAD,
      payload: {
        id: uploadId,
        updates: { status: 'error', error: 'Upload cancelled.' }
      }
    });
  }, [state.uploads]);

  const clearCompletedUploads = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_UPLOADS });
  }, []);

  // File Operations: Rename
  const renameItem = useCallback(async (fileId, newName) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      await fileController.rename(fileId, newName);
      await refresh();
      dispatch({ type: ACTIONS.SET_RENAME_MODAL, payload: null });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message });
    }
  }, [refresh]);

  // File Operations: Move to Trash (Safe deletion)
  const deleteItems = useCallback(async (itemsToDelete) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      await fileController.moveMultipleToTrash(itemsToDelete);
      dispatch({ type: ACTIONS.CLEAR_SELECTION });
      await refresh();
      dispatch({ type: ACTIONS.SET_DELETE_MODAL, payload: [] });
    } catch (err) {
      let msg = err.message;
      if (msg.includes('403') || msg.includes('Forbidden') || msg.includes('insufficientFilePermissions')) {
        msg = 'Google Drive Permission (403): Under the initial "drive.file" scope, Google restricts deleting folders created outside SD-Vault. To delete any folder without restriction, tap "Reconnect" in the header to authorize full Drive access.';
      }
      dispatch({ type: ACTIONS.SET_ERROR, payload: msg });
    }
  }, [refresh]);

  // File Operations: Download
  const downloadItem = useCallback(async (item) => {
    try {
      await fileController.download(item.id, item.name);
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message });
    }
  }, []);

  // Virtual Clipboard: Copy
  const copyToClipboard = useCallback((items) => {
    clipboardService.copy(items, state.currentFolderId);
    dispatch({ type: ACTIONS.CLEAR_SELECTION });
  }, [state.currentFolderId]);

  // Virtual Clipboard: Cut (Move)
  const cutToClipboard = useCallback((items) => {
    clipboardService.cut(items, state.currentFolderId);
    dispatch({ type: ACTIONS.CLEAR_SELECTION });
  }, [state.currentFolderId]);

  // Virtual Clipboard: Paste
  const pasteFromClipboard = useCallback(async () => {
    const cb = clipboardService.getClipboard();
    if (!cb.items.length || !state.currentFolderId) return;

    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      if (cb.operation === 'copy') {
        await fileController.copyItems(cb.items, state.currentFolderId);
      } else if (cb.operation === 'cut') {
        await fileController.moveItems(cb.items, cb.sourceFolderId, state.currentFolderId);
        clipboardService.clear();
      }
      await refresh();
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message });
    }
  }, [state.currentFolderId, refresh]);

  // Selection actions
  const toggleSelect = useCallback((id) => {
    dispatch({ type: ACTIONS.TOGGLE_SELECT_ITEM, payload: id });
  }, []);

  const selectAll = useCallback(() => {
    dispatch({ type: ACTIONS.SELECT_ALL });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_SELECTION });
  }, []);

  const setViewMode = useCallback((mode) => {
    dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: mode });
  }, []);

  const setSearchQuery = useCallback((query) => {
    dispatch({ type: ACTIONS.SET_SEARCH_QUERY, payload: query });
  }, []);

  const refreshQuota = useCallback(async () => {
    try {
      const quota = await driveController.refreshQuota();
      dispatch({ type: ACTIONS.SET_STORAGE_QUOTA, payload: quota });
      return quota;
    } catch (e) {
      console.warn('Failed to refresh quota:', e);
    }
  }, []);

  const openNewFolderModal = useCallback(() => {
    dispatch({ type: ACTIONS.SET_NEW_FOLDER_MODAL, payload: true });
  }, []);

  const closeNewFolderModal = useCallback(() => {
    dispatch({ type: ACTIONS.SET_NEW_FOLDER_MODAL, payload: false });
  }, []);

  const openRenameModal = useCallback((item) => {
    dispatch({ type: ACTIONS.SET_RENAME_MODAL, payload: item });
  }, []);

  const closeRenameModal = useCallback(() => {
    dispatch({ type: ACTIONS.SET_RENAME_MODAL, payload: null });
  }, []);

  const openDeleteModal = useCallback((items) => {
    dispatch({ type: ACTIONS.SET_DELETE_MODAL, payload: items });
  }, []);

  const closeDeleteModal = useCallback(() => {
    dispatch({ type: ACTIONS.SET_DELETE_MODAL, payload: [] });
  }, []);

  const openMediaPreview = useCallback((item) => {
    dispatch({ type: ACTIONS.SET_MEDIA_PREVIEW, payload: item });
  }, []);

  const closeMediaPreview = useCallback(() => {
    dispatch({ type: ACTIONS.SET_MEDIA_PREVIEW, payload: null });
  }, []);

  const setDragOver = useCallback((isDragging) => {
    dispatch({ type: ACTIONS.SET_DRAG_OVER, payload: isDragging });
  }, []);

  const value = {
    ...state,
    refresh,
    refreshQuota,
    navigateInto,
    navigateToBreadcrumb,
    navigateUp,
    createFolder,
    uploadFiles,
    uploadFolder,
    cancelUpload,
    clearCompletedUploads,
    renameItem,
    deleteItems,
    downloadItem,
    copyToClipboard,
    cutToClipboard,
    pasteFromClipboard,
    toggleSelect,
    selectAll,
    clearSelection,
    setViewMode,
    setSearchQuery,
    openNewFolderModal,
    closeNewFolderModal,
    openRenameModal,
    closeRenameModal,
    openDeleteModal,
    closeDeleteModal,
    openMediaPreview,
    closeMediaPreview,
    setDragOver
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
