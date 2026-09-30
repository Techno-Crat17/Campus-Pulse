import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './pwa/registerServiceWorker'

// Initialize PWA service worker
registerServiceWorker();

// Creator Easter Egg (discoverable in DevTools Console)
if (typeof window !== 'undefined') {
  (window as any).__CAMPUS_PULSE_MOUNTED__ = true;
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
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
