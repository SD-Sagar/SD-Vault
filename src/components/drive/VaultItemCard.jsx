import React, { useState } from 'react';
import { ItemIcon } from './ItemIcon';
import { Check, Play, Eye } from 'lucide-react';

export function VaultItemCard({
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
    if (e.target.closest('.card-select-btn') || e.ctrlKey || e.metaKey) {
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

  // Higher res thumbnail for crisp Windows-like preview
  const displayThumbUrl = item.thumbnailLink
    ? item.thumbnailLink.replace(/=s\d+/, '=s400')
    : null;

  return (
    <div
      className={`vault-item-card ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={`${item.name} (${item.formattedSize})`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleDoubleClick();
      }}
    >
      {/* Checkbox button top-left */}
      <button
        className="card-select-btn"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect?.(item.id);
        }}
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          width: 20,
          height: 20,
          borderRadius: 4,
          background: isSelected ? 'var(--color-vault-gold)' : 'var(--bg-glass)',
          border: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          zIndex: 10
        }}
        aria-label={isSelected ? 'Deselect item' : 'Select item'}
      >
        {isSelected && <Check size={12} color="#000" strokeWidth={3} />}
      </button>

      {/* Quick Preview Eye button top-right for media */}
      {isMedia && (
        <button
          className="card-preview-btn"
          onClick={(e) => {
            e.stopPropagation();
            onPreviewMedia?.(item);
          }}
          title="Open preview"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            border: '1px solid var(--border-subtle)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            zIndex: 10
          }}
        >
          <Eye size={13} />
        </button>
      )}

      {/* Windows-like Thumbnail Preview Box */}
      {hasThumbnail ? (
        <div className="item-thumbnail-container">
          <img
            src={displayThumbUrl}
            alt={item.name}
            className="item-thumbnail-img"
            onError={() => setThumbError(true)}
            loading="lazy"
          />
          {item.category === 'video' && (
            <div className="video-play-badge">
              <Play size={14} fill="#fff" color="#fff" />
            </div>
          )}
        </div>
      ) : (
        <div className={`item-icon-box ${item.category}`}>
          <ItemIcon category={item.category} size={28} />
        </div>
      )}

      <div className="item-name">{item.name}</div>
      <div className="item-meta">
        {item.isFolder ? 'Folder' : item.formattedSize}
      </div>
    </div>
  );
}
