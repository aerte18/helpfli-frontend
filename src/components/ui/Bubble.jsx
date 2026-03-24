// src/components/ui/Bubble.jsx
import React from 'react';
import clsx from 'clsx';

export default function Bubble({ children, className = "" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 shadow-sm border border-gray-200 bg-white",
        className
      )}
    >
      {children}
    </span>
  );
}

