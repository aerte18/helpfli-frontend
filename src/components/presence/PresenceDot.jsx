export default function PresenceDot({ online, className = "" }) {
  return (
    <span className={`h-3 w-3 rounded-full ring-2 ring-white ${online ? "bg-emerald-400" : "bg-slate-300"} ${className}`} />
  );
}
