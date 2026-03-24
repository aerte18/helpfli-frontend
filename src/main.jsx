import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import ToastProvider from "./components/toast/ToastProvider.jsx"
import './index.css'
import './styles/ui.css'
import { initSentry } from './sentry'
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

// Init Sentry (if DSN provided)
initSentry();

// Web Vitals monitoring
function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log('Web Vital:', metric);
  
  // Send to Sentry if available
  if (window.Sentry) {
    window.Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: `${metric.name}: ${metric.value}`,
      level: 'info'
    });
  }
}

// Measure Core Web Vitals
onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onFCP(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);

// Service Worker handling
if ('serviceWorker' in navigator) {
  if (import.meta && import.meta.env && import.meta.env.DEV) {
    // DEV: całkowicie wyłącz SW i wyrejestruj istniejące
    navigator.serviceWorker.getRegistrations?.()
      .then((regs) => Promise.all(regs.map((r) => r.unregister().catch(() => {}))))
      .then(() => console.log('🧹 SW unregistered in DEV'));
  } else {
    // PROD: rejestruj SW (z bumpem wersji, aby odświeżać cache)
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js?v=3')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('❌ Service Worker registration failed:', error);
        });
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
