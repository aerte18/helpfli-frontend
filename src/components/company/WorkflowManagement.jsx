import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function WorkflowManagement({ companyId, canManage }) {
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('routing');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', message: '', isDefault: false });
  const [newEscalation, setNewEscalation] = useState({ name: '', trigger: { type: 'no_response' }, action: { type: 'reassign' }, enabled: true });

  useEffect(() => {
    if (companyId) {
      fetchWorkflow();
    }
  }, [companyId]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const data = await api(`/api/companies/${companyId}/workflow`);
      if (data.success) {
        setWorkflow(data.workflow);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkflow = async (updates) => {
    try {
      await api(`/api/companies/${companyId}/workflow`, {
        method: 'PUT',
        body: updates
      });
      await fetchWorkflow();
      alert('Workflow zaktualizowany');
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleAddTemplate = async (e) => {
    e.preventDefault();
    try {
      await api(`/api/companies/${companyId}/workflow/templates`, {
        method: 'POST',
        body: newTemplate
      });
      await fetchWorkflow();
      setShowTemplateModal(false);
      setNewTemplate({ name: '', subject: '', message: '', isDefault: false });
      alert('Szablon dodany');
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten szablon?')) {
      return;
    }
    try {
      await api(`/api/companies/${companyId}/workflow/templates/${templateId}`, {
        method: 'DELETE'
      });
      await fetchWorkflow();
      alert('Szablon usunięty');
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleAddEscalation = async (e) => {
    e.preventDefault();
    try {
      await api(`/api/companies/${companyId}/workflow/escalations`, {
        method: 'POST',
        body: newEscalation
      });
      await fetchWorkflow();
      setShowEscalationModal(false);
      setNewEscalation({ name: '', trigger: { type: 'no_response' }, action: { type: 'reassign' }, enabled: true });
      alert('Eskalacja dodana');
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleDeleteEscalation = async (escalationId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę eskalację?')) {
      return;
    }
    try {
      await api(`/api/companies/${companyId}/workflow/escalations/${escalationId}`, {
        method: 'DELETE'
      });
      await fetchWorkflow();
      alert('Eskalacja usunięta');
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  if (loading && !workflow) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-red-600">{error || 'Błąd pobierania workflow'}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Workflow Automation</h2>
        {canManage && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={workflow.enabled}
              onChange={(e) => handleUpdateWorkflow({ enabled: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Włączone</span>
          </label>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('routing')}
          className={`px-4 py-2 ${
            activeTab === 'routing'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Reguły routingu
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 ${
            activeTab === 'templates'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Szablony odpowiedzi
        </button>
        <button
          onClick={() => setActiveTab('escalations')}
          className={`px-4 py-2 ${
            activeTab === 'escalations'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Eskalacje
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 ${
            activeTab === 'stats'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Statystyki
        </button>
      </div>

      {/* Routing Rules */}
      {activeTab === 'routing' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Strategia routingu
            </label>
            <select
              value={workflow.routingRules.strategy}
              onChange={(e) => handleUpdateWorkflow({
                routingRules: { ...workflow.routingRules, strategy: e.target.value }
              })}
              disabled={!canManage}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="round_robin">Round-Robin (równomierne)</option>
              <option value="location_based">Na podstawie lokalizacji</option>
              <option value="specialization_based">Na podstawie specjalizacji</option>
              <option value="availability_based">Na podstawie dostępności</option>
              <option value="priority_based">Na podstawie priorytetu</option>
              <option value="hybrid">Hybrydowa (kombinacja)</option>
              <option value="manual">Ręczne przypisanie</option>
            </select>
          </div>

          {/* Location-based settings */}
          {workflow.routingRules.strategy === 'location_based' && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={workflow.routingRules.locationBased.enabled}
                  onChange={(e) => handleUpdateWorkflow({
                    routingRules: {
                      ...workflow.routingRules,
                      locationBased: {
                        ...workflow.routingRules.locationBased,
                        enabled: e.target.checked
                      }
                    }
                  })}
                  disabled={!canManage}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-sm text-gray-700">Włączone</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maksymalna odległość (km)
                </label>
                <input
                  type="number"
                  value={workflow.routingRules.locationBased.maxDistance}
                  onChange={(e) => handleUpdateWorkflow({
                    routingRules: {
                      ...workflow.routingRules,
                      locationBased: {
                        ...workflow.routingRules.locationBased,
                        maxDistance: parseInt(e.target.value)
                      }
                    }
                  })}
                  disabled={!canManage}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* General settings */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={workflow.routingRules.settings.autoAssign}
                onChange={(e) => handleUpdateWorkflow({
                  routingRules: {
                    ...workflow.routingRules,
                    settings: {
                      ...workflow.routingRules.settings,
                      autoAssign: e.target.checked
                    }
                  }
                })}
                disabled={!canManage}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm text-gray-700">Automatyczne przypisanie</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={workflow.routingRules.settings.notifyOnAssignment}
                onChange={(e) => handleUpdateWorkflow({
                  routingRules: {
                    ...workflow.routingRules,
                    settings: {
                      ...workflow.routingRules.settings,
                      notifyOnAssignment: e.target.checked
                    }
                  }
                })}
                disabled={!canManage}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm text-gray-700">Powiadomienia o przypisaniu</span>
            </label>
          </div>
        </div>
      )}

      {/* Response Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {canManage && (
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Dodaj szablon
            </button>
          )}
          
          {workflow.responseTemplates.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Brak szablonów odpowiedzi
            </div>
          ) : (
            <div className="space-y-4">
              {workflow.responseTemplates.map((template) => (
                <div key={template._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">{template.name}</div>
                      {template.isDefault && (
                        <span className="text-xs text-indigo-600">Domyślny</span>
                      )}
                    </div>
                    {canManage && (
                      <button
                        onClick={() => handleDeleteTemplate(template._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Usuń
                      </button>
                    )}
                  </div>
                  {template.subject && (
                    <div className="text-sm text-gray-600 mb-1">
                      <strong>Temat:</strong> {template.subject}
                    </div>
                  )}
                  <div className="text-sm text-gray-700">
                    {template.message.substring(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Escalations */}
      {activeTab === 'escalations' && (
        <div className="space-y-4">
          {canManage && (
            <button
              onClick={() => setShowEscalationModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Dodaj eskalację
            </button>
          )}
          
          {workflow.escalations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Brak eskalacji
            </div>
          ) : (
            <div className="space-y-4">
              {workflow.escalations.map((escalation) => (
                <div key={escalation._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">{escalation.name}</div>
                      <div className="text-sm text-gray-600">
                        Trigger: {escalation.trigger.type} → Action: {escalation.action.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${escalation.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {escalation.enabled ? 'Włączone' : 'Wyłączone'}
                      </span>
                      {canManage && (
                        <button
                          onClick={() => handleDeleteEscalation(escalation._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Usuń
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Łącznie przypisań</div>
            <div className="text-2xl font-bold text-gray-900">
              {workflow.stats.totalAssignments || 0}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Udane</div>
            <div className="text-2xl font-bold text-green-600">
              {workflow.stats.successfulAssignments || 0}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Nieudane</div>
            <div className="text-2xl font-bold text-red-600">
              {workflow.stats.failedAssignments || 0}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Średni czas</div>
            <div className="text-2xl font-bold text-blue-600">
              {workflow.stats.averageAssignmentTime || 0}s
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dodaj szablon odpowiedzi</h3>
            <form onSubmit={handleAddTemplate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwa
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temat (opcjonalnie)
                </label>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treść
                </label>
                <textarea
                  value={newTemplate.message}
                  onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="4"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTemplate.isDefault}
                    onChange={(e) => setNewTemplate({ ...newTemplate, isDefault: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Szablon domyślny</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTemplateModal(false);
                    setNewTemplate({ name: '', subject: '', message: '', isDefault: false });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Dodaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {showEscalationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dodaj eskalację</h3>
            <form onSubmit={handleAddEscalation}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwa
                </label>
                <input
                  type="text"
                  value={newEscalation.name}
                  onChange={(e) => setNewEscalation({ ...newEscalation, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger
                </label>
                <select
                  value={newEscalation.trigger.type}
                  onChange={(e) => setNewEscalation({
                    ...newEscalation,
                    trigger: { ...newEscalation.trigger, type: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="no_response">Brak odpowiedzi</option>
                  <option value="timeout">Timeout</option>
                  <option value="rejection">Odrzucenie</option>
                  <option value="low_rating">Niska ocena</option>
                  <option value="custom">Własny</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Akcja
                </label>
                <select
                  value={newEscalation.action.type}
                  onChange={(e) => setNewEscalation({
                    ...newEscalation,
                    action: { ...newEscalation.action, type: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="reassign">Przepisz do innego</option>
                  <option value="notify_manager">Powiadom managera</option>
                  <option value="notify_owner">Powiadom właściciela</option>
                  <option value="escalate_to_manager">Eskaluj do managera</option>
                  <option value="cancel_order">Anuluj zlecenie</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEscalationModal(false);
                    setNewEscalation({ name: '', trigger: { type: 'no_response' }, action: { type: 'reassign' }, enabled: true });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Dodaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}







