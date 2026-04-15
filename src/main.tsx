import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import './alertOverride'; // Override window.alert before React mounts
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: 1.0,
});


// Suppress browser extension errors
window.addEventListener('error', (e) => {
  if (
    e.message.includes('message channel closed') || 
    e.message.includes('Extension context invalidated') ||
    e.message.includes('listener indicated an asynchronous response')
  ) {
    e.stopImmediatePropagation();
    return true;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (
    e.reason?.message?.includes('message channel closed') || 
    e.reason?.message?.includes('Extension context invalidated') ||
    e.reason?.message?.includes('listener indicated an asynchronous response')
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>
);

