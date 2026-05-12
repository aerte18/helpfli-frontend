import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Loader2, Send, Scale, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  getDisputeCase,
  postDisputeMessage,
  postSettlementOffer,
  postSettlementRespond,
  postDisputeEscalate,
} from "../api/disputeCase";
import { useToast } from "../components/toast/ToastProvider";
import { getErrorMessage } from "../utils/errorMessages";

function formatDt(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return String(iso);
  }
}

/** Opis zwrotu po ugodzie (zgodny z backendem `disputeSettlement.refundMethod`). */
function refundMethodDescription(method) {
  switch (method) {
    case "refund":
      return "Zwrot w Stripe został zainicjowany na metodę płatności klienta — czas księgowania zależy od banku lub operatora płatności.";
    case "partial_capture":
      return "Część zablokowanych środków wróciła do klienta; pozostała kwota została pobrana zgodnie z ugodą.";
    case "cancel":
      return "Autoryzacja płatności została anulowana — zwolnione środki wracają na metodę płatności klienta.";
    case "skipped_external":
      return "Płatność była poza systemem Helpfli — automatycznego zwrotu w aplikacji nie wykonano.";
    case "skipped_no_payment":
      return "Brak zarejestrowanej płatności systemowej — zwrotu w Stripe nie wykonano.";
    case "split_refund":
      return "Zwrot został rozłożony na główną płatność i dopłatę (Stripe) — szczegóły w wątku systemowym.";
    default:
      return null;
  }
}

export default function OrderDisputeCase() {
  const { orderId } = useParams();
  const { push: toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerNote, setOfferNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const d = await getDisputeCase(orderId);
      setData(d);
    } catch (e) {
      toast({ title: "Sprawa", description: getErrorMessage(e), variant: "error" });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const sendMessage = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    try {
      await postDisputeMessage(orderId, msg.trim());
      setMsg("");
      toast({ title: "Wysłano", variant: "success" });
      await load();
    } catch (e) {
      toast({ title: "Błąd", description: getErrorMessage(e), variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const sendOffer = async () => {
    const n = parseFloat(String(offerAmount).replace(",", "."));
    if (!Number.isFinite(n) || n < 1) {
      toast({ title: "Kwota", description: "Podaj kwotę co najmniej 1 PLN.", variant: "warning" });
      return;
    }
    setBusy(true);
    try {
      await postSettlementOffer(orderId, { amountPln: n, message: offerNote });
      setOfferAmount("");
      setOfferNote("");
      toast({ title: "Propozycja wysłana", variant: "success" });
      await load();
    } catch (e) {
      toast({ title: "Błąd", description: getErrorMessage(e), variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const respond = async (accept) => {
    setBusy(true);
    try {
      const result = await postSettlementRespond(orderId, accept);
      let description;
      if (accept && result?.refund?.amountGrosze > 0) {
        const pln = (result.refund.amountGrosze / 100).toFixed(2);
        description = `Operacja w Stripe: ${result.refund.method || "zwrot"} — ${pln} PLN.`;
      } else if (accept && result?.refund?.method?.startsWith("skipped")) {
        description = "Ugoda zapisana — bez automatycznego zwrotu w aplikacji (szczegóły w centrum sprawy).";
      }
      toast({
        title: accept ? "Ugoda zaakceptowana" : "Ugoda odrzucona",
        ...(description ? { description } : {}),
        variant: "success",
      });
      await load();
    } catch (e) {
      toast({ title: "Błąd", description: getErrorMessage(e), variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const escalate = async () => {
    if (!window.confirm("Przekazać sprawę do zespołu Helpfli? Nadal możesz dopisywać informacje w wątku.")) return;
    setBusy(true);
    try {
      await postDisputeEscalate(orderId);
      toast({ title: "Przekazano do Helpfli", variant: "success" });
      await load();
    } catch (e) {
      toast({ title: "Błąd", description: getErrorMessage(e), variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const st = data?.settlement;
  const pending = st?.status === "pending";
  const accepted = st?.status === "accepted";
  const refundNote = accepted && st?.refundMethod ? refundMethodDescription(st.refundMethod) : null;
  const mediationOpen = data?.mediationOpen !== false;
  const disputeResolved = !!data?.disputeResolved;

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-6">
      <Helmet>
        <title>Sprawa reklamacyjna | Helpfli</title>
      </Helmet>
      <div className="mx-auto max-w-3xl px-4">
        <Link
          to={`/orders/${orderId}?tab=details`}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć do zlecenia
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Centrum sprawy</h1>
              <p className="mt-1 text-sm text-slate-600">
                {data?.service ? (
                  <>
                    Zlecenie: <span className="font-medium text-slate-800">{data.service}</span>
                  </>
                ) : (
                  "Ładowanie…"
                )}
              </p>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          )}

          {!loading && !data && (
            <p className="py-12 text-center text-slate-600">Nie znaleziono aktywnej sprawy dla tego zlecenia.</p>
          )}

          {!loading && data && (
            <div className="space-y-6 pt-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium text-slate-900">Terminy</div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    Mediacja (wiadomości + propozycja ugody): do{" "}
                    <span className="font-medium">{formatDt(data.disputeMediationEndsAt)}</span>
                  </li>
                  <li>Po eskalacji: cel odpowiedzi operatora 48 h roboczych</li>
                </ul>
                {data.disputeEscalatedAt && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Sprawa jest już po eskalacji do Helpfli (ugody ustala zespół).
                  </div>
                )}
                {disputeResolved && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Sprawa zamknięta ugodą. Wątek możesz dalej czytać; nowej propozycji ugody ani eskalacji nie dodasz.
                  </div>
                )}
              </div>

              {pending && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                  <div className="text-sm font-semibold text-indigo-900">Propozycja ugody</div>
                  <p className="mt-1 text-lg font-bold text-indigo-950">
                    {st.amountPln != null && Number.isFinite(Number(st.amountPln))
                      ? Number(st.amountPln).toFixed(2)
                      : "—"}{" "}
                    PLN
                  </p>
                  {st.offeredByName && (
                    <p className="text-xs text-indigo-700">Od: {st.offeredByName}</p>
                  )}
                  {st.message ? (
                    <p className="mt-2 text-sm text-indigo-800 whitespace-pre-wrap">{st.message}</p>
                  ) : null}
                  {data.youOfferedPendingSettlement && (
                    <p className="mt-3 text-xs text-indigo-700">Oczekujesz na decyzję drugiej strony.</p>
                  )}
                  {data.youCanRespondToSettlement && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => respond(true)}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Akceptuj ugodę
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => respond(false)}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Odrzuć
                      </button>
                    </div>
                  )}
                </div>
              )}

              {accepted && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700 mt-0.5" aria-hidden />
                    <div className="min-w-0 space-y-2 text-sm text-emerald-950">
                      <div className="font-semibold text-emerald-950">Ugoda zaakceptowana</div>
                      {st.amountPln != null && Number.isFinite(Number(st.amountPln)) && (
                        <p>
                          Kwota ugody:{" "}
                          <span className="font-semibold">{Number(st.amountPln).toFixed(2)} PLN</span>
                        </p>
                      )}
                      {st.refundAmountGrosze != null && st.refundAmountGrosze > 0 && (
                        <p className="text-emerald-900">
                          Zaksięgowany zwrot / zwolnienie:{" "}
                          <span className="font-semibold">
                            {(Number(st.refundAmountGrosze) / 100).toFixed(2)} PLN
                          </span>
                          {st.refundProcessedAt ? (
                            <span className="text-emerald-800"> · {formatDt(st.refundProcessedAt)}</span>
                          ) : null}
                        </p>
                      )}
                      {refundNote ? (
                        <p className="leading-relaxed text-emerald-900">{refundNote}</p>
                      ) : (
                        <p className="text-xs text-emerald-800">
                          Szczegóły rozliczenia są też w wiadomościach systemowych w wątku poniżej.
                        </p>
                      )}
                      {st.refundStripeRef && (
                        <p className="text-[11px] text-emerald-700/90 break-all">
                          Ref. Stripe: {st.refundStripeRef}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-sm font-semibold text-slate-900">Wątek</h2>
                <div className="mt-2 max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  {(data.messages || []).map((m) => (
                    <div
                      key={m.id || `${m.createdAt}-${(m.body || "").slice(0, 20)}`}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        m.kind === "system"
                          ? "border-slate-200 bg-white text-slate-700"
                          : "border-indigo-100 bg-indigo-50/80 text-slate-800"
                      }`}
                    >
                      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        {m.kind === "system"
                          ? "System"
                          : m.user?.name || m.user?.email || "Uczestnik"}{" "}
                        · {formatDt(m.createdAt)}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap leading-relaxed">{m.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">Nowa wiadomość</label>
                <textarea
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                  placeholder="Opisz fakty, terminy, ustalenia…"
                />
                <button
                  type="button"
                  disabled={busy || !msg.trim()}
                  onClick={sendMessage}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Wyślij
                </button>
              </div>

              {!data.disputeEscalatedAt && mediationOpen && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Propozycja ugody (kwota)</h3>
                  {accepted ? (
                    <p className="mt-2 text-sm text-slate-600">
                      Ugoda została już zaakceptowana — nowej propozycji kwotowej nie można wysłać.
                    </p>
                  ) : (
                    <>
                  <p className="mt-1 text-xs text-slate-600">
                    Nie wyżej niż wartość zaakceptowanej oferty. Druga strona może zaakceptować lub odrzucić.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      placeholder="np. 150"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={offerNote}
                      onChange={(e) => setOfferNote(e.target.value)}
                      placeholder="Krótkie uzasadnienie (opcjonalnie)"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={busy || pending || accepted}
                    onClick={sendOffer}
                    className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Wyślij propozycję ugody
                  </button>
                    </>
                  )}
                </div>
              )}

              {mediationOpen && !data.disputeEscalatedAt && (
                <div className="border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={escalate}
                    className="text-sm font-medium text-orange-800 underline decoration-orange-300 hover:text-orange-950 disabled:opacity-50"
                  >
                    Nie udaje się dogadać — przekaż sprawę do zespołu Helpfli
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
