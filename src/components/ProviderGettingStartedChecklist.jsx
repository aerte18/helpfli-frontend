import { Link } from "react-router-dom";
import { CheckCircle2, Circle, X } from "lucide-react";

const STORAGE_KEY = "providerHome_gettingStarted_dismissed";

export default function ProviderGettingStartedChecklist({ user, offersCount = 0, onDismiss }) {
  const servicesCount = Array.isArray(user?.services) ? user.services.length : 0;
  const kycDone = Boolean(
    user?.kycVerified ||
      user?.isVerified ||
      user?.kyc?.status === "verified"
  );
  const profileVerified = Boolean(user?.verified || user?.kycVerified || user?.isVerified);
  const hasOffer = offersCount > 0;

  const steps = [
    {
      id: "services",
      done: servicesCount > 0,
      label: "Dodaj usługi, które świadczysz",
      to: "/manage-services",
    },
    {
      id: "kyc",
      done: kycDone,
      label: "Przejdź weryfikację tożsamości (KYC)",
      to: "/kyc",
    },
    {
      id: "profile",
      done: profileVerified,
      label: "Zweryfikuj profil wykonawcy",
      to: "/verification",
    },
    {
      id: "offer",
      done: hasOffer,
      label: "Złóż pierwszą ofertę na zlecenie",
      to: "/provider-home",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  if (completed >= steps.length) return null;

  let dismissed = false;
  try {
    dismissed = localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    /* ignore */
  }
  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    onDismiss?.();
  };

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-indigo-900">
            Pierwsze kroki wykonawcy ({completed}/{steps.length})
          </h3>
          <p className="text-xs text-indigo-800 mt-0.5">
            Ukończ checklistę, żeby szybciej zdobywać zlecenia i budować zaufanie klientów.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-md text-indigo-600 hover:bg-indigo-100"
          aria-label="Ukryj checklistę"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              to={step.to}
              className="flex items-center gap-2 text-sm text-indigo-900 hover:text-indigo-700"
            >
              {step.done ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden />
              ) : (
                <Circle className="w-4 h-4 shrink-0 text-indigo-400" aria-hidden />
              )}
              <span className={step.done ? "line-through opacity-70" : ""}>{step.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
