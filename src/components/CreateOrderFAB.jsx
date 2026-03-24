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
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-5 py-3.5 rounded-full shadow-2xl
                 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105 transition-transform duration-200"
      aria-label="Utwórz zlecenie"
      title="Utwórz zlecenie"
    >
      <Plus className="w-5 h-5" />
      <span className="hidden sm:inline font-semibold">Utwórz zlecenie</span>
    </button>
  );
}