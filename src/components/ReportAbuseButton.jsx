import { apiUrl } from "@/lib/apiUrl";
import { useState, useRef } from "react";

export default function ReportAbuseButton({ reportedUserId, onReported }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + attachments.length > 5) {
      alert("Możesz dodać maksymalnie 5 załączników.");
      return;
    }
    
    // Sprawdź rozmiar plików (max 10MB każdy)
    const oversized = files.find(f => f.size > 10 * 1024 * 1024);
    if (oversized) {
      alert(`Plik "${oversized.name}" jest za duży. Maksymalny rozmiar: 10MB.`);
      return;
    }
    
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!reason.trim()) return alert("Podaj powód zgłoszenia.");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('reportedUser', reportedUserId);
      formData.append('reason', reason);
      
      attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });

      const res = await fetch(apiUrl("/api/reports"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Błąd zgłoszenia");
      setOpen(false);
      setReason("");
      setAttachments([]);
      onReported && onReported();
      alert(`Dziękujemy. Zgłoszenie zostało przyjęte${data.attachmentsCount > 0 ? ` wraz z ${data.attachmentsCount} załącznikami` : ''}.`);
    } catch (e) {
      alert(e.message || "Błąd");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-2 text-sm rounded bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-2"
        title="Zgłoś nadużycie"
      >
        Zgłoś nadużycie
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Zgłoś nadużycie</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <textarea
              className="w-full h-28 border rounded p-2 mb-3"
              placeholder="Opisz problem (np. obraźliwe wiadomości, oszustwo, SPAM)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            
            {/* Sekcja załączników */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Załączniki (opcjonalnie, max 5 plików, 10MB każdy)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.mp4,.mov,.avi"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-sm text-gray-600"
              >
                📎 Dodaj załączniki
              </button>
              
              {/* Lista załączników */}
              {attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm">📄</span>
                        <span className="text-sm text-gray-700 truncate flex-1" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="ml-2 text-red-500 hover:text-red-700 text-sm"
                        title="Usuń"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                Anuluj
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? "Wysyłanie..." : "Wyślij zgłoszenie"}
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Wielokrotne zgłoszenia mogą spowodować automatyczne zawieszenie konta do czasu
              weryfikacji przez administratora.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

