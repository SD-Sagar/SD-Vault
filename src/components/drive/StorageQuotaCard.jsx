import React from 'react';
import { HardDrive, Shield, Sparkles } from 'lucide-react';

export function StorageQuotaCard({ quota }) {
  if (!quota) return null;

  const percent = Math.min(Math.max(quota.percent || 0, 0), 100);
  const isHighUsage = percent > 85;

  return (
    <div className="stat-card" style={{ flex: 1, minWidth: 280 }}>
      <div className="stat-icon" style={{
        color: isHighUsage ? 'var(--color-vault-amber)' : 'var(--color-vault-gold)'
      }}>
        <HardDrive size={24} />
      </div>

      <div className="stat-content" style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4>Google Drive Quota</h4>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            {percent}% used
          </span>
        </div>

        <p style={{ fontSize: '1.2rem', margin: '4px 0 8px 0' }}>
          {quota.usageFormatted} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {quota.limitFormatted}</span>
        </p>

        {/* Visual Progress Indicator */}
        <div style={{
          width: '100%',
          height: 8,
          borderRadius: 4,
          background: 'var(--bg-tertiary)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: `${percent}%`,
            height: '100%',
            background: isHighUsage
              ? 'linear-gradient(90deg, var(--color-vault-amber), var(--color-vault-ruby))'
              : 'linear-gradient(90deg, var(--color-vault-gold), var(--color-vault-cyan))',
            borderRadius: 4,
            transition: 'width 0.4s ease'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>Available: {quota.remainingFormatted}</span>
          <span>Scope: drive.file</span>
        </div>
      </div>
    </div>
  );
}

