import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // proste stany formularzy
  const [services, setServices] = useState([]); // id usług
  const [priceNote, setPriceNote] = useState("");
  const [bio, setBio] = useState("");
  const [headline, setHeadline] = useState("");

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const saveStep = async () => {
    setSaving(true);
    try {
      if (step === 1) {
        // dodaj wybrane usługi
        await fetch("/api/user-services", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ services }), // [{serviceId}, ...] – dopasuj do Twojego formatu
        });
        
        // Ustaw główną usługę (pierwszą wybraną) jako string
        if (services.length > 0) {
          // Pobierz nazwę pierwszej usługi
          const firstServiceRes = await fetch(`/api/services/${services[0]}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (firstServiceRes.ok) {
            const firstService = await firstServiceRes.json();
            await fetch("/api/users/me/profile", {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ service: firstService.name }),
            });
          }
        }
      }
      if (step === 2) {
        await fetch("/api/users/me/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ priceNote, bio, headline }),
        });
      }
      if (step < 2) {
        setStep(step + 1);
      } else {
        // Ostatni krok — przekieruj do panelu
        navigate("/provider");
      }
    } finally {
      setSaving(false);
    }
  };

  const finishOnboarding = async () => {
    // oznacz zakończony onboarding
    await fetch("/api/users/me/onboarding", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ onboardingCompleted: true }),
    });
    navigate("/account"); // albo na /home
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">Witaj w Helpfli</h1>
      <p className="text-slate-600 mb-4">Ustaw podstawy profilu wykonawcy — zajmie to 1–2 minuty.</p>

      <div className="bg-white rounded-2xl shadow p-4 space-y-4">
        <Progress step={step} />

        {step === 1 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Krok 1: Wybierz usługi</h2>
            {/* Minimalny multiselect – dopnij do /api/services */}
            <MultiSelect services={services} setServices={setServices} token={token} />
            <div className="flex gap-2">
              <button onClick={saveStep} disabled={saving} className="px-4 py-2 rounded-xl bg-slate-900 text-white">
                Zapisz i dalej
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Krok 2: Cennik i opis</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Krótki nagłówek (do 60 znaków) *</label>
              <input
                className="w-full p-3 border rounded-lg"
                value={headline}
                onChange={(e) => setHeadline(e.target.value.slice(0, 60))}
                placeholder="np. 10+ lat doświadczenia. Szybkie naprawy."
                maxLength={60}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{headline.length}/60 znaków - Będzie widoczny w karcie</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pełny opis usług *</label>
              <textarea
                className="w-full p-3 border rounded-lg"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Szczegółowy opis doświadczenia i specjalizacji"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Pełny opis będzie w szczegółach profilu</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Informacja o cenach *</label>
              <input
                className="w-full p-3 border rounded-lg"
                value={priceNote}
                onChange={(e) => setPriceNote(e.target.value)}
                placeholder="Np. Wycena po oględzinach, minimalna stawka 80 zł"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Ta informacja będzie widoczna w Twoim profilu</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded-xl bg-slate-100">Wstecz</button>
              <button onClick={saveStep} disabled={saving} className="px-4 py-2 rounded-xl bg-slate-900 text-white">
                Zapisz i dalej
              </button>
            </div>
          </section>
        )}

        {step >= 4 && (
          <section className="text-center space-y-3">
            <h2 className="text-lg font-semibold">Gotowe!</h2>
            <p className="text-slate-600">Twój profil jest przygotowany. Możesz przyjmować zlecenia.</p>
            <button onClick={finishOnboarding} className="px-5 py-2 rounded-xl bg-blue-600 text-white">
              Przejdź do panelu
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

function Progress({ step }) {
  const pct = Math.min(((step - 1) / 2) * 100, 100);
  return (
    <div>
      <div className="h-2 w-full bg-slate-100 rounded">
        <div className="h-2 rounded bg-blue-600" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-slate-500 mt-1">Krok {Math.min(step, 2)} z 2</div>
    </div>
  );
}

function MultiSelect({ services, setServices, token }) {
  const [all, setAll] = useState([]);
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAll(data || []);
    })();
  }, [token]);

  const toggle = (id) => {
    setServices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {all.map((s) => (
        <button
          key={s._id || s.id}
          type="button"
          onClick={() => toggle(s._id || s.id)}
          className={`px-3 py-2 rounded-xl border text-sm ${
            services.includes(s._id || s.id) ? "bg-blue-50 border-blue-300" : "hover:bg-slate-50"
          }`}
        >
          {s.name || s.title}
        </button>
      ))}
    </div>
  );
}







