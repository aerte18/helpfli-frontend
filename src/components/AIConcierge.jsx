// src/components/AIConcierge.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useAIConcierge } from "../hooks/useAIConcierge";
import { useAIPricing } from "../hooks/useAIPricing";

// Jeśli masz własny ProviderCard, użyj go; tu jest prosty fallback:
function MiniProviderCard({ p, onSelect }) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm flex gap-3 items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src={p.avatar || "https://via.placeholder.com/48"}
          alt={p.name || "Wykonawca"}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <div className="font-semibold">{p.name || p.title || "Wykonawca"}</div>
          <div className="text-sm opacity-70">
            {p.serviceLabel || p.service || ""} · ⭐ {p.rating ?? "—"}
          </div>
        </div>
      </div>
      <button
        onClick={() => onSelect?.(p)}
        className="px-3 py-2 rounded-xl bg-black text-white text-sm"
      >
        Wybierz
      </button>
    </div>
  );
}

export default function AIConcierge({ token, onCreateOrder, defaultText = "" }) {
  const [problemText, setProblemText] = useState(defaultText);
  const [tab, setTab] = useState("advice"); // "advice" | "order" | "providers"
  const [geo, setGeo] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [showEscalateBanner, setShowEscalateBanner] = useState(false);

  const { loading, result, providers, error, run } = useAIConcierge(token);
  const pricing = useAIPricing(token);
  const [urgency, setUrgency] = useState("normal");

  // Funkcja do zaznaczania kroków
  const toggleStep = (stepIndex) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);
  };

  // Pobierz geolokację (opcjonalnie)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          city: null, // Jeśli masz reverse geocoding — tu uzupełnisz
        });
      },
      () => {}
    );
  }, []);

  // Follow-up timer po 15 minutach
  useEffect(() => {
    if (!result?.draftId) return;
    const t = setTimeout(() => {
      const allDone = (result.diySteps || []).every(s => !!s.done);
      if (!allDone) {
        setShowEscalateBanner(true);
      }
    }, 15 * 60 * 1000);
    return () => clearTimeout(t);
  }, [result?.draftId, result?.diySteps]);

  // Mapowanie danych z backendu na strukturę oczekiwaną przez frontend
  const advice = {
    risk_level: result?.dangerFlags?.length > 0 ? 'wysokie' : 'niskie',
    recommended_urgency: result?.urgency || 'normal'
  };
  
  const order = {
    title: result?.serviceCandidate?.name || 'Zlecenie',
    description: problemText,
    service: result?.serviceCandidate?.code,
    location: {
      city: result?.location?.text || '',
      lat: result?.location?.lat,
      lng: result?.location?.lon
    },
    budget_hint: {
      min: result?.priceHints?.min || 0,
      max: result?.priceHints?.max || 1000,
      currency: 'PLN'
    }
  };

  async function handleDiagnose() {
    if (!problemText?.trim()) return;
    
    // Sprawdź czy użytkownik jest zalogowany
    if (!token) {
      const proceed = confirm(
        'Aby użyć Asystenta AI, musisz się zalogować.\n\n' +
        '📌 Zarejestruj się za darmo i otrzymaj 50 darmowych zapytań do AI!\n\n' +
        'Czy chcesz się zalogować teraz?'
      );
      if (proceed) {
        window.location.href = "/login?next=" + encodeURIComponent("/concierge");
      }
      return;
    }
    
    // Dodaj język do requestu
    const language = navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'pl';
    await run(problemText.trim(), geo, { language });
    setTab("advice");
  }

  async function handleCreateOrder() {
    if (!order) return;
    // Zgrabne payload — dostosuj do swojej trasy /api/orders (OPEN / DIRECT)
    const payload = {
      service: order.service,
      title: order.title,
      description: order.description,
      // Jeśli Twoje /api/orders wymaga providerId w DIRECT — tutaj go dodaj,
      // dla trybu OPEN pomiń providerId.
      location: order.location || geo || null,
      budget_hint: order.budget_hint || null,
      // np. status "open", jeśli taki masz:
      status: "open",
    };
    await onCreateOrder?.(payload);
  }
  // Po wykryciu usługi – ściągnij widełki cen
  useEffect(() => {
    if (!order?.service) return;
    const s = order.service;
    const c = order?.location?.city || geo?.city || "";
    pricing.run({ service: s, city: c, lat: geo?.lat, lng: geo?.lng, urgency });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.service, geo?.lat, geo?.lng, urgency]);


  function selectProviderAndCreate(p) {
    if (!order) return;
    const payload = {
      service: order.service,
      title: order.title,
      description: order.description,
      location: order.location || geo || null,
      budget_hint: order.budget_hint || null,
      providerId: p._id, // DIRECT zlecenie do wybranego wykonawcy
      status: "direct_requested",
    };
    onCreateOrder?.(payload);
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6">
      <div className="rounded-3xl border p-4 sm:p-6 shadow-lg bg-white">
        <h2 className="text-2xl font-bold mb-2">Asystent AI</h2>
        <p className="text-sm opacity-70 mb-4">
          Opisz problem — Asystent AI podpowie rozwiązanie, przygotuje zlecenie i zasugeruje 3 najlepszych wykonawców.
        </p>

        <div className="flex gap-3 items-start mb-4">
          <textarea
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
            placeholder="Np. 'Zepsuła się pralka — nie wiruje po wirowaniu, pojawia się błąd E21'"
            className="flex-1 min-h-[96px] rounded-2xl border p-3 outline-none"
          />
          <button
            onClick={handleDiagnose}
            disabled={loading || !problemText.trim()}
            className="whitespace-nowrap rounded-2xl px-4 py-3 bg-black text-white disabled:opacity-40"
          >
            {loading ? "Analizuję..." : "Diagnozuj AI"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 text-red-700 p-3">
            {error}
          </div>
        )}

        {result && (
          <>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTab("advice")}
                className={`px-3 py-2 rounded-xl border ${tab === "advice" ? "bg-black text-white" : ""}`}
              >
                Samodzielnie
              </button>
              <button
                onClick={() => setTab("order")}
                className={`px-3 py-2 rounded-xl border ${tab === "order" ? "bg-black text-white" : ""}`}
              >
                Zlecenie
              </button>
              <button
                onClick={() => setTab("providers")}
                className={`px-3 py-2 rounded-xl border ${tab === "providers" ? "bg-black text-white" : ""}`}
              >
                Wykonawcy
              </button>
            </div>

            {tab === "advice" && (
              <div className="space-y-3">
                <div className="text-sm opacity-70">
                  Ryzyko: <b>{advice?.risk_level}</b> • Pilność: <b>{advice?.recommended_urgency}</b>
                </div>

                {/* Safety Gate */}
                {(() => {
                  const danger = result?.dangerFlags || [];
                  const hasElectricity = danger.includes('electricity');
                  const hasGas = danger.includes('gas');

                  if ((hasElectricity || hasGas) && !safetyConfirmed) {
                    return (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="font-semibold mb-2 text-amber-800">⚠️ Bezpieczeństwo przede wszystkim</div>
                        {hasElectricity && <div className="text-amber-700 mb-2">Potwierdź: <strong>Wyłączyłem prąd / bezpiecznik</strong>.</div>}
                        {hasGas && <div className="text-amber-700 mb-2">Potwierdź: <strong>Zakręciłem gaz i wywietrzyłem pomieszczenie</strong>.</div>}
                        <button
                          className="btn btn-primary"
                          onClick={() => setSafetyConfirmed(true)}
                        >
                          Potwierdzam – można działać
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* DIY Steps */}
                {safetyConfirmed && (
                  <div className="space-y-3">
                    {(result?.diySteps || []).map((step, i) => (
                      <label key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!step.done}
                          onChange={async (e) => {
                            // PATCH /api/ai/drafts/:id/steps
                            if (result?.draftId) {
                              try {
                                await fetch(`/api/ai/drafts/${result.draftId}/steps`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ index: i, done: e.target.checked })
                                });
                              } catch (error) {
                                console.error('Error updating step:', error);
                              }
                            }
                          }}
                          className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className={`flex-1 leading-relaxed ${step.done ? 'line-through text-gray-500' : ''}`}>
                          {step.text}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Parts Box */}
                {result?.parts?.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-white">
                    <div className="font-semibold mb-1">🛒 Części przydatne do naprawy</div>
                    <ul className="text-sm space-y-1">
                      {result.parts.map((p,idx)=>(
                        <li key={idx} className="flex items-center justify-between">
                          <span>{p.name} × {p.qty}</span>
                          <span className="text-gray-500">{p.approxPrice} {p.unit}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-xs text-gray-500 mt-2">
                      Kupisz w popularnych marketach (Castorama / OBI / Leroy Merlin).
                    </div>
                  </div>
                )}
                
                {/* Przycisk eskaluj jeśli kroki nie pomogły */}
                {result?.diySteps?.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-3">
                      Zaznacz kroki, które już wykonałeś. Jeśli problem nadal występuje, możemy wystawić zlecenie.
                    </div>
                    <button
                      onClick={() => {
                        // Przejdź do zakładki order i wypełnij dane
                        setTab("order");
                        // Można też dodać logikę auto-eskalacji
                      }}
                      className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      {completedSteps.size > 0 
                        ? `Nie pomogło (${completedSteps.size}/${result.diySteps.length} kroków wykonanych) — wyślij zlecenie`
                        : "Nie pomogło — wyślij zlecenie"
                      }
                    </button>
                  </div>
                )}

                {/* Follow-up Banner */}
                {showEscalateBanner && (
                  <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                    <div className="text-indigo-800">Nie idzie? Możemy wystawić zlecenie jednym kliknięciem.</div>
                    <button className="btn btn-primary" onClick={() => setTab("order")}>Wyślij zlecenie</button>
                  </div>
                )}

                {result?.followups?.length ? (
                  <div className="mt-4">
                    <div className="font-semibold mb-2">Doprecyzuj:</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {result.followups.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            {tab === "order" && (
              <div className="space-y-3">
                <div className="grid gap-3">
                  <input
                    className="rounded-xl border p-3"
                    value={order?.title || ""}
                    onChange={(e) => (result.order.title = e.target.value) || null}
                    placeholder="Tytuł zlecenia"
                  />
                  <textarea
                    className="rounded-xl border p-3 min-h-[120px]"
                    value={order?.description || ""}
                    onChange={(e) => (result.order.description = e.target.value) || null}
                    placeholder="Opis zlecenia"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      className="rounded-xl border p-3"
                      value={order?.budget_hint?.min ?? ""}
                      onChange={(e) => (result.order.budget_hint.min = Number(e.target.value) || null)}
                      placeholder="Budżet min (PLN)"
                      type="number"
                    />
                    <input
                      className="rounded-xl border p-3"
                      value={order?.budget_hint?.max ?? ""}
                      onChange={(e) => (result.order.budget_hint.max = Number(e.target.value) || null)}
                      placeholder="Budżet max (PLN)"
                      type="number"
                    />
                    <div className="col-span-1 grid grid-cols-2 gap-2">
                      <select
                        className="rounded-xl border p-3"
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value)}
                      >
                        <option value="normal">Normalnie</option>
                        <option value="today">Dziś</option>
                        <option value="now">Teraz (awaria)</option>
                      </select>
                      <input
                        className="rounded-xl border p-3"
                        value={order?.location?.city ?? ""}
                        onChange={(e) => {
                          result.order.location = result.order.location || {};
                          result.order.location.city = e.target.value;
                        }}
                        placeholder="Miasto"
                      />
                    </div>
                  </div>
                </div>

                {/* WIDEŁKI CEN – AI Pricing */}
                <div className="rounded-2xl border p-4 bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">Widełki cen (Twoja okolica)</div>
                    {pricing.loading && <div className="text-sm opacity-60">Liczenie…</div>}
                  </div>
                  {pricing.error && (
                    <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-2">
                      {pricing.error}
                    </div>
                  )}
                  {pricing.bands && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm opacity-70">
                        Próba: {pricing.bands.stats.sample} • Pilność: <b>{urgency}</b>
                      </div>
                      <div className="text-sm">
                        Min: <b>{pricing.bands.stats.adjusted.min} zł</b> · p25: <b>{pricing.bands.stats.adjusted.p25 ?? "—"}{pricing.bands.stats.adjusted.p25 ? " zł" : ""}</b> · Mediana: <b>{pricing.bands.stats.adjusted.med} zł</b> · p75: <b>{pricing.bands.stats.adjusted.p75 ?? "—"}{pricing.bands.stats.adjusted.p75 ? " zł" : ""}</b> · Max: <b>{pricing.bands.stats.adjusted.max} zł</b>
                      </div>
                      <BudgetSlider
                        min={pricing.bands.recommended.min}
                        max={pricing.bands.recommended.max}
                        value={order?.budget_hint?.max ?? pricing.bands.recommended.midpoint}
                        onChange={(v) => {
                          result.order.budget_hint = result.order.budget_hint || { currency: "PLN" };
                          result.order.budget_hint.max = Math.round(v);
                          if (!result.order.budget_hint.min) {
                            result.order.budget_hint.min = Math.round(v * 0.6);
                          }
                        }}
                      />
                      <div className="text-sm opacity-70">
                        Sugerujemy budżet: <b>{(order?.budget_hint?.max ?? pricing.bands.recommended.midpoint)} zł</b>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateOrder}
                    className="rounded-2xl px-4 py-3 bg-black text-white"
                  >
                    Utwórz zlecenie (OPEN)
                  </button>
                </div>
              </div>
            )}

            {tab === "providers" && (
              <div className="space-y-3">
                {!providers?.length && (
                  <div className="text-sm opacity-70">Szukam najlepszych wykonawców…</div>
                )}
                {providers?.map((p) => (
                  <MiniProviderCard key={p._id || p.id} p={p} onSelect={selectProviderAndCreate} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BudgetSlider({ min, max, value, onChange }) {
  if (min == null || max == null || min >= max) return null;
  const [v, setV] = useState(value ?? Math.round((min + max) / 2));
  useEffect(() => {
    setV(value ?? Math.round((min + max) / 2));
  }, [min, max, value]);

  return (
    <div className="mt-2">
      <input
        type="range"
        min={min}
        max={max}
        value={v}
        onChange={(e) => {
          const nv = Number(e.target.value);
          setV(nv);
          onChange?.(nv);
        }}
        className="w-full"
      />
      <div className="flex justify-between text-xs opacity-70">
        <span>{min} zł</span>
        <span>{v} zł</span>
        <span>{max} zł</span>
      </div>
    </div>
  );
}


