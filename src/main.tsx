import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import './alertOverride'; // Override window.alert before React mounts
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { GlobalErrorBoundary, GlobalErrorListener } from './components/GlobalErrorBoundary';
import NavigationTracker from './components/NavigationTracker';
import { setupGlobalErrorHandler } from './utils/enhancedErrorHandler';
import { backendMonitor } from './utils/backendMonitor';
import './utils/mobileTouchDebugger'; // Load mobile touch debugger
import './styles/mobile.css'; // Load mobile styles

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: 1.0,
});

// Setup global error handling
setupGlobalErrorHandler();

// Start backend monitoring after page load (don't block initial render)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => backendMonitor.startMonitoring(), 3000);
  });
}


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

const root = document.getElementById('root')!;
const renderApp = () => createRoot(root).render(
  <BrowserRouter>
      <GlobalErrorBoundary>
        <ErrorBoundary>
          <GlobalErrorListener />
          <NavigationTracker />
          <App />
        </ErrorBoundary>
      </GlobalErrorBoundary>
  </BrowserRouter>
);

const minimumStartupTime = 1000;
if (root.querySelector('.zync-startup') && document.visibilityState === 'visible') {
  // Count time already spent on the startup screen while the bundle loaded.
  const loaderMotion = document.getAnimations().find(animation =>
    'animationName' in animation && animation.animationName === 'zync-startup-slide');
  const firstPaint = performance.getEntriesByName('first-paint')[0]?.startTime;
  const elapsed = typeof loaderMotion?.currentTime === 'number'
    ? loaderMotion.currentTime
    : firstPaint === undefined ? 0 : performance.now() - firstPaint;
  const remaining = Math.max(0, minimumStartupTime - elapsed);
  if (remaining > 0) {
    window.requestAnimationFrame(() => window.setTimeout(renderApp, remaining));
  } else {
    renderApp();
  }
} else {
  renderApp();
}

