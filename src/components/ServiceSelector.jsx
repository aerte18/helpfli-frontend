import { useState, useEffect } from 'react';

export default function ServiceSelector({ value, onChange, label, includeAll = true }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const token = localStorage.getItem('token');
        const API = import.meta.env.VITE_API_URL || "";
        const res = await fetch(`${API}/api/services`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          console.log('ServiceSelector API response:', result);
          const servicesData = result.items || result || [];
          console.log('ServiceSelector services data:', servicesData);
          setServices(servicesData);
        }
      } catch (error) {
        console.error('Błąd pobierania usług:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
        <div className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
          <span className="text-slate-500">Ładowanie usług...</span>
        </div>
      </div>
    );
  }

  const options = [
    ...(includeAll ? [{ label: "Wszystkie", value: "any" }] : []),
    ...(Array.isArray(services) ? services.map(service => ({
      label: service.name_pl || service.name_en || service.name,
      value: service.name_pl || service.name_en || service.name
    })) : [])
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}




