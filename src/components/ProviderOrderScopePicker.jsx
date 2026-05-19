import { Building2, ClipboardList, Clock } from "lucide-react";

export default function ProviderOrderScopePicker({ value = "both", onChange, name = "providerOrderScope" }) {
  const options = [
    { value: "quick_only", title: "Szybkie zlecenia", icon: Clock, iconClass: "text-slate-600", description: "Hydraulik, elektryk, sprzątanie itd. Bez dużych projektów w trybie „tylko oferty”." },
    { value: "large_only", title: "Duże projekty (tylko oferty)", icon: Building2, iconClass: "text-indigo-600", description: "Budowa, generalny remont, zbieranie wycen — kontakt poza platformą." },
    { value: "both", title: "Oba typy", icon: ClipboardList, iconClass: "text-indigo-600", description: "Widzisz wszystkie otwarte zlecenia — szybkie usługi i duże projekty." },
  ];

  return (
    <div className="space-y-3 text-left">
      <p className="text-sm text-gray-600">Jakie zlecenia chcesz widzieć na liście i w podpowiedziach AI?</p>
      {options.map((opt) => {
        const Icon = opt.icon;
        return (
          <label key={opt.value} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-400 transition-colors">
            <input type="radio" name={name} value={opt.value} checked={value === opt.value} onChange={(e) => onChange?.(e.target.value)} className="mt-1" />
            <div className="flex-1">
              <div className="font-medium text-slate-900 flex items-center gap-2">
                <Icon className={`w-5 h-5 shrink-0 ${opt.iconClass}`} aria-hidden />
                <span>{opt.title}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">{opt.description}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}

