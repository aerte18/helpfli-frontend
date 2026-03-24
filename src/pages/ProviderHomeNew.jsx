import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../context/AuthContext";
import ServiceSelector from "../components/ServiceSelector";

// Funkcja do tworzenia nowoczesnych pinezek dla zleceń
function orderIcon(order) {
  const urgency = order.urgency || 'flexible';
  
  // Kolory dla różnych pilności
  let gradient = "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)"; // niebieski - elastyczne
  let shadowColor = "rgba(59, 130, 246, 0.4)";
  let size = 48;
  
  if (urgency === 'today') {
    gradient = "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"; // pomarańczowy - dziś
    shadowColor = "rgba(245, 158, 11, 0.4)";
    size = 50;
  } else if (urgency === 'tomorrow') {
    gradient = "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)"; // zielony - jutro
    shadowColor = "rgba(16, 185, 129, 0.4)";
    size = 48;
  }

  const html = `
    <div style="
      width: ${size}px; height: ${size}px; 
      border-radius: 50% 50% 50% 0;
      background: ${gradient};
      box-shadow: 
        0 8px 25px ${shadowColor},
        0 4px 12px rgba(0,0,0,0.15),
        inset 0 1px 0 rgba(255,255,255,0.3),
        inset 0 -1px 0 rgba(0,0,0,0.1);
      display: flex; align-items: center; justify-content: center;
      position: relative;
      transform: rotate(-45deg);
      transition: all 0.3s ease;
      border: 2px solid rgba(255,255,255,0.8);
    ">
      <div style="
        width: ${size - 16}px; height: ${size - 16}px; 
        border-radius: 50%;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        display: flex; align-items: center; justify-content: center;
        font-weight: bold; color: #1e293b;
        font-size: ${size > 50 ? '16px' : '14px'};
        transform: rotate(45deg);
        box-shadow: 
          inset 0 2px 4px rgba(0,0,0,0.1),
          0 1px 2px rgba(255,255,255,0.8);
        border: 1px solid rgba(255,255,255,0.6);
      ">
        ${urgency === 'today' ? '📅' : urgency === 'tomorrow' ? '⏰' : '📋'}
      </div>
    </div>
  `;
  
  return L.divIcon({
    html,
    className: "order-pin",
    iconSize: [size, size],
    iconAnchor: [size/2, size]
  });
}

// Funkcja do pobierania otwartych zleceń z API
const fetchOpenOrders = async (userLocation, maxDistance, selectedServices) => {
  try {
    const params = new URLSearchParams({
      status: 'open',
      ...(userLocation && { 
        lat: userLocation.lat.toString(), 
        lng: userLocation.lng.toString() 
      }),
      ...(maxDistance && { maxDistance: maxDistance.toString() }),
      ...(selectedServices.length > 0 && { services: selectedServices.join(',') })
    });

    const response = await fetch(`/api/orders/open?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Błąd pobierania zleceń');
    }

    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export default function ProviderHomeNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [maxDistance, setMaxDistance] = useState(10); // km
  const [selectedServices, setSelectedServices] = useState([]);
  const [showAllServices, setShowAllServices] = useState(false);

  // Ustaw domyślnie "Pokaż wszystkie zlecenia" na true, jeśli provider nie ma przypisanych usług
  useEffect(() => {
    if (!user?.services || user.services.length === 0) {
      setShowAllServices(true);
    }
  }, [user?.services]);

  // Funkcja do pobierania geolokalizacji użytkownika
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolokalizacja nie jest obsługiwana przez przeglądarkę');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setLocationError(null);
        console.log('📍 Geolokalizacja providera:', location);
      },
      (error) => {
        console.error('❌ Błąd geolokalizacji:', error);
        setLocationError('Nie udało się pobrać lokalizacji');
        // Fallback do Warszawy dla testów
        setUserLocation({ lat: 52.2297, lng: 21.0122 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minut
      }
    );
  }, []);

  // Pobierz geolokalizację przy załadowaniu komponentu
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Funkcja do kalkulacji odległości między dwoma punktami (Haversine formula)
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371; // Promień Ziemi w km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Pobierz zlecenia
  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const ordersData = await fetchOpenOrders(userLocation, maxDistance, selectedServices);
        
        // Dodaj obliczenia odległości jeśli mamy lokalizację użytkownika
        const ordersWithDistance = ordersData.map(order => {
          if (userLocation && order.locationLat && order.locationLon) {
            const distance = calculateDistance(
              userLocation.lat, userLocation.lng,
              order.locationLat, order.locationLon
            );
            return { ...order, distanceKm: distance };
          }
          return order;
        });
        
        setOrders(ordersWithDistance);
      } catch (err) {
        setError('Nie udało się pobrać zleceń');
        console.error('Error loading orders:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userLocation) {
      loadOrders();
    }
  }, [userLocation, maxDistance, selectedServices, calculateDistance]);

  // Filtruj zlecenia według usług providera
  const filteredOrders = useMemo(() => {
    // Jeśli checkbox "Pokaż wszystkie" jest zaznaczony, pokaż wszystkie zlecenia
    if (showAllServices) {
      return orders;
    }

    // Jeśli provider nie ma przypisanych usług (lub ma pustą tablicę), pokaż wszystkie zlecenia
    if (!user?.services || user.services.length === 0) {
      console.log('🔍 Provider nie ma usług - pokazuję wszystkie zlecenia');
      return orders;
    }

    // Pobierz nazwy usług providera (obsługa zarówno obiektów jak i stringów)
    const providerServiceNames = user.services.map(s => {
      if (typeof s === 'string') return s;
      if (s.name) return s.name;
      if (s.name_pl) return s.name_pl;
      if (s.name_en) return s.name_en;
      return String(s);
    }).filter(Boolean);

    console.log('🔍 Provider services:', providerServiceNames);
    console.log('🔍 Total orders before filtering:', orders.length);

    // Filtruj zlecenia - dopasuj po nazwie usługi
    const filtered = orders.filter(order => {
      const orderService = (order.service || '').toLowerCase().trim();
      
      // Sprawdź czy nazwa usługi zlecenia pasuje do którejkolwiek usługi providera
      const matches = providerServiceNames.some(serviceName => {
        const serviceNameLower = (serviceName || '').toLowerCase().trim();
        // Dopasowanie: sprawdź czy nazwa usługi zawiera się w nazwie zlecenia lub odwrotnie
        return serviceNameLower.includes(orderService) || 
               orderService.includes(serviceNameLower) ||
               // Dodatkowe dopasowanie po kodzie usługi (jeśli dostępny)
               (order.serviceCode && serviceNameLower.includes(order.serviceCode.toLowerCase()));
      });
      
      if (!matches) {
        console.log(`❌ Order "${order.service}" nie pasuje do usług providera`);
      }
      return matches;
    });

    console.log('🔍 Filtered orders:', filtered.length);
    return filtered;
  }, [orders, user?.services, showAllServices]);

  // Funkcja do składania propozycji
  const submitProposal = async (orderId, amount, message) => {
    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId,
          amount: parseFloat(amount),
          message: message || ''
        })
      });

      if (!response.ok) {
        throw new Error('Błąd składania propozycji');
      }

      alert('✅ Propozycja została wysłana!');
      // Odśwież listę zleceń
      window.location.reload();
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert('❌ Nie udało się wysłać propozycji');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie zleceń...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dostępne zlecenia</h1>
              <p className="text-gray-600">
                {filteredOrders.length} zleceń w zasięgu {maxDistance} km
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Lejek providera: pierwsza oferta + aktywny upsell do PRO */}
        {user?.role === 'provider' && (
          <div className="mb-4 space-y-3">
            {((user.monthlyOffersUsed ?? 0) === 0) && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                <div className="font-semibold text-indigo-900">Wyślij swoją pierwszą ofertę</div>
                <p className="text-sm text-indigo-900/80">
                  Zacznij zdobywać zlecenia – wybierz ogłoszenie z listy i kliknij „Złóż propozycję”.
                  Twoja pierwsza oferta pomoże nam lepiej dopasowywać kolejne zlecenia do Twoich usług.
                </p>
              </div>
            )}

            {((user.monthlyOffersUsed ?? 0) >= 5) && (user.providerTier !== 'pro') && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="font-semibold text-amber-900">Widzimy, że aktywnie wysyłasz oferty</div>
                <p className="text-sm text-amber-900/80">
                  W tym miesiącu wysłałeś już {user.monthlyOffersUsed} ofert. W pakiecie <b>Helpfli PRO</b> masz
                  nielimitowane odpowiedzi, priorytet w wynikach i Gwarancję Helpfli+ przy płatnościach w systemie.
                </p>
                <div className="mt-2">
                  <Link
                    to="/subscriptions"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700"
                  >
                    Zobacz pakiet PRO dla wykonawców
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filtry */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
              
              {/* Usługi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moje usługi
                </label>
                <ServiceSelector
                  value={selectedServices}
                  onChange={setSelectedServices}
                  placeholder="Wybierz usługi"
                />
              </div>

              {/* Zasięg */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maks. dystans (km): {maxDistance}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Geolokalizacja */}
              {userLocation && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <span>📍</span>
                    <span className="text-sm">
                      Lokalizacja: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}

              {locationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <span>❌</span>
                    <span className="text-sm">{locationError}</span>
                  </div>
                  <button
                    onClick={getUserLocation}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                  >
                    Spróbuj ponownie
                  </button>
                </div>
              )}

              {/* Toggle wszystkie usługi */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showAllServices"
                  checked={showAllServices}
                  onChange={(e) => setShowAllServices(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="showAllServices" className="text-sm text-gray-700">
                  Pokaż wszystkie zlecenia
                </label>
              </div>
            </div>
          </div>

          {/* Lista zleceń */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Brak dostępnych zleceń</h3>
                <p className="text-gray-600 mb-4">
                  {orders.length === 0 
                    ? "Nie ma obecnie żadnych otwartych zleceń w Twojej okolicy."
                    : `Znaleziono ${orders.length} zleceń, ale żadne nie pasuje do Twoich usług.`
                  }
                </p>
                {orders.length > 0 && !showAllServices && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowAllServices(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Pokaż wszystkie zlecenia
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <OrderCard 
                    key={order._id} 
                    order={order} 
                    onSubmitProposal={submitProposal}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponent karty zlecenia
function OrderCard({ order, onSubmitProposal }) {
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalAmount, setProposalAmount] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');

  const handleSubmitProposal = (e) => {
    e.preventDefault();
    if (!proposalAmount || parseFloat(proposalAmount) <= 0) {
      alert('Podaj prawidłową kwotę');
      return;
    }
    
    onSubmitProposal(order._id, proposalAmount, proposalMessage);
    setShowProposalForm(false);
    setProposalAmount('');
    setProposalMessage('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {order.service}
          </h3>
          {order.serviceDetails && (
            <div className="text-base text-indigo-700 font-medium mb-2">
              {order.serviceDetails}
            </div>
          )}
          {order.description && (
            <div className="text-sm text-gray-700 mb-2">
              {order.description}
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <span>📍 {order.location}</span>
            {order.distanceKm && (
              <span>📏 {order.distanceKm.toFixed(1)} km</span>
            )}
            <span>⏰ {new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          
          {/* Status wygaśnięcia */}
          {order.expiresAt && (
            <div className={`text-sm font-medium mb-3 px-3 py-2 rounded-lg ${
              order.isExpired 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : order.hoursUntilExpiry !== null && order.hoursUntilExpiry < 6
                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {order.isExpired ? (
                <span>⏱️ Zlecenie wygasło {order.extendedCount > 0 ? `(wydłużane ${order.extendedCount}x)` : ''}</span>
              ) : order.hoursUntilExpiry !== null ? (
                <span>
                  ⏱️ Aktywne przez jeszcze {
                    order.hoursUntilExpiry > 0 
                      ? `${order.hoursUntilExpiry}h ${order.minutesUntilExpiry > 0 ? order.minutesUntilExpiry + 'm' : ''}`
                      : `${order.minutesUntilExpiry}m`
                  }
                  {order.extendedCount > 0 && ` • Wydłużone ${order.extendedCount}x`}
                  {order.autoExtended && ' (automatycznie)'}
                </span>
              ) : (
                <span>⏱️ Zlecenie aktywne</span>
              )}
            </div>
          )}
          
          {order.budget && (
            <div className="text-sm text-gray-600 mb-3">
              💰 Budżet: {order.budget} zł
            </div>
          )}
          {order.urgency && (
            <div className="text-sm text-gray-600 mb-3">
              🚨 Pilność: {
                order.urgency === 'now' ? 'Teraz' :
                order.urgency === 'today' ? 'Dziś' :
                order.urgency === 'tomorrow' ? 'Jutro' :
                order.urgency === 'this_week' ? 'Ten tydzień' :
                'Elastyczne'
              }
            </div>
          )}
        </div>
        <div className="ml-4 flex flex-col gap-2">
          {order.isExpired && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
              Wygasło
            </span>
          )}
          <button
            onClick={() => setShowProposalForm(!showProposalForm)}
            disabled={order.isExpired}
            className={`px-4 py-2 rounded-lg transition-colors ${
              order.isExpired
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {showProposalForm ? 'Anuluj' : 'Złóż propozycję'}
          </button>
        </div>
      </div>

      {showProposalForm && (
        <form onSubmit={handleSubmitProposal} className="border-t pt-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twoja cena (zł)
              </label>
              <input
                type="number"
                value={proposalAmount}
                onChange={(e) => setProposalAmount(e.target.value)}
                placeholder="np. 150"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wiadomość (opcjonalnie)
              </label>
              <input
                type="text"
                value={proposalMessage}
                onChange={(e) => setProposalMessage(e.target.value)}
                placeholder="np. Mogę przyjść dziś po 16:00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Wyślij propozycję
            </button>
            <button
              type="button"
              onClick={() => setShowProposalForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Anuluj
            </button>
          </div>
        </form>
      )}
    </div>
  );
}





