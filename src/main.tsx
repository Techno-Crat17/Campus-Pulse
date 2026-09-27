import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Creator Easter Egg (discoverable in DevTools Console)
if (typeof window !== 'undefined') {
  console.log(
    '%c CAMPUS PULSE %c • %c UVERMA %c',
    'background: #111111; color: #DC2626; font-weight: 700; padding: 2px 6px; font-family: monospace;',
    'color: #888880;',
    'background: #DC2626; color: #FFFFFF; font-weight: 700; padding: 2px 6px; font-family: monospace;',
    'background: transparent;'
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
