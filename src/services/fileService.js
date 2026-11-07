/**
 * File Service
 * Implements complete file-management operations: rename, move to trash, restore, permanent deletion, move, copy, and authenticated download.
 */

import { googleDriveService } from './googleDriveService';
import { googleTokenService } from './googleTokenService';
import { DRIVE_CONNECTION_STATUS } from '../constants';
import { VaultItem } from '../models/VaultItem';

export const fileService = {
  /**
   * Renames a file or folder in Google Drive
   */
  async renameItem(fileId, newName) {
    if (!newName || !newName.trim()) {
      throw new Error('Name cannot be empty.');
    }

    const result = await googleDriveService.request(`/files/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: newName.trim() })
    });

    return new VaultItem(result);
  },

  /**
   * Moves a file or folder to Trash (Google Drive automatically auto-deletes after 30 days)
   * If Google returns 403 Forbidden for soft-trash on a folder (e.g. non-empty folder),
   * it recursively empties and removes the directory.
   */
  async moveToTrash(fileId, isFolder = false) {
    try {
      return await googleDriveService.moveToTrash(fileId);
    } catch (err) {
      console.warn(`[fileService] moveToTrash failed (${err.message}), attempting direct deletion for ${fileId}`);
      if (isFolder) {
        return await googleDriveService.deleteFolderRecursively(fileId);
      }
      return await googleDriveService.deletePermanently(fileId);
    }
  },

  /**
   * Batch moves multiple items to Trash
   */
  async moveMultipleToTrash(items = []) {
    const results = await Promise.allSettled(
      items.map(item => {
        const id = typeof item === 'string' ? item : item.id;
        const isFolder = typeof item === 'object' ? Boolean(item.isFolder) : false;
        return this.moveToTrash(id, isFolder);
      })
    );
    const rejected = results.filter(r => r.status === 'rejected');
    if (rejected.length > 0) {
      throw new Error(`Failed to delete ${rejected.length} item(s). If this item was created outside SD-Vault, Google Drive permissions may block modifying it.`);
    }
    return true;
  },

  /**
   * Restores an item from Trash back to its original parent directory
   */
  async restoreFromTrash(fileId) {
    return await googleDriveService.restoreFromTrash(fileId);
  },

  /**
   * Batch restores items from Trash
   */
  async restoreMultipleFromTrash(fileIds = []) {
    const results = await Promise.allSettled(
      fileIds.map(id => this.restoreFromTrash(id))
    );
    return results;
  },

  /**
   * Deletes a file permanently from Google Drive (irreversible)
   */
  async deletePermanently(fileId, isFolder = false) {
    if (isFolder) {
      return await googleDriveService.deleteFolderRecursively(fileId);
    }
    return await googleDriveService.deletePermanently(fileId);
  },

  /**
   * Batch permanently deletes items from Google Drive
   */
  async deleteMultiplePermanently(items = []) {
    const results = await Promise.allSettled(
      items.map(item => {
        const id = typeof item === 'string' ? item : item.id;
        const isFolder = typeof item === 'object' ? Boolean(item.isFolder) : false;
        return this.deletePermanently(id, isFolder);
      })
    );
    const rejected = results.filter(r => r.status === 'rejected');
    if (rejected.length > 0) {
      throw new Error(`Failed to permanently delete ${rejected.length} item(s).`);
    }
    return true;
  },

  /**
   * Empties the entire trash folder permanently
   */
  async emptyTrash() {
    return await googleDriveService.emptyTrash();
  },

  /**
   * Moves a file/folder to a new parent folder
   */
  async moveItem(fileId, sourceFolderId, destinationFolderId) {
    const endpoint = `/files/${fileId}?addParents=${destinationFolderId}&removeParents=${sourceFolderId}&fields=id,parents,name`;
    const result = await googleDriveService.request(endpoint, {
      method: 'PATCH'
    });
    return new VaultItem(result);
  },

  /**
   * Creates a duplicate copy of a file in the destination folder
   */
  async copyItem(fileId, destinationFolderId, newName) {
    const body = {
      parents: [destinationFolderId]
    };
    if (newName) body.name = newName;

    const result = await googleDriveService.request(`/files/${fileId}/copy?fields=id,name,mimeType,size,modifiedTime,parents,thumbnailLink,webViewLink`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    return new VaultItem(result);
  },

  /**
   * Downloads a file using authenticated Drive API alt=media
   * Streams blob directly to browser without exposing access tokens in address bar or URLs
   */
  async downloadFile(fileId, fileName) {
    const token = googleTokenService.getAccessToken();
    if (!token) {
      googleTokenService.notifyStatus(DRIVE_CONNECTION_STATUS.EXPIRED);
      throw new Error('Google Drive authorization token expired.');
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        googleTokenService.clearToken();
        googleTokenService.notifyStatus(DRIVE_CONNECTION_STATUS.EXPIRED);
        throw new Error('Google Drive token expired during download.');
      }
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fileName || 'download';
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
    }, 200);

    return true;
  }
};
