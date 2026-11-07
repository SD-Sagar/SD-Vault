/**
 * Upload Service
 * Direct browser-to-Google Drive uploads without server routing.
 * - Files < 5MB: Single-request Multipart Upload
 * - Files >= 5MB: Resumable Chunked Upload (256KB * 4 = 1MB chunks)
 * - Folder Upload: Recursively creates folder hierarchy on Drive and streams nested files.
 * Supports progress tracking, byte counters, and abort/cancellation.
 */

import { googleTokenService } from './googleTokenService';
import { googleDriveService } from './googleDriveService';
import { GOOGLE_DRIVE, DRIVE_CONNECTION_STATUS } from '../constants';

const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3/files';
const CHUNK_SIZE = 1024 * 1024; // 1 MB per chunk (multiple of 256 KB required by Drive)

export const uploadService = {
  /**
   * Uploads a file directly to Google Drive in the specified parent folder
   * @param {File} file - Browser File object
   * @param {string} parentFolderId - Destination folder ID
   * @param {Object} callbacks
   * @param {Function} callbacks.onProgress - (percent, loadedBytes, totalBytes) => void
   * @param {Function} callbacks.onAbortRef - (abortFn) => void
   * @returns {Promise<Object>} Google Drive file metadata
   */
  async uploadFile(file, parentFolderId, { onProgress, onAbortRef } = {}) {
    const token = googleTokenService.getAccessToken();
    if (!token) {
      googleTokenService.notifyStatus(DRIVE_CONNECTION_STATUS.EXPIRED);
      throw new Error('Google Drive token expired. Please reconnect.');
    }

    if (file.size < GOOGLE_DRIVE.MAX_MULTIPART_UPLOAD_SIZE) {
      return this.uploadMultipart(file, parentFolderId, token, { onProgress, onAbortRef });
    } else {
      return this.uploadResumable(file, parentFolderId, token, { onProgress, onAbortRef });
    }
  },

  /**
   * Multipart Upload (< 5MB)
   */
  uploadMultipart(file, parentFolderId, token, { onProgress, onAbortRef }) {
    return new Promise((resolve, reject) => {
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const metadata = {
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        parents: [parentFolderId]
      };

      const reader = new FileReader();

      reader.onload = (e) => {
        const fileContent = e.target.result;
        const contentType = file.type || 'application/octet-stream';

        const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
        const mediaPart = `${delimiter}Content-Type: ${contentType}\r\n\r\n`;

        // Combine parts into single payload
        const blob = new Blob([
          metadataPart,
          mediaPart,
          new Uint8Array(fileContent),
          closeDelim
        ], { type: `multipart/related; boundary=${boundary}` });

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${UPLOAD_API_BASE}?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,parents,thumbnailLink,webViewLink`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        if (onAbortRef) {
          onAbortRef(() => xhr.abort());
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent, event.loaded, event.total);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              onProgress?.(100, file.size, file.size);
              resolve(res);
            } catch (err) {
              reject(err);
            }
          } else if (xhr.status === 401) {
            googleTokenService.clearToken();
            googleTokenService.notifyStatus(DRIVE_CONNECTION_STATUS.EXPIRED);
            reject(new Error('Google Drive authorization expired (401).'));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during file upload.'));
        xhr.onabort = () => reject(new Error('Upload cancelled by user.'));

        xhr.send(blob);
      };

      reader.onerror = () => reject(new Error('Failed to read local file.'));
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Resumable Chunked Upload (>= 5MB)
   */
  async uploadResumable(file, parentFolderId, token, { onProgress, onAbortRef }) {
    let isAborted = false;
    let currentXhr = null;

    if (onAbortRef) {
      onAbortRef(() => {
        isAborted = true;
        if (currentXhr) currentXhr.abort();
      });
    }

    // 1. Initialize Resumable Upload Session
    const initResponse = await fetch(`${UPLOAD_API_BASE}?uploadType=resumable`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': file.type || 'application/octet-stream',
        'X-Upload-Content-Length': file.size.toString()
      },
      body: JSON.stringify({
        name: file.name,
        parents: [parentFolderId]
      })
    });

    if (!initResponse.ok) {
      if (initResponse.status === 401) {
        googleTokenService.clearToken();
        googleTokenService.notifyStatus(DRIVE_CONNECTION_STATUS.EXPIRED);
        throw new Error('Google Drive authorization expired.');
      }
      throw new Error(`Failed to initialize resumable upload: ${initResponse.statusText}`);
    }

    const sessionUri = initResponse.headers.get('Location');
    if (!sessionUri) {
      throw new Error('Failed to obtain Google Drive resumable session URI.');
    }

    // 2. Stream chunks to sessionUri
    let startByte = 0;
    const totalBytes = file.size;

    while (startByte < totalBytes) {
      if (isAborted) {
        throw new Error('Upload cancelled by user.');
      }

      const endByte = Math.min(startByte + CHUNK_SIZE, totalBytes);
      const chunk = file.slice(startByte, endByte);

      const chunkResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        currentXhr = xhr;
        xhr.open('PUT', sessionUri);
        xhr.setRequestHeader('Content-Range', `bytes ${startByte}-${endByte - 1}/${totalBytes}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            const currentTotalLoaded = startByte + e.loaded;
            const percent = Math.min(Math.round((currentTotalLoaded / totalBytes) * 100), 99);
            onProgress(percent, currentTotalLoaded, totalBytes);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 308) {
            resolve({ complete: false });
          } else if (xhr.status === 200 || xhr.status === 201) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve({ complete: true, data: res });
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`Chunk upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during chunk upload.'));
        xhr.onabort = () => reject(new Error('Upload cancelled.'));

        xhr.send(chunk);
      });

      if (chunkResult.complete) {
        onProgress?.(100, totalBytes, totalBytes);
        return chunkResult.data;
      }

      startByte = endByte;
    }
  },

  /**
   * Uploads an entire folder tree, creating nested directories as needed on Google Drive
   * @param {File[]} files - List of files containing webkitRelativePath
   * @param {string} rootParentFolderId - Destination folder ID in SD-Vault
   * @param {Object} callbacks
   */
  async uploadFolderTree(files, rootParentFolderId, { onProgress, onAbortRef } = {}) {
    let isCancelled = false;
    let activeFileAbortFn = null;

    if (onAbortRef) {
      onAbortRef(() => {
        isCancelled = true;
        if (activeFileAbortFn) {
          try { activeFileAbortFn(); } catch { /* ignore */ }
        }
      });
    }

    // Map of relative directory path to Google Drive folder ID
    const folderCache = new Map();
    folderCache.set('', rootParentFolderId);

    const fileList = Array.from(files);
    const totalFiles = fileList.length;
    const uploadedResults = [];

    for (let i = 0; i < totalFiles; i++) {
      if (isCancelled) {
        throw new Error('Folder upload cancelled by user.');
      }

      const file = fileList[i];
      // Normalize slashes for Windows/cross-platform path separators
      const rawRelPath = file.webkitRelativePath || file.name;
      const relPath = rawRelPath.replace(/\\/g, '/');
      const pathParts = relPath.split('/');

      let currentParentId = rootParentFolderId;

      // If the file is inside subfolders (e.g. ['Parent', 'Sub1', 'DeepSub2', 'doc.pdf'])
      if (pathParts.length > 1) {
        let accumulatedPath = '';
        for (let p = 0; p < pathParts.length - 1; p++) {
          if (isCancelled) {
            throw new Error('Folder upload cancelled by user.');
          }

          const folderName = pathParts[p];
          const prevAccum = accumulatedPath;
          accumulatedPath = accumulatedPath ? `${accumulatedPath}/${folderName}` : folderName;

          if (!folderCache.has(accumulatedPath)) {
            const parentIdToUse = folderCache.get(prevAccum) || rootParentFolderId;
            // Find existing or create the subfolder on Google Drive
            const newFolder = await googleDriveService.findOrCreateSubfolder(folderName, parentIdToUse);
            folderCache.set(accumulatedPath, newFolder.id);
          }
          currentParentId = folderCache.get(accumulatedPath);
        }
      }

      if (isCancelled) {
        throw new Error('Folder upload cancelled by user.');
      }

      // If this is an empty folder placeholder, directory structure is now established
      if (file.isDirectoryPlaceholder) {
        continue;
      }

      // Upload file to its resolved parent directory
      const uploadedFile = await this.uploadFile(file, currentParentId, {
        onProgress: (percent) => {
          onProgress?.(file.name, percent, i + 1, totalFiles);
        },
        onAbortRef: (fn) => {
          activeFileAbortFn = fn;
        }
      });
      uploadedResults.push(uploadedFile);
    }

    return uploadedResults;
  }
};
