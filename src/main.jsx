import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WrenchIQApp from './WrenchIQApp'
import { BrandingProvider } from './context/BrandingContext'
import { DemoProvider, useDemo } from './context/DemoContext'
import { ShopObjectivesProvider } from './context/ShopObjectivesContext'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#1a1a1a', color: '#f87171', minHeight: '100vh' }}>
          <h2 style={{ marginBottom: 16 }}>WrenchIQ startup error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{String(this.state.error)}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#94a3b8', marginTop: 16 }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Bridge: reads shopId from DemoContext to pass into ShopObjectivesProvider
function AppWithObjectives() {
  const { activeShopId } = useDemo();
  return (
    <ShopObjectivesProvider shopId={activeShopId || "cornerstone"}>
      <BrandingProvider>
        <WrenchIQApp />
      </BrandingProvider>
    </ShopObjectivesProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <DemoProvider>
        <AppWithObjectives />
      </DemoProvider>
    </ErrorBoundary>
  </StrictMode>,
)
