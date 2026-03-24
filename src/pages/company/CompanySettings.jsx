import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// Proste ikony zastępujące Heroicons

const CompanySettings = ({ companyId: propCompanyId }) => {
  const companyId = propCompanyId;
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    settings: {
      allowProviderRegistration: true,
      autoApproveProviders: false,
      requireManagerApproval: true,
      defaultProviderLevel: 'basic',
      maxProviders: 50
    }
  });

  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Błąd podczas pobierania danych firmy');
      }

      const data = await response.json();
      if (data.success) {
        setCompany(data.company);
        setFormData({
          name: data.company.name || '',
          email: data.company.email || '',
          phone: data.company.phone || '',
          website: data.company.website || '',
          description: data.company.description || '',
          settings: {
            allowProviderRegistration: data.company.settings?.allowProviderRegistration ?? true,
            autoApproveProviders: data.company.settings?.autoApproveProviders ?? false,
            requireManagerApproval: data.company.settings?.requireManagerApproval ?? true,
            defaultProviderLevel: data.company.settings?.defaultProviderLevel || 'basic',
            maxProviders: data.company.settings?.maxProviders || 50
          }
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Błąd podczas aktualizacji firmy');
      }

      if (data.success) {
        setSuccess('Ustawienia zostały zaktualizowane');
        fetchCompanyData(); // Odśwież dane
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie ustawień firmy...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4 text-4xl">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Firma nie została znaleziona</h2>
          <p className="text-gray-600 mb-4">Sprawdź czy masz uprawnienia do tej firmy</p>
          <button 
            onClick={() => navigate('/company/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Powrót do panelu
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'Ogólne', icon: '🏢' },
    { id: 'team', name: 'Zespół', icon: '👥' },
    { id: 'advanced', name: 'Zaawansowane', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ustawienia firmy</h1>
                <p className="text-gray-600">{company.name}</p>
              </div>
              <div className="flex gap-3">
                <Link
                  to={`/company/${companyId}/analytics`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  📊 Raporty
                </Link>
                <Link
                  to={`/company/${companyId}/billing`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  💰 Rozliczenia
                </Link>
                <button 
                  onClick={() => navigate('/company/dashboard')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Powrót do panelu
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <span className="text-green-400 mr-2">✅</span>
                  <p className="text-green-800">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Informacje ogólne</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nazwa firmy
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Strona internetowa
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opis firmy
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Team Tab */}
              {activeTab === 'team' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Ustawienia zespołu</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Pozwól na rejestrację nowych wykonawców
                        </label>
                        <p className="text-sm text-gray-500">
                          Czy nowi wykonawcy mogą się zarejestrować w Twojej firmie
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        name="settings.allowProviderRegistration"
                        checked={formData.settings.allowProviderRegistration}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Automatyczne zatwierdzanie wykonawców
                        </label>
                        <p className="text-sm text-gray-500">
                          Nowi wykonawcy będą automatycznie dodawani do zespołu
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        name="settings.autoApproveProviders"
                        checked={formData.settings.autoApproveProviders}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Wymagaj zatwierdzenia przez managera
                        </label>
                        <p className="text-sm text-gray-500">
                          Manager musi zatwierdzić nowych członków zespołu
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        name="settings.requireManagerApproval"
                        checked={formData.settings.requireManagerApproval}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Domyślny poziom wykonawcy
                      </label>
                      <select
                        name="settings.defaultProviderLevel"
                        value={formData.settings.defaultProviderLevel}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="basic">Podstawowy</option>
                        <option value="standard">Standardowy</option>
                        <option value="pro">Profesjonalny</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maksymalna liczba wykonawców
                      </label>
                      <input
                        type="number"
                        name="settings.maxProviders"
                        value={formData.settings.maxProviders}
                        onChange={handleChange}
                        min="1"
                        max="1000"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Ustawienia zaawansowane</h3>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <span className="text-yellow-400 mr-2">⚠️</span>
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">Uwaga</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Zmiany w ustawieniach zaawansowanych mogą wpłynąć na działanie systemu.
                          Skontaktuj się z administratorem w przypadku problemów.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-8">
                    <p className="text-gray-500">Brak dostępnych ustawień zaawansowanych</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
