import React from "react";

export default function HowItWorks() {
  const steps = [
    {
      title: "Opisz problem",
      text: "Krótko napisz co się dzieje. Możesz dodać zdjęcia lub film.",
      emoji: "📝"
    },
    {
      title: "AI diagnozuje",
      text: "Otrzymasz wskazówki, widełki ceny i propozycję zlecenia.",
      emoji: "🤖"
    },
    {
      title: "Publikujesz zlecenie",
      text: "Wykonawcy odpowiadają, a Ty wybierasz najlepszą ofertę.",
      emoji: "✅"
    }
  ];

  return (
    <section className="py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Jak to działa</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-2xl mb-2">{s.emoji}</div>
              <div className="font-medium text-gray-900 mb-1">{s.title}</div>
              <div className="text-sm text-gray-600">{s.text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
