import { useEffect, useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentResult() {
  const stripe = useStripe();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!stripe) return;

    const clientSecret = searchParams.get('payment_intent_client_secret');
    const paymentIntentId = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');

    if (!clientSecret && !paymentIntentId) {
      // Brak parametrów płatności - może to być bezpośrednie wejście na stronę
      setStatus('error');
      setMessage('Brak informacji o płatności');
      return;
    }

    // Sprawdź status płatności
    const checkPaymentStatus = async () => {
      try {
        if (paymentIntentId) {
          const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentId);
          
          if (paymentIntent.status === 'succeeded') {
            setStatus('success');
            setMessage('Płatność zakończona pomyślnie!');
          } else if (paymentIntent.status === 'processing') {
            setStatus('processing');
            setMessage('Płatność jest przetwarzana...');
          } else {
            setStatus('error');
            setMessage(paymentIntent.last_payment_error?.message || 'Płatność nie powiodła się');
          }
        } else if (redirectStatus) {
          // Użyj redirect_status z URL
          if (redirectStatus === 'succeeded') {
            setStatus('success');
            setMessage('Płatność zakończona pomyślnie!');
          } else {
            setStatus('error');
            setMessage('Płatność nie powiodła się');
          }
        }
      } catch (error) {
        console.error('Błąd sprawdzania statusu płatności:', error);
        setStatus('error');
        setMessage('Wystąpił błąd podczas sprawdzania statusu płatności');
      }
    };

    checkPaymentStatus();
  }, [stripe, searchParams]);

  const handleContinue = () => {
    const orderId = searchParams.get('orderId');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Sprawdzanie statusu płatności...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'success' ? (
          <>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
              <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Płatność zakończona pomyślnie!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={handleContinue}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Przejdź do zlecenia
            </button>
          </>
        ) : status === 'processing' ? (
          <>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Przetwarzanie płatności</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Możesz zamknąć to okno. Otrzymasz powiadomienie, gdy płatność zostanie zakończona.</p>
          </>
        ) : (
          <>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Płatność nie powiodła się</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors mb-3"
            >
              Spróbuj ponownie
            </button>
            <button
              onClick={() => navigate('/my-orders')}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Wróć do zleceń
            </button>
          </>
        )}
      </div>
    </div>
  );
}
