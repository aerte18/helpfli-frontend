import { apiUrl } from "@/lib/apiUrl";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';

export default function StripeProvider({ children }) {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(apiUrl(`/api/payments/config`));
      const data = await res.json();
      setStripePromise(loadStripe(data.publishableKey));
    })();
  }, []);

  if (!stripePromise) return null;
  return <Elements stripe={stripePromise}>{children}</Elements>;
}



















