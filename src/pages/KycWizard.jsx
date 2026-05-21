import { apiUrl } from "@/lib/apiUrl";
import { DOC_LABELS, uploadKycDocuments } from "@/lib/kycUpload";
import { useToast } from "@/components/toast/ToastProvider";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const STATUS_LABELS = {
  not_started: "Nie rozpoczęto",
  in_progress: "W trakcie wypełniania",
  submitted: "Oczekuje na weryfikację",
  verified: "Zweryfikowano",
  rejected: "Odrzucono",
};

function getMissingDocs(kyc) {
  const docs = kyc?.docs || {};
  const missing = [];
  if (!docs.idFrontUrl) missing.push("idFront");
  if (!docs.idBackUrl) missing.push("idBack");
  if (!docs.selfieUrl) missing.push("selfie");
  if (kyc?.type === "company" && !docs.companyDocUrl) missing.push("companyDoc");
  return missing;
}

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function KycSuccessModal({ submittedAt, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kyc-success-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-gray-100 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 id="kyc-success-title" className="text-xl font-semibold text-gray-900">
          Wniosek został wysłany
        </h2>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          Twoje dokumenty trafiły do weryfikacji. Zwykle odpowiadamy w ciągu{" "}
          <strong>1–3 dni roboczych</strong>. O wyniku poinformujemy Cię e-mailem lub w aplikacji.
        </p>
        {submittedAt && (
          <p className="mt-2 text-xs text-gray-500">Data wysłania: {submittedAt}</p>
        )}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/provider-home"
            className="inline-flex justify-center px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
            onClick={onClose}
          >
            Wróć do panelu
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Zostań na tej stronie
          </button>
        </div>
      </div>
    </div>
  );
}

function KycStatusBanner({ status, kyc }) {
  if (status === "submitted") {
    const when = formatDate(kyc?.submittedAt);
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <span className="text-2xl shrink-0" aria-hidden>⏳</span>
          <div>
            <h2 className="font-semibold text-amber-900">Wniosek oczekuje na zatwierdzenie</h2>
            <p className="mt-1 text-sm text-amber-800 leading-relaxed">
              Wysłaliśmy Twoje dane do weryfikacji. Nie musisz nic robić — sprawdzimy dokumenty i damy znać,
              gdy konto zostanie zweryfikowane.
            </p>
            {when && <p className="mt-2 text-xs text-amber-700">Wysłano: {when}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (status === "verified") {
    const when = formatDate(kyc?.verifiedAt);
    return (
      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex gap-3">
          <span className="text-2xl shrink-0" aria-hidden>✓</span>
          <div>
            <h2 className="font-semibold text-emerald-900">Konto zweryfikowane</h2>
            <p className="mt-1 text-sm text-emerald-800">
              Weryfikacja KYC zakończona pomyślnie. Możesz korzystać z pełnych funkcji wykonawcy.
            </p>
            {when && <p className="mt-2 text-xs text-emerald-700">Zweryfikowano: {when}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-5">
        <div className="flex gap-3">
          <span className="text-2xl shrink-0" aria-hidden>✕</span>
          <div>
            <h2 className="font-semibold text-rose-900">Wniosek wymaga poprawy</h2>
            <p className="mt-1 text-sm text-rose-800">
              {kyc?.rejectionReason || "Dokumenty nie przeszły weryfikacji."} Uzupełnij lub wymień pliki i wyślij
              wniosek ponownie.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function KycWizard() {
  const token = localStorage.getItem("token");
  const { push: toast } = useToast();
  const [me, setMe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "individual",
    firstName: "",
    lastName: "",
    idNumber: "",
    companyName: "",
    nip: "",
  });
  const [files, setFiles] = useState({ idFront: null, idBack: null, selfie: null, companyDoc: null });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalSubmittedAt, setModalSubmittedAt] = useState(null);

  const fetchMe = async () => {
    const res = await fetch(apiUrl(`/api/kyc/me`), { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setMe(data);
    const k = data?.kyc || {};
    setForm(f => ({
      ...f,
      type: k.type || "individual",
      firstName: k.firstName || "",
      lastName: k.lastName || "",
      idNumber: k.idNumber || "",
      companyName: k.companyName || "",
      nip: k.nip || "",
    }));
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const missingDocs = useMemo(() => getMissingDocs(me?.kyc), [me]);
  const docsReady = missingDocs.length === 0;
  const hasPendingLocalFiles = Object.values(files).some(Boolean);

  const setMsg = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const saveData = async () => {
    setSaving(true);
    setMessage("");
    const res = await fetch(apiUrl(`/api/kyc/save`), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setMsg(data.message || "Błąd zapisu", "error");
    setMsg("Dane zapisane", "success");
    fetchMe();
  };

  const uploadDocs = async () => {
    if (!hasPendingLocalFiles) {
      return setMsg("Wybierz pliki przed zapisem", "error");
    }
    setSaving(true);
    setMessage("");
    try {
      const data = await uploadKycDocuments({ token, files, companyType: form.type });
      setFiles({ idFront: null, idBack: null, selfie: null, companyDoc: null });
      setMsg(
        data?.missing?.length
          ? "Część plików zapisana — uzupełnij brakujące dokumenty"
          : "Pliki zapisane na serwerze",
        "success"
      );
      fetchMe();
    } catch (e) {
      setMsg(e.message || "Błąd uploadu", "error");
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!docsReady) {
      const labels = missingDocs.map(k => DOC_LABELS[k] || k).join(", ");
      return setMsg(
        hasPendingLocalFiles
          ? `Masz wybrane pliki, ale nie są jeszcze na serwerze. Kliknij „Zapisz pliki”. Brakuje: ${labels}`
          : `Brakuje dokumentów: ${labels}. Wybierz pliki i kliknij „Zapisz pliki”.`,
        "error"
      );
    }
    setSaving(true);
    setMessage("");
    const res = await fetch(apiUrl(`/api/kyc/submit`), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setMsg(data.hint || data.message || "Błąd wysyłki", "error");

    const sentAt = formatDate(data.kyc?.submittedAt) || formatDate(new Date().toISOString());
    await fetchMe();
    setShowSuccessModal(true);
    setModalSubmittedAt(sentAt);
    toast({
      title: "Wniosek KYC wysłany",
      description: "Dokumenty czekają na weryfikację. O wyniku damy znać w ciągu kilku dni.",
      variant: "success",
      ttl: 6000,
    });
  };

  if (!me) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">Ładowanie…</div>;

  const status = me?.kyc?.status || "not_started";
  const disabled = status === "submitted" || status === "verified";
  const savedDocs = me?.kyc?.docs || {};
  const showForm = status !== "submitted" && status !== "verified";

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {showSuccessModal && (
        <KycSuccessModal
          submittedAt={modalSubmittedAt || formatDate(me?.kyc?.submittedAt)}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="p-6 sm:p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Weryfikacja KYC</h1>
          <p className="mb-4 text-sm text-gray-600">
            Status:{" "}
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                status === "verified"
                  ? "bg-emerald-100 text-emerald-800"
                  : status === "submitted"
                    ? "bg-amber-100 text-amber-800"
                    : status === "rejected"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {STATUS_LABELS[status] || status}
            </span>
          </p>

          <KycStatusBanner status={status} kyc={me?.kyc} />

          {status === "submitted" && (
            <div className="mb-6">
              <Link
                to="/provider-home"
                className="inline-flex px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Wróć do panelu wykonawcy
              </Link>
            </div>
          )}

          {showForm && (
            <>
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Krok 1: Dane wnioskodawcy</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className={labelClass}>Typ</span>
                    <select
                      className={inputClass}
                      value={form.type}
                      disabled={disabled}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="individual">Osoba fizyczna</option>
                      <option value="company">Firma</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Imię</span>
                    <input
                      className={inputClass}
                      disabled={disabled}
                      value={form.firstName}
                      onChange={e => setForm({ ...form, firstName: e.target.value })}
                      placeholder="Imię"
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Nazwisko</span>
                    <input
                      className={inputClass}
                      disabled={disabled}
                      value={form.lastName}
                      onChange={e => setForm({ ...form, lastName: e.target.value })}
                      placeholder="Nazwisko"
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Nr dokumentu (opcjonalnie)</span>
                    <input
                      className={inputClass}
                      disabled={disabled}
                      value={form.idNumber}
                      onChange={e => setForm({ ...form, idNumber: e.target.value })}
                      placeholder="Nr dokumentu"
                    />
                  </label>
                  {form.type === "company" && (
                    <>
                      <label className="block">
                        <span className={labelClass}>Nazwa firmy</span>
                        <input
                          className={inputClass}
                          disabled={disabled}
                          value={form.companyName}
                          onChange={e => setForm({ ...form, companyName: e.target.value })}
                          placeholder="Nazwa firmy"
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>NIP</span>
                        <input
                          className={inputClass}
                          disabled={disabled}
                          value={form.nip}
                          onChange={e => setForm({ ...form, nip: e.target.value })}
                          placeholder="NIP"
                        />
                      </label>
                    </>
                  )}
                </div>
                <button
                  onClick={saveData}
                  disabled={disabled || saving}
                  className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Zapisz dane
                </button>
              </section>

              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Krok 2: Dokumenty</h2>
                <p className="text-sm text-amber-700 mb-3">
                  Po wybraniu plików kliknij <strong>Zapisz pliki</strong> — sam wybór w polu nie wysyła ich na serwer.
                  Duże zdjęcia z telefonu są automatycznie zmniejszane przed wysłaniem (każdy plik osobno).
                </p>

                <ul className="mb-4 space-y-1 text-sm">
                  {["idFront", "idBack", "selfie", ...(form.type === "company" ? ["companyDoc"] : [])].map(key => {
                    const ok = !!savedDocs[`${key}Url`];
                    return (
                      <li key={key} className={ok ? "text-emerald-700" : "text-gray-500"}>
                        {ok ? "✓" : "○"} {DOC_LABELS[key]}
                        {ok ? <span className="text-gray-400 ml-1">— zapisany</span> : null}
                      </li>
                    );
                  })}
                </ul>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className={labelClass}>Dowód – przód (jpg/png/pdf)</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      disabled={disabled}
                      className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:font-medium file:cursor-pointer"
                      onChange={e => setFiles({ ...files, idFront: e.target.files?.[0] || null })}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Dowód – tył</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      disabled={disabled}
                      className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:font-medium file:cursor-pointer"
                      onChange={e => setFiles({ ...files, idBack: e.target.files?.[0] || null })}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Selfie z dokumentem</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      disabled={disabled}
                      className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:font-medium file:cursor-pointer"
                      onChange={e => setFiles({ ...files, selfie: e.target.files?.[0] || null })}
                    />
                  </label>
                  {form.type === "company" && (
                    <label className="block">
                      <span className={labelClass}>Dokument firmy (KRS/CEIDG)</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        disabled={disabled}
                        className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:font-medium file:cursor-pointer"
                        onChange={e => setFiles({ ...files, companyDoc: e.target.files?.[0] || null })}
                      />
                    </label>
                  )}
                </div>
                <button
                  onClick={uploadDocs}
                  disabled={disabled || saving || !hasPendingLocalFiles}
                  className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Zapisz pliki
                </button>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Krok 3: Wyślij do weryfikacji</h2>
                <button
                  onClick={submit}
                  disabled={disabled || saving || !docsReady}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Wysyłanie…" : "Wyślij wniosek"}
                </button>
                {!docsReady && !disabled && (
                  <p className="mt-2 text-sm text-gray-500">
                    Najpierw zapisz wszystkie wymagane dokumenty w kroku 2.
                  </p>
                )}
              </section>
            </>
          )}

          {message && showForm && (
            <p
              className={`mt-6 text-sm ${
                messageType === "error"
                  ? "text-rose-700"
                  : messageType === "success"
                    ? "text-emerald-700"
                    : "text-gray-700"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
