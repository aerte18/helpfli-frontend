import { apiUrl } from "@/lib/apiUrl";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import SponsorAdBanner from "../components/SponsorAdBanner";

export default function SponsorAdsManager() {
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadAds();
    loadStats();
  }, []);

  const loadAds = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/sponsor-ads"), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        setAds(data.ads || []);
      }
    } catch (error) {
      console.error("Error loading ads:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("token");
      // Statystyki będą pobierane dla każdej reklamy osobno
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleDelete = async (adId) => {
    if (!confirm("Czy na pewno chcesz usunąć tę reklamę?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/sponsor-ads/${adId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setAds(ads.filter((ad) => ad._id !== adId));
        alert("Reklama została usunięta");
      } else {
        alert("Błąd usuwania reklamy");
      }
    } catch (error) {
      console.error("Error deleting ad:", error);
      alert("Błąd usuwania reklamy");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      active: "bg-green-100 text-green-800",
      paused: "bg-gray-100 text-gray-800",
      expired: "bg-red-100 text-red-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          badges[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status === "pending"
          ? "Oczekuje"
          : status === "active"
          ? "Aktywna"
          : status === "paused"
          ? "Wstrzymana"
          : status === "expired"
          ? "Wygasła"
          : status === "rejected"
          ? "Odrzucona"
          : status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie reklam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Zarządzanie reklamami
              </h1>
              <p className="mt-2 text-gray-600">
                Twórz i zarządzaj reklamami sponsorowanymi na platformie Helpfli
              </p>
            </div>
            <button
              onClick={() => {
                setEditingAd(null);
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              + Utwórz reklamę
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-6">
            <div className="text-sm text-gray-600 mb-1">Wszystkie reklamy</div>
            <div className="text-2xl font-bold text-gray-900">{ads.length}</div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="text-sm text-gray-600 mb-1">Aktywne</div>
            <div className="text-2xl font-bold text-green-600">
              {ads.filter((a) => a.status === "active").length}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="text-sm text-gray-600 mb-1">Oczekujące</div>
            <div className="text-2xl font-bold text-yellow-600">
              {ads.filter((a) => a.status === "pending").length}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="text-sm text-gray-600 mb-1">Łączne wyświetlenia</div>
            <div className="text-2xl font-bold text-indigo-600">
              {ads.reduce((sum, ad) => sum + (ad.stats?.impressions || 0), 0)}
            </div>
          </div>
        </div>

        {/* Ads List */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Twoje reklamy</h2>
          </div>
          <div className="divide-y">
            {ads.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📢</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Brak reklam
                </h3>
                <p className="text-gray-600 mb-6">
                  Utwórz swoją pierwszą reklamę, aby zwiększyć widoczność swojej firmy
                </p>
                <button
                  onClick={() => {
                    setEditingAd(null);
                    setShowCreateModal(true);
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Utwórz pierwszą reklamę
                </button>
              </div>
            ) : (
              ads.map((ad) => (
                <div key={ad._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {ad.title}
                        </h3>
                        {getStatusBadge(ad.status)}
                      </div>
                      <p className="text-gray-600 mb-3">{ad.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Typ:</span>{" "}
                          {ad.adType === "parts_store"
                            ? "Sklep z częściami"
                            : ad.adType === "equipment_rental"
                            ? "Wypożyczalnia sprzętu"
                            : ad.adType === "tool_rental"
                            ? "Wypożyczalnia narzędzi"
                            : ad.adType === "service_provider"
                            ? "Dostawca usług"
                            : ad.adType === "supplier"
                            ? "Dostawca materiałów"
                            : ad.adType}
                        </div>
                        <div>
                          <span className="font-medium">Wyświetlenia:</span>{" "}
                          {ad.stats?.impressions || 0}
                        </div>
                        <div>
                          <span className="font-medium">Kliknięcia:</span>{" "}
                          {ad.stats?.clicks || 0}
                        </div>
                        <div>
                          <span className="font-medium">CTR:</span>{" "}
                          {ad.stats?.ctr
                            ? `${ad.stats.ctr.toFixed(2)}%`
                            : "0%"}
                        </div>
                        <div>
                          <span className="font-medium">Wydane:</span>{" "}
                          {((ad.campaign?.spent || 0) / 100).toFixed(2)} zł /{" "}
                          {((ad.campaign?.budget || 0) / 100).toFixed(2)} zł
                        </div>
                        {ad.campaign?.autoRenew && (
                          <div className="flex items-center gap-1 text-green-600">
                            <span className="text-xs">🔄</span>
                            <span className="font-medium">Auto-renew</span>
                            <span className="text-xs">
                              ({ad.campaign.renewalCount || 0}x)
                            </span>
                          </div>
                        )}
                      </div>
                      {ad.status === "active" && !ad.freeTrial?.isFreeTrial && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-blue-900">
                                Automatyczne przedłużanie
                              </div>
                              <div className="text-xs text-blue-700 mt-1">
                                {ad.campaign?.autoRenew
                                  ? `Kampania zostanie automatycznie przedłużona o ${ad.campaign.renewalPeriod || 30} dni przed końcem`
                                  : "Włącz automatyczne przedłużanie kampanii"}
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ad.campaign?.autoRenew || false}
                                onChange={async (e) => {
                                  try {
                                    const token = localStorage.getItem("token");
                                    const res = await fetch(apiUrl(`/api/sponsor-ads/${ad._id}/toggle-auto-renew`),
                                      {
                                        method: "POST",
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          autoRenew: e.target.checked,
                                          renewalPeriod: ad.campaign?.renewalPeriod || 30,
                                        }),
                                      }
                                    );
                                    const data = await res.json();
                                    if (res.ok) {
                                      loadAds();
                                    } else {
                                      alert(data.message || "Błąd aktualizacji");
                                    }
                                  } catch (error) {
                                    console.error("Error toggling auto-renew:", error);
                                    alert("Błąd aktualizacji");
                                  }
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      )}
                      {ad.moderation?.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-sm font-medium text-red-900">
                            Powód odrzucenia:
                          </div>
                          <div className="text-sm text-red-700">
                            {ad.moderation.rejectionReason}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setEditingAd(ad);
                          setShowCreateModal(true);
                        }}
                        className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        Edytuj
                      </button>
                      <a
                        href={`/sponsor-ads/${ad._id}/stats`}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-center"
                      >
                        Statystyki
                      </a>
                      {ad.status === "pending" && (
                        <button
                          onClick={() => handleDelete(ad._id)}
                          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Usuń
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateAdModal
          ad={editingAd}
          onClose={() => {
            setShowCreateModal(false);
            setEditingAd(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingAd(null);
            loadAds();
          }}
        />
      )}
    </div>
  );
}

// Modal do tworzenia/edycji reklamy
function CreateAdModal({ ad, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    advertiser: ad?.advertiser || {
      companyName: "",
      email: "",
      phone: "",
      website: "",
      nip: "",
      address: {
        street: "",
        city: "",
        postalCode: "",
        country: "Polska",
      },
    },
    adType: ad?.adType || "parts_store",
    title: ad?.title || "",
    description: ad?.description || "",
    keywords: ad?.keywords?.join(", ") || "",
    serviceCategories: ad?.serviceCategories?.join(", ") || "",
    orderTypes: ad?.orderTypes?.join(", ") || "",
    link: ad?.link || "",
    ctaText: ad?.ctaText || "Sprawdź ofertę",
    campaign: ad?.campaign || {
      budget: 0,
      pricingModel: "cpc",
      pricePerClick: 300, // 3 zł w groszach
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      dailyBudget: 0,
    },
    details: ad?.details || {},
  });
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      // Dodaj pola formularza
      formDataToSend.append("advertiser", JSON.stringify(formData.advertiser));
      formDataToSend.append("adType", formData.adType);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("keywords", formData.keywords);
      formDataToSend.append("serviceCategories", formData.serviceCategories);
      formDataToSend.append("orderTypes", formData.orderTypes);
      formDataToSend.append("link", formData.link);
      formDataToSend.append("ctaText", formData.ctaText);
      formDataToSend.append("campaign", JSON.stringify(formData.campaign));
      formDataToSend.append("details", JSON.stringify(formData.details));

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }
      if (logoFile) {
        formDataToSend.append("logo", logoFile);
      }

      const url = ad
        ? apiUrl(`/api/sponsor-ads/${ad._id}`)
        : apiUrl("/api/sponsor-ads");
      const method = ad ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await res.json();

      if (res.ok) {
        alert(ad ? "Reklama została zaktualizowana" : "Reklama została utworzona");
        onSuccess();
      } else {
        alert(data.message || "Błąd zapisywania reklamy");
      }
    } catch (error) {
      console.error("Error saving ad:", error);
      alert("Błąd zapisywania reklamy");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {ad ? "Edytuj reklamę" : "Utwórz nową reklamę"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Dane firmy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Dane firmy</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa firmy *
                </label>
                <input
                  type="text"
                  required
                  value={formData.advertiser.companyName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      advertiser: {
                        ...formData.advertiser,
                        companyName: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.advertiser.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      advertiser: {
                        ...formData.advertiser,
                        email: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.advertiser.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      advertiser: {
                        ...formData.advertiser,
                        phone: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strona WWW
                </label>
                <input
                  type="url"
                  value={formData.advertiser.website}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      advertiser: {
                        ...formData.advertiser,
                        website: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIP (dla faktur)
                </label>
                <input
                  type="text"
                  value={formData.advertiser.nip}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      advertiser: {
                        ...formData.advertiser,
                        nip: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Szczegóły reklamy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Szczegóły reklamy
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ reklamy *
              </label>
              <select
                required
                value={formData.adType}
                onChange={(e) =>
                  setFormData({ ...formData, adType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="parts_store">Sklep z częściami</option>
                <option value="equipment_rental">Wypożyczalnia sprzętu</option>
                <option value="tool_rental">Wypożyczalnia narzędzi</option>
                <option value="service_provider">Dostawca usług</option>
                <option value="supplier">Dostawca materiałów</option>
                <option value="other">Inne</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tytuł reklamy *
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="np. Sklep z częściami AGD - Warszawa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opis *
              </label>
              <textarea
                required
                maxLength={500}
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Opisz swoją ofertę..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Słowa kluczowe (oddzielone przecinkami)
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) =>
                  setFormData({ ...formData, keywords: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="np. pralka, AGD, części, naprawa"
              />
              <p className="mt-1 text-xs text-gray-500">
                Reklama będzie pokazywana gdy użytkownik użyje tych słów
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorie usług (oddzielone przecinkami)
              </label>
              <input
                type="text"
                value={formData.serviceCategories}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    serviceCategories: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="np. hydraulik, elektryk, AGD"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link do oferty *
              </label>
              <input
                type="url"
                required
                value={formData.link}
                onChange={(e) =>
                  setFormData({ ...formData, link: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tekst przycisku
              </label>
              <input
                type="text"
                value={formData.ctaText}
                onChange={(e) =>
                  setFormData({ ...formData, ctaText: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Sprawdź ofertę"
              />
            </div>
          </div>

          {/* Obrazy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Obrazy</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Obraz główny
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Kampania */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Kampania</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budżet (zł) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  value={(formData.campaign.budget / 100).toFixed(0)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      campaign: {
                        ...formData.campaign,
                        budget: parseInt(e.target.value) * 100,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model płatności *
                </label>
                <select
                  required
                  value={formData.campaign.pricingModel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      campaign: {
                        ...formData.campaign,
                        pricingModel: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="cpc">CPC (Cost Per Click)</option>
                  <option value="cpm">CPM (Cost Per Mille)</option>
                  <option value="cpa">CPA (Cost Per Action)</option>
                  <option value="flat">Flat Rate (stała opłata)</option>
                </select>
              </div>
              {formData.campaign.pricingModel === "cpc" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cena za kliknięcie (zł)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={(formData.campaign.pricePerClick / 100).toFixed(2)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        campaign: {
                          ...formData.campaign,
                          pricePerClick: parseFloat(e.target.value) * 100,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data rozpoczęcia *
                </label>
                <input
                  type="date"
                  required
                  value={formData.campaign.startDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      campaign: {
                        ...formData.campaign,
                        startDate: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data zakończenia *
                </label>
                <input
                  type="date"
                  required
                  value={formData.campaign.endDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      campaign: {
                        ...formData.campaign,
                        endDate: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Zapisywanie..." : ad ? "Zaktualizuj" : "Utwórz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

