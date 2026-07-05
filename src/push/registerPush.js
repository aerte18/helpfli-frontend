import { apiUrl } from "@/lib/apiUrl";
import { urlBase64ToUint8Array } from "../utils/push";
import { queryNativePermission, requestPermission } from "../utils/permissionManager";

/**
 * Rejestruje Web Push:
 *  1. Service Worker
 *  2. Zgoda na powiadomienia — przez nasz SoftAskNotifications,
 *     chyba że natywne już 'granted' (wtedy pomijamy modal).
 *  3. Subskrypcja PushManager + zapis w backend.
 *
 * Opcje:
 *  - silent: bool — jeśli true, NIE pokazuje soft-ask gdy native jest 'default'
 *                   (używane przy auto-reconnect po loginie).
 *  - reason: string — kontekst dla SoftAskNotifications.
 */
export async function registerPush({ token, vapidPublicKey, silent = false, reason } = {}) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");

    const native = await queryNativePermission("notifications");

    if (native === "denied") {
      return { ok: false, reason: "denied" };
    }

    if (native !== "granted") {
      if (silent) {
        return { ok: false, reason: "no_permission" };
      }
      const result = await requestPermission("notifications", {
        reason: reason || "order-update",
        priority: 50,
      });
      if (!result.granted) {
        return { ok: false, reason: result.reason || "denied" };
      }
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

    await fetch(apiUrl("/api/push/subscribe"), {
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
