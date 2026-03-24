import { useState, useEffect } from 'react';
import { Shield, Download, Trash2, AlertTriangle, CheckCircle, X } from 'lucide-react';

export default function PrivacySettings() {
  const [consentStatus, setConsentStatus] = useState({
    marketing: false,
    analytics: false,
    cookies: false
  });
  const [canDelete, setCanDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    fetchConsentStatus();
    fetchCanDelete();
  }, []);

  const fetchConsentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/privacy/consent-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setConsentStatus(data);
      }
    } catch (error) {
      console.error('Error fetching consent status:', error);
    }
  };

  const fetchCanDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/privacy/can-delete', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCanDelete(data);
      }
    } catch (error) {
      console.error('Error checking delete eligibility:', error);
    }
  };

  const updateConsent = async (type, value) => {
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const newConsent = { ...consentStatus, [type]: value };
      
      const res = await fetch('/api/privacy/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newConsent)
      });
      
      if (res.ok) {
        setConsentStatus(newConsent);
        setMessage('Zgody zostały zaktualizowane');
      } else {
        setMessage('Błąd aktualizacji zgód');
      }
    } catch (error) {
      setMessage('Błąd połączenia');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/privacy/data-export', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Pobierz politykę prywatności
        const policyRes = await fetch('/api/privacy/policy');
        const policy = policyRes.ok ? await policyRes.json() : null;
        
        // Stwórz plik do pobrania
        const exportData = {
          userData: data.data,
          privacyPolicy: policy,
          exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `helpfli-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setMessage('Dane zostały wyeksportowane');
      } else {
        setMessage('Błąd eksportu danych');
      }
    } catch (error) {
      setMessage('Błąd połączenia');
    } finally {
      setLoading(false);
    }
  };

  const requestDataDeletion = async () => {
    if (deleteConfirmText !== 'ANONIMIZUJ_MOJE_DANE') {
      setMessage('Wpisz dokładnie: ANONIMIZUJ_MOJE_DANE');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/privacy/anonymize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ confirm: deleteConfirmText })
      });
      
      if (res.ok) {
        setMessage('Dane zostały anonimizowane. Zostaniesz wylogowany.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 3000);
      } else {
        const data = await res.json();
        setMessage(data.message || 'Błąd anonimizacji danych');
      }
    } catch (error) {
      setMessage('Błąd połączenia');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Ustawienia prywatności</h1>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.includes('Błąd') || message.includes('Nie można') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.includes('Błąd') || message.includes('Nie można') ? (
            <X className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {message}
        </div>
      )}

      {/* Zgody */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Zarządzanie zgodami</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Marketing i promocje</h3>
              <p className="text-sm text-gray-600">Otrzymywanie informacji o promocjach i nowych funkcjach</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={consentStatus.marketing}
                onChange={(e) => updateConsent('marketing', e.target.checked)}
                disabled={loading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Analityka i statystyki</h3>
              <p className="text-sm text-gray-600">Zbieranie danych o korzystaniu z platformy</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={consentStatus.analytics}
                onChange={(e) => updateConsent('analytics', e.target.checked)}
                disabled={loading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Pliki cookies</h3>
              <p className="text-sm text-gray-600">Zapisywanie preferencji i sesji</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={consentStatus.cookies}
                onChange={(e) => updateConsent('cookies', e.target.checked)}
                disabled={loading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Eksport danych */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Eksport danych</h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          Możesz pobrać kopię wszystkich swoich danych w formacie JSON.
        </p>
        
        <button
          onClick={exportData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Pobierz moje dane
        </button>
      </div>

      {/* Usuwanie danych */}
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900">Usuwanie danych</h2>
        </div>
        
        {canDelete ? (
          <div>
            {canDelete.canDelete ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Możesz anonimizować swoje dane. Ta operacja jest nieodwracalna.
                </p>
                
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Anonimizuj moje dane
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-medium">Nie można usunąć danych</p>
                  <p className="text-yellow-700 text-sm">
                    Powód: {canDelete.reason}
                  </p>
                  {canDelete.activeOrders > 0 && (
                    <p className="text-yellow-700 text-sm">
                      Aktywne zlecenia: {canDelete.activeOrders}
                    </p>
                  )}
                  {canDelete.pendingPayments > 0 && (
                    <p className="text-yellow-700 text-sm">
                      Oczekujące płatności: {canDelete.pendingPayments}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">Sprawdzanie możliwości usunięcia danych...</p>
        )}
      </div>

      {/* Modal potwierdzenia usunięcia */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Potwierdź usunięcie danych</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Ta operacja jest nieodwracalna. Wszystkie Twoje dane osobowe zostaną anonimizowane.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wpisz: <strong>ANONIMIZUJ_MOJE_DANE</strong>
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="ANONIMIZUJ_MOJE_DANE"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Anuluj
              </button>
              <button
                onClick={requestDataDeletion}
                disabled={loading || deleteConfirmText !== 'ANONIMIZUJ_MOJE_DANE'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Przetwarzanie...' : 'Potwierdź'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

