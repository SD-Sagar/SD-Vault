import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export function DeleteConfirmModal({
  items = [],
  isOpen,
  onClose,
  onConfirmDelete,
  isDeleting,
  title = 'Confirm Deletion',
  confirmButtonText = 'Delete',
  warningNotice = 'This action is permanent and directly removes files from your Google Drive storage.'
}) {
  if (!isOpen || items.length === 0) return null;

  const isMultiple = items.length > 1;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-vault-ruby)' }}>
            <Trash2 size={20} />
            <h3>{title}</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: '1.2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isMultiple ? (
            <p>Are you sure you want to process <strong>{items.length} items</strong>?</p>
          ) : (
            <p>Are you sure you want to process <strong>&quot;{items[0].name}&quot;</strong>?</p>
          )}
        </div>

        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          color: 'var(--color-vault-ruby)',
          fontSize: '0.78rem',
          marginBottom: '1.5rem'
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{warningNotice}</span>
        </div>

        <div className="modal-footer">
          <button type="button" className="toolbar-btn" onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
          <button
            type="button"
            className="toolbar-btn"
            style={{ background: 'var(--color-vault-ruby)', color: '#fff', border: 'none', fontWeight: 700 }}
            onClick={onConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Processing...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
