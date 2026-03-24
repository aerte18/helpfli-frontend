import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function ResourcePoolManagement({ companyId, canManage }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingLimits, setEditingLimits] = useState(false);
  const [newLimits, setNewLimits] = useState({});
  const [strategy, setStrategy] = useState('equal');
  const [priorityMembers, setPriorityMembers] = useState([]);

  useEffect(() => {
    if (companyId) {
      fetchResourcePool();
    }
  }, [companyId]);

  const fetchResourcePool = async () => {
    try {
      setLoading(true);
      const data = await api(`/api/companies/${companyId}/resource-pool`);
      if (data.success) {
        setStats(data.stats);
        setStrategy(data.stats.allocationStrategy || 'equal');
        setPriorityMembers(data.stats.priorityMembers || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimits = async () => {
    try {
      await api(`/api/companies/${companyId}/resource-pool/limits`, {
        method: 'PUT',
        body: newLimits
      });
      await fetchResourcePool();
      setEditingLimits(false);
      setNewLimits({});
      alert('Limity zaktualizowane pomyślnie');
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleUpdateStrategy = async () => {
    try {
      await api(`/api/companies/${companyId}/resource-pool/allocation-strategy`, {
        method: 'PUT',
        body: { strategy, priorityMembers }
      });
      await fetchResourcePool();
      alert('Strategia przydzielania zaktualizowana');
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pl-PL');
  };

  const getUsagePercent = (used, limit) => {
    if (limit === 0 || limit === Infinity) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const getUsageColor = (percent) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-red-600">
          {error || 'Resource pool nie został zainicjalizowany'}
        </div>
        {canManage && (
          <button
            onClick={() => {
              // TODO: Implementuj inicjalizację
              alert('Funkcja inicjalizacji będzie dostępna po zakupie planu BUSINESS');
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Zainicjalizuj Resource Pool
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Resource Pool</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'overview' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Przegląd
          </button>
          {canManage && (
            <>
              <button
                onClick={() => setActiveTab('limits')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'limits' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Limity
              </button>
              <button
                onClick={() => setActiveTab('strategy')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'strategy' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Strategia
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* AI Queries */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">AI Concierge</h3>
              <span className="text-sm text-gray-500">
                Reset: {stats.aiQueries.resetDate ? formatDate(stats.aiQueries.resetDate) : 'Brak'}
              </span>
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {stats.aiQueries.used} / {stats.aiQueries.limit === Infinity ? 'Nielimitowane' : stats.aiQueries.limit}
                </span>
                <span className="text-gray-600">
                  Pozostało: {stats.aiQueries.remaining === Infinity ? 'Nielimitowane' : stats.aiQueries.remaining}
                </span>
              </div>
              {stats.aiQueries.limit !== Infinity && stats.aiQueries.limit > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getUsageColor(getUsagePercent(stats.aiQueries.used, stats.aiQueries.limit))}`}
                    style={{ width: `${getUsagePercent(stats.aiQueries.used, stats.aiQueries.limit)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          {/* Pilne zlecenia */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Pilne zlecenia</h3>
              <span className="text-sm text-gray-500">
                Reset: {stats.fastTrack.resetDate ? formatDate(stats.fastTrack.resetDate) : 'Brak'}
              </span>
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {stats.fastTrack.used} / {stats.fastTrack.limit === Infinity ? 'Nielimitowane' : stats.fastTrack.limit}
                </span>
                <span className="text-gray-600">
                  Pozostało: {stats.fastTrack.remaining === Infinity ? 'Nielimitowane' : stats.fastTrack.remaining}
                </span>
              </div>
              {stats.fastTrack.limit !== Infinity && stats.fastTrack.limit > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getUsageColor(getUsagePercent(stats.fastTrack.used, stats.fastTrack.limit))}`}
                    style={{ width: `${getUsagePercent(stats.fastTrack.used, stats.fastTrack.limit)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          {/* Provider Responses */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Odpowiedzi Providerów</h3>
              <span className="text-sm text-gray-500">
                Reset: {stats.providerResponses.resetDate ? formatDate(stats.providerResponses.resetDate) : 'Brak'}
              </span>
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {stats.providerResponses.used} / {stats.providerResponses.limit === Infinity ? 'Nielimitowane' : stats.providerResponses.limit}
                </span>
                <span className="text-gray-600">
                  Pozostało: {stats.providerResponses.remaining === Infinity ? 'Nielimitowane' : stats.providerResponses.remaining}
                </span>
              </div>
              {stats.providerResponses.limit !== Infinity && stats.providerResponses.limit > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getUsageColor(getUsagePercent(stats.providerResponses.used, stats.providerResponses.limit))}`}
                    style={{ width: `${getUsagePercent(stats.providerResponses.used, stats.providerResponses.limit)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'limits' && canManage && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Zaktualizuj limity dla puli zasobów firmy. Limity resetują się co miesiąc.
          </div>
          
          {!editingLimits ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-semibold">AI Concierge</div>
                  <div className="text-sm text-gray-600">
                    Limit: {stats.aiQueries.limit === Infinity ? 'Nielimitowane' : stats.aiQueries.limit}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingLimits(true);
                    setNewLimits({
                      aiQueriesLimit: stats.aiQueries.limit === Infinity ? 0 : stats.aiQueries.limit,
                      fastTrackLimit: stats.fastTrack.limit === Infinity ? 0 : stats.fastTrack.limit,
                      providerResponsesLimit: stats.providerResponses.limit === Infinity ? 0 : stats.providerResponses.limit
                    });
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Edytuj
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-semibold">Pilne zlecenia</div>
                  <div className="text-sm text-gray-600">
                    Limit: {stats.fastTrack.limit === Infinity ? 'Nielimitowane' : stats.fastTrack.limit}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-semibold">Odpowiedzi Providerów</div>
                  <div className="text-sm text-gray-600">
                    Limit: {stats.providerResponses.limit === Infinity ? 'Nielimitowane' : stats.providerResponses.limit}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Concierge Limit (0 = nielimitowane)
                </label>
                <input
                  type="number"
                  value={newLimits.aiQueriesLimit || ''}
                  onChange={(e) => setNewLimits({ ...newLimits, aiQueriesLimit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limit pilnych zleceń (0 = nielimitowane, obecnie bezpłatne dla wszystkich)
                </label>
                <input
                  type="number"
                  value={newLimits.fastTrackLimit || ''}
                  onChange={(e) => setNewLimits({ ...newLimits, fastTrackLimit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odpowiedzi Providerów Limit (0 = nielimitowane)
                </label>
                <input
                  type="number"
                  value={newLimits.providerResponsesLimit || ''}
                  onChange={(e) => setNewLimits({ ...newLimits, providerResponsesLimit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateLimits}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Zapisz
                </button>
                <button
                  onClick={() => {
                    setEditingLimits(false);
                    setNewLimits({});
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'strategy' && canManage && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Wybierz strategię przydzielania limitów między członkami zespołu.
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Strategia przydzielania
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="equal">Równomierne (równo dla wszystkich)</option>
              <option value="proportional">Proporcjonalne (wg aktywności)</option>
              <option value="priority">Priorytetowe (dla wybranych członków)</option>
              <option value="manual">Ręczne (indywidualne przydzielenie)</option>
            </select>
          </div>
          
          {strategy === 'priority' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorytetowi członkowie (wybierz z listy)
              </label>
              <div className="text-sm text-gray-600">
                TODO: Lista członków zespołu do wyboru
              </div>
            </div>
          )}
          
          <button
            onClick={handleUpdateStrategy}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Zaktualizuj strategię
          </button>
        </div>
      )}
    </div>
  );
}

