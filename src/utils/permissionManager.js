/**
 * Centralny manager uprawnień (geolokacja, powiadomienia push, kamera...).
 *
 * Wzorzec: SOFT-ASK + JUST-IN-TIME (standard Slack/Notion/Stripe).
 *  1. Komponent wywołuje `requestPermission('geolocation', { reason, priority })`.
 *  2. Manager kolejkuje request (jeden popup naraz, w kolejności priorytetów).
 *  3. PermissionQueueManager renderuje SoftAsk{X} z wyjaśnieniem "po co".
 *  4. Jeśli user kliknie "Włącz" — manager wywołuje natywne API przeglądarki
 *     (`navigator.geolocation.getCurrentPosition`, `Notification.requestPermission`).
 *  5. Jeśli "Nie teraz" — zapamiętujemy snooze i nie pytamy ponownie przez 24h.
 *  6. Jeśli "Zablokuj na stałe" (i przeglądarka wcześniej dała perm "denied") —
 *     już nie ruszamy do reset preferencji.
 *
 * Po co to wszystko: natywne prompty przeglądarki można pokazać tylko raz.
 * Jeśli user kliknie "Block", przeglądarka nigdy więcej nie zapyta — stąd
 * NIGDY nie wywołujemy ich na load strony.
 */

const STATE_KEY = "qs_perm_state_v1";
const SNOOZE_HOURS = 24;

const listeners = new Set();
let state = {
  queue: [], // [{ id, type, reason, priority, ts }]
  current: null, // aktywny request renderowany przez UI
};
const pending = new Map(); // id -> { resolve }
let nextId = 1;
let consentGate = null; // funkcja sprawdzająca, czy można pokazać popupy

export function setConsentGate(fn) {
  consentGate = typeof fn === "function" ? fn : null;
  processQueue();
}

function readPersisted() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function writePersisted(next) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

/**
 * Stan per-typ: 'unknown' | 'granted' | 'denied' | 'snoozed'
 *  - granted: user kliknął "Włącz" i natywne API zwróciło OK
 *  - denied: user kliknął "Nie pytaj więcej" lub natywne API zwróciło "denied"
 *  - snoozed: user kliknął "Nie teraz" (z timestampem)
 */
export function getPermissionState(type) {
  const persisted = readPersisted();
  const entry = persisted[type];
  if (!entry) return { state: "unknown" };
  return entry;
}

export function setPermissionState(type, partial) {
  const persisted = readPersisted();
  persisted[type] = {
    ...(persisted[type] || {}),
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  writePersisted(persisted);
}

export function resetPermissionState(type) {
  const persisted = readPersisted();
  if (type) {
    delete persisted[type];
  } else {
    Object.keys(persisted).forEach((k) => delete persisted[k]);
  }
  writePersisted(persisted);
}

function isSnoozeActive(entry) {
  if (!entry || entry.state !== "snoozed") return false;
  if (!entry.snoozedAt) return false;
  const ms = Date.now() - new Date(entry.snoozedAt).getTime();
  return ms < SNOOZE_HOURS * 60 * 60 * 1000;
}

/**
 * Sprawdza natywny stan uprawnienia w przeglądarce, jeśli możliwe.
 * Dla geolokacji w Permissions API: 'granted' | 'denied' | 'prompt'.
 */
export async function queryNativePermission(type) {
  try {
    if (type === "notifications") {
      if (!("Notification" in window)) return "unsupported";
      return Notification.permission; // 'granted' | 'denied' | 'default'
    }
    if (type === "geolocation") {
      if (!("permissions" in navigator) || !navigator.permissions?.query) {
        return navigator.geolocation ? "default" : "unsupported";
      }
      const status = await navigator.permissions.query({ name: "geolocation" });
      return status.state; // 'granted' | 'denied' | 'prompt'
    }
  } catch {
    /* ignore */
  }
  return "unknown";
}

function subscribe(cb) {
  listeners.add(cb);
  try {
    cb(state);
  } catch {
    /* ignore */
  }
  return () => listeners.delete(cb);
}

function notify() {
  listeners.forEach((cb) => {
    try {
      cb(state);
    } catch {
      /* ignore */
    }
  });
}

function processQueue() {
  if (state.current) return;
  if (state.queue.length === 0) return;
  if (consentGate && !consentGate()) return;
  const [next, ...rest] = state.queue;
  state = { current: next, queue: rest };
  notify();
}

/**
 * Wywołuje soft-ask dla danego uprawnienia.
 * @returns Promise<{ granted: boolean, reason?: string, position?, error? }>
 */
export function requestPermission(type, options = {}) {
  return new Promise((resolve) => {
    const persisted = getPermissionState(type);

    // 1. Już zaakceptowane → nie pokazuj popupu, od razu zwróć granted.
    if (persisted.state === "granted") {
      resolve({ granted: true, reason: "previously_granted" });
      return;
    }

    // 2. User wcześniej kliknął "Nie pytaj więcej" → nie pokazuj.
    if (persisted.state === "denied") {
      resolve({ granted: false, reason: "previously_denied" });
      return;
    }

    // 3. Snooze aktywny (24h) → cicho odrzuć, chyba że force=true.
    if (isSnoozeActive(persisted) && !options.force) {
      resolve({ granted: false, reason: "snoozed" });
      return;
    }

    const id = nextId++;
    pending.set(id, { resolve });
    const entry = {
      id,
      type,
      reason: options.reason || null,
      priority: typeof options.priority === "number" ? options.priority : 50,
      ts: Date.now(),
    };
    state = {
      ...state,
      queue: [...state.queue, entry].sort((a, b) => b.priority - a.priority || a.ts - b.ts),
    };
    notify();
    processQueue();
  });
}

/**
 * Wywoływane przez SoftAsk{X} komponenty po decyzji usera.
 *  - decision: 'accept' | 'snooze' | 'deny'
 *  - result: { granted, position?, error? } — wynik natywnego API (gdy accept)
 */
export function resolveCurrent(decision, result = {}) {
  const current = state.current;
  if (!current) return;
  const handler = pending.get(current.id);
  pending.delete(current.id);

  if (decision === "accept") {
    if (result.granted) {
      setPermissionState(current.type, { state: "granted", snoozedAt: null });
    } else {
      // User kliknął "Włącz" w naszym modalu, ale natywny prompt został odrzucony.
      // Zapisujemy jako 'denied' żeby nie spamować — user musi sam zmienić w przeglądarce.
      setPermissionState(current.type, { state: "denied", snoozedAt: null });
    }
    handler?.resolve({
      granted: !!result.granted,
      reason: result.granted ? "granted" : result.reason || "native_denied",
      position: result.position,
      error: result.error,
    });
  } else if (decision === "snooze") {
    setPermissionState(current.type, { state: "snoozed", snoozedAt: new Date().toISOString() });
    handler?.resolve({ granted: false, reason: "snoozed" });
  } else if (decision === "deny") {
    setPermissionState(current.type, { state: "denied", snoozedAt: null });
    handler?.resolve({ granted: false, reason: "user_denied" });
  } else {
    handler?.resolve({ granted: false, reason: "dismissed" });
  }

  state = { ...state, current: null };
  notify();
  // Małe opóźnienie żeby nie wymieniać popupów bez wytchnienia (UX).
  setTimeout(processQueue, 400);
}

/* ----- helpery wysokopoziomowe dla konkretnych uprawnień ----- */

/**
 * Wywołuje natywne API geolokalizacji (po zgodzie w soft-ask).
 */
export function nativeRequestGeolocation(opts = {}) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ granted: false, reason: "unsupported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ granted: true, position: pos }),
      (err) => resolve({ granted: false, reason: err.code === 1 ? "user_denied" : "error", error: err }),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000, ...opts }
    );
  });
}

/**
 * Wywołuje natywne API powiadomień (po zgodzie w soft-ask).
 */
export async function nativeRequestNotifications() {
  if (!("Notification" in window)) {
    return { granted: false, reason: "unsupported" };
  }
  if (Notification.permission === "granted") {
    return { granted: true };
  }
  if (Notification.permission === "denied") {
    return { granted: false, reason: "user_denied" };
  }
  try {
    const perm = await Notification.requestPermission();
    return { granted: perm === "granted", reason: perm };
  } catch (error) {
    return { granted: false, reason: "error", error };
  }
}

export const __test_only__ = { subscribe, getState: () => state, processQueue };
export { subscribe };
