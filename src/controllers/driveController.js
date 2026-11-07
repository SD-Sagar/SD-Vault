/**
 * Drive Controller
 * Coordinates root folder resolution, storage quota synchronization, and Drive initialization.
 */

import { googleDriveService } from '../services/googleDriveService';
import { GOOGLE_DRIVE } from '../constants';

export const driveController = {
  /**
   * Initializes the Google Drive connection:
   * 1. Resolves or creates root 'SD-Vault' folder
   * 2. Retrieves storage quota
   * 3. Loads root folder contents
   */
  async initializeDrive() {
    const rootFolderId = await googleDriveService.findOrCreateRootFolder();
    const quota = await googleDriveService.getStorageQuota();
    const items = await googleDriveService.listFolderContents(rootFolderId);

    return {
      rootFolderId,
      currentFolderId: rootFolderId,
      currentFolderName: GOOGLE_DRIVE.ROOT_FOLDER_NAME,
      breadcrumbs: [{ id: rootFolderId, name: GOOGLE_DRIVE.ROOT_FOLDER_NAME }],
      quota,
      items
    };
  },

  /**
   * Refreshes items in a given folder
   */
  async refreshFolder(folderId, { searchQuery = '' } = {}) {
    const items = await googleDriveService.listFolderContents(folderId, { searchQuery });
    return items;
  },

  /**
   * Refreshes storage quota
   */
  async refreshQuota() {
    return await googleDriveService.getStorageQuota();
  }
};
