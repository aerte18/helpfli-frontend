import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { completeOnboarding } from '../../api/companies';
import { CheckCircle, Users, Settings, CreditCard, Database, ArrowRight, X } from 'lucide-react';

export default function CompanyOnboarding({ company, onComplete }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Sprawdź czy onboarding jest ukończony
  const isCompleted = company?.onboardingCompleted || false;
  const stepsCompleted = company?.onboardingSteps || {};

  // Jeśli onboarding ukończony lub odrzucony, nie pokazuj
  if (isCompleted || dismissed) {
    return null;
  }

  const steps = [
    {
      id: 'team',
      title: 'Dodaj zespół',
      description: 'Zaproś członków zespołu do Twojej firmy. Mogą to być managerowie i wykonawcy.',
      icon: Users,
      completed: stepsCompleted.teamAdded || false,
      action: () => navigate('/account/company?tab=team'),
      actionLabel: 'Dodaj zespół'
    },
    {
      id: 'workflow',
      title: 'Skonfiguruj workflow',
      description: 'Ustaw automatyczne przypisanie zleceń do członków zespołu na podstawie lokalizacji, specjalizacji lub dostępności.',
      icon: Settings,
      completed: stepsCompleted.workflowConfigured || false,
      action: () => navigate('/account/company?tab=workflow'),
      actionLabel: 'Konfiguruj workflow'
    },
    {
      id: 'plan',
      title: 'Wybierz plan biznesowy',
      description: 'Wybierz plan dostosowany do potrzeb Twojej firmy. Wszystkie plany zawierają pełny dostęp do narzędzi dla firm i wystawiania faktur.',
      icon: CreditCard,
      completed: stepsCompleted.planSelected || false,
      action: () => navigate('/account/subscriptions?audience=business'),
      actionLabel: 'Wybierz plan'
    },
    {
      id: 'resourcePool',
      title: 'Skonfiguruj Resource Pool',
      description: 'Ustaw wspólne limity dla zespołu: AI Concierge i odpowiedzi. Pilne zlecenia są bezpłatne dla wszystkich. Wybierz strategię alokacji zasobów.',
      icon: Database,
      completed: stepsCompleted.resourcePoolConfigured || false,
      action: () => navigate('/account/company?tab=resource-pool'),
      actionLabel: 'Konfiguruj Resource Pool'
    }
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  const handleDismiss = async () => {
    setDismissed(true);
    // Opcjonalnie zapisz w localStorage żeby nie pokazywać ponownie w tej sesji
    localStorage.setItem('companyOnboardingDismissed', 'true');
  };

  const handleComplete = async () => {
    try {
      await completeOnboarding(company._id);
      if (onComplete) {
        onComplete();
      }
      setDismissed(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Nie udało się zakończyć onboardingu: ' + error.message);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6 mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Zamknij"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Rozpocznij konfigurację Twojej firmy
          </h3>
          <p className="text-gray-600 mb-4">
            Wykonaj kilka prostych kroków, aby w pełni wykorzystać możliwości Helpfli dla firm.
          </p>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Postęp: {completedCount} / {steps.length} kroków
              </span>
              <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps list */}
          <div className="space-y-3 mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    step.completed
                      ? 'bg-green-50 border-green-200'
                      : currentStep === index
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className={`flex-shrink-0 ${step.completed ? 'text-green-600' : 'text-gray-400'}`}>
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium ${step.completed ? 'text-green-900' : 'text-gray-900'}`}>
                        {step.title}
                      </h4>
                      {step.completed && (
                        <span className="text-xs text-green-600 font-medium">✓ Ukończone</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </div>
                  {!step.completed && (
                    <button
                      onClick={step.action}
                      className="flex-shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      {step.actionLabel}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Complete button */}
          {completedCount === steps.length && (
            <button
              onClick={handleComplete}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Zakończ onboarding
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

