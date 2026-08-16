import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Pet } from './desktop/Pet'
import './pet.css'

/** Entry point for the small always-on-top desktop companion window. */
createRoot(document.getElementById('pet')!).render(
  <StrictMode>
    <Pet />
  </StrictMode>,
)
