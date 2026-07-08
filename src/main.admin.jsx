import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WrenchIQAdminApp from './WrenchIQAdminApp'
import { BrandingProvider } from './context/BrandingContext'
import { DemoProvider } from './context/DemoContext'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#1a1a1a', color: '#f87171', minHeight: '100vh' }}>
          <h2 style={{ marginBottom: 16 }}>WrenchIQ Admin startup error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{String(this.state.error)}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#94a3b8', marginTop: 16 }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <DemoProvider>
        <BrandingProvider>
          <WrenchIQAdminApp />
        </BrandingProvider>
      </DemoProvider>
    </ErrorBoundary>
  </StrictMode>,
)
