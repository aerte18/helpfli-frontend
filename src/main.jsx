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
import { hasAnalyticsConsent } from './utils/consent';

// Init Sentry (if DSN provided)
initSentry();
window.addEventListener("qs-consent-changed", () => initSentry());

// Web Vitals monitoring
function sendToAnalytics(metric) {
  if (!hasAnalyticsConsent()) return;
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

async function recoverFromStaleChunk() {
  const key = "qs_chunk_reload_once";
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    // Cleanup SW + CacheStorage so we don't keep serving stale bundles
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => {})));
    }
  } catch {}

  const url = new URL(window.location.href);
  url.searchParams.set("_v", String(Date.now()));
  window.location.replace(url.toString());
}

// Recover from stale cached chunks after deployment
window.addEventListener("vite:preloadError", () => {
  recoverFromStaleChunk();
});

window.addEventListener("unhandledrejection", (event) => {
  const message = String(event?.reason?.message || event?.reason || "");
  if (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("ChunkLoadError")
  ) {
    recoverFromStaleChunk();
  }
});

// Service Worker handling
if ('serviceWorker' in navigator) {
  if (import.meta && import.meta.env && import.meta.env.DEV) {
    // DEV: całkowicie wyłącz SW i wyrejestruj istniejące
    navigator.serviceWorker.getRegistrations?.()
      .then((regs) => Promise.all(regs.map((r) => r.unregister().catch(() => {}))))
      .then(() => console.log('🧹 SW unregistered in DEV'));
  } else {
    // PROD: tymczasowo wyłącz SW, aby uniknąć stale-cache/chunk issues
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations?.()
        .then((regs) => Promise.all(regs.map((r) => r.unregister().catch(() => {}))))
        .then(() => console.log('🧹 SW unregistered in PROD'));
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
