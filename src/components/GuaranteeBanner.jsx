import { AlertCircle, ShieldCheck, FileText } from "lucide-react";

export default function GuaranteeBanner({ eligible, reasons = [], compact = false, orderStatus = null }) {
  // Dla nowych zleceń (open) nie pokazuj gwarancji w ogóle
  if (orderStatus === 'open') {
    return (
      <div className={`rounded-xl border p-4 ${compact ? "bg-blue-50 border-blue-200" : "bg-blue-50 border-blue-200"} shadow-sm`}>
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold">Zlecenie oczekuje na propozycje</div>
            <p className="text-sm text-blue-800">
              Wykonawcy mogą składać propozycje. Po wyborze wykonawcy i płatności w systemie otrzymasz Gwarancję Helpfli.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (eligible) {
    return (
      <div className={`rounded-xl border p-4 ${compact ? "bg-emerald-50 border-emerald-200" : "bg-emerald-50 border-emerald-200"} shadow-sm`}>
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold">Gwarancja Helpfli aktywna</div>
            <p className="text-sm text-emerald-800">
              Twoje zlecenie jest objęte ochroną — płatność przez system + zweryfikowany wykonawca.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 ${compact ? "bg-amber-50 border-amber-200" : "bg-amber-50 border-amber-200"} shadow-sm`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-semibold">Gwarancja Helpfli nieaktywna</div>
          <ul className="mt-1 list-disc pl-5 text-sm text-amber-800">
            {reasons.length ? reasons.map((r, i) => <li key={i}>{r}</li>) : (
              <li>Spełnij warunki, aby aktywować ochronę.</li>
            )}
          </ul>
          <p className="mt-2 text-xs text-amber-700">
            Aktywuj płatność w systemie i wybierz zweryfikowanego wykonawcę, aby włączyć ochronę.
          </p>
        </div>
      </div>
    </div>
  );
}