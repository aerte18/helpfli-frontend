import { createContext, useContext, useMemo, useState } from "react";

const ToastCtx = createContext(null);
export function useToast(){ return useContext(ToastCtx); }

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const remove = (id)=> setToasts(t=>t.filter(x=>x.id!==id));
  const push = ({ title, description="", variant="success", ttl=3500 })=>{
    const id = Math.random().toString(36).slice(2);
    setToasts(t=>[...t, { id, title, description, variant }]);
    setTimeout(()=>remove(id), ttl);
  };
  const value = useMemo(()=>({ push, remove }),[]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed z-[9999] top-4 right-4 flex flex-col gap-2">
        {toasts.map(t=>(
          <div key={t.id}
            className={`w-80 rounded-2xl border px-4 py-3 shadow-sm bg-white ${
              t.variant==="success" ? "border-emerald-300" :
              t.variant==="error" ? "border-rose-300" :
              "border-indigo-300"
            }`}>
            <div className="font-semibold">{t.title}</div>
            {t.description && <div className="text-sm text-gray-600 mt-0.5">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}



























