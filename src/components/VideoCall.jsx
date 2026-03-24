import { useEffect, useState } from 'react';
import { DailyProvider, DailyVideo, useDaily } from '@daily-co/daily-react';
import { getVideoSessionToken, updateVideoSessionStatus } from '../api/video';

/**
 * Komponent VideoCall - wyświetla wideo-czat używając Daily.co
 * 
 * @param {Object} props
 * @param {String} props.sessionId - ID sesji wideo
 * @param {String} props.roomUrl - URL pokoju Daily.co
 * @param {String} props.token - Token JWT dla uczestnika
 * @param {Function} props.onLeave - Callback gdy użytkownik opuszcza pokój
 * @param {Function} props.onError - Callback przy błędzie
 */
function VideoCallInner({ sessionId, onLeave, onError }) {
  const daily = useDaily();
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!daily) return;

    const handleJoined = () => {
      setIsJoined(true);
      // Aktualizuj status sesji na 'active'
      if (sessionId) {
        updateVideoSessionStatus(sessionId, 'active').catch(err => {
          console.error('Failed to update session status:', err);
        });
      }
    };

    const handleLeft = () => {
      setIsJoined(false);
      // Aktualizuj status sesji na 'ended'
      if (sessionId) {
        updateVideoSessionStatus(sessionId, 'ended').catch(err => {
          console.error('Failed to update session status:', err);
        });
      }
      if (onLeave) onLeave();
    };

    const handleError = (e) => {
      console.error('Daily.co error:', e);
      setError('Błąd połączenia wideo');
      if (onError) onError(e);
    };

    daily.on('joined', handleJoined);
    daily.on('left', handleLeft);
    daily.on('error', handleError);

    return () => {
      daily.off('joined', handleJoined);
      daily.off('left', handleLeft);
      daily.off('error', handleError);
    };
  }, [daily, sessionId, onLeave, onError]);

  const handleLeave = () => {
    if (daily) {
      daily.leave();
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 rounded-lg p-4">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={handleLeave}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Zamknij
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Video container */}
      <div className="flex-1 relative">
        <DailyVideo />
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isJoined ? (
            <span className="text-green-400 text-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Połączono
            </span>
          ) : (
            <span className="text-yellow-400 text-sm">Łączenie...</span>
          )}
        </div>
        
        <button
          onClick={handleLeave}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Zakończ połączenie
        </button>
      </div>
    </div>
  );
}

/**
 * Główny komponent VideoCall z DailyProvider
 */
export default function VideoCall({ sessionId, roomUrl, token, onLeave, onError }) {
  const [dailyToken, setDailyToken] = useState(token);
  const [loading, setLoading] = useState(!token);
  const [error, setError] = useState(null);

  // Jeśli nie mamy tokena, pobierz go
  useEffect(() => {
    if (token) {
      setDailyToken(token);
      setLoading(false);
      return;
    }

    if (!sessionId) {
      setError('Brak ID sesji');
      setLoading(false);
      return;
    }

    // Pobierz token z backendu
    getVideoSessionToken(sessionId)
      .then(data => {
        setDailyToken(data.token);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to get video token:', err);
        setError(err.message || 'Błąd pobierania tokena');
        setLoading(false);
      });
  }, [sessionId, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie wideo-czatu...</p>
        </div>
      </div>
    );
  }

  if (error || !dailyToken || !roomUrl) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg p-4">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error || 'Brak danych do połączenia'}</p>
          {onLeave && (
            <button
              onClick={onLeave}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Zamknij
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <DailyProvider url={roomUrl} token={dailyToken}>
      <VideoCallInner sessionId={sessionId} onLeave={onLeave} onError={onError} />
    </DailyProvider>
  );
}













