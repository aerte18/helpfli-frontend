let isInitialized = false;
let scriptLoading = null;

function loadOneSignalScript() {
  if (window.OneSignal) return Promise.resolve();
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise((resolve) => {
    const existing = document.querySelector('script[data-qs-onesignal]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => resolve(), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.onesignal.com/sdks/OneSignalSDK.js";
    s.defer = true;
    s.dataset.qsOnesignal = "1";
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.head.appendChild(s);
  });
  return scriptLoading;
}

export async function initOneSignal(user) {
  if (!user || isInitialized) return;

  await loadOneSignalScript();
  if (!window.OneSignal) return;

  if (window.OneSignal.initialized) {
    window.OneSignal.setExternalUserId(String(user._id || user.id));
    return;
  }

  window.OneSignal = window.OneSignal || [];
  window.OneSignal.push(function () {
    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    if (!appId || appId === "demo-app-id") {
      return;
    }

    window.OneSignal.init({ appId });
    window.OneSignal.setExternalUserId(String(user._id || user.id));
    isInitialized = true;
  });
}
