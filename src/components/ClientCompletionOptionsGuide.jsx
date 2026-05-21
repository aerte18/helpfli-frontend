import { ShieldCheck, CreditCard, AlertTriangle } from 'lucide-react';
import { isExternalOrderPayment, needsClientCompletionReview } from '../utils/orderCompletion';

/**
 * Krótki przewodnik: co klient może zrobić po zakończeniu zlecenia przez wykonawcę.
 */
export default function ClientCompletionOptionsGuide({ order, protectionTools = false }) {
  if (!order || order.status !== 'completed') return null;

  const isExternal = isExternalOrderPayment(order);
  const pending = needsClientCompletionReview(order);
  const type = order.completionType || 'simple';
  const rejected = order.clientCompletionStatus === 'rejected';
  const hasSurcharge = type === 'with_payment' && Number(order.additionalAmount || 0) > 0;

  if (rejected) {
    return (
      <div className="mb-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-950">
        <p className="font-semibold">Sprawa w toku</p>
        <p className="mt-1 text-xs leading-relaxed">
          Otwórz <strong>centrum sprawy</strong> z menu zlecenia — możesz pisać z wykonawcą, złożyć ugodę (np. częściowy
          zwrot) lub przekazać do Helpfli. Nie potwierdzaj odbioru, dopóki sprawa nie jest domknięta.
        </p>
      </div>
    );
  }

  return (
    <details className="mb-3 rounded-lg border border-slate-200 bg-white text-sm open:shadow-sm" open={false}>
      <summary className="cursor-pointer list-none px-3 py-2.5 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
        📋 Twoje opcje jako klient — co możesz zrobić?
      </summary>
      <div className="border-t border-slate-100 px-3 py-3 space-y-3 text-xs text-slate-700 leading-relaxed">
        {isExternal ? (
          <ExternalOptions pending={pending} />
        ) : protectionTools ? (
          <HelpfliProtectOptions pending={pending} type={type} hasSurcharge={hasSurcharge} />
        ) : (
          <HelpfliNoProtectOptions pending={pending} type={type} hasSurcharge={hasSurcharge} />
        )}
      </div>
    </details>
  );
}

function ExternalOptions({ pending }) {
  return (
    <div className="flex gap-2">
      <CreditCard className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" aria-hidden />
      <div className="space-y-2">
        <p className="font-medium text-amber-950">Płatność poza Helpfli</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Uwagi wykonawcy</strong> — tylko do odczytu; własnych uwag w systemie nie zapisujesz przy tym
            rozliczeniu.
          </li>
          {pending ? (
            <>
              <li>
                <strong>Potwierdź odbior</strong> — tylko jeśli usługa jest OK (nie zwalnia pieniędzy w Helpfli — one
                i tak nie przeszły przez platformę).
              </li>
              <li>
                <strong>Problem / brak realizacji / zwrot</strong> — ustawiasz z wykonawcą na czacie lub poza
                aplikacją (bank, umowa). Helpfli <strong>nie</strong> zwraca ani nie prowadzi sporu.
              </li>
            </>
          ) : (
            <li>Możesz <strong>ocenić wykonawcę</strong>.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function HelpfliProtectOptions({ pending, type, hasSurcharge }) {
  return (
    <div className="flex gap-2">
      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden />
      <div className="space-y-2">
        <p className="font-medium text-emerald-950">Helpfli Protect (escrow) — pełna ochrona</p>
        {pending && (
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong>Twoje uwagi (opcjonalnie)</strong> — pole tekstowe; przy akceptacji trafiają do zlecenia.
            </li>
            {type === 'simple' && (
              <li>
                <strong>Akceptuję wykonanie</strong> — zgadzasz się, że usługa jest zgodna z umową.
              </li>
            )}
            {type === 'with_notes' && (
              <li>
                <strong>Akceptuję z uwagami wykonawcy</strong> — potwierdzasz zakończenie wraz z jego komentarzem.
              </li>
            )}
            {hasSurcharge && (
              <>
                <li>
                  <strong>Akceptuję dopłatę</strong> — przechodzisz do płatności tylko dopłaty (kwota z oferty już w
                  escrow).
                </li>
                <li>
                  <strong>Nie zgadzam się z dopłatą</strong> — nie płać; użyj „Zgłoś spór” (szybki przycisk poniżej).
                </li>
              </>
            )}
            <li>
              <strong>Usługa niewykonana / częściowa / zła jakość</strong> — nie akceptuj;{' '}
              <strong>Zgłoś spór</strong> — środki z oferty zostają w escrow.
            </li>
            <li>
              Po akceptacji (i ewentualnej dopłacie): <strong>Potwierdź odbiór</strong> — wtedy wykonawca dostaje
              wynagrodzenie z escrow.
            </li>
            <li>
              W <strong>centrum sprawy</strong>: mediacja, ugoda (np. częściowy zwrot), eskalacja do Helpfli.
            </li>
          </ul>
        )}
        {!pending && (
          <p>Zaakceptowałeś zakończenie — potwierdź odbiór, jeśli wszystko jest w porządku, lub oceń wykonawcę.</p>
        )}
      </div>
    </div>
  );
}

function HelpfliNoProtectOptions({ pending, type, hasSurcharge }) {
  return (
    <div className="flex gap-2">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" aria-hidden />
      <div className="space-y-2">
        <p className="font-medium text-amber-950">Płatność w Helpfli, ale bez pełnej ochrony</p>
        <p className="text-amber-900/90">
          Np. wykonawca nieweryfikowany — spór i zwrot <strong>przez platformę niedostępne</strong>.
        </p>
        {pending && (
          <ul className="list-disc pl-4 space-y-1">
            <li>Możesz dodać <strong>własne uwagi</strong> i zaakceptować zakończenie (tak jak przy ochronie).</li>
            {hasSurcharge && (
              <li>
                Przy dopłacie: zapłać tylko jeśli się zgadzasz — inaczej <strong>nie akceptuj</strong> i pisz na czacie.
              </li>
            )}
            <li>
              <strong>Brak realizacji / zwrot</strong> — ustal z wykonawcą na czacie; Helpfli nie blokuje środków w
              sporze automatycznie.
            </li>
            <li>Po akceptacji: potwierdź odbior — środki przejdą do wykonawcy.</li>
          </ul>
        )}
      </div>
    </div>
  );
}
