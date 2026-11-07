/**
 * VaultItem Model
 * Normalizes Google Drive API file and folder resources into clean, uniform objects.
 */

import { GOOGLE_DRIVE } from '../constants';

export class VaultItem {
  constructor(raw = {}) {
    this.id = raw.id || '';
    this.name = raw.name || 'Untitled';
    this.mimeType = raw.mimeType || 'application/octet-stream';
    this.isFolder = raw.mimeType === GOOGLE_DRIVE.MIME_TYPES.FOLDER;
    this.size = raw.size ? parseInt(raw.size, 10) : 0;
    this.modifiedTime = raw.modifiedTime ? new Date(raw.modifiedTime) : new Date();
    this.createdTime = raw.createdTime ? new Date(raw.createdTime) : new Date();
    this.parents = raw.parents || [];
    this.thumbnailLink = raw.thumbnailLink || null;
    this.iconLink = raw.iconLink || null;
    this.webViewLink = raw.webViewLink || null;
    this.webContentLink = raw.webContentLink || null;
    this.trashed = Boolean(raw.trashed);
    this.canDelete = raw.capabilities ? Boolean(raw.capabilities.canDelete) : true;
    this.canTrash = raw.capabilities ? Boolean(raw.capabilities.canTrash) : true;
  }

  get formattedSize() {
    if (this.isFolder) return '—';
    if (!this.size || this.size === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(this.size) / Math.log(1024));
    const sizeInUnit = (this.size / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
    return `${sizeInUnit} ${units[i]}`;
  }

  get formattedDate() {
    if (!this.modifiedTime) return '—';
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(this.modifiedTime);
  }

  get category() {
    if (this.isFolder) return 'folder';
    const mime = this.mimeType.toLowerCase();

    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('gzip')) return 'archive';
    if (mime.includes('spreadsheet') || mime.includes('csv') || mime.includes('excel')) return 'spreadsheet';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'presentation';
    if (mime.includes('document') || mime.includes('word') || mime.includes('text/')) return 'document';
    if (mime.includes('json') || mime.includes('javascript') || mime.includes('html') || mime.includes('xml')) return 'code';

    return 'file';
  }
}
