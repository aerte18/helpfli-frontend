import { useState } from "react";
import {
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Copy,
  Check,
  Lock,
} from "lucide-react";
import { formatSmartTime } from "../utils/relativeTime";
import { copyToClipboard } from "../utils/copyToClipboard";

function contactPreferenceLabel(pref) {
  if (!pref) return null;
  if (pref === "phone") return "Telefon";
  if (pref === "email") return "E-mail";
  if (pref === "chat") return "Czat w aplikacji";
  return pref;
}

function offerContactMethodLabel(method) {
  if (!method) return null;
  if (method === "call_before") return "Telefon przed wizytą";
  if (method === "chat_only") return "Tylko czat";
  if (method === "no_contact") return "Bez kontaktu poza platformą";
  return method;
}

function formatLocation(order) {
  if (!order?.location) return null;
  if (typeof order.location === "string") return order.location.trim() || null;
  return order.location.address || order.location.city || null;
}

/**
 * Panel kontaktu z klientem dla wykonawcy (po akceptacji / w realizacji).
 */
export default function ProviderClientHandoffCard({
  order,
  acceptedOffer,
  onGoChat,
  variant = "default",
  id,
}) {
  const [copied, setCopied] = useState(null);
  const client = order?.client;
  const clientName = client?.name || "Klient";
  const locationText = formatLocation(order);
  const contactLocked = Boolean(order?.contactLocked);
  const phone = client?.phone;
  const email = client?.email;
  const hasPhone = phone && !String(phone).includes("***");
  const hasEmail = email && !String(email).includes("***");
  const isKickoff = variant === "kickoff";

  const handleCopy = async (key, text) => {
    if (!text) return;
    await copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  };

  const completionLabel =
    acceptedOffer?.completionDate &&
    formatSmartTime(acceptedOffer.completionDate, { maxRelativeDays: 14 });

  const prefLabel = contactPreferenceLabel(order?.contactPreference);
  const methodLabel = offerContactMethodLabel(acceptedOffer?.contactMethod);

  return (
    <div
      id={id}
      className={`rounded-2xl border p-4 shadow-sm ${
        isKickoff
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            {isKickoff ? (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">
                ✓
              </span>
            ) : (
              <User className="h-4 w-4 text-indigo-600" aria-hidden />
            )}
            {isKickoff ? "Realizacja rozpoczęta" : "Kontakt z klientem"}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {isKickoff
              ? "Ustal termin i zakres przez czat — to główny kanał komunikacji w Helpfli."
              : "Przed przyjazdem potwierdź termin, adres i zakres prac."}
          </p>
        </div>
        {onGoChat && (
          <button
            type="button"
            onClick={onGoChat}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            Otwórz czat
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white bg-white/80 px-3 py-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700">
          {clientName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-slate-900">{clientName}</div>
          {(prefLabel || methodLabel) && (
            <div className="mt-0.5 flex flex-wrap gap-1.5 text-xs text-slate-600">
              {prefLabel && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  Preferuje: {prefLabel}
                </span>
              )}
              {methodLabel && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-800">
                  W ofercie: {methodLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <ul className="mt-3 space-y-2 text-sm">
        {completionLabel && (
          <li className="flex items-start gap-2 text-slate-800">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <span>
              <span className="font-medium">Termin z oferty:</span> {completionLabel}
            </span>
          </li>
        )}
        {locationText && (
          <li className="flex items-start gap-2 text-slate-800">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="font-medium">Miejsce realizacji:</span> {locationText}
            </span>
            <button
              type="button"
              onClick={() => handleCopy("address", locationText)}
              className="shrink-0 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
            >
              {copied === "address" ? (
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Skopiowano
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Copy className="h-3.5 w-3.5" /> Kopiuj
                </span>
              )}
            </button>
          </li>
        )}
      </ul>

      {contactLocked ? (
        <div className="mt-3 flex gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm text-violet-900">
          <Lock className="h-4 w-4 shrink-0 text-violet-700" aria-hidden />
          <p>
            Telefon i e-mail klienta pojawią się po odblokowaniu kontaktu przez klienta.
            Do tego czasu komunikuj się przez <strong>czat</strong> w Helpfli.
          </p>
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {hasPhone ? (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 hover:border-indigo-300"
            >
              <Phone className="h-4 w-4 text-indigo-600" aria-hidden />
              <span className="truncate font-medium">{phone}</span>
            </a>
          ) : phone ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
              <Phone className="h-4 w-4" aria-hidden />
              {phone}
            </div>
          ) : null}
          {hasEmail ? (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 hover:border-indigo-300"
            >
              <Mail className="h-4 w-4 text-indigo-600" aria-hidden />
              <span className="truncate font-medium">{email}</span>
            </a>
          ) : null}
        </div>
      )}

      <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs text-slate-600">
        <li>Napisz do klienta i potwierdź termin oraz dostęp do miejsca.</li>
        <li>Doprecyzuj materiały / części i ewentualne dopłaty przed pracą.</li>
        <li>Po zakończeniu oznacz zlecenie jako zakończone w panelu poniżej.</li>
      </ol>
    </div>
  );
}
