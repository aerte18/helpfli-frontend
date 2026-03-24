// Manager white-label
import React, { useState, useEffect } from 'react';
import { 
  getWhiteLabels, 
  createWhiteLabel, 
  updateWhiteLabel,
  deleteWhiteLabel,
  addDomain,
  verifyDomain,
  activateWhiteLabel
} from '../../api/whitelabel';

export default function WhiteLabelManager() {
  const [whitelabels, setWhitelabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWhitelabel, setSelectedWhitelabel] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    companyId: '',
    branding: {
      logo: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      fontFamily: 'Inter'
    },
    customCSS: '',
    customJS: ''
  });

  const [domainData, setDomainData] = useState({
    domain: '',
    isPrimary: false
  });

  useEffect(() => {
    fetchWhitelabels();
  }, []);

  const fetchWhitelabels = async () => {
    try {
      setLoading(true);
      const data = await getWhiteLabels();
      setWhitelabels(data.whitelabels || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createWhiteLabel(formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        slug: '',
        companyId: '',
        branding: { logo: '', primaryColor: '#3B82F6', secondaryColor: '#1E40AF', fontFamily: 'Inter' },
        customCSS: '',
        customJS: ''
      });
      fetchWhitelabels();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleDelete = async (whitelabelId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten white-label?')) return;
    try {
      await deleteWhiteLabel(whitelabelId);
      fetchWhitelabels();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleAddDomain = async (whitelabelId) => {
    try {
      await addDomain(whitelabelId, domainData.domain, domainData.isPrimary);
      setDomainData({ domain: '', isPrimary: false });
      fetchWhitelabels();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleVerifyDomain = async (whitelabelId, domain) => {
    try {
      const result = await verifyDomain(whitelabelId, domain);
      alert(result.verified ? 'Domena zweryfikowana!' : 'Weryfikacja nie powiodła się');
      fetchWhitelabels();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleActivate = async (whitelabelId) => {
    try {
      await activateWhiteLabel(whitelabelId);
      fetchWhitelabels();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie white-labelów...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">White-label</h1>
          <p className="text-gray-600 mt-1">Zarządzaj brandingiem i domenami</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ➕ Dodaj white-label
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Whitelabels List */}
      <div className="space-y-4">
        {whitelabels.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Brak skonfigurowanych white-labelów</p>
          </div>
        ) : (
          whitelabels.map((wl) => (
            <div key={wl._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{wl.name}</h3>
                  <p className="text-sm text-gray-500">Slug: {wl.slug}</p>
                  <p className="text-sm text-gray-500">
                    Status: {wl.active ? 'Aktywny' : 'Nieaktywny'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!wl.active && (
                    <button
                      onClick={() => handleActivate(wl._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Aktywuj
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedWhitelabel(wl._id);
                      setDomainData({ domain: '', isPrimary: false });
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Dodaj domenę
                  </button>
                  <button
                    onClick={() => handleDelete(wl._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Usuń
                  </button>
                </div>
              </div>

              {/* Branding Preview */}
              {wl.branding && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Branding:</h4>
                  <div className="flex items-center gap-4">
                    {wl.branding.logo && (
                      <img src={wl.branding.logo} alt="Logo" className="h-12" />
                    )}
                    <div className="flex gap-2">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: wl.branding.primaryColor }}
                      />
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: wl.branding.secondaryColor }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Domains */}
              {wl.domains && wl.domains.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Domeny:</h4>
                  <div className="space-y-2">
                    {wl.domains.map((domain, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{domain.domain}</span>
                        <div className="flex gap-2">
                          {domain.isPrimary && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Główna
                            </span>
                          )}
                          {domain.verified ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              ✓ Zweryfikowana
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVerifyDomain(wl._id, domain.domain)}
                              className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                            >
                              Zweryfikuj
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Domain Form */}
              {selectedWhitelabel === wl._id && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Dodaj domenę:</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={domainData.domain}
                      onChange={(e) => setDomainData({ ...domainData, domain: e.target.value })}
                      placeholder="example.com"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    />
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={domainData.isPrimary}
                        onChange={(e) => setDomainData({ ...domainData, isPrimary: e.target.checked })}
                        className="mr-2"
                      />
                      Główna
                    </label>
                    <button
                      onClick={() => handleAddDomain(wl._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Dodaj
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Dodaj white-label</h3>
            <form onSubmit={handleCreate}>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={formData.branding.logo}
                  onChange={(e) => setFormData({
                    ...formData,
                    branding: { ...formData.branding, logo: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kolor główny</label>
                <input
                  type="color"
                  value={formData.branding.primaryColor}
                  onChange={(e) => setFormData({
                    ...formData,
                    branding: { ...formData.branding, primaryColor: e.target.value }
                  })}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kolor drugi</label>
                <input
                  type="color"
                  value={formData.branding.secondaryColor}
                  onChange={(e) => setFormData({
                    ...formData,
                    branding: { ...formData.branding, secondaryColor: e.target.value }
                  })}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom CSS</label>
                <textarea
                  value={formData.customCSS}
                  onChange={(e) => setFormData({ ...formData, customCSS: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={4}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom JS</label>
                <textarea
                  value={formData.customJS}
                  onChange={(e) => setFormData({ ...formData, customJS: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={4}
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
    </div>
  );
}













