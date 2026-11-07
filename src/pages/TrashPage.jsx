import React, { useState, useEffect, useCallback } from 'react';
import { googleDriveService } from '../services/googleDriveService';
import { fileService } from '../services/fileService';
import { useVault } from '../context/VaultContext';
import { VaultItemCard } from '../components/drive/VaultItemCard';
import { VaultItemRow } from '../components/drive/VaultItemRow';
import { DeleteConfirmModal } from '../components/drive/DeleteConfirmModal';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  LayoutGrid,
  List,
  Clock,
  ShieldAlert
} from 'lucide-react';
import '../components/drive/VaultDrive.css';

export function TrashPage() {
  const { refreshQuota } = useVault();
  const [trashItems, setTrashItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid');
  const [isPermanentModalOpen, setIsPermanentModalOpen] = useState(false);
  const [itemsToWipe, setItemsToWipe] = useState([]);
  const [isActionInProgress, setIsActionInProgress] = useState(false);

  const fetchTrash = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await googleDriveService.listTrash();
      setTrashItems(items);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('[TrashPage] Failed to fetch trash:', err);
      setError(err.message || 'Failed to load Trash items.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === trashItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(trashItems.map(i => i.id)));
    }
  };

  // Restore selected items
  const handleRestoreSelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setIsActionInProgress(true);
    try {
      await fileService.restoreMultipleFromTrash(ids);
      await fetchTrash();
      refreshQuota?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Trigger permanent delete modal
  const handlePromptPermanentDelete = (items) => {
    setItemsToWipe(items);
    setIsPermanentModalOpen(true);
  };

  // Confirm permanent deletion
  const handleConfirmPermanentDelete = async () => {
    setIsActionInProgress(true);
    try {
      await fileService.deleteMultiplePermanently(itemsToWipe);
      setIsPermanentModalOpen(false);
      setItemsToWipe([]);
      await fetchTrash();
      refreshQuota?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Empty entire trash
  const handleEmptyTrash = async () => {
    if (!trashItems.length) return;
    setItemsToWipe(trashItems);
    setIsPermanentModalOpen(true);
  };

  const selectedItems = trashItems.filter(i => selectedIds.has(i.id));

  return (
    <div className="vault-explorer-container">
      {/* 30-Day Auto Purge Warning Notice */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 12,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock size={20} color="var(--color-vault-amber)" />
          <div>
            <strong style={{ color: 'var(--color-vault-amber)', fontSize: '0.88rem' }}>
              Vault Trash Policy: Automatic 30-Day Auto-Purge
            </strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: 2 }}>
              Items placed in trash are automatically purged permanently by Google Drive after 30 days (1 month).
            </p>
          </div>
        </div>

        {trashItems.length > 0 && (
          <button
            className="toolbar-btn"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--color-vault-ruby)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontWeight: 700
            }}
            onClick={handleEmptyTrash}
            disabled={isActionInProgress}
          >
            <Trash2 size={15} />
            <span>Empty Trash</span>
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="vault-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn" onClick={fetchTrash} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          {trashItems.length > 0 && (
            <button className="toolbar-btn" onClick={handleSelectAll}>
              <span>{selectedIds.size === trashItems.length ? 'Deselect All' : 'Select All'}</span>
              {selectedIds.size > 0 && (
                <span className="selection-badge">({selectedIds.size})</span>
              )}
            </button>
          )}

          {selectedIds.size > 0 && (
            <>
              <button
                className="toolbar-btn"
                style={{ background: 'var(--color-vault-gold)', color: '#000', fontWeight: 700 }}
                onClick={handleRestoreSelected}
                disabled={isActionInProgress}
              >
                <RotateCcw size={14} />
                <span>Restore Selected ({selectedIds.size})</span>
              </button>

              <button
                className="toolbar-btn"
                style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-vault-ruby)', border: '1px solid var(--color-vault-ruby)' }}
                onClick={() => handlePromptPermanentDelete(selectedItems)}
                disabled={isActionInProgress}
              >
                <Trash2 size={14} />
                <span>Delete Permanently</span>
              </button>
            </>
          )}
        </div>

        <div className="toolbar-right">
          <button
            className={`toolbar-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            className={`toolbar-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '3rem 0', color: 'var(--color-vault-gold)' }}>
          <RefreshCw size={20} className="spin" />
          <span style={{ fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}>Loading Vault Trash...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 10,
          padding: '10px 16px',
          color: 'var(--color-vault-ruby)',
          fontSize: '0.85rem'
        }}>
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && trashItems.length === 0 && (
        <div className="vault-empty-state">
          <div className="empty-icon-box">
            <Trash2 size={32} />
          </div>
          <h4 className="empty-title">Trash is Empty</h4>
          <p className="empty-subtitle">
            Files and folders you delete will appear here before being permanently removed after 30 days.
          </p>
        </div>
      )}

      {/* Trash Items */}
      {!isLoading && trashItems.length > 0 && (
        viewMode === 'grid' ? (
          <div className="vault-items-grid">
            {trashItems.map(item => (
              <VaultItemCard
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onOpenItem={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="vault-items-list">
            <div className="list-header">
              <span />
              <span>Name</span>
              <span>Size</span>
              <span className="row-date-col">Trashed Date</span>
            </div>
            {trashItems.map(item => (
              <VaultItemRow
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onOpenItem={() => {}}
              />
            ))}
          </div>
        )
      )}

      {/* Permanent Delete Modal */}
      <DeleteConfirmModal
        items={itemsToWipe}
        isOpen={isPermanentModalOpen}
        onClose={() => setIsPermanentModalOpen(false)}
        onConfirmDelete={handleConfirmPermanentDelete}
        isDeleting={isActionInProgress}
      />
    </div>
  );
}

