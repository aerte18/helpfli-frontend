// Integracje kalendarzowe (Google, Outlook)
import { apiUrl } from "@/lib/apiUrl";
import React, { useState, useEffect } from 'react';
import { 
  getCalendarIntegrations, 
  connectCalendar, 
  disconnectCalendar,
  syncCalendar
} from '../../api/integrations';

export default function CalendarIntegrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const data = await getCalendarIntegrations();
      setIntegrations(data.integrations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider) => {
    try {
      // Otwórz okno OAuth
      const authUrl = apiUrl(`/api/integrations/calendar/auth/${provider}`);
      const popup = window.open(
        authUrl,
        'Calendar Auth',
        'width=600,height=700'
      );

      // Nasłuchuj na callback
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          fetchIntegrations();
        }
      }, 1000);
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleDisconnect = async (integrationId) => {
    if (!window.confirm('Czy na pewno chcesz rozłączyć kalendarz?')) return;
    try {
      await disconnectCalendar(integrationId);
      fetchIntegrations();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleSync = async (integrationId) => {
    try {
      setSyncing(integrationId);
      await syncCalendar(integrationId);
      alert('Synchronizacja zakończona pomyślnie!');
      fetchIntegrations();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    } finally {
      setSyncing(null);
    }
  };

  const providers = [
    { id: 'google', name: 'Google Calendar', icon: '📅', color: 'blue' },
    { id: 'outlook', name: 'Outlook Calendar', icon: '📆', color: 'orange' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie integracji...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Integracje kalendarzowe</h1>
        <p className="text-gray-600 mt-1">Połącz swój kalendarz, aby automatycznie synchronizować wydarzenia</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Available Providers */}
      <div className="space-y-4 mb-6">
        {providers.map((provider) => {
          const integration = integrations.find(i => i.provider === provider.id);
          return (
            <div key={provider.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{provider.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold">{provider.name}</h3>
                    <p className="text-sm text-gray-500">
                      {integration 
                        ? `Połączony: ${integration.email || 'Nieznany email'}`
                        : 'Nie połączony'}
                    </p>
                    {integration?.lastSync && (
                      <p className="text-xs text-gray-400 mt-1">
                        Ostatnia synchronizacja: {new Date(integration.lastSync).toLocaleString('pl-PL')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {integration ? (
                    <>
                      <button
                        onClick={() => handleSync(integration._id)}
                        disabled={syncing === integration._id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {syncing === integration._id ? 'Synchronizacja...' : 'Synchronizuj'}
                      </button>
                      <button
                        onClick={() => handleDisconnect(integration._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Rozłącz
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(provider.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Połącz
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Jak to działa?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Połącz swój kalendarz Google lub Outlook</li>
          <li>• Zlecenia będą automatycznie dodawane do kalendarza</li>
          <li>• Możesz synchronizować wydarzenia ręcznie lub automatycznie</li>
          <li>• Zajęte terminy będą widoczne w systemie</li>
        </ul>
      </div>
    </div>
  );
}













