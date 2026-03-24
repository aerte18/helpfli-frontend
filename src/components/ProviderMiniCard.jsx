export default function ProviderMiniCard({ provider, selected, onSelect }) {
  const levelLabel = { basic: 'Basic', standard: 'Standard', pro: 'TOP' }[provider.level] || 'Standard';
  return (
    <div className={`border rounded-xl p-3 flex items-center justify-between ${selected ? 'ring-2 ring-indigo-500' : ''}`}>
      <div>
        <div className="font-medium">{provider.name}</div>
        <div className="text-xs text-gray-600">Poziom: {levelLabel} • Ocena: {provider.rating?.toFixed?.(1) ?? provider.rating}</div>
      </div>
      <button onClick={onSelect} className={`px-3 py-1 rounded ${selected ? 'bg-gray-200' : 'bg-indigo-600 text-white'}`}>
        {selected ? 'Odznacz' : 'Wybierz'}
      </button>
    </div>
  );
}






















