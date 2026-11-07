import React from 'react';
import {
  Download,
  Edit2,
  Copy,
  Scissors,
  ClipboardPaste,
  Trash2,
  X
} from 'lucide-react';
import './SelectionActionBar.css';

export function SelectionActionBar({
  selectedItems = [],
  clipboard = { items: [], operation: null },
  onDownload,
  onRename,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onClearSelection
}) {
  const selectedCount = selectedItems.length;
  const hasSelection = selectedCount > 0;
  const hasClipboard = clipboard.items.length > 0;

  if (!hasSelection && !hasClipboard) return null;

  const canDownload = selectedCount === 1 && !selectedItems[0].isFolder;
  const canRename = selectedCount === 1;

  return (
    <div className="selection-action-bar" role="toolbar" aria-label="Selection actions">
      {hasSelection ? (
        <div className="selection-info">
          <button className="btn-icon" onClick={onClearSelection} title="Clear selection">
            <X size={15} />
          </button>
          <span>{selectedCount} item{selectedCount > 1 ? 's' : ''} selected</span>
        </div>
      ) : (
        <div className="selection-info">
          <span>
            Clipboard: {clipboard.items.length} item{clipboard.items.length > 1 ? 's' : ''} ({clipboard.operation})
          </span>
        </div>
      )}

      <div className="selection-actions-group">
        {canDownload && (
          <button className="action-pill-btn" onClick={() => onDownload(selectedItems[0])} title="Download file">
            <Download size={14} />
            <span>Download</span>
          </button>
        )}

        {canRename && (
          <button className="action-pill-btn" onClick={() => onRename(selectedItems[0])} title="Rename item">
            <Edit2 size={14} />
            <span>Rename</span>
          </button>
        )}

        {hasSelection && (
          <>
            <button className="action-pill-btn" onClick={() => onCopy(selectedItems)} title="Copy to virtual clipboard">
              <Copy size={14} />
              <span>Copy</span>
            </button>

            <button className="action-pill-btn" onClick={() => onCut(selectedItems)} title="Cut (Move) items">
              <Scissors size={14} />
              <span>Cut</span>
            </button>
          </>
        )}

        {hasClipboard && (
          <button
            className="action-pill-btn active-paste"
            onClick={onPaste}
            title={`Paste ${clipboard.items.length} items here`}
          >
            <ClipboardPaste size={14} />
            <span>Paste Here ({clipboard.items.length})</span>
          </button>
        )}

        {hasSelection && (
          <button
            className="action-pill-btn danger"
            onClick={() => onDelete(selectedItems)}
            title="Delete selected items"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}

