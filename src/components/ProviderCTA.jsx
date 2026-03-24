import { Link } from "react-router-dom";

export default function ProviderCTA() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="rounded-3xl p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Jesteś wykonawcą? Dołącz do Helpfli!</h3>
            <p className="text-white/90 text-sm mt-1">Zdobądź nowych klientów w okolicy i zarabiaj więcej.</p>
          </div>
          <Link
            to="/register"
            className="px-5 py-3 rounded-xl bg-white text-slate-900 font-medium hover:opacity-90"
          >
            Załóż konto wykonawcy
          </Link>
        </div>
      </div>
    </section>
  );
}

