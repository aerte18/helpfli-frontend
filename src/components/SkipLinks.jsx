import React from 'react';

export default function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-4 left-4 bg-indigo-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Przejdź do głównej treści
      </a>
      
      <a
        href="#navigation"
        className="absolute top-4 left-32 bg-indigo-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('navigation')?.focus();
        }}
      >
        Przejdź do nawigacji
      </a>
    </div>
  );
}












