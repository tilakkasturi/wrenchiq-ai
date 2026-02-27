import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WrenchIQApp from './WrenchIQApp'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WrenchIQApp />
  </StrictMode>,
)
