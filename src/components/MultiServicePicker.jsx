import { useEffect, useMemo, useRef, useState } from "react";
import useServices from "../hooks/useServices";

export default function MultiServicePicker({
  values = [],          // array of service ids
  onChange,             // (ids[]) => void
  placeholder = "Wybierz usługę…",
  className = "",
  maxShow = 3,
}) {
  const { services, loading } = useServices();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const selected = useMemo(
    () => services.filter(s => values.includes(s._id || s.id)),
    [services, values]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services.slice(0, 20);
    return services.filter(s => (s.name_pl || s.name_en || s.name || "").toLowerCase().includes(q)).slice(0, 20);
  }, [services, query]);

  useEffect(() => {
    const onClick = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const add = (id) => {
    if (!values.includes(id)) onChange?.([...values, id]);
    setQuery("");
    setOpen(false);
  };
  const remove = (id) => onChange?.(values.filter(v => v !== id));
  const clear = () => onChange?.([]);

  return (
    <div className={`relative ${className}`} ref={boxRef}>
      <div className="flex min-h-[42px] flex-wrap items-center gap-2 rounded-xl border border-gray-300 px-3 py-2">
        {selected.slice(0, maxShow).map(s => (
          <span key={s._id || s.id} className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs">
            {s.name_pl || s.name_en || s.name}
            <button onClick={() => remove(s._id || s.id)} className="opacity-70 hover:opacity-100">✕</button>
          </span>
        ))}
        {selected.length > maxShow && (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">+{selected.length - maxShow}</span>
        )}
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="flex-1 min-w-[140px] outline-none text-sm"
          placeholder={loading ? "Ładowanie…" : placeholder}
        />
        {values.length > 0 && (
          <button onClick={clear} className="text-xs text-gray-600 hover:underline">Wyczyść</button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {filtered.map(s => {
            const id = s._id || s.id;
            const selected = values.includes(id);
            return (
              <button
                key={id}
                onClick={() => add(id)}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${selected ? "opacity-50" : ""}`}
                disabled={selected}
              >
                {s.name_pl || s.name_en || s.name}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">Brak wyników</div>
          )}
        </div>
      )}
    </div>
  );
}