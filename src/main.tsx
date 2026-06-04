import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

// Simple error boundary: catch render errors and show them
// instead of white screen
function mount() {
  try {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <HashRouter>
          <App />
        </HashRouter>
      </StrictMode>,
    );
  } catch (e) {
    document.getElementById('root')!.innerHTML =
      `<div style="padding:40px;font-family:sans-serif">
        <h2 style="color:#E85D75">应用加载失败</h2>
        <pre style="background:#f5f5f5;padding:16px;border-radius:8px;overflow:auto;font-size:13px">${e instanceof Error ? e.stack || e.message : String(e)}</pre>
       </div>`;
  }
}

mount();
