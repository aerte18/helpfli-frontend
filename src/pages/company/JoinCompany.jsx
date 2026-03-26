import { apiUrl } from "@/lib/apiUrl";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function JoinCompany() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Sprawdź czy użytkownik już należy do firmy
  useEffect(() => {
    if (user?.company) {
      navigate('/account?tab=company');
    }
  }, [user, navigate]);

  // Wyszukiwanie firm
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError('Wpisz minimum 2 znaki do wyszukania');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/companies/search?q=${encodeURIComponent(searchQuery)}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
        if (data.companies.length === 0) {
          setError('Nie znaleziono firm');
        }
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Błąd wyszukiwania');
      }
    } catch (err) {
      console.error('Błąd wyszukiwania firm:', err);
      setError('Nie udało się wyszukać firm');
    } finally {
      setLoading(false);
    }
  };

  // Wyślij prośbę o dołączenie
  const handleSendRequest = async () => {
    if (!selectedCompany) {
      setError('Wybierz firmę');
      return;
    }

    setSending(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/companies/${selectedCompany._id}/join-request`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message.trim() })
      });

      if (res.ok) {
        setSuccess(true);
        setSelectedCompany(null);
        setMessage('');
        setTimeout(() => {
          navigate('/account?tab=company');
        }, 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Nie udało się wysłać prośby');
      }
    } catch (err) {
      console.error('Błąd wysyłania prośby:', err);
      setError('Nie udało się wysłać prośby');
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Prośba została wysłana!
          </h2>
          <p className="text-gray-600 mb-6">
            Twoja prośba o dołączenie do firmy została wysłana. Właściciel firmy otrzyma powiadomienie 
            i będzie mógł ją zatwierdzić lub odrzucić.
          </p>
          <button
            onClick={() => navigate('/account?tab=company')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Wróć do konta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
          >
            ← Wróć
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dołącz do firmy
          </h1>
          <p className="text-gray-600">
            Wyszukaj firmę, do której chcesz dołączyć, i wyślij prośbę o dołączenie.
          </p>
        </div>

        {/* Formularz wyszukiwania */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Wyszukaj firmę po nazwie, NIP lub email..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                minLength={2}
              />
              <button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Szukam...' : 'Szukaj'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Lista znalezionych firm */}
          {companies.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">
                Znalezione firmy ({companies.length})
              </h3>
              {companies.map((company) => (
                <div
                  key={company._id}
                  onClick={() => setSelectedCompany(company)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedCompany?._id === company._id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{company.name}</h4>
                        {company.verified && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            ✓ Zweryfikowana
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {company.nip && <div>NIP: {company.nip}</div>}
                        {company.email && <div>Email: {company.email}</div>}
                        {company.phone && <div>Telefon: {company.phone}</div>}
                        {company.address && (
                          <div>
                            {typeof company.address === 'string' 
                              ? company.address 
                              : `${company.address.street || ''} ${company.address.city || ''}`.trim()}
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedCompany?._id === company._id && (
                      <div className="text-indigo-600 text-xl">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formularz prośby */}
        {selectedCompany && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Wyślij prośbę o dołączenie
            </h3>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">{selectedCompany.name}</div>
              <div className="text-sm text-gray-600">NIP: {selectedCompany.nip}</div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wiadomość (opcjonalnie)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Napisz kilka słów o sobie i dlaczego chcesz dołączyć do tej firmy..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {message.length}/500
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedCompany(null);
                  setMessage('');
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Anuluj
              </button>
              <button
                onClick={handleSendRequest}
                disabled={sending}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {sending ? 'Wysyłanie...' : 'Wyślij prośbę'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

