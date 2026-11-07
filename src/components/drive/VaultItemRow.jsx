import React, { useState } from 'react';
import { ItemIcon } from './ItemIcon';
import { Check, Eye } from 'lucide-react';

export function VaultItemRow({
  item,
  isSelected,
  onToggleSelect,
  onOpenItem,
  onPreviewMedia
}) {
  const [thumbError, setThumbError] = useState(false);
  const isMedia = item.category === 'image' || item.category === 'video';
  const hasThumbnail = Boolean(item.thumbnailLink) && !thumbError;

  const handleClick = (e) => {
    if (e.target.closest('.row-select-btn') || e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      onToggleSelect?.(item.id);
      return;
    }

    if (item.isFolder) {
      onOpenItem?.(item);
    } else if (isMedia) {
      onPreviewMedia?.(item);
    } else {
      onToggleSelect?.(item.id);
    }
  };

  const handleDoubleClick = () => {
    if (item.isFolder) {
      onOpenItem?.(item);
    } else if (isMedia) {
      onPreviewMedia?.(item);
    } else if (item.webViewLink) {
      window.open(item.webViewLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`vault-item-row ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role="row"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleDoubleClick();
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          className="row-select-btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(item.id);
          }}
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: isSelected ? 'var(--color-vault-gold)' : 'var(--bg-tertiary)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0
          }}
          aria-label={isSelected ? 'Deselect item' : 'Select item'}
        >
          {isSelected && <Check size={11} color="#000" strokeWidth={3} />}
        </button>
      </div>

      <div className="row-name-col">
        {hasThumbnail ? (
          <img
            src={item.thumbnailLink}
            alt=""
            className="row-mini-thumb"
            onError={() => setThumbError(true)}
            loading="lazy"
          />
        ) : (
          <ItemIcon category={item.category} size={18} />
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
      </div>

      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
        {item.isFolder ? '—' : item.formattedSize}
      </div>

      <div className="row-date-col" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        {item.formattedDate}
      </div>
    </div>
  );
}
