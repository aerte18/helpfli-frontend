import { Link } from "react-router-dom";
import { BellRing, ClipboardList, Search } from "lucide-react";
import { EVENT_TYPES, useTelemetry } from "../hooks/useTelemetry";

export default function NoProviderLeadCard({
  service = "",
  location = "",
  source = "search_no_results",
  onClearFilters,
  className = "",
}) {
  const { track } = useTelemetry();
  const params = new URLSearchParams({ source });
  if (String(service).trim()) params.set("service", String(service).trim());
  if (String(location).trim()) params.set("location", String(location).trim());
  const orderUrl = `/create-order?${params.toString()}`;

  return (
    <section
      className={`rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 text-left shadow-sm sm:p-6 ${className}`.trim()}
      aria-labelledby="no-provider-lead-title"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100">
          <Search className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 id="no-provider-lead-title" className="text-lg font-semibold text-slate-900">
            Nie widzisz właściwego wykonawcy?
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
            Opisz zadanie bezpłatnie. Zlecenie trafi do dostępnych wykonawców, a zespół Helpfli zobaczy,
            gdzie trzeba rozszerzyć lokalną sieć specjalistów.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-slate-100">
          <ClipboardList className="h-4 w-4 text-indigo-600" aria-hidden />
          Formularz możesz wypełnić bez logowania
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-slate-100">
          <BellRing className="h-4 w-4 text-indigo-600" aria-hidden />
          Powiadomimy Cię, gdy pojawią się oferty
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          to={orderUrl}
          onClick={() =>
            track(EVENT_TYPES.NO_RESULTS_LEAD, {
              source,
              service: String(service || "").slice(0, 120),
              hasLocation: Boolean(String(location || "").trim()),
            })
          }
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Opisz zadanie bezpłatnie
        </Link>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Wyczyść filtry
          </button>
        )}
      </div>
    </section>
  );
}
