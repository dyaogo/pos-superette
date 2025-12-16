import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ModuleErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log l'erreur à Sentry avec contexte
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
          module: {
            name: this.props.moduleName || 'Unknown Module',
          },
        },
        tags: {
          error_boundary: this.props.moduleName || 'module',
        },
      });
    }

    this.setState({
      error,
      errorInfo,
    });

    // Log en console en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ModuleErrorBoundary:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Callback optionnel pour reset custom
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: 'var(--space-xl)',
            background: 'var(--color-bg)',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '600px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto var(--space-lg)',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={32} color="var(--color-danger)" />
            </div>

            <h2
              style={{
                fontSize: '24px',
                fontWeight: '700',
                marginBottom: 'var(--space-md)',
                color: 'var(--color-text-primary)',
              }}
            >
              {this.props.fallbackTitle || 'Une erreur est survenue'}
            </h2>

            <p
              style={{
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-lg)',
                fontSize: '14px',
                lineHeight: '1.6',
              }}
            >
              {this.props.fallbackMessage ||
                'Le module a rencontré une erreur inattendue. Nos équipes ont été notifiées et travaillent à résoudre le problème.'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                style={{
                  marginTop: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  background: 'var(--color-surface-hover)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  marginBottom: 'var(--space-lg)',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: 'var(--space-sm)' }}>
                  Détails techniques (dev only)
                </summary>
                <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-sm)' }}>
                  {this.state.error.toString()}
                </p>
                <pre style={{ fontSize: '11px', overflow: 'auto' }}>
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
              >
                <RefreshCw size={18} />
                Réessayer
              </button>

              {this.props.onGoHome && (
                <button
                  onClick={this.props.onGoHome}
                  className="btn"
                  style={{
                    background: 'var(--color-surface-hover)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Retour à l'accueil
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ModuleErrorBoundary;
