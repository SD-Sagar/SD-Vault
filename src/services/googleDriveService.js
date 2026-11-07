/**
 * Google Drive API Service
 * Direct browser-to-Google Drive communication.
 * Handles Root Folder creation/detection, directory traversal, search, storage quota, and Trash lifecycle.
 */

import { googleTokenService } from './googleTokenService';
import { GOOGLE_DRIVE, DRIVE_CONNECTION_STATUS } from '../constants';
import { VaultItem } from '../models/VaultItem';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const ROOT_FOLDER_CACHE_KEY = 'sd_vault_root_folder_id';

export const googleDriveService = {
  /**
   * Internal authenticated API fetch wrapper
   */
  async request(endpoint, options = {}) {
    const token = googleTokenService.getAccessToken();
    if (!token) {
      googleTokenService.notifyStatus(DRIVE_CONNECTION_STATUS.EXPIRED);
      throw new Error('Google Drive authorization token is missing or expired. Please reconnect.');
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const url = endpoint.startsWith('http') ? endpoint : `${DRIVE_API_BASE}${endpoint}`;

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        googleTokenService.clearToken();
        googleTokenService.notifyStatus(DRIVE_CONNECTION_STATUS.EXPIRED);
        throw new Error('Google Drive authorization expired (401). Please reconnect.');
      }

      if (!response.ok) {
        let errorMessage = `Google Drive API error (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData?.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // Response body was not JSON
        }
        throw new Error(errorMessage);
      }

      // Handle 204 No Content (e.g. file deletion or empty trash)
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      if (error.message && error.message.includes('401')) {
        googleTokenService.notifyStatus(DRIVE_CONNECTION_STATUS.EXPIRED);
      }
      throw error;
    }
  },

  /**
   * Retrieves Google Drive Storage Quota information
   */
  async getStorageQuota() {
    try {
      const data = await this.request('/about?fields=storageQuota,user');
      const q = data.storageQuota || {};

      const limit = q.limit ? parseInt(q.limit, 10) : 0;
      const usage = q.usage ? parseInt(q.usage, 10) : 0;
      const usageInDrive = q.usageInDrive ? parseInt(q.usageInDrive, 10) : 0;
      const usageInDriveTrash = q.usageInDriveTrash ? parseInt(q.usageInDriveTrash, 10) : 0;

      const formatSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
      };

      const percent = limit > 0 ? Math.round((usageInDrive / limit) * 100) : 0;
      const accountPercent = limit > 0 ? Math.round((usage / limit) * 100) : 0;

      return {
        limit,
        usage,
        usageInDrive,
        usageInDriveTrash,
        percent,
        accountPercent,
        limitFormatted: limit > 0 ? formatSize(limit) : 'Unlimited',
        // Drive-specific formatted usage (most relevant to SD-Vault)
        driveUsageFormatted: formatSize(usageInDrive),
        trashUsageFormatted: formatSize(usageInDriveTrash),
        // Total Google Account usage (Drive + Gmail + Photos)
        totalUsageFormatted: formatSize(usage),
        // Primary label for header display (uses actual Drive storage)
        usedFormatted: formatSize(usageInDrive),
        totalFormatted: limit > 0 ? formatSize(limit) : 'Unlimited',
        remainingFormatted: limit > 0 ? formatSize(Math.max(0, limit - usageInDrive)) : 'Unlimited'
      };
    } catch (e) {
      console.warn('[googleDriveService] Failed to retrieve storage quota:', e);
      return {
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
      };
    }
  },

  /**
   * Locates or creates the root 'SD-Vault' folder directly in Google Drive root
   */
  async findOrCreateRootFolder() {
    const cachedId = localStorage.getItem(ROOT_FOLDER_CACHE_KEY);
    if (cachedId) {
      try {
        const check = await this.request(`/files/${cachedId}?fields=id,name,trashed`);
        if (check && !check.trashed && check.name === GOOGLE_DRIVE.ROOT_FOLDER_NAME) {
          return cachedId;
        }
      } catch {
        localStorage.removeItem(ROOT_FOLDER_CACHE_KEY);
      }
    }

    const query = `name = '${GOOGLE_DRIVE.ROOT_FOLDER_NAME}' and mimeType = '${GOOGLE_DRIVE.MIME_TYPES.FOLDER}' and 'root' in parents and trashed = false`;
    const searchResult = await this.request(`/files?q=${encodeURIComponent(query)}&fields=files(id,name)`);

    if (searchResult.files && searchResult.files.length > 0) {
      const rootId = searchResult.files[0].id;
      localStorage.setItem(ROOT_FOLDER_CACHE_KEY, rootId);
      return rootId;
    }

    const newFolder = await this.request('/files', {
      method: 'POST',
      body: JSON.stringify({
        name: GOOGLE_DRIVE.ROOT_FOLDER_NAME,
        mimeType: GOOGLE_DRIVE.MIME_TYPES.FOLDER,
        parents: ['root'],
        description: 'SD-Vault Secure Storage Root'
      })
    });

    if (newFolder?.id) {
      localStorage.setItem(ROOT_FOLDER_CACHE_KEY, newFolder.id);
      return newFolder.id;
    }

    throw new Error('Failed to create SD-Vault root directory in Google Drive.');
  },

  /**
   * Lists folder contents (folders and files)
   */
  async listFolderContents(folderId, { searchQuery = '' } = {}) {
    let q = `'${folderId}' in parents and trashed = false`;

    if (searchQuery && searchQuery.trim()) {
      const escaped = searchQuery.trim().replace(/'/g, "\\'");
      q += ` and name contains '${escaped}'`;
    }

    const fields = 'files(id, name, mimeType, size, modifiedTime, createdTime, parents, thumbnailLink, iconLink, webViewLink, webContentLink, trashed, capabilities)';
    const orderBy = 'folder,name';

    const result = await this.request(`/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&orderBy=${encodeURIComponent(orderBy)}&pageSize=100`);

    const items = (result.files || []).map(raw => new VaultItem(raw));
    return items;
  },

  /**
   * Lists items currently in Trash (only explicitly trashed top-level items)
   */
  async listTrash() {
    const q = 'trashed = true and explicitlyTrashed = true';
    const fields = 'files(id, name, mimeType, size, modifiedTime, createdTime, parents, thumbnailLink, iconLink, webViewLink, webContentLink, trashed, explicitlyTrashed, capabilities)';
    const orderBy = 'modifiedTime desc';

    const result = await this.request(`/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&orderBy=${encodeURIComponent(orderBy)}&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`);
    return (result.files || []).map(raw => new VaultItem(raw));
  },

  /**
   * Moves a file or folder to Trash
   */
  async moveToTrash(fileId) {
    const result = await this.request(`/files/${fileId}?supportsAllDrives=true`, {
      method: 'PATCH',
      body: JSON.stringify({ trashed: true })
    });
    return new VaultItem(result);
  },

  /**
   * Restores an item from Trash
   */
  async restoreFromTrash(fileId) {
    const result = await this.request(`/files/${fileId}?supportsAllDrives=true`, {
      method: 'PATCH',
      body: JSON.stringify({ trashed: false })
    });
    return new VaultItem(result);
  },

  /**
   * Permanently deletes a file from Google Drive
   */
  async deletePermanently(fileId) {
    await this.request(`/files/${fileId}?supportsAllDrives=true`, {
      method: 'DELETE'
    });
    return true;
  },

  /**
   * Recursively empties and deletes a folder and all its contents (including all nested items).
   * Google Drive API v3 requires child items to be cleared if deleting a non-empty directory.
   */
  async deleteFolderRecursively(folderId) {
    try {
      let pageToken = null;
      do {
        let endpoint = `/files?q=${encodeURIComponent(`'${folderId}' in parents`)}&fields=nextPageToken,files(id,mimeType)&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true`;
        if (pageToken) {
          endpoint += `&pageToken=${encodeURIComponent(pageToken)}`;
        }
        const result = await this.request(endpoint);
        const children = result?.files || [];

        for (const child of children) {
          if (child.mimeType === GOOGLE_DRIVE.MIME_TYPES.FOLDER) {
            await this.deleteFolderRecursively(child.id);
          } else {
            await this.deletePermanently(child.id);
          }
        }
        pageToken = result?.nextPageToken || null;
      } while (pageToken);
    } catch (e) {
      console.warn('[googleDriveService] Notice during folder recursive cleanup:', e.message);
    }

    return await this.deletePermanently(folderId);
  },

  /**
   * Empties the entire Google Drive Trash permanently
   */
  async emptyTrash() {
    await this.request('/files/trash', {
      method: 'DELETE'
    });
    return true;
  },

  /**
   * Creates a subfolder in the given parent directory
   */
  async createFolder(name, parentId) {
    if (!name || !name.trim()) {
      throw new Error('Folder name cannot be empty.');
    }

    const result = await this.request('/files', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        mimeType: GOOGLE_DRIVE.MIME_TYPES.FOLDER,
        parents: [parentId]
      })
    });

    return new VaultItem(result);
  },

  /**
   * Finds an existing subfolder by name or creates it if it does not exist.
   * Prevents creating duplicate folders when uploading nested folder trees.
   */
  async findOrCreateSubfolder(name, parentId) {
    if (!name || !name.trim()) {
      throw new Error('Folder name cannot be empty.');
    }

    const safeName = name.trim().replace(/'/g, "\\'");
    const q = `name = '${safeName}' and mimeType = '${GOOGLE_DRIVE.MIME_TYPES.FOLDER}' and '${parentId}' in parents and trashed = false`;
    try {
      const res = await this.request(`/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType)&pageSize=1&supportsAllDrives=true&includeItemsFromAllDrives=true`);
      if (res?.files && res.files.length > 0) {
        return new VaultItem(res.files[0]);
      }
    } catch (e) {
      console.warn('[googleDriveService] findOrCreateSubfolder check warning:', e.message);
    }

    return await this.createFolder(name, parentId);
  },

  /**
   * Retrieves metadata for a folder
   */
  async getFolderMetadata(folderId) {
    const data = await this.request(`/files/${folderId}?fields=id,name,parents`);
    return data;
  }
};
