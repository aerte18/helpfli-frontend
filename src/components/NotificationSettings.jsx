import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function NotificationSettings({ reloadTrigger = 0 }) {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPreferences();
  }, [reloadTrigger]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await api('/api/notifications/preferences');
      if (data.success) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (path, value) => {
    const newPrefs = { ...preferences };
    const keys = path.split('.');
    let current = newPrefs;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setPreferences(newPrefs);

    try {
      setSaving(true);
      setMessage('');
      const data = await api('/api/notifications/preferences', {
        method: 'PUT',
        body: { preferences: newPrefs }
      });
      if (data.success) {
        setMessage('Zapisano!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Błąd zapisywania');
      setTimeout(() => setMessage(''), 3000);
      // Przywróć poprzednie wartości
      loadPreferences();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Ładowanie...</div>;
  }

  if (!preferences) {
    return <div className="text-center py-8">Błąd ładowania preferencji</div>;
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-lg ${message === 'Zapisano!' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Subskrypcje */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Powiadomienia o subskrypcjach</h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.subscriptionExpiry?.email !== false}
                onChange={(e) => updatePreferences('subscriptionExpiry.email', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">Email</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.subscriptionExpiry?.sms === true}
                onChange={(e) => updatePreferences('subscriptionExpiry.sms', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">SMS</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.subscriptionExpiry?.push !== false}
                onChange={(e) => updatePreferences('subscriptionExpiry.push', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">Push notifications</span>
            </label>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Powiadomienia przed wygaśnięciem (dni):</label>
            <div className="flex gap-4">
              {[7, 3, 1].map((day) => (
                <label key={day} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.subscriptionExpiry?.daysBefore?.includes(day) || false}
                    onChange={(e) => {
                      const days = preferences.subscriptionExpiry?.daysBefore || [];
                      const newDays = e.target.checked
                        ? [...days, day].sort((a, b) => b - a)
                        : days.filter(d => d !== day);
                      updatePreferences('subscriptionExpiry.daysBefore', newDays);
                    }}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm">{day} {day === 1 ? 'dzień' : 'dni'}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pakiety promocyjne */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Powiadomienia o pakietach promocyjnych</h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.promoExpiring?.email !== false}
                onChange={(e) => updatePreferences('promoExpiring.email', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">Email</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.promoExpiring?.sms === true}
                onChange={(e) => updatePreferences('promoExpiring.sms', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">SMS</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.promoExpiring?.push !== false}
                onChange={(e) => updatePreferences('promoExpiring.push', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">Push notifications</span>
            </label>
          </div>
        </div>
      </div>

      {/* Aktualizacje zleceń */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Aktualizacje zleceń</h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.orderUpdates?.email !== false}
                onChange={(e) => updatePreferences('orderUpdates.email', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">Email</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.orderUpdates?.sms === true}
                onChange={(e) => updatePreferences('orderUpdates.sms', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">SMS</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.orderUpdates?.push !== false}
                onChange={(e) => updatePreferences('orderUpdates.push', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">Push notifications</span>
            </label>
          </div>
        </div>
      </div>

      {/* Marketing */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Powiadomienia marketingowe</h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.promotions?.email !== false}
                onChange={(e) => updatePreferences('promotions.email', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">Email</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.promotions?.sms === true}
                onChange={(e) => updatePreferences('promotions.sms', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">SMS</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.promotions?.push !== false}
                onChange={(e) => updatePreferences('promotions.push', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">Push notifications</span>
            </label>
          </div>
        </div>
      </div>

      {/* Wiadomości na czacie */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Wiadomości na czacie</h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.chatMessages?.email === true}
                onChange={(e) => updatePreferences('chatMessages.email', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">Email</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.chatMessages?.sms === true}
                onChange={(e) => updatePreferences('chatMessages.sms', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">SMS</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.chatMessages?.push !== false}
                onChange={(e) => updatePreferences('chatMessages.push', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">Push notifications</span>
            </label>
          </div>
        </div>
      </div>

      {/* Alerty systemowe */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Alerty systemowe</h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.systemAlerts?.email !== false}
                onChange={(e) => updatePreferences('systemAlerts.email', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">Email</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.systemAlerts?.sms !== false}
                onChange={(e) => updatePreferences('systemAlerts.sms', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">SMS</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.systemAlerts?.push !== false}
                onChange={(e) => updatePreferences('systemAlerts.push', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">Push notifications</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

