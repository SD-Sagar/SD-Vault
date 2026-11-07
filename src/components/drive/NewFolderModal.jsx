import React, { useState, useEffect, useRef } from 'react';
import { FolderPlus, X } from 'lucide-react';

export function NewFolderModal({ isOpen, onClose, onCreateFolder }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please provide a folder name');
      return;
    }
    onCreateFolder(trimmed);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderPlus size={20} color="var(--color-vault-gold)" />
            <h3>New Vault Folder</h3>
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="modal-input"
            placeholder="e.g. Confidential Documents"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            maxLength={100}
          />

          {error && (
            <p style={{ color: 'var(--color-vault-ruby)', fontSize: '0.8rem', marginTop: -15, marginBottom: 15 }}>
              {error}
            </p>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="toolbar-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="toolbar-btn toolbar-btn-primary"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

