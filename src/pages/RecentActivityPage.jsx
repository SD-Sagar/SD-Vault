import React, { useState, useEffect } from 'react';
import { metadataService } from '../services/metadataService';
import { useAuth } from '../hooks/useAuth';
import { useVault } from '../hooks/useVault';
import { Clock, Star, FileText, CheckCircle2 } from 'lucide-react';
import { VaultItemCard } from '../components/drive/VaultItemCard';

export function RecentActivityPage({ view = 'recent' }) {
  const { user } = useAuth();
  const { items, navigateInto, selectedItemIds, toggleSelect } = useVault();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (user?.id) {
        setIsLoading(true);
        const data = await metadataService.getRecentActivity(user.id);
        setActivities(data);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }
    load();
  }, [user]);

  if (view === 'starred') {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
          <Star size={22} color="var(--color-vault-gold)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Starred Items</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Starred files and directories appear here for quick access.
        </p>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            No starred items yet.
          </div>
        ) : (
          <div className="vault-items-grid">
            {items.slice(0, 4).map(item => (
              <VaultItemCard
                key={item.id}
                item={item}
                isSelected={selectedItemIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onOpenItem={navigateInto}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.5rem' }}>
        <Clock size={22} color="var(--color-vault-gold)" />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Recent Vault Activity</h2>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Audit log of files uploaded, modified, or managed inside SD-Vault.
      </p>

      {activities.length === 0 ? (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14,
          padding: '3rem 1.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <CheckCircle2 size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <p>No recent actions recorded yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activities.map(act => (
            <div
              key={act.id}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={16} color="var(--color-vault-gold)" />
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{act.item_name}</span>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}>
                  {act.action}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

