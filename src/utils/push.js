import { apiUrl } from "@/lib/apiUrl";
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

export async function subscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const { key } = await fetch(apiUrl('/api/push/config')).then(r => r.json());
    
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key)
    });

    await fetch(apiUrl('/api/push/subscribe'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub })
    });

    console.log('✅ Push subscription successful');
    return sub;
  } catch (error) {
    console.error('❌ Push subscription failed:', error);
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
      await fetch(apiUrl('/api/push/unsubscribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint })
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
