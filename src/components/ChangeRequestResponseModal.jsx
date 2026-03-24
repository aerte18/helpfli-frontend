import { useState } from "react";
import { X, Check, XCircle } from "lucide-react";

export default function ChangeRequestResponseModal({ 
  isOpen, 
  onClose, 
  changeRequest,
  onAccept,
  onReject
}) {
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [action, setAction] = useState(null); // 'accept' or 'reject'

  if (!isOpen || !changeRequest) return null;

  const handleAccept = async () => {
    setAction('accept');
    setProcessing(true);
    try {
      await onAccept(changeRequest._id, message);
      onClose();
      setMessage("");
    } catch (err) {
      alert(err.message || "Błąd akceptacji dopłaty");
    } finally {
      setProcessing(false);
      setAction(null);
    }
  };

  const handleReject = async () => {
    setAction('reject');
    setProcessing(true);
    try {
      await onReject(changeRequest._id, message);
      onClose();
      setMessage("");
    } catch (err) {
      alert(err.message || "Błąd odrzucenia dopłaty");
    } finally {
      setProcessing(false);
      setAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              💰 Propozycja dopłaty
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Wykonawca proponuje dopłatę do zlecenia
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Kwota */}
          <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
            <div className="text-sm text-indigo-700 mb-1">Kwota dopłaty</div>
            <div className="text-2xl font-bold text-indigo-900">
              {changeRequest.amount} zł
            </div>
          </div>

          {/* Powód */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Powód dopłaty
            </label>
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
              {changeRequest.reason}
            </div>
          </div>

          {/* Typ */}
          {changeRequest.type && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-900">
                Typ
              </label>
              <div className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">
                {changeRequest.type === 'additional_work' && 'Dodatkowe prace'}
                {changeRequest.type === 'materials' && 'Materiały / części'}
                {changeRequest.type === 'unexpected_issue' && 'Nieoczekiwany problem'}
                {changeRequest.type === 'other' && 'Inne'}
              </div>
            </div>
          )}

          {/* Wiadomość (opcjonalna) */}
          <div className="space-y-2">
            <label htmlFor="response-message" className="block text-sm font-medium text-slate-900">
              Twoja wiadomość (opcjonalnie)
            </label>
            <textarea
              id="response-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Możesz dodać komentarz do swojej decyzji..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Info */}
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-sm text-yellow-900">
              <strong>Pamiętaj:</strong> Jeśli zaakceptujesz dopłatę, kwota zostanie dodana do zlecenia i będzie chroniona przez Helpfli Protect (jeśli płatność przez system).
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleReject}
              disabled={processing}
              className="flex-1 px-4 py-3 rounded-lg border border-red-300 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              {processing && action === 'reject' ? "Odrzucam..." : "Odrzuć"}
            </button>
            <button
              onClick={handleAccept}
              disabled={processing}
              className="flex-1 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {processing && action === 'accept' ? "Akceptuję..." : "Zaakceptuj"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

