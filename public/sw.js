// Service Worker — tylko Web Push (bez cache HTML/JS; stary cache powodował biały ekran na iOS Safari)
const SW_VERSION = "helpfli-push-v6";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Helpfli", body: event.data.text() || "Nowe powiadomienie" };
    }
  }

  const options = {
    body: data.body || "Nowe powiadomienie z Helpfli",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/",
      timestamp: Date.now(),
    },
    actions: [
      {
        action: "open",
        title: "Otwórz",
        icon: "/icons/icon-192x192.png",
      },
      {
        action: "close",
        title: "Zamknij",
        icon: "/icons/icon-192x192.png",
      },
    ],
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(data.title || "Helpfli", options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received:", event);

  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log("Background sync triggered", SW_VERSION);
}
