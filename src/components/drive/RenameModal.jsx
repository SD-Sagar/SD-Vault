import React, { useState, useEffect, useRef } from 'react';
import { Edit2, X } from 'lucide-react';

export function RenameModal({ item, isOpen, onClose, onRename }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && item) {
      setName(item.name || '');
      setError('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Select base name without extension for files
          const dotIdx = item.name.lastIndexOf('.');
          if (!item.isFolder && dotIdx > 0) {
            inputRef.current.setSelectionRange(0, dotIdx);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name cannot be empty.');
      return;
    }
    if (trimmed === item.name) {
      onClose();
      return;
    }
    onRename(item.id, trimmed);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Edit2 size={18} color="var(--color-vault-gold)" />
            <h3>Rename {item.isFolder ? 'Folder' : 'File'}</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="modal-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />

          {error && (
            <p style={{ color: 'var(--color-vault-ruby)', fontSize: '0.8rem', marginTop: -15, marginBottom: 15 }}>
              {error}
            </p>
          )}

          <div className="modal-footer">
            <button type="button" className="toolbar-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="toolbar-btn toolbar-btn-primary">
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

