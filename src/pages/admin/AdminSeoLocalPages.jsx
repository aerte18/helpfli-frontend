import { useCallback, useEffect, useState } from 'react';
import {
  fetchSeoCities,
  adminListLocalPages,
  adminRebuildLocalPage,
  adminBulkBuildLocalPages,
  adminDeleteLocalPage
} from '@/api/seo';

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
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [buildSummary, setBuildSummary] = useState(null);

  // Form state
  const [singleService, setSingleService] = useState('hydraulik');
  const [singleCity, setSingleCity] = useState('warszawa');
  const [singleForce, setSingleForce] = useState(false);

  const [bulkServices, setBulkServices] = useState('hydraulik\nelektryk\nklimatyzacja');
  const [bulkCities, setBulkCities] = useState([]);
  const [bulkForce, setBulkForce] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminListLocalPages({ page: 1, limit: 100 });
      setItems(data.items || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeoCities()
      .then((d) => setCities(d.cities || []))
      .catch(() => {});
    reload();
  }, [reload]);

  async function handleSingleBuild(e) {
    e?.preventDefault();
    if (!singleService || !singleCity) return;
    setBuilding(true);
    setBuildSummary(null);
    try {
      const out = await adminRebuildLocalPage({
        service: singleService.trim(),
        city: singleCity.trim(),
        force: singleForce
      });
      setBuildSummary(out.ok ? `OK: /wykonawcy/${out.page.serviceSlug}/${out.page.citySlug}` : `BŁĄD: ${out.message}`);
      reload();
    } catch (err) {
      setBuildSummary(`Błąd: ${err.message}`);
    } finally {
      setBuilding(false);
    }
  }

  async function handleBulkBuild() {
    const services = bulkServices
      .split(/[\n,]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!services.length || !bulkCities.length) {
      setBuildSummary('Wybierz co najmniej 1 usługę i 1 miasto.');
      return;
    }
    const total = services.length * bulkCities.length;
    if (!confirm(`Zbudujesz ${total} stron PSEO. Każda = 1 wywołanie LLM. Kontynuować?`)) return;
    setBuilding(true);
    setBuildSummary(`Buduję ${total} stron…`);
    try {
      const out = await adminBulkBuildLocalPages({
        services,
        cities: bulkCities,
        force: bulkForce
      });
      const okCount = out.results.filter((r) => r.ok).length;
      setBuildSummary(`Zbudowano ${okCount} / ${out.total} stron.`);
      reload();
    } catch (err) {
      setBuildSummary(`Błąd bulk-build: ${err.message}`);
    } finally {
      setBuilding(false);
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
          Każda strona = unikalna landing page typu „hydraulik warszawa". Generowane przez AI na bazie
          REALNYCH danych marketplace (liczba wykonawców, mediana ceny).
        </p>
      </header>

      {/* Bulk-build */}
      <section className="bg-white rounded-2xl border p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-3">Bulk-build (macierz)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500 mb-1 block">
              Slug usług (po przecinku lub po enterze)
            </label>
            <textarea
              rows={6}
              value={bulkServices}
              onChange={(e) => setBulkServices(e.target.value)}
              className="w-full rounded-lg border p-2 font-mono text-sm"
              placeholder="hydraulik&#10;elektryk&#10;klimatyzacja"
            />
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
            placeholder="slug usługi (np. hydraulik)"
            className="flex-1 rounded-lg border p-2 text-sm"
          />
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
                          handleSingleBuild();
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
