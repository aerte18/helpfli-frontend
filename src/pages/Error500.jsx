import React from "react";
import { Link } from "react-router-dom";

export default function Error500() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Ups!</h1>
      <p className="text-gray-600 mb-6">Wystąpił błąd serwera. Spróbuj ponownie później.</p>
      <Link to="/" className="px-4 py-2 rounded bg-indigo-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
        Wróć do strony głównej
      </Link>
    </div>
  );
}















