import { ShieldCheck, CreditCard, Star } from "lucide-react";

const items = [
  {
    Icon: ShieldCheck,
    title: "Bezpiecznie",
    desc: "Zweryfikowani wykonawcy, ochrona zlecenia i raport po realizacji."
  },
  {
    Icon: CreditCard,
    title: "Płatność z gwarancją",
    desc: "Rozliczysz się wygodnie – środki uwalniane po potwierdzeniu."
  },
  {
    Icon: Star,
    title: "Jakość potwierdzona",
    desc: "Prawdziwe opinie, ranking \"Quality\" i szybka weryfikacja."
  }
];

export default function WhyHelpfli() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
            dlaczego helpfli
          </p>
          <h2 className="text-3xl font-bold text-slate-900 mt-3">Dlaczego użytkownicy wracają?</h2>
          <p className="text-slate-500 mt-2 max-w-2xl mx-auto">
            Łączymy szybkie zamawianie usług z bezpieczeństwem i wiarygodnymi opiniami.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
        {items.map(({ Icon, title, desc }) => (
            <article
              key={title}
              className="qs-card border-0 bg-gradient-to-br from-white to-indigo-50/40 p-6 transition hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-lg font-semibold text-slate-900">{title}</div>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{desc}</p>
            </article>
        ))}
      </div>
      </div>
    </section>
  );
}



























