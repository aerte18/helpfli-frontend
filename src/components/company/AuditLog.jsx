import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function AuditLog({ companyId, canView }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (companyId && canView) {
      fetchLogs();
    }
  }, [companyId, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const data = await api(`/api/companies/${companyId}/audit-log?${params.toString()}`);
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      'team.add': 'Dodano członka',
      'team.remove': 'Usunięto członka',
      'team.role_change': 'Zmieniono rolę',
      'team.invite': 'Wysłano zaproszenie',
      'order.create': 'Utworzono zlecenie',
      'order.assign': 'Przypisano zlecenie',
      'order.reassign': 'Przepisano zlecenie',
      'order.cancel': 'Anulowano zlecenie',
      'order.complete': 'Zakończono zlecenie',
      'finance.deposit': 'Doładowano portfel',
      'finance.withdraw': 'Wypłacono z portfela',
      'finance.invoice_pay': 'Opłacono fakturę',
      'resourcePool.limit_change': 'Zmieniono limity',
      'resourcePool.strategy_change': 'Zmieniono strategię',
      'workflow.configure': 'Skonfigurowano workflow',
      'workflow.template_add': 'Dodano szablon',
      'workflow.escalation_add': 'Dodano eskalację',
      'settings.update': 'Zaktualizowano ustawienia',
      'role.create': 'Utworzono rolę',
      'role.update': 'Zaktualizowano rolę',
      'role.delete': 'Usunięto rolę',
      'permission.change': 'Zmieniono uprawnienia',
      'subscription.change': 'Zmieniono subskrypcję',
      'company.delete': 'Usunięto firmę'
    };
    return labels[action] || action;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!canView) {
    return null;
  }

  if (loading && logs.length === 0) {
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Audit Log</h2>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Akcja
          </label>
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Wszystkie</option>
            <option value="team.add">Dodano członka</option>
            <option value="team.remove">Usunięto członka</option>
            <option value="order.create">Utworzono zlecenie</option>
            <option value="order.assign">Przypisano zlecenie</option>
            <option value="finance.deposit">Doładowano portfel</option>
            <option value="finance.withdraw">Wypłacono z portfela</option>
            <option value="role.create">Utworzono rolę</option>
            <option value="role.update">Zaktualizowano rolę</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data od
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data do
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setFilters({ action: '', userId: '', startDate: '', endDate: '' })}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Wyczyść filtry
          </button>
        </div>
      </div>

      {/* Logs */}
      {logs.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Brak wpisów w audit log
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log._id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {log.user?.name || 'Nieznany użytkownik'}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({log.userRoleName || log.userRole})
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mb-1">
                    {getActionLabel(log.action.type)}
                  </div>
                  {log.action.description && (
                    <div className="text-xs text-gray-500">
                      {log.action.description}
                    </div>
                  )}
                  {log.details.amount && (
                    <div className="text-xs text-gray-600 mt-1">
                      Kwota: {(log.details.amount / 100).toFixed(2)} zł
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(log.createdAt).toLocaleString('pl-PL')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}







