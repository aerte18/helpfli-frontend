import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function MapSizeButtons() {
  const location = useLocation();
  const [mapSize, setMapSize] = useState(() => {
    return localStorage.getItem('mapSize') || 'lg';
  });

  // Nasłuchuj zmian z ProviderHome.jsx (jeśli są) - MUSI być przed warunkowym return
  useEffect(() => {
    const handleMapSizeChange = (e) => {
      if (e.detail?.size) {
        setMapSize(e.detail.size);
      }
    };
    window.addEventListener('mapSizeChanged', handleMapSizeChange);
    return () => window.removeEventListener('mapSizeChanged', handleMapSizeChange);
  }, []);

  // Pokaż tylko na stronie /provider-home
  if (location.pathname !== '/provider-home') {
    return null;
  }

  const mapSizes = [
    { value: 'sm', label: 'Lista', icon: '📋' },
    { value: 'lg', label: 'Mapa', icon: '🗺️' },
    { value: 'full', label: 'Podział', icon: '📊' }
  ];

  const handleMapSizeChange = (size) => {
    setMapSize(size);
    localStorage.setItem('mapSize', size);
    // Emituj custom event, żeby ProviderHome.jsx mógł go obsłużyć
    window.dispatchEvent(new CustomEvent('mapSizeChanged', { detail: { size } }));
  };

  return (
    <div className="qs-card-dark flex items-center gap-1.5 p-1.5 shadow-lg">
      {mapSizes.map((size) => {
        const isActive = mapSize === size.value;
        return (
          <button
            key={size.value}
            onClick={() => handleMapSizeChange(size.value)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
              isActive
                ? 'bg-white/20 text-white shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title={size.label}
          >
            {size.icon}
          </button>
        );
      })}
    </div>
  );
}

