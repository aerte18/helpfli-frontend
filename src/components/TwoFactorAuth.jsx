import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function TwoFactorAuth() {
  const [status, setStatus] = useState({ enabled: false, setup: false });
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('status'); // 'status', 'setup', 'verify', 'backup'
  const [qrCode, setQrCode] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationToken, setVerificationToken] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await api('/api/users/me/2fa');
      setStatus(data);
    } catch (err) {
      setError(err.message || 'Błąd pobierania statusu 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      setError('');
      setSuccess('');
      const data = await api('/api/users/me/2fa/setup', { method: 'POST' });
      setQrCode(data.qrCode);
      setManualKey(data.manualEntryKey);
      setBackupCodes(data.backupCodes || []);
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Błąd konfiguracji 2FA');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verificationToken) {
      setError('Podaj kod weryfikacyjny');
      return;
    }

    try {
      setError('');
      const data = await api('/api/users/me/2fa/verify', {
        method: 'POST',
        body: { token: verificationToken, backupCodes }
      });
      setSuccess(data.message || '2FA zostało aktywowane!');
      setStep('backup');
      await fetchStatus();
    } catch (err) {
      setError(err.message || 'Nieprawidłowy kod weryfikacyjny');
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    if (!disablePassword) {
      setError('Podaj hasło, aby wyłączyć 2FA');
      return;
    }

    try {
      setError('');
      const data = await api('/api/users/me/2fa', {
        method: 'PUT',
        body: { enabled: false, password: disablePassword }
      });
      setSuccess(data.message || '2FA zostało wyłączone');
      setDisablePassword('');
      setStep('status');
      await fetchStatus();
    } catch (err) {
      setError(err.message || 'Nieprawidłowe hasło');
    }
  };

  const handleEnable = async () => {
    try {
      setError('');
      const data = await api('/api/users/me/2fa', {
        method: 'PUT',
        body: { enabled: true }
      });
      setSuccess(data.message || '2FA zostało włączone');
      await fetchStatus();
    } catch (err) {
      setError(err.message || 'Błąd włączenia 2FA');
    }
  };

  if (loading) {
    return <div className="p-4">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Dwuskładnikowa autoryzacja (2FA)</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {step === 'status' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Status 2FA</div>
                <div className="text-sm text-gray-600">
                  {status.enabled ? 'Włączone' : status.setup ? 'Skonfigurowane, ale wyłączone' : 'Nieskonfigurowane'}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                status.enabled 
                  ? 'bg-green-100 text-green-800' 
                  : status.setup 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {status.enabled ? 'Aktywne' : status.setup ? 'Gotowe' : 'Wyłączone'}
              </span>
            </div>

            {!status.setup && (
              <button
                onClick={handleSetup}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Skonfiguruj 2FA
              </button>
            )}

            {status.setup && !status.enabled && (
              <div className="space-y-3">
                <button
                  onClick={handleEnable}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Włącz 2FA
                </button>
                <button
                  onClick={() => setStep('setup')}
                  className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Skonfiguruj ponownie
                </button>
              </div>
            )}

            {status.enabled && (
              <form onSubmit={handleDisable} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Podaj hasło, aby wyłączyć 2FA
                  </label>
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Twoje hasło"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Wyłącz 2FA
                </button>
              </form>
            )}
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Krok 1: Zeskanuj kod QR</h4>
              <p className="text-sm text-gray-600 mb-4">
                Otwórz aplikację autentykatora (np. Google Authenticator, Authy) i zeskanuj ten kod QR:
              </p>
              {qrCode && (
                <div className="flex justify-center mb-4">
                  <img src={qrCode} alt="QR Code" className="border rounded-lg p-2 bg-white" />
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">Lub wprowadź klucz ręcznie</h4>
              <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm break-all">
                {manualKey}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(manualKey);
                  alert('Klucz skopiowany do schowka!');
                }}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                Kopiuj klucz
              </button>
            </div>

            <form onSubmit={handleVerify} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Krok 2: Wprowadź kod z aplikacji autentykatora
                </label>
                <input
                  type="text"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Zweryfikuj i aktywuj
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('status');
                  setVerificationToken('');
                  setError('');
                }}
                className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Anuluj
              </button>
            </form>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Zapisz kody zapasowe!</h4>
              <p className="text-sm text-yellow-700 mb-3">
                Te kody pozwolą Ci odzyskać dostęp do konta, jeśli stracisz dostęp do aplikacji autentykatora.
                Zapisz je w bezpiecznym miejscu.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="p-2 bg-white border rounded font-mono text-sm text-center">
                    {code}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const codesText = backupCodes.join('\n');
                  navigator.clipboard.writeText(codesText);
                  alert('Kody zapasowe skopiowane do schowka!');
                }}
                className="text-sm text-yellow-800 hover:text-yellow-900 underline"
              >
                Kopiuj wszystkie kody
              </button>
            </div>
            <button
              onClick={() => {
                setStep('status');
                setVerificationToken('');
                setBackupCodes([]);
                setError('');
                setSuccess('');
              }}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Zakończ konfigurację
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

