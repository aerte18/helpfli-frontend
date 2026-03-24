export default function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
      {children}
    </span>
  );
}
