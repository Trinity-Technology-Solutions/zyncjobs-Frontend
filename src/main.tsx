import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

// Suppress browser extension errors
window.addEventListener('error', (e) => {
  if (e.message.includes('message channel closed') || 
      e.message.includes('Extension context invalidated')) {
    e.stopImmediatePropagation();
    return true;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.message?.includes('message channel closed') || 
      e.reason?.message?.includes('Extension context invalidated')) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
