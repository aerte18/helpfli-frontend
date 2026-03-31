import React, { useState } from "react";
import Footer from "../components/Footer";
import PageBackground, { GlassCard } from "../components/PageBackground";
import { apiUrl } from "@/lib/apiUrl";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setStatus({ type: "", message: "" });
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Nie udało się wysłać wiadomości.");
      }
      setStatus({ type: "success", message: "Wiadomość została wysłana." });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus({
        type: "error",
        message: err?.message || "Wystąpił błąd podczas wysyłki wiadomości.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageBackground className="py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <GlassCard className="p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-slate-900">
            Kontakt z <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#EC4899]">Helpfli</span>
          </h1>
          <p className="text-slate-600">Skontaktuj się z nami - chętnie odpowiemy na Twoje pytania</p>
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Informacje kontaktowe */}
          <GlassCard className="p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-slate-900">Informacje kontaktowe</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-slate-700 mb-1">Email</h3>
                <p className="text-indigo-600 font-medium">helpfli@outlook.com</p>
              </div>
              <div>
                <h3 className="font-medium text-slate-700 mb-1">Godziny pracy</h3>
                <p className="text-slate-600">
                  Poniedziałek - Piątek: 9:00 - 18:00<br />
                  Sobota: 10:00 - 14:00<br />
                  Niedziela: Zamknięte
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Formularz kontaktowy */}
          <GlassCard className="p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-slate-900">Wyślij wiadomość</h2>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Imię i nazwisko
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900"
                  required
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Temat
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={form.subject}
                  onChange={onChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900"
                  required
                >
                  <option value="">Wybierz temat</option>
                  <option value="general">Pytanie ogólne</option>
                  <option value="technical">Problem techniczny</option>
                  <option value="billing">Płatności i faktury</option>
                  <option value="verification">Weryfikacja konta</option>
                  <option value="complaint">Reklamacja</option>
                  <option value="partnership">Współpraca</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Wiadomość
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="4"
                  value={form.message}
                  onChange={onChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900"
                  required
                ></textarea>
              </div>
              {status.message && (
                <p
                  className={
                    status.type === "success"
                      ? "text-sm text-emerald-700"
                      : "text-sm text-red-700"
                  }
                >
                  {status.message}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#EC4899] py-3 px-6 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(79,70,229,0.5)] hover:shadow-[0_16px_40px_rgba(79,70,229,0.65)] transition-all"
              >
                {isSubmitting ? "Wysyłanie..." : "Wyślij wiadomość"}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* FAQ */}
        <GlassCard className="p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-slate-900">Najczęściej zadawane pytania</h2>
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Jak mogę zostać wykonawcą na Helpfli?</h3>
              <p className="text-slate-600 leading-relaxed">
                Zarejestruj się jako wykonawca, wypełnij profil i przejdź proces weryfikacji KYC. 
                Po zatwierdzeniu będziesz mógł przyjmować zlecenia od klientów.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Jak działa gwarancja Helpfli?</h3>
              <p className="text-slate-600 leading-relaxed">
                Gwarancja Helpfli chroni płatności dokonane przez nasz system. 
                W przypadku problemów z wykonaniem usługi, pomagamy w rozwiązaniu sporu.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Jak mogę anulować zlecenie?</h3>
              <p className="text-slate-600 leading-relaxed">
                Zlecenie można anulować w panelu "Moje zlecenia" przed rozpoczęciem prac. 
                Po rozpoczęciu prac anulowanie wymaga uzgodnienia z wykonawcą.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
      <Footer />
    </PageBackground>
  );
}
