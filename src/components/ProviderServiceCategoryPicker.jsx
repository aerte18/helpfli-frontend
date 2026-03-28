import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from "react";
import {
  buildProviderServiceCategories,
  getExpandedSlugsForSelection,
} from "../utils/buildProviderServiceCategories";
import {
  getServiceSelectionKey,
  selectionKeysEqual,
  selectionKeysInclude,
} from "../utils/serviceSelectionKeys";

/**
 * Wybór usług jak w „Zarządzanie usługami”: kategorie → rozwijane podkategorie.
 * Stan tylko lokalny (onboarding); zapis przez POST /api/user-services w rodzicu.
 */
export default function ProviderServiceCategoryPicker({
  selectedIds = [],
  onSelectedIdsChange,
}) {
  const [loading, setLoading] = useState(true);
  const [mainCategories, setMainCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(() => new Set());

  const selected = selectedIds ?? [];

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const limit = 1000;
        const servicesUrl = apiUrl(`/api/services?limit=${limit}`);
        const categoriesUrl = apiUrl("/api/services/categories");
        const [servicesRes, categoriesRes] = await Promise.all([
          fetch(servicesUrl),
          fetch(categoriesUrl, { cache: "no-store" }),
        ]);

        if (!servicesRes.ok) {
          const t = await servicesRes.text();
          console.error("ProviderServiceCategoryPicker: services", t?.slice?.(0, 300));
          throw new Error("Nie udało się pobrać usług");
        }

        let servicesData;
        let categoriesData = { items: [] };
        try {
          servicesData = await servicesRes.json();
        } catch (e) {
          throw e;
        }
        try {
          categoriesData = categoriesRes.ok ? await categoriesRes.json() : { items: [] };
        } catch {
          categoriesData = { items: [] };
        }

        const services = Array.isArray(servicesData.items)
          ? servicesData.items
          : Array.isArray(servicesData)
            ? servicesData
            : [];

        const { mainCategories: mc, subcategories: sm } =
          buildProviderServiceCategories(services, categoriesData);

        if (cancelled) return;
        setMainCategories(mc);
        setSubcategories(sm);
      } catch (err) {
        console.error("ProviderServiceCategoryPicker:", err);
        if (!cancelled) {
          setMainCategories([]);
          setSubcategories({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Rozwiń kategorie, w których coś jest zaznaczone (w tym po powrocie z kroku 2)
  useEffect(() => {
    if (loading || Object.keys(subcategories).length === 0) return;
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      getExpandedSlugsForSelection(subcategories, selected).forEach((s) =>
        next.add(s)
      );
      return next;
    });
  }, [selectedIds, subcategories, loading]);

  const isMainCategorySelected = (categorySlug) => {
    const categorySubs = subcategories[categorySlug] || [];
    const selectable = categorySubs.filter((s) => getServiceSelectionKey(s));
    if (selectable.length === 0) return false;
    return selectable.every((sub) =>
      selected.includes(getServiceSelectionKey(sub))
    );
  };

  const isMainCategoryPartial = (categorySlug) => {
    const categorySubs = subcategories[categorySlug] || [];
    const selectable = categorySubs.filter((s) => getServiceSelectionKey(s));
    if (selectable.length === 0) return false;
    const n = selectable.filter((sub) =>
      selectionKeysInclude(selected, getServiceSelectionKey(sub))
    ).length;
    return n > 0 && n < selectable.length;
  };

  const toggleCategoryExpand = (categorySlug) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categorySlug)) next.delete(categorySlug);
      else next.add(categorySlug);
      return next;
    });
  };

  const handleMainCategoryToggle = (categorySlug) => {
    const categorySubs = subcategories[categorySlug] || [];
    const keys = categorySubs
      .map(getServiceSelectionKey)
      .filter(Boolean);
    const allSelected =
      keys.length > 0 && keys.every((k) => selectionKeysInclude(selected, k));

    if (!expandedCategories.has(categorySlug)) {
      setExpandedCategories((prev) => new Set(prev).add(categorySlug));
    }

    if (allSelected) {
      onSelectedIdsChange(
        selected.filter((id) => !keys.some((k) => selectionKeysEqual(id, k)))
      );
    } else {
      const next = selected.filter(
        (id) => !keys.some((k) => selectionKeysEqual(id, k))
      );
      keys.forEach((k) => next.push(k));
      onSelectedIdsChange(next);
    }
  };

  const toggleSub = (sub) => {
    const key = getServiceSelectionKey(sub);
    if (!key) return;
    if (selected.includes(key)) {
      onSelectedIdsChange(selected.filter((x) => x !== key));
    } else {
      onSelectedIdsChange([...selected, key]);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-600">Ładowanie kategorii usług…</div>
    );
  }

  if (mainCategories.length === 0) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
        <p className="text-amber-900 font-medium">Brak dostępnych kategorii</p>
        <p className="text-amber-800 text-sm mt-1">
          Nie udało się wczytać katalogu usług. Odśwież stronę lub spróbuj później.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left w-full max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold text-center text-gray-900">
        Wybierz usługi, które oferujesz
      </h3>
      <p className="text-sm text-gray-600 text-center">
        Rozwiń kategorię (np. Hydraulika, IT) i zaznacz konkretne usługi — tak jak w
        ustawieniach konta.
      </p>

      <div className="space-y-3 max-h-[min(420px,55vh)] overflow-y-auto pr-1">
        {mainCategories.map((category) => {
          const categorySubs = subcategories[category.slug] || [];
          const isSelected = isMainCategorySelected(category.slug);
          const isPartial = isMainCategoryPartial(category.slug);
          const isExpanded = expandedCategories.has(category.slug);
          const showSubs = isExpanded;

          return (
            <div
              key={category._id}
              className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center flex-1 gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isPartial;
                    }}
                    onChange={() => handleMainCategoryToggle(category.slug)}
                    className="h-5 w-5 shrink-0 text-indigo-600 rounded border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
                  />
                  <label
                    className="text-base font-semibold text-slate-900 cursor-pointer flex-1 min-w-0 truncate hover:text-indigo-600"
                    onClick={() => toggleCategoryExpand(category.slug)}
                  >
                    {category.name_pl}
                  </label>
                  <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full shrink-0">
                    {categorySubs.length}
                  </span>
                  {categorySubs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpand(category.slug)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                      aria-label={isExpanded ? "Zwiń" : "Rozwiń"}
                    >
                      <svg
                        className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {categorySubs.length > 0 && (
                <div
                  className={`mt-3 ml-7 grid grid-cols-1 sm:grid-cols-2 gap-2 transition-all duration-200 ${
                    showSubs ? "opacity-100" : "opacity-0 max-h-0 hidden"
                  }`}
                >
                  {categorySubs.map((sub) => {
                    const rowKey = getServiceSelectionKey(sub);
                    const isSubSelected =
                      rowKey && selectionKeysInclude(selected, rowKey);
                    return (
                      <div
                        key={rowKey || sub.slug || sub.name_pl}
                        className={`flex items-center p-2 rounded-lg transition-colors ${
                          isSubSelected
                            ? "bg-indigo-50 border border-indigo-200"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!isSubSelected}
                          disabled={!rowKey}
                          onChange={() => rowKey && toggleSub(sub)}
                          className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 cursor-pointer disabled:opacity-40"
                        />
                        <label
                          className="ml-3 text-sm text-slate-700 cursor-pointer flex-1"
                          onClick={() => rowKey && toggleSub(sub)}
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

      {selected.length > 0 && (
        <p className="text-sm text-gray-600 text-center">
          Wybrano {selected.length}{" "}
          {selected.length === 1 ? "usługę" : selected.length < 5 ? "usługi" : "usług"}
        </p>
      )}
    </div>
  );
}
