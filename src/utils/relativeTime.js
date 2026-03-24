/**
 * Formatuje datę na relative time (np. "2 minuty temu", "za godzinę")
 * @param {Date|string|number} date - Data do sformatowania
 * @param {Object} options - Opcje formatowania
 * @returns {string} - Sformatowana data jako relative time
 */
export function formatRelativeTime(date, options = {}) {
  if (!date) return '';
  
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = targetDate.getTime() - now.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  const { 
    showSeconds = false,
    showFuture = true,
    locale = 'pl-PL',
    fallbackFormat = 'short' // 'short' | 'long' | 'datetime'
  } = options;

  // Przyszłość
  if (diffMs > 0) {
    if (!showFuture) {
      return formatDate(date, fallbackFormat, locale);
    }

    if (diffMin < 1) {
      return showSeconds && diffSec > 0 ? `za ${diffSec} ${diffSec === 1 ? 'sekundę' : diffSec < 5 ? 'sekundy' : 'sekund'}` : 'za chwilę';
    }
    if (diffMin < 60) {
      return `za ${diffMin} ${diffMin === 1 ? 'minutę' : diffMin < 5 ? 'minuty' : 'minut'}`;
    }
    if (diffHour < 24) {
      return `za ${diffHour} ${diffHour === 1 ? 'godzinę' : diffHour < 5 ? 'godziny' : 'godzin'}`;
    }
    if (diffDay === 1) {
      return 'jutro';
    }
    if (diffDay < 7) {
      return `za ${diffDay} ${diffDay < 5 ? 'dni' : 'dni'}`;
    }
    if (diffWeek < 4) {
      return `za ${diffWeek} ${diffWeek === 1 ? 'tydzień' : diffWeek < 5 ? 'tygodnie' : 'tygodni'}`;
    }
    if (diffMonth < 12) {
      return `za ${diffMonth} ${diffMonth === 1 ? 'miesiąc' : diffMonth < 5 ? 'miesiące' : 'miesięcy'}`;
    }
    return `za ${diffYear} ${diffYear === 1 ? 'rok' : diffYear < 5 ? 'lata' : 'lat'}`;
  }

  // Przeszłość
  const absDiffSec = Math.abs(diffSec);
  const absDiffMin = Math.abs(diffMin);
  const absDiffHour = Math.abs(diffHour);
  const absDiffDay = Math.abs(diffDay);
  const absDiffWeek = Math.abs(diffWeek);
  const absDiffMonth = Math.abs(diffMonth);
  const absDiffYear = Math.abs(diffYear);

  if (absDiffMin < 1) {
    return showSeconds && absDiffSec > 0 ? `${absDiffSec} ${absDiffSec === 1 ? 'sekundę' : absDiffSec < 5 ? 'sekundy' : 'sekund'} temu` : 'przed chwilą';
  }
  if (absDiffMin < 60) {
    return `${absDiffMin} ${absDiffMin === 1 ? 'minutę' : absDiffMin < 5 ? 'minuty' : 'minut'} temu`;
  }
  if (absDiffHour < 24) {
    return `${absDiffHour} ${absDiffHour === 1 ? 'godzinę' : absDiffHour < 5 ? 'godziny' : 'godzin'} temu`;
  }
  if (absDiffDay === 1) {
    return 'wczoraj';
  }
  if (absDiffDay === 2) {
    return 'przedwczoraj';
  }
  if (absDiffDay < 7) {
    return `${absDiffDay} ${absDiffDay < 5 ? 'dni' : 'dni'} temu`;
  }
  if (absDiffWeek < 4) {
    return `${absDiffWeek} ${absDiffWeek === 1 ? 'tydzień' : absDiffWeek < 5 ? 'tygodnie' : 'tygodni'} temu`;
  }
  if (absDiffMonth < 12) {
    return `${absDiffMonth} ${absDiffMonth === 1 ? 'miesiąc' : absDiffMonth < 5 ? 'miesiące' : 'miesięcy'} temu`;
  }
  if (absDiffYear === 1) {
    return 'rok temu';
  }
  return `${absDiffYear} ${absDiffYear < 5 ? 'lata' : 'lat'} temu`;
}

/**
 * Formatuje datę na standardowy format
 * @param {Date|string|number} date - Data do sformatowania
 * @param {string} format - Format ('short' | 'long' | 'datetime')
 * @param {string} locale - Locale (domyślnie 'pl-PL')
 * @returns {string} - Sformatowana data
 */
function formatDate(date, format = 'short', locale = 'pl-PL') {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  if (format === 'long') {
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (format === 'datetime') {
    return d.toLocaleString(locale, { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return d.toLocaleDateString(locale);
}

/**
 * Formatuje datę z automatycznym wyborem między relative time a standardowym formatem
 * @param {Date|string|number} date - Data do sformatowania
 * @param {Object} options - Opcje
 * @returns {string} - Sformatowana data
 */
export function formatSmartTime(date, options = {}) {
  if (!date) return '';
  
  const { maxRelativeDays = 7, ...relativeOptions } = options;
  const now = new Date();
  const targetDate = new Date(date);
  const diffDays = Math.abs((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Jeśli data jest zbyt odległa, użyj standardowego formatu
  if (diffDays > maxRelativeDays) {
    return formatDate(date, options.fallbackFormat || 'short', options.locale || 'pl-PL');
  }
  
  // W przeciwnym razie użyj relative time
  return formatRelativeTime(date, relativeOptions);
}
