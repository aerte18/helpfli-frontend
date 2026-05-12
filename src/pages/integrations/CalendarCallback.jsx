import React, { useEffect, useState } from 'react';
import { connectCalendar } from '../../api/integrations';

export default function CalendarCallback() {
  const [message, setMessage] = useState('Łączenie kalendarza...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function finishAuthorization() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const provider = localStorage.getItem('pendingCalendarProvider');
        const redirectUri = localStorage.getItem('pendingCalendarRedirectUri')
          || `${window.location.origin}/integrations/calendar/callback`;

        if (!code || !provider) {
          throw new Error('Brak danych autoryzacji kalendarza');
        }

        await connectCalendar(provider, code, redirectUri);
        localStorage.removeItem('pendingCalendarProvider');
        localStorage.removeItem('pendingCalendarRedirectUri');

        if (!cancelled) {
          setMessage('Kalendarz został połączony. Możesz zamknąć to okno.');
          setTimeout(() => window.close(), 800);
        }
      } catch (err) {
        if (!cancelled) {
          setIsError(true);
          setMessage(err.message || 'Nie udało się połączyć kalendarza');
        }
      }
    }

    finishAuthorization();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow p-6 max-w-md w-full text-center">
        <div className={`text-lg font-semibold ${isError ? 'text-red-700' : 'text-gray-900'}`}>
          {message}
        </div>
        {isError && (
          <button
            type="button"
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Zamknij
          </button>
        )}
      </div>
    </div>
  );
}
