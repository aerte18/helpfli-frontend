// prosty event-bus do sterowania chatem AI w całej aplikacji
const listeners = new Set();

export function onAI(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function openAI(mode = 'modal', prefill = '') {
  for (const l of listeners) l({ type: 'open', mode, prefill });
}

export function closeAI() {
  for (const l of listeners) l({ type: 'close' });
}

