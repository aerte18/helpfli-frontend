import { apiUrl } from "@/lib/apiUrl";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useMemo, useState } from 'react';

function readClientSecretFromUrl() {
  if (typeof window === "undefined") return "";
  try {
    return new URLSearchParams(window.location.search).get("cs") || "";
  } catch {
    return "";
  }
}

/**
 * Dla PaymentIntent + PaymentElement Stripe wymaga options.clientSecret na <Elements>.
 * Można podać jawnie albo — na trasach /checkout?cs=... — odczytać z URL.
 */
export default function StripeProvider({ children, clientSecret: clientSecretProp }) {
  const [stripePromise, setStripePromise] = useState(null);
  const clientSecret = clientSecretProp ?? readClientSecretFromUrl();

  useEffect(() => {
    (async () => {
      const res = await fetch(apiUrl(`/api/payments/config`));
      const data = await res.json();
      setStripePromise(loadStripe(data.publishableKey));
    })();
  }, []);

  const elementsOptions = useMemo(() => {
    if (!clientSecret) return undefined;
    return { clientSecret };
  }, [clientSecret]);

  if (!stripePromise) return null;
  if (elementsOptions) {
    return (
      <Elements key={clientSecret} stripe={stripePromise} options={elementsOptions}>
        {children}
      </Elements>
    );
  }
  return <Elements stripe={stripePromise}>{children}</Elements>;
}



















