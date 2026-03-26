import { apiUrl } from "@/lib/apiUrl";
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { subscribePlan, getPlans } from '../api/subscriptions';
import { useState, useEffect } from 'react';
import PageBackground, { GlassCard } from '../components/PageBackground';

export default function WhyPro() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const isProvider = user?.role === 'provider';

  // Pobierz plany z API (takie same jak w Subscriptions)
  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const audience = isProvider ? 'provider' : 'client';
        const fetchedPlans = await getPlans(audience);
        setPlans(fetchedPlans);
      } catch (error) {
        console.error('Błąd pobierania planów:', error);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, [isProvider]);

  const caseStudies = isProvider ? [
    {
      name: 'Jan K.',
      service: 'Hydraulik',
      result: 'Po przejściu na PRO zwiększył liczbę zleceń o 40% dzięki priorytetowi w wynikach',
      earnings: '+12 000 zł/mies.'
    },
    {
      name: 'Anna M.',
      service: 'Elektryk',
      result: 'Nielimitowane odpowiedzi pozwoliły na przyjęcie 3x więcej zleceń',
      earnings: '+8 500 zł/mies.'
    },
    {
      name: 'Piotr W.',
      service: 'Złota rączka',
      result: 'Gwarancja Helpfli+ zwiększyła zaufanie klientów i konwersję o 25%',
      earnings: '+6 000 zł/mies.'
    }
  ] : [];

  return (
    <PageBackground className="py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-8">
        {/* Hero */}
        <GlassCard className="p-8 md:p-12 text-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {isProvider ? 'Dlaczego PRO dla wykonawców?' : 'Dlaczego PRO dla klientów?'}
        </h1>
        <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto">
          {isProvider 
            ? 'Więcej zleceń, lepsza widoczność, wyższe zarobki. Pracuj mądrzej, nie więcej.'
            : 'Więcej AI, szybsze dopasowanie, lepsze zlecenia. Oszczędzaj czas i pieniądze.'}
        </p>
        </GlassCard>

        {/* Porównanie planów */}
        <GlassCard className="p-6 md:p-8">
        <h2 className="text-3xl font-bold text-center mb-8">Porównanie planów</h2>
        {loadingPlans ? (
          <div className="text-center py-8 text-gray-500">Ładowanie planów...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Brak dostępnych planów</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isFree = plan.priceMonthly === 0;
              const isPro = (plan.name || plan.key || '').toUpperCase().includes('PRO');
              const isStandard = (plan.name || plan.key || '').toUpperCase().includes('STANDARD');
              
              return (
                <div
                  key={plan.key || plan.code}
                  className={`rounded-xl border-2 p-6 ${
                    isPro
                      ? 'border-orange-400 bg-orange-50 ring-4 ring-orange-200'
                      : isStandard
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name || plan.title}</h3>
                    <div className="text-4xl font-bold text-indigo-600 mb-1">
                      {plan.priceMonthly || 0} zł
                    </div>
                    <div className="text-sm text-gray-500">/mies.</div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {(plan.perks || plan.benefits || []).map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-sm text-gray-700">{perk}</span>
                      </li>
                    ))}
                  </ul>
                  {!isFree && (
                    <button
                      onClick={async () => {
                        if (loading) return;
                        setLoading(true);
                        try {
                          const planKey = plan.key || plan.code;
                          const data = await subscribePlan(planKey);
                          
                          // Jeśli backend zwrócił clientSecret/paymentIntentId – przekieruj do wspólnej strony checkout
                          if (data?.clientSecret && data?.paymentIntentId) {
                            const url = `/checkout?pi=${encodeURIComponent(data.paymentIntentId)}&cs=${encodeURIComponent(data.clientSecret)}`;
                            window.location.href = url;
                            return;
                          }
                          
                          // Tryb dev (mock) – subskrypcja aktywna od razu
                          alert(data?.message || `Aktywowano plan ${plan.name || plan.title}`);
                          navigate('/account/subscriptions');
                        } catch (e) {
                          // Jeśli plan nie istnieje, spróbuj najpierw utworzyć plany przez seed
                          if (e.message?.includes('nie istnieje') || e.message?.includes('404')) {
                            try {
                              // Spróbuj utworzyć plany przez endpoint seed
                              const seedResponse = await fetch(apiUrl('/api/subscriptions/seed'), { method: 'POST' });
                              if (seedResponse.ok) {
                                // Po utworzeniu planów, odśwież listę planów
                                const audience = isProvider ? 'provider' : 'client';
                                const fetchedPlans = await getPlans(audience);
                                setPlans(fetchedPlans);
                                
                                // Spróbuj ponownie z tym samym planem
                                const planKey = plan.key || plan.code;
                                const data = await subscribePlan(planKey);
                                
                                if (data?.clientSecret && data?.paymentIntentId) {
                                  const url = `/checkout?pi=${encodeURIComponent(data.paymentIntentId)}&cs=${encodeURIComponent(data.clientSecret)}`;
                                  window.location.href = url;
                                  return;
                                }
                                
                                alert(data?.message || `Aktywowano plan ${plan.name || plan.title}`);
                                navigate('/account/subscriptions');
                              } else {
                                alert('Nie udało się utworzyć planów. Skontaktuj się z administratorem.');
                              }
                            } catch (seedError) {
                              console.error('Seed error:', seedError);
                              alert('Plan nie istnieje w systemie. Skontaktuj się z administratorem, aby utworzyć plany subskrypcyjne.');
                            }
                          } else {
                            alert(e.message || `Błąd podczas wyboru planu ${plan.name || plan.title}`);
                          }
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="block w-full text-center py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Przetwarzanie...' : `Wybierz ${plan.name || plan.title}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </GlassCard>

        {/* Case studies dla wykonawców */}
        {isProvider && caseStudies.length > 0 && (
          <GlassCard className="p-6 md:p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Prawdziwe historie sukcesu</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((study, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                    {study.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{study.name}</div>
                    <div className="text-sm text-gray-600">{study.service}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">{study.result}</p>
                <div className="text-lg font-bold text-green-600">{study.earnings}</div>
              </div>
            ))}
          </div>
          </GlassCard>
        )}

        {/* Kluczowe korzyści */}
        <GlassCard className="p-6 md:p-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            {isProvider ? 'Kluczowe korzyści PRO' : 'Kluczowe korzyści PRO'}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
          {isProvider ? (
            <>
              <div className="flex items-start gap-4">
                <div className="text-4xl">🎯</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Priorytet w wynikach</h3>
                  <p className="text-gray-600">
                    Twoje oferty pojawiają się na górze listy, co zwiększa szansę na wybór przez klientów.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-4xl">♾️</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Nielimitowane odpowiedzi</h3>
                  <p className="text-gray-600">
                    Nie martw się o limity – odpowiadaj na wszystkie zlecenia, które Cię interesują.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-4xl">📊</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Zaawansowane statystyki</h3>
                  <p className="text-gray-600">
                    Analizuj swoją skuteczność, konwersję i zarobki w czasie rzeczywistym.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-4xl">🛡️</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Gwarancja Helpfli+</h3>
                  <p className="text-gray-600">
                    Zwiększ zaufanie klientów dzięki gwarancji bezpieczeństwa płatności.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <div className="text-4xl">🤖</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Nielimitowany Asystent AI</h3>
                  <p className="text-gray-600">
                    Używaj Asystenta AI bez limitu – diagnozuj problemy i znajdź rozwiązania.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-4xl">⚡</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Pilne zlecenia bezpłatne</h3>
                  <p className="text-gray-600">
                    Oznacz zlecenia jako pilne bez dodatkowych opłat – wykonawcom zaleca się doliczyć 10% więcej za szybką reakcję.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-4xl">⭐</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Priorytet do top wykonawców</h3>
                  <p className="text-gray-600">
                    Masz pierwszeństwo w dostępie do najlepszych wykonawców w Helpfli.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-4xl">💎</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Ekskluzywne oferty</h3>
                  <p className="text-gray-600">
                    Dostęp do specjalnych zleceń i ofert dostępnych tylko dla członków PRO.
                  </p>
                </div>
              </div>
            </>
          )}
          </div>
        </GlassCard>

        {/* CTA */}
        <GlassCard className="p-8 md:p-12 text-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Gotowy na PRO?</h2>
        <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
          {isProvider
            ? 'Dołącz do najlepszych wykonawców w Helpfli i zwiększ swoje zarobki już dziś.'
            : 'Oszczędzaj czas i pieniądze dzięki PRO. Rozpocznij już dziś.'}
        </p>
        <button
          onClick={async () => {
            if (loading) return;
            setLoading(true);
            try {
              // Znajdź plan PRO w pobranych planach
              const proPlan = plans.find(p => 
                (p.name || p.key || '').toUpperCase().includes('PRO')
              );
              
              if (!proPlan) {
                alert('Plan PRO nie został znaleziony. Spróbuj ponownie później.');
                setLoading(false);
                return;
              }
              
              const planKey = proPlan.key || proPlan.code;
              const data = await subscribePlan(planKey);
              
              // Jeśli backend zwrócił clientSecret/paymentIntentId – przekieruj do wspólnej strony checkout
              if (data?.clientSecret && data?.paymentIntentId) {
                const url = `/checkout?pi=${encodeURIComponent(data.paymentIntentId)}&cs=${encodeURIComponent(data.clientSecret)}`;
                window.location.href = url;
                return;
              }
              
              // Tryb dev (mock) – subskrypcja aktywna od razu
              alert(data?.message || `Aktywowano plan PRO`);
              navigate('/account/subscriptions');
            } catch (e) {
              // Jeśli plan nie istnieje, spróbuj najpierw utworzyć plany przez seed
              if (e.message?.includes('nie istnieje') || e.message?.includes('404')) {
                try {
                  // Spróbuj utworzyć plany przez endpoint seed
                  const seedResponse = await fetch(apiUrl('/api/subscriptions/seed'), { method: 'POST' });
                  if (seedResponse.ok) {
                    // Po utworzeniu planów, odśwież listę planów
                    const audience = isProvider ? 'provider' : 'client';
                    const fetchedPlans = await getPlans(audience);
                    setPlans(fetchedPlans);
                    
                    // Znajdź plan PRO i spróbuj ponownie
                    const proPlan = fetchedPlans.find(p => 
                      (p.name || p.key || '').toUpperCase().includes('PRO')
                    );
                    
                    if (proPlan) {
                      const planKey = proPlan.key || proPlan.code;
                      const data = await subscribePlan(planKey);
                      
                      if (data?.clientSecret && data?.paymentIntentId) {
                        const url = `/checkout?pi=${encodeURIComponent(data.paymentIntentId)}&cs=${encodeURIComponent(data.clientSecret)}`;
                        window.location.href = url;
                        return;
                      }
                      
                      alert(data?.message || `Aktywowano plan PRO`);
                      navigate('/account/subscriptions');
                    } else {
                      alert('Plan PRO nie został znaleziony po utworzeniu planów.');
                    }
                  } else {
                    alert('Nie udało się utworzyć planów. Skontaktuj się z administratorem.');
                  }
                } catch (seedError) {
                  console.error('Seed error:', seedError);
                  alert('Plan nie istnieje w systemie. Skontaktuj się z administratorem, aby utworzyć plany subskrypcyjne.');
                }
              } else {
                alert(e.message || 'Błąd podczas wyboru planu PRO');
              }
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || loadingPlans}
          className="inline-block px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Przetwarzanie...' : 'Wybierz plan PRO'}
        </button>
        </GlassCard>
      </div>
    </PageBackground>
  );
}

