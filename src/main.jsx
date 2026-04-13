import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WrenchIQApp from './WrenchIQApp'
import { BrandingProvider } from './context/BrandingContext'
import { DemoProvider } from './context/DemoContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DemoProvider>
      <BrandingProvider>
        <WrenchIQApp />
      </BrandingProvider>
    </DemoProvider>
  </StrictMode>,
)
