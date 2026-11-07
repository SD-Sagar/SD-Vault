import React from 'react';
import { ArrowLeft, ChevronRight, FolderLock, Folder } from 'lucide-react';

export function VaultBreadcrumbs({
  breadcrumbs = [],
  onNavigateBreadcrumb,
  onNavigateUp,
  canNavigateUp
}) {
  return (
    <nav className="vault-breadcrumbs-bar" aria-label="Folder Navigation">
      <button
        className="breadcrumb-back-btn"
        onClick={onNavigateUp}
        disabled={!canNavigateUp}
        title="Go to parent directory"
        aria-label="Parent folder"
      >
        <ArrowLeft size={16} />
      </button>

      <div className="breadcrumbs-trail">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isRoot = index === 0;

          return (
            <React.Fragment key={crumb.id || index}>
              {index > 0 && <ChevronRight size={14} className="breadcrumb-sep" />}

              <button
                className={`breadcrumb-segment ${isLast ? 'current' : ''}`}
                onClick={() => !isLast && onNavigateBreadcrumb?.(index)}
                disabled={isLast}
              >
                {isRoot ? (
                  <FolderLock size={15} style={{ color: 'var(--color-vault-gold)' }} />
                ) : (
                  <Folder size={15} />
                )}
                <span>{crumb.name}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}

