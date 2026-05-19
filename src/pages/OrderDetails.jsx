import { apiUrl } from "@/lib/apiUrl";
import { useCallback, useEffect, useMemo, useState, memo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ChatBox from "../components/ChatBox";
import { useAuth } from "../context/AuthContext";
import OfferForm from "../components/OfferForm";
import OffersList from "../components/OffersList";
import GuaranteeBanner from "../components/GuaranteeBanner";
import CheckoutButton from "../payment/CheckoutButton";
import RatingModal from "../components/RatingModal";
import { getOrderTags, getOrderPrediction } from "../api/ai_advanced";
import ProviderAIChat from "../components/ProviderAIChat";
import { getMyOffer, cancelOffer, updateOffer, getOffersOfOrder, postOffer, acceptOffer as acceptOfferApi } from "../api/offers";
import { Link } from "react-router-dom";
import SponsorAdBanner from "../components/SponsorAdBanner";
import OrderProgressBar from "../components/OrderProgressBar";
import { isOffersOnlyOrder } from "../utils/orderMode";
import OrderContactUnlockCard from "../components/OrderContactUnlockCard";
import OrderStatusTimeline from "../components/OrderStatusTimeline";
import ChangeRequestModal from "../components/ChangeRequestModal";
import ChangeRequestResponseModal from "../components/ChangeRequestResponseModal";
import CompleteOrderModal from "../components/CompleteOrderModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { createChangeRequest, acceptChangeRequest, rejectChangeRequest, getChangeRequests } from "../api/changeRequests";
import { Clock, Banknote, FileText, MapPin, Loader2, Package, Briefcase, ShieldAlert, CheckCircle2, CreditCard, Settings, CheckSquare, Inbox, MessageSquare, AlertCircle, Copy, Check, Sparkles, ChevronDown } from "lucide-react";
import { getErrorMessage } from "../utils/errorMessages";
import { getSocket } from "../lib/socket";
import { OrderDetailsSkeleton } from "../components/SkeletonLoader";
import { formatRelativeTime, formatSmartTime } from "../utils/relativeTime";
import { copyToClipboard } from "../utils/copyToClipboard";
import { useToast } from "../components/toast/ToastProvider";
import { useTelemetry } from "../hooks/useTelemetry";
import { Helmet } from "react-helmet-async";
import { getVideoSessionByOrder } from "../api/video";
import AIStepHint from "../components/AIStepHint";
import { serviceLabel } from "../utils/serviceLabels";
import { getClientOrderPresentation, getProviderOrderPresentation } from "../utils/orderFlowLabels";
import { openAI } from "../ai/chat/bus";

/** Spór / zwrot przez Helpfli tylko przy aktywnej ochronie (zgodnie z GET order + GuaranteeBanner). */
function isHelpfliProtectionToolsEnabled(order) {
  return !!(order && order.eligibleForGuarantee === true);
}

/** Trwa mediacja / spór (wymaga uwagi). */
function disputeCaseIsOngoing(order) {
  if (!order) return false;
  if (order.disputeStatus === "resolved" || order.disputeStatus === "closed") return false;
  if (order.status === "disputed") return true;
  return ["reported", "refund_requested"].includes(order.disputeStatus);
}

/** Po zamknięciu ugodą — archiwum w centrum sprawy. */
function disputeCaseHasResolvedArchive(order) {
  return !!(order && order.disputeStatus === "resolved");
}

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const apiGet = async (path) => {
  const res = await fetch(apiUrl(path), { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `GET ${path} failed`);
  return data;
};

const apiPost = async (path, body) => {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `POST ${path} failed`);
  return data;
};

const apiPatch = async (path, body) => {
  const res = await fetch(apiUrl(path), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `PATCH ${path} failed`);
  return data;
};

/** Oferta przypisanego wykonawcy (zespół firmy widzi pełną listę ofert z GET /api/orders/:id). */
function pickCompanyTeamOfferAsMyOffer(orderRes) {
  if (!orderRes?.offers?.length) return null;
  const pid = orderRes.provider?._id ?? orderRes.provider;
  const accepted = orderRes.acceptedOfferId?._id ?? orderRes.acceptedOfferId;
  if (accepted) {
    const byAccepted = orderRes.offers.find((o) => String(o._id || o.id) === String(accepted));
    if (byAccepted) return byAccepted;
  }
  if (pid) {
    return (
      orderRes.offers.find(
        (o) => String(o.providerId?._id ?? o.providerId) === String(pid)
      ) || null
    );
  }
  return null;
}

function isCompanyLeadUser(userLike) {
  const u = userLike || {};
  return (
    u.role === "company_owner" ||
    u.role === "company_manager" ||
    u.roleInCompany === "owner" ||
    u.roleInCompany === "manager"
  );
}

async function resolveMyOfferForOrder({ token, orderId, orderRes, mePayload }) {
  const team = orderRes?.viewerIsCompanyTeamForOrderProvider === true;
  if (team && isCompanyLeadUser(mePayload)) {
    return pickCompanyTeamOfferAsMyOffer(orderRes);
  }
  if ((mePayload?.role || "") === "provider") {
    try {
      return await getMyOffer({ token, orderId });
    } catch {
      return null;
    }
  }
  return null;
}

/** Czy zalogowany użytkownik ma już wpis w `order.ratings` dla tej pary klient↔wykonawca (GET /api/orders/:id zwraca ratings). */
function userHasSubmittedOrderRating({ order, userId, isClient, isProvider }) {
  const list = order?.ratings;
  if (!Array.isArray(list) || list.length === 0 || !userId) return false;
  const uid = String(userId);
  const clientId =
    typeof order?.client === "string"
      ? order.client
      : order?.client?._id ?? order?.client?.id ?? null;
  const providerId =
    typeof order?.provider === "string"
      ? order.provider
      : order?.provider?._id ?? order?.provider?.id ?? null;
  if (isClient && clientId && providerId) {
    return list.some(
      (r) =>
        String(r.from?._id ?? r.from) === uid &&
        String(r.to?._id ?? r.to) === String(providerId)
    );
  }
  if (isProvider && clientId && providerId) {
    return list.some(
      (r) =>
        String(r.from?._id ?? r.from) === uid &&
        String(r.to?._id ?? r.to) === String(clientId)
    );
  }
  return list.some((r) => String(r.from?._id ?? r.from) === uid);
}

function providerOrderMatch(order, user) {
  const aiMatch = order?.providerMatch || order?.aiFollowup?.providerMatch;
  if (aiMatch) return aiMatch;
  if (!order || (user?.role !== 'provider' && user?.role !== 'company_owner' && user?.role !== 'company_manager')) return null;
  let score = 45;
  const reasons = [];
  if (order.aiBrief?.title) {
    score += 15;
    reasons.push('AI brief ułatwia szybką wycenę');
  }
  if (order.attachments?.length > 0) {
    score += 10;
    reasons.push('Klient dodał załączniki');
  }
  if (order.budget || order.budgetRange?.max) {
    score += 8;
    reasons.push('Budżet jest podany');
  }
  if (['now', 'today'].includes(order.urgency)) {
    score += 7;
    reasons.push('Pilne zlecenie może szybciej konwertować');
  }
  if (order.location?.address || order.city) {
    score += 5;
    reasons.push('Lokalizacja jest określona');
  }
  return {
    score: Math.min(100, score),
    label: score >= 80 ? 'Bardzo dobre zlecenie dla Ciebie' : score >= 65 ? 'Dobre dopasowanie' : 'Warto sprawdzić',
    reasons: reasons.length ? reasons : ['Pasuje do aktywnego rynku zleceń']
  };
}

/** Względne URL-e z backendu (/uploads/orders/...) muszą iść przez apiUrl — inaczej img ładuje się z domeny frontendu i „znika”. */
function attachmentPublicUrl(url) {
  if (url == null || url === "") return "";
  const s = String(url).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return apiUrl(s.startsWith("/") ? s : `/${s}`);
}

/** Jedno zdjęcie / ikona pliku: GET z Bearer (endpoint /api/orders/.../attachments/.../file), bo publiczny /uploads często 404 na prod (brak pliku lub brak auth). */
const OrderAttachmentItem = memo(function OrderAttachmentItem({ orderId, att, idx }) {
  const rawSubId =
    att?._id != null
      ? att._id
      : att?.id != null
        ? att.id
        : typeof att?.$oid === "string"
          ? att.$oid
          : null;
  const attId =
    rawSubId != null && /^[a-f0-9]{24}$/i.test(String(rawSubId)) ? String(rawSubId) : "";
  const [src, setSrc] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorHint, setErrorHint] = useState("");

  useEffect(() => {
    let cancelled = false;
    let blobUrl = null;

    async function load() {
      if (!orderId) {
        if (!cancelled) setStatus("error");
        return;
      }
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      async function fetchAsBlob(url) {
        try {
          const r = await fetch(url, { headers });
          return { ok: r.ok, status: r.status, blob: r.ok ? await r.blob() : null };
        } catch (_e) {
          return { ok: false, status: 0, blob: null, network: true };
        }
      }

      let blob = null;
      let lastStatus = 0;
      if (attId) {
        const a = await fetchAsBlob(
          apiUrl(`/api/orders/${orderId}/attachments/${attId}/file`)
        );
        lastStatus = a.status;
        if (a.blob) blob = a.blob;
      }
      if (!blob && att?.url) {
        const b = await fetchAsBlob(
          apiUrl(
            `/api/orders/${orderId}/attachments/resolve-file?url=${encodeURIComponent(att.url)}`
          )
        );
        lastStatus = b.status || lastStatus;
        if (b.blob) blob = b.blob;
      }
      if (blob) {
        blobUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setSrc(blobUrl);
          setStatus("ok");
          setErrorHint("");
        }
        return;
      }

      const fallback = attachmentPublicUrl(att.url);
      if (!cancelled) {
        setSrc(fallback || null);
        setStatus(fallback ? "fallback" : "error");
        if (!fallback) {
          setErrorHint(
            lastStatus === 403
              ? "Brak uprawnień do podglądu."
              : "Plik nie został znaleziony na serwerze (często po restarcie bez trwałego dysku dla uploadów)."
          );
        } else {
          setErrorHint("");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [orderId, attId, att?.url]);

  const mime = String(att.mimeType || att.type || "").toLowerCase();
  const isImage =
    mime.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(att.url || att.filename || "");
  const isVideo =
    mime.startsWith("video/") || /\.(mp4|webm|mov|avi)$/i.test(att.url || att.filename || "");

  const href = src || attachmentPublicUrl(att.url);

  if (status === "loading" && !src) {
    return (
      <div className="aspect-square bg-slate-100 animate-pulse rounded-lg border border-slate-200" />
    );
  }

  if (status === "error" || !href) {
    return (
      <div className="aspect-square rounded-lg border border-amber-200 bg-amber-50 flex flex-col items-center justify-center p-2 text-center">
        <span className="text-2xl mb-1">⚠️</span>
        <span className="text-[11px] text-amber-900">
          {errorHint || "Brak pliku na serwerze"}
        </span>
      </div>
    );
  }

  return (
    <div className="relative group">
      {isImage ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-400 transition-colors"
        >
          <img
            src={src || href}
            alt={att.filename || `Zdjęcie ${idx + 1}`}
            className="w-full h-full object-cover"
            onError={() => {
              setErrorHint(
                "Nie udało się załadować pliku (404/403 lub problem z siecią). Odśwież stronę albo poproś klienta o ponowne przesłanie zdjęć."
              );
              setStatus("error");
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </a>
      ) : isVideo ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-400 transition-colors bg-slate-100 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-3xl mb-1">🎥</div>
            <div className="text-xs text-slate-600 px-2">{att.filename || `Film ${idx + 1}`}</div>
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </a>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-400 transition-colors bg-slate-100 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-3xl mb-1">📎</div>
            <div className="text-xs text-slate-600 px-2 truncate w-full">{att.filename || `Załącznik ${idx + 1}`}</div>
          </div>
        </a>
      )}
    </div>
  );
});

function ProviderJobAssistant({ order, onGoChat }) {
  const [copiedKey, setCopiedKey] = useState(null);
  if (!order) return null;

  const status = order.status || 'open';
  const service = serviceLabel(order.service, 'tej usługi');
  const isActiveJob = ['accepted', 'funded', 'paid', 'in_progress', 'completed'].includes(status);
  if (!isActiveJob) return null;

  const messages = [];
  if (status === 'accepted' || status === 'funded' || status === 'paid') {
    messages.push({
      key: 'schedule',
      label: 'Ustal termin',
      text: `Dzień dobry, dziękuję za akceptację oferty. Proponuję ustalić dogodny termin realizacji usługi: ${service}. Przed przyjazdem potwierdzę zakres prac i ewentualne materiały/części. Jaki dzień i godzina będą dla Państwa najwygodniejsze?`
    });
    messages.push({
      key: 'prepare',
      label: 'Co przygotować',
      text: 'Dzień dobry, przed realizacją proszę przygotować dostęp do miejsca pracy oraz, jeśli to możliwe, dodatkowe zdjęcia/problemowe szczegóły. Dzięki temu szybciej potwierdzę zakres i unikniemy niespodzianek na miejscu.'
    });
  }
  if (status === 'in_progress') {
    messages.push({
      key: 'arrival',
      label: 'Przed przyjazdem',
      text: 'Dzień dobry, potwierdzam realizację zlecenia. Przed przyjazdem dam znać, gdy będę w drodze. Jeśli pojawiły się nowe informacje lub zakres się zmienił, proszę napisać teraz, żebym mógł się przygotować.'
    });
    messages.push({
      key: 'scope',
      label: 'Zmiana zakresu',
      text: 'Dzień dobry, podczas realizacji zauważyłem, że zakres może wymagać doprecyzowania. Zanim wykonam dodatkowe prace lub użyję dodatkowych części, chciałbym potwierdzić z Państwem zakres i ewentualny koszt.'
    });
  }
  if (status === 'completed') {
    messages.push({
      key: 'review',
      label: 'Prośba o opinię',
      text: 'Dzień dobry, dziękuję za zlecenie. Jeśli wszystko jest w porządku, będę wdzięczny za potwierdzenie odbioru i krótką opinię w Helpfli. To bardzo pomaga mi zdobywać kolejne zlecenia.'
    });
  }

  const checklist = [
    ['accepted', 'funded', 'paid'].includes(status) ? 'Potwierdź termin i dokładny adres/dostęp.' : null,
    ['accepted', 'funded', 'paid'].includes(status) ? 'Doprecyzuj, czy materiały/części są po Twojej stronie.' : null,
    status === 'in_progress' ? 'Nie rozszerzaj zakresu bez zgody klienta.' : null,
    status === 'in_progress' ? 'Zapisz zdjęcia/przebieg prac, jeśli mogą być potrzebne przy odbiorze.' : null,
    status === 'completed' ? 'Poproś o potwierdzenie odbioru i opinię.' : null,
    'Komunikuj zmiany ceny lub terminu przed wykonaniem dodatkowych prac.'
  ].filter(Boolean);

  const handleCopy = async (key, text) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  };

  return (
    <div className="mb-5 rounded-2xl border border-purple-200 bg-gradient-to-br from-white to-purple-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-950">
            <Sparkles className="h-4 w-4 text-purple-600" aria-hidden />
            AI asystent realizacji
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Pomaga po wygraniu zlecenia: termin, zakres, wiadomości i bezpieczna komunikacja z klientem.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {checklist.slice(0, 4).map((item, idx) => (
              <span key={`${item}-${idx}`} className="rounded-full border border-purple-100 bg-white px-2 py-0.5 text-[11px] text-purple-800">
                {item}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onGoChat}
          className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
        >
          Przejdź do czatu
        </button>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {messages.map((message) => (
          <div key={message.key} className="rounded-xl border border-slate-100 bg-white p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{message.label}</div>
            <p className="line-clamp-3 text-sm text-slate-700">{message.text}</p>
            <button
              type="button"
              onClick={() => handleCopy(message.key, message.text)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
            >
              {copiedKey === message.key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedKey === message.key ? 'Skopiowano' : 'Kopiuj wiadomość'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const normalizeOrderPayload = (raw) => {
  const source = raw?.order || raw?.data?.order || raw?.data || raw;
  if (!source || typeof source !== "object") return source;

  const normalized = { ...source };

  // Backward/forward compatibility: map alternative field names into the shape UI expects.
  if (!normalized.service) {
    if (typeof normalized.serviceName === "string") normalized.service = normalized.serviceName;
    else if (typeof normalized.title === "string") normalized.service = normalized.title;
    else if (typeof normalized.serviceCode === "string") normalized.service = normalized.serviceCode;
    else if (normalized.service && typeof normalized.service === "object") {
      // If backend sometimes stores service as an object, prefer a human-readable code/name.
      normalized.service =
        normalized.service?.code || normalized.service?.name || normalized.service?.slug || "";
    }
  }

  if (!normalized.description) {
    if (typeof normalized.desc === "string") normalized.description = normalized.desc;
    else if (typeof normalized.notes === "string") normalized.description = normalized.notes;
    else if (typeof normalized.message === "string") normalized.description = normalized.message;
    else if (typeof normalized.problem === "string") normalized.description = normalized.problem;
    else if (typeof normalized.body === "string") normalized.description = normalized.body;
  }

  // Location can come as:
  // - { address, city, lat, lng }
  // - a legacy string address
  // - { lat, lng } without address (then use legacy address fields if present)
  if (!normalized.location || typeof normalized.location === "string") {
    if (typeof normalized.location === "string") {
      normalized.location = { address: normalized.location };
    } else if (typeof normalized.address === "string") {
      normalized.location = { address: normalized.address };
    }
  }

  if (normalized.location && typeof normalized.location === "object") {
    const hasAddress = typeof normalized.location.address === "string" && normalized.location.address.trim().length > 0;
    if (!hasAddress) {
      if (typeof normalized.locationText === "string" && normalized.locationText.trim().length > 0) {
        normalized.location = { ...normalized.location, address: normalized.locationText };
      } else if (typeof normalized.address === "string" && normalized.address.trim().length > 0) {
        normalized.location = { ...normalized.location, address: normalized.address };
      }
    }
  }

  if (!Array.isArray(normalized.offers)) {
    normalized.offers = [];
  }

  let attachments = normalized.attachments;
  if (typeof attachments === "string") {
    try {
      attachments = JSON.parse(attachments);
    } catch (_e) {
      attachments = [];
    }
  }
  if (!Array.isArray(attachments)) attachments = [];
  normalized.attachments = attachments
    .map((att) => {
      if (!att) return null;
      if (typeof att === "string") return { url: att, mimeType: "", filename: "", size: 0 };
      if (typeof att !== "object") return null;
      return {
        ...att,
        url: att.url || "",
        mimeType: att.mimeType || att.type || "",
        filename: att.filename || "",
        size: Number(att.size) || 0,
      };
    })
    .filter((att) => att && att.url);

  return normalized;
};

function StatusBadge({ status }) {
  const map = {
    open: "Otwarte",
    collecting_offers: "Oferty złożone",
    quote: "Zapytanie o wycenę",
    pending_accept: "Oczekuje na akcept",
    accepted: "Oferta zaakceptowana",
    funded: "Opłacone",
    in_progress: "W realizacji",
    completed: "Zakończone",
    rated: "Ocenione",
    released: "Wypłacone",
    done: "Zakończone",
    cancelled: "Anulowane",
    closed: "Zamknięte",
    disputed: "Spór",
  };

  const colors = {
    open: "bg-blue-100 text-blue-800",
    collecting_offers: "bg-indigo-100 text-indigo-800", // MVP: nowy kolor
    quote: "bg-yellow-100 text-yellow-800",
    pending_accept: "bg-orange-100 text-orange-800",
    accepted: "bg-indigo-100 text-indigo-800",
    funded: "bg-green-100 text-green-800",
    in_progress: "bg-purple-100 text-purple-800",
    completed: "bg-emerald-100 text-emerald-800",
    rated: "bg-gray-100 text-gray-800", // MVP: nowy kolor
    released: "bg-green-100 text-green-800",
    done: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
    closed: "bg-gray-100 text-gray-800",
    disputed: "bg-orange-100 text-orange-800",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        colors[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {map[status] || status}
    </span>
  );
}

function PaymentStatusBadge({ paymentStatus, paidInSystem }) {
  if (!paymentStatus || paymentStatus === "unpaid") {
    return (
      <span className="rounded-full px-3 py-1 text-xs font-medium bg-red-100 text-red-800">
        Nieopłacone
      </span>
    );
  }

  const map = {
    processing: { text: "W trakcie", color: "bg-yellow-100 text-yellow-800" },
    succeeded: { text: "Opłacone", color: "bg-green-100 text-green-800" },
    failed: { text: "Błąd płatności", color: "bg-red-100 text-red-800" },
    refunded: { text: "Zwrócone", color: "bg-gray-100 text-gray-800" },
    partial_refund: { text: "Częściowy zwrot", color: "bg-orange-100 text-orange-800" },
  };

  const status =
    map[paymentStatus] || { text: paymentStatus, color: "bg-gray-100 text-gray-800" };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>
      {status.text}
      {paidInSystem && paymentStatus === "succeeded" && <span className="ml-1">✓</span>}
    </span>
  );
}

function NextStepBanner({
  order,
  isClient,
  isProvider,
  isAssignedProvider = false,
  onGoToOffers,
  onGoToPayment,
  onProviderBannerAction,
}) {
  const status = order?.status;

  let title = "";
  let description = "";
  let cta = "";
  let tone = "indigo";
  let providerPresentation = null;

  if (isClient) {
    const presentation = getClientOrderPresentation(order);
    if (!presentation) {
      return null;
    }
    if (status === "completed") {
      return null;
    }
    title = `Następny krok: ${presentation.nextStepLabel}`;
    description = presentation.nextStepHint;
    const ctaLabel = presentation.nextStepCta || "";
    const ctaShows =
      ctaLabel === "Przejdź do ofert" ||
      ctaLabel === "Przejdź do płatności" ||
      ctaLabel === "Przejdź do szczegółów";
    cta = ctaShows ? ctaLabel : "";
    tone = presentation.tone || "indigo";
  } else if (isProvider && isAssignedProvider) {
    providerPresentation = getProviderOrderPresentation({
      order,
      offer: order?.acceptedOfferId ? { _id: order.acceptedOfferId } : null,
    });
    if (!providerPresentation) {
      return null;
    }
    title = `Następny krok: ${providerPresentation.nextStepLabel}`;
    description = providerPresentation.nextStepHint;
    cta = providerPresentation.nextStepCta || "";
    tone = providerPresentation.tone || "indigo";
  } else {
    return null;
  }

  const palette = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
    green: "bg-green-50 border-green-200 text-green-900",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-900",
  };

  return (
    <div className={`mb-5 rounded-xl border p-4 ${palette[tone] || palette.indigo}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{title}</div>
          <div className="text-sm opacity-90 mt-1 leading-snug">{description}</div>
        </div>
        {cta && isClient && (
          <button
            type="button"
            onClick={() => {
              if (cta === "Przejdź do ofert") {
                onGoToOffers?.();
                return;
              }
              if (cta === "Przejdź do płatności") {
                onGoToPayment?.();
                return;
              }
              if (cta === "Przejdź do szczegółów") {
                document
                  .getElementById("client-confirm-receipt")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
            className="rounded-lg bg-white/90 px-3 py-2 text-sm font-medium border border-current/20 hover:bg-white shrink-0"
          >
            {cta}
          </button>
        )}
        {cta && isProvider && onProviderBannerAction && providerPresentation?.bannerAction && (
          <button
            type="button"
            onClick={() => onProviderBannerAction(providerPresentation.bannerAction)}
            className="rounded-lg bg-white/90 px-4 py-2.5 text-sm font-semibold border border-current/25 hover:bg-white shadow-sm shrink-0"
          >
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}

function normalizeOfferSuccessPercent(raw) {
  if (raw == null || raw === "") return null;
  let n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n > 0 && n <= 1) n *= 100;
  return Math.min(100, Math.max(0, n));
}

function dedupeTipStrings(arr) {
  return [...new Set((arr || []).filter((s) => typeof s === "string" && s.trim()))].map((s) => s.trim());
}

/** Ujednolicenie pól predykcji (stare API: factors.positive; nowe: positiveFactors). */
function mergeOrderPredictionForUi(pred) {
  if (!pred || typeof pred !== "object") return null;
  const positiveFactors =
    Array.isArray(pred.positiveFactors) && pred.positiveFactors.length > 0
      ? pred.positiveFactors
      : Array.isArray(pred.factors?.positive)
        ? pred.factors.positive
        : [];
  const negativeFactors =
    Array.isArray(pred.negativeFactors) && pred.negativeFactors.length > 0
      ? pred.negativeFactors
      : Array.isArray(pred.factors?.negative)
        ? pred.factors.negative
        : [];
  const actionableTips = dedupeTipStrings([
    ...(Array.isArray(pred.actionableTips) ? pred.actionableTips : []),
    ...(Array.isArray(pred.recommendations) ? pred.recommendations : []),
  ]);
  return {
    ...pred,
    positiveFactors,
    negativeFactors,
    actionableTips,
  };
}

// Komponenty widoków etapowych
function OrderOffersStageView({ order, orderId, onAcceptOffer, onCancelOffer, onEditOffer, onEditOrder, isClient, isProvider, myOffer, showOrderInfo = true, showMyOfferCard = true, showAiHint = true }) {
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const { user } = useAuth();
  const [providerOfferAnalysis, setProviderOfferAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  /** Pełna analiza AI oferty (cena, czynniki, %) — domyślnie zwinięta, żeby nie szokować samym % */
  const [providerAiOfferCoachOpen, setProviderAiOfferCoachOpen] = useState(false);
  
  // Sprawdź czy klient ma pakiet PRO (dla providera - aby pokazać szczegóły innych ofert)
  const clientHasPro = order.client?.level === 'pro' || 
                       order.client?.providerLevel === 'pro' || 
                       order.client?.badges?.includes('pro') ||
                       order.client?.subscription?.planKey === 'PROV_PRO';
  
  // Sprawdź czy provider ma pakiet PRO
  const providerHasPro = user?.level === 'pro' || 
                         user?.providerLevel === 'pro' || 
                         user?.badges?.includes('pro') ||
                         user?.subscription?.planKey === 'PROV_PRO' ||
                         user?.providerTier === 'pro';
  
  // Liczba ofert (dla providera)
  const totalOffersCount = order.offers?.length || 0;

  // Pobierz analizę AI dla oferty providera (tylko dla providerów z pakietem PRO)
  useEffect(() => {
    if (!isProvider || !myOffer || !providerHasPro) return;
    
    const fetchProviderOfferAnalysis = async () => {
      setLoadingAnalysis(true);
      try {
        const token = localStorage.getItem('token');
        const API = import.meta.env.VITE_API_URL || '';
        
        // Użyj istniejących endpointów do analizy oferty
        const [predictionRes, pricingRes] = await Promise.all([
          fetch(apiUrl(`/api/ai/advanced/order-prediction/${orderId}`), {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null),
          myOffer.amount ? fetch(apiUrl(`/api/ai/advanced/pricing-advice`), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              orderId,
              proposedAmount: myOffer.amount || myOffer.price,
              orderDescription: order.description
            })
          }).catch(() => null) : null
        ]);
        
        const analysis = {
          prediction: predictionRes?.ok ? await predictionRes.json() : null,
          pricing: pricingRes?.ok ? await pricingRes.json() : null
        };
        
        // Jeśli mamy dane, stwórz analizę
        if (analysis.prediction || analysis.pricing) {
          setProviderOfferAnalysis(analysis);
        }
      } catch (error) {
        console.error('Błąd pobierania analizy AI dla oferty:', error);
      } finally {
        setLoadingAnalysis(false);
      }
    };
    
    fetchProviderOfferAnalysis();
  }, [orderId, isProvider, myOffer, providerHasPro, order.description]);

  useEffect(() => {
    setProviderAiOfferCoachOpen(false);
  }, [orderId, myOffer?._id, myOffer?.id]);

  useEffect(() => {
    // Pobierz rekomendację AI dla najlepszej oferty (tylko dla klienta)
    if (!isClient) return;
    
    const fetchAIRecommendation = async () => {
      try {
        const token = localStorage.getItem('token');
        const API = import.meta.env.VITE_API_URL || '';
        const offers = await getOffersOfOrder({ token, orderId });
        const offerList = Array.isArray(offers) ? offers : [];
        
        if (offerList.length > 0) {
          try {
            const aiRes = await fetch(apiUrl(`/api/ai/advanced/analyze-offers`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                orderId,
                offers: offerList,
                topN: offerList.length >= 5 ? 3 : 0
              })
            });
            if (aiRes.ok) {
              const aiData = await aiRes.json();
              setAiRecommendation(aiData);
            }
          } catch (e) {
            console.warn('AI recommendation failed:', e);
          }
        }
      } catch (error) {
        console.error('Błąd pobierania rekomendacji AI:', error);
      }
    };
    fetchAIRecommendation();
  }, [orderId, isClient]);

  if (isProvider) {
    // WIDOK DLA PROVIDERA - pokaż informacje o zleceniu i/lub jego ofercie (zależnie od showOrderInfo / showMyOfferCard)
    return (
      <div className="space-y-6">
        {showOrderInfo && (
        <>
        {/* Informacje o zleceniu – ta sama kolejność i etykiety co przy tworzeniu zlecenia (kategoria, opis, budżet, rozliczenie, kiedy pomoc, kontakt, lokalizacja) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
              <FileText className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Informacje o zleceniu</h2>
              <p className="text-sm text-slate-600">
                {myOffer ? 'Szczegóły zlecenia, na które złożyłeś ofertę' : 'Dane uzupełnione przez klienta przy złożeniu zlecenia'}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {/* Kategoria / Usługa */}
            <div>
              <div className="text-sm font-medium text-gray-700">Usługa</div>
              <div className="mt-1 flex items-center gap-2 text-slate-900">
                <Briefcase className="h-4 w-4 text-slate-500" />
                <span>{serviceLabel(order.service)}</span>
              </div>
              {order.serviceDetails && (
                <div className="mt-1 text-indigo-700 font-medium text-sm">{order.serviceDetails}</div>
              )}
            </div>

            {/* Opis zlecenia */}
            <div>
              <div className="text-sm font-medium text-gray-700">Opis zlecenia</div>
              <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-200">{order.description || 'Brak opisu'}</p>
            </div>

            {order.aiBrief && (order.aiBrief.title || order.aiBrief.customerSummary || order.aiBrief.bullets?.length > 0) && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-indigo-950">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      AI brief dla wykonawcy
                    </div>
                    <p className="text-xs text-indigo-700 mt-0.5">
                      Dane przygotowane przez asystenta z rozmowy klienta.
                    </p>
                  </div>
                  {order.aiBrief.quality?.percent != null && (
                    <div className="rounded-full bg-white border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      Jakość {order.aiBrief.quality.percent}%
                    </div>
                  )}
                </div>
                {order.aiBrief.title && (
                  <div className="text-sm font-semibold text-slate-900 mb-2">{order.aiBrief.title}</div>
                )}
                {order.aiBrief.bullets?.length > 0 ? (
                  <ul className="space-y-1 text-sm text-slate-800">
                    {order.aiBrief.bullets.slice(0, 6).map((item, idx) => (
                      <li key={idx} className="flex gap-2">
                        <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : order.aiBrief.customerSummary ? (
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{order.aiBrief.customerSummary}</p>
                ) : null}
                {(order.aiBrief.contextSnapshot?.handoffNote || order.aiBrief.contextSnapshot?.extractedFacts?.length > 0) && (
                  <div className="mt-3 rounded-lg border border-indigo-100 bg-white/80 p-3">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                      Kontekst z rozmowy AI
                    </div>
                    {order.aiBrief.contextSnapshot.handoffNote && (
                      <p className="text-xs text-slate-700">
                        {order.aiBrief.contextSnapshot.handoffNote}
                      </p>
                    )}
                    {order.aiBrief.contextSnapshot.extractedFacts?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {order.aiBrief.contextSnapshot.extractedFacts.slice(0, 6).map((fact, idx) => (
                          <span key={`${fact}-${idx}`} className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-800">
                            {fact}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {order.aiBrief.safety?.flag && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-white p-3 text-sm text-red-800">
                    <div className="font-semibold">{order.aiBrief.safety.title || 'Uwaga bezpieczeństwa'}</div>
                    <div className="mt-1 text-xs">{order.aiBrief.safety.reason || order.aiBrief.safety.recommendation}</div>
                    {order.aiBrief.safety.actions?.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-xs space-y-0.5">
                        {order.aiBrief.safety.actions.slice(0, 4).map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {order.aiBrief.suggestedAttachments?.length > 0 && (
                  <div className="mt-3 text-xs text-indigo-800 bg-white/70 border border-indigo-100 rounded-lg px-3 py-2">
                    Zdjęcia/dane, które warto poprosić klienta o dosłanie: {order.aiBrief.suggestedAttachments.join(', ')}
                  </div>
                )}
                {order.aiBrief.questionsForProvider?.length > 0 && (
                  <div className="mt-2 text-xs text-slate-700">
                    Pytania pomocnicze: {order.aiBrief.questionsForProvider.join(' · ')}
                  </div>
                )}
              </div>
            )}

            {/* Lokalizacja i Budżet */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700">Lokalizacja</div>
                <div className="mt-1 flex items-center gap-2 text-slate-900">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span>{typeof order.location === 'string' ? order.location : (order.location?.address || order.location?.city || 'Nie podano')}</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">Budżet</div>
                <div className="mt-1 flex items-center gap-2 text-slate-900 font-semibold">
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  <span>{order.budget ? `${order.budget} zł` : (order.budgetFrom || order.budgetTo) ? `${order.budgetFrom || '?'}–${order.budgetTo || '?'} zł` : 'Nie podano'}</span>
                </div>
              </div>
            </div>

            {/* Preferowane rozliczenie */}
            {order.paymentPreference && (
              <div>
                <div className="text-sm font-medium text-gray-700">Preferowane rozliczenie</div>
                <div className="mt-1">
                  {order.paymentPreference === 'system' ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600">🛡️</span>
                        <div>
                          <div className="font-semibold text-emerald-900">Helpfli Protect (rekomendowane)</div>
                          <div className="text-xs text-emerald-700 mt-0.5">Płatność przez system Helpfli. Gwarancja, spory, bezpieczne rozliczenie.</div>
                        </div>
                      </div>
                    </div>
                  ) : order.paymentPreference === 'external' ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600">💳</span>
                        <div>
                          <div className="font-semibold text-amber-900">Płatność poza systemem</div>
                          <div className="text-xs text-amber-700 mt-0.5">Rozliczenie bezpośrednio z klientem. Brak gwarancji Helpfli.</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">🔄</span>
                        <div>
                          <div className="font-semibold text-blue-900">Oba warianty (ustalimy przy akceptacji oferty)</div>
                          <div className="text-xs text-blue-700 mt-0.5">Klient wybierze przy akceptacji.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Kiedy ma nastąpić pomoc */}
            {(order.urgency || order.priorityDateTime || order.preferredTime) && (
              <div>
                <div className="text-sm font-medium text-gray-700">Kiedy ma nastąpić pomoc</div>
                <div className="mt-1">
                  {order.priorityDateTime ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600">⚡</span>
                        <div className="font-semibold text-amber-900">Termin priorytetowy</div>
                      </div>
                      <div className="text-sm text-amber-800 mt-0.5">
                        {new Date(order.priorityDateTime).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ) : order.urgency ? (
                    <div className="text-slate-900">
                      {order.urgency === 'now' ? '⚡ Pilne' :
                       order.urgency === 'today' ? '📅 Dzisiaj' :
                       order.urgency === 'tomorrow' ? '📅 Jutro' :
                       order.urgency === 'this_week' ? '📅 W tym tygodniu' :
                       '📅 Elastyczne'}
                    </div>
                  ) : (
                    <div className="text-slate-900">{order.preferredTime}</div>
                  )}
                </div>
              </div>
            )}

            {/* Preferowana metoda kontaktu */}
            {order.contactPreference && (
              <div>
                <div className="text-sm font-medium text-gray-700">Preferowana metoda kontaktu</div>
                <div className="mt-1 text-slate-900">
                  {order.contactPreference === 'phone' ? '📞 Telefon' :
                   order.contactPreference === 'email' ? '📧 Email' :
                   order.contactPreference === 'chat' ? '💬 Czat' :
                   order.contactPreference}
                </div>
              </div>
            )}

            {/* Status zlecenia (dla wykonawcy) */}
            <div className="border-t border-slate-200 pt-4">
              <div className="text-sm font-medium text-gray-700">Status zlecenia</div>
              <div className="mt-1 text-slate-900">
                {order.status === 'collecting_offers' ? 'Zbieram oferty' : order.status === 'open' ? 'Otwarte' : order.status || 'Nieznany'}
              </div>
            </div>
          </div>

          {/* Informacja o liczbie ofert */}
          {(order.status === 'collecting_offers' || order.status === 'open') && (
            <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <div className="flex items-center gap-2">
                <span className="font-medium">Liczba złożonych ofert:</span>
                <span>{totalOffersCount || 0}</span>
                <span className="text-blue-800">
                  {totalOffersCount === 1 ? ' oferta' : totalOffersCount < 5 ? ' oferty' : ' ofert'}
                </span>
              </div>
              {clientHasPro && totalOffersCount > 1 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-800 mb-2">
                    Klient ma pakiet PRO - widzisz szczegóły innych ofert:
                  </p>
                  <div className="space-y-2">
                    {order.offers
                      ?.filter(o => {
                        const offerId = o._id || o.id;
                        const myOfferId = myOffer?._id || myOffer?.id;
                        return offerId && myOfferId && String(offerId) !== String(myOfferId);
                      })
                      .map((offer, idx) => (
                        <div key={offer._id || offer.id || idx} className="text-xs bg-white p-2 rounded border border-blue-200">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-700">
                              {offer.providerMeta?.name || 'Inny wykonawca'}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {offer.amount || offer.price} zł
                            </span>
                          </div>
                          {offer.pricing?.badge && (
                            <div className="mt-1 text-slate-500">
                              Badge: {offer.pricing.badge === 'optimal' ? 'Optymalna' :
                                      offer.pricing.badge === 'fair' ? 'Uczciwa' :
                                      offer.pricing.badge === 'low' ? 'Niska' :
                                      offer.pricing.badge === 'high' ? 'Wysoka' : offer.pricing.badge}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {!clientHasPro && totalOffersCount > 1 && (
                <p className="text-xs text-blue-800 mt-2">
                  Szczegóły innych ofert są widoczne tylko dla klientów z pakietem PRO.
                </p>
              )}
            </div>
          )}

            {/* Informacja gdy klient wybrał innego */}
            {order.acceptedOfferId && myOffer && (() => {
              const acceptedOfferId = order.acceptedOfferId?._id || order.acceptedOfferId;
              const myOfferId = myOffer._id || myOffer.id;
              const acceptedProviderId =
                order?.provider?._id || order?.provider || order?.acceptedOffer?.providerId;
              const myProviderId = myOffer?.providerId?._id || myOffer?.providerId;
              const isMyOfferAcceptedById =
                acceptedOfferId && myOfferId && String(acceptedOfferId) === String(myOfferId);
              const isMyOfferAcceptedByProvider =
                acceptedProviderId && myProviderId && String(acceptedProviderId) === String(myProviderId);
              const isMyOfferAccepted = isMyOfferAcceptedById || isMyOfferAcceptedByProvider;
              
              if (!isMyOfferAccepted) {
                return (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-600 text-xl">❌</span>
                      <span className="font-semibold text-red-900">Klient wybrał inną ofertę</span>
                    </div>
                    <p className="text-sm text-red-800 mb-2">
                      Klient zaakceptował ofertę innego wykonawcy.
                    </p>
                    {totalOffersCount > 0 && (
                      <p className="text-xs text-red-700">
                        Łącznie złożono {totalOffersCount} {totalOffersCount === 1 ? 'oferta' : totalOffersCount < 5 ? 'oferty' : 'ofert'}.
                      </p>
                    )}
                    {clientHasPro && order.acceptedOffer && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <p className="text-xs text-red-700 mb-2">Szczegóły zaakceptowanej oferty:</p>
                        <div className="text-xs bg-white p-2 rounded border border-red-200">
                          <div className="flex justify-between items-center">
                            <span className="text-red-700">
                              {order.acceptedOffer.providerMeta?.name || 'Wybrany wykonawca'}
                            </span>
                            <span className="font-semibold text-red-900">
                              {order.acceptedOffer.amount || order.acceptedOffer.price} zł
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            {/* Faktura od providera */}
            {order.invoice && order.invoice.url && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-green-900 mb-1 block">📄 Faktura</span>
                    <span className="text-xs text-green-700">{order.invoice.filename || 'Faktura.pdf'}</span>
                    {order.invoice.uploadedAt && (
                      <span className="text-xs text-green-600 block mt-1">
                        Wrzucona: {new Date(order.invoice.uploadedAt).toLocaleDateString('pl-PL')}
                      </span>
                    )}
                  </div>
                  <a
                    href={`${import.meta.env.VITE_API_URL || ''}${order.invoice.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Pobierz fakturę
                  </a>
                </div>
              </div>
            )}

            {/* Załączniki (zdjęcia/filmy) – klient dodaje przy zleceniu; wykonawca też widzi (klient wyraża zgodę, dodając załączniki) */}
            {order.attachments && Array.isArray(order.attachments) && order.attachments.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-600 mb-2 block">Załączniki (zdjęcia/filmy):</span>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {order.attachments.map((att, idx) => (
                    <OrderAttachmentItem key={att._id || att.url || idx} orderId={orderId} att={att} idx={idx} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
        )}

        {/* Twoja oferta – w zakładce "Szczegóły" nie pokazujemy (showMyOfferCard=false); w zakładce "Twoja oferta" tylko ta karta */}
        {showMyOfferCard && myOffer ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Twoja oferta</h2>
              <p className="text-xs text-slate-500">Oczekuje na akceptację</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-amber-900">Oferta złożona</span>
                </div>
                <p className="text-sm text-amber-800">
                  Twoja oferta została złożona i oczekuje na akceptację przez klienta.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Szczegóły Twojej oferty</h3>
                <div className="text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-500">Kwota</span>
                    <span className="font-semibold text-slate-900">{myOffer.amount || myOffer.price} zł</span>
                  </div>
                  {myOffer.message && (
                    <div className="py-2 border-b border-slate-200">
                      <div className="text-slate-500">Wiadomość</div>
                      <p className="mt-1 text-slate-900 text-sm">{myOffer.message}</p>
                    </div>
                  )}
                  {myOffer.completionDate && (
                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-500">Termin realizacji</span>
                      <span className="text-slate-900">
                        {formatSmartTime(myOffer.completionDate, { maxRelativeDays: 7 })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Status: {myOffer.status === 'submitted' || myOffer.status === 'sent' ? 'Oczekuje na akceptację' : myOffer.status}</span>
                  </div>
                </div>
                {(myOffer.status === 'submitted' || myOffer.status === 'sent') && (
                  <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2">
                    {onEditOffer && (
                      <button
                        type="button"
                        onClick={onEditOffer}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edytuj ofertę
                      </button>
                    )}
                    {onCancelOffer && (
                      <button
                        type="button"
                        onClick={onCancelOffer}
                        className="flex-1 rounded-lg border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
                      >
                        Wycofaj ofertę
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Analiza AI dla providera z pakietem PRO */}
              {providerHasPro && myOffer && (
                <>
                  {loadingAnalysis ? (
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span className="text-sm text-indigo-700">Analizuję Twoją ofertę...</span>
                      </div>
                    </div>
                  ) : providerOfferAnalysis ? (
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-6 h-6 text-indigo-600 shrink-0" />
                        <h3 className="font-semibold text-indigo-900">Jak wzmocnić Twoją ofertę</h3>
                        <span className="ml-auto px-2 py-1 bg-indigo-600 text-white text-xs rounded-full font-medium">
                          PRO
                        </span>
                      </div>
                      <p className="text-xs text-indigo-900/85 mb-3 leading-relaxed">
                        Przygotowaliśmy wskazówki dopasowane do tego zlecenia i treści Twojej oferty — zacznij od nich, zamiast od samej liczby.
                      </p>

                      {providerOfferAnalysis.prediction?.isTopChoice && (
                        <div className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-lg mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">⭐</span>
                            <div className="flex-1">
                              <p className="font-semibold text-emerald-900">AI wyróżnia Twoją ofertę!</p>
                              <p className="text-xs text-emerald-700 mt-1">
                                Twoja oferta wygląda na mocną w tym zestawieniu — i tak możesz sprawdzić szczegóły poniżej.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {!providerAiOfferCoachOpen ? (
                        <button
                          type="button"
                          aria-expanded={providerAiOfferCoachOpen}
                          onClick={() => setProviderAiOfferCoachOpen(true)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-indigo-400 bg-white px-4 py-3 text-sm font-semibold text-indigo-900 shadow-sm hover:bg-indigo-50/80 transition-colors"
                        >
                          Zobacz, jak poprawić ofertę i zwiększyć szanse
                          <ChevronDown className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                        </button>
                      ) : (
                        <div className="space-y-3">
                          {providerOfferAnalysis.pricing && (
                            <div className="p-3 bg-white rounded-lg border border-indigo-100">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-indigo-600">💰</span>
                                <span className="font-medium text-indigo-900">Analiza ceny</span>
                              </div>
                              {providerOfferAnalysis.pricing.advice && (
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium text-slate-700">Pozycja:</span>{' '}
                                    <span className={`font-semibold ${
                                      providerOfferAnalysis.pricing.advice.position === 'optimal' ? 'text-emerald-600' :
                                      providerOfferAnalysis.pricing.advice.position === 'low' ? 'text-amber-600' :
                                      providerOfferAnalysis.pricing.advice.position === 'high' ? 'text-red-600' :
                                      'text-slate-600'
                                    }`}>
                                      {providerOfferAnalysis.pricing.advice.position === 'optimal' ? 'Optymalna ✅' :
                                       providerOfferAnalysis.pricing.advice.position === 'low' ? 'Niska ⚠️' :
                                       providerOfferAnalysis.pricing.advice.position === 'high' ? 'Wysoka ⚠️' :
                                       providerOfferAnalysis.pricing.advice.position}
                                    </span>
                                  </div>
                                  {providerOfferAnalysis.pricing.advice.reasoning && (
                                    <p className="text-slate-600 text-xs mt-1">
                                      {providerOfferAnalysis.pricing.advice.reasoning}
                                    </p>
                                  )}
                                  {providerOfferAnalysis.pricing.advice.suggestedAmount && (
                                    <div className="mt-2 pt-2 border-t border-indigo-100">
                                      <span className="text-xs text-indigo-700">Sugerowana cena: </span>
                                      <span className="font-semibold text-indigo-900">
                                        {providerOfferAnalysis.pricing.advice.suggestedAmount} zł
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {providerOfferAnalysis.prediction && (() => {
                            const pred = mergeOrderPredictionForUi(providerOfferAnalysis.prediction);
                            if (!pred) return null;
                            const pricingAdv = providerOfferAnalysis.pricing?.advice;
                            const fromPricing = [];
                            if (pricingAdv) {
                              const p = pricingAdv.position;
                              if (p === "high" || p === "above_max") {
                                fromPricing.push(
                                  "Przy analizie ceny: kwota jest wysoko — rozważ realnie niższą stawkę albo dopisz w wiadomości, za co klient dopłaca (np. oryginalne części, gwarancja, pilniejszy termin)."
                                );
                              }
                              if (p === "low" || p === "below_min") {
                                fromPricing.push(
                                  "Cena jest nisko względem typowych widełek — w opisie ujmij jakość i zakres, żeby klient nie uznał oferty za „podejrzaną w dół”."
                                );
                              }
                              if (p === "optimal" || p === "fair") {
                                fromPricing.push(
                                  "Cena wygląda na sensowną względem widełek — postaw na klarowny termin, zakres prac i szybką odpowiedź w czacie."
                                );
                              }
                              if (pricingAdv.suggestedAmount != null && `${pricingAdv.suggestedAmount}`.trim() !== "") {
                                fromPricing.push(
                                  `Połącz to z sekcją „Analiza ceny” powyżej — jest tam sugerowana kwota ok. ${pricingAdv.suggestedAmount} zł (orientacyjnie).`
                                );
                              }
                            }
                            let actionable = dedupeTipStrings([...(pred.actionableTips || []), ...fromPricing]).slice(0, 8);
                            if (actionable.length === 0) {
                              actionable = [
                                "Kliknij „Edytuj ofertę” i dopisz 2–4 zdania: co dokładnie zrobisz, kiedy możesz zacząć oraz czy w cenie są części i dojazd.",
                                "Sprawdź, czy proponowany termin realizacji jest zgodny z tym, czego szuka klient w opisie zlecenia.",
                              ];
                            }
                            const pct = normalizeOfferSuccessPercent(pred.successProbability);
                            const pctLabel =
                              pct != null
                                ? `${pct.toLocaleString("pl-PL", { maximumFractionDigits: 1, minimumFractionDigits: 0 })}%`
                                : "";
                            return (
                              <div className="p-3 bg-white rounded-lg border border-indigo-100 space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-indigo-600">📋</span>
                                  <span className="font-medium text-indigo-900">Wskazówki z analizy</span>
                                </div>

                                <div className="rounded-lg bg-indigo-50/90 border border-indigo-100 p-3">
                                  <p className="text-xs font-semibold text-indigo-950 mb-2">
                                    Co zrobić, żeby podnieść szanse
                                  </p>
                                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-indigo-950/95 leading-relaxed">
                                    {actionable.map((t, idx) => (
                                      <li key={idx} className="pl-0.5 marker:font-semibold">
                                        {t}
                                      </li>
                                    ))}
                                  </ol>
                                </div>

                                {pred.positiveFactors && pred.positiveFactors.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-emerald-700 mb-1">Mocne strony</p>
                                    <ul className="text-xs text-slate-600 space-y-1">
                                      {pred.positiveFactors.slice(0, 5).map((factor, idx) => (
                                        <li key={idx}>• {factor}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {pred.negativeFactors && pred.negativeFactors.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-amber-800 mb-1">Warto poprawić</p>
                                    <ul className="text-xs text-slate-600 space-y-1">
                                      {pred.negativeFactors.slice(0, 5).map((factor, idx) => (
                                        <li key={idx}>• {factor}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {pct != null && (
                                  <div className="pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-indigo-600 text-sm">📊</span>
                                      <span className="text-xs font-medium text-slate-700">Szacunkowa szansa (heurystyka, orientacyjnie)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-slate-200 rounded-full h-2 min-w-0">
                                        <div
                                          className="bg-indigo-600 h-2 rounded-full transition-all"
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                      <span className="font-semibold text-indigo-900 min-w-[3.25rem] text-right text-sm tabular-nums">
                                        {pctLabel}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-2 leading-snug">
                                      To szacunek automatyczny (reguły + dane ofert), nie gwarancja wyniku — o wyborze decyduje klient.
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          <button
                            type="button"
                            onClick={() => setProviderAiOfferCoachOpen(false)}
                            className="w-full text-center text-xs font-medium text-indigo-800 hover:text-indigo-950 py-1.5"
                          >
                            Zwiń wskazówki
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                  
                  {!providerOfferAnalysis && !loadingAnalysis && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-xs text-slate-600">
                        Analiza AI dostępna tylko dla pakietu PRO. 
                        <Link to="/why-pro" className="text-indigo-600 hover:underline ml-1">
                          Dowiedz się więcej →
                        </Link>
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Co dalej?</h3>
                <p className="text-sm text-blue-800">
                  Klient przejrzy Twoją ofertę wraz z innymi. Jeśli zostanie zaakceptowana, otrzymasz powiadomienie i będziesz mógł rozpocząć realizację zlecenia.
                </p>
              </div>
            </div>
          </div>
        </div>
        ) : showMyOfferCard && !myOffer ? (
          <p className="text-sm text-slate-500 text-center py-2">
            Aby złożyć ofertę, wróć do{' '}
            <Link to="/provider-home" className="text-indigo-600 hover:underline font-medium">
              listy zleceń
            </Link>
            {' '}i kliknij „Złóż ofertę” przy tym zleceniu.
          </p>
        ) : null}
      </div>
    );
  }

  // WIDOK DLA KLIENTA – tu już nie pokazujemy pełnych szczegółów zlecenia,
  // bo są one w górnym bloku z akcjami (Edytuj / Wydłuż ważność).
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      {isClient && showAiHint && <div className="mb-4"><AIStepHint stage="offers" /></div>}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
          <Package className="h-4 w-4 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Oferty złożone</h2>
          <p className="text-xs text-slate-500">Wybierz najlepszą ofertę</p>
        </div>
      </div>

      {aiRecommendation && (
        <div className="mb-4 p-4 rounded-xl bg-indigo-50 border border-indigo-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-900 mb-1">AI rekomenduje najlepszą ofertę</h3>
              <p className="text-sm text-indigo-800">{aiRecommendation.reasoning || 'Najlepsza oferta na podstawie analizy ceny, oceny wykonawcy i dopasowania'}</p>
              {aiRecommendation.comparison && (
                <p className="text-xs text-indigo-700 mt-2 border-t border-indigo-200 pt-2">{aiRecommendation.comparison}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div id="order-offers-section">
        <OffersList
          orderId={orderId}
          recommendedOfferId={aiRecommendation?.recommendedOfferId}
          topOfferIds={aiRecommendation?.topOfferIds}
          aiReasoning={aiRecommendation?.reasoning}
        />
      </div>
    </div>
  );
}

function OrderAcceptedStageView({ order, orderId, isClient, isProvider, onFundEscrow, CheckoutButton, onStartWork, isLoadingStartWork = false, isLoadingFundEscrow = false, videoSession = null, showAiHint = true }) {
  const navigate = useNavigate();
  const provider = order.provider || order.acceptedOffer?.providerMeta;
  const acceptedOffer = order.acceptedOffer || order.offers?.find(o => o._id === order.acceptedOfferId);
  
  // Sprawdź czy płatność jest zewnętrzna (poza Helpfli)
  const isExternalPayment = order.paymentMethod === 'external' || order.paymentPreference === 'external';
  const externalCommissionStatus = order.externalCommissionStatus || 'unpaid';
  const externalCommissionPaid = externalCommissionStatus === 'succeeded';
  const platformFee = Number(order.pricing?.platformFee || 0);
  const externalCommissionRequired = isExternalPayment && platformFee > 0;
  const externalReadyForStart = !externalCommissionRequired || externalCommissionPaid;
  const systemPaymentReady =
    !isExternalPayment &&
    (order.paymentStatus === "succeeded" ||
      order.paidInSystem ||
      order.status === "funded");
  const canStartWorkNow = isExternalPayment ? externalReadyForStart : systemPaymentReady;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      {isClient && showAiHint && <div className="mb-4"><AIStepHint stage="accepted" /></div>}
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isProvider && canStartWorkNow ? "bg-emerald-100" : "bg-orange-100"
          }`}
        >
          <CheckCircle2
            className={`h-4 w-4 ${
              isProvider && canStartWorkNow ? "text-emerald-600" : "text-orange-600"
            }`}
          />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {isClient
              ? "Oferta zaakceptowana"
              : canStartWorkNow
                ? "Zlecenie opłacone — Twoja kolej"
                : "Oferta zaakceptowana"}
          </h2>
          <p className="text-xs text-slate-500">
            {isClient ? (
              "Informacje o wykonawcy i płatności"
            ) : canStartWorkNow ? (
              isExternalPayment ? (
                "Możesz rozpocząć pracę — użyj przycisku w sekcji poniżej, gdy jesteś gotowy."
              ) : (
                "Środki są zabezpieczone w systemie. Ustal szczegóły na czacie, potem potwierdź start realizacji."
              )
            ) : isExternalPayment ? (
              "Klient musi jeszcze dokończyć wymagane formalności (np. prowizja za zlecenie)."
            ) : (
              "Oczekuj na opłatę zlecenia przez klienta — po zaksięgowaniu wpłaty pojawi się przycisk startu."
            )}
          </p>
        </div>
      </div>

      {isExternalPayment && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ⚠️ Rozliczenie poza systemem Helpfli - brak gwarancji Helpfli. Płatność odbywa się bezpośrednio między Tobą a {isClient ? 'wykonawcą' : 'klientem'}.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {isClient ? (
          <>
            {/* Info o wykonawcy */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">Wykonawca</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold">
                    {(provider?.name || 'W').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-slate-900">{provider?.name || 'Wykonawca'}</div>
                  {provider?.ratingAvg && (
                    <div className="text-sm text-gray-600">
                      ⭐ {provider.ratingAvg} ({provider.ratingCount || 0} opinii)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info o ofercie */}
            {acceptedOffer && (
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-900 mb-2">Zaakceptowana oferta</h3>
                <div className="text-2xl font-bold text-indigo-900 mb-1">
                  {acceptedOffer.amount || acceptedOffer.price} zł
                </div>
                {acceptedOffer.message && (
                  <div className="text-sm text-indigo-800 mt-2">{acceptedOffer.message}</div>
                )}
              </div>
            )}

            {/* Płatność */}
            {isExternalPayment ? (
              <div id="accepted-payment-section" className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-semibold text-amber-900 mb-2">Rozliczenie poza Helpfli</h3>
                <p className="text-sm text-amber-800 mb-3">
                  Płatność za usługę odbywa się bezpośrednio między Tobą a wykonawcą. Aby przejść dalej, dokończ wymagane formalności (jeśli dotyczy).
                </p>
                {platformFee > 0 ? (
                  <div className="mb-3 rounded-lg bg-white border border-amber-200 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">Opłata serwisowa (wg oferty):</span>
                      <span className="font-semibold text-slate-900">{platformFee.toFixed(2)} PLN</span>
                    </div>
                    {platformFee > 0 && platformFee < 2 && !externalCommissionPaid && (
                      <p className="text-xs text-slate-600 mt-2 leading-snug">
                        Płatność kartą/BLIK ma minimum 2 zł — pobierzemy 2,00 PLN; prowizja z tej oferty to {platformFee.toFixed(2)} PLN.
                      </p>
                    )}
                    <div className="mt-2 text-xs">
                      {externalCommissionPaid ? (
                        <span className="text-emerald-700">✓ Formalności opłacone</span>
                      ) : externalCommissionStatus === 'processing' ? (
                        <span className="text-amber-700">⏳ Płatność w trakcie</span>
                      ) : (
                        <span className="text-amber-800">⚠️ Oczekuje na dokończenie formalności</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                    ✓ Dla tego zlecenia nie ma dodatkowej opłaty serwisowej.
                  </div>
                )}
                {!externalCommissionPaid && platformFee > 0 && (
                  <div className="mb-3">
                    <CheckoutButton
                      orderId={orderId}
                      createIntentPath="/api/payments/create-commission-intent"
                      showInvoiceOption={false}
                      buttonLabel="Dokończ formalności"
                    />
                  </div>
                )}
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700">
                  Status: {externalReadyForStart ? 'oczekuje na realizację przez wykonawcę.' : 'oczekuje na działanie klienta.'}
                </div>
              </div>
            ) : (
              <div id="accepted-payment-section" className="p-4 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">Płatność i ochrona</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Opłać zlecenie w systemie, aby środki były bezpieczne do czasu zakończenia pracy.
                    </p>
                  </div>
                </div>

                {order.paymentStatus === 'succeeded' || order.paidInSystem ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span className="font-medium text-emerald-900">Zlecenie zostało opłacone – środki są zabezpieczone.</span>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl bg-white/80 border border-blue-100 px-3 py-3 mb-3">
                      <p className="text-sm text-slate-800">
                        <span className="font-semibold">Helpfli Protect</span> blokuje płatność do momentu,
                        gdy oznaczysz zlecenie jako zakończone.
                      </p>
                    </div>
                    <div className="mb-3">
                      <CheckoutButton orderId={orderId} requestInvoiceDefault={order.requestInvoice} />
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• Obsługiwane: karta, BLIK, Przelewy24</li>
                      <li>
                        • Po opłacie w systemie masz ochronę Helpfli (spór, zwrot) — przy płatności poza systemem rozliczasz się bezpośrednio z wykonawcą.
                      </li>
                    </ul>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          // WIDOK DLA PROVIDERA
          <>
            {/* Status płatności + jednoznaczny CTA startu (kotwica dla banera „Następny krok”) */}
            <div
              id="provider-start-work"
              className={`rounded-2xl border p-5 ${
                canStartWorkNow
                  ? "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-sm"
                  : "border-amber-200 bg-amber-50/80"
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    canStartWorkNow ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-amber-600"
                  }`}
                >
                  {canStartWorkNow ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {canStartWorkNow ? "Rozpocznij realizację" : "Czekamy na klienta"}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {canStartWorkNow
                      ? isExternalPayment
                        ? "Formalności po stronie klienta są zakończone. Potwierdź start — status zmieni się na „W realizacji”, a klient dostanie powiadomienie."
                        : "Zlecenie jest opłacone i środki są zabezpieczone (escrow). Potwierdź start, gdy ustalisz z klientem szczegóły — dopiero wtedy status przejdzie na „W realizacji”."
                      : isExternalPayment
                        ? "Zanim zaczniesz pracę, klient musi dokończyć wymagane kroki (np. opłata prowizji). Wróć tu po ich zakończeniu — pojawi się zielony przycisk."
                        : "Klient jeszcze nie opłacił zlecenia w systemie. Po udanej płatności zobaczysz tutaj wyraźny przycisk „Przejdź do realizacji”."}
                  </p>
                </div>
              </div>
              {acceptedOffer?.completionDate && (
                <div
                  className={`mb-3 rounded-lg border px-3 py-2 text-xs ${
                    canStartWorkNow
                      ? "border-emerald-100 bg-white/70 text-emerald-900"
                      : "border-amber-100 bg-white/60 text-amber-900"
                  }`}
                >
                  Najbliższy termin z oferty:{" "}
                  <span className="font-medium">
                    {formatSmartTime(acceptedOffer.completionDate, { maxRelativeDays: 14 })}
                  </span>
                </div>
              )}
              {canStartWorkNow && onStartWork && (
                <button
                  type="button"
                  onClick={onStartWork}
                  disabled={isLoadingStartWork}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoadingStartWork && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLoadingStartWork ? "Rozpoczynanie…" : "Przejdź do realizacji"}
                </button>
              )}
              {!canStartWorkNow && (
                <div className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2 text-sm font-medium text-amber-800">
                  Następny krok po stronie klienta — nie musisz nic klikać; odśwież stronę za chwilę lub sprawdź czat.
                </div>
              )}
            </div>

            {/* Informacje o kliencie */}
            {order.client && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">Klient</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {(order.client.name || 'K').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{order.client.name || 'Klient'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Sesja wideo (jeśli istnieje) */}
            {videoSession && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-600 text-xl">🎥</span>
                  <h3 className="font-semibold text-blue-900">Spotkanie wideo</h3>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Status:</span>{' '}
                    {videoSession.status === 'scheduled' && 'Zaplanowane'}
                    {videoSession.status === 'active' && 'Aktywne'}
                    {videoSession.status === 'ended' && 'Zakończone'}
                    {videoSession.status === 'cancelled' && 'Anulowane'}
                  </div>
                  {videoSession.scheduledAt && (
                    <div className="text-sm text-blue-800">
                      <span className="font-medium">Termin:</span>{' '}
                      {formatSmartTime(videoSession.scheduledAt, { 
                        maxRelativeDays: 14,
                        fallbackFormat: 'long'
                      })}
                    </div>
                  )}
                </div>
                {(videoSession.status === 'scheduled' || videoSession.status === 'active') && (
                  <button
                    onClick={() => navigate(`/video/${videoSession._id}`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <span>🎥</span>
                    Rozpocznij spotkanie
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function OrderFundedStageView({ order, isClient, isProvider, onStartWork, isLoadingStartWork = false, showAiHint = true }) {
  const protectionTools = isHelpfliProtectionToolsEnabled(order);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      {isClient && showAiHint && <div className="mb-4"><AIStepHint stage="funded" /></div>}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <CreditCard className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Opłacone</h2>
          <p className="text-xs text-slate-500">Środki zabezpieczone w systemie</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Informacja o płatności */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 text-xl">✓</span>
            <span className="font-semibold text-green-900">Płatność zrealizowana</span>
          </div>
          <p className="text-sm text-green-800">
            {isClient 
              ? 'Środki zostały zabezpieczone w systemie escrow. Wykonawca może rozpocząć realizację zlecenia.'
              : 'Środki zostały zabezpieczone w systemie escrow. Możesz teraz rozpocząć realizację zlecenia.'}
          </p>
        </div>

        {/* Informacje o zleceniu */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 mb-3">Informacje o zleceniu</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Usługa:</span>
              <span className="font-medium text-slate-900">{serviceLabel(order.service)}</span>
            </div>
            {order.serviceDetails && (
              <div className="flex justify-between">
                <span className="text-slate-600">Szczegóły:</span>
                <span className="font-medium text-slate-900">{order.serviceDetails}</span>
              </div>
            )}
            {order.location && (
              <div className="flex justify-between">
                <span className="text-slate-600">Lokalizacja:</span>
                <span className="font-medium text-slate-900">
                  {order.location.address || order.location.city || 'Nie podano'}
                </span>
              </div>
            )}
            {order.budget && (
              <div className="flex justify-between">
                <span className="text-slate-600">Budżet:</span>
                <span className="font-medium text-slate-900">{order.budget} zł</span>
              </div>
            )}
          </div>
        </div>

        {/* Status oczekiwania */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            {isClient ? 'Oczekuje na realizację' : 'Gotowy do rozpoczęcia pracy'}
          </h3>
          <p className="text-sm text-blue-800">
            {isClient 
              ? 'Zlecenie jest opłacone i gotowe do realizacji. Wykonawca może teraz rozpocząć pracę.'
              : 'Klient opłacił zlecenie. Możesz teraz rozpocząć realizację. Po zakończeniu pracy będziesz mógł oznaczyć zlecenie jako zakończone.'}
          </p>
        </div>

        {/* Gwarancja Helpfli dla klienta */}
        {isClient && protectionTools && (
          <div className="p-3 bg-white rounded border border-green-200">
            <p className="text-xs text-green-900 font-medium mb-1">🛡️ Gwarancja Helpfli aktywna</p>
            <p className="text-xs text-green-700">
              Masz pełną ochronę: możliwość sporu, zwroty i wsparcie Helpfli w przypadku problemów.
            </p>
          </div>
        )}
        {isClient && !protectionTools && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-900">Ochrona Helpfli nie obejmuje tego zlecenia</p>
            <p className="mt-1 text-xs text-amber-800">
              Przy rozliczeniu poza systemem lub bez spełnionych warunków ochrony spory i zwroty nie są obsługiwane przez platformę — ustalenia pozostają między Tobą a wykonawcą.
            </p>
          </div>
        )}

        {/* Przycisk dla providera (kotwica jak w etapie „zaakceptowana”) */}
        {isProvider && (
          <div
            id="provider-start-work"
            className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm"
          >
            <button
              onClick={async () => {
                if (onStartWork) {
                  await onStartWork();
                }
              }}
              disabled={isLoadingStartWork}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoadingStartWork && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoadingStartWork ? 'Rozpoczynanie...' : 'Przejdź do realizacji'}
            </button>
            <p className="text-xs text-blue-700 mt-2 text-center">
              Po kliknięciu zlecenie przejdzie do etapu "W realizacji" i klient zostanie powiadomiony.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderInProgressStageView({ order, orderId, isClient, isProvider, onCompleteOrder, onConfirmReceipt, onReportDispute, onRequestRefund, isLoadingCompleteOrder = false, isLoadingConfirmReceipt = false, isLoadingReportDispute = false, isLoadingRequestRefund = false, videoSession = null, showAiHint = true }) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { push: toast } = useToast();
  const navigate = useNavigate();
  const protectionTools = isHelpfliProtectionToolsEnabled(order);
  const disputeOngoing = disputeCaseIsOngoing(order);
  const disputeArchive = disputeCaseHasResolvedArchive(order);

  const handleAddNote = async () => {
    if (!notes.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const API = import.meta.env.VITE_API_URL || '';
      await fetch(apiUrl(`/api/orders/${orderId}/notes`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ note: notes, type: isClient ? 'client_feedback' : 'provider_note' })
      });
      setNotes('');
      toast({ title: 'Uwaga zapisana', variant: 'success' });
    } catch (error) {
      console.error('Błąd zapisywania uwagi:', error);
      toast({ title: 'Nie udało się zapisać uwagi', description: getErrorMessage(error), variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      {isClient && showAiHint && <div className="mb-4"><AIStepHint stage="in_progress" /></div>}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <Settings className="h-4 w-4 text-purple-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">W realizacji</h2>
          <p className="text-xs text-slate-500">
            {isClient ? 'Wykonawca pracuje nad zleceniem' : 'Realizujesz zlecenie'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {isClient ? (
          <>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">Status realizacji</h3>
              <p className="text-sm text-purple-800">
                Wykonawca realizuje zlecenie. Możesz śledzić postęp i komunikować się przez czat.
              </p>
            </div>

            {/* Uwagi i feedback */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">Dodaj uwagę lub feedback</h3>
              <p className="text-xs text-gray-600 mb-3">
                {protectionTools
                  ? "Jeśli masz uwagi dotyczące realizacji, możesz je tutaj zapisać. W przypadku problemów z ochroną Helpfli możesz też zgłosić spór w sekcji poniżej."
                  : "Jeśli masz uwagi dotyczące realizacji, możesz je tutaj zapisać. Przy tej formie rozliczenia spory i zwroty nie są obsługiwane przez Helpfli — skontaktuj się bezpośrednio z wykonawcą."}
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Wpisz swoje uwagi..."
                className="w-full p-3 border rounded-lg text-sm"
                rows={3}
              />
              <button
                onClick={handleAddNote}
                disabled={submitting || !notes.trim()}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                {submitting ? 'Zapisywanie...' : 'Zapisz uwagę'}
              </button>
            </div>

            {/* Gwarancja Helpfli — tylko przy aktywnej ochronie (spójnie z banerem u góry) */}
            {protectionTools ? (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <h3 className="font-semibold text-indigo-900 mb-2">🛡️ Gwarancja Helpfli</h3>
                <p className="text-sm text-indigo-800 mb-3">Jeśli masz problemy z realizacją, możesz:</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={onReportDispute}
                    disabled={isLoadingReportDispute}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {isLoadingReportDispute && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoadingReportDispute ? "Zgłaszanie..." : "Zgłoś spór"}
                  </button>
                  <button
                    type="button"
                    onClick={onRequestRefund}
                    disabled={isLoadingRequestRefund}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {isLoadingRequestRefund && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoadingRequestRefund ? "Przetwarzanie..." : "Poproś o zwrot"}
                  </button>
                </div>
                <p className="text-xs text-indigo-700 mt-3">
                  Helpfli rozpatrzy spór w ciągu 24h i pomoże rozwiązać problem.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900 mb-1">Ochrona Helpfli niedostępna</h3>
                <p className="text-sm text-slate-600">
                  Przy tym zleceniu nie korzystasz z pełnej ochrony Helpfli (np. płatność poza systemem lub brak warunków ochrony). Sporu ani zwrotu środków przez platformę nie złożysz — rozwiązuj kwestie bezpośrednio z wykonawcą lub przez czat.
                </p>
              </div>
            )}

            {/* Sesja wideo (jeśli istnieje) */}
            {videoSession && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-600 text-xl">🎥</span>
                  <h3 className="font-semibold text-blue-900">Spotkanie wideo</h3>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Status:</span>{' '}
                    {videoSession.status === 'scheduled' && 'Zaplanowane'}
                    {videoSession.status === 'active' && 'Aktywne'}
                    {videoSession.status === 'ended' && 'Zakończone'}
                    {videoSession.status === 'cancelled' && 'Anulowane'}
                  </div>
                  {videoSession.scheduledAt && (
                    <div className="text-sm text-blue-800">
                      <span className="font-medium">Termin:</span>{' '}
                      {formatSmartTime(videoSession.scheduledAt, { 
                        maxRelativeDays: 14,
                        fallbackFormat: 'long'
                      })}
                    </div>
                  )}
                </div>
                {(videoSession.status === 'scheduled' || videoSession.status === 'active') && (
                  <button
                    onClick={() => navigate(`/video/${videoSession._id}`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <span>🎥</span>
                    Rozpocznij spotkanie
                  </button>
                )}
              </div>
            )}

            {/* Potwierdzenie odbioru - gdy provider zakończył */}
            {(order.status === 'completed' || order.completionNotes || order.completionType) && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h3 className="font-semibold text-emerald-900 mb-2">Zlecenie zakończone przez wykonawcę</h3>
                
                {/* Sprawdź czy płatność jest zewnętrzna */}
                {(() => {
                  const isExternalPayment = order.paymentMethod === 'external' || order.paymentPreference === 'external';
                  
                  return (
                    <>
                      {/* Podsumowanie zakończenia */}
                      <div className="mb-3 p-3 bg-white rounded border border-emerald-200">
                        <p className="text-xs font-medium text-emerald-900 mb-2">Podsumowanie zakończenia:</p>
                        {order.completionType === 'simple' && (
                          <p className="text-sm text-emerald-800">✓ Zlecenie zostało wykonane zgodnie z umową.</p>
                        )}
                        {order.completionType === 'with_notes' && order.completionNotes && (
                          <div>
                            <p className="text-xs font-medium text-emerald-900 mb-1">📝 Uwagi od wykonawcy:</p>
                            <p className="text-sm text-emerald-800">{order.completionNotes}</p>
                          </div>
                        )}
                        {/* Dla płatności zewnętrznej nie pokazuj opcji dopłaty */}
                        {order.completionType === 'with_payment' && !isExternalPayment && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-amber-900 mb-1">💰 Wymagana dopłata</p>
                      {order.additionalAmount && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-amber-800">Kwota dopłaty:</span>
                          <span className="font-semibold text-amber-900">{order.additionalAmount} zł</span>
                        </div>
                      )}
                      {order.paymentReason && (
                        <div>
                          <p className="text-xs font-medium text-amber-900 mb-1">Uzasadnienie:</p>
                          <p className="text-sm text-amber-800">{order.paymentReason}</p>
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-amber-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-amber-800">Kwota bazowa:</span>
                          <span className="font-medium">{order.acceptedOffer?.amount || order.acceptedOffer?.price || order.budget || 0} zł</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-amber-800">Dopłata:</span>
                          <span className="font-medium">+{order.additionalAmount || 0} zł</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-amber-200 font-semibold">
                          <span className="text-amber-900">Łącznie do zapłaty:</span>
                          <span className="text-amber-900">{(parseFloat(order.acceptedOffer?.amount || order.acceptedOffer?.price || order.budget || 0) + parseFloat(order.additionalAmount || 0)).toFixed(2)} zł</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-sm text-emerald-800 mb-3">
                  {order.completionType === "with_payment" && !isExternalPayment
                    ? protectionTools
                      ? "Sprawdź szczegóły dopłaty. Możesz zaakceptować i zapłacić, lub wszcząć spór jeśli nie zgadzasz się z dopłatą."
                      : "Sprawdź szczegóły dopłaty i zaakceptuj płatność dopłaty, jeśli się zgadzasz. Sporu przez Helpfli przy tym zleceniu nie złożysz — pełna ochrona nie jest aktywna."
                    : "Sprawdź czy wszystko jest w porządku i potwierdź odbiór."}
                </p>

                <div className="space-y-2">
                  {order.completionType === 'with_payment' && !isExternalPayment ? (
                    <>
                      {order.additionalPaymentStatus === 'succeeded' && (
                        <div className="w-full px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium text-center border border-emerald-200">
                          Dopłata została opłacona. Możesz teraz potwierdzić odbiór.
                        </div>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem("token");
                            const res = await fetch(apiUrl('/api/payments/create-additional-intent'), {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify({ orderId, methodHint: 'card' })
                            });
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) throw new Error(data?.message || 'Nie udało się utworzyć płatności dopłaty');
                            window.location.href = `/checkout/${encodeURIComponent(orderId)}?pi=${encodeURIComponent(data.paymentIntentId)}&cs=${encodeURIComponent(data.clientSecret)}`;
                          } catch (error) {
                            console.error('Błąd akceptacji dopłaty:', error);
                            toast({ title: 'Błąd akceptacji dopłaty', description: getErrorMessage(error), variant: 'error' });
                          }
                        }}
                        disabled={order.additionalPaymentStatus === 'succeeded' || order.additionalPaymentStatus === 'processing'}
                        className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                      >
                        {order.additionalPaymentStatus === 'succeeded'
                          ? 'Dopłata opłacona'
                          : order.additionalPaymentStatus === 'processing'
                            ? 'Dopłata w trakcie płatności'
                            : 'Zaakceptuj dopłatę i zapłać'}
                      </button>
                      {order.additionalPaymentStatus === 'succeeded' && (
                        <button
                          onClick={onConfirmReceipt}
                          disabled={isLoadingConfirmReceipt}
                          className="w-full px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
                        >
                          {isLoadingConfirmReceipt && <Loader2 className="w-4 h-4 animate-spin" />}
                          {isLoadingConfirmReceipt ? 'Potwierdzanie...' : 'Potwierdź odbiór i wypłać środki'}
                        </button>
                      )}
                      {protectionTools && (
                        <button
                          type="button"
                          onClick={onReportDispute}
                          disabled={isLoadingReportDispute}
                          className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
                        >
                          {isLoadingReportDispute && <Loader2 className="w-4 h-4 animate-spin" />}
                          {isLoadingReportDispute ? "Zgłaszanie..." : "Wszcząć spór"}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={onConfirmReceipt}
                      disabled={isLoadingConfirmReceipt}
                      className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
                    >
                      {isLoadingConfirmReceipt && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isLoadingConfirmReceipt 
                        ? 'Potwierdzanie...' 
                        : (isExternalPayment ? 'Potwierdź odbiór zlecenia' : 'Potwierdź odbiór i wypłać środki')}
                    </button>
                  )}
                </div>
              </>
              );
            })()}
              </div>
            )}
          </>
        ) : (
          // WIDOK DLA PROVIDERA
          <>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">Realizujesz zlecenie</h3>
              <p className="text-sm text-purple-800">
                Pracujesz nad zleceniem. Po zakończeniu możesz oznaczyć zlecenie jako zakończone.
              </p>
            </div>

            {disputeOngoing && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">Centrum sprawy</h3>
                <p className="text-sm text-orange-800 mb-3">
                  Trwa sprawa (spór / mediacja). Możesz pisać z klientem, złożyć lub odpowiedzieć na propozycję ugody albo przekazać sprawę do Helpfli.
                </p>
                <Link
                  to={`/orders/${orderId}/sprawa`}
                  className="flex w-full items-center justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  Otwórz centrum sprawy
                </Link>
              </div>
            )}
            {disputeArchive && !disputeOngoing && (
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-900 mb-2">Sprawa zamknięta ugodą</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Wątek i ustalenia nadal są dostępne w archiwum centrum sprawy.
                </p>
                <Link
                  to={`/orders/${orderId}/sprawa`}
                  className="flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                >
                  Otwórz archiwum sprawy
                </Link>
              </div>
            )}

            {/* Notatki dla providera */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">Dodaj notatkę</h3>
              <p className="text-xs text-gray-600 mb-3">
                Możesz zapisać notatki dotyczące realizacji zlecenia.
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Wpisz notatkę..."
                className="w-full p-3 border rounded-lg text-sm"
                rows={3}
              />
              <button
                onClick={handleAddNote}
                disabled={submitting || !notes.trim()}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                {submitting ? 'Zapisywanie...' : 'Zapisz notatkę'}
              </button>
            </div>

            {/* Sesja wideo (jeśli istnieje) */}
            {videoSession && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-600 text-xl">🎥</span>
                  <h3 className="font-semibold text-blue-900">Spotkanie wideo</h3>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Status:</span>{' '}
                    {videoSession.status === 'scheduled' && 'Zaplanowane'}
                    {videoSession.status === 'active' && 'Aktywne'}
                    {videoSession.status === 'ended' && 'Zakończone'}
                    {videoSession.status === 'cancelled' && 'Anulowane'}
                  </div>
                  {videoSession.scheduledAt && (
                    <div className="text-sm text-blue-800">
                      <span className="font-medium">Termin:</span>{' '}
                      {formatSmartTime(videoSession.scheduledAt, { 
                        maxRelativeDays: 14,
                        fallbackFormat: 'long'
                      })}
                    </div>
                  )}
                </div>
                {(videoSession.status === 'scheduled' || videoSession.status === 'active') && (
                  <button
                    onClick={() => navigate(`/video/${videoSession._id}`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <span>🎥</span>
                    Rozpocznij spotkanie
                  </button>
                )}
              </div>
            )}

            {/* Przycisk zakończenia zlecenia */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <h3 className="font-semibold text-emerald-900 mb-2">Zakończ zlecenie</h3>
              <p className="text-sm text-emerald-800 mb-3">
                Jeśli zakończyłeś pracę, możesz oznaczyć zlecenie jako zakończone. Będziesz mógł wybrać opcje zakończenia.
              </p>
              <button
                onClick={onCompleteOrder}
                disabled={isLoadingCompleteOrder}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
              >
                {isLoadingCompleteOrder && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoadingCompleteOrder ? 'Zapisywanie...' : 'Zakończ zlecenie'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Jedna karta „następne kroki” dla klienta po zakończeniu przez wykonawcę — zastępuje rozproszone banery (NextStep + gwarancja). */
function ClientOrderCompletionHub({ order, onScrollToAction, hasClientRated = false }) {
  if (!order || order.status !== "completed") return null;
  const eligible = order.eligibleForGuarantee === true;
  const reasons = order.guaranteeReasons || [];
  const isExternal =
    order.paymentMethod === "external" || order.paymentPreference === "external";

  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50/80 p-5 shadow-sm ring-1 ring-slate-100/80">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Następne kroki</p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">Domknij zlecenie</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {isExternal
                ? "Rozliczenie było poza systemem Helpfli — w aplikacji potwierdzasz tylko, że odebrałeś usługę, i możesz ocenić wykonawcę."
                : "Wykonawca zakończył prace. Potwierdź odbiór, aby domknąć rozliczenie w systemie, potem zostaw krótką opinię."}
            </p>
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700 marker:font-semibold">
            <li className="pl-1">
              <span className="font-medium text-slate-900">Potwierdź odbiór</span>
              {isExternal
                ? " — jeśli wykonanie jest zgodne z ustaleniami."
                : " — wtedy zwalniamy rozliczenie zgodnie z płatnością w Helpfli."}
            </li>
            <li className="pl-1">
              <span className={`font-medium ${hasClientRated ? "text-emerald-800" : "text-slate-900"}`}>
                {hasClientRated ? "✓ Oceń wykonawcę" : "Oceń wykonawcę"}
              </span>
              {hasClientRated
                ? " — Dziękujemy za opinię."
                : " — pomaga innym wybrać dobrego specjalistę."}
            </li>
          </ol>
          <div
            className={`rounded-lg border px-3 py-2.5 text-xs leading-snug ${
              eligible
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {eligible ? (
              <span>
                <span className="font-semibold">Helpfli Protect</span> — przy sporze lub problemie możesz skorzystać z narzędzi ochrony zgodnie z regulaminem.
              </span>
            ) : (
              <span>
                <span className="font-semibold">Bez pełnej ochrony Helpfli</span>
                {reasons.length > 0 ? ` — ${reasons.slice(0, 3).join(" · ")}` : ""}. Sporu ani zwrotu przez platformę nie złożysz.
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 lg:pt-1">
          <button
            type="button"
            onClick={onScrollToAction}
            className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 lg:w-auto"
          >
            Przejdź do potwierdzenia
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderCompletedStageView({
  order,
  orderId,
  isClient,
  isProvider,
  onRate,
  onConfirmReceipt,
  isLoadingConfirmReceipt = false,
  onRefresh,
  showAiHint = true,
  /** Gdy true: jedna karta „hub” nad widokiem — tu bez duplikatu zielonego podsumowania */
  useCompletionHubLayout = false,
  /** Użytkownik ma już ocenę dla tej roli (wg order.ratings z API) */
  hasMyRating = false,
}) {
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState(null);

  const isExternalPayment =
    order?.paymentMethod === "external" || order?.paymentPreference === "external";
  const needsAddonPaymentFirst =
    isClient &&
    !isExternalPayment &&
    order?.completionType === "with_payment" &&
    order?.additionalPaymentStatus !== "succeeded";
  const showClientConfirmReceipt =
    isClient &&
    order?.status === "completed" &&
    typeof onConfirmReceipt === "function" &&
    !needsAddonPaymentFirst;

  const handleInvoiceUpload = async (e) => {
    e.preventDefault();
    if (!invoiceFile) {
      alert('Wybierz plik faktury');
      return;
    }

    setUploadingInvoice(true);
    try {
      const formData = new FormData();
      formData.append('invoice', invoiceFile);

      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/api/orders/${orderId}/invoice`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Błąd uploadu faktury');
      }

      alert('Faktura została wrzucona i wysłana do klienta');
      setInvoiceFile(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      alert(`Błąd: ${error.message}`);
    } finally {
      setUploadingInvoice(false);
    }
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      {isClient && showAiHint && <div className="mb-4"><AIStepHint stage="completed" /></div>}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckSquare className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Zakończone</h2>
          <p className="text-xs text-slate-500">
            {isClient && order.status === "completed"
              ? "Potwierdź odbiór, aby domknąć zlecenie"
              : isProvider && order.status === "completed"
                ? "Oczekiwanie na klienta"
                : "Wszystko gotowe"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {!(useCompletionHubLayout && isClient && order.status === "completed") && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-600 text-xl">✓</span>
              <span className="font-semibold text-emerald-900">Zlecenie zakończone pomyślnie</span>
            </div>
            <p className="text-sm text-emerald-800">
              {isClient
                ? order.status === "completed"
                  ? "Wykonawca oznaczył realizację jako zakończoną. Jeśli wszystko jest zgodnie z ustaleniami, potwierdź odbiór poniżej — potem możesz ocenić wykonawcę."
                  : "Zlecenie jest domknięte po Twojej stronie. Możesz ocenić wykonawcę."
                : order.status === "completed"
                  ? "Oczekujemy na potwierdzenie odbioru przez klienta — wtedy domkniemy rozliczenie."
                  : "Zlecenie zostało zakończone i zaakceptowane przez klienta. Środki zostaną wypłacone po potwierdzeniu odbioru."}
            </p>
          </div>
        )}

        {/* Informacje o zakończeniu */}
        {order.completionType && order.completionType !== 'simple' && (
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-2">Szczegóły zakończenia</h3>
            {order.completionType === 'with_notes' && order.completionNotes && (
              <div className="mb-2">
                <p className="text-xs font-medium text-slate-700 mb-1">Uwagi:</p>
                <p className="text-sm text-slate-800">{order.completionNotes}</p>
              </div>
            )}
            {order.completionType === 'with_payment' && (
              <div className="mb-2">
                <p className="text-xs font-medium text-amber-700 mb-1">⚠️ Dopłata:</p>
                <p className="text-sm text-amber-800">Zgłoszono potrzebę dopłaty. Sprawdź szczegóły w czacie.</p>
              </div>
            )}
          </div>
        )}

        {/* Status wypłaty */}
        {order.status === 'released' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600 text-xl">💰</span>
              <span className="font-semibold text-green-900">Środki wypłacone</span>
            </div>
            <p className="text-sm text-green-800">
              {isClient 
                ? 'Potwierdziłeś odbiór - środki zostały wypłacone wykonawcy.'
                : 'Klient potwierdził odbiór - środki zostały wypłacone do Twojego konta.'}
            </p>
          </div>
        )}

        {/* Status oczekiwania na wypłatę */}
        {order.status === 'completed' && order.status !== 'released' && (
          <div
            id="client-confirm-receipt"
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600 text-xl">⏳</span>
              <span className="font-semibold text-blue-900">
                {isClient ? 'Twoja kolej: potwierdź odbiór' : 'Oczekuje na potwierdzenie odbioru przez klienta'}
              </span>
            </div>
            <p className="text-sm text-blue-800">
              {isClient
                ? isExternalPayment
                  ? 'Rozliczenie było poza systemem Helpfli — potwierdzasz wyłącznie, że odebrałeś usługę. Żadnych środków nie przechodzi przez platformę.'
                  : 'Po potwierdzeniu odbioru domykamy rozliczenie w systemie i możemy przekazać wynagrodzenie wykonawcy (zgodnie z płatnością w Helpfli).'
                : 'Klient musi potwierdzić odbiór zlecenia, aby domknąć rozliczenie.'}
            </p>
            {showClientConfirmReceipt && (
              <button
                type="button"
                onClick={onConfirmReceipt}
                disabled={isLoadingConfirmReceipt}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoadingConfirmReceipt && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoadingConfirmReceipt
                  ? 'Przetwarzanie…'
                  : isExternalPayment
                    ? 'Potwierdź odbiór realizacji'
                    : 'Potwierdź odbiór i domknij rozliczenie'}
              </button>
            )}
            {isClient && needsAddonPaymentFirst && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Wymagana jest dopłata ustalona przy zakończeniu — najpierw ją opłać (np. w powiadomieniu e-mail lub po powrocie do etapu z dopłatą), potem wróć tutaj i potwierdź odbiór.
              </p>
            )}
          </div>
        )}

        {/* Ocena */}
        {hasMyRating ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-600 text-xl">✓</span>
              <span className="font-semibold text-emerald-900">
                {isClient ? "Dziękujemy za opinię o wykonawcy" : "Dziękujemy za opinię o kliencie"}
              </span>
            </div>
            <p className="text-sm text-emerald-800">
              Twoja ocena została zapisana i pomoże innym użytkownikom przy wyborze specjalisty.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2">Oceń {isClient ? 'wykonawcę' : 'klienta'}</h3>
            <p className="text-sm text-amber-800 mb-3">
              Pomóż innym użytkownikom - zostaw opinię o {isClient ? 'wykonawcy' : 'kliencie'}.
            </p>
            <button
              onClick={onRate}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
            >
              Dodaj ocenę
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { push: toast } = useToast();
  const { trackOrderAccepted } = useTelemetry();
  const [copiedId, setCopiedId] = useState(false);
  const tabFromUrl = new URLSearchParams(location.search).get("tab");
  const [tab, setTab] = useState(tabFromUrl === "offers" ? "offers" : (tabFromUrl === "chat" ? "chat" : (tabFromUrl === "my_offer" ? "my_offer" : "details")));

  useEffect(() => {
    const t = new URLSearchParams(location.search).get("tab");
    if (t === "offers" || t === "chat" || t === "my_offer" || t === "details") {
      setTab(t);
    }
  }, [location.search]);

  const [me, setMe] = useState(null);
  const [order, setOrderState] = useState(null);
  const setOrder = useCallback((next) => {
    setOrderState((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      return normalizeOrderPayload(resolved);
    });
  }, []);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [offerPrice, setOfferPrice] = useState("");
  const [offerMsg, setOfferMsg] = useState("");
  const [offerError, setOfferError] = useState("");
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [openRate, setOpenRate] = useState(false);
  const [aiTags, setAiTags] = useState([]);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [myOffer, setMyOffer] = useState(null);
  const [cancelingOffer, setCancelingOffer] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const [changeRequests, setChangeRequests] = useState([]);
  const [pendingChangeRequest, setPendingChangeRequest] = useState(null);
  const [offerBandsError, setOfferBandsError] = useState("");
  const [showCompleteOrderModal, setShowCompleteOrderModal] = useState(false);
  const [showCancelOfferConfirm, setShowCancelOfferConfirm] = useState(false);
  const [showCancelOrderConfirm, setShowCancelOrderConfirm] = useState(false);
  const [showDisputeConfirm, setShowDisputeConfirm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [startingWork, setStartingWork] = useState(false);
  const [fundingEscrow, setFundingEscrow] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const [completingOrder, setCompletingOrder] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState(false);
  const [reportingDispute, setReportingDispute] = useState(false);
  const [requestingRefund, setRequestingRefund] = useState(false);
  const [cancelingOrder, setCancelingOrder] = useState(false);
  const [extendingOrderId, setExtendingOrderId] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({ description: '', location: '', budget: '', urgency: 'flexible', serviceDetails: '' });
  const [showEditOfferModal, setShowEditOfferModal] = useState(false);
  const [savingEditOffer, setSavingEditOffer] = useState(false);
  const [editOfferForm, setEditOfferForm] = useState({ amount: '', message: '', completionDate: '', paymentMethod: '' });
  const [videoSession, setVideoSession] = useState(null);
  const [aiFollowup, setAiFollowup] = useState(null);
  const [aiInsightsOpen, setAiInsightsOpen] = useState(false);

  // Chat state (multi-conversation per order)
  const [orderOffers, setOrderOffers] = useState([]);
  const [orderConversations, setOrderConversations] = useState([]);
  const [chatSelectedProviderId, setChatSelectedProviderId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null); // Conversation object

  const currentUserNormalized = useMemo(() => {
    if (!user) return user;
    if (user._id) return user;
    if (user.id) return { ...user, _id: user.id };
    return user;
  }, [user]);

  // Dane DEMO — tylko import.meta.env.DEV (build produkcyjny korzysta wyłącznie z API)
  const DEMO_ORDER_DATA = {
    "demo-order-1": {
      _id: "demo-order-1",
      status: "open",
      createdAt: new Date().toISOString(),
      service: "Hydraulik",
      serviceDetails: "Naprawa kranu",
      description: "Kran w kuchni przecieka. Potrzebuję szybkiej naprawy.",
      location: { city: "Warszawa", address: "ul. Marszałkowska 10" },
      budget: 200,
      client: { name: "Klient", email: "jan@example.com", _id: "demo-client" },
      // W DEMO ustawiamy providera tylko po to, żeby działał widok czatu
      provider: { name: "Wykonawca", email: "wykonawca@example.com", _id: "demo-provider-1" },
      offers: [],
      __demo: true,
    },
    "demo-order-2": {
      _id: "demo-order-2",
      status: "collecting_offers",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      service: "Elektryk",
      serviceDetails: "Wymiana gniazdka",
      description: "Iskrzy gniazdko w salonie. Proszę o diagnozę i wymianę.",
      location: { city: "Kraków", address: "ul. Floriańska 15" },
      budget: 150,
      client: { name: "Klient", email: "jan@example.com", _id: "demo-client" },
      provider: null,
      offers: [
        {
          _id: "demo-offer-1",
          amount: 180,
          price: 180,
          message: "Wymienię gniazdko na nowe, bezpieczne. Dojazd wliczony w cenę.",
          status: "submitted",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          providerId: "demo-provider-1",
          providerMeta: {
            name: "Wykonawca A",
            ratingAvg: 4.8,
            ratingCount: 24,
            level: "pro",
            badges: ["verified", "top_ai"]
          },
          pricing: {
            badge: "optimal"
          },
          __demo: true
        },
        {
          _id: "demo-offer-2",
          amount: 150,
          price: 150,
          message: "Szybka wymiana gniazdka. Materiały w cenie.",
          status: "submitted",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
          providerId: "demo-provider-2",
          providerMeta: {
            name: "Piotr Nowak",
            ratingAvg: 4.5,
            ratingCount: 12,
            level: "standard",
            badges: ["verified"]
          },
          pricing: {
            badge: "fair"
          },
          __demo: true
        },
        {
          _id: "demo-offer-3",
          amount: 220,
          price: 220,
          message: "Profesjonalna wymiana z gwarancją. Dojazd + materiały premium.",
          status: "submitted",
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          providerId: "demo-provider-3",
          providerMeta: {
            name: "Marek Wiśniewski",
            ratingAvg: 4.9,
            ratingCount: 45,
            level: "pro",
            badges: ["verified", "top_ai"]
          },
          pricing: {
            badge: "high"
          },
          hasGuarantee: true,
          __demo: true
        }
      ],
      __demo: true,
    }
    ,
    "demo-order-3": {
      _id: "demo-order-3",
      status: "accepted",
      paymentStatus: "unpaid",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      service: "Złota rączka",
      serviceDetails: "Montaż karnisza",
      description: "Montaż karnisza w sypialni + drobne poprawki mocowań.",
      location: { city: "Gdańsk", address: "ul. Długa 5" },
      budget: 180,
      client: { name: "Klient", email: "jan@example.com", _id: "demo-client" },
      provider: { name: "Wykonawca", email: "wykonawca@example.com", _id: "demo-provider-1" },
      offers: [],
      __demo: true,
    },
    "demo-order-4": {
      _id: "demo-order-4",
      status: "funded",
      paymentStatus: "succeeded",
      paidInSystem: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      service: "Malarz",
      serviceDetails: "Malowanie pokoju",
      description: "Malowanie pokoju dziennego (ok. 25m²). Kolor biały, matowy. Wymagane przygotowanie powierzchni.",
      location: { city: "Wrocław", address: "ul. Kwiatowa 15" },
      budget: 800,
      client: { name: "Klient", email: "jan@example.com", _id: "demo-client" },
      provider: { 
        name: "Marek Malarz",
        email: "marek@example.com",
        _id: "demo-provider-funded",
        ratingAvg: 4.7,
        ratingCount: 18
      },
      acceptedOfferId: "demo-offer-funded",
      offers: [
        {
          _id: "demo-offer-funded",
          amount: 750,
          price: 750,
          message: "Malowanie z pełnym przygotowaniem powierzchni. Materiały premium w cenie.",
          status: "accepted",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
          providerId: "demo-provider-funded",
          providerMeta: {
            name: "Marek Malarz",
            ratingAvg: 4.7,
            ratingCount: 18,
            level: "pro",
            badges: ["verified"]
          },
          __demo: true
        }
      ],
      __demo: true,
    },
    "demo-order-5": {
      _id: "demo-order-5",
      status: "in_progress",
      paymentStatus: "succeeded",
      paidInSystem: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      service: "Elektryk",
      serviceDetails: "Instalacja oświetlenia",
      description: "Instalacja nowego oświetlenia sufitowego w salonie. Wymiana starego żyrandola na nowoczesne LED.",
      location: { city: "Poznań", address: "ul. Słoneczna 8" },
      budget: 450,
      client: { name: "Klient", email: "jan@example.com", _id: "demo-client" },
      provider: { 
        name: "Piotr Elektryk",
        email: "piotr@example.com",
        _id: "demo-provider-in-progress",
        ratingAvg: 4.9,
        ratingCount: 32
      },
      acceptedOfferId: "demo-offer-in-progress",
      offers: [
        {
          _id: "demo-offer-in-progress",
          amount: 420,
          price: 420,
          message: "Profesjonalna instalacja z certyfikatem. Dojazd i materiały wliczone.",
          status: "accepted",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
          providerId: "demo-provider-in-progress",
          providerMeta: {
            name: "Piotr Elektryk",
            ratingAvg: 4.9,
            ratingCount: 32,
            level: "pro",
            badges: ["verified", "top_ai"]
          },
          __demo: true
        }
      ],
      __demo: true,
    },
    "demo-order-6": {
      _id: "demo-order-6",
      status: "completed",
      paymentStatus: "succeeded",
      paidInSystem: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      service: "Hydraulik",
      serviceDetails: "Wymiana baterii",
      description: "Wymiana starej baterii umywalkowej na nową. Podłączenie wody i odpływu.",
      location: { city: "Łódź", address: "ul. Główna 22" },
      budget: 300,
      client: { name: "Klient", email: "jan@example.com", _id: "demo-client" },
      provider: { 
        name: "Tomasz Hydraulik",
        email: "tomasz@example.com",
        _id: "demo-provider-completed",
        ratingAvg: 4.8,
        ratingCount: 28
      },
      acceptedOfferId: "demo-offer-completed",
      offers: [
        {
          _id: "demo-offer-completed",
          amount: 280,
          price: 280,
          message: "Szybka wymiana z gwarancją. Bateria premium w cenie.",
          status: "accepted",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
          providerId: "demo-provider-completed",
          providerMeta: {
            name: "Tomasz Hydraulik",
            ratingAvg: 4.8,
            ratingCount: 28,
            level: "pro",
            badges: ["verified"]
          },
          __demo: true
        }
      ],
      __demo: true,
    },
    // Demo zlecenia dla providera
    "demo-provider-order-1": {
      _id: "demo-provider-order-1",
      status: "collecting_offers",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      service: "Elektryk",
      serviceDetails: "Wymiana gniazdka",
      description: "Iskrzy gniazdko w salonie. Proszę o diagnozę i wymianę.",
      location: { city: "Kraków", address: "ul. Floriańska 15" },
      budget: 150,
      client: { name: "Klient", email: "jan@example.com", _id: "demo-client" },
      provider: null,
      offers: [
        {
          _id: "demo-provider-offer-1",
          amount: 180,
          price: 180,
          message: "Wymienię gniazdko na nowe, bezpieczne. Dojazd wliczony w cenę.",
          status: "submitted",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
          providerId: "demo-provider-1",
          providerMeta: {
            name: "Wykonawca A",
            ratingAvg: 4.8,
            ratingCount: 24,
            level: "pro",
            badges: ["verified", "top_ai"]
          },
          __demo: true
        }
      ],
      __demo: true,
    },
    "demo-provider-order-2": {
      _id: "demo-provider-order-2",
      status: "accepted",
      paymentStatus: "unpaid",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      service: "Złota rączka",
      serviceDetails: "Montaż karnisza",
      description: "Montaż karnisza w sypialni + drobne poprawki mocowań.",
      location: { city: "Gdańsk", address: "ul. Długa 5" },
      budget: 180,
      client: { name: "Klient", email: "jan@example.com", _id: "demo-client" },
      provider: { name: "Wykonawca A", email: "provider@example.com", _id: "demo-provider-1" },
      acceptedOfferId: "demo-provider-offer-2",
      offers: [
        {
          _id: "demo-provider-offer-2",
          amount: 180,
          price: 180,
          message: "Profesjonalny montaż z gwarancją.",
          status: "accepted",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
          providerId: "demo-provider-1",
          providerMeta: {
            name: "Wykonawca A",
            ratingAvg: 4.8,
            ratingCount: 24,
            level: "pro",
            badges: ["verified"]
          },
          __demo: true
        }
      ],
      __demo: true,
    },
    "demo-provider-order-3": {
      _id: "demo-provider-order-3",
      status: "funded",
      paymentStatus: "succeeded",
      paidInSystem: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      service: "Malarz",
      serviceDetails: "Malowanie pokoju",
      description: "Malowanie pokoju dziennego (ok. 25m²). Kolor biały, matowy. Wymagane przygotowanie powierzchni.",
      location: { city: "Wrocław", address: "ul. Kwiatowa 15" },
      budget: 800,
      client: { name: "Klient", email: "jan@example.com", _id: "demo-client" },
      provider: { name: "Wykonawca A", email: "provider@example.com", _id: "demo-provider-1" },
      acceptedOfferId: "demo-provider-offer-3",
      offers: [
        {
          _id: "demo-provider-offer-3",
          amount: 750,
          price: 750,
          message: "Malowanie z pełnym przygotowaniem powierzchni. Materiały premium w cenie.",
          status: "accepted",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
          providerId: "demo-provider-1",
          providerMeta: {
            name: "Wykonawca A",
            ratingAvg: 4.8,
            ratingCount: 24,
            level: "pro",
            badges: ["verified"]
          },
          __demo: true
        }
      ],
      __demo: true,
    },
    "demo-provider-order-4": {
      _id: "demo-provider-order-4",
      status: "in_progress",
      paymentStatus: "succeeded",
      paidInSystem: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      service: "Elektryk",
      serviceDetails: "Instalacja oświetlenia",
      description: "Instalacja nowego oświetlenia sufitowego w salonie. Wymiana starego żyrandola na nowoczesne LED.",
      location: { city: "Poznań", address: "ul. Słoneczna 8" },
      budget: 450,
      client: { name: "Klient", email: "jan@example.com", _id: "demo-client" },
      provider: { name: "Wykonawca A", email: "provider@example.com", _id: "demo-provider-1" },
      acceptedOfferId: "demo-provider-offer-4",
      offers: [
        {
          _id: "demo-provider-offer-4",
          amount: 420,
          price: 420,
          message: "Profesjonalna instalacja z certyfikatem. Dojazd i materiały wliczone.",
          status: "accepted",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
          providerId: "demo-provider-1",
          providerMeta: {
            name: "Wykonawca A",
            ratingAvg: 4.8,
            ratingCount: 24,
            level: "pro",
            badges: ["verified", "top_ai"]
          },
          __demo: true
        }
      ],
      __demo: true,
    },
    "demo-provider-order-5": {
      _id: "demo-provider-order-5",
      status: "completed",
      paymentStatus: "succeeded",
      paidInSystem: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      service: "Hydraulik",
      serviceDetails: "Wymiana baterii",
      description: "Wymiana starej baterii umywalkowej na nową. Podłączenie wody i odpływu.",
      location: { city: "Łódź", address: "ul. Główna 22" },
      budget: 300,
      client: { name: "Klient", email: "jan@example.com", _id: "demo-client" },
      provider: { name: "Wykonawca A", email: "provider@example.com", _id: "demo-provider-1" },
      acceptedOfferId: "demo-provider-offer-5",
      offers: [
        {
          _id: "demo-provider-offer-5",
          amount: 280,
          price: 280,
          message: "Szybka wymiana z gwarancją. Bateria premium w cenie.",
          status: "accepted",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
          providerId: "demo-provider-1",
          providerMeta: {
            name: "Wykonawca A",
            ratingAvg: 4.8,
            ratingCount: 24,
            level: "pro",
            badges: ["verified"]
          },
          __demo: true
        }
      ],
      __demo: true,
    },
  };

  useEffect(() => {
    (async () => {
      try {
        const isDemo = orderId?.startsWith("demo-");
        if (isDemo && !import.meta.env.DEV) {
          setErr("Nie znaleziono zlecenia.");
          setLoading(false);
          setLoadingAI(false);
          return;
        }
        if (isDemo) {
          const demoOrder = DEMO_ORDER_DATA[orderId];
          if (demoOrder) {
            // Użyj przykładowych danych DEMO (bez requestów do backendu)
            // Pobierz rzeczywistą rolę użytkownika z localStorage lub kontekstu
            let meData = null;
            try {
              const token = localStorage.getItem("token");
              const API = import.meta.env.VITE_API_URL || '';
              const meRes = await fetch(apiUrl(`/api/auth/me`), {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (meRes.ok) {
                const j = await meRes.json();
                meData = j?.user || j;
              } else {
                // Fallback - użyj domyślnej roli z localStorage
                const userStr = localStorage.getItem("user");
                if (userStr) {
                  try {
                    meData = JSON.parse(userStr);
                  } catch {
                    meData = { id: "demo-user", name: "Użytkownik", role: "client" };
                  }
                } else {
                  meData = { id: "demo-user", name: "Użytkownik", role: "client" };
                }
              }
            } catch {
              // Fallback - użyj domyślnej roli
              const userStr = localStorage.getItem("user");
              if (userStr) {
                try {
                  meData = JSON.parse(userStr);
                } catch {
                  meData = { id: "demo-user", name: "Użytkownik", role: "client" };
                }
              } else {
                meData = { id: "demo-user", name: "Użytkownik", role: "client" };
              }
            }

            // DEMO: ustaw me/order deterministycznie + wybierz "moją ofertę" bez fallbacków.
            // W DEMO provider ma stałe providerId = "demo-provider-1", żeby chat i przykładowe dane były spójne.
            setMe(meData);
            setOrder(demoOrder);
            if (meData?.role === "provider") {
              const offers = Array.isArray(demoOrder.offers) ? demoOrder.offers : [];
              const mine = offers.find((o) => String(o.providerId || "") === "demo-provider-1") || null;
              setMyOffer(mine);
            } else {
              setMyOffer(null);
            }
            
            setErr("");
            setLoading(false);
            setLoadingAI(false);
            return;
          }
          setErr("To przykładowe zlecenie DEMO nie jest dostępne.");
          setLoading(false);
          setLoadingAI(false);
          return;
        }

        const [meRes, orderRes] = await Promise.all([
          apiGet("/api/auth/me"),
          apiGet(`/api/orders/${orderId}`),
        ]);

        setMe(meRes?.user || meRes);
        setOrder(orderRes);
        try {
          const followupData = await apiGet(`/api/orders/${orderId}/ai-followup`);
          setAiFollowup(followupData.providerMatch ? { ...(followupData.followup || {}), providerMatch: followupData.providerMatch } : (followupData.followup || null));
        } catch {
          setAiFollowup(null);
        }

        // Jeśli to klient, spróbuj pobrać faktury powiązane z tym zleceniem
        if (meRes?.role === "client" || meRes?.user?.role === "client") {
          try {
            const invRes = await fetch(apiUrl(`/api/billing/invoices`), {
              headers: authHeaders(),
            });
            if (invRes.ok) {
              const data = await invRes.json();
              const related = (data.invoices || []).filter(
                (inv) => inv.order && inv.order === orderId
              );
              setInvoices(related);
            } else {
              setInvoices([]);
            }
          } catch {
            setInvoices([]);
          }
        }

        const mePayload = meRes?.user || meRes;
        const isProvRole = mePayload?.role === "provider";
        const teamFlag = orderRes?.viewerIsCompanyTeamForOrderProvider === true;
        const lead = isCompanyLeadUser(mePayload);

        if (isProvRole || (teamFlag && lead)) {
          if (orderRes?.__demo && orderRes?.offers && Array.isArray(orderRes.offers)) {
            if (teamFlag && lead) {
              setMyOffer(pickCompanyTeamOfferAsMyOffer(orderRes));
            } else {
            const myId = meRes?.user?._id || meRes?.user?.id || meRes?._id || meRes?.id;
            // Dla demo zleceń - jeśli użytkownik ma rolę provider, znajdź pierwszą ofertę z providerId
            // lub sprawdź czy jego ID pasuje do któregoś providerId
            const myOfferData = orderRes.offers.find(o => {
              const offerProviderId = o.providerId || o.provider?._id || o.provider;
              if (!offerProviderId) return false;
              // Sprawdź dokładne dopasowanie
              if (String(offerProviderId) === String(myId)) return true;
              // Dla demo - jeśli użytkownik ma rolę provider i jest to demo zlecenie,
              // a nie ma jeszcze przypisanego providera, użyj pierwszej oferty
              if (!orderRes.provider && orderRes.offers.length > 0) {
                return o === orderRes.offers[0]; // Użyj pierwszej oferty jako "mojej"
              }
              return false;
            });
            if (myOfferData) {
              setMyOffer(myOfferData);
            } else if (orderRes.offers.length > 0 && !orderRes.provider) {
              // Jeśli nie znaleziono dopasowania, ale jest oferta i nie ma providera,
              // użyj pierwszej oferty (dla demo)
              setMyOffer(orderRes.offers[0]);
            } else {
              setMyOffer(null);
            }
            }
          } else {
            const token = localStorage.getItem("token");
            const mo = await resolveMyOfferForOrder({ token, orderId, orderRes, mePayload });
            setMyOffer(mo);
          }
        }

        if (orderRes?.aiTags && orderRes.aiTags.length > 0) {
          setAiTags(orderRes.aiTags);
        } else {
          try {
            setLoadingAI(true);
            const tagsData = await getOrderTags(orderId);
            if (tagsData.tags) setAiTags(tagsData.tags);
          } catch (e) {
            console.error("Failed to fetch AI tags:", e);
          }
        }

        if (orderRes?.aiSuccessPrediction) {
          setAiPrediction(orderRes.aiSuccessPrediction);
        } else {
          try {
            const predData = await getOrderPrediction(orderId);
            const p =
              predData?.prediction && typeof predData.prediction === "object"
                ? predData.prediction
                : predData;
            if (p && typeof p === "object") setAiPrediction(p);
          } catch (e) {
            console.error("Failed to fetch AI prediction:", e);
          }
        }

        // Pobierz change requests dla zlecenia (błędy sieciowe = pusty stan)
        try {
          const token = localStorage.getItem("token");
          const crs = await getChangeRequests({ token, orderId });
          setChangeRequests(crs);
          const pending = crs.find((cr) => cr.status === "pending");
          if (pending) {
            setPendingChangeRequest(pending);
          }
        } catch {
          setChangeRequests([]);
          setPendingChangeRequest(null);
        }

        // Pobierz sesję wideo dla zlecenia (jeśli istnieje)
        try {
          const videoData = await getVideoSessionByOrder(orderId);
          if (videoData.session) {
            setVideoSession(videoData.session);
          }
        } catch (e) {
          // Sesja wideo nie istnieje lub błąd - to OK, nie pokazuj błędu
          setVideoSession(null);
        }
      } catch (e) {
        setErr(e.message || "Nie udało się wczytać zlecenia.");
      } finally {
        setLoading(false);
        setLoadingAI(false);
      }
    })();
  }, [orderId]);

  // Socket.IO: odświeżaj zlecenie na akcje klient/provid­er (żeby flow było spójne "na żywo")
  useEffect(() => {
    if (!orderId) return;
    if (order?.__demo) return;

    const token = localStorage.getItem("token");
    const socket = getSocket();
    if (!socket) return;

    socket.emit("joinOrderRoom", orderId);

    let cancelled = false;
    const refresh = async () => {
      try {
        const fresh = await apiGet(`/api/orders/${orderId}`);
        if (cancelled) return;
        setOrder(fresh);
        try {
          const followupData = await apiGet(`/api/orders/${orderId}/ai-followup`);
          if (!cancelled) setAiFollowup(followupData.providerMatch ? { ...(followupData.followup || {}), providerMatch: followupData.providerMatch } : (followupData.followup || null));
        } catch {
          if (!cancelled) setAiFollowup(null);
        }

        // odśwież myOffer u providera / zespołu firmy, żeby progress był poprawny
        const mePayload = me || user;
        const role = (mePayload?.role || "").toLowerCase();
        const team = fresh?.viewerIsCompanyTeamForOrderProvider === true;
        const lead = isCompanyLeadUser(mePayload);
        if (role === "provider" || (team && lead)) {
          try {
            const myOfferData = await resolveMyOfferForOrder({
              token,
              orderId,
              orderRes: fresh,
              mePayload,
            });
            if (!cancelled) setMyOffer(myOfferData || null);
          } catch {
            if (!cancelled) setMyOffer(null);
          }
        }
      } catch {
        // silent
      }
    };

    const onNewOffer = (p) => {
      if (p?.orderId && String(p.orderId) !== String(orderId)) return;
      refresh();
    };
    const onAccepted = (p) => {
      if (p?.orderId && String(p.orderId) !== String(orderId)) return;
      refresh();
    };
    const onStatusChanged = (p) => {
      if (p?.orderId && String(p.orderId) !== String(orderId)) return;
      refresh();
    };

    socket.on("offer:new", onNewOffer);
    socket.on("offer:accepted", onAccepted);
    socket.on("order:status_changed", onStatusChanged);

    return () => {
      cancelled = true;
      socket.emit("leaveOrderRoom", orderId);
      socket.off("offer:new", onNewOffer);
      socket.off("offer:accepted", onAccepted);
      socket.off("order:status_changed", onStatusChanged);
    };
  }, [orderId, order?._id, order?.__demo, me?.role, me?.roleInCompany, user?.role, user?.roleInCompany, order?.viewerIsCompanyTeamForOrderProvider]);

  // Pobierz oferty + konwersacje i ustaw aktywną konwersację dla czatu
  useEffect(() => {
    (async () => {
      if (!order || !me) return;

      // DEMO: nie pobieraj nic z backendu
      if (order.__demo) {
        const offers = Array.isArray(order.offers) ? order.offers : [];
        setOrderOffers(offers);
        const uniqueProviders = Array.from(new Set(offers.map((o) => String(o.providerId)).filter(Boolean)));
        const fallbackProvider = uniqueProviders[0] || "demo-provider-1";
        if (!chatSelectedProviderId) setChatSelectedProviderId(fallbackProvider);
        setActiveConversation({
          _id: `${order._id}:${chatSelectedProviderId || fallbackProvider}`,
          participants: [
            { _id: "demo-client", name: "Klient" },
            { _id: chatSelectedProviderId || fallbackProvider, name: offers.find(o => String(o.providerId) === String(chatSelectedProviderId || fallbackProvider))?.providerMeta?.name || "Wykonawca" }
          ],
          __demo: true
        });
        return;
      }

      try {
        const token = localStorage.getItem("token");

        // 1) Oferty (dla klienta podczas zbierania ofert - potrzebne do listy wykonawców)
        if ((me?.role === "client") && ["open", "collecting_offers"].includes(order.status)) {
          const offers = await getOffersOfOrder({ token, orderId });
          setOrderOffers(Array.isArray(offers) ? offers : []);
        } else {
          setOrderOffers([]);
        }

        // 2) Konwersacje usera (filtrujemy po orderId)
        const convRes = await fetch(apiUrl(`/api/chat/conversations`), { headers: authHeaders() });
        const convos = convRes.ok ? await convRes.json() : [];
        const byOrder = Array.isArray(convos) ? convos.filter((c) => String(c.order) === String(orderId)) : [];
        setOrderConversations(byOrder);

        // Helper: find conversation between two users for this order
        const findConvo = (a, b) =>
          byOrder.find((c) => {
            const ps = (c.participants || []).map((p) => String(p?._id || p));
            return ps.includes(String(a)) && ps.includes(String(b));
          });

        const meId = me?.id || me?._id;
        const clientId = typeof order.client === "string" ? order.client : order.client?._id;
        const providerAssignedId = typeof order.provider === "string" ? order.provider : order.provider?._id;

        // A) Jeśli provider już przypisany (zaakceptowane/w realizacji) → jeden czat z przypisanym wykonawcą
        if (providerAssignedId && clientId) {
          const otherId = String(meId) === String(clientId) ? providerAssignedId : clientId;
          let convo = findConvo(meId, otherId);
          if (!convo) {
            const createRes = await fetch(apiUrl(`/api/chat/conversations`), {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify({ participantIds: [otherId], orderId }),
            });
            convo = createRes.ok ? await createRes.json() : null;
          }
          if (convo) setActiveConversation(convo);
          return;
        }

        // B) Klient zbiera oferty → wybór wykonawcy (konwersacja per wykonawca)
        if ((me?.role === "client") && ["open", "collecting_offers"].includes(order.status)) {
          const offers = Array.isArray(orderOffers) && orderOffers.length ? orderOffers : [];
          const uniqueProviders = Array.from(new Set(offers.map((o) => String(o.providerId)).filter(Boolean)));
          const selectedProviderId = chatSelectedProviderId || uniqueProviders[0] || null;
          if (!chatSelectedProviderId && selectedProviderId) setChatSelectedProviderId(selectedProviderId);
          if (!selectedProviderId) {
            setActiveConversation(null);
            return;
          }

          let convo = findConvo(meId, selectedProviderId);
          if (!convo) {
            const createRes = await fetch(apiUrl(`/api/chat/conversations`), {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify({ participantIds: [selectedProviderId], orderId }),
            });
            convo = createRes.ok ? await createRes.json() : null;
          }
          if (convo) setActiveConversation(convo);
          return;
        }

        // C) Fallback: jeśli nic nie pasuje, spróbuj stworzyć rozmowę z drugą stroną, jeśli znamy ją
        if (clientId && meId && String(meId) !== String(clientId)) {
          let convo = findConvo(meId, clientId);
          if (!convo) {
            const createRes = await fetch(apiUrl(`/api/chat/conversations`), {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify({ participantIds: [clientId], orderId }),
            });
            convo = createRes.ok ? await createRes.json() : null;
          }
          if (convo) setActiveConversation(convo);
        }
      } catch (e) {
        // nie blokuj całego widoku - tylko czat
        console.warn("Chat bootstrap failed:", e);
        setActiveConversation(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, me, orderId, chatSelectedProviderId]);

  // DEMO: odśwież aktywną konwersację po zmianie wybranego wykonawcy
  useEffect(() => {
    if (!order?.__demo) return;
    const offers = Array.isArray(order.offers) ? order.offers : [];
    const providerId = chatSelectedProviderId || "demo-provider-1";
    setActiveConversation({
      _id: `${order._id}:${providerId}`,
      participants: [
        { _id: "demo-client", name: "Klient" },
        { _id: providerId, name: offers.find(o => String(o.providerId) === String(providerId))?.providerMeta?.name || "Wykonawca" }
      ],
      __demo: true
    });
  }, [order, chatSelectedProviderId]);

  const goTab = (t) => {
    setTab(t);
    const q = new URLSearchParams(location.search);
    q.set("tab", t);
    navigate({ search: q.toString() }, { replace: true });
  };

  const submitOffer = async (e) => {
    e.preventDefault();
    setOfferError("");
    setOfferSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await postOffer({
        token,
        payload: {
          orderId,
          price: Number(offerPrice),
          notes: offerMsg,
          etaMinutes: 60,
        },
      });
      setOfferPrice("");
      setOfferMsg("");
      const fresh = await apiGet(`/api/orders/${orderId}`);
      setOrder(fresh);
      const t = localStorage.getItem("token");
      if (t) {
        try {
          const mePayload = me || user;
          const mo = await resolveMyOfferForOrder({
            token: t,
            orderId,
            orderRes: fresh,
            mePayload,
          });
          setMyOffer(mo);
        } catch {
          /* ignore */
        }
      }
      toast({
        title: "Oferta została wysłana",
        description: "Klient zobaczy Twoją ofertę na zleceniu.",
        variant: "success",
      });
      goTab("my_offer");
    } catch (e2) {
      setOfferError(
        getErrorMessage(e2) ||
          "Nie udało się wysłać oferty. Spróbuj ponownie."
      );
    } finally {
      setOfferSubmitting(false);
    }
  };

  const acceptOffer = async (offerId, acceptData = {}) => {
    // Optymistyczna aktualizacja - od razu zmień status
    const previousOrder = { ...order };
    const optimisticOrder = {
      ...order,
      status: 'accepted',
      acceptedOfferId: offerId,
      provider: typeof order.offers?.find(o => (o._id || o.id) === offerId)?.providerId === 'string' 
        ? order.offers.find(o => (o._id || o.id) === offerId)?.providerId
        : order.offers?.find(o => (o._id || o.id) === offerId)?.providerId,
      paymentMethod: acceptData.paymentMethod || 'system',
    };
    setOrder(optimisticOrder);
    
    try {
      const token = localStorage.getItem("token");
      await acceptOfferApi({
        token,
        offerId,
        payload: acceptData,
      });
      
      const fresh = await apiGet(`/api/orders/${orderId}`);
      setOrder(fresh);
      const acceptedOfferObj = fresh.offers?.find(
        (o) => String(o._id || o.id) === String(offerId)
      );
      const providerId =
        acceptedOfferObj?.providerId?._id ||
        acceptedOfferObj?.providerId ||
        fresh?.provider?._id ||
        fresh?.provider;
      if (providerId) {
        trackOrderAccepted(
          orderId,
          typeof providerId === "string"
            ? providerId
            : providerId?._id || providerId
        );
      }

      const effectivePaymentMethod =
        fresh?.paymentMethod || acceptData.paymentMethod || "system";

      if (effectivePaymentMethod === "system") {
        toast({
          title: "Oferta zaakceptowana",
          description: "Przechodzimy do bezpiecznej płatności.",
          variant: "success",
        });
        navigate(`/checkout/${orderId}`);
      } else {
        const externalPlatformFee = Number(fresh?.pricing?.platformFee || 0);
        const externalCommissionPaid = fresh?.externalCommissionStatus === "succeeded";
        if (externalPlatformFee > 0 && !externalCommissionPaid) {
          toast({
            title: "Oferta zaakceptowana",
            description: "Opłać teraz prowizję platformy, aby odblokować realizację.",
            variant: "success",
          });
        } else {
          toast({
            title: "Oferta zaakceptowana",
            description: "Zlecenie oczekuje na rozpoczęcie realizacji przez wykonawcę.",
            variant: "success",
          });
        }
        goTab("details");
      }
    } catch (e) {
      // Cofnij optymistyczną aktualizację w przypadku błędu
      setOrder(previousOrder);
      toast({ 
        title: "Błąd akceptacji oferty", 
        description: getErrorMessage(e) || "Nie udało się zaakceptować oferty",
        variant: "error"
      });
    }
  };

  const fundEscrow = async () => {
    setFundingEscrow(true);
    try {
      await apiPost(`/api/orders/${orderId}/fund`, {});
      const fresh = await apiGet(`/api/orders/${orderId}`);
      setOrder(fresh);
      toast({ 
        title: "Środki zabezpieczone", 
        description: "Możesz rozpocząć realizację zlecenia",
        variant: "success"
      });
    } catch (e) {
      toast({ 
        title: "Błąd zabezpieczenia środków", 
        description: getErrorMessage(e),
        variant: "error"
      });
    } finally {
      setFundingEscrow(false);
    }
  };

  const confirmReceipt = async () => {
    setConfirmingReceipt(true);
    
    // Optymistyczna aktualizacja
    const previousOrder = { ...order };
    const optimisticOrder = {
      ...order,
      status: 'released',
      paymentStatus: 'succeeded',
    };
    setOrder(optimisticOrder);

    const extPay =
      order?.paymentMethod === "external" || order?.paymentPreference === "external";
    
    toast({ 
      title: "Odbiór potwierdzony", 
      description: extPay
        ? "Zlecenie jest domknięte po Twojej stronie."
        : "Rozliczenie w systemie zostało domknięte — wykonawca zostanie powiadomiony.",
      variant: "success"
    });
    
    try {
      await apiPost(`/api/orders/${orderId}/confirm-receipt`, {});
      const fresh = await apiGet(`/api/orders/${orderId}`);
      setOrder(fresh);
      
      // Jeśli zlecenie zostało zakończone i to klient - otwórz modal oceny
      if (isClient && fresh.status === 'released') {
        const myId = me?._id || me?.id;
        const hasRating = fresh.ratings?.some(
          (r) => String(r.from?._id ?? r.from) === String(myId)
        );
        if (!hasRating) {
          setTimeout(() => {
            setOpenRate(true);
          }, 1000); // Opóźnienie 1s dla lepszego UX
        }
      }
    } catch (e) {
      // Cofnij optymistyczną aktualizację
      setOrder(previousOrder);
      toast({ 
        title: "Błąd potwierdzenia odbioru", 
        description: getErrorMessage(e),
        variant: "error"
      });
    } finally {
      setConfirmingReceipt(false);
    }
  };

  const acceptOrder = async () => {
    setAcceptingOrder(true);
    try {
      await apiPost(`/api/orders/${orderId}/accept`, {});
      const fresh = await apiGet(`/api/orders/${orderId}`);
      setOrder(fresh);
      toast({ 
        title: "Zlecenie zaakceptowane", 
        variant: "success"
      });
    } catch (e) {
      toast({ 
        title: "Błąd akceptacji zlecenia", 
        description: getErrorMessage(e),
        variant: "error"
      });
    } finally {
      setAcceptingOrder(false);
    }
  };

  const startWork = async () => {
    setStartingWork(true);
    
    // Optymistyczna aktualizacja
    const previousOrder = { ...order };
    const optimisticOrder = {
      ...order,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    };
    setOrder(optimisticOrder);
    
    toast({ 
      title: "Praca rozpoczęta", 
      description: "Zlecenie przeszło do etapu 'W realizacji'",
      variant: "success"
    });
    
    try {
      await apiPost(`/api/orders/${orderId}/start`, {});
      const fresh = await apiGet(`/api/orders/${orderId}`);
      setOrder(fresh);
      const token = localStorage.getItem("token");
      if (token) {
        const mePayload = me || user;
        const mo = await resolveMyOfferForOrder({
          token,
          orderId,
          orderRes: fresh,
          mePayload,
        });
        if (mo) {
          setMyOffer(mo);
        } else if (fresh.offers && Array.isArray(fresh.offers)) {
          const myId = (me || user)?._id || (me || user)?.id;
          const myOfferData = fresh.offers.find((o) => {
            const offerProviderId = o.providerId || o.provider?._id || o.provider;
            return offerProviderId && String(offerProviderId) === String(myId);
          });
          if (myOfferData) setMyOffer(myOfferData);
        }
      }
    } catch (e) {
      // Cofnij optymistyczną aktualizację
      setOrder(previousOrder);
      toast({ 
        title: "Błąd rozpoczęcia pracy", 
        description: getErrorMessage(e),
        variant: "error"
      });
    } finally {
      setStartingWork(false);
    }
  };

  const completeOrder = async (completionData) => {
    setCompletingOrder(true);
    setShowCompleteOrderModal(false);
    
    // Optymistyczna aktualizacja
    const previousOrder = { ...order };
    const optimisticOrder = {
      ...order,
      status: 'completed',
      completedAt: new Date().toISOString(),
      completionType: completionData?.completionType || null,
      completionNotes: completionData?.completionNotes || null,
      additionalAmount: completionData?.additionalAmount || null,
      paymentReason: completionData?.paymentReason || null,
    };
    setOrder(optimisticOrder);
    
    toast({ 
      title: "Zlecenie zakończone", 
      description: "Klient został powiadomiony o zakończeniu",
      variant: "success"
    });
    
    try {
      await apiPost(`/api/orders/${orderId}/complete`, completionData || {});
      const fresh = await apiGet(`/api/orders/${orderId}`);
      setOrder(fresh);
      
      // Jeśli to klient i zlecenie zostało zakończone - otwórz modal oceny
      if (isClient && fresh.status === 'completed') {
        const myId = me?._id || me?.id;
        const hasRating = fresh.ratings?.some(
          (r) => String(r.from?._id ?? r.from) === String(myId)
        );
        if (!hasRating) {
          setTimeout(() => {
            setOpenRate(true);
          }, 1000); // Opóźnienie 1s dla lepszego UX
        }
      }
    } catch (e) {
      // Cofnij optymistyczną aktualizację
      setOrder(previousOrder);
      setShowCompleteOrderModal(true); // Przywróć modal
      toast({ 
        title: "Błąd zakończenia zlecenia", 
        description: getErrorMessage(e),
        variant: "error"
      });
    } finally {
      setCompletingOrder(false);
    }
  };

  const handleCancelOffer = async () => {
    if (!myOffer?._id) return;
    setShowCancelOfferConfirm(true);
  };

  const confirmCancelOffer = async () => {
    setShowCancelOfferConfirm(false);
    setCancelingOffer(true);
    try {
      const token = localStorage.getItem("token");
      await cancelOffer({ token, offerId: myOffer._id });
      setMyOffer(null);
      toast({ 
        title: "Oferta anulowana", 
        variant: "success"
      });
      const fresh = await apiGet(`/api/orders/${orderId}`);
      setOrder(fresh);
    } catch (e) {
      toast({ 
        title: "Błąd anulowania oferty", 
        description: getErrorMessage(e),
        variant: "error"
      });
    } finally {
      setCancelingOffer(false);
    }
  };

  const handleCancelOrder = async () => {
    setShowCancelOrderConfirm(true);
  };

  const confirmCancelOrder = async () => {
    setShowCancelOrderConfirm(false);
    setCancelingOrder(true);
    try {
      await apiPost(`/api/orders/${orderId}/cancel`, {});
      const fresh = await apiGet(`/api/orders/${orderId}`);
      setOrder(fresh);
      toast({ 
        title: "Zlecenie anulowane", 
        variant: "success"
      });
      navigate("/home");
    } catch (e) {
      toast({ 
        title: "Błąd anulowania zlecenia", 
        description: getErrorMessage(e),
        variant: "error"
      });
    } finally {
      setCancelingOrder(false);
    }
  };

  const handleExtend = async (hours = 24) => {
    setExtendingOrderId(true);
    try {
      await apiPost(`/api/orders/${orderId}/extend`, { hours, reason: "Wydłużone przez klienta" });
      const fresh = await apiGet(`/api/orders/${orderId}`);
      setOrder(fresh);
      toast({ title: `Czas zlecenia wydłużony o ${hours}h`, variant: "success" });
    } catch (e) {
      toast({ title: "Błąd wydłużania", description: getErrorMessage(e), variant: "error" });
    } finally {
      setExtendingOrderId(false);
    }
  };

  const reportDispute = async () => {
    if (!isHelpfliProtectionToolsEnabled(order)) {
      toast({
        title: "Ochrona Helpfli niedostępna",
        description: "Przy tym zleceniu sporu przez platformę nie złożysz.",
        variant: "warning",
      });
      return;
    }
    setDisputeReason("");
    setShowDisputeConfirm(true);
  };

  const confirmReportDispute = async (reason) => {
    setShowDisputeConfirm(false);
    setReportingDispute(true);
    try {
      await apiPost(`/api/orders/${orderId}/dispute`, { reason: reason || "" });
      const fresh = await apiGet(`/api/orders/${orderId}`);
      setOrder(fresh);
      toast({ 
        title: "Spór zgłoszony", 
        description: "Otwarto centrum sprawy — możesz pisać z drugą stroną i złożyć propozycję ugody.",
        variant: "success"
      });
      navigate(`/orders/${orderId}/sprawa`);
    } catch (e) {
      toast({ 
        title: "Błąd zgłaszania sporu", 
        description: getErrorMessage(e),
        variant: "error"
      });
    } finally {
      setReportingDispute(false);
    }
  };

  const requestRefund = async () => {
    if (!isHelpfliProtectionToolsEnabled(order)) {
      toast({
        title: "Zwrot przez Helpfli niedostępny",
        description: "Przy tym zleceniu wniosku o zwrot przez platformę nie złożysz.",
        variant: "warning",
      });
      return;
    }
    setShowRefundConfirm(true);
  };

  const confirmRequestRefund = async () => {
    setShowRefundConfirm(false);
    setRequestingRefund(true);
    try {
      await apiPost(`/api/orders/${orderId}/refund-request`, {});
      const fresh = await apiGet(`/api/orders/${orderId}`);
      setOrder(fresh);
      toast({ 
        title: "Wniosek o zwrot złożony", 
        description: "Rozpatrzymy go w ciągu 24h",
        variant: "success"
      });
    } catch (e) {
      toast({ 
        title: "Błąd składania wniosku o zwrot", 
        description: getErrorMessage(e),
        variant: "error"
      });
    } finally {
      setRequestingRefund(false);
    }
  };

  if (loading) {
    return <OrderDetailsSkeleton />;
  }
  if (err || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-200 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Błąd ładowania zlecenia
          </h2>
          <p className="text-slate-600 mb-6">
            {err || "Nie udało się wczytać danych zlecenia. Spróbuj odświeżyć stronę."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Odśwież stronę
            </button>
            <button
              onClick={() => navigate("/home")}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Wróć do strony głównej
            </button>
          </div>
        </div>
      </div>
    );
  }

  const clientName =
    (order.client && (order.client.name || order.client.email)) || "Klient";
  const providerName =
    (order.provider && (order.provider.name || order.provider.email)) ||
    "Wykonawca";

  // Używamy zarówno `me` jak i `user` z useAuth() jako fallback
  const currentUser = me || user;
  
  // Ustal role widoku:
  // - `role` jest źródłem prawdy (klient/provid­er).
  // - porównanie ID zostawiamy jako fallback (np. starsze tokeny / demo dane).
  const currentUserId = currentUser?._id || currentUser?.id || null;
  const orderClientId =
    typeof order.client === "string"
      ? order.client
      : (order.client?._id || order.client?.id || null);

  // Jeśli użytkownik ma rolę 'provider' LUB jest ownerem/menedżerem firmy przy zleceniu pracownika — widok wykonawcy
  const isCompanyLead =
    currentUser?.role === "company_owner" ||
    currentUser?.role === "company_manager" ||
    currentUser?.roleInCompany === "owner" ||
    currentUser?.roleInCompany === "manager";
  const viewerIsCompanyTeamForOrderProvider = Boolean(order?.viewerIsCompanyTeamForOrderProvider);
  const isProvider =
    currentUser?.role === "provider" ||
    (viewerIsCompanyTeamForOrderProvider && isCompanyLead);

  // Klient: rola 'client' lub (fallback) userId == order.clientId
  const isClient =
    currentUser?.role === "client" ||
    (!isProvider &&
      currentUserId &&
      orderClientId &&
      String(currentUserId) === String(orderClientId));
  const providerMatch = aiFollowup?.providerMatch || providerOrderMatch(order, currentUser || me);
  const hasAiPilot = Boolean(aiFollowup?.tip || aiFollowup?.title || aiFollowup?.seedQuery);
  const showStageAiHint = !hasAiPilot;
  const isClientCollectingOffers = isClient && tab === "details" && order.status === "collecting_offers";
  const userIsProvider =
    currentUser?.role === "provider" ||
    (Boolean(order?.viewerIsCompanyTeamForOrderProvider) && isCompanyLead);
  const canOffer = !myOffer && (!order || order.status === "open" || order.status === "collecting_offers");
  const mobileTabs = ["chat", "details"];
  if (userIsProvider && canOffer) mobileTabs.push("offers");
  if (userIsProvider && myOffer) mobileTabs.push("my_offer");
  const stageForAi = order?.status === "completed"
    ? "completed"
    : order?.status === "in_progress"
      ? "in_progress"
      : order?.status === "funded"
        ? "funded"
        : order?.status === "accepted"
          ? "accepted"
          : "offers";
  const fallbackAiSeedByStage = {
    offers: "Którą ofertę wybrać i co poprawić, żeby szybciej domknąć zlecenie?",
    accepted: "Co zrobić po akceptacji oferty, żeby bezpiecznie przejść do płatności?",
    funded: "Jak najlepiej ustalić harmonogram realizacji po opłaceniu?",
    in_progress: "Jak sprawnie poprowadzić realizację zlecenia krok po kroku?",
    completed: "Jak zamknąć zlecenie i co jeszcze warto zrobić po zakończeniu?",
  };
  const fallbackAiTipByStage = {
    offers: "Masz oferty — AI pomoże wskazać najbezpieczniejszą i najbardziej opłacalną.",
    accepted: "Oferta zaakceptowana — AI podpowie kolejne kroki przed płatnością.",
    funded: "Płatność jest zabezpieczona — AI podpowie jak najlepiej ustalić termin i zakres.",
    in_progress: "Trwa realizacja — AI podpowie co doprecyzować, aby uniknąć nieporozumień.",
    completed: "Zlecenie zakończone — AI podpowie ostatnie ważne kroki i podsumowanie.",
  };
  const mobileAiSeedQuery = aiFollowup?.seedQuery || fallbackAiSeedByStage[stageForAi] || fallbackAiSeedByStage.offers;
  const mobileAiTip = aiFollowup?.tip || fallbackAiTipByStage[stageForAi] || fallbackAiTipByStage.offers;
  const showMobileAiStrip = tab === "details" && (isClient || isProvider) && Boolean(mobileAiSeedQuery);

  const openEditOrder = () => {
    setEditForm({
      description: order.description || '',
      location: (order.location && typeof order.location === 'object' ? order.location.address : order.location) || '',
      budget: order.budget ?? '',
      urgency: order.urgency || 'flexible',
      serviceDetails: order.serviceDetails || ''
    });
    setShowEditOrderModal(true);
  };

  const handleAiFollowupAction = ({ seedQuery } = {}) => {
    const actionType = aiFollowup?.actionType;
    if (isClient && ['add_attachments', 'improve_order', 'complete_brief'].includes(actionType)) {
      openEditOrder();
      return;
    }
    if (isClient && ['compare_offers', 'review_offers', 'choose_offer'].includes(actionType)) {
      goTab('details');
      setTimeout(() => document.getElementById('order-offers-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      return;
    }
    if (isProvider && ['make_offer', 'send_offer', 'price_offer', 'provider_offer'].includes(actionType)) {
      goTab(myOffer ? 'my_offer' : 'offers');
      return;
    }
    if (['chat', 'schedule', 'contact_provider', 'payment', 'payment_or_schedule', 'schedule_work', 'provider_schedule', 'provider_scope', 'provider_review'].includes(actionType)) {
      goTab('chat');
      return;
    }
    if (seedQuery) {
      openAI("modal", seedQuery);
    }
  };
  
  // Sprawdź czy provider jest przypisany do zlecenia LUB złożył ofertę (dla innych logik, np. uprawnień)
  const isAssignedProvider = (() => {
    if (!isProvider) return false;

    const orderProviderId =
      typeof order.provider === "string" ? order.provider : order.provider?._id;
    if (viewerIsCompanyTeamForOrderProvider && isCompanyLead && orderProviderId) {
      return true;
    }

    const myUid = currentUser?._id || currentUser?.id;
    if (orderProviderId && String(myUid) === String(orderProviderId)) return true;

    // Sprawdź czy ma ofertę na to zlecenie (dla demo i rzeczywistych zleceń)
    if (myOffer !== null && myOffer !== undefined) return true;

    // Dla demo zleceń - jeśli użytkownik ma rolę provider i jest to demo zlecenie z ofertami,
    // sprawdź czy ma ofertę w order.offers
    if (order.__demo && order.offers && Array.isArray(order.offers) && order.offers.length > 0) {
      const myId = currentUser?._id || currentUser?.id;
      // Jeśli nie ma jeszcze przypisanego providera, a są oferty, sprawdź czy któraś pasuje
      if (!orderProviderId) {
        const hasOffer = order.offers.some(o => {
          const offerProviderId = o.providerId || o.provider?._id || o.provider;
          return offerProviderId && String(offerProviderId) === String(myId);
        });
        if (hasOffer) return true;
        // Dla demo - jeśli użytkownik ma rolę provider i jest to demo zlecenie z ofertami,
        // ale nie ma jeszcze przypisanego providera, użyj pierwszej oferty jako "mojej"
        if (order.offers.length > 0) return true;
      } else {
        // Jeśli jest przypisany provider, sprawdź czy to ja
        const hasOffer = order.offers.some(o => {
          const offerProviderId = o.providerId || o.provider?._id || o.provider;
          return offerProviderId && String(offerProviderId) === String(myId);
        });
        if (hasOffer) return true;
      }
    }
    
    return false;
  })();

  const hasMyOrderRating = userHasSubmittedOrderRating({
    order,
    userId: currentUserId,
    isClient,
    isProvider,
  });

  // (Debug log usunięty) – nie spamuj konsoli użytkownika

  const orderTitle = order?.service ? `Zlecenie: ${serviceLabel(order.service)} | Helpfli` : `Zlecenie #${order?._id?.slice(-6) || orderId} | Helpfli`;

  const disputeOngoing = disputeCaseIsOngoing(order);
  const disputeArchive = disputeCaseHasResolvedArchive(order);

  return (
    <div className="min-h-screen bg-[var(--qs-color-bg-soft)] py-4 md:py-6">
      <Helmet>
        <title>{orderTitle}</title>
        <meta name="description" content={order?.description ? `${order.description.slice(0, 155)}…` : "Szczegóły zlecenia w Helpfli."} />
      </Helmet>
      {/* HEADER */}
      <div className="w-full border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
                  Zlecenie #{order._id?.slice(-6)}
                </h1>
                <button
                  onClick={async () => {
                    const fullId = order._id || orderId;
                    const success = await copyToClipboard(fullId);
                    if (success) {
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                      toast({
                        title: "Skopiowano",
                        description: `ID zlecenia: ${fullId?.slice(-6)}`,
                        variant: "success"
                      });
                    } else {
                      toast({
                        title: "Błąd",
                        description: "Nie udało się skopiować ID zlecenia",
                        variant: "error"
                      });
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors group"
                  title="Kopiuj ID zlecenia"
                  aria-label="Kopiuj ID zlecenia"
                >
                  {copiedId ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
                  )}
                </button>
                <StatusBadge status={order.status} />
                {order.boostedUntil && new Date(order.boostedUntil) > new Date() && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold shadow-lg animate-pulse">
                    ⭐ PODBITE
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs md:text-sm text-slate-500">
                {clientName} → {providerName}
              </div>
              {/* Informacja o źródle zlecenia (AI vs manual) */}
              {order.source === 'ai' && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-700">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Utworzone z Asystentem AI</span>
                </div>
              )}
            </div>

            <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1 overflow-x-auto scrollbar-hide">
              {mobileTabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => goTab(t)}
                    className={`rounded-xl px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap transition-colors ${
                      tab === t
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {t === "chat" ? "Czat" : t === "offers" ? "Oferta" : t === "my_offer" ? "Moja oferta" : "Szczegóły"}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {disputeOngoing && (
        <div className="w-full border-b border-orange-200 bg-orange-50">
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <AlertCircle className="w-5 h-5 text-orange-700 shrink-0 mt-0.5" aria-hidden />
              <div className="text-sm text-orange-950">
                <span className="font-semibold">Aktywna sprawa (spór / reklamacja).</span>{" "}
                Negocjacja, ugoda i eskalacja do Helpfli — w jednym miejscu.
              </div>
            </div>
            <Link
              to={`/orders/${orderId}/sprawa`}
              className="shrink-0 inline-flex items-center justify-center rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              Otwórz centrum sprawy
            </Link>
          </div>
        </div>
      )}
      {disputeArchive && !disputeOngoing && (
        <div className="w-full border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden />
              <div className="text-sm text-slate-800">
                <span className="font-semibold">Sprawa zamknięta ugodą.</span>{" "}
                Wątek i rozliczenie znajdziesz w archiwum centrum sprawy.
              </div>
            </div>
            <Link
              to={`/orders/${orderId}/sprawa`}
              className="shrink-0 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Archiwum sprawy
            </Link>
          </div>
        </div>
      )}

      {/* PROGRESS BAR */}
      {tab === "details" && (
        <div className="w-full border-b border-slate-200 bg-white">
          {isOffersOnlyOrder(order) && (
            <div className="mx-auto max-w-6xl px-4 md:px-6 pt-3 space-y-3">
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-950">
                <strong>Tryb: tylko oferty.</strong> Zbierasz wyceny i kontakt od wykonawców — rozliczenie za roboty poza Helpfli.
              </div>
              {order.contactLocked && isClient && (
                <OrderContactUnlockCard
                  orderId={order._id || order.id}
                  feePln={order.contactUnlockFeePln || 24}
                  onUnlocked={() => window.location.reload()}
                />
              )}
              {order.contactLocked && isProvider && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                  Dane kontaktowe klienta będą widoczne po opłacie odblokowania kontaktu przez klienta.
                </p>
              )}
            </div>
          )}
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-3">
            <OrderProgressBar
              order={order}
              offersCount={order.offers?.length || 0}
              myOffer={myOffer}
              hasMyRating={hasMyOrderRating}
              isProviderView={isProvider}
            />
          </div>
        </div>
      )}

      {showMobileAiStrip && (
        <div className="md:hidden w-full border-b border-indigo-100 bg-indigo-50/70">
          <div className="mx-auto max-w-6xl px-4 py-2.5">
            <div className="rounded-xl border border-indigo-200 bg-white/90 px-3 py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">AI podpowiedź</div>
                <p className="text-xs text-slate-700 truncate">{mobileAiTip}</p>
              </div>
              <button
                type="button"
                onClick={() => handleAiFollowupAction({ seedQuery: mobileAiSeedQuery })}
                className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white qs-tap-target qs-transition-soft hover:bg-indigo-700"
              >
                Otwórz AI
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="rounded-3xl bg-transparent p-5 md:p-7 lg:p-8">

          {/* Główny status (1 primary box) dla klienta na etapie collecting_offers */}
          {isClientCollectingOffers && (
            <div className="mb-5 rounded-xl bg-blue-50 border border-blue-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⏳</div>
                  <div>
                    <div className="font-semibold text-blue-900">
                      Czekasz na oferty ({order.offers?.length || 0}/3)
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      Wykonawcy mogą teraz składać oferty. Otrzymasz powiadomienie gdy pojawi się nowa oferta.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    goTab("details");
                    setTimeout(
                      () => document.getElementById("order-offers-section")?.scrollIntoView({ behavior: "smooth", block: "start" }),
                      50
                    );
                  }}
                  disabled={!order?.offers?.length}
                  className="rounded-lg px-3 py-2 text-sm font-medium border border-blue-200 bg-white text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Zobacz oferty
                </button>
              </div>
              <div className="mt-3 rounded-lg border border-blue-100 bg-white/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-slate-700">💡 Chcesz przyspieszyć? Dodaj zdjęcie lub termin</div>
                <button
                  type="button"
                  onClick={() => handleAiFollowupAction({ seedQuery: aiFollowup?.seedQuery || "Jak poprawić zlecenie, żeby szybciej dostać oferty?" })}
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-900"
                >
                  ✨ Podpowiedzi AI
                </button>
              </div>
            </div>
          )}

          {tab === "details" && !isClientCollectingOffers && (
            <NextStepBanner
              order={order}
              isClient={isClient}
              isProvider={isProvider}
              isAssignedProvider={isAssignedProvider}
              onGoToOffers={() => {
                goTab('details');
                setTimeout(() => document.getElementById('order-offers-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
              }}
              onGoToPayment={() => {
                if (order?.status === 'accepted' && (order?.paymentMethod !== 'external' && order?.paymentPreference !== 'external')) {
                  navigate(`/checkout/${orderId}`);
                  return;
                }
                goTab('details');
                setTimeout(() => document.getElementById('accepted-payment-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
              }}
              onProviderBannerAction={(action) => {
                if (action === "chat") {
                  goTab("chat");
                  return;
                }
                goTab("details");
                if (action === "start") {
                  setTimeout(
                    () =>
                      document
                        .getElementById("provider-start-work")
                        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
                    80
                  );
                }
              }}
            />
          )}

          {tab === "details" && isProvider && myOffer && (hasAiPilot || providerMatch) && (
            <div className="mb-5 rounded-2xl border border-indigo-200 bg-white">
              <button
                type="button"
                onClick={() => setAiInsightsOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-950">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Sugestie AI
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-indigo-600 transition-transform ${aiInsightsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {aiInsightsOpen && (
                <div className="border-t border-indigo-100 p-4 space-y-4">
                  {hasAiPilot && (
                    <AIStepHint
                      stage={order.status === 'completed' ? 'completed' : order.status === 'in_progress' ? 'in_progress' : 'open'}
                      title={aiFollowup.title}
                      tip={aiFollowup.tip}
                      seedQuery={aiFollowup.seedQuery}
                      ctaLabel={aiFollowup.cta}
                      priority={aiFollowup.priority}
                      phaseLabel={aiFollowup.phaseLabel}
                      stepLabel={aiFollowup.stepLabel}
                      oneActionReason={aiFollowup.oneActionReason}
                      onAction={handleAiFollowupAction}
                    />
                  )}
                  {providerMatch && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-indigo-900">
                          {providerMatch.label || 'Dopasowanie do Twojego profilu'}
                        </div>
                        <div className="text-sm font-semibold text-indigo-700">
                          {Math.round(providerMatch.score || providerMatch.percent || 0)}% match
                        </div>
                      </div>
                    </div>
                  )}
                  <ProviderJobAssistant
                    order={order}
                    onGoChat={() => goTab('chat')}
                  />
                </div>
              )}
            </div>
          )}

          {/* Info dla providera: ważność zlecenia (open/collecting_offers) - tylko informacja */}
          {tab === "details" && isProvider && (order.status === 'open' || order.status === 'collecting_offers') && (order.expiresAt != null || order.isExpired != null) && (
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Clock className="h-5 w-5 text-slate-500" />
                {order.isExpired ? (
                  <span className="text-sm font-medium text-amber-700">Zlecenie wygasło – nie można już składać ofert.</span>
                ) : order.hoursUntilExpiry != null ? (
                  <span className="text-sm text-slate-700">
                    <span className="font-medium">Ważność zlecenia:</span>{' '}
                    {order.hoursUntilExpiry > 24
                      ? `około ${Math.floor(order.hoursUntilExpiry / 24)} dni`
                      : order.hoursUntilExpiry < 1
                        ? 'mniej niż 1 godzina'
                        : `${order.hoursUntilExpiry} h`}
                    {' – możesz złożyć ofertę do tego terminu.'}
                  </span>
                ) : (
                  <span className="text-sm text-slate-700">Ważność zlecenia: do {order.expiresAt ? formatSmartTime(order.expiresAt, { maxRelativeDays: 0 }) : '—'}</span>
                )}
              </div>
            </div>
          )}

          {/* Akcje klienta: podgląd szczegółów + Edytuj / Anuluj / Wydłuż ważność - tylko dla open lub collecting_offers */}
          {tab === "details" && isClient && (order.status === 'open' || order.status === 'collecting_offers') && (
            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {/* Podsumowanie zlecenia nad przyciskami */}
              <div className="mb-4 flex flex-col gap-3">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Szczegóły zlecenia
                </div>
                <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-500" />
                  <span>{serviceLabel(order.service, 'Nie podano usługi')}</span>
                </div>
                {order.serviceDetails && (
                  <div className="text-xs text-indigo-700">
                    {order.serviceDetails}
                  </div>
                )}
                {order.description && (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {order.description}
                  </p>
                )}
                {/* Lokalizacja + budżet – podobnie jak w widoku providera */}
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">Lokalizacja</div>
                    <div className="mt-1 flex items-center gap-2 text-slate-900">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span>
                        {typeof order.location === 'string'
                          ? order.location
                          : (order.location?.address || order.location?.city || 'Nie podano')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">Budżet</div>
                    <div className="mt-1 flex items-center gap-2 text-slate-900 font-semibold">
                      <Banknote className="h-4 w-4 text-emerald-600" />
                      <span>
                        {order.budget
                          ? `${order.budget} zł`
                          : (order.budgetFrom || order.budgetTo)
                            ? `${order.budgetFrom || '?'}–${order.budgetTo || '?'} zł`
                            : 'Nie podano'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditForm({
                        description: order.description || '',
                        location: (order.location && typeof order.location === 'object' ? order.location.address : order.location) || '',
                        budget: order.budget ?? '',
                        urgency: order.urgency || 'flexible',
                        serviceDetails: order.serviceDetails || ''
                      });
                      setShowEditOrderModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="h-4 w-4" />
                    Edytuj zlecenie
                  </button>
                  {(order.status === 'open' || order.status === 'collecting_offers') && (
                    <button
                      type="button"
                      onClick={handleCancelOrder}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Anuluj zlecenie
                    </button>
                  )}
                </div>
                {(order.expiresAt != null || order.isExpired != null) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {order.isExpired ? (
                      <span className="text-sm text-amber-700 font-medium">Zlecenie wygasło</span>
                    ) : order.hoursUntilExpiry != null && order.hoursUntilExpiry < 24 ? (
                      <span className="text-sm text-amber-700 font-medium">
                        Czas zlecenia się kończy {order.hoursUntilExpiry < 1 ? "(< 1h)" : `(${order.hoursUntilExpiry}h)`}
                      </span>
                    ) : null}
                    <div className="flex gap-2">
                      {order.isExpired ? (
                        <button
                          type="button"
                          onClick={() => handleExtend(24)}
                          disabled={extendingOrderId}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {extendingOrderId ? "..." : "Przywróć (+24h)"}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleExtend(24)}
                            disabled={extendingOrderId}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {extendingOrderId ? "..." : "+24h"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExtend(72)}
                            disabled={extendingOrderId}
                            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {extendingOrderId ? "..." : "+72h"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BANNER GWARANCJI - tylko dla zakładki details; przy kliencie+completed hub zastępuje ten blok */}
          {tab === "details" && !(isClient && order?.status === "completed") && (
            <div className="mb-5">
              <GuaranteeBanner
                eligible={!!order.eligibleForGuarantee}
                reasons={order.guaranteeReasons || []}
                compact
                orderStatus={order.status}
              />
            </div>
          )}

          {tab === "details" && isClient && order?.status === "completed" && (
            <ClientOrderCompletionHub
              order={order}
              hasClientRated={userHasSubmittedOrderRating({
                order,
                userId: me?._id || me?.id || user?._id || user?.id,
                isClient: true,
                isProvider: false,
              })}
              onScrollToAction={() =>
                document
                  .getElementById("client-confirm-receipt")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
            />
          )}

          {/* TAB: OFERTY (tylko dla providera) */}
          {tab === "offers" && isProvider && orderId && (
            <div className="space-y-6">
              {/* Sprawdź czy zlecenie jest jeszcze załadowane */}
              {!order && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Ładowanie szczegółów zlecenia...</p>
                  </div>
                </div>
              )}

              {/* Alert dla bezpośredniego zlecenia */}
              {order && (order.type === 'direct' || order.provider) && (
                <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🎯</div>
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-1">Bezpośrednie zlecenie</div>
                      <div className="text-sm text-indigo-100">
                        To zlecenie zostało wysłane bezpośrednio do Ciebie przez klienta. Masz pierwszeństwo w złożeniu oferty.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formularz oferty i Asystent AI - zawsze pokazuj jeśli orderId istnieje */}
              {orderId ? (
                <div>
                  {/* Formularz oferty */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Złóż ofertę</h2>
                    <OfferForm
                      orderId={orderId}
                      service={order?.service || ""}
                      city={order?.location?.city || order?.city || ""}
                      orderDescription={order?.description || ""}
                      onSent={async () => {
                        toast({
                          title: "Oferta została wysłana",
                          description:
                            "Klient zobaczy Twoją ofertę na zleceniu.",
                          variant: "success",
                        });
                        const token = localStorage.getItem("token");
                        try {
                          const fresh = await apiGet(`/api/orders/${orderId}`);
                          setOrder(fresh);
                          if (token) {
                            const mePayload = me || user;
                            const myOfferData = await resolveMyOfferForOrder({
                              token,
                              orderId,
                              orderRes: fresh,
                              mePayload,
                            });
                            setMyOffer(myOfferData);
                            if (!myOfferData) {
                              const pid = String(
                                me?._id ||
                                  me?.id ||
                                  user?._id ||
                                  user?.id ||
                                  ""
                              );
                              const mine = Array.isArray(fresh?.offers)
                                ? fresh.offers.find(
                                    (o) =>
                                      String(o.providerId || "") === pid
                                  )
                                : null;
                              setMyOffer(mine || null);
                            }
                          }
                        } catch {
                          // Oferta już zapisana — i tak przełączamy widok
                        }
                        goTab("my_offer");
                      }}
                      isPriority={order?.priority === "priority"}
                      priorityDateTime={order?.priorityDateTime}
                      orderPaymentPreference={order?.paymentPreference}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-center py-8">
                    <p className="text-slate-600">Brak identyfikatora zlecenia.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: TWOJA OFERTA (tylko gdy wykonawca ma złożoną ofertę) */}
          {tab === "my_offer" && isProvider && myOffer && (
            <div className="w-full space-y-4">
              <OrderOffersStageView
                order={order}
                orderId={orderId}
                onAcceptOffer={acceptOffer}
                onCancelOffer={handleCancelOffer}
                onEditOffer={() => {
                  setEditOfferForm({
                    amount: String(myOffer?.amount ?? myOffer?.price ?? ''),
                    message: myOffer?.message ?? myOffer?.notes ?? '',
                    completionDate: myOffer?.completionDate ? new Date(myOffer.completionDate).toISOString().slice(0, 16) : '',
                    paymentMethod: myOffer?.paymentMethod || order?.paymentPreference || 'system'
                  });
                  setShowEditOfferModal(true);
                }}
                isClient={false}
                isProvider={true}
                myOffer={myOffer}
                showOrderInfo={true}
                showMyOfferCard={true}
              />
              <div className="rounded-2xl border border-purple-200 bg-white p-4 shadow-sm">
                <div className="mb-3">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    AI follow-up po ofercie
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Wygeneruj krótkie przypomnienie, propozycję terminu albo poprawkę oferty, jeśli klient jeszcze nie odpowiedział.
                  </p>
                </div>
                <ProviderAIChat
                  orderId={orderId}
                  orderDescription={order?.description || ""}
                  contextMode="followup"
                />
              </div>
            </div>
          )}

          {/* TAB: CZAT */}
          {tab === "chat" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 md:p-4">
              {(() => {
                const isClientCollecting =
                  (order.__demo && order._id === "demo-order-2") ||
                  (!order.__demo && me?.role === "client" && ["open", "collecting_offers"].includes(order.status));

                const listRaw = order.__demo
                  ? (order.offers || []).map((o) => ({
                      providerId: o.providerId,
                      name: o.providerMeta?.name || "Wykonawca",
                      price: o.amount || o.price,
                    }))
                  : [
                      ...((orderOffers || []).map((o) => ({
                        providerId: o.providerId,
                        name: o.providerMeta?.name || "Wykonawca",
                        price: o.amount || o.price,
                      })) || []),
                      ...((orderConversations || []).map((c) => {
                        const other = (c.participants || []).find(
                          (p) => String(p?._id || p) !== String(me?.id || me?._id)
                        );
                        return {
                          providerId: other?._id || other || null,
                          name: other?.name || "Wykonawca",
                          price: null,
                        };
                      }) || []),
                    ];

                const uniq = [];
                const seen = new Set();
                for (const x of listRaw) {
                  const k = String(x.providerId || "");
                  if (!k || seen.has(k)) continue;
                  seen.add(k);
                  uniq.push(x);
                }

                // Layout: lista po lewej (na desktop), czat po prawej
                return (
                  <div className={`${isClientCollecting ? "grid gap-3 lg:grid-cols-[minmax(14rem,280px)_minmax(0,1fr)]" : ""}`}>
                    {isClientCollecting && (
                      <aside className="rounded-xl border border-slate-200 bg-white">
                        <div className="px-3 py-2 border-b border-slate-100">
                          <div className="text-sm font-semibold text-slate-900">Rozmowy</div>
                          <div className="text-xs text-slate-500">Wybierz wykonawcę, aby otworzyć rozmowę</div>
                        </div>

                        {uniq.length ? (
                          <div className="max-h-[520px] overflow-auto p-2 space-y-1">
                            {uniq.map((p) => {
                              const active = String(chatSelectedProviderId) === String(p.providerId);
                              const initials =
                                (p.name || "W").trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase()).join("") || "W";
                              return (
                                <button
                                  key={String(p.providerId)}
                                  type="button"
                                  onClick={() => setChatSelectedProviderId(String(p.providerId))}
                                  className={`w-full text-left rounded-xl p-2 border transition-colors ${
                                    active
                                      ? "bg-indigo-50 border-indigo-200"
                                      : "bg-white border-transparent hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                                      active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                                    }`}>
                                      {initials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                                      <div className="text-xs text-slate-500">
                                        {p.price ? `Oferta: ${p.price} zł` : "Rozmowa"}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                              <Inbox className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Brak rozmów</h3>
                            <p className="text-sm text-slate-600 text-center max-w-md">
                              Nie ma jeszcze aktywnych konwersacji dla tego zlecenia.
                            </p>
                          </div>
                        )}
                      </aside>
                    )}

                    <div className="rounded-xl border border-slate-200 bg-white p-2 md:p-3">
                      {!order.__demo &&
                        isProvider &&
                        !viewerIsCompanyTeamForOrderProvider &&
                        ["open", "collecting_offers"].includes(order.status) &&
                        !myOffer && (
                          <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Możesz zadawać pytania przed ofertą. Dane kontaktowe i linki są ukrywane do momentu akceptacji oferty.
                          </div>
                        )}
                      {activeConversation?._id ? (
                        <ChatBox
                          conversationId={activeConversation._id}
                          currentUser={currentUserNormalized}
                          participants={activeConversation.participants || []}
                          order={order}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Brak konwersacji
                          </h3>
                          <p className="text-sm text-slate-600 text-center max-w-md">
                            Wybierz wykonawcę z listy po lewej, aby rozpocząć rozmowę.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}


          {/* TAB: SZCZEGÓŁY */}
          {tab === "details" && (
            <div className="space-y-6">
              {/* Główna zawartość - widok etapowy dla klienta i providera */}
              <div className="space-y-6 lg:min-w-0">
                {/* Widok etapowy dla providera */}
                {isProvider && (() => {
                  // Określ aktualny etap (używając tej samej logiki co OrderProgressBar)
                  const getCurrentStage = () => {
                    const isExternalPayment = order.paymentMethod === 'external' || order.paymentPreference === 'external';
                    const orderStatus = order.status;
                    const acceptedOfferId = order.acceptedOfferId?._id || order.acceptedOfferId;
                    const platformFee = Number(order.pricing?.platformFee || 0);
                    const externalCommissionPaid = order.externalCommissionStatus === 'succeeded';
                    const externalReadyForStart = !isExternalPayment || platformFee <= 0 || externalCommissionPaid;
                    
                    if (myOffer) {
                      const myOfferId = myOffer._id || myOffer.id;
                      const isMyOfferAccepted = acceptedOfferId && myOfferId && String(acceptedOfferId) === String(myOfferId);
                      
                      if (orderStatus === 'completed' || orderStatus === 'rated' || orderStatus === 'released') {
                        return isMyOfferAccepted ? 'completed' : 'rejected';
                      }
                      if (orderStatus === 'in_progress') {
                        return isMyOfferAccepted ? 'in_progress' : 'rejected';
                      }
                      if (!isExternalPayment && (orderStatus === 'funded' || order.paymentStatus === 'succeeded' || order.paidInSystem)) {
                        if (!isMyOfferAccepted) return 'rejected';
                        return 'funded';
                      }
                      if (isExternalPayment && isMyOfferAccepted && orderStatus === 'accepted' && externalReadyForStart) {
                        return 'funded';
                      }
                      if (orderStatus === 'accepted' || isMyOfferAccepted) {
                        return isMyOfferAccepted ? 'accepted' : 'rejected';
                      }
                      if (acceptedOfferId && !isMyOfferAccepted) {
                        return 'rejected';
                      }
                    } else {
                      if (orderStatus === 'completed' || orderStatus === 'rated' || orderStatus === 'released') {
                        return 'rejected';
                      }
                      if (orderStatus === 'in_progress' || orderStatus === 'funded') {
                        return 'rejected';
                      }
                      if (acceptedOfferId) {
                        return 'rejected';
                      }
                    }
                    
                    return 'awaiting';
                  };

                  const currentStage = getCurrentStage();

                  // ETAP: Oczekuje / Złożone (moja oferta)
                  if (currentStage === 'awaiting') {
                    return (
                      <OrderOffersStageView 
                        order={order} 
                        orderId={orderId}
                        onAcceptOffer={acceptOffer}
                        onCancelOffer={handleCancelOffer}
                        onEditOffer={() => {
                          setEditOfferForm({
                            amount: String(myOffer?.amount ?? myOffer?.price ?? ''),
                            message: myOffer?.message ?? myOffer?.notes ?? '',
                            completionDate: myOffer?.completionDate ? new Date(myOffer.completionDate).toISOString().slice(0, 16) : '',
                            paymentMethod: myOffer?.paymentMethod || order?.paymentPreference || 'system'
                          });
                          setShowEditOfferModal(true);
                        }}
                        isClient={false}
                        isProvider={true}
                        myOffer={myOffer}
                        showOrderInfo={true}
                        showMyOfferCard={false}
                showAiHint={showStageAiHint}
                      />
                    );
                  }

                  // ETAP: Oferta zaakceptowana
                  if (currentStage === 'accepted') {
                    return (
                      <OrderAcceptedStageView 
                        order={order}
                        orderId={orderId}
                        isClient={false}
                        isProvider={true}
                        onFundEscrow={fundEscrow}
                        CheckoutButton={CheckoutButton}
                        onStartWork={startWork}
                        isLoadingStartWork={startingWork}
                        isLoadingFundEscrow={fundingEscrow}
                        videoSession={videoSession}
                        showAiHint={!isClientCollectingOffers && showStageAiHint}
                      />
                    );
                  }

                  // ETAP: Opłacone
                  if (currentStage === 'funded') {
                    return (
                      <OrderFundedStageView 
                        order={order}
                        isClient={false}
                        isProvider={true}
                        onStartWork={startWork}
                        isLoadingStartWork={startingWork}
                        showAiHint={showStageAiHint}
                      />
                    );
                  }

                  // ETAP: W realizacji
                  if (currentStage === 'in_progress') {
                    return (
                      <OrderInProgressStageView 
                        order={order}
                        orderId={orderId}
                        isClient={false}
                        isProvider={true}
                        onCompleteOrder={() => setShowCompleteOrderModal(true)}
                        onConfirmReceipt={confirmReceipt}
                        onReportDispute={reportDispute}
                        onRequestRefund={requestRefund}
                        isLoadingCompleteOrder={completingOrder}
                        isLoadingConfirmReceipt={confirmingReceipt}
                        isLoadingReportDispute={reportingDispute}
                        isLoadingRequestRefund={requestingRefund}
                        videoSession={videoSession}
                        showAiHint={showStageAiHint}
                      />
                    );
                  }

                  // ETAP: Zakończone
                  if (currentStage === 'completed') {
                    return (
                      <OrderCompletedStageView 
                        order={order}
                        orderId={orderId}
                        isClient={false}
                        isProvider={true}
                        onRate={() => setOpenRate(true)}
                        showAiHint={showStageAiHint}
                        hasMyRating={hasMyOrderRating}
                      />
                    );
                  }

                  // ETAP: Odrzucone (klient wybrał innego)
                  if (currentStage === 'rejected') {
                    return (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-2xl">❌</span>
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-red-900">Klient wybrał inną ofertę</h2>
                            <p className="text-sm text-red-700">To zlecenie zostało już zrealizowane przez innego wykonawcę</p>
                          </div>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-red-200">
                          <p className="text-sm text-red-800">
                            Klient zaakceptował ofertę innego wykonawcy. Dziękujemy za złożenie oferty - Twoja oferta została zapisana w statystykach skuteczności.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Widok etapowy dla klienta */}
                {!isProvider && (() => {
                  // Określ aktualny etap
                  const getCurrentStage = () => {
                    // Sprawdź czy płatność jest zewnętrzna (poza Helpfli)
                    const isExternalPayment = order.paymentMethod === 'external' || order.paymentPreference === 'external';
                    const platformFee = Number(order.pricing?.platformFee || 0);
                    const externalCommissionPaid = order.externalCommissionStatus === 'succeeded';
                    const externalReadyForStart = platformFee <= 0 || externalCommissionPaid;
                    
                    // Sprawdź statusy w kolejności priorytetowej
                    if (order.status === 'completed' || order.status === 'released' || order.status === 'rated') return 'completed';
                    if (order.status === 'in_progress') return 'in_progress';
                    
                    // Jeśli płatność jest zewnętrzna, pomiń etap "funded" - przejdź bezpośrednio do "in_progress" po akceptacji
                    if (isExternalPayment) {
                      // Dla płatności zewnętrznej: po akceptacji oferty można od razu rozpocząć pracę
                      if (order.status === 'accepted' && externalReadyForStart) return 'funded';
                      if (order.status === 'accepted') return 'accepted';
                      if (order.status === 'collecting_offers' || (order.offers?.length > 0 && order.status !== 'accepted')) return 'offers';
                      if (order.status === 'open' || order.status === 'draft') return 'created';
                      return 'created';
                    }
                    
                    // Dla płatności w systemie (Helpfli) - standardowy flow
                    if (order.status === 'funded' || (order.paymentStatus === 'succeeded' && order.paidInSystem)) return 'funded';
                    if (order.status === 'accepted' && (order.paymentStatus !== 'succeeded' && !order.paidInSystem)) return 'accepted';
                    if (order.status === 'collecting_offers' || (order.offers?.length > 0 && order.status !== 'accepted' && order.status !== 'funded')) return 'offers';
                    if (order.status === 'open' || order.status === 'draft') return 'created';
                    return 'created';
                  };

                  const currentStage = getCurrentStage();

                  // ETAP 1: Utworzone
                  if (currentStage === 'created') {
                    return (
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-2xl">📝</span>
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-slate-900">Zlecenie utworzone</h2>
                            <p className="text-sm text-gray-500">Szczegóły zlecenia</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {/* Usługa */}
                          <div>
                            <label className="text-sm font-medium text-gray-700">Usługa</label>
                            <div className="mt-1 text-slate-900">{serviceLabel(order.service)}</div>
                            {order.serviceDetails && (
                              <div className="mt-1 text-indigo-700 font-medium">{order.serviceDetails}</div>
                            )}
                          </div>

                          {/* Opis zlecenia */}
                          <div>
                            <label className="text-sm font-medium text-gray-700">Opis zlecenia</label>
                            <div className="mt-1 text-slate-900 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-200">
                              {order.description || 'Brak opisu'}
                            </div>
                          </div>

                          {/* Lokalizacja i Budżet */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Lokalizacja</label>
                              <div className="mt-1 text-slate-900">
                                {typeof order.location === 'string' 
                                  ? order.location 
                                  : (order.location?.address || order.location?.city || "Nie podano")}
                              </div>
                            </div>
                            {(order.budget || order.budgetFrom || order.budgetTo) && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Budżet</label>
                                <div className="mt-1 text-slate-900 font-semibold">
                                  {order.budget 
                                    ? `${order.budget} zł` 
                                    : `${order.budgetFrom || '?'}–${order.budgetTo || '?'} zł`}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Preferowane rozliczenie */}
                          {order.paymentPreference && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Preferowane rozliczenie</label>
                              <div className="mt-1">
                                {order.paymentPreference === 'system' ? (
                                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <span className="text-emerald-600">🛡️</span>
                                      <div>
                                        <div className="font-semibold text-emerald-900">Helpfli Protect (rekomendowane)</div>
                                        <div className="text-xs text-emerald-700 mt-0.5">
                                          Płatność przez system Helpfli. Otrzymasz gwarancję, możliwość sporu i bezpieczne rozliczenie.
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : order.paymentPreference === 'external' ? (
                                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <span className="text-amber-600">💳</span>
                                      <div>
                                        <div className="font-semibold text-amber-900">Płatność poza systemem</div>
                                        <div className="text-xs text-amber-700 mt-0.5">
                                          Rozliczenie bezpośrednio z wykonawcą. Brak gwarancji Helpfli i możliwości sporu.
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-600">🔄</span>
                                      <div>
                                        <div className="font-semibold text-blue-900">Oba warianty (ustalimy przy akceptacji oferty)</div>
                                        <div className="text-xs text-blue-700 mt-0.5">
                                          Pozwól wykonawcom składać oferty z oboma wariantami płatności. Wybierzesz przy akceptacji.
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Kiedy ma nastąpić pomoc */}
                          {(order.urgency || order.priorityDateTime || order.preferredTime) && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Kiedy ma nastąpić pomoc</label>
                              <div className="mt-1">
                                {order.priorityDateTime ? (
                                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <span className="text-amber-600">⚡</span>
                                      <div>
                                        <div className="font-semibold text-amber-900">Termin priorytetowy</div>
                                        <div className="text-sm text-amber-800 mt-0.5">
                                          {new Date(order.priorityDateTime).toLocaleDateString('pl-PL', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : order.urgency ? (
                                  <div className="text-slate-900">
                                    {order.urgency === 'now' ? '⚡ Pilne' : 
                                     order.urgency === 'today' ? '📅 Dzisiaj' :
                                     order.urgency === 'tomorrow' ? '📅 Jutro' :
                                     order.urgency === 'this_week' ? '📅 W tym tygodniu' :
                                     '📅 Elastyczne'}
                                  </div>
                                ) : (
                                  <div className="text-slate-900">{order.preferredTime}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Preferowana metoda kontaktu */}
                          {order.contactPreference && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Preferowana metoda kontaktu</label>
                              <div className="mt-1 text-slate-900">
                                {order.contactPreference === 'phone' ? '📞 Telefon' :
                                 order.contactPreference === 'email' ? '📧 Email' :
                                 order.contactPreference === 'chat' ? '💬 Czat' :
                                 order.contactPreference}
                              </div>
                            </div>
                          )}

                          {/* Załączniki */}
                          {order.attachments && Array.isArray(order.attachments) && order.attachments.length > 0 && (
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">Załączniki (zdjęcia/filmy)</label>
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                                {order.attachments.map((att, idx) => (
                                  <OrderAttachmentItem key={att._id || att.url || idx} orderId={orderId} att={att} idx={idx} />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Data utworzenia */}
                          <div className="text-xs text-gray-500 pt-2 border-t">
                            Utworzone: {formatSmartTime(order.createdAt || order.created, { maxRelativeDays: 7 })}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // ETAP 2: Oferty złożone
                  if (currentStage === 'offers') {
                    return (
                      <OrderOffersStageView 
                        order={order} 
                        orderId={orderId}
                        onAcceptOffer={acceptOffer}
                        onCancelOffer={isProvider ? handleCancelOffer : undefined}
                        onEditOffer={isProvider ? () => {
                          setEditOfferForm({
                            amount: String(myOffer?.amount ?? myOffer?.price ?? ''),
                            message: myOffer?.message ?? myOffer?.notes ?? '',
                            completionDate: myOffer?.completionDate ? new Date(myOffer.completionDate).toISOString().slice(0, 16) : '',
                            paymentMethod: myOffer?.paymentMethod || order?.paymentPreference || 'system'
                          });
                          setShowEditOfferModal(true);
                        } : undefined}
                        onEditOrder={isClient ? () => {
                          setEditForm({
                            description: order.description || '',
                            location: (order.location && typeof order.location === 'object' ? order.location.address : order.location) || '',
                            budget: order.budget ?? '',
                            urgency: order.urgency || 'flexible',
                            serviceDetails: order.serviceDetails || ''
                          });
                          setShowEditOrderModal(true);
                        } : undefined}
                        isClient={isClient}
                        isProvider={isProvider}
                        myOffer={myOffer}
                        showAiHint={showStageAiHint}
                      />
                    );
                  }

                  // ETAP 3: Oferta zaakceptowana
                  if (currentStage === 'accepted') {
                    return (
                      <OrderAcceptedStageView 
                        order={order}
                        orderId={orderId}
                        isClient={isClient}
                        isProvider={isProvider}
                        onFundEscrow={fundEscrow}
                        CheckoutButton={CheckoutButton}
                        onStartWork={startWork}
                        isLoadingStartWork={startingWork}
                        isLoadingFundEscrow={fundingEscrow}
                        videoSession={videoSession}
                        showAiHint={showStageAiHint}
                      />
                    );
                  }

                  // ETAP 4: Opłacone
                  if (currentStage === 'funded') {
                    return (
                      <OrderFundedStageView 
                        order={order}
                        isClient={isClient}
                        isProvider={isProvider}
                        onStartWork={startWork}
                        isLoadingStartWork={startingWork}
                        showAiHint={showStageAiHint}
                      />
                    );
                  }

                  // ETAP 5: W realizacji
                  if (currentStage === 'in_progress') {
                    return (
                      <OrderInProgressStageView 
                        order={order}
                        orderId={orderId}
                        isClient={isClient}
                        isProvider={isProvider}
                        onCompleteOrder={() => setShowCompleteOrderModal(true)}
                        onConfirmReceipt={confirmReceipt}
                        onReportDispute={reportDispute}
                        onRequestRefund={requestRefund}
                        isLoadingCompleteOrder={completingOrder}
                        isLoadingConfirmReceipt={confirmingReceipt}
                        isLoadingReportDispute={reportingDispute}
                        isLoadingRequestRefund={requestingRefund}
                        showAiHint={showStageAiHint}
                      />
                    );
                  }

                  // ETAP 6: Zakończone
                  if (currentStage === 'completed') {
                    return (
                      <OrderCompletedStageView 
                        order={order}
                        orderId={orderId}
                        isClient={isClient}
                        isProvider={isProvider}
                        onRate={() => setOpenRate(true)}
                        onConfirmReceipt={confirmReceipt}
                        isLoadingConfirmReceipt={confirmingReceipt}
                        showAiHint={showStageAiHint}
                        useCompletionHubLayout={isClient && order?.status === "completed"}
                        hasMyRating={hasMyOrderRating}
                      />
                    );
                  }

                  return null;
                })()}
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)] items-stretch">
                <div className="lg:col-start-1 h-full">
                  <OrderStatusTimeline orderId={orderId} className="h-full" />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 h-full">
                <h2 className="text-lg font-semibold text-slate-900">
                  Uczestnicy
                </h2>
                <div className="mt-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-600 font-semibold text-sm">
                      {(clientName || "K").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">
                      Klient: {clientName}
                    </div>
                    <div className="text-xs text-slate-500">
                      Wykonawca: {providerName}
                    </div>
                    <div className="mt-2">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </div>
                <div className="my-4 border-t border-slate-200"></div>

                {isClient && invoices.length > 0 && (
                  <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm">
                    <h3 className="mb-2 font-medium text-indigo-900">
                      Dokumenty rozliczeniowe
                    </h3>
                    {invoices.map((inv) => (
                      <div key={inv._id} className="flex items-center justify-between py-1 text-xs">
                        <div>
                          Faktura {inv.invoiceNumber || `#${inv._id.slice(-6)}`} •{" "}
                          {inv.status === "paid" ? "Opłacona" : "Wystawiona"}
                        </div>
                        <Link
                          to="/account?tab=invoices"
                          className="text-indigo-700 hover:underline"
                        >
                          Otwórz w Fakturach
                        </Link>
                      </div>
                    ))}
                  </div>
                )}

                {["done", "completed", "closed", "released", "rated"].includes(order.status) &&
                  (hasMyOrderRating ? (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="text-lg leading-none">✓</span>
                        {isProvider ? "Wystawiłeś ocenę klienta" : "Wystawiłeś ocenę wykonawcy"}
                      </div>
                      <p className="mt-1 text-xs text-emerald-800">
                        Dziękujemy — Twoja opinia jest zapisana i widoczna w profilu odbiorcy.
                      </p>
                    </div>
                  ) : (
                  <div className="mt-4">
                    <button
                      onClick={() => setOpenRate(true)}
                      className="w-full rounded-xl border border-amber-200 px-4 py-2 text-sm hover:bg-amber-50"
                    >
                      {isProvider ? "Oceń klienta" : "Oceń wykonawcę"}
                    </button>
                  </div>
                  ))}

                {isProvider && (
                  <div className="mt-4">
                    {currentUser?.role === "provider" &&
                    !viewerIsCompanyTeamForOrderProvider &&
                    me?.kyc?.status !== "verified" ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
                        <div className="flex items-start gap-3">
                          <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-amber-900">
                              Akcja wymagana
                            </h3>
                            <p className="text-xs text-amber-800 mt-1">
                              Wymagana weryfikacja KYC – aby aktywować akcje za zlecenie.
                            </p>
                            <a
                              href="/kyc"
                              className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                            >
                              Przejdź do weryfikacji KYC
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Pokazuj tylko gdy zlecenie zostało zaproszone do Ciebie (Ty jesteś przypisanym wykonawcą) – w normalnym flow wykonawca składa ofertę, a klient ją akceptuje */}
                        {order.status === "open" && order.provider && String(order.provider?._id || order.provider) === String(me?.id || me?._id) && (
                          <button
                            onClick={acceptOrder}
                            className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
                          >
                            Akceptuj zlecenie
                          </button>
                        )}
                        {order.status === "accepted" && (
                          <button
                            onClick={startWork}
                            className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                          >
                            Rozpocznij pracę
                          </button>
                        )}
                        {order.status === "in_progress" && (
                          <button
                            onClick={completeOrder}
                            className="w-full rounded-lg bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700"
                          >
                            Zakończ zlecenie
                          </button>
                        )}
                        {isProvider && ['accepted', 'funded', 'in_progress'].includes(order.status) && (
                          <button
                            onClick={() => setShowChangeRequestModal(true)}
                            className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 flex items-center justify-center gap-2"
                          >
                            <span>➕</span>
                            Zaproponuj dopłatę
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              </div>
            </div>
          )}

          <RatingModal
            open={openRate}
            onClose={() => setOpenRate(false)}
            heading={isProvider ? "Oceń klienta" : "Oceń wykonawcę"}
            orderId={order?._id}
            providerId={
              isProvider
                ? typeof order.client === "string"
                  ? order.client
                  : order.client?._id
                : typeof order.provider === "string"
                ? order.provider
                : order.provider?._id
            }
            onSubmitted={async () => {
              setOpenRate(false);
              try {
                const fresh = await apiGet(`/api/orders/${orderId}`);
                setOrder(fresh);
                const token = localStorage.getItem("token");
                if (token) {
                  const mePayload = me || user;
                  const mo = await resolveMyOfferForOrder({
                    token,
                    orderId,
                    orderRes: fresh,
                    mePayload,
                  });
                  setMyOffer(mo);
                }
              } catch (_e) {
                /* modal już zamknięty */
              }
            }}
          />
        </div>
      </div>

      {/* Modal proponowania dopłaty (provider) */}
      {isProvider && (
        <ChangeRequestModal
          isOpen={showChangeRequestModal}
          onClose={() => setShowChangeRequestModal(false)}
          onSubmit={async (data) => {
            const token = localStorage.getItem("token");
            await createChangeRequest({ token, orderId, payload: data });
            // Odśwież dane
            const fresh = await apiGet(`/api/orders/${orderId}`);
            setOrder(fresh);
            const crs = await getChangeRequests({ token, orderId });
            setChangeRequests(crs);
            toast({ title: "Propozycja dopłaty wysłana", description: "Klient został powiadomiony", variant: "success" });
          }}
          orderId={orderId}
        />
      )}

      {/* Modal edycji oferty (provider) */}
      {showEditOfferModal && myOffer?._id && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={() => !savingEditOffer && setShowEditOfferModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl qs-surface-sheet max-w-md w-full p-5 sm:p-6 max-h-[92dvh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Edytuj ofertę</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSavingEditOffer(true);
              try {
                const token = localStorage.getItem("token");
                await updateOffer({
                  token,
                  offerId: myOffer._id,
                  payload: {
                    amount: editOfferForm.amount === '' ? undefined : Number(editOfferForm.amount),
                    message: editOfferForm.message || undefined,
                    completionDate: editOfferForm.completionDate ? new Date(editOfferForm.completionDate).toISOString() : undefined,
                    ...(editOfferForm.paymentMethod && ['system', 'external'].includes(editOfferForm.paymentMethod) ? { paymentMethod: editOfferForm.paymentMethod } : {})
                  }
                });
                const fresh = await apiGet(`/api/orders/${orderId}`);
                setOrder(fresh);
                const mePayload = me || user;
                const freshOffer = await resolveMyOfferForOrder({
                  token,
                  orderId,
                  orderRes: fresh,
                  mePayload,
                });
                setMyOffer(freshOffer);
                setShowEditOfferModal(false);
                toast({ title: "Oferta zaktualizowana", variant: "success" });
              } catch (err) {
                toast({ title: "Błąd zapisu", description: getErrorMessage(err), variant: "error" });
              } finally {
                setSavingEditOffer(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kwota (PLN)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editOfferForm.amount}
                  onChange={(e) => setEditOfferForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wiadomość</label>
                <textarea
                  value={editOfferForm.message}
                  onChange={(e) => setEditOfferForm((f) => ({ ...f, message: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Termin realizacji</label>
                <input
                  type="datetime-local"
                  value={editOfferForm.completionDate}
                  onChange={(e) => setEditOfferForm((f) => ({ ...f, completionDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              {order?.paymentPreference === 'both' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Metoda płatności</label>
                  <select
                    value={editOfferForm.paymentMethod || 'system'}
                    onChange={(e) => setEditOfferForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="system">Płatność przez Helpfli (gwarancja)</option>
                    <option value="external">Płatność poza systemem</option>
                  </select>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditOfferModal(false)}
                  disabled={savingEditOffer}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={savingEditOffer || editOfferForm.amount === ''}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {savingEditOffer && <Loader2 className="h-4 w-4 animate-spin" />}
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal edycji zlecenia (klient) */}
      {showEditOrderModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={() => !savingEdit && setShowEditOrderModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl qs-surface-sheet max-w-lg w-full max-h-[92dvh] overflow-y-auto p-5 sm:p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Edytuj zlecenie</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSavingEdit(true);
              try {
                await apiPatch(`/api/orders/${orderId}`, {
                  description: editForm.description || undefined,
                  location: editForm.location || undefined,
                  budget: editForm.budget === '' ? null : Number(editForm.budget),
                  urgency: editForm.urgency,
                  serviceDetails: editForm.serviceDetails || undefined
                });
                const fresh = await apiGet(`/api/orders/${orderId}`);
                setOrder(fresh);
                setShowEditOrderModal(false);
                toast({ title: "Zlecenie zaktualizowane", variant: "success" });
              } catch (err) {
                toast({ title: "Błąd zapisu", description: getErrorMessage(err), variant: "error" });
              } finally {
                setSavingEdit(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Opis</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Opis zlecenia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lokalizacja / adres</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Adres lub miasto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Budżet (PLN)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editForm.budget}
                  onChange={(e) => setEditForm((f) => ({ ...f, budget: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Opcjonalnie"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilność</label>
                <select
                  value={editForm.urgency}
                  onChange={(e) => setEditForm((f) => ({ ...f, urgency: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="now">Teraz</option>
                  <option value="today">Dziś</option>
                  <option value="tomorrow">Jutro</option>
                  <option value="this_week">W tym tygodniu</option>
                  <option value="flexible">Elastycznie</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Doprecyzowanie usługi</label>
                <input
                  type="text"
                  value={editForm.serviceDetails}
                  onChange={(e) => setEditForm((f) => ({ ...f, serviceDetails: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Opcjonalnie"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditOrderModal(false)}
                  disabled={savingEdit}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {savingEdit && <Loader2 className="h-4 w-4 animate-spin" />}
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal akceptacji/odrzucenia dopłaty (klient) */}
      {isClient && pendingChangeRequest && (
        <ChangeRequestResponseModal
          isOpen={!!pendingChangeRequest}
          onClose={() => setPendingChangeRequest(null)}
          changeRequest={pendingChangeRequest}
          onAccept={async (changeRequestId, message) => {
            const token = localStorage.getItem("token");
            await acceptChangeRequest({ token, changeRequestId, message });
            // Odśwież dane
            const fresh = await apiGet(`/api/orders/${orderId}`);
            setOrder(fresh);
            const crs = await getChangeRequests({ token, orderId });
            setChangeRequests(crs);
            setPendingChangeRequest(null);
            toast({ title: "Dopłata zaakceptowana", variant: "success" });
          }}
          onReject={async (changeRequestId, message) => {
            const token = localStorage.getItem("token");
            await rejectChangeRequest({ token, changeRequestId, message });
            // Odśwież dane
            const fresh = await apiGet(`/api/orders/${orderId}`);
            setOrder(fresh);
            const crs = await getChangeRequests({ token, orderId });
            setChangeRequests(crs);
            setPendingChangeRequest(null);
            toast({ title: "Dopłata odrzucona", variant: "success" });
          }}
        />
      )}

      {/* Modal zakończenia zlecenia */}
      {showCompleteOrderModal && (
        <CompleteOrderModal
          isOpen={showCompleteOrderModal}
          onClose={() => setShowCompleteOrderModal(false)}
          onComplete={completeOrder}
          order={order}
        />
      )}

      {/* Confirm Dialog - Anulowanie oferty */}
      <ConfirmDialog
        isOpen={showCancelOfferConfirm}
        onClose={() => setShowCancelOfferConfirm(false)}
        onConfirm={confirmCancelOffer}
        title="Anulować ofertę?"
        message="Czy na pewno chcesz anulować swoją ofertę? Ta akcja jest nieodwracalna i oferta zostanie trwale usunięta."
        confirmLabel="Tak, anuluj"
        cancelLabel="Nie, zachowaj"
        variant="warning"
        loading={cancelingOffer}
      />

      {/* Confirm Dialog - Anulowanie zlecenia */}
      <ConfirmDialog
        isOpen={showCancelOrderConfirm}
        onClose={() => setShowCancelOrderConfirm(false)}
        onConfirm={confirmCancelOrder}
        title="Anulować zlecenie?"
        message="Czy na pewno chcesz anulować to zlecenie? Wszystkie oferty zostaną odrzucone. Ta akcja jest nieodwracalna."
        confirmLabel="Tak, anuluj"
        cancelLabel="Nie, zachowaj"
        variant="danger"
        loading={cancelingOrder}
      />

      {/* Confirm Dialog - Zgłoszenie sporu */}
      <ConfirmDialog
        isOpen={showDisputeConfirm}
        onClose={() => {
          setShowDisputeConfirm(false);
          setDisputeReason("");
        }}
        onConfirm={confirmReportDispute}
        title="Zgłosić spór?"
        message="Nasz zespół rozpatrzy spór w ciągu 24h. Opisz krótko problem (opcjonalnie):"
        confirmLabel="Zgłoś spór"
        cancelLabel="Anuluj"
        variant="warning"
        loading={reportingDispute}
        requiresInput={true}
        inputPlaceholder="Podaj powód sporu (opcjonalnie)..."
        inputValue={disputeReason}
        onInputChange={setDisputeReason}
        inputValidation={(value) => true} // Wszystkie wartości są akceptowane
      />

      {/* Confirm Dialog - Wymaganie zwrotu */}
      <ConfirmDialog
        isOpen={showRefundConfirm}
        onClose={() => setShowRefundConfirm(false)}
        onConfirm={confirmRequestRefund}
        title="Wymagać zwrotu środków?"
        message="Czy na pewno chcesz poprosić o zwrot środków? Spór zostanie automatycznie zgłoszony, a nasz zespół rozpatrzy wniosek w ciągu 24h."
        confirmLabel="Tak, wymagaj zwrotu"
        cancelLabel="Anuluj"
        variant="danger"
        loading={requestingRefund}
      />
    </div>
  );
}



