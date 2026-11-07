import React from 'react';
import { UploadCloud, CheckCircle2, XCircle, X } from 'lucide-react';

export function UploadProgressTray({
  uploads = [],
  onCancelUpload,
  onDismiss
}) {
  if (uploads.length === 0) return null;

  const activeUploads = uploads.filter(u => u.status === 'uploading');
  const isDone = activeUploads.length === 0;

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      left: '2rem',
      width: 'min(340px, calc(100vw - 6.5rem))',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-medium)',
      borderRadius: '14px',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 45,
      overflow: 'hidden',
      animation: 'slide-up 0.25s ease'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'var(--bg-tertiary)',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: '0.82rem',
        fontWeight: 700
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UploadCloud size={16} color="var(--color-vault-gold)" />
          <span>{isDone ? 'Uploads Completed' : `Uploading (${activeUploads.length} remaining)`}</span>
        </div>

        {isDone && (
          <button
            onClick={onDismiss}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div style={{ maxHeight: 200, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {uploads.map(u => (
          <div key={u.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%', color: 'var(--text-primary)' }}>
                {u.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {u.status === 'completed' ? '100%' : `${u.progress}%`}
                </span>
                {u.status === 'uploading' && (
                  <button
                    onClick={() => onCancelUpload(u.id)}
                    title="Cancel upload"
                    aria-label="Cancel upload"
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: 'var(--color-vault-ruby)',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
                {u.status === 'completed' && <CheckCircle2 size={13} color="var(--color-vault-emerald)" />}
                {u.status === 'error' && <XCircle size={13} color="var(--color-vault-ruby)" />}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
              <div style={{
                width: `${u.progress}%`,
                height: '100%',
                background: u.status === 'error'
                  ? 'var(--color-vault-ruby)'
                  : 'linear-gradient(90deg, var(--color-vault-gold), var(--color-vault-cyan))',
                transition: 'width 0.2s ease'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

