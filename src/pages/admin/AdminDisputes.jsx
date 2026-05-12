import { apiUrl } from "@/lib/apiUrl";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const PAGE_SIZE = 50;

/** Limity wierszy w eksporcie CSV (backend: max 5000). */
const EXPORT_LIMIT_OPTIONS = [500, 1000, 2000, 3000, 5000];

const TABS = [
  { id: "open", label: "Otwarte" },
  { id: "escalated", label: "Po eskalacji" },
  { id: "resolved", label: "Zamknięte ugodą" },
  { id: "all", label: "Wszystkie" },
];

function formatDt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
  } finally {
    ta.remove();
  }
}

function orderIdSuffix(id) {
  const s = String(id);
  return s.length <= 8 ? s : s.slice(-8);
}

export default function AdminDisputes() {
  const [tab, setTab] = useState("open");
  const [page, setPage] = useState(0);
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [exportNotice, setExportNotice] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [exportRowLimit, setExportRowLimit] = useState(3000);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const skip = page * PAGE_SIZE;
      const params = new URLSearchParams({
        tab,
        limit: String(PAGE_SIZE),
        skip: String(skip),
      });
      if (appliedQ.trim()) params.set("q", appliedQ.trim());
      const res = await fetch(apiUrl(`/api/admin/disputes?${params}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Błąd pobierania listy");
        setItems([]);
        setTotal(0);
        return;
      }
      setItems(data.items || []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e?.message || "Błąd sieci");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page, appliedQ]);

  const runSearch = () => {
    const t = searchDraft.trim();
    setSearchDraft(t);
    setAppliedQ(t);
    setPage(0);
  };

  const clearSearch = () => {
    setSearchDraft("");
    setAppliedQ("");
    setPage(0);
  };

  const downloadCsv = async () => {
    setExporting(true);
    setExportNotice(null);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ tab, limit: String(exportRowLimit) });
      if (appliedQ.trim()) params.set("q", appliedQ.trim());
      const res = await fetch(apiUrl(`/api/admin/disputes/export?${params}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const totalHdr = res.headers.get("X-Export-Total");
      const rowHdr = res.headers.get("X-Export-Row-Count");
      const capHdr = res.headers.get("X-Export-Cap");
      const truncated = res.headers.get("X-Export-Truncated") === "1";

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Błąd eksportu CSV");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spory-${tab}.csv`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      const totalN = totalHdr != null ? Number(totalHdr) : NaN;
      const rowN = rowHdr != null ? Number(rowHdr) : NaN;
      const capN = capHdr != null ? Number(capHdr) : NaN;
      if (truncated && Number.isFinite(totalN) && Number.isFinite(rowN)) {
        setExportNotice(
          `W pliku jest ${rowN} z ${totalN} pozycji (limit eksportu ${Number.isFinite(capN) ? capN : "—"}). Zawęż zakładkę lub wyszukiwanie i pobierz ponownie, albo skontaktuj się z dev w sprawie wyższego limitu.`
        );
      } else {
        setExportNotice(null);
      }
    } catch (e) {
      setError(e?.message || "Błąd eksportu");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = (page + 1) * PAGE_SIZE < total;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Spory i centrum sprawy</h1>
        <p className="mt-1 text-sm text-slate-600">
          Podgląd zgłoszeń, eskalacji i ugód — linki otwierają widok jak u uczestnika zlecenia.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="admin-disputes-q" className="block text-xs font-medium text-slate-600 mb-1">
              Szukaj (ID zlecenia / użytkownika albo fragment e-mailu lub imienia)
            </label>
            <input
              id="admin-disputes-q"
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch();
              }}
              placeholder="np. 674a… lub jan@ lub Kowalski"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={runSearch}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Szukaj
          </button>
          {(appliedQ || searchDraft) && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Wyczyść
            </button>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="admin-disputes-export-limit" className="text-xs font-medium text-slate-600">
              Max. wierszy CSV
            </label>
            <select
              id="admin-disputes-export-limit"
              value={exportRowLimit}
              onChange={(e) => setExportRowLimit(Number(e.target.value))}
              disabled={exporting}
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 min-w-[7rem] disabled:opacity-50"
            >
              {EXPORT_LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n.toLocaleString("pl-PL")}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={exporting || loading}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {exporting ? "Eksport…" : "Eksport CSV"}
          </button>
        </div>
        {appliedQ ? (
          <p className="text-xs text-slate-500">
            Aktywne kryterium: <span className="font-medium text-slate-700">{appliedQ}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setPage(0);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-indigo-600 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Odśwież
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {exportNotice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-wrap items-start justify-between gap-2">
          <span>{exportNotice}</span>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="shrink-0 text-amber-800 underline text-xs font-medium"
          >
            Zamknij
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <div>
            Znaleziono: <span className="font-semibold text-slate-900">{total}</span>
            {total > 0 && (
              <span className="text-slate-500">
                {" "}
                · strona{" "}
                <span className="font-medium text-slate-800">
                  {page + 1} / {totalPages}
                </span>
              </span>
            )}
          </div>
          {total > PAGE_SIZE && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canPrev || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                Poprzednia
              </button>
              <button
                type="button"
                disabled={!canNext || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                Następna
              </button>
            </div>
          )}
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Ładowanie…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Brak pozycji w tym widoku.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Zlecenie</th>
                  <th className="px-2 py-3 w-[5.5rem] whitespace-nowrap">Skrót</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Spór</th>
                  <th className="px-4 py-3">Strony</th>
                  <th className="px-4 py-3">Ugoda</th>
                  <th className="px-4 py-3">Wątek</th>
                  <th className="px-4 py-3">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{row.service || "—"}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 max-w-[min(100%,280px)]">
                        <span className="text-[11px] font-mono text-slate-600 break-all leading-snug" title={String(row._id)}>
                          {String(row._id)}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            const id = String(row._id);
                            try {
                              await copyToClipboard(id);
                              setCopiedOrderId(id);
                              window.setTimeout(() => {
                                setCopiedOrderId((cur) => (cur === id ? null : cur));
                              }, 2000);
                            } catch {
                              setError("Nie udało się skopiować ID (przeglądarka zablokowała schowek).");
                            }
                          }}
                          className="shrink-0 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                        >
                          {copiedOrderId === String(row._id) ? "Skopiowano" : "Kopiuj ID"}
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <span
                        className="font-mono text-[11px] text-slate-500 tabular-nums"
                        title={`Pełne ID: ${String(row._id)}`}
                      >
                        #{orderIdSuffix(row._id)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs">{row.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{row.disputeStatus}</div>
                      <div className="text-xs text-slate-500">Zgł.: {formatDt(row.disputeReportedAt)}</div>
                      {row.disputeEscalatedAt && (
                        <div className="text-xs text-amber-700 mt-0.5">Eskalacja: {formatDt(row.disputeEscalatedAt)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 max-w-[200px]">
                      <div className="truncate" title={row.client?.email}>
                        K: {row.client?.name || "—"}
                      </div>
                      <div className="truncate mt-0.5" title={row.provider?.email}>
                        W: {row.provider?.name || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {row.settlement?.status === "pending" && (
                        <span className="text-indigo-700">
                          Oczekuje {row.settlement.amountPln != null ? `${Number(row.settlement.amountPln).toFixed(2)} PLN` : ""}
                        </span>
                      )}
                      {row.settlement?.status === "accepted" && (
                        <span className="text-emerald-700">
                          Zaakceptowana
                          {row.settlement.refundMethod ? ` · ${row.settlement.refundMethod}` : ""}
                        </span>
                      )}
                      {(!row.settlement || row.settlement.status === "none" || row.settlement.status === "declined") && (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{row.messageCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Link
                          to={`/orders/${row._id}/sprawa`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-xs"
                        >
                          Centrum sprawy
                        </Link>
                        <Link
                          to={`/orders/${row._id}?tab=details`}
                          className="text-slate-600 hover:text-slate-900 text-xs"
                        >
                          Zlecenie
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
