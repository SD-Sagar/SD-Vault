import React from 'react';
import {
  FolderPlus,
  RefreshCw,
  LayoutGrid,
  List,
  CheckSquare,
  Square
} from 'lucide-react';

export function VaultToolbar({
  viewMode,
  onSetViewMode,
  onRefresh,
  isLoading,
  onOpenNewFolder,
  selectedCount = 0,
  totalCount = 0,
  onSelectAll,
  onClearSelection
}) {
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  return (
    <div className="vault-toolbar">
      <div className="toolbar-left">
        <button
          className="toolbar-btn toolbar-btn-primary"
          onClick={onOpenNewFolder}
        >
          <FolderPlus size={15} />
          <span>New Folder</span>
        </button>

        <button
          className="toolbar-btn"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh current folder contents"
        >
          <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>

        {totalCount > 0 && (
          <button
            className="toolbar-btn"
            onClick={allSelected ? onClearSelection : onSelectAll}
          >
            {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
            <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
            {selectedCount > 0 && (
              <span className="selection-badge">({selectedCount})</span>
            )}
          </button>
        )}
      </div>

      <div className="toolbar-right">
        <button
          className={`toolbar-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => onSetViewMode('grid')}
          title="Grid view"
          aria-label="Grid view"
        >
          <LayoutGrid size={15} />
        </button>

        <button
          className={`toolbar-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => onSetViewMode('list')}
          title="List view"
          aria-label="List view"
        >
          <List size={15} />
        </button>
      </div>
    </div>
  );
}

