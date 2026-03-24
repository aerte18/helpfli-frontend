// Integracje z systemami księgowymi
import React, { useState, useEffect } from 'react';
import { 
  getAccountingIntegrations, 
  createAccountingIntegration, 
  updateAccountingIntegration,
  deleteAccountingIntegration,
  activateAccountingIntegration,
  exportInvoices
} from '../../api/accounting';

export default function AccountingIntegrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('wfirma');

  const [formData, setFormData] = useState({
    provider: 'wfirma',
    companyId: '',
    credentials: {
      apiKey: '',
      apiSecret: '',
      login: '',
      password: ''
    },
    settings: {
      autoSync: true,
      syncInvoices: true,
      syncPayments: true
    }
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const data = await getAccountingIntegrations();
      setIntegrations(data.integrations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAccountingIntegration(formData);
      setShowCreateModal(false);
      setFormData({
        provider: 'wfirma',
        companyId: '',
        credentials: { apiKey: '', apiSecret: '', login: '', password: '' },
        settings: { autoSync: true, syncInvoices: true, syncPayments: true }
      });
      fetchIntegrations();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleDelete = async (integrationId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę integrację?')) return;
    try {
      await deleteAccountingIntegration(integrationId);
      fetchIntegrations();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleActivate = async (integrationId) => {
    try {
      await activateAccountingIntegration(integrationId);
      fetchIntegrations();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleExport = async (integrationId, format) => {
    try {
      await exportInvoices(integrationId, format);
      alert(`Eksport ${format.toUpperCase()} zakończony pomyślnie!`);
    } catch (err) {
      alert(`Błąd eksportu: ${err.message}`);
    }
  };

  const providers = [
    { id: 'wfirma', name: 'wFirma', icon: '📄' },
    { id: 'enova', name: 'Enova', icon: '💼' },
    { id: 'comarch', name: 'Comarch', icon: '📊' }
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integracje księgowe</h1>
          <p className="text-gray-600 mt-1">Połącz z systemami księgowymi</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ➕ Dodaj integrację
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Integrations List */}
      <div className="space-y-4">
        {integrations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Brak skonfigurowanych integracji księgowych</p>
          </div>
        ) : (
          integrations.map((integration) => {
            const provider = providers.find(p => p.id === integration.provider);
            return (
              <div key={integration._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{provider?.icon || '🔗'}</div>
                    <div>
                      <h3 className="text-lg font-semibold">{provider?.name || integration.provider}</h3>
                      <p className="text-sm text-gray-500">
                        {integration.active ? 'Aktywna' : 'Nieaktywna'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport(integration._id, 'csv')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Eksport CSV
                    </button>
                    {!integration.active && (
                      <button
                        onClick={() => handleActivate(integration._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Aktywuj
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(integration._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
                {integration.lastSync && (
                  <div className="mt-4 text-sm text-gray-500">
                    Ostatnia synchronizacja: {new Date(integration.lastSync).toLocaleString('pl-PL')}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium mb-4">Dodaj integrację księgową</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dostawca</label>
                <select
                  value={formData.provider}
                  onChange={(e) => {
                    setSelectedProvider(e.target.value);
                    setFormData({ ...formData, provider: e.target.value });
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Login</label>
                <input
                  type="text"
                  value={formData.credentials.login}
                  onChange={(e) => setFormData({
                    ...formData,
                    credentials: { ...formData.credentials, login: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasło</label>
                <input
                  type="password"
                  value={formData.credentials.password}
                  onChange={(e) => setFormData({
                    ...formData,
                    credentials: { ...formData.credentials, password: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              {selectedProvider === 'wfirma' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input
                      type="text"
                      value={formData.credentials.apiKey}
                      onChange={(e) => setFormData({
                        ...formData,
                        credentials: { ...formData.credentials, apiKey: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
                    <input
                      type="password"
                      value={formData.credentials.apiSecret}
                      onChange={(e) => setFormData({
                        ...formData,
                        credentials: { ...formData.credentials, apiSecret: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </>
              )}

              <div className="mb-6 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Ustawienia:</label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.settings.autoSync}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, autoSync: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  Automatyczna synchronizacja
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.settings.syncInvoices}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, syncInvoices: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  Synchronizuj faktury
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.settings.syncPayments}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, syncPayments: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  Synchronizuj płatności
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Utwórz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}













