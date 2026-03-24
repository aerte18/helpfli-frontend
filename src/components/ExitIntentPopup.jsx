import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ExitIntentPopup({ onStartTrial }) {
  const [show, setShow] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Sprawdź czy użytkownik już widział popup (localStorage)
    const hasSeenPopup = localStorage.getItem('exitIntentPopupShown');
    if (hasSeenPopup || hasShown) return;

    // Sprawdź czy użytkownik jest zalogowany i nie ma PRO
    if (!user) return;

    const handleMouseLeave = (e) => {
      // Wykryj ruch myszy w górę (exit intent)
      if (e.clientY <= 0) {
        setShow(true);
        setHasShown(true);
        localStorage.setItem('exitIntentPopupShown', 'true');
      }
    };

    // Dodaj event listener tylko na stronie subskrypcji
    if (window.location.pathname.includes('/subscriptions') || 
        window.location.pathname.includes('/account/subscriptions')) {
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [user, hasShown]);

  if (!show) return null;

  const handleStartTrial = () => {
    if (onStartTrial) {
      // Znajdź plan PRO dla użytkownika
      const audience = user?.role === 'provider' ? 'provider' : 'client';
      // Tutaj można przekazać planKey, ale na razie przekierujmy do strony subskrypcji
      navigate(`/account/subscriptions?audience=${audience}`);
      setShow(false);
    }
  };

  const handleClose = () => {
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
      <div 
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 relative animate-in fade-in zoom-in-95 duration-300" 
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900">
            Czekaj! 🎁
          </h3>
          
          <p className="text-gray-600">
            Wypróbuj PRO za darmo przez 7 dni i zobacz jak możesz oszczędzać na platform fee i zarabiać więcej!
          </p>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-orange-900">
              <Sparkles className="w-4 h-4" />
              <span>Nielimitowane odpowiedzi</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-orange-900">
              <Sparkles className="w-4 h-4" />
              <span>Oszczędzaj do 15% na platform fee</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-orange-900">
              <Sparkles className="w-4 h-4" />
              <span>Priorytet w wynikach wyszukiwania</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Może później
            </button>
            <button
              onClick={handleStartTrial}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-colors shadow-lg"
            >
              Wypróbuj za darmo
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Anuluj w każdej chwili. Bez zobowiązań.
          </p>
        </div>
      </div>
    </div>
  );
}
