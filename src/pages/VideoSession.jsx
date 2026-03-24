import { useEffect, useState, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Lazy load VideoCall - ciężki komponent z Daily.co
const VideoCall = lazy(() => import('../components/VideoCall'));
import { getVideoSessionToken, getVideoSessions } from '../api/video';

export default function VideoSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Brak ID sesji');
      setLoading(false);
      return;
    }

    // Pobierz dane sesji
    getVideoSessionToken(sessionId)
      .then(data => {
        setSession({
          roomUrl: data.roomUrl,
          token: data.token,
          roomName: data.roomName
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load video session:', err);
        setError(err.message || 'Błąd ładowania sesji');
        setLoading(false);
      });
  }, [sessionId]);

  const handleLeave = () => {
    // Przekieruj do OrderChat lub OrderDetails
    if (session?.orderId) {
      navigate(`/orders/${session.orderId}`);
    } else {
      navigate('/orders');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie sesji wideo...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Błąd</h2>
          <p className="text-gray-600 mb-4">{error || 'Sesja nie została znaleziona'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Wróć do zleceń
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Wideo-wizyta</h1>
          <button
            onClick={handleLeave}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Zamknij
          </button>
        </div>
        
        <div className="h-[calc(100vh-120px)]">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-400">Ładowanie wideo-wizyty...</p>
              </div>
            </div>
          }>
            <VideoCall
              sessionId={sessionId}
              roomUrl={session.roomUrl}
              token={session.token}
              onLeave={handleLeave}
              onError={(err) => {
                console.error('Video call error:', err);
                setError('Błąd połączenia wideo');
              }}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

