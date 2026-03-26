import { apiUrl } from "@/lib/apiUrl";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function AdminSponsorAds() {
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, active, rejected
  const [selectedAd, setSelectedAd] = useState(null);

  useEffect(() => {
    loadAds();
  }, [filter]);

  const loadAds = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = new URL(apiUrl("/api/sponsor-ads"));
      if (filter !== "all") {
        url.searchParams.append("status", filter);
      }

      const res = await fetch(url.toString(), {
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

  const handleApprove = async (adId) => {
    if (!confirm("Czy na pewno chcesz zatwierdzić tę reklamę?")) return;

    try {
      const token = localStorage.getItem("token");
      const API = import.meta.env.VITE_API_URL || "";
      const res = await fetch(apiUrl(`/api/sponsor-ads/${adId}/approve`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: "Zatwierdzona przez administratora",
        }),
      });

      if (res.ok) {
        alert("Reklama została zatwierdzona");
        loadAds();
        setSelectedAd(null);
      } else {
        const data = await res.json();
        alert(`Błąd: ${data.message || "Nie udało się zatwierdzić reklamy"}`);
      }
    } catch (error) {
      console.error("Error approving ad:", error);
      alert("Błąd zatwierdzania reklamy");
    }
  };

  const handleReject = async (adId) => {
    const reason = prompt("Podaj powód odrzucenia reklamy:");
    if (!reason) return;

    try {
      const token = localStorage.getItem("token");
      const API = import.meta.env.VITE_API_URL || "";
      const res = await fetch(apiUrl(`/api/sponsor-ads/${adId}/reject`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: reason,
        }),
      });

      if (res.ok) {
        alert("Reklama została odrzucona");
        loadAds();
        setSelectedAd(null);
      } else {
        const data = await res.json();
        alert(`Błąd: ${data.message || "Nie udało się odrzucić reklamy"}`);
      }
    } catch (error) {
      console.error("Error rejecting ad:", error);
      alert("Błąd odrzucania reklamy");
    }
  };

  const handlePause = async (adId) => {
    try {
      const token = localStorage.getItem("token");
      const API = import.meta.env.VITE_API_URL || "";
      const res = await fetch(apiUrl(`/api/sponsor-ads/${adId}`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "paused",
        }),
      });

      if (res.ok) {
        alert("Reklama została wstrzymana");
        loadAds();
        setSelectedAd(null);
      }
    } catch (error) {
      console.error("Error pausing ad:", error);
      alert("Błąd wstrzymywania reklamy");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      active: "bg-green-100 text-green-800",
      paused: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
    };
    const labels = {
      pending: "Oczekuje",
      active: "Aktywna",
      paused: "Wstrzymana",
      rejected: "Odrzucona",
      expired: "Wygasła",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          badges[status] || badges.pending
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie reklam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Moderacja reklam sponsorowanych
          </h1>
          <p className="text-gray-600 mt-1">
            Zarządzaj reklamami kontekstowymi od firm zewnętrznych
          </p>
        </div>
      </div>

      {/* Filtry */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Wszystkie ({ads.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "pending"
              ? "bg-yellow-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Oczekujące (
          {ads.filter((a) => a.status === "pending").length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "active"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Aktywne ({ads.filter((a) => a.status === "active").length})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "rejected"
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Odrzucone ({ads.filter((a) => a.status === "rejected").length})
        </button>
      </div>

      {/* Lista reklam */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {ads.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">Brak reklam do wyświetlenia</p>
            <p className="text-sm mt-2">
              {filter === "pending"
                ? "Nie ma reklam oczekujących na akceptację"
                : "Nie znaleziono reklam dla wybranego filtra"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {ads.map((ad) => (
              <div
                key={ad._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {ad.title}
                      </h3>
                      {getStatusBadge(ad.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {ad.description}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Firma:</span>
                        <p className="font-medium">{ad.advertiser?.companyName}</p>
                        <p className="text-xs text-gray-500">
                          {ad.advertiser?.email}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Typ:</span>
                        <p className="font-medium">{ad.adType}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Budżet:</span>
                        <p className="font-medium">
                          {(ad.campaign?.budget / 100).toFixed(2)} zł
                        </p>
                        <p className="text-xs text-gray-500">
                          Wydane:{" "}
                          {((ad.campaign?.spent || 0) / 100).toFixed(2)} zł
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Statystyki:</span>
                        <p className="font-medium">
                          {ad.stats?.impressions || 0} wyświetleń
                        </p>
                        <p className="text-xs text-gray-500">
                          {ad.stats?.clicks || 0} kliknięć (
                          {ad.stats?.ctr
                            ? ad.stats.ctr.toFixed(2)
                            : "0.00"}
                          % CTR)
                        </p>
                      </div>
                    </div>
                    {ad.moderation?.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-900">
                          Powód odrzucenia:
                        </p>
                        <p className="text-sm text-red-700">
                          {ad.moderation.rejectionReason}
                        </p>
                      </div>
                    )}
                    {ad.moderation?.reviewedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Przejrzane:{" "}
                        {new Date(ad.moderation.reviewedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {ad.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(ad._id)}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                          ✓ Zatwierdź
                        </button>
                        <button
                          onClick={() => handleReject(ad._id)}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                        >
                          ✗ Odrzuć
                        </button>
                      </>
                    )}
                    {ad.status === "active" && (
                      <button
                        onClick={() => handlePause(ad._id)}
                        className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors whitespace-nowrap"
                      >
                        ⏸ Wstrzymaj
                      </button>
                    )}
                    {ad.status === "paused" && (
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem("token");
                            const API = import.meta.env.VITE_API_URL || "";
                            await fetch(apiUrl(`/api/sponsor-ads/${ad._id}`), {
                              method: "PUT",
                              headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({ status: "active" }),
                            });
                            alert("Reklama została wznowiona");
                            loadAds();
                          } catch (error) {
                            alert("Błąd wznowienia reklamy");
                          }
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                      >
                        ▶ Wznów
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedAd(selectedAd === ad._id ? null : ad._id)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                    >
                      {selectedAd === ad._id ? "Ukryj" : "Szczegóły"}
                    </button>
                  </div>
                </div>
                {selectedAd === ad._id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold mb-2">Szczegóły reklamy</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Link:</span>
                        <a
                          href={ad.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:underline"
                        >
                          {ad.link}
                        </a>
                      </div>
                      <div>
                        <span className="text-gray-500">CTA:</span>
                        <p className="font-medium">{ad.ctaText}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Słowa kluczowe:</span>
                        <p className="font-medium">
                          {ad.keywords?.join(", ") || "Brak"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Kategorie usług:</span>
                        <p className="font-medium">
                          {ad.serviceCategories?.join(", ") || "Brak"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Okres kampanii:</span>
                        <p className="font-medium">
                          {new Date(ad.campaign?.startDate).toLocaleDateString()} -{" "}
                          {new Date(ad.campaign?.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Model płatności:</span>
                        <p className="font-medium">
                          {ad.campaign?.pricingModel?.toUpperCase() || "CPC"}
                        </p>
                      </div>
                    </div>
                    {ad.imageUrl && (
                      <div className="mt-4">
                        <span className="text-gray-500 text-sm">Obraz:</span>
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="mt-2 max-w-xs rounded-lg"
                        />
                      </div>
                    )}
                    {ad.logoUrl && (
                      <div className="mt-4">
                        <span className="text-gray-500 text-sm">Logo:</span>
                        <img
                          src={ad.logoUrl}
                          alt="Logo"
                          className="mt-2 w-24 h-24 object-contain rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}






