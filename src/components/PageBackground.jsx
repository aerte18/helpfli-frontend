import React from "react";

/**
 * PageBackground - Komponent tła strony z efektem gradientu
 */
export default function PageBackground({ children, className = "" }) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 ${className}`}>
      {children}
    </div>
  );
}

/**
 * GlassCard - Komponent karty z efektem szkła (glassmorphism)
 */
export function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`
        bg-white/80 backdrop-blur-md
        border border-white/20
        rounded-2xl
        shadow-lg shadow-indigo-100/50
        ${className}
      `}
    >
      {children}
    </div>
  );
}
