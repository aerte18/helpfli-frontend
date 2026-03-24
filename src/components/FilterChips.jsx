import { useState } from 'react';
import { 
  FaucetIcon, 
  SocketIcon, 
  WashingMachineIcon, 
  BroomIcon, 
  HammerIcon, 
  ToolboxIcon,
  PaintBrushIcon,
  RenovationIcon,
  GardenIcon,
  TransportIcon
} from './icons/ServiceIcons';

export default function FilterChips({ 
  activeFilters = [],
  onRemoveFilter,
  onClearAll,
  onOpenAdvancedFilters,
  onAddFilter
}) {
  const serviceChips = [
    { name: 'Hydraulik', icon: FaucetIcon },
    { name: 'Elektryk', icon: SocketIcon },
    { name: 'AGD', icon: WashingMachineIcon },
    { name: 'Sprzątanie', icon: BroomIcon },
    { name: 'Montaż mebli', icon: HammerIcon },
    { name: 'Złota rączka', icon: ToolboxIcon },
    { name: 'Malowanie', icon: PaintBrushIcon },
    { name: 'Remont', icon: RenovationIcon },
    { name: 'Ogród', icon: GardenIcon },
    { name: 'Transport', icon: TransportIcon }
  ];

  // Gradienty dla ikon - podobne do strony startowej
  const gradients = [
    "from-purple-500 to-pink-500",      // Hydraulik
    "from-blue-500 to-cyan-500",        // Elektryk
    "from-green-500 to-emerald-600",    // AGD
    "from-orange-500 to-red-500",       // Sprzątanie
    "from-indigo-500 to-purple-600",    // Montaż mebli
    "from-teal-500 to-blue-600",        // Złota rączka
    "from-pink-500 to-rose-500",        // Malowanie
    "from-amber-500 to-orange-500",     // Remont
    "from-green-400 to-green-600",      // Ogród
    "from-gray-500 to-gray-700"         // Transport
  ];

  if (activeFilters.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-3">
      <div className="flex items-center gap-2 flex-wrap">
              {activeFilters.map((filter, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                >
                  <span>{filter}</span>
                  <button
                    onClick={() => onRemoveFilter(filter)}
                    className="ml-1 text-indigo-500 hover:text-indigo-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
      </div>
    </div>
  );
}
