export async function registerPush({ token, vapidPublicKey }) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "unsupported" };
  }
  
  try {
    // 1) rejestracja SW
    const reg = await navigator.serviceWorker.register("/sw.js");
    
    // 2) permission
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      return { ok: false, reason: "denied" };
    }
    
    // 3) subskrypcja
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    
    // 4) wyślij na backend
    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    });
    
    return { ok: true };
  } catch (error) {
    console.error("Push registration error:", error);
    return { ok: false, reason: error.message };
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}























