// src/components/ui/Button.jsx
import React from 'react';
import clsx from 'clsx';

const base =
  "inline-flex items-center justify-center px-4 py-2 rounded-xl transition focus:outline-none focus:ring disabled:opacity-50";
const variants = {
  primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
  secondary: "bg-white border border-gray-200 hover:bg-gray-50 text-gray-900",
  ghost: "hover:bg-gray-50 text-gray-700",
};
const sizes = {
  sm: "text-sm px-3 py-1.5",
  md: "",
  lg: "text-base px-5 py-3",
};

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className,
  ...props
}) {
  return (
    <Comp
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

