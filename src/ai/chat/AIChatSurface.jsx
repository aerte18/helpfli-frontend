import React, { useEffect, useRef, useState } from "react";
import useAIConcierge from "./useAIConcierge";
import { onAI, closeAI } from "./bus";
import Button from "@/components/ui/Button";
import ChatBubble, { TypingBubble } from "../../components/ChatBubble";
import { Sparkles, X, RotateCcw, Paperclip, Send, CheckCircle2 } from "lucide-react";

export default function AIChatSurface({ attachGlobal = true }) {
  const {
    open, setOpen, mode, setMode,
    messages, input, setInput,
    draft, uploading, isThinking, typing,
    send, upload, toggleStep, submitOrder, resetSession
  } = useAIConcierge();

  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [showFileInput, setShowFileInput] = useState(false);
  const bodyRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!attachGlobal) return;
    // pozwala otwierać chat skądkolwiek (przez bus.openAI)
    return onAI((evt) => {
      if (evt.type === 'open') {
        setMode(evt.mode || 'modal');
        setOpen(true);
        if (evt.prefill) setInput(evt.prefill);
      }
      if (evt.type === 'close') setOpen(false);
    });
  }, [attachGlobal]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, draft]);

  if (!open && mode !== 'inline') return null;

  const danger = draft?.dangerFlags || [];
  const hasElectricity = danger.includes('electricity');
  const hasGas = danger.includes('gas');
  const needSafety = (hasElectricity || hasGas) && !safetyConfirmed;

  const chrome =
    mode === 'modal' ? "fixed inset-0 z-50 grid place-items-center"
    : mode === 'dock' ? "fixed right-4 bottom-4 z-50 w-[420px]"
    : "w-full"; // inline

  const card =
    mode === 'modal' ? "w-[min(720px,92vw)] h-[min(76vh,680px)]"
    : mode === 'dock' ? "w-full h-[520px]"
    : "w-full h-[520px]";

  return (
    <div className={chrome} aria-hidden={false}>
      {mode === 'modal' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden ${card}`}>
        {/* Header - profesjonalny */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-white text-base">Asystent AI</div>
              <div className="text-xs text-white/80">Asystent Helpfli</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {draft?.id && (
              <button
                onClick={resetSession}
                className="px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1.5"
                title="Nowa rozmowa"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Nowa
              </button>
            )}
            <button
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              onClick={() => { setOpen(false); closeAI(); }}
              aria-label="Zamknij"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Body - z tłem */}
        <div 
          ref={bodyRef} 
          className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-gray-50"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,.02) 20px, rgba(0,0,0,.02) 21px)' }}
        >
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-lg font-medium text-gray-700 mb-1">Witaj w AI Concierge!</p>
                <p className="text-sm text-gray-500">Opisz swój problem, a pomogę znaleźć rozwiązanie</p>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role} text={m.text} ts={m.ts} />
          ))}

          {/* Typing indicator */}
          {typing && <TypingBubble />}

          {/* SAFETY-GATE */}
          {needSafety && (
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-amber-900 mb-2">Bezpieczeństwo przede wszystkim</div>
                  {hasElectricity && (
                    <div className="text-sm text-amber-800 mb-2">
                      ⚡ Potwierdź: <strong>Wyłączyłem prąd / bezpiecznik</strong>
                    </div>
                  )}
                  {hasGas && (
                    <div className="text-sm text-amber-800 mb-3">
                      🔥 Potwierdź: <strong>Zakręciłem gaz i wywietrzyłem pomieszczenie</strong>
                    </div>
                  )}
                  <button
                    onClick={() => setSafetyConfirmed(true)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Potwierdzam – można działać
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Kroki DIY */}
          {draft?.diySteps?.length > 0 && !needSafety && (
            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">📋</span>
                Kroki do wykonania
              </div>
              <ul className="space-y-2">
                {draft.diySteps.map((s, idx) => (
                  <label key={idx} className="flex gap-3 items-start p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={!!s.done} 
                      onChange={e=>toggleStep(idx, e.target.checked)}
                      className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className={`flex-1 text-sm leading-relaxed ${s.done ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                      {s.text}
                    </span>
                  </label>
                ))}
              </ul>
            </div>
          )}

          {/* Parts box */}
          {draft?.parts?.length > 0 && !needSafety && (
            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">🛒</span>
                Części przydatne do naprawy
              </div>
              <ul className="text-sm space-y-2">
                {draft.parts.map((p, i)=>(
                  <li key={i} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50">
                    <span className="text-gray-700">{p.name} × {p.qty}</span>
                    <span className="text-gray-600 font-medium">{p.approxPrice ?? '—'} {p.unit || ''}</span>
                  </li>
                ))}
              </ul>
              <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                💡 Kupisz w popularnych marketach (Castorama / OBI / Leroy Merlin)
              </div>
            </div>
          )}
        </div>

        {/* Footer - profesjonalny input */}
        <div className="p-4 border-t border-gray-200 bg-white space-y-3">
          {/* Upload i przycisk zlecenia */}
          {(showFileInput || draft?.id) && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer flex items-center gap-2">
                <input 
                  ref={fileInputRef}
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={(e)=>upload(e.target.files)} 
                />
                <Paperclip className="w-4 h-4" />
                <span>Dodaj zdjęcia/wideo</span>
              </label>
              {draft?.id && (
                <button
                  onClick={submitOrder}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium text-sm shadow-md hover:shadow-lg"
                >
                  Wyślij zlecenie
                </button>
              )}
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setShowFileInput(!showFileInput);
                fileInputRef.current?.click();
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
              title="Załącz plik"
            >
              <Paperclip className="w-5 h-5 text-gray-600" />
            </button>
            <textarea
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={(e)=> {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Opisz problem…"
              className="flex-1 border border-gray-300 rounded-2xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none max-h-32"
              rows={1}
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || uploading || isThinking}
              className="p-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex-shrink-0"
              title="Wyślij"
            >
              {isThinking || uploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

