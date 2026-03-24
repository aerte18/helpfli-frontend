import React, { useState } from 'react';

export default function TwoFactorModal({ isOpen, onClose, onSubmit, error: propError }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token || token.length !== 6) {
      setError('Podaj 6-cyfrowy kod weryfikacyjny');
      return;
    }
    onSubmit(token);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold mb-2">Dwuskładnikowa autoryzacja</h2>
        <p className="text-gray-600 mb-6">
          Wprowadź kod weryfikacyjny z aplikacji autentykatora
        </p>

        {(error || propError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error || propError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kod weryfikacyjny
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setToken(value);
                setError('');
              }}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Zaloguj się
            </button>
          </div>
        </form>

        <div className="mt-4 text-sm text-gray-500 text-center">
          <p>Nie masz dostępu do aplikacji autentykatora?</p>
          <p className="mt-1">Możesz użyć kodu zapasowego.</p>
        </div>
      </div>
    </div>
  );
}

