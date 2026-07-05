import { useState } from "react";
import useSocket from "../hooks/useSocket";
import ModalDialog from "./ui/ModalDialog";

export default function ExpressModal({ open, onClose, authToken, selfUser, center }) {
  const sockRef = useSocket(authToken);
  const [details, setDetails] = useState("");
  const [budget, setBudget] = useState(150);
  const [eta, setEta] = useState(30);

  const request = () => {
    const s = sockRef.current;
    if (!s) return;
    const payload = {
      service: "Hydraulik",
      details,
      budget,
      eta,
      location: { lat: center?.[0], lng: center?.[1], radiusKm: 5 },
    };
    s.emit("express:request", payload, (ack) => {
      console.log("Express requested:", ack);
      onClose();
    });
  };

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      titleId="express-modal-title"
      overlayClassName="fixed inset-0 z-50 bg-black/20 flex items-end sm:items-center justify-center p-4"
      panelClassName="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl"
    >
      <h3 id="express-modal-title" className="text-lg font-semibold">
        Express – potrzebuję kogoś TERAZ
      </h3>
      <div className="mt-3 space-y-3">
        <textarea
          className="input w-full h-24"
          placeholder="Krótko opisz problem…"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="express-budget" className="text-sm text-slate-600">
              Budżet (zł)
            </label>
            <input
              id="express-budget"
              className="input w-full"
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(+e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="express-eta" className="text-sm text-slate-600">
              Czas (minuty)
            </label>
            <input
              id="express-eta"
              className="input w-full"
              type="number"
              min={5}
              step={5}
              value={eta}
              onChange={(e) => setEta(+e.target.value)}
            />
          </div>
        </div>
        <button type="button" className="btn-primary w-full" onClick={request}>
          Wyślij zgłoszenie Express
        </button>
      </div>
    </ModalDialog>
  );
}
