import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useRef, useState } from "react";
import { ensureNotifyPermission, notify } from "../../utils/notify";

const GW = import.meta.env.VITE_GATEWAY_AI_BASE || "";
const USE_STREAM = true; // Enable streaming

export default function useAIConcierge() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('modal'); // modal|dock|inline
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Cześć! 👋 Opisz problem – podam kroki DIY i/lub znajdę fachowca.', ts: Date.now() }
  ]);

  const [draft, setDraft] = useState(null); // { id, diySteps[], dangerFlags[], parts[], ... }
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [typing, setTyping] = useState(false);
  const tokenRef = useRef(null);

  useEffect(() => {
    tokenRef.current = localStorage.getItem('token');
    ensureNotifyPermission();
  }, []);

  const append = (m) => setMessages(prev => [...prev, { ...m, ts: Date.now() }]);

  async function analyze(description, language) {
    console.log('AI Chat: Attempting to analyze:', { description, language, API, token: tokenRef.current ? 'exists' : 'missing' });
    setIsThinking(true);
    try {
      // Prefer Gateway AI if configured; fall back to legacy backend endpoint
      const target = GW ? `${GW}/ai/concierge` : apiUrl("/api/ai/concierge");
      const body = GW ? { message: description, history: messages.map(m=>({role:m.role, content:m.text})), riskHigh: /gaz|prąd|wyciek/i.test(description) } : { problemText: description, language };
      const res = await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify(body)
      });
      console.log('AI Chat: Response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.log('AI Chat: Error response:', errorText);
        throw new Error('Analyze failed');
      }
      const data = await res.json();
      console.log('AI Chat: Received data:', data);
      
      // Mapuj odpowiedź z backendu do formatu frontendu
      // Map legacy or gateway output to unified draft
      const payload = data.payload || data;
      const advice = payload.advice || {};
      const diySteps = advice.diy_steps || [];
      const dangerFlags = advice.risk_level === 'high' ? ['electricity', 'gas'] : [];
      
      setDraft({
        id: data.draftId || `draft_${Date.now()}`, // Generuj ID jeśli nie ma
        diySteps: diySteps.map(t => ({ text: t, done: false })),
        dangerFlags: dangerFlags,
        parts: payload.parts || [],
        serviceCandidate: payload.query?.service || null,
        priceHints: payload.priceHints || null,
        recommendedProviders: payload.recommendedProviders || []
      });
      return payload;
    } finally {
      setIsThinking(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text) return;
    
    // Sprawdź czy użytkownik jest zalogowany
    if (!tokenRef.current) {
      append({ role: 'assistant', text: 'Musisz być zalogowany, aby używać Asystenta AI. Zaloguj się i spróbuj ponownie.' });
      return;
    }
    
    const userMsg = { role: 'user', text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    if (!USE_STREAM) {
      return await legacySend(text);
    }

    // Streaming mode
    try {
      const risky = /(gaz|wyciek|zapach gazu|porażenie|iskr|dym|zalanie)/i.test(text);
      setTyping(true);

      const url = new URL(`${GW}/ai/stream`);
      url.searchParams.set('q', text);
      const evtSource = new EventSource(url.toString(), { withCredentials: false });

      // Add empty assistant message for streaming
      const idx = messages.length + 1;
      setMessages(prev => [...prev, { role: 'assistant', text: '', ts: Date.now() }]);

      evtSource.addEventListener('token', (e) => {
        const { chunk } = JSON.parse(e.data);
        setMessages(prev => {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], text: (copy[idx].text || '') + chunk };
          return copy;
        });
      });

      evtSource.addEventListener('done', () => {
        setTyping(false);
        evtSource.close();
        
        // Check if we got providers and notify
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.text?.includes('wykonawc') || lastMessage?.text?.includes('fachowc')) {
          notify('Znaleziono wykonawców w Twojej okolicy', { 
            body: 'Kliknij, aby zobaczyć listę' 
          });
        }
      });

      evtSource.addEventListener('error', () => {
        setTyping(false);
        evtSource.close();
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: 'Ups, coś poszło nie tak. Spróbuj ponownie.', 
          ts: Date.now() 
        }]);
      });
    } catch (e) {
      setTyping(false);
      append({ role: 'assistant', text: 'Ups, nie udało się zainicjować strumienia.' });
    }
  }

  // Fallback: legacy mode
  async function legacySend(text) {
    try {
      // 1) pierwsza wiadomość -> analyze (tworzy draft)
      if (!draft?.id) {
        const lang = navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'pl';
        const data = await analyze(text, lang);

        // safety-gate
        if ((data.advice?.risk_level === 'high')) {
          append({ role: 'assistant', text: '⚠️ Uwaga! To może być niebezpieczne. Najpierw sprawdź bezpieczeństwo przed dalszymi krokami.' });
        }

        // Stwórz bardziej naturalną odpowiedź
        const steps = data.advice?.diy_steps || [];
        const parts = data.parts || [];
        
        let response = `Rozumiem Twój problem! `;
        
        if (steps.length > 0) {
          response += `Oto co możesz zrobić:\n\n`;
          steps.forEach((step, i) => {
            response += `${i + 1}. ${step}\n`;
          });
        }
        
        if (parts.length > 0) {
          response += `\nMożesz potrzebować:\n`;
          parts.forEach(part => {
            response += `• ${part.name} (${part.approxPrice ?? '?'} ${part.unit || 'PLN'})\n`;
          });
        }
        
        response += `\nJeśli potrzebujesz pomocy fachowca, mogę od razu utworzyć zlecenie i znaleźć wykonawców w Twojej okolicy. Chcesz spróbować sam czy wolisz od razu wezwać specjalistę?`;
        
        append({ role: 'assistant', text: response });
        return;
      }

      // 2) kolejne wiadomości – zwykła asysta tekstowa
      append({ role: 'assistant', text: 'Zapisane. Możesz dodać zdjęcia lub kliknąć „Wyślij zlecenie".' });

    } catch (e) {
      append({ role: 'assistant', text: 'Ups, coś poszło nie tak. Spróbuj ponownie.' });
    }
  }

  async function toggleStep(i, done) {
    if (!draft?.id) return;
    await fetch(apiUrl(`/api/ai/drafts/${draft.id}/steps`), {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ index: i, done })
    });
    setDraft(d => ({ ...d, diySteps: d.diySteps.map((s, idx) => idx === i ? { ...s, done } : s) }));
  }

  async function upload(files) {
    if (!draft?.id || !files?.length) return;
    setUploading(true);
    const fd = new FormData();
    [...files].slice(0, 5).forEach(f => fd.append('files', f));
    
    const r = await fetch(apiUrl(`/api/ai/drafts/${draft.id}/attachments`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRef.current}` },
      body: fd
    });
    setUploading(false);
    if (!r.ok) { append({ role:'assistant', text:'Nie udało się dodać załączników.' }); return; }
    const data = await r.json();
    setDraft(d => ({
      ...d,
      diySteps: data.diySteps || d.diySteps,
      dangerFlags: data.dangerFlags || d.dangerFlags,
      parts: data.parts || d.parts,
      serviceCandidate: data.serviceCandidate || d.serviceCandidate,
      priceHints: data.priceHints || d.priceHints,
      recommendedProviders: data.recommendedProviders || d.recommendedProviders
    }));
    append({ role:'assistant', text:'Dodałem załączniki i zaktualizowałem diagnozę.' });
  }

  async function submitOrder() {
    if (!draft?.id) return;
    const res = await fetch(apiUrl(`/api/ai/drafts/${draft.id}/submit`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRef.current}` }
    });
    if (!res.ok) { append({ role:'assistant', text:'Nie udało się utworzyć zlecenia.' }); return; }
    const data = await res.json();
    append({ role:'assistant', text:'Utworzyłem zlecenie i zaprosiłem wykonawców. Przechodzę do czatu…' });

    // prefill czatu (jeśli masz endpoint)
    try {
      await fetch(apiUrl(`/api/chat/${data.orderId}/messages/prefill`), {
        method:'POST', headers:{ Authorization:`Bearer ${tokenRef.current}` }
      });
    } catch {}

    // przekierowanie
    window.location.href = `/orders/${data.orderId}`;
  }

  function resetSession() {
    setMessages([{ role:'assistant', text: 'Cześć! 👋 Opisz problem – podam kroki DIY i/lub znajdę fachowca.' }]);
    setDraft(null);
  }

  return {
    open, setOpen, mode, setMode,
    messages, input, setInput,
    draft, uploading, isThinking, typing,
    send, upload, toggleStep, submitOrder, resetSession
  };
}

