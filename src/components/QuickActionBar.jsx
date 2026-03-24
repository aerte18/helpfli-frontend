import { PlusCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OriginalLogoIcon from "./icons/OriginalLogoIcon";

export default function QuickActionBar({ onOpenAI }) {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 mt-3">
      <div className="qs-card-soft p-5 flex flex-col sm:flex-row items-center gap-4 justify-between border border-white/60">
        <div className="text-sm text-[var(--qs-color-muted)]">
          Nie wiesz, kogo wybrać? Stwórz zlecenie, a wykonawcy sami odpowiedzą — albo poproś AI o pomoc.
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate("/create-order")}
            className="qs-btn qs-btn-primary text-sm !px-5 !py-2.5 gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Utwórz zlecenie
          </button>
          <button
            onClick={() => navigate("/concierge")}
            className="qs-btn qs-btn-dark text-sm !px-5 !py-2.5 gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Asystent AI
          </button>
          <button
            onClick={onOpenAI || (() => navigate("/concierge"))}
            className="qs-btn qs-btn-outline text-sm !px-5 !py-2.5 gap-2"
          >
            <OriginalLogoIcon className="w-5 h-5" withBackground={true} />
            Pomoc AI
          </button>
        </div>
      </div>
    </div>
  );
}