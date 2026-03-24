import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQ_ITEMS = [
  { q: "Czy Helpfli jest darmowe dla klientów?", a: "Tak, przeglądanie ofert i zapytań jest bezpłatne. Płacisz tylko za wykonaną usługę." },
  { q: "Czy mogę dostać fakturę?", a: "Użyj filtra „Firma” i wybierz wykonawcę z oznaczeniem Firma. Informacja jest widoczna w profilu." },
  { q: "Jak działa gwarancja?", a: "Przy płatności w systemie środki są blokowane i zwalniane dopiero po akceptacji wykonania." }
];

export default function MiniFAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Najczęstsze pytania</h2>
          <p className="text-slate-500 mt-2">Krótko o tym, jak działa Helpfli.</p>
        </div>

        <div className="qs-card p-0 divide-y divide-[var(--qs-color-border)]">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = open === idx;
            return (
              <button
                key={item.q}
                className="w-full px-6 py-5 text-left flex items-start gap-4"
                onClick={() => setOpen(isOpen ? null : idx)}
              >
                <div className="flex-1">
                  <p className="font-semibold text-[var(--qs-color-text)]">{item.q}</p>
                  {isOpen && (
                    <p className="text-sm text-[var(--qs-color-muted)] mt-2 leading-relaxed">
                      {item.a}
                    </p>
                  )}
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-indigo-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
