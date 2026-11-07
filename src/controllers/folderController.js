/**
 * Folder Controller
 * Manages folder creation and breadcrumb navigation within the SD-Vault root boundary.
 */

import { googleDriveService } from '../services/googleDriveService';

export const folderController = {
  /**
   * Creates a subfolder in the current parent directory
   */
  async createFolder(name, parentFolderId) {
    const newFolder = await googleDriveService.createFolder(name, parentFolderId);
    return newFolder;
  },

  /**
   * Navigates into a subfolder, updating the breadcrumb path
   */
  async navigateInto(folderItem, currentBreadcrumbs) {
    const items = await googleDriveService.listFolderContents(folderItem.id);
    const newBreadcrumbs = [...currentBreadcrumbs, { id: folderItem.id, name: folderItem.name }];

    return {
      folderId: folderItem.id,
      folderName: folderItem.name,
      breadcrumbs: newBreadcrumbs,
      items
    };
  },

  /**
   * Navigates directly to a selected breadcrumb in the path
   */
  async navigateToBreadcrumb(targetIndex, currentBreadcrumbs) {
    const target = currentBreadcrumbs[targetIndex];
    if (!target) return null;

    const items = await googleDriveService.listFolderContents(target.id);
    const newBreadcrumbs = currentBreadcrumbs.slice(0, targetIndex + 1);

    return {
      folderId: target.id,
      folderName: target.name,
      breadcrumbs: newBreadcrumbs,
      items
    };
  },

  /**
   * Navigates up one folder level
   */
  async navigateUp(currentBreadcrumbs) {
    if (currentBreadcrumbs.length <= 1) return null; // Already at root
    const parentIndex = currentBreadcrumbs.length - 2;
    return await this.navigateToBreadcrumb(parentIndex, currentBreadcrumbs);
  }
};
