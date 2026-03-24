// Panel admina do zarządzania partnerami API
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getPartners, 
  createPartner, 
  updatePartner, 
  deletePartner, 
  regenerateApiKey,
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook
} from '../../api/partners';

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [webhooks, setWebhooks] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    rateLimit: 1000,
    allowedEndpoints: []
  });

  const [webhookData, setWebhookData] = useState({
    url: '',
    events: [],
    secret: ''
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const data = await getPartners();
      setPartners(data.partners || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhooks = async (partnerId) => {
    try {
      const data = await getWebhooks(partnerId);
      setWebhooks(data.webhooks || []);
    } catch (err) {
      alert(`Błąd pobierania webhooków: ${err.message}`);
    }
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    try {
      await createPartner(formData);
      setShowCreateModal(false);
      setFormData({ name: '', email: '', description: '', rateLimit: 1000, allowedEndpoints: [] });
      fetchPartners();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleDeletePartner = async (partnerId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tego partnera?')) return;
    try {
      await deletePartner(partnerId);
      fetchPartners();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleRegenerateKey = async (partnerId) => {
    if (!window.confirm('Czy na pewno chcesz wygenerować nowy klucz API? Stary klucz przestanie działać.')) return;
    try {
      const result = await regenerateApiKey(partnerId);
      alert(`Nowy klucz API: ${result.apiKey}`);
      fetchPartners();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    try {
      await createWebhook(selectedPartner, webhookData);
      setShowWebhookModal(null);
      setWebhookData({ url: '', events: [], secret: '' });
      fetchWebhooks(selectedPartner);
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleDeleteWebhook = async (webhookId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten webhook?')) return;
    try {
      await deleteWebhook(selectedPartner, webhookId);
      fetchWebhooks(selectedPartner);
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie partnerów...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zarządzanie partnerami API</h1>
          <p className="text-gray-600 mt-1">Publiczne API dla partnerów zewnętrznych</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin"
            className="text-gray-600 hover:text-gray-800"
          >
            ← Wróć do admina
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ➕ Dodaj partnera
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Partners List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazwa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate Limit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akcje</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {partners.map((partner) => (
              <tr key={partner._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                  <div className="text-sm text-gray-500">{partner.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {partner.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {partner.rateLimit || 1000} / h
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    partner.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {partner.active ? 'Aktywny' : 'Nieaktywny'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => {
                      setSelectedPartner(partner._id);
                      setShowWebhookModal(partner._id);
                      fetchWebhooks(partner._id);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Webhooks
                  </button>
                  <button
                    onClick={() => handleRegenerateKey(partner._id)}
                    className="text-yellow-600 hover:text-yellow-900"
                  >
                    Regeneruj klucz
                  </button>
                  <button
                    onClick={() => handleDeletePartner(partner._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Usuń
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Partner Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium mb-4">Dodaj nowego partnera</h3>
            <form onSubmit={handleCreatePartner}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (na godzinę)</label>
                <input
                  type="number"
                  value={formData.rateLimit}
                  onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="1"
                  required
                />
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

      {/* Webhooks Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Webhooks</h3>
              <button
                onClick={() => {
                  setShowWebhookModal(null);
                  setSelectedPartner(null);
                  setWebhooks([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <button
                onClick={() => {
                  setWebhookData({ url: '', events: [], secret: '' });
                  // Show create form
                }}
                className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                ➕ Dodaj webhook
              </button>
            </div>

            {webhookData.url && (
              <form onSubmit={handleCreateWebhook} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={webhookData.url}
                    onChange={(e) => setWebhookData({ ...webhookData, url: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secret</label>
                  <input
                    type="text"
                    value={webhookData.secret}
                    onChange={(e) => setWebhookData({ ...webhookData, secret: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setWebhookData({ url: '', events: [], secret: '' })}
                    className="px-3 py-1 text-sm text-gray-600"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Zapisz
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {webhooks.map((webhook) => (
                <div key={webhook._id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">{webhook.url}</div>
                    <div className="text-xs text-gray-500">
                      {webhook.events?.join(', ') || 'Brak eventów'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWebhook(webhook._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Usuń
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}













