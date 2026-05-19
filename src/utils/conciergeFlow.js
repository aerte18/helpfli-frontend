/** Ścieżki i etykiety kroków rozmowy z Concierge */

export const CHOSEN_PATH_KEY = 'ai_concierge_chosen_path';

export function getStoredChosenPath() {
  try {
    return localStorage.getItem(CHOSEN_PATH_KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredChosenPath(path) {
  try {
    if (path) localStorage.setItem(CHOSEN_PATH_KEY, path);
    else localStorage.removeItem(CHOSEN_PATH_KEY);
  } catch {
    // ignore
  }
}

export function pathFromChoiceLabel(label) {
  const map = {
    'Znajdź wykonawcę': 'providers',
    'Utwórz zlecenie': 'order',
    'Sprawdź cenę': 'pricing',
    'Spróbuję sam (DIY)': 'diy',
  };
  return map[label] || null;
}

export function stepSubtitle(conversationStep) {
  if (!conversationStep?.step) return null;
  return `Krok ${conversationStep.step}/${conversationStep.total} — ${conversationStep.label}`;
}

export function cleanDescriptionText(text = '') {
  return String(text || '')
    .replace(/\[Moja lokalizacja:[^\]]*\]/gi, '')
    .replace(/\[STATUS ZAŁĄCZONEGO ZDJĘCIA\][\s\S]*?(?=\n\n|$)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
