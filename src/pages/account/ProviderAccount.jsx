import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getMyOffers } from "../../api/offers";

export default function ProviderAccount() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOffers() {
      try {
        const token = localStorage.getItem('token');
        if (token && user?.role === 'provider') {
          const data = await getMyOffers({ token });
          setOffers(data || []);
        }
      } catch (error) {
        console.error('Błąd pobierania ofert:', error);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadOffers();
  }, [user]);

  const getStatusBadge = (status) => {
    const badges = {
      submitted: { text: 'Oczekuje', color: 'bg-blue-50 text-blue-700' },
      accepted: { text: 'Zaakceptowana', color: 'bg-green-50 text-green-700' },
      rejected: { text: 'Odrzucona', color: 'bg-red-50 text-red-700' },
      withdrawn: { text: 'Anulowana', color: 'bg-gray-50 text-gray-700' }
    };
    return badges[status] || badges.submitted;
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-4">
        {/* Sidebar */}
        <aside className="bg-white rounded-2xl shadow">
          <div className="p-4 text-lg font-semibold">Helpfli</div>
          <nav className="px-2 pb-2">
            <SideItem active>Zapytania</SideItem>
            <SideItem>Harmonogram</SideItem>
            <SideItem>Zarobki</SideItem>
            <SideItem>Wiadomości</SideItem>
            <SideItem>Konto</SideItem>
            <SideItem>
              <Link to="/provider/promote" className="flex items-center gap-2">
                💎 Promuj profil
              </Link>
            </SideItem>
            <SideItem>
              <Link to="/provider/sponsored" className="flex items-center gap-2">
                📌 Sloty sponsorowane
              </Link>
            </SideItem>
          </nav>
        </aside>

        {/* Content */}
        <main className="space-y-4">
          {/* Top bar */}
          <div className="bg-white rounded-2xl shadow p-3 flex items-center gap-3">
            <TopTab active>Historia</TopTab>
            <TopTab>Harmonogram</TopTab>
            <TopTab>Zarobki</TopTab>
            <TopTab>Wiadomości</TopTab>
            <span className="ml-auto px-2 py-1 text-xs rounded bg-emerald-50 text-emerald-700">
              Online
            </span>
          </div>

          {/* My Offers Section */}
          <section className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Moje oferty</h2>
              <Link
                to="/provider-home"
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm hover:opacity-90"
              >
                Nowe zlecenia
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Ładowanie ofert...</div>
            ) : offers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">Nie masz jeszcze żadnych ofert</p>
                <Link
                  to="/provider-home"
                  className="text-blue-600 hover:underline"
                >
                  Przejdź do dostępnych zleceń →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {offers.map((offer) => {
                  const badge = getStatusBadge(offer.status);
                  const order = offer.orderId;
                  return (
                    <div key={offer._id} className="border rounded-xl p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar />
                        <div className="flex-1">
                          <div className="font-medium">
                            {order?.description || order?.service || 'Zlecenie'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {order?.service && `Usługa: ${order.service}`}
                            {order?.location?.city && ` • ${order.location.city}`}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-sm font-semibold text-green-600">
                              {offer.amount} zł
                            </span>
                            {offer.message && (
                              <span className="text-xs text-slate-500 truncate max-w-md">
                                {offer.message}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {new Date(offer.createdAt).toLocaleString('pl-PL')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs rounded ${badge.color}`}>
                          {badge.text}
                        </span>
                        {order?._id && (
                          <Link
                            to={`/orders/${order._id}`}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm hover:opacity-90"
                          >
                            Zobacz
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* New requests */}
          <section className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Nowe zapytania</h2>
              <Link
                to="/provider-home"
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm hover:opacity-90"
              >
                Dostępne zlecenia
              </Link>
            </div>

            <div className="space-y-3">
              <div className="text-center py-4 text-gray-500 text-sm">
                Przejdź do panelu wykonawcy, aby zobaczyć dostępne zlecenia
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SideItem({ children, active }) {
  return (
    <div
      className={`px-3 py-2 rounded-xl cursor-default mb-1 ${
        active ? "bg-slate-100 font-medium" : "hover:bg-slate-50"
      }`}
    >
      {children}
    </div>
  );
}
function TopTab({ children, active }) {
  return (
    <button
      className={`px-3 py-1.5 rounded-lg ${
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}
function Tag({ children }) {
  return <span className="px-2 py-0.5 text-xs rounded bg-slate-100">{children}</span>;
}
function Request({ title, place, time, cta }) {
  return (
    <div className="border rounded-xl p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar />
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-slate-500">{place}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-xs text-slate-500">{time}</div>
        <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm hover:opacity-90">
          {cta}
        </button>
      </div>
    </div>
  );
}
function ActiveService({ title, meta, price, tier, rightBadge }) {
  return (
    <div className="border rounded-xl p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar />
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-slate-500">{meta}</div>
          <div className="flex gap-1 mt-1">
            {tier && <Tag>{tier}</Tag>}
            {price && <Tag>{price}</Tag>}
          </div>
        </div>
      </div>
      <span className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700">{rightBadge}</span>
    </div>
  );
}
function Avatar() {
  return <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300" />;
}