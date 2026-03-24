export default function AIRobotIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {/* Robot body - white rounded rectangle */}
      <rect x="6" y="8" width="12" height="10" rx="2" fill="white" stroke="currentColor" strokeWidth="1"/>
      
      {/* Robot eyes - bright blue ovals */}
      <ellipse cx="9" cy="12" rx="1.5" ry="1" fill="#3B82F6"/>
      <ellipse cx="15" cy="12" rx="1.5" ry="1" fill="#3B82F6"/>
      
      {/* Robot mouth - dark grey horizontal line */}
      <line x1="9" y1="15" x2="15" y2="15" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/>
      
      {/* Robot antenna - red rods with yellow spheres */}
      <line x1="8" y1="8" x2="6" y2="4" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="8" x2="18" y2="4" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
      
      {/* Yellow spheres on antenna */}
      <circle cx="6" cy="4" r="1" fill="#FCD34D"/>
      <circle cx="18" cy="4" r="1" fill="#FCD34D"/>
      
      {/* Yellow element on top of head */}
      <rect x="10" y="6" width="4" height="2" rx="1" fill="#FCD34D"/>
    </svg>
  );
}
