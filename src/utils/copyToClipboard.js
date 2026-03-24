/**
 * Kopiuje tekst do schowka
 * @param {string} text - Tekst do skopiowania
 * @returns {Promise<boolean>} - true jeśli udało się skopiować
 */
export async function copyToClipboard(text) {
  if (!text) return false;

  try {
    // Użyj nowoczesnego API jeśli dostępne
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback dla starszych przeglądarek
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  } catch (err) {
    console.error('Błąd kopiowania do schowka:', err);
    return false;
  }
}

