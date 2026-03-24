export const getQS = () => new URLSearchParams(window.location.search);

export function readArrayFromQS(key) {
  const qs = getQS();
  const raw = qs.get(key);
  if (!raw) return [];
  return raw.split(",").filter(Boolean);
}

export function writeArrayToQS(key, arr, { replace = true } = {}) {
  const qs = getQS();
  if (!arr?.length) qs.delete(key);
  else qs.set(key, arr.join(","));
  const url = `${window.location.pathname}?${qs.toString()}`;
  if (replace) window.history.replaceState({}, "", url);
  else window.history.pushState({}, "", url);
}

export function persistLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
export function readLS(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
}
