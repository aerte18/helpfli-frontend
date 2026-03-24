import { Wrench, Zap, Sparkles, Hammer, Flower, MonitorSmartphone, Home, Car, Heart, Bug, Truck, Trash2, Flame, Lock } from "lucide-react";

const items = [
  { key: "hydraulika", label: "Hydraulika", Icon: Wrench },
  { key: "elektryka", label: "Elektryka", Icon: Zap },
  { key: "agd", label: "AGD i RTV", Icon: MonitorSmartphone },
  { key: "hvac", label: "Klimatyzacja i ogrzewanie", Icon: Flame },
  { key: "remont", label: "Remont i wykończenia", Icon: Home },
  { key: "montaz", label: "Montaż i stolarka", Icon: Hammer },
  { key: "slusarz", label: "Ślusarz i zabezpieczenia", Icon: Lock },
  { key: "sprzatanie", label: "Sprzątanie", Icon: Sparkles },
  { key: "ogrod", label: "Ogród i zew.", Icon: Flower },
  { key: "auto", label: "Auto mobilnie", Icon: Car },
  { key: "it", label: "IT i Smart home", Icon: MonitorSmartphone },
  { key: "zdrowie", label: "Zdrowie (tele)", Icon: Heart },
  { key: "zwierzeta", label: "Zwierzęta (tele)", Icon: Heart },
  { key: "dezynsekcja", label: "Dezynsekcja / szkodniki", Icon: Bug },
  { key: "transport", label: "Przeprowadzki i transport", Icon: Truck },
  { key: "gaz", label: "Gaz / instalacje", Icon: Flame },
  { key: "wywoz", label: "Wywóz / utylizacja", Icon: Trash2 },
  { key: "awaryjne", label: "Awaryjne 24/7", Icon: Flame },
  { key: "inne", label: "Inne / nie na liście", Icon: Wrench },
];

export default function QuickFilters({ value, onChange }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-2">
      {items.map(({ key, label, Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange?.(active ? null : key)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border transition
            ${active ? "bg-blue-600 text-white border-blue-600 shadow" : "bg-white border-slate-200 hover:bg-slate-50"}`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
