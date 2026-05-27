import { useCallback, useEffect, useState } from 'react';
import {
  fetchSeoCities,
  fetchPseoServices,
  adminListLocalPages,
  adminRebuildLocalPage,
  adminSuggestLocalPages,
  adminDeleteLocalPage
} from '@/api/seo';
import { PSEO_STARTER_SLUGS } from '@/constants/pseoStarterSlugs';

function normalizeSlugKey(raw = '') {
  return String(raw).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function resolveServiceSlug(input, services) {
  const q = String(input || '').trim().toLowerCase();
  if (!q || !services?.length) return q || null;
  const exact = services.find((s) => s.slug === q);
  if (exact) return exact.slug;
  const key = normalizeSlugKey(q);
  const byNorm = services.find((s) => normalizeSlugKey(s.slug) === key);
  if (byNorm) return byNorm.slug;
  const byPrefix =
    services.find((s) => s.slug.startsWith(q)) ||
    services.find((s) => q.length >= 8 && s.slug.includes(q)) ||
    services.find((s) => s.name.toLowerCase().includes(q));
  return byPrefix?.slug || q;
}

/**
 * /admin/seo/pseo – panel zarządzania Programmatic SEO (matryca miasto×usługa).
 *
 * Funkcje:
 *  - lista wybudowanych landing pages (z statystykami i datą ostatniego builda)
 *  - bulk-build: zaznacz N miast × M usług → "Wygeneruj M*N stron" (throttled na backendzie)
 *  - rebuild pojedynczej strony (force)
 *  - usuwanie pojedynczej strony
 */
export default function AdminSeoLocalPages() {
  const [cities, setCities] = useState([]);
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [buildSummary, setBuildSummary] = useState(null);

  // Form state
  const [singleService, setSingleService] = useState('hydraulik');
  const [singleCity, setSingleCity] = useState('warszawa');
  const [singleForce, setSingleForce] = useState(false);

  const [bulkServices, setBulkServices] = useState(PSEO_STARTER_SLUGS.slice(0, 6).join('\n'));
  const serviceMap = new Map(services.map((s) => [s.slug, s]));
  const normalizeTokens = (raw = '') =>
    raw
      .split(/[\n,]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  const unique = (arr) => [...new Set(arr)];
  const bulkServiceTokens = unique(normalizeTokens(bulkServices));
  const resolvedBulkSlugs = bulkServiceTokens.map((t) => resolveServiceSlug(t, services));
  const invalidBulkServices = bulkServiceTokens.filter(
    (slug, i) => !serviceMap.has(slug) && resolvedBulkSlugs[i] === slug
  );
  const correctedBulkMap = bulkServiceTokens
    .map((slug, i) => ({ input: slug, resolved: resolvedBulkSlugs[i] }))
    .filter(({ input, resolved }) => input !== resolved);
  const knownBulkServices = unique(resolvedBulkSlugs);
  const normalizedSingleService = (singleService || '').trim().toLowerCase();
  const resolvedSingleService = resolveServiceSlug(normalizedSingleService, services);
  const isSingleServiceValid =
    !normalizedSingleService ||
    serviceMap.has(normalizedSingleService) ||
    resolvedSingleService !== normalizedSingleService;
  const suggestService = (input) => {
    const q = String(input || '').trim().toLowerCase();
    if (!q || services.length === 0) return null;
    return (
      services.find((s) => s.slug.startsWith(q)) ||
      services.find((s) => s.name.toLowerCase().startsWith(q)) ||
      services.find((s) => s.slug.includes(q)) ||
      null
    );
  };
  const singleSuggestion = !isSingleServiceValid ? suggestService(normalizedSingleService) : null;

  const [bulkCities, setBulkCities] = useState([]);
  const [bulkForce, setBulkForce] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminListLocalPages({ page: 1, limit: 100 });
      setItems(data.items || []);
    } catch (e) {
      console.warn(e);
      const msg =
        e?.data?.message ||
        e?.message ||
        'Nie udało się pobrać listy PSEO.';
      setBuildSummary(`Błąd listy: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeoCities()
      .then((d) => setCities(d.cities || []))
      .catch((e) => {
        const msg = e?.data?.message || e?.message || 'Nie udało się pobrać listy miast.';
        setBuildSummary(`Błąd miast: ${msg}`);
      });
    fetchPseoServices()
      .then((d) => setServices(d.services || []))
      .catch((e) => {
        const msg = e?.data?.message || e?.message || 'Nie udało się pobrać listy usług.';
        setBuildSummary((prev) => prev || `Błąd usług: ${msg}`);
      });
    reload();
  }, [reload]);

  async function handleSingleBuild(e, overrides = null) {
    e?.preventDefault();
    const service = overrides?.service ?? singleService;
    const city = overrides?.city ?? singleCity;
    const force = overrides?.force ?? singleForce;
    if (!service || !city) return;
    const normalizedService = resolveServiceSlug(service, services);
    if (services.length > 0 && !serviceMap.has(normalizedService)) {
      const hint = suggestService(normalizedService);
      setBuildSummary(
        hint
          ? `Uwaga: nie znaleziono dokładnego slugu "${service}". Spróbuję dopasować po stronie backendu (sugestia: "${hint.slug}").`
          : `Uwaga: nie znaleziono dokładnego slugu "${service}". Spróbuję dopasować po stronie backendu.`
      );
    }
    setBuilding(true);
    setBuildSummary(null);
    try {
      const out = await adminRebuildLocalPage({
        service: normalizedService,
        city: city.trim(),
        force
      });
      setBuildSummary(out.ok ? `OK: /wykonawcy/${out.page.serviceSlug}/${out.page.citySlug}` : `BŁĄD: ${out.message}`);
      reload();
    } catch (err) {
      setBuildSummary(`Błąd: ${err.message}`);
    } finally {
      setBuilding(false);
    }
  }

  function insertStarterSlugs() {
    setBulkServices(PSEO_STARTER_SLUGS.join('\n'));
  }

  function autoCorrectBulkSlugs() {
    if (!bulkServiceTokens.length) return;
    setBulkServices(unique(resolvedBulkSlugs).join('\n'));
    setBuildSummary('Poprawiono slugi wg katalogu usług.');
  }

  async function handleBulkBuild() {
    const servicesToBuild = knownBulkServices;
    if (!servicesToBuild.length || !bulkCities.length) {
      setBuildSummary('Wybierz co najmniej 1 usługę i 1 miasto.');
      return;
    }
    if (invalidBulkServices.length) {
      const preview = invalidBulkServices.slice(0, 4).join(', ');
      if (
        !confirm(
          `Część slugów może być nieznana (${preview}${invalidBulkServices.length > 4 ? '…' : ''}). ` +
            'Backend spróbuje dopasować. Kontynuować?'
        )
      ) {
        return;
      }
    }
    const pairs = [];
    for (const svc of servicesToBuild) {
      for (const city of bulkCities) {
        pairs.push({ service: svc, city });
      }
    }
    const total = pairs.length;
    if (
      !confirm(
        `Zbudujesz ${total} stron (${servicesToBuild.length} usług × ${bulkCities.length} miast). ` +
          'Każda strona = osobne żądanie (bez limitu czasu proxy). Kontynuować?'
      )
    ) {
      return;
    }
    setBuilding(true);
    let okCount = 0;
    const errors = [];
    try {
      for (let i = 0; i < pairs.length; i++) {
        const { service, city } = pairs[i];
        setBuildSummary(`Buduję ${i + 1}/${total}: ${service} × ${city}…`);
        try {
          const out = await adminRebuildLocalPage({
            service,
            city,
            force: bulkForce
          });
          if (out.ok) okCount += 1;
          else errors.push(`${service}×${city}: ${out.message || 'błąd'}`);
        } catch (err) {
          errors.push(`${service}×${city}: ${err.message}`);
        }
        if (i < pairs.length - 1) {
          await new Promise((r) => setTimeout(r, 350));
        }
      }
      const errPreview = errors.length ? ` Błędy (${errors.length}): ${errors.slice(0, 3).join('; ')}` : '';
      setBuildSummary(`Gotowe: ${okCount} / ${total} stron.${errPreview}`);
      reload();
    } finally {
      setBuilding(false);
    }
  }

  async function handleSuggestBestPseo() {
    setSuggesting(true);
    try {
      const out = await adminSuggestLocalPages({ serviceLimit: 8, cityLimit: 10, days: 90 });
      const serviceSlugs = (out.services || []).map((s) => s.slug).filter(Boolean);
      const citySlugs = (out.cities || []).map((c) => c.slug).filter(Boolean);
      if (!serviceSlugs.length || !citySlugs.length) {
        setBuildSummary('AI nie znalazło wystarczających danych do propozycji.');
        return;
      }
      setBulkServices(serviceSlugs.join('\n'));
      setBulkCities(citySlugs);
      setBuildSummary(
        `AI uzupełniło listę: ${serviceSlugs.length} usług × ${citySlugs.length} miast (${out.strategy || 'ranking popytu'}).`
      );
    } catch (err) {
      setBuildSummary(`Błąd AI propozycji: ${err.message}`);
    } finally {
      setSuggesting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Na pewno usunąć tę stronę PSEO?')) return;
    try {
      await adminDeleteLocalPage(id);
      reload();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Programmatic SEO – matryca miasto × usługa</h1>
        <p className="text-sm text-slate-500 mt-1">
          Każda strona = landing „usługa × miasto”. Bulk-build wysyła po jednej stronie na żądanie (bez
          timeoutu 504 na dużej macierzy). Używaj pełnych slugów z katalogu (np.{' '}
          <code className="text-xs">hydraulika-naprawa-wycieku</code>).
        </p>
      </header>

      {/* Bulk-build */}
      <section className="bg-white rounded-2xl border p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-3">Bulk-build (macierz)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500 mb-1 block">
              Slug usług (po przecinku lub po enterze) — {services.length} dostępnych
            </label>
            <textarea
              rows={6}
              value={bulkServices}
              onChange={(e) => setBulkServices(e.target.value)}
              className="w-full rounded-lg border p-2 font-mono text-sm"
              placeholder="hydraulika-naprawa-wycieku&#10;elektryka-montaz-gniazdek-w-acznikow-oswietlenia-led"
            />
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                className="text-indigo-600 underline"
                onClick={handleSuggestBestPseo}
                disabled={suggesting || building}
              >
                {suggesting ? 'AI liczy…' : 'AI: zaproponuj najlepsze PSEO'}
              </button>
              <button
                type="button"
                className="text-indigo-600 underline"
                onClick={insertStarterSlugs}
              >
                Wstaw TOP slugi
              </button>
              {correctedBulkMap.length > 0 && (
                <button
                  type="button"
                  className="text-indigo-600 underline"
                  onClick={autoCorrectBulkSlugs}
                >
                  Auto-popraw slugi ({correctedBulkMap.length})
                </button>
              )}
            </div>
            {!!correctedBulkMap.length && (
              <div className="mt-1 text-xs text-amber-700">
                Sugestie:{' '}
                {correctedBulkMap
                  .slice(0, 4)
                  .map(({ input, resolved }) => `${input} → ${resolved}`)
                  .join('; ')}
                {correctedBulkMap.length > 4 ? '…' : ''}
              </div>
            )}
            {!!invalidBulkServices.length && (
              <div className="mt-1 text-xs text-rose-600">
                Nieznane slugi (backend może dopasować): {invalidBulkServices.join(', ')}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500 mb-1 block">
              Miasta ({cities.length} dostępnych)
            </label>
            <div className="grid grid-cols-2 gap-1 max-h-56 overflow-y-auto rounded-lg border p-2">
              {cities.map((c) => (
                <label key={c.slug} className="text-sm flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={bulkCities.includes(c.slug)}
                    onChange={(e) =>
                      setBulkCities((prev) =>
                        e.target.checked ? [...prev, c.slug] : prev.filter((x) => x !== c.slug)
                      )
                    }
                  />
                  {c.name}
                </label>
              ))}
            </div>
            <div className="mt-1 flex gap-2 text-xs">
              <button
                type="button"
                className="text-indigo-600 underline"
                onClick={() => setBulkCities(cities.map((c) => c.slug))}
              >
                zaznacz wszystkie
              </button>
              <button
                type="button"
                className="text-slate-500 underline"
                onClick={() => setBulkCities([])}
              >
                wyczyść
              </button>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={bulkForce}
              onChange={(e) => setBulkForce(e.target.checked)}
            />
            Wymuś regenerację (force)
          </label>
          <button
            type="button"
            onClick={handleBulkBuild}
            disabled={building}
            className="ml-auto px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-50"
          >
            {building ? 'Buduję…' : 'Zbuduj macierz'}
          </button>
        </div>
        {buildSummary && <div className="mt-2 text-sm text-slate-700">{buildSummary}</div>}
      </section>

      {/* Single rebuild */}
      <section className="bg-white rounded-2xl border p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-3">Pojedynczy build / rebuild</h2>
        <form onSubmit={handleSingleBuild} className="flex flex-col sm:flex-row gap-2">
          <input
            value={singleService}
            onChange={(e) => setSingleService(e.target.value)}
            placeholder="slug usługi (np. hydraulika-naprawa-wycieku)"
            className={`flex-1 rounded-lg border p-2 text-sm ${isSingleServiceValid ? '' : 'border-rose-400'}`}
            list="pseo-services-list"
          />
          <datalist id="pseo-services-list">
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </datalist>
          <select
            value={singleCity}
            onChange={(e) => setSingleCity(e.target.value)}
            className="flex-1 rounded-lg border p-2 text-sm"
          >
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <label className="text-sm flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={singleForce}
              onChange={(e) => setSingleForce(e.target.checked)}
            />
            force
          </label>
          <button
            type="submit"
            disabled={building}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50"
          >
            Zbuduj
          </button>
        </form>
        {!isSingleServiceValid && (
        <div className="mt-2 text-xs text-amber-700">
          Brak dokładnego matcha slugu.
            {singleSuggestion ? (
              <>
                {' '}Czy chodziło o{' '}
                <button
                  type="button"
                  className="underline text-indigo-600"
                  onClick={() => setSingleService(singleSuggestion.slug)}
                >
                  {singleSuggestion.slug}
                </button>
                {' '}({singleSuggestion.name})?
              </>
            ) : null}
          </div>
        )}
      </section>

      {/* Lista */}
      <section className="bg-white rounded-2xl border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Wygenerowane strony ({items.length})</h2>
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="text-sm text-indigo-600 hover:underline"
          >
            {loading ? 'Ładuję…' : 'Odśwież'}
          </button>
        </div>
        {items.length === 0 ? (
          <div className="text-sm text-slate-500">Brak wygenerowanych stron. Użyj bulk-build powyżej.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500 border-b">
                <tr>
                  <th className="text-left py-2 pr-3">Usługa × Miasto</th>
                  <th className="text-left py-2 pr-3">Wykonawcy</th>
                  <th className="text-left py-2 pr-3">Mediana</th>
                  <th className="text-left py-2 pr-3">Build</th>
                  <th className="text-right py-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3">
                      <a
                        href={`/wykonawcy/${p.serviceSlug}/${p.citySlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {p.serviceName} × {p.cityName}
                      </a>
                      <div className="text-xs text-slate-400">/wykonawcy/{p.serviceSlug}/{p.citySlug}</div>
                    </td>
                    <td className="py-2 pr-3">{p.statsSnapshot?.providerCount ?? '—'}</td>
                    <td className="py-2 pr-3">{p.statsSnapshot?.medianPrice ? `${p.statsSnapshot.medianPrice} zł` : '—'}</td>
                    <td className="py-2 pr-3 text-xs text-slate-500">
                      {p.lastBuiltAt ? new Date(p.lastBuiltAt).toLocaleDateString('pl-PL') : '—'}
                    </td>
                    <td className="py-2 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSingleService(p.serviceSlug);
                          setSingleCity(p.citySlug);
                          setSingleForce(true);
                          handleSingleBuild(null, {
                            service: p.serviceSlug,
                            city: p.citySlug,
                            force: true
                          });
                        }}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Rebuild
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p._id)}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
