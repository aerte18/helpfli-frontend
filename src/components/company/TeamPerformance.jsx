import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function TeamPerformance({ companyId, canView }) {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    memberId: ''
  });

  useEffect(() => {
    if (companyId && canView) {
      fetchPerformance();
    }
  }, [companyId, filters]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.memberId) params.append('memberId', filters.memberId);
      
      const data = await api(`/api/companies/${companyId}/performance?${params.toString()}`);
      if (data.success) {
        setPerformanceData(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!canView) {
    return null;
  }

  if (loading && !performanceData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!performanceData) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analityka Wydajności Zespołu</h2>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Company Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 mb-1">Łącznie zleceń</div>
          <div className="text-2xl font-bold text-blue-900">
            {performanceData.companyStats.totalOrders}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 mb-1">Zakończone</div>
          <div className="text-2xl font-bold text-green-900">
            {performanceData.companyStats.completedOrders}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 mb-1">Przychód</div>
          <div className="text-2xl font-bold text-purple-900">
            {(performanceData.companyStats.totalRevenue / 100).toFixed(2)} zł
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-sm text-yellow-600 mb-1">Średnia ocena</div>
          <div className="text-2xl font-bold text-yellow-900">
            {performanceData.companyStats.avgRating} ⭐
          </div>
        </div>
      </div>

      {/* Top Performers */}
      {performanceData.companyStats.topPerformers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Top 5 Wykonawców</h3>
          <div className="space-y-2">
            {performanceData.companyStats.topPerformers.map((performer, index) => (
              <div key={performer.member._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <div className="font-medium text-gray-900">{performer.member.name}</div>
                    <div className="text-sm text-gray-500">{performer.member.email}</div>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Zlecenia: </span>
                    <span className="font-semibold">{performer.completedOrders}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Przychód: </span>
                    <span className="font-semibold">{performer.revenue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Performance */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Wydajność Członków</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Członek
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zlecenia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zakończone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Przychód
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ocena
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Czas realizacji
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wskaźnik ukończenia
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceData.performanceData.map((member) => (
                <tr key={member.member._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{member.member.name}</div>
                      <div className="text-sm text-gray-500">{member.member.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.stats.totalOrders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.stats.completedOrders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.stats.revenueFormatted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.stats.avgRating} ⭐
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.stats.avgCompletionTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.stats.completionRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}







