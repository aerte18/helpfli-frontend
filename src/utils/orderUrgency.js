/** Etykiety pilności z formularza klienta (create-order). */
export const URGENCY_LABELS = {
  now: { label: 'Pilne (teraz)', short: 'Pilne', emoji: '⚡' },
  today: { label: 'Dzisiaj', short: 'Dzisiaj', emoji: '📅' },
  tomorrow: { label: 'Jutro', short: 'Jutro', emoji: '📅' },
  this_week: { label: 'W tym tygodniu', short: 'W tym tygodniu', emoji: '📅' },
  flexible: { label: 'Elastycznie', short: 'Elastycznie', emoji: '📅' },
};

export function getUrgencyLabel(urgency) {
  if (!urgency) return null;
  return URGENCY_LABELS[urgency] || { label: urgency, short: urgency, emoji: '📅' };
}

function setTimeOnDate(base, hours, minutes = 0) {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/** Koniec bieżącego tygodnia (niedziela 18:00) w lokalnej strefie. */
function endOfThisWeek() {
  const d = new Date();
  const day = d.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const end = new Date(d);
  end.setDate(d.getDate() + daysUntilSunday);
  return setTimeOnDate(end, 18, 0);
}

/**
 * Sugerowany termin realizacji dla oferty wykonawcy — spójny z urgency klienta.
 * Zwraca Date (nie string datetime-local).
 */
export function suggestCompletionDateFromUrgency(urgency, urgencyTime = null) {
  const now = new Date();
  if (!urgency || urgency === 'flexible') {
    return setTimeOnDate(addHours(now, 72), 12, 0);
  }

  if (urgency === 'now') {
    const bumped = addHours(now, 2);
    const mins = bumped.getMinutes();
    if (mins > 0 || bumped.getSeconds() > 0) {
      bumped.setHours(bumped.getHours() + 1, 0, 0, 0);
    }
    return bumped;
  }

  if (urgency === 'today') {
    const evening = setTimeOnDate(now, 18, 0);
    if (evening > now) return evening;
    return addHours(now, 3);
  }

  if (urgency === 'tomorrow') {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    if (urgencyTime && /^\d{1,2}:\d{2}$/.test(urgencyTime)) {
      const [h, m] = urgencyTime.split(':').map(Number);
      return setTimeOnDate(t, h, m);
    }
    return setTimeOnDate(t, 12, 0);
  }

  if (urgency === 'this_week') {
    const end = endOfThisWeek();
    return end > now ? end : setTimeOnDate(addHours(now, 48), 12, 0);
  }

  return setTimeOnDate(addHours(now, 48), 12, 0);
}

export function suggestCompletionLocalFromUrgency(urgency, urgencyTime) {
  const d = suggestCompletionDateFromUrgency(urgency, urgencyTime);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
