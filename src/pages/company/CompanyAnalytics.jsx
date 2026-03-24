// Raporty i analityka dla firm
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCompanyAnalytics, getTeamPerformance, getRevenueReport, exportCompanyData } from '../../api/companies';

export default function CompanyAnalytics({ companyId, canView }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [summary, setSummary] = useState(null);
  const [teamPerformance, setTeamPerformance] = useState(null);
  const [revenueReport, setRevenueReport] = useState(null);

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId, dateRange, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { from: dateRange.from, to: dateRange.to };

      if (activeTab === 'summary') {
        const data = await getCompanyAnalytics(companyId, params);
        setSummary(data);
      } else if (activeTab === 'team') {
        const data = await getTeamPerformance(companyId, params);
        setTeamPerformance(data);
      } else if (activeTab === 'revenue') {
        const data = await getRevenueReport(companyId, { ...params, groupBy: 'day' });
        setRevenueReport(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format, dataset) => {
    try {
      await exportCompanyData(companyId, format, dataset, dateRange);
      alert(`Eksport ${format.toUpperCase()} zakończony pomyślnie!`);
    } catch (err) {
      alert(`Błąd eksportu: ${err.message}`);
    }
  };

  if (loading && !summary && !teamPerformance && !revenueReport) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raporty i analityka</h1>
          <p className="text-gray-600 mt-1">Analiza działalności firmy</p>
        </div>
        <Link
          to={`/company/${companyId}/settings`}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Wróć do ustawień
        </Link>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Od:</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <label className="text-sm font-medium text-gray-700">Do:</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'summary', label: 'Podsumowanie' },
            { id: 'team', label: 'Wydajność zespołu' },
            { id: 'revenue', label: 'Raport przychodów' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {activeTab === 'summary' && summary && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Zlecenia</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                {summary.orders?.total || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Przychody</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                {((summary.revenue?.total || 0) / 100).toFixed(2)} PLN
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Średnia ocena</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                {summary.ratings?.avgRating?.toFixed(1) || '0.0'}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Oferty</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                {summary.offers?.total || 0}
              </div>
            </div>
          </div>

          {/* Top Providers */}
          {summary.topProviders && summary.topProviders.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Najlepsi wykonawcy</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wykonawca</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zakończone zlecenia</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Przychód</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summary.topProviders.map((provider, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {provider.providerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {provider.completedOrders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((provider.totalRevenue || 0) / 100).toFixed(2)} PLN
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Export */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Eksport danych</h3>
            <div className="flex gap-4">
              <button
                onClick={() => handleExport('csv', 'orders')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Eksport zleceń (CSV)
              </button>
              <button
                onClick={() => handleExport('json', 'summary')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Eksport podsumowania (JSON)
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'team' && teamPerformance && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Wydajność zespołu</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wykonawca</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zlecenia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zakończone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wskaźnik ukończenia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Przychód</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ocena</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamPerformance.teamPerformance?.map((member, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.providerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.totalOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.completedOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {((member.completionRate || 0) * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {((member.totalRevenue || 0) / 100).toFixed(2)} PLN
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.avgRating?.toFixed(1) || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && revenueReport && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Raport przychodów</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kwota</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liczba</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenueReport.revenueReport?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item._id?.date || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item._id?.purpose || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {((item.total || 0) / 100).toFixed(2)} PLN
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.count || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}













