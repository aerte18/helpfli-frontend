export default function SmartFilters({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });

  const Chip = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-sm
        ${active ? "bg-sky-600 text-white border-sky-600" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}
    >
      {children}
    </button>
  );

  return (
    <div className="sticky top-[52px] z-30 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl px-3 sm:px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Poziom:</span>
          <Chip active={value.level === "basic"} onClick={() => set({ level: value.level==="basic"?"all":"basic" })}>Basic</Chip>
          <Chip active={value.level === "standard"} onClick={() => set({ level: value.level==="standard"?"all":"standard" })}>Standard</Chip>
          <Chip active={value.level === "pro"} onClick={() => set({ level: value.level==="pro"?"all":"pro" })}>TOP</Chip>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Ocena:</span>
          <Chip active={value.rating === 4} onClick={() => set({ rating: value.rating===4?0:4 })}>4★+</Chip>
          <Chip active={value.rating === 4.5} onClick={() => set({ rating: value.rating===4.5?0:4.5 })}>4.5★+</Chip>
        </div>

        <select className="input" value={value.eta} onChange={(e)=>set({eta:e.target.value})}>
          <option value="any">Dowolny termin</option>
          <option value="20m">&lt; 20 min</option>
          <option value="today">Dzisiaj</option>
          <option value="tomorrow">Jutro</option>
        </select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Budżet</span>
          <input type="number" className="w-20 input" min={0} value={value.budgetMin}
                 onChange={(e)=>set({budgetMin:+e.target.value})}/>
          <span className="text-slate-400">—</span>
          <input type="number" className="w-20 input" min={0} value={value.budgetMax}
                 onChange={(e)=>set({budgetMax:+e.target.value})}/>
          <span className="text-xs text-slate-500">zł</span>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={value.b2b} onChange={(e)=>set({b2b:e.target.checked})}/>
          <span>Firma</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={value.availableNow} onChange={(e)=>set({availableNow:e.target.checked})}/>
          <span>Dostępny teraz</span>
        </label>

        <div className="ml-auto flex gap-2">
          <select className="input" value={value.sort} onChange={(e)=>set({sort:e.target.value})}>
            <option value="quality">Najlepsza jakość</option>
            <option value="price">Najniższa cena</option>
            <option value="eta">Najszybszy</option>
            <option value="rating">Najwyżej oceniani</option>
          </select>
          <button className="btn-secondary" onClick={() => onChange({
            level:"all", rating:0, sort:"quality", budgetMin:0, budgetMax:1000, eta:"any", b2b:false, availableNow:false
          })}>Wyczyść</button>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Sugestie cen (wg poziomu): <b>Basic 80–120</b>, <b>Standard 120–180</b>, <b>TOP 180–300</b> zł.
      </p>
    </div>
  );
}
