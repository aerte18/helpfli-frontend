import { apiUrl } from "@/lib/apiUrl";
import { urlBase64ToUint8Array } from "../utils/push";

export async function registerPush({ token, vapidPublicKey }) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");

    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      return { ok: false, reason: "denied" };
    }

    const vapid =
      typeof vapidPublicKey === "string" ? vapidPublicKey.trim() : "";
    if (!vapid) {
      return { ok: false, reason: "no_vapid" };
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    });

    await fetch(apiUrl("/api/notifications/subscribe"), {
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
