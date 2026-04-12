import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WrenchIQApp from './WrenchIQApp'
import { BrandingProvider } from './context/BrandingContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrandingProvider>
      <WrenchIQApp />
    </BrandingProvider>
  </StrictMode>,
)
