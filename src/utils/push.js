import { apiUrl } from "@/lib/apiUrl";
export function urlBase64ToUint8Array(base64String) {
  if (base64String == null || typeof base64String !== "string") {
    throw new TypeError("Invalid VAPID key");
  }
  const s = base64String.trim();
  if (!s.length) {
    throw new TypeError("Empty VAPID key");
  }
  const padding = "=".repeat((4 - (s.length % 4)) % 4);
  const base64 = (s + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

export async function subscribePush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return null;

  try {
    const reg = await navigator.serviceWorker.ready;
    const configRes = await fetch(apiUrl("/api/push/config"));
    if (!configRes.ok) return null;
    const config = await configRes.json();
    const key = config.publicKey || config.key;
    if (!key || typeof key !== "string" || !key.trim()) {
      return null;
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key.trim()),
    });

    const res = await fetch(apiUrl("/api/push/subscribe"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription: sub }),
    });

    if (!res.ok) return null;
    return sub;
  } catch {
    return null;
  }
}

export async function unsubscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    
    if (sub) {
      await sub.unsubscribe();
      const token = localStorage.getItem("token");
      await fetch(apiUrl("/api/push/unsubscribe"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      console.log('✅ Push unsubscription successful');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Push unsubscription failed:', error);
    return false;
  }
}

export async function testPush() {
  try {
    const response = await fetch(apiUrl('/api/push/test'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Push test successful:', result);
      return result;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Push test failed:', error);
    throw error;
  }
}
