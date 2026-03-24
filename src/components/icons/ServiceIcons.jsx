// Zestaw ikon Helpfli (SVG) dla popularnych usług

// 1. Hydraulik – kran z kroplą
export const FaucetIcon = ({ className = "w-6 h-6 text-indigo-500" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 10h12v4H6v-4zM12 4v6M9 18a3 3 0 006 0c0-1.5-3-4-3-4s-3 2.5-3 4z" />
  </svg>
);

// 2. Elektryk – gniazdko
export const SocketIcon = ({ className = "w-6 h-6 text-indigo-500" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2"/>
    <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
  </svg>
);

// 3. AGD – pralka
export const WashingMachineIcon = ({ className = "w-6 h-6 text-indigo-500" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
    <circle cx="12" cy="13" r="5" strokeWidth="2"/>
    <circle cx="8" cy="7" r="1" fill="currentColor"/>
    <circle cx="12" cy="7" r="1" fill="currentColor"/>
  </svg>
);

// 4. Sprzątanie – szczotka/miotła
export const BroomIcon = ({ className = "w-6 h-6 text-indigo-500" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
    <path d="M4 20h16M10 4l4 12M8 10l2 6M14 10l-2 6" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 5. Montaż mebli – młotek
export const HammerIcon = ({ className = "w-6 h-6 text-indigo-500" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
    <path d="M2 21l6-6m0 0l3 3 7-7-3-3-7 7zM13 5l2-2 4 4-2 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 6. Mini naprawy – złota rączka (narzędzia)
export const ToolboxIcon = ({ className = "w-6 h-6 text-indigo-500" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
    <rect x="3" y="7" width="18" height="13" rx="2" strokeWidth="2"/>
    <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2"/>
    <path d="M3 13h18" strokeWidth="2"/>
  </svg>
);

// 7. Malowanie – pędzel
export const PaintBrushIcon = ({ className = "w-6 h-6 text-indigo-500" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
    <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 8. Remont – młotek i śrubokręt
export const RenovationIcon = ({ className = "w-6 h-6 text-indigo-500" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
    <path d="M2 21l6-6m0 0l3 3 7-7-3-3-7 7zM13 5l2-2 4 4-2 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2"/>
  </svg>
);

// 9. Ogród – roślina
export const GardenIcon = ({ className = "w-6 h-6 text-indigo-500" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
    <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 10. Transport – samochód
export const TransportIcon = ({ className = "w-6 h-6 text-indigo-500" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
    <path d="M1 3h15l4 7v8a2 2 0 01-2 2H3a2 2 0 01-2-2v-8l4-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 21a2 2 0 100-4 2 2 0 000 4z" strokeWidth="2"/>
    <path d="M19 21a2 2 0 100-4 2 2 0 000 4z" strokeWidth="2"/>
  </svg>
);
