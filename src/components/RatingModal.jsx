import { apiUrl } from "@/lib/apiUrl";
import { useState, useEffect } from 'react';
import { useToast } from './toast/ToastProvider';
import { getErrorMessage } from '../utils/errorMessages';

export default function RatingModal({ open, onClose, providerId, orderId, onSubmitted }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const { push: toast } = useToast();

  // Keyboard: Esc zamyka modal
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !busy) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, busy, onClose]);

  if (!open) return null;

  const submit = async () => {
    if (!providerId || !stars) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl('/api/ratings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ ratedUser: providerId, rating: stars, comment, orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Błąd zapisu oceny');
      onSubmitted?.(data);
      toast({
        title: "Ocena dodana",
        description: "Dziękujemy za opinię!",
        variant: "success"
      });
      onClose();
    } catch (e) {
      toast({
        title: "Błąd dodawania oceny",
        description: getErrorMessage(e),
        variant: "error"
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-modal-title"
    >
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
        aria-label="Zamknij modal"
      />
      <div className="absolute inset-x-0 top-[15%] mx-auto max-w-md qs-card shadow-2xl p-8">
        <h3 id="rating-modal-title" className="text-2xl font-bold text-[var(--qs-color-text)] mb-6">Oceń wykonawcę</h3>
        <div className="flex items-center gap-2 mb-5">
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              onClick={() => setStars(n)}
              className={`text-3xl transition-transform hover:scale-110 ${n <= stars ? 'text-amber-400' : 'text-gray-300'}`}
              aria-label={`Oceń ${n} ${n === 1 ? 'gwiazdką' : 'gwiazdkami'}`}
              aria-pressed={n <= stars}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Dodaj komentarz (opcjonalnie)"
          className="w-full border border-[var(--qs-color-border)] rounded-xl p-3 h-28 mb-6 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-[var(--qs-color-text)]"
        />
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={busy}
            className="qs-btn qs-btn-outline text-sm !px-5 !py-2.5 disabled:opacity-50"
            aria-label="Anuluj"
          >
            Anuluj
          </button>
          <button 
            onClick={submit} 
            disabled={busy} 
            className="qs-btn qs-btn-primary text-sm !px-6 !py-2.5 disabled:opacity-50"
            aria-label="Wyślij ocenę"
          >
            {busy ? 'Wysyłanie...' : 'Wyślij'}
          </button>
        </div>
      </div>
    </div>
  );
}



