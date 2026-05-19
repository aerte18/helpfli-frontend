import { useState } from "react";
import { apiUrl } from "@/lib/apiUrl";
import { Phone, Lock } from "lucide-react";

/**
 * Klient: płatne odblokowanie kontaktu po wyborze wykonawcy (tryb offers_only).
 */
export default function OrderContactUnlockCard({ orderId, feePln = 24, onUnlocked }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startUnlock = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/payments/create-contact-unlock-intent"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Nie udało się rozpocząć płatności");

      if (data.waived || data.contactUnlocked) {
        onUnlocked?.();
        return;
      }

      if (data.clientSecret && data.paymentIntentId) {
        const pi = encodeURIComponent(data.paymentIntentId);
        const cs = encodeURIComponent(data.clientSecret);
        const fee = data.contactUnlockFeePln || feePln;
        window.location.href = `/checkout/${encodeURIComponent(orderId)}?pi=${pi}&cs=${cs}&kind=contact_unlock&fee=${fee}`;
        return;
      }
      throw new Error("Brak danych płatności");
    } catch (e) {
      setError(e.message || "Błąd płatności");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-violet-200 bg-violet-50/90 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Lock className="w-5 h-5 text-violet-700 shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="font-semibold text-violet-950">Odblokuj kontakt do wykonawcy</p>
          <p className="text-sm text-violet-900/90 mt-1">
            Wybrałeś wykonawcę. Opłać jednorazowo <strong>{feePln} zł</strong>, aby zobaczyć telefon i e-mail.
            W pakiecie <strong>Helpfli PRO (klient)</strong> kontakt jest w cenie.
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="button"
        onClick={startUnlock}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-700 text-white text-sm font-medium hover:bg-violet-800 disabled:opacity-50"
      >
        <Phone className="w-4 h-4" aria-hidden />
        {loading ? "Przekierowanie…" : `Odblokuj kontakt — ${feePln} zł`}
      </button>
    </div>
  );
}
