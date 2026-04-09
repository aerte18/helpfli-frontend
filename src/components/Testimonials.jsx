import { Star } from "lucide-react";

const TESTIMONIALS = [
  { name: "Kasia", text: "Hydraulik był u mnie w 40 minut. Helpfli naprawdę działa szybciej niż telefon do znajomego.", rating: 5 },
  { name: "Marek", text: "Czysto, terminowo i z gwarancją. Powiadomienia o statusie zlecenia dają spokój.", rating: 5 },
  { name: "Ola", text: "Świetna komunikacja i płatność w systemie. Czułam się bezpiecznie na każdym etapie.", rating: 5 }
];

export default function Testimonials() {
  return (
    <section className="bg-[var(--qs-color-bg-soft)] py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">social proof</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-3">Klienci polecają Helpfli</h2>
          <p className="text-slate-500 mt-2">5.0 / 5.0  Średnia z ostatnich 200 zleceń w Warszawie</p>
        </div>

        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-thin scrollbar-thumb-indigo-200/60">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="min-w-[280px] max-w-sm snap-start qs-card-soft border border-white/60 backdrop-blur-lg p-6"
            >
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-base text-slate-800 mt-3 leading-relaxed">{t.text}</p>
              <div className="mt-4 text-sm font-semibold text-slate-600"> {t.name}</div>
            </article>
          ))}
        </div>
        <p className="mt-2 text-center text-xs font-medium text-slate-500 md:hidden">
          ← Przesuń palcem w bok, aby zobaczyć więcej opinii →
        </p>
      </div>
    </section>
  );
}
