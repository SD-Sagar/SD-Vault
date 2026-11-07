import React, { Component } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SD-Vault ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          textAlign: 'center'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            color: 'var(--color-vault-ruby)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.2rem'
          }}>
            <AlertOctagon size={32} />
          </div>

          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Security Protocol Interrupted</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 460, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            An unexpected error occurred in the vault interface. Your Google Drive files remain safe and intact.
          </p>

          <button
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 10,
              background: 'var(--color-vault-gold)',
              color: '#000',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={16} />
            <span>Reload SD-Vault</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

