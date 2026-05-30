import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  buildProviderServiceCategories,
  getExpandedSlugsForSelection,
} from "../utils/buildProviderServiceCategories";
import {
  getServiceSelectionKey,
  isMongoObjectId,
  providerHasServiceForSub,
} from "../utils/serviceSelectionKeys";
import CollapsiblePanel from "../components/CollapsiblePanel";
import { useBreakpointMd } from "../hooks/useBreakpointMd";

function serviceCountLabel(n) {
  if (n === 1) return "1 usługa";
  if (n >= 2 && n <= 4) return `${n} usługi`;
  return `${n} usług`;
}

function ManageServices() {
  const isMdUp = useBreakpointMd();
  const [availableServices, setAvailableServices] = useState([]);
  const [userServices, setUserServices] = useState([]);
  const [servicePrices, setServicePrices] = useState({});
  const [pricesSaving, setPricesSaving] = useState(false);
  const [pricesSaved, setPricesSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mainCategories, setMainCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(new Set()); // Kategorie rozwinięte

  const token = localStorage.getItem("token");

  const normalizeSlug = (v) =>
    String(v || "").trim().toLowerCase().replace(/_/g, "-");

  const slugVariants = (raw) => {
    const base = normalizeSlug(raw);
    if (!base) return [];
    const underscored = base.replace(/-/g, "_");
    const out = new Set([base, underscored]);
    // czasem backend ma slug bez prefiksu kategorii, a UI z prefiksem
    if (base.includes("-")) {
      const noPrefix = base.split("-").slice(1).join("-");
      if (noPrefix) {
        out.add(noPrefix);
        out.add(noPrefix.replace(/-/g, "_"));
      }
    }
    return [...out];
  };

  const resolveServiceIdFromKey = async (serviceIdOrSlug) => {
    const key = String(serviceIdOrSlug || "").trim();
    if (!key) return null;
    if (isMongoObjectId(key)) return key;

    const variants = slugVariants(key);
    const byLocal = availableServices.find((s) => {
      const ss = normalizeSlug(s?.slug);
      return variants.includes(ss);
    });
    if (byLocal?._id && isMongoObjectId(byLocal._id)) return String(byLocal._id);

    // fallback: dopytaj API listowe (mniej kruche niż /api/services/:slug)
    for (const variant of variants) {
      try {
        const res = await fetch(
          apiUrl(`/api/services?slug=${encodeURIComponent(variant)}&limit=1`)
        );
        if (!res.ok) continue;
        const data = await res.json();
        const hit = Array.isArray(data?.items) ? data.items[0] : null;
        if (hit?._id && isMongoObjectId(hit._id)) return String(hit._id);
      } catch {
        // próbujemy kolejny wariant
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const limit = 1000;
        const servicesUrl = apiUrl(`/api/services?limit=${limit}`);
        const userServicesUrl = apiUrl("/api/user-services");
        const servicePricesUrl = apiUrl("/api/user-services/prices");
        const categoriesUrl = apiUrl("/api/services/categories");
        let servicesRes, userServicesRes, servicePricesRes, categoriesRes;
        try {
          [servicesRes, userServicesRes, servicePricesRes, categoriesRes] = await Promise.all([
            fetch(servicesUrl),
            fetch(userServicesUrl, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch(servicePricesUrl, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch(categoriesUrl, { cache: 'no-store' })
          ]);
        } catch (fetchError) {
          console.error('❌ ManageServices: Błąd fetch:', fetchError);
          throw fetchError;
        }

        if (!servicesRes.ok) {
          const errorText = await servicesRes.text();
          console.error('❌ ManageServices: Błąd pobierania usług:', errorText.slice(0, 500));
          throw new Error('Nie udało się pobrać usług');
        }
        if (!categoriesRes.ok) {
          console.warn('⚠️ ManageServices: /api/services/categories zwróciło', categoriesRes.status);
        }

        if (!servicesRes.ok) {
          const errorText = await servicesRes.text();
          console.error('❌ ManageServices: Błąd pobierania usług:', servicesRes.status, servicesRes.statusText, errorText);
          throw new Error(`HTTP ${servicesRes.status}: ${servicesRes.statusText}`);
        }

        let servicesData, userServData, categoriesData;
        try {
          servicesData = await servicesRes.json();
        } catch (jsonError) {
          console.error('❌ ManageServices: Błąd parsowania usług:', jsonError);
          throw jsonError;
        }
        try {
          userServData = await userServicesRes.json();
        } catch {
          userServData = [];
        }
        let pricesData = [];
        try {
          if (servicePricesRes.ok) {
            pricesData = await servicePricesRes.json();
          }
        } catch {
          pricesData = [];
        }
        try {
          categoriesData = await categoriesRes.json();
        } catch {
          categoriesData = { items: [] };
        }

        // API zwraca {items: [...], total: 50, hasMore: true}
        const services = Array.isArray(servicesData.items) ? servicesData.items : 
                        (Array.isArray(servicesData) ? servicesData : []);
        // user-services API zwraca bezpośrednio tablicę, nie obiekt
        const userServ = Array.isArray(userServData) ? userServData : (userServData.services || []);

        if (services.length === 0) {
          console.error('❌ ManageServices: Brak usług w odpowiedzi API');
        }

        setAvailableServices(services);
        setUserServices(userServ);

        const priceMap = {};
        (Array.isArray(pricesData) ? pricesData : []).forEach((row) => {
          const sid = String(row.service || row.serviceId || '');
          if (!sid) return;
          priceMap[sid] = {
            min: row.min ?? '',
            max: row.max ?? '',
          };
        });
        setServicePrices(priceMap);

        const { mainCategories: mc, subcategories: sm } = buildProviderServiceCategories(
          services,
          categoriesData
        );
        setMainCategories(mc);
        setSubcategories(sm);
        const mobileView =
          typeof window !== "undefined" &&
          !window.matchMedia("(min-width: 768px)").matches;
        setExpandedCategories(
          mobileView ? new Set() : getExpandedSlugsForSelection(sm, userServ)
        );

        if (mc.length === 0) {
          console.warn('⚠️ ManageServices: Brak kategorii - sprawdź strukturę danych usług');
        }

      } catch (err) {
        console.error("❌ ManageServices: Błąd podczas pobierania danych:", err);
        // Ustaw puste dane w przypadku błędu
        setAvailableServices([]);
        setUserServices([]);
        setMainCategories([]);
        setSubcategories({});
      } finally {
        setLoading(false);
      }
    };

    fetchData().catch(err => {
      console.error('❌ ManageServices: Nieobsłużony błąd w fetchData:', err);
      setLoading(false);
    });
  }, [token]);

  // Sprawdź czy kategoria główna jest zaznaczona (ma wszystkie podkategorie)
  const isMainCategorySelected = (categorySlug) => {
    const categorySubs = subcategories[categorySlug] || [];
    const selectable = categorySubs.filter((s) => getServiceSelectionKey(s));
    if (selectable.length === 0) return false;
    return selectable.every((sub) =>
      providerHasServiceForSub(userServices, sub)
    );
  };

  // Sprawdź czy kategoria główna jest częściowo zaznaczona
  const isMainCategoryPartial = (categorySlug) => {
    const categorySubs = subcategories[categorySlug] || [];
    const selectable = categorySubs.filter((s) => getServiceSelectionKey(s));
    if (selectable.length === 0) return false;
    const selectedCount = selectable.filter((sub) =>
      providerHasServiceForSub(userServices, sub)
    ).length;
    return selectedCount > 0 && selectedCount < selectable.length;
  };

  // Obsługa rozwijania/zwijania kategorii
  const toggleCategoryExpand = (categorySlug) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categorySlug)) {
        newSet.delete(categorySlug);
      } else {
        newSet.add(categorySlug);
      }
      return newSet;
    });
  };

  // Obsługa zaznaczania/odznaczania głównej kategorii
  const handleMainCategoryToggle = async (categorySlug) => {
    const categorySubs = subcategories[categorySlug] || [];
    const isCurrentlySelected = isMainCategorySelected(categorySlug);
    
    // Rozwiń kategorię jeśli jest zwinięta
    if (!expandedCategories.has(categorySlug)) {
      setExpandedCategories(prev => new Set(prev).add(categorySlug));
    }
    
    if (isCurrentlySelected) {
      for (const sub of categorySubs) {
        const key = getServiceSelectionKey(sub);
        if (key) await handleRemove(key);
      }
    } else {
      for (const sub of categorySubs) {
        if (providerHasServiceForSub(userServices, sub)) continue;
        const key = getServiceSelectionKey(sub);
        if (key) await handleAdd(key);
      }
    }
  };

  const handleAdd = async (serviceIdOrSlug) => {
    try {
      const serviceId = await resolveServiceIdFromKey(serviceIdOrSlug);
      const serviceParam = isMongoObjectId(serviceId)
        ? serviceId
        : String(serviceIdOrSlug || "").trim();
      if (!serviceParam) return;

      const res = await fetch(apiUrl(`/api/user-services/add/${encodeURIComponent(serviceParam)}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserServices(data.services);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Błąd dodawania usługi:", err);
      }
    } catch (err) {
      console.error("Błąd przy dodawaniu:", err);
    }
  };

  const handleRemove = async (serviceIdOrSlug) => {
    try {
      const serviceId = await resolveServiceIdFromKey(serviceIdOrSlug);
      const serviceParam = isMongoObjectId(serviceId)
        ? serviceId
        : String(serviceIdOrSlug || "").trim();
      if (!serviceParam) return;

      const res = await fetch(apiUrl(`/api/user-services/${encodeURIComponent(serviceParam)}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserServices(data.services);
        const sid = String(serviceId || serviceParam);
        setServicePrices((prev) => {
          const next = { ...prev };
          delete next[sid];
          return next;
        });
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Błąd usuwania usługi:", err);
      }
    } catch (err) {
      console.error("Błąd przy usuwaniu:", err);
    }
  };

  const handlePriceChange = (serviceId, field, value) => {
    const sid = String(serviceId);
    setServicePrices((prev) => ({
      ...prev,
      [sid]: {
        min: field === 'min' ? value : (prev[sid]?.min ?? ''),
        max: field === 'max' ? value : (prev[sid]?.max ?? ''),
      },
    }));
    setPricesSaved(false);
  };

  const handleSavePrices = async () => {
    setPricesSaving(true);
    setPricesSaved(false);
    try {
      const prices = userServices.map((service) => {
        const sid = String(service._id);
        const row = servicePrices[sid] || {};
        return {
          serviceId: sid,
          min: row.min === '' ? null : Number(row.min),
          max: row.max === '' ? null : Number(row.max),
        };
      }).filter((row) => row.min != null || row.max != null);

      const res = await fetch(apiUrl('/api/user-services/prices'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prices }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || 'Nie udało się zapisać cen');
        return;
      }
      setPricesSaved(true);
      setTimeout(() => setPricesSaved(false), 3000);
    } catch (err) {
      console.error('Błąd zapisu cen:', err);
      alert('Błąd podczas zapisywania cen');
    } finally {
      setPricesSaving(false);
    }
  };

  
  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-700">Ładowanie usług...</p>
      </div>
    );
  }

  if (mainCategories.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 font-semibold mb-2">⚠️ Brak dostępnych kategorii usług</p>
        <p className="text-yellow-700 text-sm">
          Nie znaleziono żadnych kategorii usług. Skontaktuj się z administratorem.
        </p>
      </div>
    );
  }

  return (
    <div className="md:min-h-0 bg-transparent py-0 md:py-2">
      <div className="max-w-6xl mx-auto">
        <div className="md:bg-white md:rounded-2xl md:border md:border-slate-200 md:shadow-sm md:p-8">
          {/* Header */}
          <div className="mb-4 md:mb-8">
            <h2 className="text-lg md:text-2xl font-semibold text-slate-900 mb-1 md:mb-2">
              Zarządzanie usługami
            </h2>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
              Wybierz kategorie, które oferujesz.{" "}
              <span className="font-medium">Tapnij nazwę lub strzałkę, aby rozwinąć podkategorie.</span>
            </p>
          </div>

      <div className="space-y-2 md:space-y-4">
        {mainCategories.map((category) => {
          const categorySubs = subcategories[category.slug] || [];
          const isSelected = isMainCategorySelected(category.slug);
          const isPartial = isMainCategoryPartial(category.slug);
          const isExpanded = expandedCategories.has(category.slug);
          const showSubs = isExpanded;
          const selectedInCategory = categorySubs.filter((sub) =>
            providerHasServiceForSub(userServices, sub)
          ).length;
          
          return (
            <div key={category._id} className="border border-slate-200 rounded-xl p-3 md:p-5 hover:border-slate-300 transition-colors bg-white">
              <div className="flex items-center gap-2.5 md:gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isPartial;
                  }}
                  onChange={() => handleMainCategoryToggle(category.slug)}
                  className="h-5 w-5 shrink-0 text-indigo-600 rounded border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
                />
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left"
                  onClick={() => toggleCategoryExpand(category.slug)}
                >
                  <span className="text-sm md:text-base font-semibold text-slate-900 leading-snug hover:text-indigo-600 transition-colors">
                    {category.name_pl}
                  </span>
                  {!isExpanded && selectedInCategory > 0 && (
                    <span className="mt-0.5 block text-[11px] font-medium text-indigo-600">
                      {selectedInCategory} wybrane
                    </span>
                  )}
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-[11px] md:text-xs tabular-nums text-slate-600 bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap min-w-[4.75rem] text-center">
                    {serviceCountLabel(categorySubs.length)}
                  </span>
                  {categorySubs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpand(category.slug)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                      aria-label={isExpanded ? "Zwiń" : "Rozwiń"}
                      aria-expanded={isExpanded}
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>
                  )}
                </div>
              </div>

              {categorySubs.length > 0 && showSubs && (
                <div className="mt-3 ml-7 md:ml-8 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                  {categorySubs.map((sub) => {
                    const isSubSelected = providerHasServiceForSub(userServices, sub);
                    const key = getServiceSelectionKey(sub);
                    const submitKey = isMongoObjectId(sub?._id) ? String(sub._id) : (sub?.slug ? String(sub.slug) : key);
                    return (
                      <div 
                        key={key || sub.slug || sub.name_pl} 
                        className={`flex items-center p-2 rounded-lg transition-colors ${
                          isSubSelected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSubSelected}
                          disabled={!key}
                          onChange={() => {
                            if (!key) return;
                            // Tymczasowy debug: co dokładnie wysyłamy do backendu.
                            console.log("ManageServices sub click:", {
                              label: sub?.name_pl,
                              _id: sub?._id,
                              slug: sub?.slug,
                              keyUsedForSubmit: submitKey,
                            });
                            if (isSubSelected) handleRemove(submitKey);
                            else handleAdd(submitKey);
                          }}
                          className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 cursor-pointer disabled:opacity-40"
                        />
                        <label 
                          className="ml-3 text-sm text-slate-700 cursor-pointer flex-1" 
                          onClick={() => {
                            if (!key) return;
                            console.log("ManageServices sub click:", {
                              label: sub?.name_pl,
                              _id: sub?._id,
                              slug: sub?.slug,
                              keyUsedForSubmit: submitKey,
                            });
                            if (isSubSelected) handleRemove(submitKey);
                            else handleAdd(submitKey);
                          }}
                        >
                          {sub.name_pl}
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

          {/* Widełki cenowe per usługa */}
          {isMdUp ? (
          <div className="mt-8 p-6 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Widełki cenowe</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Ustaw osobny zakres dla każdej usługi — klienci filtrują po cenie wybranej kategorii.
                  Jeśli zostawisz puste, używany jest zakres z profilu (Profil → widełki ogólne).
                </p>
              </div>
              <button
                type="button"
                onClick={handleSavePrices}
                disabled={pricesSaving || userServices.length === 0}
                className="shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                {pricesSaving ? 'Zapisywanie…' : 'Zapisz ceny'}
              </button>
            </div>
            {pricesSaved && (
              <p className="text-sm text-green-600 mb-3">Ceny zapisane ✓</p>
            )}
            {userServices.length > 0 ? (
              <div className="space-y-3">
                {userServices.map((service) => {
                  const sid = String(service._id);
                  const row = servicePrices[sid] || { min: '', max: '' };
                  return (
                    <div
                      key={sid}
                      className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px] gap-3 items-center p-3 bg-white rounded-lg border border-slate-200"
                    >
                      <span className="text-sm font-medium text-slate-800">{service.name_pl}</span>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Od (zł)</label>
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={row.min}
                          onChange={(e) => handlePriceChange(sid, 'min', e.target.value)}
                          placeholder="np. 80"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Do (zł)</label>
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={row.max}
                          onChange={(e) => handlePriceChange(sid, 'max', e.target.value)}
                          placeholder="np. 200"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Najpierw wybierz usługi powyżej.</p>
            )}
          </div>
          ) : (
          <CollapsiblePanel
            title="Widełki cenowe"
            storageKey="manageServices:prices"
            defaultCollapsed
            summary={userServices.length > 0 ? `${userServices.length} usług do ustawienia` : "Po wyborze usług powyżej"}
            className="mt-4 border-indigo-100 bg-indigo-50/60 shadow-none"
            headerClassName="bg-indigo-50/80"
            bodyClassName="pt-3"
          >
            <div className="flex flex-col gap-3 mb-4">
              <p className="text-sm text-slate-600">
                Osobny zakres dla każdej usługi — puste pola = widełki z profilu.
              </p>
              <button
                type="button"
                onClick={handleSavePrices}
                disabled={pricesSaving || userServices.length === 0}
                className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                {pricesSaving ? 'Zapisywanie…' : 'Zapisz ceny'}
              </button>
            </div>
            {pricesSaved && (
              <p className="text-sm text-green-600 mb-3">Ceny zapisane ✓</p>
            )}
            {userServices.length > 0 ? (
              <div className="space-y-3">
                {userServices.map((service) => {
                  const sid = String(service._id);
                  const row = servicePrices[sid] || { min: '', max: '' };
                  return (
                    <div
                      key={sid}
                      className="p-3 bg-white rounded-lg border border-slate-200 space-y-2"
                    >
                      <span className="text-sm font-medium text-slate-800 block">{service.name_pl}</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Od (zł)</label>
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={row.min}
                            onChange={(e) => handlePriceChange(sid, 'min', e.target.value)}
                            placeholder="np. 80"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Do (zł)</label>
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={row.max}
                            onChange={(e) => handlePriceChange(sid, 'max', e.target.value)}
                            placeholder="np. 200"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Najpierw wybierz usługi powyżej.</p>
            )}
          </CollapsiblePanel>
          )}

          {/* Podsumowanie wybranych usług */}
          {isMdUp ? (
          <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Wybrane usługi 
              <span className="ml-2 text-indigo-600">({userServices.length})</span>
            </h3>
            {userServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {userServices.map((service) => (
                  <div 
                    key={service._id} 
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
                  >
                    <span className="text-sm text-slate-700 font-medium flex-1">{service.name_pl}</span>
                    <button
                      onClick={() => handleRemove(service._id)}
                      className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium transition-colors"
                    >
                      Usuń
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm">Nie wybrano żadnych usług</p>
                <p className="text-slate-400 text-xs mt-1">Zaznacz kategorie powyżej, aby dodać usługi</p>
              </div>
            )}
          </div>
          ) : (
          <CollapsiblePanel
            title="Wybrane usługi"
            storageKey="manageServices:selected"
            defaultCollapsed={userServices.length === 0}
            summary={`${userServices.length} ${userServices.length === 1 ? "usługa" : userServices.length < 5 ? "usługi" : "usług"}`}
            className="mt-4 border-slate-200 bg-slate-50 shadow-none"
            headerClassName="bg-slate-50"
            bodyClassName="pt-3"
          >
            {userServices.length > 0 ? (
              <div className="space-y-2">
                {userServices.map((service) => (
                  <div
                    key={service._id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                  >
                    <span className="text-sm text-slate-700 font-medium flex-1 min-w-0 pr-2">{service.name_pl}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(service._id)}
                      className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium transition-colors"
                    >
                      Usuń
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm">Nie wybrano żadnych usług</p>
                <p className="text-slate-400 text-xs mt-1">Rozwiń kategorię powyżej i zaznacz usługi</p>
              </div>
            )}
          </CollapsiblePanel>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageServices;