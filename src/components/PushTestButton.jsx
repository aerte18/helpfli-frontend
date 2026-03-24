import React, { useState } from 'react';
import { testPush } from '../utils/push';

export default function PushTestButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const result = await testPush();
      setResult({ success: true, data: result });
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-3">🔔 Test Push Notifications</h3>
      
      <button
        onClick={handleTest}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Wysyłanie...' : 'Wyślij test push'}
      </button>

      {result && (
        <div className={`mt-3 p-3 rounded ${
          result.success 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {result.success ? (
            <div>
              <p className="font-semibold">✅ Test successful!</p>
              <p className="text-sm">Sent to {result.data?.sent || 0} devices</p>
            </div>
          ) : (
            <div>
              <p className="font-semibold">❌ Test failed</p>
              <p className="text-sm">{result.error}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 text-sm text-gray-600">
        <p>This will send a test push notification to all your registered devices.</p>
        <p>Make sure you've granted notification permissions in your browser.</p>
      </div>
    </div>
  );
}
