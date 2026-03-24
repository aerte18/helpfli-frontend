import { useEffect, useRef, useState } from 'react';

export default function GeoSuggest({ value, onPick, placeholder = 'Miasto, dzielnica', proxyApi = true }) {
  const API = import.meta.env.VITE_API_URL || '';
  const [q, setQ] = useState(value || '');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const tRef = useRef();

  useEffect(() => { setQ(value || ''); }, [value]);

  useEffect(() => {
    if (!q || q.length < 3) { setItems([]); return; }
    const t = setTimeout(async () => {
      try {
        if (proxyApi) {
          const res = await fetch(`${API}/api/ai/geo/search?q=${encodeURIComponent(q)}&limit=5`);
          const data = await res.json();
          setItems(data.items || []);
        } else {
          const url = new URL('https://nominatim.openstreetmap.org/search');
          url.searchParams.set('q', q); url.searchParams.set('format','json');
          url.searchParams.set('addressdetails','1'); url.searchParams.set('limit','5');
          const res = await fetch(url, { headers: { 'User-Agent':'Helpfli/1.0' } });
          const data = await res.json();
          setItems((data||[]).map(x => ({ label: x.display_name, lat: parseFloat(x.lat), lon: parseFloat(x.lon) })));
        }
        setOpen(true);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const pick = (it) => {
    onPick?.(it);
    setQ(it.label);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        className="w-full border rounded p-2"
        placeholder={placeholder}
        value={q}
        onChange={e=>setQ(e.target.value)}
        onFocus={()=>setOpen(items.length>0)}
      />
      {open && items.length > 0 && (
        <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-64 overflow-auto shadow">
          {items.map((it, idx) => (
            <div
              key={idx}
              onClick={()=>pick(it)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {it.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



















