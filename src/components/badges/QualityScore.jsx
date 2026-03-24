export default function QualityScore({ value }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 text-sm">
      Quality {value}
    </div>
  );
}
