import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import PricingTable from "../components/PricingTable";
import ExitIntentPopup from "../components/ExitIntentPopup";
import { getPlans, getMySubscription, subscribePlan, cancelSubscription, startTrial } from "../api/subscriptions";
import { getCompanySubscription } from "../api/companies";
import { useAuth } from "../context/AuthContext";

export default function Subscriptions() {
  const { user, fetchMe } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAudience = searchParams.get('audience'); // Odczytaj z URL
  
  // Ustaw audience: najpierw z URL, potem sprawdź subskrypcję, potem z roli użytkownika
  const getInitialAudience = () => {
    if (urlAudience === 'business') return 'business';
    if (urlAudience === 'provider') return 'provider';
    if (urlAudience === 'client') return 'client';
    
    // Jeśli użytkownik ma subskrypcję biznesową, automatycznie ustaw na business
    // (sprawdzimy to w fetchAll, ale tutaj możemy sprawdzić z localStorage)
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        // Sprawdź czy użytkownik ma firmę (może mieć subskrypcję biznesową)
        if (userData?.company) {
          return 'business';
        }
      }
    } catch (e) {
      // Ignoruj błędy parsowania
    }
    
    // Fallback na podstawie roli
    return user?.role === "provider" ? "provider" : "client";
  };
  
  const [audience, setAudience] = useState(getInitialAudience());
  const [plans, setPlans] = useState([]);
  const [mine, setMine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Sprawdź czy użytkownik ma subskrypcję biznesową (jeśli nie jesteśmy już w trybie business)
      if (audience !== 'business') {
        try {
          const mySub = await getMySubscription().catch(() => null);
          if (mySub && mySub.isBusinessPlan && mySub.planKey && mySub.planKey.startsWith('BUSINESS_')) {
            // Użytkownik ma subskrypcję biznesową - przełącz na business
            setAudience('business');
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('audience', 'business');
            setSearchParams(newSearchParams);
            // Wywołaj fetchAll ponownie z business audience
            const businessPlans = await getPlans('business');
            setPlans(businessPlans);
            
            // Pobierz subskrypcję firmy
            let companyIdToUse = null;
            if (user?.company) {
              companyIdToUse = typeof user.company === 'string' ? user.company : user.company._id;
            } else {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/companies`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.companies && data.companies.length > 0) {
                    companyIdToUse = data.companies[0]._id;
                  }
                }
              } catch (err) {
                console.error('Error fetching company:', err);
              }
            }
            
            if (companyIdToUse) {
              setCompanyId(companyIdToUse);
              const companySub = await getCompanySubscription(companyIdToUse).catch(() => null);
              setMine(companySub?.subscription || null);
            } else {
              setMine(null);
            }
            
            setLoading(false);
            return;
          }
        } catch (err) {
          // Ignoruj błędy - kontynuuj z normalnym flow
        }
      }
      
      const plans = await getPlans(audience);
      setPlans(plans);
      
      // Jeśli to business, pobierz subskrypcję firmy
      if (audience === 'business') {
        // Pobierz companyId użytkownika - najpierw z user.company, potem z API
        let companyIdToUse = null;
        
        if (user?.company) {
          companyIdToUse = typeof user.company === 'string' ? user.company : user.company._id;
        } else {
          // Jeśli nie ma w kontekście, pobierz z API
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/companies`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.companies && data.companies.length > 0) {
                companyIdToUse = data.companies[0]._id;
              }
            }
          } catch (err) {
            console.error('Error fetching company:', err);
          }
        }
        
        if (companyIdToUse) {
          setCompanyId(companyIdToUse);
          const companySub = await getCompanySubscription(companyIdToUse).catch(() => null);
          setMine(companySub?.subscription || null);
        } else {
          setMine(null);
        }
      } else {
        // Dla provider/client pobierz indywidualną subskrypcję
        const me = await getMySubscription().catch(() => null);
        setMine(me);
      }
    } finally {
      setLoading(false);
    }
  };

  // Aktualizuj audience gdy zmieni się URL lub rola użytkownika
  useEffect(() => {
    const newAudience = getInitialAudience();
    if (newAudience !== audience) {
      setAudience(newAudience);
    }
  }, [urlAudience, user?.role]);

  useEffect(()=>{ fetchAll(); /* eslint-disable-next-line */ }, [audience, user]);

  const onSelect = async (plan, requestInvoice = false) => {
    try {
      const planKey = plan.key || plan.code;
      const isBusinessPlan = planKey && planKey.startsWith('BUSINESS_');
      
      const data = await subscribePlan(planKey, requestInvoice);

      // Jeśli backend zwrócił clientSecret/paymentIntentId – przekieruj do wspólnej strony checkout
      if (data?.clientSecret && data?.paymentIntentId) {
        const url = `/checkout?pi=${encodeURIComponent(data.paymentIntentId)}&cs=${encodeURIComponent(data.clientSecret)}`;
        window.location.href = url;
        return;
      }

      // Tryb dev (mock) – subskrypcja aktywna od razu
      // Jeśli to plan biznesowy, upewnij się że audience jest ustawione na 'business'
      let shouldRefetch = true;
      if (isBusinessPlan && audience !== 'business') {
        setAudience('business');
        // Zaktualizuj URL żeby zachować stan
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('audience', 'business');
        setSearchParams(newSearchParams);
        shouldRefetch = false; // useEffect wywoła fetchAll automatycznie
      }
      
      // Odśwież dane użytkownika z kontekstu (może mieć teraz company)
      if (isBusinessPlan && fetchMe) {
        await fetchMe();
      }
      
      // Odśwież dane tylko jeśli nie zmieniliśmy audience (wtedy useEffect to zrobi)
      if (shouldRefetch) {
        await fetchAll();
      }
      
      alert(data?.message || `Aktywowano plan: ${plan.name || plan.title}`);
    } catch (e) {
      alert(e.message);
    }
  };

  const onCancel = async () => {
    if (!window.confirm('Anulować auto-odnowienie po okresie bieżącym?')) return;
    try {
      await cancelSubscription();
      await fetchAll();
      alert('Subskrypcja zostanie anulowana po zakończeniu okresu.');
    } catch (e) {
      alert(e.message);
    }
  };

  const onStartTrial = async (planKey) => {
    try {
      const data = await startTrial(planKey);
      await fetchAll();
      alert(data?.message || `Rozpoczęto 7-dniowy trial dla planu ${planKey}`);
    } catch (e) {
      alert(e.message || 'Błąd podczas rozpoczynania trialu');
    }
  };

  if (loading) return <div>Ładowanie…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-300 bg-white/50 backdrop-blur-sm mb-4">
            <Sparkles className="w-3 h-3" />
            <span className="text-sm font-medium">Plany i cennik</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
            {audience === "business" 
              ? "Wybierz plan dopasowany do Twojej firmy"
              : audience === "provider" 
              ? "Wybierz plan dopasowany do Twojego biznesu"
              : "Wybierz plan dopasowany do Twoich potrzeb"}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto text-balance">
            {audience === "business"
              ? "Zacznij bezpłatnie i rozwijaj się w miarę rozwoju swojej działalności. Wszystkie plany z 14-dniowym okresem próbnym."
              : audience === "provider"
              ? "Zacznij bezpłatnie i rozwijaj się w miarę rozwoju swojej działalności. Wszystkie plany z 7-dniowym okresem próbnym."
              : "Zacznij bezpłatnie i rozwijaj się w miarę rozwoju swojej działalności. Wszystkie plany z 7-dniowym okresem próbnym."}
          </p>
          {/* Social proof */}
          <div className="pt-4">
            <div className="text-gray-700 text-sm font-semibold">
              {audience === 'provider' ? "500+ wykonawców z PRO" : audience === 'client' ? "2000+ klientów z PRO" : "50+ firm"}
            </div>
            <div className="text-gray-500 text-xs">
              już korzysta z pakietów PRO
            </div>
          </div>
        </div>
        {mine && (
          <div className="mb-8 p-4 border-2 border-green-200 rounded-2xl bg-green-50 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Twój aktualny plan</div>
              <div className="text-base font-semibold text-gray-900">
                {mine.planKey}
              </div>
              <div className="text-xs text-gray-500">
                Ważny do: {new Date(mine.validUntil).toLocaleDateString()} • Darmowe ekspresy: {mine.freeExpressLeft}
              </div>
            </div>
            {!mine.renews ? null : (
              <button className="px-3 py-2 rounded-xl bg-rose-600 text-white text-sm hover:bg-rose-700 transition-colors" onClick={onCancel}>
                Anuluj auto-odnowienie
              </button>
            )}
          </div>
        )}

        <PricingTable plans={plans} onSelect={onSelect} currentSubscription={mine} onStartTrial={onStartTrial} />
        
        {/* Exit Intent Popup */}
        <ExitIntentPopup onStartTrial={onStartTrial} />
      </main>
    </div>
  );
}



