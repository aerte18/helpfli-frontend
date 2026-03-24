/**
 * Mapuje błędy API na czytelne komunikaty dla użytkownika
 * @param {Error|Object} error - Błąd z API lub obiekt z danymi błędu
 * @returns {string} - Czytelny komunikat błędu
 */
export function getErrorMessage(error) {
  // Jeśli to string, zwróć go
  if (typeof error === 'string') {
    return error;
  }

  // Błędy HTTP - status codes
  if (error.response?.status) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        // Błąd walidacji - sprawdź czy są szczegółowe błędy
        if (data?.errors && typeof data.errors === 'object') {
          const errorMessages = Object.values(data.errors).flat();
          return errorMessages.length > 0 
            ? errorMessages.join(', ')
            : data.message || 'Nieprawidłowe dane. Sprawdź formularz.';
        }
        return data?.message || 'Nieprawidłowe dane. Sprawdź formularz.';
      
      case 401:
        return 'Sesja wygasła. Zaloguj się ponownie.';
      
      case 403:
        return 'Nie masz uprawnień do wykonania tej akcji.';
      
      case 404:
        return data?.message || 'Nie znaleziono zasobu.';
      
      case 409:
        return data?.message || 'Konflikt - zasób już istnieje lub został zmodyfikowany.';
      
      case 422:
        // Błąd walidacji (Unprocessable Entity)
        if (data?.errors && typeof data.errors === 'object') {
          const errorMessages = Object.values(data.errors).flat();
          return errorMessages.length > 0 
            ? errorMessages.join(', ')
            : data.message || 'Błąd walidacji danych.';
        }
        return data?.message || 'Błąd walidacji danych.';
      
      case 429:
        return 'Zbyt wiele żądań. Spróbuj ponownie za chwilę.';
      
      case 500:
      case 502:
      case 503:
        return 'Błąd serwera. Spróbuj ponownie za chwilę.';
      
      default:
        return data?.message || `Błąd ${status}. Spróbuj ponownie.`;
    }
  }

  // Błędy sieci
  if (error.message) {
    const msg = error.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
      return 'Błąd połączenia z serwerem. Sprawdź połączenie z internetem.';
    }
    if (msg.includes('timeout')) {
      return 'Przekroczono czas oczekiwania. Spróbuj ponownie.';
    }
  }

  // Błędy z pola message
  if (error.message) {
    // Sprawdź czy to nie jest już czytelny komunikat
    const commonErrors = {
      'jwt expired': 'Sesja wygasła. Zaloguj się ponownie.',
      'invalid token': 'Nieprawidłowy token. Zaloguj się ponownie.',
      'unauthorized': 'Brak autoryzacji. Zaloguj się ponownie.',
    };
    
    const lowerMsg = error.message.toLowerCase();
    for (const [key, value] of Object.entries(commonErrors)) {
      if (lowerMsg.includes(key)) {
        return value;
      }
    }
    
    return error.message;
  }

  // Domyślny komunikat
  return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.';
}

/**
 * Sprawdza czy błąd to błąd sieci
 */
export function isNetworkError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch');
}

/**
 * Sprawdza czy błąd to błąd autoryzacji
 */
export function isAuthError(error) {
  if (!error) return false;
  if (error.response?.status === 401 || error.response?.status === 403) return true;
  const msg = (error.message || '').toLowerCase();
  return msg.includes('jwt') || msg.includes('token') || msg.includes('unauthorized');
}
