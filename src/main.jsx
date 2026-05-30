import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import ToastProvider from "./components/toast/ToastProvider.jsx"
import { MobileHintProvider } from "./components/ui/MobileHintProvider.jsx"
import './index.css'
/* ui.css usunięty — zawierał drugi pełny @tailwind base (Preflight 2×), co potrafi zepsuć scroll / layout */
import { initSentry } from './sentry'
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import { hasAnalyticsConsent } from './utils/consent';
import { initGoogleAnalytics } from './lib/googleAnalytics';
import { initMicrosoftClarity } from './lib/microsoftClarity';

function normalizeLegacyOrderTabUrl() {
  const { pathname, search } = window.location;
  const match = pathname.match(/^\/orders\/([^/]+)\/(tab-offers|tab-my-offer|tab-chat|tab-details)$/i);
  if (!match) return;
  const [, orderId, rawTab] = match;
  const map = {
    "tab-offers": "offers",
    "tab-my-offer": "my_offer",
    "tab-chat": "chat",
    "tab-details": "details",
  };
  const normalized = map[String(rawTab || "").toLowerCase()] || "details";
  const params = new URLSearchParams(search || "");
  params.set("tab", normalized);
  const nextSearch = params.toString();
  const nextUrl = `/orders/${orderId}${nextSearch ? `?${nextSearch}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
}

normalizeLegacyOrderTabUrl();

function sendToAnalytics(metric) {
  if (!hasAnalyticsConsent()) return;
  console.log("Web Vital:", metric);

  if (window.Sentry) {
    window.Sentry.addBreadcrumb({
      category: "web-vitals",
      message: `${metric.name}: ${metric.value}`,
      level: "info",
    });
  }
}

// Init Sentry / analityka — po starcie, nie blokuje pierwszego paintu
function scheduleIdle(fn) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(fn, { timeout: 4000 });
  } else {
    window.setTimeout(fn, 1);
  }
}

scheduleIdle(() => {
  initSentry();
  initGoogleAnalytics();
  initMicrosoftClarity();

  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
});

window.addEventListener("qs-consent-changed", () => initSentry());

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

// Service Worker handling — DEV: wyrejestruj; PROD: index.html czyści przed bundle
if ("serviceWorker" in navigator && import.meta?.env?.DEV) {
  navigator.serviceWorker
    .getRegistrations?.()
    .then((regs) => Promise.all(regs.map((r) => r.unregister().catch(() => {}))))
    .then(() => console.log("🧹 SW unregistered in DEV"));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <MobileHintProvider>
            <App />
          </MobileHintProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
