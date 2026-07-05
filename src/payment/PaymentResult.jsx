import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiPost } from '../lib/api';
import { useTelemetry } from '../hooks/useTelemetry';

export default function PaymentResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [duplicatesReleased, setDuplicatesReleased] = useState(0);
  const { trackPayment } = useTelemetry();
  const paymentTracked = useRef(false);

  const reportPayment = (orderId, success) => {
    if (paymentTracked.current || !orderId) return;
    paymentTracked.current = true;
    trackPayment(orderId, null, 'stripe', success);
  };

  useEffect(() => {
    const redirectStatus = searchParams.get('redirect_status');
    const paymentIntentId = searchParams.get('payment_intent');
    const orderId = searchParams.get('orderId') || searchParams.get('orderid');

    if (!paymentIntentId && !redirectStatus) {
      setStatus('error');
      setMessage('Brak informacji o płatności w adresie URL.');
      return;
    }

    if (redirectStatus === 'succeeded') {
      setStatus('success');
      setMessage('Płatność przyjęta — środki są zabezpieczone w escrow do zakończenia zlecenia.');
      reportPayment(orderId, true);
    } else if (redirectStatus === 'processing') {
      setStatus('processing');
      setMessage('Płatność jest przetwarzana…');
      return;
    } else if (redirectStatus) {
      setStatus('error');
      setMessage('Płatność nie powiodła się.');
      reportPayment(orderId, false);
      return;
    }

    if (!paymentIntentId) {
      setStatus('error');
      setMessage('Brak identyfikatora płatności. Otwórz zlecenie z konta.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await apiPost('/api/payments/complete-return', {
          paymentIntentId,
          orderId: orderId || undefined,
        });
        if (cancelled) return;

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Płatność zakończona pomyślnie!');
          reportPayment(orderId || data.orderId, true);
          if (data.duplicatesCanceled > 0) {
            setDuplicatesReleased(data.duplicatesCanceled);
          }
        } else if (redirectStatus === 'succeeded') {
          setStatus('success');
          setMessage('Płatność przyjęta. Odśwież stronę zlecenia, jeśli status się nie zmienił.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Nie udało się potwierdzić płatności.');
          reportPayment(orderId, false);
        }
      } catch (error) {
        console.error('complete-return:', error);
        if (cancelled) return;
        if (redirectStatus === 'succeeded') {
          setStatus('success');
          setMessage('Płatność przyjęta. Odśwież stronę zlecenia za chwilę.');
        } else {
          setStatus('error');
          setMessage(error?.message || 'Błąd sprawdzania statusu płatności.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const handleContinue = () => {
    const orderId = searchParams.get('orderId') || searchParams.get('orderid');
    const payType = searchParams.get('type');
    if (payType === 'subscription') {
      navigate('/account/subscriptions');
      return;
    }
    if (orderId) {
      navigate(`/orders/${orderId}`);
    } else {
      navigate('/my-orders');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motionlessSpinner />
          <p className="text-gray-600">Sprawdzanie statusu płatności…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'success' && (
          <>
            <IconCircle variant="success" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Płatność zakończona pomyślnie!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {duplicatesReleased > 0 && (
              <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                Zwolniono {duplicatesReleased} zbędne autoryzacje na karcie (została jedna opłata za zlecenie).
              </p>
            )}
            <button
              type="button"
              onClick={handleContinue}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700"
            >
              Przejdź do zlecenia
            </button>
          </>
        )}

        {status === 'processing' && (
          <>
            <motionlessSpinner />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Przetwarzanie płatności</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <IconCircle variant="error" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Płatność nie powiodła się</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-left">
              Jeśli na koncie widać obciążenie, <strong>nie płac ponownie</strong> — otwórz zlecenie z listy lub
              napisz na helpfli@outlook.com z numerem zlecenia.
            </p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 mb-3"
            >
              Wróć
            </button>
            <button
              type="button"
              onClick={() => navigate('/my-orders')}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Wróć do zleceń
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function motionlessSpinner() {
  return (
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-4" role="status" />
  );
}

function IconCircle({ variant }) {
  const isSuccess = variant === 'success';
  return (
    <div
      className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
        isSuccess ? 'bg-emerald-100' : 'bg-red-100'
      }`}
    >
      {isSuccess ? (
        <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </div>
  );
}
