import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SMSRepresentativeApp from './SMSRepresentativeApp'
import { BrandingProvider } from './context/BrandingContext'
import { DemoProvider } from './context/DemoContext'
import { ShopObjectivesProvider } from './context/ShopObjectivesContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DemoProvider>
      <ShopObjectivesProvider shopId="cornerstone">
        <BrandingProvider>
          <SMSRepresentativeApp />
        </BrandingProvider>
      </ShopObjectivesProvider>
    </DemoProvider>
  </StrictMode>,
)
