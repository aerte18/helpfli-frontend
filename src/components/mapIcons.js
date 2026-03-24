// src/components/mapIcons.js
import L from 'leaflet';

// helper: generuj kolor z nazwy (fallback, gdy brak w mapie)
function colorFromString(str = "Inne") {
  const hash = [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
  const hue = hash % 360;
  return `hsl(${hue} 80% 50%)`;
}

function svg(color='#35A1FF') {
  return encodeURI(`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.8 12.3 24.7 13.02 25.55a1.3 1.3 0 0 0 1.96 0C15.7 38.7 28 23.8 28 14 28 6.27 21.73 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>
  `);
}

// >>> NOWE: ikona wg rodzaju (service)
export function iconForService(service = "Inne") {
  const palette = {
    "Hydraulik":   "#0EA5E9", // niebieski
    "Elektryk":    "#F59E0B", // pomarańcz
    "Złota rączka":"#10B981", // miętowy
    "Sprzątanie":  "#6366F1", // fiolet
    "Opieka IT":   "#14B8A6", // teal
  };
  const color = palette[service] || colorFromString(service);
  const url = 'data:image/svg+xml;charset=UTF-8,' + svg(color);
  return L.icon({
    iconUrl: url,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36]
  });
}

// >>> NOWE: ikona wg poziomu (level)
export function iconForLevel(level = 'standard') {
  const colors = {
    basic: '#00C897',      // zielony
    standard: '#35A1FF',   // niebieski
    pro: '#FF7A00'         // pomarańczowy
  };
  const color = colors[level] || colors.standard;
  const url = 'data:image/svg+xml;charset=UTF-8,' + svg(color);
  return L.icon({
    iconUrl: url,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
    shadowUrl: undefined
  });
}