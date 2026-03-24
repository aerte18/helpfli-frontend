import { useState } from "react";
import useSocket from "../hooks/useSocket";

export default function ExpressModal({ open, onClose, authToken, selfUser, center }) {
  const sockRef = useSocket(authToken);
  const [details, setDetails] = useState("");
  const [budget, setBudget] = useState(150);
  const [eta, setEta] = useState(30); // min

  const request = () => {
    const s = sockRef.current;
    if (!s) return;
    const payload = {
      service: "Hydraulik", // TODO: pobierz z kontekstu
      details, budget, eta,
      // obszar poszukiwań:
      location: { lat: center?.[0], lng: center?.[1], radiusKm: 5 }
    };
    s.emit("express:request", payload, (ack) => {
      // ack.id – identyfikator zgłoszenia
      console.log("Express requested:", ack);
      onClose();
    });
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl" onClick={(e)=>e.stopPropagation()}>
        <h3 className="text-lg font-semibold">Express – potrzebuję kogoś TERAZ</h3>
        <div className="mt-3 space-y-3">
          <textarea className="input w-full h-24" placeholder="Krótko opisz problem…" value={details} onChange={(e)=>setDetails(e.target.value)} />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm text-slate-600">Budżet (zł)</label>
              <input className="input w-full" type="number" min={0} value={budget} onChange={(e)=>setBudget(+e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-sm text-slate-600">Czas (minuty)</label>
              <input className="input w-full" type="number" min={5} step={5} value={eta} onChange={(e)=>setEta(+e.target.value)} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Anuluj</button>
          <button className="btn-primary" onClick={request}>Wyślij Express</button>
        </div>
      </div>
    </div>
  );
}