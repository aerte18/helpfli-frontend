import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useState, useEffect } from "react";
import AvailabilityBadge from "./AvailabilityBadge";
import { metrics } from "../utils/metrics";

const isActive = (d) => d && new Date(d) > new Date();
const baseIcon = (size = 25) =>
  L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [size, size * 1.625],
    iconAnchor: [size / 2, size * 1.625],
    popupAnchor: [0, -size / 2],
  });

function iconForProvider(p) {
  const boosted =
    isActive(p?.promo?.topBadgeUntil) ||
    isActive(p?.promo?.aiTopTagUntil) ||
    isActive(p?.promo?.pinBoostUntil) ||
    isActive(p?.promo?.highlightUntil);
  return baseIcon(boosted ? 38 : 25);
}

function providerIcon(p) {
  const verified = p.verification?.status === "verified" || (Array.isArray(p.badges) && p.badges.includes("verified"));
  const isPro = p.level === "pro";
  const isBoosted = isActive(p?.promo?.topBadgeUntil) || isActive(p?.promo?.aiTopTagUntil) || isActive(p?.promo?.pinBoostUntil) || isActive(p?.promo?.highlightUntil);

  // Nowoczesne gradienty 3D dla różnych typów wykonawców
  let gradient = "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)"; // niebieski gradient
  let shadowColor = "rgba(59, 130, 246, 0.4)";
  let size = 48;

  if (isPro) {
    gradient = "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"; // złoty gradient
    shadowColor = "rgba(245, 158, 11, 0.4)";
    size = 52;
  }

  if (verified) {
    gradient = "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)"; // zielony gradient
    shadowColor = "rgba(16, 185, 129, 0.4)";
    size = 52;
  }

  if (isBoosted) {
    gradient = "linear-gradient(135deg, #ec4899 0%, #be185d 50%, #9d174d 100%)"; // różowy gradient
    shadowColor = "rgba(236, 72, 153, 0.4)";
    size = 56;
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
        ${p.name?.charAt(0)?.toUpperCase() || '👷'}
      </div>
      ${verified ? `<div style="
        position: absolute; bottom: -4px; right: -4px;
        width: 20px; height: 20px; border-radius: 50%;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white; font-size: 11px;
        display: flex; align-items: center; justify-content: center;
        border: 2px solid white; font-weight: bold;
        box-shadow: 0 3px 8px rgba(16, 185, 129, 0.4);
        transform: rotate(45deg);
      ">✓</div>` : ""}
      ${isPro ? `<div style="
        position: absolute; top: -4px; right: -4px;
        width: 18px; height: 18px; border-radius: 50%;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white; font-size: 10px;
        display: flex; align-items: center; justify-content: center;
        border: 2px solid white; font-weight: bold;
        box-shadow: 0 3px 8px rgba(245, 158, 11, 0.4);
        transform: rotate(45deg);
      ">P</div>` : ""}
      ${isBoosted ? `<div style="
        position: absolute; top: -6px; left: -6px;
        width: 22px; height: 22px; border-radius: 50%;
        background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
        color: white; font-size: 12px;
        display: flex; align-items: center; justify-content: center;
        border: 2px solid white; font-weight: bold;
        box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);
        transform: rotate(45deg);
        animation: pulse 2s infinite;
      ">⭐</div>` : ""}
    </div>
    <style>
      @keyframes pulse {
        0% { transform: rotate(45deg) scale(1); }
        50% { transform: rotate(45deg) scale(1.1); }
        100% { transform: rotate(45deg) scale(1); }
      }
    </style>
  `;
  return L.divIcon({
    html,
    className: "provider-pin",
    iconSize: [size, size],
    iconAnchor: [size/2, size]
  });
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FullscreenButton({ onFullscreenToggle }) {
  const map = useMap();
  const [fs, setFs] = useState(false);

  return (
    <button
      onClick={() => {
        setFs((v) => !v);
        onFullscreenToggle?.(!fs ? "full" : "lg");
        setTimeout(() => map.invalidateSize(), 150);
      }}
      className="absolute right-3 top-3 z-[999] bg-white/90 border border-slate-200 px-2 py-1 rounded-lg text-xs shadow"
    >
      {fs ? "Zamknij" : "Pełny ekran"}
    </button>
  );
}

export default function MapViewEnhanced({
  providers = [],
  center = [52.2297, 21.0122],
  zoom = 12,
  height = "h-64 sm:h-72 md:h-80 lg:h-[360px]",
  onFullscreenToggle,
  onSelect,
  onQuickView,
  onCompare,
}) {
  console.log("MapViewEnhanced - providers:", providers);
  console.log("MapViewEnhanced - providers count:", providers.length);
  console.log("MapViewEnhanced - providers with coords:", providers.filter(p => p.lat && p.lng).length);
  console.log("MapViewEnhanced - first provider coords:", providers[0] ? { lat: providers[0].lat, lng: providers[0].lng } : "none");
  
  // Track map opens when providers are loaded
  useEffect(() => {
    if (providers.length > 0) {
      providers.forEach(p => {
        metrics.hit(p._id || p.id, "mapOpens");
      });
    }
  }, [providers]);

  return (
    <div
      className={`relative z-0 isolate overflow-hidden ${height === "h-full" ? "h-full w-full" : ""}`}
    >
      <style>
        {`
          /* Cała mapa w jednym kontekście warstwy — panele Leaflet (domyślnie z-index ~1000)
             nie mogą wychodzić nad pasek wyników (z-40), navbar (z-50) ani drawery (wyżej). */
          .map-view-enhanced.leaflet-container {
            position: relative !important;
            z-index: 0 !important;
          }
          .custom-popup .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            border: 1px solid rgba(0,0,0,0.1);
          }
          .custom-popup .leaflet-popup-content {
            margin: 0;
            padding: 0;
          }
          .custom-popup .leaflet-popup-tip {
            background: white;
            border: 1px solid rgba(0,0,0,0.1);
          }
          .map-view-enhanced .leaflet-control-zoom {
            margin-top: 80px !important;
          }
        `}
      </style>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        className={`map-view-enhanced ${height} w-full ${height === 'h-full' ? '' : 'rounded-xl'} ${height === 'h-full' ? 'border-0' : 'border border-slate-200'}`}
        style={height === 'h-full' ? { height: '100%', width: '100%', borderRadius: 0 } : {}}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Usunięto MarkerClusterGroup - pinezki widoczne od razu */}
        {providers.map((p) => {
          console.log("Rendering marker for:", p.name, "at:", p.lat, p.lng);
          return (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={providerIcon(p)}>
              <Popup className="custom-popup">
                <div className="min-w-[260px] max-w-[300px]">
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white">
                    {/* Header z gradientem */}
                    <div className={`p-3 flex items-center gap-2 ${
                      p.level === "pro" 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600' 
                        : (p.verification?.status === "verified" || (Array.isArray(p.badges) && p.badges.includes("verified")))
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                          : 'bg-gradient-to-r from-indigo-600 to-indigo-700'
                    }`}>
                      <img
                        src={p.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(p.name)}&backgroundColor=4F46E5`}
                        alt={p.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-white truncate">{p.name}</div>
                        <div className="text-xs text-white/90 truncate">{p.service || 'Usługodawca'}</div>
                      </div>
                      {(p.verification?.status === "verified" || (Array.isArray(p.badges) && p.badges.includes("verified"))) && (
                        <div className="bg-white rounded-full p-1 shadow-md">
                          <span className="text-emerald-600 text-xs font-bold">✓</span>
                        </div>
                      )}
                      {p.level === "pro" && (
                        <div className="bg-white rounded-full px-1.5 py-0.5 shadow-md">
                          <span className="text-orange-600 text-xs font-bold">TOP</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Treść */}
                    <div className="p-3 space-y-2">
                      {/* Badges */}
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(p.badges) && p.badges.includes("top_ai") && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                            ✨ TOP AI
                          </span>
                        )}
                        {isActive(p?.promo?.topBadgeUntil) && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200">
                            ⭐ TOP
                          </span>
                        )}
                      </div>
                      
                      {/* Stats w jednej linii */}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <span>⭐</span>
                          <span className="font-medium">{p.rating?.toFixed(1) || '4.5'}</span>
                        </span>
                        {p.distanceKm != null && Number.isFinite(p.distanceKm) && (
                          <span className="flex items-center gap-1">
                            <span>📍</span>
                            <span>{Number(p.distanceKm).toFixed(1)} km</span>
                          </span>
                        )}
                        {(p.priceFrom || p.priceTo) && (
                          <span className="flex items-center gap-1">
                            <span>💰</span>
                            <span>{p.priceFrom || '?'}–{p.priceTo || '?'} zł</span>
                          </span>
                        )}
                      </div>
                      
                      {/* Bio */}
                      {p.bio && (
                        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                          {p.bio}
                        </p>
                      )}
                      
                      {/* Przyciski */}
                      <div className="pt-2 space-y-1.5">
                        <button
                          onClick={() => onSelect?.(p)}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-semibold shadow-sm"
                        >
                          Wybierz wykonawcę
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onQuickView?.(p)}
                            className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Podgląd
                          </button>
                          <button
                            onClick={() => onCompare?.(p)}
                            className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Porównaj
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
          </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
