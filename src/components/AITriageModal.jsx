// src/components/AITriageModal.jsx
// MVP: AI Triage Modal - analizuje problem i sugeruje rozwiązanie
import { useState } from 'react';
import { X } from 'lucide-react';

export default function AITriageModal({ isOpen, onClose, onProceed, initialDescription = '' }) {
  const [description, setDescription] = useState(initialDescription);
  const [location, setLocation] = useState({ address: '', city: '', lat: null, lng: null });
  const [service, setService] = useState('');
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [error, setError] = useState(null);

  // Pobierz geolokację użytkownika
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolokacja nie jest dostępna');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }));
      },
      (err) => {
        console.warn('Geolokacja nieudana:', err);
        setError('Nie udało się pobrać lokalizacji');
      }
    );
  };

  // Wywołaj AI Triage
  const handleAnalyze = async () => {
    if (!description.trim() || description.trim().length < 10) {
      setError('Opis problemu musi mieć minimum 10 znaków');
      return;
    }

    if (!location.address && !location.city) {
      setError('Podaj lokalizację');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          description: description.trim(),
          location: {
            address: location.address,
            city: location.city,
            lat: location.lat,
            lng: location.lng,
          },
          service: service || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Błąd analizy AI');
      }

      const result = await response.json();
      setTriageResult(result);
    } catch (err) {
      setError(err.message || 'Błąd podczas analizy');
    } finally {
      setLoading(false);
    }
  };

  // Przejdź do tworzenia zlecenia
  const handleCreateOrder = (mode) => {
    if (!triageResult) return;

    onProceed({
      description,
      location,
      service: triageResult.suggestedService || service,
      urgency: mode, // 'now' | 'today' | 'flexible'
      aiTriage: triageResult,
      budgetRange: triageResult.priceRange,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Zapytaj AI</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!triageResult ? (
            <>
              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Opisz swój problem *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Np. Zatkana kanalizacja w kuchni, woda nie spływa..."
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Lokalizacja *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={location.address || location.city}
                      onChange={(e) => setLocation(prev => ({
                        ...prev,
                        address: e.target.value,
                        city: e.target.value
                      }))}
                      placeholder="Miasto lub adres"
                      className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={getCurrentLocation}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    >
                      📍 Moja lokalizacja
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Usługa (opcjonalnie)
                  </label>
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="Np. hydraulik, elektryk..."
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border rounded-lg font-medium hover:bg-gray-50"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? 'Analizuję...' : 'Analizuj problem'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Triage Results */}
              <div className="space-y-4">
                {/* Severity Badge */}
                <div className={`p-4 rounded-lg ${
                  triageResult.severity === 'urgent' ? 'bg-red-50 border-red-200' :
                  triageResult.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                  triageResult.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                } border`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {triageResult.severity === 'urgent' ? '🚨 Pilne' :
                       triageResult.severity === 'high' ? '⚠️ Wysokie' :
                       triageResult.severity === 'medium' ? '⚡ Średnie' :
                       'ℹ️ Niskie'}
                    </span>
                    <span className="text-sm opacity-70">
                      Priorytet: {triageResult.severity}
                    </span>
                  </div>
                </div>

                {/* Suggested Service */}
                {triageResult.suggestedService && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Sugerowana usługa:</div>
                    <div className="text-lg font-semibold capitalize">
                      {triageResult.suggestedService}
                    </div>
                  </div>
                )}

                {/* Self-Fix Steps */}
                {triageResult.selfFixSteps && triageResult.selfFixSteps.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium mb-2">Możesz spróbować samodzielnie:</div>
                    <ul className="space-y-2">
                      {triageResult.selfFixSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-blue-600 font-bold">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Price Range */}
                {triageResult.priceRange && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Szacowany koszt:</div>
                    <div className="text-xl font-bold">
                      {triageResult.priceRange.min} - {triageResult.priceRange.max} PLN
                    </div>
                  </div>
                )}

                {/* Recommended Mode */}
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium mb-3">
                    Rekomendowany tryb: <span className="capitalize">{triageResult.recommendedMode}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {triageResult.recommendedMode === 'now' && (
                      <button
                        onClick={() => handleCreateOrder('now')}
                        className="px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                      >
                        Zleć teraz
                      </button>
                    )}
                    {triageResult.recommendedMode === 'today' && (
                      <button
                        onClick={() => handleCreateOrder('today')}
                        className="px-4 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                      >
                        Zleć dziś
                      </button>
                    )}
                    <button
                      onClick={() => handleCreateOrder('flexible')}
                      className="px-4 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900"
                    >
                      Zleć elastycznie
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setTriageResult(null)}
                  className="flex-1 px-4 py-3 border rounded-lg font-medium hover:bg-gray-50"
                >
                  Wróć
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-medium hover:bg-gray-200"
                >
                  Anuluj
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

