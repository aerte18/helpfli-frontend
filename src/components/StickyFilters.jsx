import { useEffect, useState } from "react";
import { Funnel, Filter, BadgeCheck, Clock, Wallet } from "lucide-react";

export default function StickyFilters({ filters: externalFilters, onChange, verifiedOnly, onVerifiedOnlyChange, onClearSearch }) {
  const [filters, setFilters] = useState({
    level: "any",       // basic|standard|pro|any
    minRating: 0,       // 0..5
    available: "any",   // now|today|tomorrow|offline|any
    b2b: false,
    budgetMin: "",
    budgetMax: "",
    query: "",
  });

  // Synchronizuj z zewnętrznymi filtrami
  useEffect(() => {
    if (externalFilters?.search) {
      setFilters(prev => ({ ...prev, query: externalFilters.search }));
    }
  }, [externalFilters?.search]);

  // Usunięto problematyczny useEffect który powodował nieskończoną pętlę
  // onChange jest wywoływane tylko gdy użytkownik aktywnie zmienia filtry

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  const LevelBtn = ({ v, label }) => (
    <button
      onClick={() => set("level", filters.level === v ? "any" : v)}
      className={`px-3 py-1 rounded-full border text-sm transition
      ${filters.level === v ? "bg-blue-600 text-white border-blue-600 shadow" : "bg-white hover:bg-slate-50 border-slate-200"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="sticky top-0 lg:top-[48px] z-40 backdrop-blur bg-white/80 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Funnel className="w-4 h-4" />
          <span className="font-medium">Filtry</span>
          {filters.query && (
            <div className="ml-4 flex items-center gap-2">
              <span className="text-sm text-gray-500">Aktywny filtr:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                {filters.query}
              </span>
              <button
                onClick={() => {
                  set("query", "");
                  onClearSearch?.();
                }}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Usuń
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="relative min-w-[280px]">
            <input
              value={filters.query}
              onChange={(e) => {
                // Nie modyfikuj lokalnego stanu - tylko wywołaj onChange
                onChange?.({ ...externalFilters, search: e.target.value });
              }}
              placeholder={"W czym potrzebujesz pomocy?"}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {filters.query && (
              <button
                onClick={() => {
                  set("query", "");
                  onClearSearch?.();
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Wyczyść wyszukiwanie"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <LevelBtn v="basic" label="Basic" />
            <LevelBtn v="standard" label="Standard" />
            <LevelBtn v="pro" label="TOP" />
          </div>

          <label className="inline-flex items-center gap-2 text-sm flex-shrink-0">
            <BadgeCheck className="w-4 h-4" />
            <input
              type="checkbox"
              checked={filters.b2b}
              onChange={(e) => set("b2b", e.target.checked)}
              className="accent-blue-600"
            />
            Firma
          </label>

          <label className="inline-flex items-center gap-2 text-sm flex-shrink-0">
            <BadgeCheck className="w-4 h-4 text-emerald-600" />
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => onVerifiedOnlyChange?.(e.target.checked)}
              className="accent-emerald-600"
            />
            Tylko Verified
          </label>

          <div className="flex items-center gap-2 text-sm flex-shrink-0">
            <Clock className="w-4 h-4" />
            <select
              value={filters.available}
              onChange={(e) => set("available", e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200"
            >
              <option value="any">Dostępność</option>
              <option value="now">Teraz</option>
              <option value="today">Dziś</option>
              <option value="tomorrow">Jutro</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm flex-shrink-0">
            <Wallet className="w-4 h-4" />
            <input
              type="number"
              inputMode="numeric"
              placeholder="min"
              value={filters.budgetMin}
              onChange={(e) => set("budgetMin", e.target.value)}
              className="w-16 px-2 py-1 rounded-lg border border-slate-200"
            />
            <span>–</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="max"
              value={filters.budgetMax}
              onChange={(e) => set("budgetMax", e.target.value)}
              className="w-16 px-2 py-1 rounded-lg border border-slate-200"
            />
            <span>zł</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filters.minRating}
              onChange={(e) => set("minRating", Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-slate-200 text-sm"
            >
              <option value={0}>Ocena: dowolna</option>
              <option value={4.5}>4.5+</option>
              <option value={4.7}>4.7+</option>
              <option value={4.9}>4.9+</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}