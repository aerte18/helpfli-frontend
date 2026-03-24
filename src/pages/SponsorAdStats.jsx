import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SponsorAdStats() {
  const { id } = useParams();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ad, setAd] = useState(null);
  const [pixelCode, setPixelCode] = useState(null);
  const [showPixelModal, setShowPixelModal] = useState(false);

  useEffect(() => {
    loadStats();
    loadAd();
  }, [id]);

  const loadPixelCode = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/sponsor-ads/${id}/pixel-code`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setPixelCode(data);
      }
    } catch (error) {
      console.error("Error loading pixel code:", error);
    }
  };

  const loadAd = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/sponsor-ads/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setAd(data.ad);
      }
    } catch (error) {
      console.error("Error loading ad:", error);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/sponsor-ads/${id}/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie statystyk...</p>
        </div>
      </div>
    );
  }

  if (!stats || !ad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Nie znaleziono reklamy lub statystyk</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/sponsor-ads"
            className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
          >
            ← Wróć do listy reklam
          </a>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mt-4">
                Statystyki reklamy
              </h1>
              <p className="mt-2 text-gray-600">{ad.title}</p>
            </div>
            <div className="flex gap-2">
              {ad.package === 'enterprise' && (
                <button
                  onClick={() => {
                    // TODO: Otwórz modal A/B Testing
                    alert('A/B Testing - wkrótce dostępne w panelu');
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  🧪 A/B Testing
                </button>
              )}
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");
                    const API = import.meta.env.VITE_API_URL || "";
                    const res = await fetch(`${API}/api/sponsor-ads/${id}/report/pdf`, {
                      headers: {
                        Authorization: `Bearer ${token}`
                      }
                    });
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `raport-reklamy-${ad.title.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } else {
                      alert('Błąd pobierania raportu PDF');
                    }
                  } catch (error) {
                    console.error('Error downloading PDF:', error);
                    alert('Błąd pobierania raportu PDF');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📄 Pobierz raport PDF
              </button>
              <button
                onClick={() => {
                  loadPixelCode();
                  setShowPixelModal(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                📊 Kod Pixel Tracking
              </button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-6">
            <div className="text-sm text-gray-600 mb-1">Wyświetlenia</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalImpressions || 0}
            </div>
            {stats.comparison?.impressionsChange !== undefined && (
              <div className={`text-xs mt-1 ${stats.comparison.impressionsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.comparison.impressionsChange >= 0 ? '↑' : '↓'} {Math.abs(stats.comparison.impressionsChange).toFixed(1)}% vs poprzedni tydzień
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="text-sm text-gray-600 mb-1">Kliknięcia</div>
            <div className="text-2xl font-bold text-indigo-600">
              {stats.totalClicks || 0}
            </div>
            {stats.comparison?.clicksChange !== undefined && (
              <div className={`text-xs mt-1 ${stats.comparison.clicksChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.comparison.clicksChange >= 0 ? '↑' : '↓'} {Math.abs(stats.comparison.clicksChange).toFixed(1)}% vs poprzedni tydzień
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="text-sm text-gray-600 mb-1">CTR</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.ctr ? `${stats.ctr.toFixed(2)}%` : "0%"}
            </div>
            {stats.comparison?.ctrChange !== undefined && (
              <div className={`text-xs mt-1 ${stats.comparison.ctrChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.comparison.ctrChange >= 0 ? '↑' : '↓'} {Math.abs(stats.comparison.ctrChange).toFixed(2)}% vs poprzedni tydzień
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Średnia branżowa: ~3%
            </div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="text-sm text-gray-600 mb-1">Wydane / Budżet</div>
            <div className="text-2xl font-bold text-orange-600">
              {((stats.budgetSpent || 0) / 100).toFixed(2)} zł /{" "}
              {((stats.budgetTotal || 0) / 100).toFixed(2)} zł
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Pozostało: {((stats.budgetRemaining || 0) / 100).toFixed(2)} zł
            </div>
            {stats.budgetTotal > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{
                      width: `${((stats.budgetSpent || 0) / stats.budgetTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Period Comparison */}
        {(stats.last7Days || stats.last30Days) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ostatnie 7 dni</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Wyświetlenia:</span>
                  <span className="font-semibold">{stats.last7Days?.impressions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kliknięcia:</span>
                  <span className="font-semibold">{stats.last7Days?.clicks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CTR:</span>
                  <span className="font-semibold text-green-600">
                    {stats.last7Days?.ctr ? `${stats.last7Days.ctr.toFixed(2)}%` : "0%"}
                  </span>
                </div>
                {stats.last7Days?.conversions !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Konwersje:</span>
                    <span className="font-semibold">{stats.last7Days.conversions || 0}</span>
                  </div>
                )}
                {stats.last7Days?.conversionRate !== undefined && stats.last7Days.clicks > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversion Rate:</span>
                    <span className="font-semibold text-blue-600">
                      {stats.last7Days.conversionRate.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ostatnie 30 dni</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Wyświetlenia:</span>
                  <span className="font-semibold">{stats.last30Days?.impressions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kliknięcia:</span>
                  <span className="font-semibold">{stats.last30Days?.clicks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CTR:</span>
                  <span className="font-semibold text-green-600">
                    {stats.last30Days?.ctr ? `${stats.last30Days.ctr.toFixed(2)}%` : "0%"}
                  </span>
                </div>
                {stats.last30Days?.conversions !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Konwersje:</span>
                    <span className="font-semibold">{stats.last30Days.conversions || 0}</span>
                  </div>
                )}
                {stats.last30Days?.conversionRate !== undefined && stats.last30Days.clicks > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversion Rate:</span>
                    <span className="font-semibold text-blue-600">
                      {stats.last30Days.conversionRate.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Daily Stats Chart */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Statystyki dzienne (ostatnie 30 dni)
          </h2>
          <div className="space-y-4">
            {Object.keys(stats.impressionsByDay || {}).length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Brak danych do wyświetlenia
              </p>
            ) : (
              Object.entries(stats.impressionsByDay || {})
                .sort((a, b) => new Date(a[0]) - new Date(b[0])) // Sortuj chronologicznie
                .slice(-30) // Ostatnie 30 dni
                .map(([date, impressions]) => {
                  const clicks = stats.clicksByDay?.[date] || 0;
                  const conversions = stats.conversionsByDay?.[date] || 0;
                  const maxImpressions = Math.max(
                    ...Object.values(stats.impressionsByDay || {}),
                    1
                  );
                  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
                  
                  return (
                    <div key={date} className="flex items-center gap-4 py-2 border-b last:border-0">
                      <div className="w-28 text-sm text-gray-600">
                        {new Date(date).toLocaleDateString("pl-PL", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </div>
                      <div className="flex-1 space-y-2">
                        {/* Wyświetlenia */}
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-xs text-gray-500">Wyświetlenia:</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                            <div
                              className="bg-indigo-600 h-3 rounded-full"
                              style={{
                                width: `${(impressions / maxImpressions) * 100}%`,
                              }}
                            />
                          </div>
                          <div className="text-sm font-medium text-gray-900 w-12 text-right">
                            {impressions}
                          </div>
                        </div>
                        {/* Kliknięcia */}
                        {clicks > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-20 text-xs text-gray-500">Kliknięcia:</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                              <div
                                className="bg-green-600 h-3 rounded-full"
                                style={{
                                  width: `${(clicks / maxImpressions) * 100}%`,
                                }}
                              />
                            </div>
                            <div className="text-sm font-medium text-green-600 w-12 text-right">
                              {clicks}
                            </div>
                            <div className="text-xs text-gray-500 w-16 text-right">
                              ({ctr.toFixed(1)}%)
                            </div>
                          </div>
                        )}
                        {/* Konwersje */}
                        {conversions > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-20 text-xs text-gray-500">Konwersje:</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                              <div
                                className="bg-blue-600 h-3 rounded-full"
                                style={{
                                  width: `${(conversions / maxImpressions) * 100}%`,
                                }}
                              />
                            </div>
                            <div className="text-sm font-medium text-blue-600 w-12 text-right">
                              {conversions}
                            </div>
                            {clicks > 0 && (
                              <div className="text-xs text-gray-500 w-16 text-right">
                                ({((conversions / clicks) * 100).toFixed(1)}%)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Pixel Tracking Modal */}
        {showPixelModal && pixelCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Kod Pixel Tracking
                  </h2>
                  <button
                    onClick={() => setShowPixelModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Wstaw ten kod na stronę potwierdzenia zamówienia, aby śledzić konwersje
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Podstawowy kod HTML */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Podstawowy kod (HTML)
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {pixelCode.instructions?.basic}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                      {pixelCode.codes?.html}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pixelCode.codes.html);
                        alert("Skopiowano do schowka!");
                      }}
                      className="mt-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                    >
                      Kopiuj kod
                    </button>
                  </div>
                </div>

                {/* Zaawansowany kod JavaScript */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Zaawansowany kod (JavaScript)
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {pixelCode.instructions?.advanced}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                      {pixelCode.codes?.javascript}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pixelCode.codes.javascript);
                        alert("Skopiowano do schowka!");
                      }}
                      className="mt-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                    >
                      Kopiuj kod
                    </button>
                  </div>
                </div>

                {/* Shopify */}
                {pixelCode.codes?.shopify && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Kod dla Shopify
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {pixelCode.instructions?.shopify}
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                        {pixelCode.codes.shopify}
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pixelCode.codes.shopify);
                          alert("Skopiowano do schowka!");
                        }}
                        className="mt-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                      >
                        Kopiuj kod
                      </button>
                    </div>
                  </div>
                )}

                {/* WooCommerce */}
                {pixelCode.codes?.woocommerce && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Kod dla WooCommerce
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {pixelCode.instructions?.woocommerce}
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                        {pixelCode.codes.woocommerce}
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pixelCode.codes.woocommerce);
                          alert("Skopiowano do schowka!");
                        }}
                        className="mt-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                      >
                        Kopiuj kod
                      </button>
                    </div>
                  </div>
                )}

                {/* Informacje */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    💡 Jak to działa?
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Pixel tracking to mały obrazek 1x1px, który jest niewidoczny dla użytkownika</li>
                    <li>Gdy użytkownik odwiedza stronę z kodem, automatycznie rejestrujemy konwersję</li>
                    <li>Możesz przekazać dodatkowe dane (wartość zamówienia, ID produktu) przez parametry URL</li>
                    <li>Przykład: {pixelCode.pixelUrl}?type=purchase&value=10000&orderId=123</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

