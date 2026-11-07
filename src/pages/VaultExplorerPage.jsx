import React from 'react';
import { useVault } from '../hooks/useVault';
import { VaultBreadcrumbs } from '../components/drive/VaultBreadcrumbs';
import { VaultToolbar } from '../components/drive/VaultToolbar';
import { VaultItemCard } from '../components/drive/VaultItemCard';
import { VaultItemRow } from '../components/drive/VaultItemRow';
import { VaultEmptyState } from '../components/drive/VaultEmptyState';
import { NewFolderModal } from '../components/drive/NewFolderModal';
import { RenameModal } from '../components/drive/RenameModal';
import { DeleteConfirmModal } from '../components/drive/DeleteConfirmModal';
import { FloatingActionButton } from '../components/drive/FloatingActionButton';
import { SelectionActionBar } from '../components/drive/SelectionActionBar';
import { UploadProgressTray } from '../components/drive/UploadProgressTray';
import { MediaViewerModal } from '../components/drive/MediaViewerModal';
import { extractFilesFromDataTransfer } from '../utils/fileSystem';
import { RefreshCw, AlertCircle, UploadCloud } from 'lucide-react';
import '../components/drive/VaultDrive.css';

export function VaultExplorerPage() {
  const {
    items,
    breadcrumbs,
    isLoading,
    error,
    searchQuery,
    viewMode,
    selectedItemIds,
    isNewFolderModalOpen,
    renameModalItem,
    deleteModalItems,
    mediaPreviewItem,
    clipboard,
    uploads,
    isDraggingOver,
    refresh,
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
    openNewFolderModal,
    closeNewFolderModal,
    openRenameModal,
    closeRenameModal,
    openDeleteModal,
    closeDeleteModal,
    openMediaPreview,
    closeMediaPreview,
    setDragOver
  } = useVault();

  const canNavigateUp = breadcrumbs.length > 1;

  // Filter items if searching
  const filteredItems = searchQuery
    ? items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const selectedItems = items.filter(i => selectedItemIds.has(i.id));

  // Drag and drop handlers with recursive folder extraction
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    try {
      const extractedFiles = await extractFilesFromDataTransfer(e.dataTransfer);
      if (extractedFiles.length > 0) {
        // If any file has a relative path with subdirectories, use uploadFolder
        const hasFolderStructure = extractedFiles.some(f => f.webkitRelativePath && f.webkitRelativePath.includes('/'));
        if (hasFolderStructure) {
          uploadFolder(extractedFiles);
        } else {
          uploadFiles(extractedFiles);
        }
      }
    } catch (err) {
      console.error('[VaultExplorer] Error parsing dropped files:', err);
    }
  };

  return (
    <div
      className={`vault-explorer-container ${isDraggingOver ? 'dragging-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: 'relative', minHeight: '60vh' }}
    >
      {/* Drag & Drop Visual Backdrop Overlay */}
      {isDraggingOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(229, 169, 60, 0.12)',
          border: '2px dashed var(--color-vault-gold)',
          borderRadius: 16,
          zIndex: 45,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)'
        }}>
          <UploadCloud size={54} color="var(--color-vault-gold)" />
          <h3 style={{ marginTop: 12, color: 'var(--color-vault-gold)', fontSize: '1.2rem' }}>
            Drop files or entire folders to upload into vault
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
            Subdirectories will be preserved automatically
          </p>
        </div>
      )}

      {/* Navigation Breadcrumbs */}
      <VaultBreadcrumbs
        breadcrumbs={breadcrumbs}
        onNavigateBreadcrumb={navigateToBreadcrumb}
        onNavigateUp={navigateUp}
        canNavigateUp={canNavigateUp}
      />

      {/* Explorer Controls Toolbar */}
      <VaultToolbar
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        onRefresh={refresh}
        isLoading={isLoading}
        onOpenNewFolder={openNewFolderModal}
        selectedCount={selectedItemIds.size}
        totalCount={filteredItems.length}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
      />

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 10,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--color-vault-ruby)',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={refresh}
            className="toolbar-btn"
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '2rem 0', color: 'var(--color-vault-gold)' }}>
          <RefreshCw size={20} className="spin" />
          <span style={{ fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}>Synchronizing with Google Drive...</span>
        </div>
      )}

      {/* Main Content: Grid vs List vs Empty State */}
      {!isLoading && filteredItems.length === 0 ? (
        <VaultEmptyState
          searchQuery={searchQuery}
          onOpenNewFolder={openNewFolderModal}
        />
      ) : (
        viewMode === 'grid' ? (
          <div className="vault-items-grid">
            {filteredItems.map(item => (
              <VaultItemCard
                key={item.id}
                item={item}
                isSelected={selectedItemIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onOpenItem={navigateInto}
                onPreviewMedia={openMediaPreview}
              />
            ))}
          </div>
        ) : (
          <div className="vault-items-list">
            <div className="list-header">
              <span />
              <span>Name</span>
              <span>Size</span>
              <span className="row-date-col">Modified</span>
            </div>
            {filteredItems.map(item => (
              <VaultItemRow
                key={item.id}
                item={item}
                isSelected={selectedItemIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onOpenItem={navigateInto}
                onPreviewMedia={openMediaPreview}
              />
            ))}
          </div>
        )
      )}

      {/* Floating Action Button (+) with Folder Upload */}
      <FloatingActionButton
        onUploadFiles={uploadFiles}
        onUploadFolder={uploadFolder}
        onOpenNewFolder={openNewFolderModal}
      />

      {/* Selection Action Bar (Copy, Cut, Paste, Rename, Move to Trash, Download) */}
      <SelectionActionBar
        selectedItems={selectedItems}
        clipboard={clipboard}
        onDownload={downloadItem}
        onRename={openRenameModal}
        onCopy={copyToClipboard}
        onCut={cutToClipboard}
        onPaste={pasteFromClipboard}
        onDelete={openDeleteModal}
        onClearSelection={clearSelection}
      />

      {/* Upload Progress Tray */}
      <UploadProgressTray
        uploads={uploads}
        onCancelUpload={cancelUpload}
        onDismiss={clearCompletedUploads}
      />

      {/* Media Viewer Lightbox Modal */}
      <MediaViewerModal
        item={mediaPreviewItem}
        isOpen={Boolean(mediaPreviewItem)}
        onClose={closeMediaPreview}
      />

      {/* New Folder Creation Modal */}
      <NewFolderModal
        isOpen={isNewFolderModalOpen}
        onClose={closeNewFolderModal}
        onCreateFolder={createFolder}
      />

      {/* Rename Modal */}
      <RenameModal
        item={renameModalItem}
        isOpen={Boolean(renameModalItem)}
        onClose={closeRenameModal}
        onRename={renameItem}
      />

      {/* Move to Trash Confirmation Modal */}
      <DeleteConfirmModal
        items={deleteModalItems}
        isOpen={deleteModalItems.length > 0}
        onClose={closeDeleteModal}
        onConfirmDelete={() => deleteItems(deleteModalItems)}
        isDeleting={isLoading}
        title="Move to Trash"
        confirmButtonText="Move to Trash"
        warningNotice="Items moved to Trash are automatically purged by Google Drive after 30 days. You can restore them anytime from the Trash tab."
      />
    </div>
  );
}
