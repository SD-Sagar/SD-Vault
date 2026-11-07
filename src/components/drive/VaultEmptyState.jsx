import React from 'react';
import { FolderOpen, SearchX, FolderPlus } from 'lucide-react';

export function VaultEmptyState({ searchQuery, onOpenNewFolder }) {
  if (searchQuery) {
    return (
      <div className="vault-empty-state">
        <div className="empty-icon-box">
          <SearchX size={32} />
        </div>
        <h4 className="empty-title">No matching files found</h4>
        <p className="empty-subtitle">
          No files or folders matching &quot;{searchQuery}&quot; were found in this directory.
        </p>
      </div>
    );
  }

  return (
    <div className="vault-empty-state">
      <div className="empty-icon-box">
        <FolderOpen size={32} />
      </div>
      <h4 className="empty-title">This folder is currently empty</h4>
      <p className="empty-subtitle">
        Securely store documents, archives, or create nested folders inside this directory.
      </p>
      {onOpenNewFolder && (
        <button
          className="toolbar-btn toolbar-btn-primary"
          onClick={onOpenNewFolder}
        >
          <FolderPlus size={15} />
          <span>Create First Subfolder</span>
        </button>
      )}
    </div>
  );
}

