/**
 * File Controller
 * Coordinates file mutations (rename, delete, move, copy, download), folder uploads, and batch operations.
 */

import { fileService } from '../services/fileService';
import { uploadService } from '../services/uploadService';

export const fileController = {
  /**
   * Uploads one or more files to the current directory
   */
  async uploadFiles(fileList, parentFolderId, { onProgress, onAbortRef } = {}) {
    const files = Array.from(fileList);
    const uploaded = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadService.uploadFile(file, parentFolderId, {
        onProgress: (percent) => {
          onProgress?.(file.name, percent, i + 1, files.length);
        },
        onAbortRef
      });
      uploaded.push(result);
    }

    return uploaded;
  },

  /**
   * Uploads an entire folder tree preserving nested folder structure
   */
  async uploadFolder(files, parentFolderId, { onProgress, onAbortRef } = {}) {
    return await uploadService.uploadFolderTree(files, parentFolderId, {
      onProgress,
      onAbortRef
    });
  },

  /**
   * Renames a file/folder
   */
  async rename(fileId, newName) {
    return await fileService.renameItem(fileId, newName);
  },

  /**
   * Moves a single item to Trash
   */
  async moveToTrash(fileId, isFolder = false) {
    return await fileService.moveToTrash(fileId, isFolder);
  },

  /**
   * Batch moves items to Trash
   */
  async moveMultipleToTrash(fileIds) {
    return await fileService.moveMultipleToTrash(fileIds);
  },

  /**
   * Restores a single item from Trash
   */
  async restoreFromTrash(fileId) {
    return await fileService.restoreFromTrash(fileId);
  },

  /**
   * Permanently deletes a single item from Google Drive
   */
  async deletePermanently(fileId, isFolder = false) {
    return await fileService.deletePermanently(fileId, isFolder);
  },

  /**
   * Batch permanently deletes items from Google Drive
   */
  async deleteMultiplePermanently(items) {
    return await fileService.deleteMultiplePermanently(items);
  },

  /**
   * Copies items into target folder
   */
  async copyItems(items, targetFolderId) {
    const copied = [];
    for (const item of items) {
      const copyName = `Copy of ${item.name}`;
      const res = await fileService.copyItem(item.id, targetFolderId, copyName);
      copied.push(res);
    }
    return copied;
  },

  /**
   * Moves items from source folder to target folder
   */
  async moveItems(items, sourceFolderId, targetFolderId) {
    const moved = [];
    for (const item of items) {
      const res = await fileService.moveItem(item.id, sourceFolderId, targetFolderId);
      moved.push(res);
    }
    return moved;
  },

  /**
   * Downloads a file
   */
  async download(fileId, fileName) {
    return await fileService.downloadFile(fileId, fileName);
  }
};
