import { apiUrl } from "@/lib/apiUrl";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "";

function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function AutosuggestInput({
  placeholder = "Czego potrzebujesz?",
  className = "",
  onSelectTerm,    // (term:string) => void
  onSelectService, // (slug:string) => void
  onQueryChange,   // (query:string) => void - callback gdy query się zmienia
  defaultValue = ""
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState(defaultValue);
  const qDeb = useDebounced(q, 250);

  // Wywołaj onQueryChange gdy query się zmienia
  useEffect(() => {
    if (onQueryChange) {
      onQueryChange(q);
    }
  }, [q, onQueryChange]);
  const [open, setOpen] = useState(false);
  const [suggest, setSuggest] = useState({ terms: [], services: [], subcategories: [] });
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!qDeb || qDeb.trim().length < 2) {
      setSuggest({ terms: [], services: [], subcategories: [] });
      setOpen(false);
      return;
    }
    
    const season = (() => {
      const m = new Date().getMonth() + 1;
      if ([12,1,2].includes(m)) return "winter";
      if ([3,4,5].includes(m)) return "spring";
      if ([6,7,8].includes(m)) return "summer";
      return "autumn";
    })();
    
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(apiUrl(`/api/services/suggest?q=${encodeURIComponent(qDeb)}&seasonal=${season}&limit=8`));
        const j = await r.json();
        setSuggest(j);
        setOpen(true);
      } catch (error) {
        console.error('Autosuggest error:', error);
        setSuggest({ terms: [], services: [], subcategories: [] });
      } finally {
        setLoading(false);
      }
    })();
  }, [qDeb]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const selectTerm = (term) => {
    setOpen(false);
    if (onSelectTerm) onSelectTerm(term);
    else navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const selectService = (serviceData) => {
    setOpen(false);
    // Przekaż parent_slug (kategorię) zamiast slug (usługi)
    const categorySlug = serviceData.parent || serviceData.slug;
    if (onSelectService) onSelectService(categorySlug);
    else navigate(`/search?service=${encodeURIComponent(categorySlug)}`);
  };

  const selectSubcategory = (subcategory) => {
    setOpen(false);
    if (onSelectTerm) onSelectTerm(subcategory.name);
    else navigate(`/home?search=${encodeURIComponent(subcategory.name)}`);
  };

  const hasResults = suggest.terms.length > 0 || suggest.services.length > 0 || suggest.subcategories.length > 0;

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          className="w-full h-12 px-4 pr-10 rounded-lg border border-[#E1E5F0] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg placeholder:text-gray-400 hover:border-[#5A7CFF] transition-colors"
          placeholder={placeholder}
          value={q}
          onChange={(e)=> setQ(e.target.value)}
          onFocus={()=> setOpen(hasResults)}
          onKeyDown={(e)=> {
            if (e.key === 'Enter' && q.trim()) selectTerm(q.trim());
          }}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          </div>
        )}
        {!loading && q && (
          <button
            onClick={() => setQ('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      
      {open && hasResults && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggest.subcategories.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wide bg-gray-50 border-b">
                Podkategorie
              </div>
              <ul className="max-h-48 overflow-y-auto">
                {suggest.subcategories.map((subcat, i) => (
                  <li key={`subcat-${subcat.id}-${i}`}>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      onClick={()=> selectSubcategory(subcat)}
                    >
                      <div className="font-medium text-gray-900">{subcat.name}</div>
                      <div className="text-xs text-gray-500">{subcat.categoryName}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggest.terms.length > 0 && (
            <div className={suggest.subcategories.length > 0 ? "border-t border-gray-200" : ""}>
              <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wide bg-gray-50 border-b">
                Podpowiedzi
              </div>
              <ul className="max-h-48 overflow-y-auto">
                {suggest.terms.map((t, i) => (
                  <li key={`t-${i}`}>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      onClick={()=> selectTerm(t.term)}
                    >
                      <div className="font-medium text-gray-900">{t.term}</div>
                      <div className="text-xs text-gray-500">Wyszukaj "{t.term}"</div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggest.services.length > 0 && (
            <div className={(suggest.subcategories.length > 0 || suggest.terms.length > 0) ? "border-t border-gray-200" : ""}>
              <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wide bg-gray-50 border-b">
                Pasujące usługi
              </div>
              <ul className="max-h-48 overflow-y-auto">
                {suggest.services.map((s, i) => (
                  <li key={`s-${s.slug}-${i}`}>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      onClick={()=> selectService(s)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{s.name}</div>
                          <div className="text-xs text-gray-500">{s.parent}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            s.kind === 'remote' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {s.kind === 'remote' ? 'online' : 'dojazd'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
