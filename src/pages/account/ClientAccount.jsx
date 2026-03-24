import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import BillingBenefits from "../BillingBenefits";
import Subscriptions from "../Subscriptions";

export default function ClientAccount() {
  // prosta obsługa zakładek w ramach konta klienta
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialTab = params.get("tab") || "billing";
  const [active, setActive] = useState(initialTab);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const current = p.get("tab") || "billing";
    if (current !== active) setActive(current);
  }, [location.search]);

  const switchTab = (key) => {
    setActive(key);
    const p = new URLSearchParams(location.search);
    p.set("tab", key);
    navigate(`/account?${p.toString()}`, { replace: true });
  };

  const Content = useMemo(() => {
    if (active === "subscriptions") return <Subscriptions />;
    return <BillingBenefits />;
  }, [active]);
  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4">
        {/* Sidebar */}
        <aside className="bg-white rounded-2xl shadow">
          <div className="p-4 text-lg font-semibold">Helpfli</div>
          <nav className="px-2 pb-2">
            <SideItem active>Historia</SideItem>
            <SideItem>Ulubione</SideItem>
            <SideItem>Faktury</SideItem>
            <SideItem>Wiadomości</SideItem>
            <SideItem>Adresy</SideItem>
            <SideItem>Ustawienia konta</SideItem>
            {/* Nowe pozycje jak u providerów */}
            <SideItem clickable onClick={() => switchTab("billing")} active={active==="billing"}>Opłaty i korzyści</SideItem>
            <SideItem clickable onClick={() => switchTab("subscriptions")} active={active==="subscriptions"}>Subskrypcje</SideItem>
          </nav>
        </aside>

        {/* Content */}
        <main className="space-y-4">
          {Content}

          {/* Past services */}
          <section className="bg-white rounded-2xl shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Zakończone usługi</h2>
            <div className="space-y-3">
              <PastService label="Wymiana włącznika" date="16 kw." tier="Pro" price="150 zł" status="Zakończone" />
              <PastService label="Awaryjne otwarcie drzwi" date="28 mar" tier="Pro" price="180 zł" status="Zakończone" />
              <PastService label="Uszczelnienie rury" date="10 lut" tier="Basic" price="95 zł" status="Zakończone" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SideItem({ children, active, clickable=false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`px-3 py-2 rounded-xl mb-1 ${
        active ? "bg-slate-100 font-medium" : "hover:bg-slate-50"
      } ${clickable ? "cursor-pointer" : "cursor-default"}`}
    >
      {children}
    </div>
  );
}
function TopTab({ children, active }) {
  return (
    <button
      className={`px-3 py-1.5 rounded-lg ${
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}
function Tag({ children }) {
  return <span className="px-2 py-0.5 text-xs rounded bg-slate-100">{children}</span>;
}
function RequestCard({ title, who, tags = [], right, cta }) {
  return (
    <div className="border rounded-xl p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar />
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-slate-500">Klient: {who}</div>
          <div className="flex gap-1 mt-1">
            {tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs text-slate-500 mb-1">{right}</div>
        <span className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700">{cta}</span>
      </div>
    </div>
  );
}
function PastService({ label, date, tier, price, status }) {
  return (
    <div className="border rounded-xl p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-slate-500 text-sm">{date}</div>
        <div className="font-medium">{label}</div>
        <div className="flex gap-1 ml-2">
          <Tag>{tier}</Tag>
          <Tag>{price}</Tag>
        </div>
      </div>
      <span className="px-2 py-1 text-xs rounded bg-emerald-50 text-emerald-700">{status}</span>
    </div>
  );
}
function Avatar() {
  return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300" />
  );
}