import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary capturó un error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          maxWidth: '800px',
          margin: '2rem auto',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          fontFamily: 'sans-serif',
          color: '#1e293b'
        }}>
          <h2 style={{ color: '#ef4444', marginTop: 0 }}>⚠️ Ocurrió un error en la interfaz</h2>
          <p><strong>Detalle:</strong> {this.state.error?.toString()}</p>
          <pre style={{
            background: '#f1f5f9',
            padding: '1rem',
            borderRadius: '4px',
            overflowX: 'auto',
            fontSize: '0.8rem',
            color: '#dc2626'
          }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Limpiar sesión y volver a Iniciar Sesión
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
