import { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function AdminNotifications() {
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ type: '', channel: '', status: '', userId: '' });

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    } else if (activeTab === 'templates') {
      loadTemplates();
    } else if (activeTab === 'stats') {
      loadStats();
    }
  }, [activeTab, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.channel) params.append('channel', filters.channel);
      if (filters.status) params.append('status', filters.status);
      if (filters.userId) params.append('userId', filters.userId);

      const data = await api(`/api/admin/notifications/logs?${params.toString()}`);
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await api('/api/admin/notifications/templates');
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api('/api/admin/notifications/stats');
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pl-PL');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Zarządzanie powiadomieniami</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-medium ${activeTab === 'logs' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
        >
          Logi powiadomień
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium ${activeTab === 'templates' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
        >
          Szablony emaili
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium ${activeTab === 'stats' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
        >
          Statystyki
        </button>
      </div>

      {/* Logi */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filtry */}
          <div className="bg-white rounded-xl border p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Typ</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Wszystkie</option>
                  <option value="subscription_expiry_7days">Subskrypcja - 7 dni</option>
                  <option value="subscription_expiry_3days">Subskrypcja - 3 dni</option>
                  <option value="subscription_expiry_1day">Subskrypcja - 1 dzień</option>
                  <option value="subscription_expired">Subskrypcja wygasła</option>
                  <option value="promo_expiring">Pakiet promocyjny</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kanał</label>
                <select
                  value={filters.channel}
                  onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Wszystkie</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Wszystkie</option>
                  <option value="sent">Wysłane</option>
                  <option value="failed">Błąd</option>
                  <option value="pending">Oczekujące</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ID użytkownika</label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Opcjonalnie"
                />
              </div>
            </div>
          </div>

          {/* Lista logów */}
          {loading ? (
            <div className="text-center py-8">Ładowanie...</div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Użytkownik</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kanał</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Odbiorca</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {log.user?.name || '-'}
                          {log.user?.email && (
                            <div className="text-xs text-gray-500">{log.user.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.channel}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            log.status === 'sent' ? 'bg-green-100 text-green-700' :
                            log.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.recipient}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Szablony */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-gray-600">Lista szablonów emaili. Kliknij, aby edytować.</p>
          </div>
          {loading ? (
            <div className="text-center py-8">Ładowanie...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div key={template._id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{template.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {template.isActive ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Klucz: {template.key}</p>
                  <p className="text-xs text-gray-500">{template.description || 'Brak opisu'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statystyki */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-6">
            <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Wszystkie powiadomienia</div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="text-2xl font-bold text-green-600">{stats.byChannel?.email || 0}</div>
            <div className="text-sm text-gray-600">Email</div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.byChannel?.sms || 0}</div>
            <div className="text-sm text-gray-600">SMS</div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="text-2xl font-bold text-purple-600">{stats.byChannel?.push || 0}</div>
            <div className="text-sm text-gray-600">Push</div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">Błędy</div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
            <div className="text-sm text-gray-600">Skuteczność</div>
          </div>
        </div>
      )}
    </div>
  );
}

