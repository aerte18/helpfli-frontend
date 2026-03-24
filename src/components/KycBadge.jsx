export default function KycBadge({ status }) {
  const map = {
    not_started: { label: 'KYC: nie rozpoczęto', cls: 'bg-gray-200 text-gray-700' },
    in_progress: { label: 'KYC: w trakcie', cls: 'bg-amber-100 text-amber-700' },
    submitted:   { label: 'KYC: wysłane', cls: 'bg-blue-100 text-blue-700' },
    verified:    { label: 'KYC: zweryfikowano', cls: 'bg-emerald-100 text-emerald-700' },
    rejected:    { label: 'KYC: odrzucono', cls: 'bg-rose-100 text-rose-700' },
  };
  const cfg = map[status] || map.not_started;
  return <span className={`px-2 py-1 text-sm rounded ${cfg.cls}`}>{cfg.label}</span>;
}






















