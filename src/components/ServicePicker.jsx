import useServices from "../hooks/useServices";

export default function ServicePicker({ value, onChange, className = "" }) {
  const { services, loading } = useServices();

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value || null)}
      className={
        "rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring " +
        className
      }
    >
      <option value="">{loading ? "Ładowanie…" : "Wybierz usługę"}</option>
      {services.map((s) => (
        <option key={s._id || s.id} value={s._id || s.id}>
          {s.name_pl || s.name_en || s.name}
        </option>
      ))}
    </select>
  );
}