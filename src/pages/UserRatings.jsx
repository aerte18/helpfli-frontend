import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRatings, markRatingHelpful, replyToRating } from "../api/social";

const UserRatings = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchRatings();
  }, [userId]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const data = await getRatings(userId);
      setRatings(data.ratings || []);
    } catch (err) {
      console.error("Błąd pobierania ocen:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (ratingId) => {
    try {
      await markRatingHelpful(ratingId);
      fetchRatings();
    } catch (err) {
      console.error("Błąd:", err);
    }
  };

  const handleReply = async (ratingId) => {
    if (!replyText.trim()) return;
    try {
      await replyToRating(ratingId, replyText);
      setReplyingTo(null);
      setReplyText("");
      fetchRatings();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const categoryLabels = {
    quality: "Jakość wykonania",
    punctuality: "Punktualność",
    communication: "Komunikacja",
    price: "Stosunek jakości do ceny",
    professionalism: "Profesjonalizm"
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Ładowanie ocen...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6">Oceny użytkownika</h2>
      {ratings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Brak ocen do wyświetlenia.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((r) => (
            <div key={r._id} className="bg-white rounded-lg shadow p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold">
                      {r.from?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">{r.from?.name || 'Anonimowy'}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString('pl-PL')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.verified && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      ✓ Zweryfikowana
                    </span>
                  )}
                  <div className="text-2xl font-bold text-yellow-500">
                    {r.rating}/5
                  </div>
                </div>
              </div>

              {/* Kategorie ocen */}
              {r.categories && Object.keys(r.categories).length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">Szczegółowe oceny:</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(r.categories).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <div className="text-gray-600">{categoryLabels[key] || key}:</div>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-yellow-500 h-1.5 rounded-full"
                              style={{ width: `${(value / 5) * 100}%` }}
                            />
                          </div>
                          <span className="font-medium">{value}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Komentarz */}
              {r.comment && (
                <p className="text-gray-700 mb-4">{r.comment}</p>
              )}

              {/* Zdjęcia */}
              {r.photos && r.photos.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {r.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Zdjęcie ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Odpowiedź */}
              {r.response && (
                <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <div className="text-sm font-medium text-blue-900 mb-1">
                    Odpowiedź wykonawcy:
                  </div>
                  <p className="text-sm text-blue-800">{r.response.text}</p>
                  <div className="text-xs text-blue-600 mt-1">
                    {new Date(r.response.createdAt).toLocaleDateString('pl-PL')}
                  </div>
                </div>
              )}

              {/* Akcje */}
              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  onClick={() => handleHelpful(r._id)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  <span>👍</span>
                  <span>Pomocne ({r.helpful || 0})</span>
                </button>
                {user?._id === userId && !r.response && (
                  <button
                    onClick={() => setReplyingTo(r._id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Odpowiedz
                  </button>
                )}
              </div>

              {/* Formularz odpowiedzi */}
              {replyingTo === r._id && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Napisz odpowiedź..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReply(r._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Wyślij odpowiedź
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText("");
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserRatings;