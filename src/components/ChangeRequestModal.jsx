import { useState } from "react";
import { X } from "lucide-react";

export default function ChangeRequestModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  orderId 
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState("additional_work");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!amount || parseFloat(amount) <= 0) {
      setError("Kwota musi być większa od 0");
      return;
    }

    if (!reason || reason.trim().length < 10) {
      setError("Powód dopłaty musi mieć co najmniej 10 znaków");
      return;
    }

    setSending(true);
    try {
      await onSubmit({
        amount: parseFloat(amount),
        reason: reason.trim(),
        type
      });
      // Reset form
      setAmount("");
      setReason("");
      setType("additional_work");
      onClose();
    } catch (err) {
      setError(err.message || "Błąd wysyłania propozycji dopłaty");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-200 bg-white rounded-t-2xl">
          <h2 className="text-xl font-semibold text-slate-900">
            ➕ Zaproponuj dopłatę
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Kwota dopłaty */}
          <div className="space-y-2">
            <label htmlFor="change-amount" className="block text-sm font-medium text-slate-900">
              Kwota dopłaty *
            </label>
            <div className="relative">
              <input
                id="change-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="np. 80"
                required
                className="w-full h-11 px-4 pr-16 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">PLN</span>
            </div>
            <p className="text-xs text-slate-500">
              Kwota zostanie dodana do pierwotnej ceny zlecenia
            </p>
          </div>

          {/* Typ dopłaty */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Typ dopłaty
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="additional_work">Dodatkowe prace</option>
              <option value="materials">Materiały / części</option>
              <option value="unexpected_issue">Nieoczekiwany problem</option>
              <option value="other">Inne</option>
            </select>
          </div>

          {/* Powód dopłaty */}
          <div className="space-y-2">
            <label htmlFor="change-reason" className="block text-sm font-medium text-slate-900">
              Powód dopłaty * (min. 10 znaków)
            </label>
            <textarea
              id="change-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Opisz szczegółowo, dlaczego potrzebna jest dopłata. Klient musi zrozumieć powód."
              rows={4}
              required
              minLength={10}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-500">
              {reason.length}/10 znaków (minimum)
            </p>
          </div>

          {/* Info */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Jak to działa:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-xs text-blue-800 list-disc list-inside">
              <li>Klient otrzyma powiadomienie o dopłacie</li>
              <li>Klient może zaakceptować, odrzucić lub zapytać na czacie</li>
              <li>Jeśli zaakceptuje, kwota zostanie dodana do zlecenia</li>
              <li>Jeśli odrzuci, realizujesz zlecenie zgodnie z pierwotnym zakresem</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors font-medium"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={sending || !amount || !reason || reason.length < 10}
              className="flex-1 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {sending ? "Wysyłam..." : "Wyślij propozycję"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

