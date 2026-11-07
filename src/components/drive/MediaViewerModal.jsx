import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  Play,
  Film,
  Music,
  ExternalLink
} from 'lucide-react';
import { googleTokenService } from '../../services/googleTokenService';
import { fileService } from '../../services/fileService';
import './MediaViewerModal.css';

export function MediaViewerModal({ item, isOpen, onClose }) {
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!isOpen || !item) {
      if (mediaBlobUrl) {
        URL.revokeObjectURL(mediaBlobUrl);
        setMediaBlobUrl(null);
      }
      setZoom(1);
      setRotation(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    async function loadMedia() {
      try {
        const token = googleTokenService.getAccessToken();
        if (!token) {
          throw new Error('Google Drive authorization token expired.');
        }

        // Fetch media blob with authorization header
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${item.id}?alt=media`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error(`Failed to stream media: HTTP ${res.status}`);
        }

        const blob = await res.blob();
        if (!isCancelled) {
          const url = URL.createObjectURL(blob);
          setMediaBlobUrl(url);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[MediaViewerModal] Media load error:', err);
        if (!isCancelled) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    loadMedia();

    // Close on Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isCancelled = true;
      window.removeEventListener('keydown', handleKeyDown);
      if (mediaBlobUrl) {
        URL.revokeObjectURL(mediaBlobUrl);
      }
    };
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleDownload = () => {
    fileService.downloadFile(item.id, item.name);
  };

  const isImage = item.category === 'image';
  const isVideo = item.category === 'video';
  const isAudio = item.category === 'audio';

  return (
    <div className="media-viewer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="media-viewer-container" onClick={(e) => e.stopPropagation()}>
        {/* Header Toolbar */}
        <div className="media-viewer-header">
          <div className="media-viewer-title-box">
            <span className="media-title" title={item.name}>{item.name}</span>
            <span className="media-badge">{item.formattedSize}</span>
          </div>

          <div className="media-viewer-controls">
            {isImage && (
              <>
                <button
                  className="viewer-btn"
                  onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  className="viewer-btn"
                  onClick={() => setZoom(1)}
                  title="Reset Zoom"
                >
                  <span>{Math.round(zoom * 100)}%</span>
                </button>
                <button
                  className="viewer-btn"
                  onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  className="viewer-btn"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  title="Rotate 90°"
                >
                  <RotateCw size={16} />
                </button>
              </>
            )}

            <button
              className="viewer-btn primary"
              onClick={handleDownload}
              title="Download Original"
            >
              <Download size={16} />
              <span>Download</span>
            </button>

            {item.webViewLink && (
              <a
                href={item.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="viewer-btn"
                title="Open in Google Drive"
              >
                <ExternalLink size={16} />
              </a>
            )}

            <button className="viewer-btn close" onClick={onClose} aria-label="Close Viewer">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Media Viewport */}
        <div className="media-viewer-body">
          {isLoading && (
            <div className="media-viewer-loading">
              <div className="viewer-spinner" />
              <span>Streaming secure preview from Google Drive...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="media-viewer-error">
              <Film size={36} color="var(--color-vault-ruby)" />
              <p>Unable to stream preview: {error}</p>
              <button className="viewer-btn primary" onClick={handleDownload}>
                Download to View
              </button>
            </div>
          )}

          {!isLoading && !error && mediaBlobUrl && (
            <>
              {isImage && (
                <div className="image-viewport">
                  <img
                    src={mediaBlobUrl}
                    alt={item.name}
                    className="viewer-image"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`
                    }}
                  />
                </div>
              )}

              {isVideo && (
                <div className="video-viewport" style={{ position: 'relative' }}>
                  <video
                    src={mediaBlobUrl}
                    controls
                    autoPlay
                    className="viewer-video"
                  >
                    Your browser does not support the video tag.
                  </video>
                  {item.name.toLowerCase().endsWith('.3gp') && (
                    <div style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(15, 23, 42, 0.92)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: 'var(--color-vault-amber)',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      backdropFilter: 'blur(8px)',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                      Legacy 3GP media — browser audio active. For visual video, download file or convert to MP4.
                    </div>
                  )}
                </div>
              )}

              {isAudio && (
                <div className="audio-viewport">
                  <div className="audio-card">
                    <Music size={48} color="var(--color-vault-gold)" />
                    <h4>{item.name}</h4>
                    <audio src={mediaBlobUrl} controls autoPlay className="viewer-audio" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

