import { Plus } from "lucide-react";

export default function CreateOrderFAB({ onOpenAITriage }) {
  if (!onOpenAITriage) {
    console.warn('CreateOrderFAB: brak handlera onOpenAITriage');
    return null;
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpenAITriage();
      }}
      className="fixed z-[50] inline-flex items-center gap-2 rounded-full shadow-2xl
                 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-3 px-3 py-2.5 text-sm
                 md:bottom-6 md:right-6 md:px-5 md:py-3.5 md:text-base
                 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105 transition-transform duration-200"
      aria-label="Utwórz zlecenie"
      title="Utwórz zlecenie"
    >
      <Plus className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
      <span className="hidden sm:inline font-semibold">Utwórz zlecenie</span>
    </button>
  );
}