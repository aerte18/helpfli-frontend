import { Link } from "react-router-dom";
import { BadgeCheck, MessageSquareText, ShieldCheck } from "lucide-react";

const ITEMS = [
  {
    Icon: BadgeCheck,
    title: "Jawny status weryfikacji",
    text: "Znaczek weryfikacji pokazujemy tylko przy profilach, które przeszły wymagany proces.",
  },
  {
    Icon: MessageSquareText,
    title: "Opinie i historia profilu",
    text: "Przed wyborem sprawdzisz oceny, liczbę opinii i informacje podane przez wykonawcę.",
  },
  {
    Icon: ShieldCheck,
    title: "Ochrona płatności do wyboru",
    text: "Przy rozliczeniu przez Helpfli otrzymujesz ochronę płatności i możliwość zgłoszenia problemu.",
  },
];

export default function TrustSignals({ compact = false, className = "" }) {
  return (
    <section
      aria-label="Dlaczego możesz zaufać Helpfli"
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${
        compact ? "p-4" : "p-5 sm:p-6"
      } ${className}`.trim()}
    >
      <div className={`grid gap-4 ${compact ? "sm:grid-cols-3" : "md:grid-cols-3"}`}>
        {ITEMS.map(({ Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs">
        <Link to="/reviews" className="font-medium text-indigo-700 hover:underline">
          Jak działają opinie
        </Link>
        <Link to="/help" className="font-medium text-indigo-700 hover:underline">
          Zasady ochrony płatności
        </Link>
        <Link to="/regulamin" className="font-medium text-indigo-700 hover:underline">
          Regulamin
        </Link>
      </div>
    </section>
  );
}
