// src/components/ProviderFilters.jsx
import React, { useState } from 'react';

const ProviderFilters = ({ filters, setFilters }) => {
  const handleLevelChange = (e) => {
    setFilters({ ...filters, level: e.target.value });
  };

  const handleMinPriceChange = (e) => {
    setFilters({ ...filters, minPrice: e.target.value });
  };

  const handleMaxPriceChange = (e) => {
    setFilters({ ...filters, maxPrice: e.target.value });
  };

  const handleAvailabilityChange = (e) => {
    setFilters({ ...filters, availability: e.target.value });
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow mb-4">
      <h2 className="text-lg font-semibold mb-2">Filtruj wykonawców</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium">Poziom usługi</label>
        <select
          value={filters.level}
          onChange={handleLevelChange}
          className="mt-1 block w-full border rounded p-2"
        >
          <option value="">Wszyscy</option>
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
          <option value="pro">TOP</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium">Zakres ceny</label>
        <div className="flex gap-2 mt-1">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={handleMinPriceChange}
            className="w-full border rounded p-2"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={handleMaxPriceChange}
            className="w-full border rounded p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Dostępność</label>
        <select
          value={filters.availability}
          onChange={handleAvailabilityChange}
          className="mt-1 block w-full border rounded p-2"
        >
          <option value="">Wszyscy</option>
          <option value="now">Dostępny teraz</option>
          <option value="today">Wolny dzisiaj</option>
        </select>
      </div>
    </div>
  );
};

export default ProviderFilters;