export default function AvailabilityBadge({ isOnline, lastSeenAt }) {
  const map = {
    online:  { dot: "bg-green-500", label: "Online" },
    offline: { dot: "bg-gray-400",  label: "Offline" },
  };
  
  // Określ status na podstawie isOnline lub lastSeenAt
  let status = "offline";
  if (isOnline === true) {
    status = "online";
  } else if (isOnline === false) {
    status = "offline";
  } else if (lastSeenAt) {
    // Jeśli nie ma isOnline, sprawdź lastSeenAt (ostatnio widziany w ciągu 5 minut = online)
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    status = diffMinutes <= 5 ? "online" : "offline";
  }
  
  const d = map[status];

  const lastSeenTxt = lastSeenAt && status === "offline"
    ? new Date(lastSeenAt).toLocaleDateString()
    : null;

  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <span className={`inline-block w-2 h-2 rounded-full ${d.dot}`} />
      <span>{d.label}</span>
      {lastSeenTxt && <span className="text-gray-400">({lastSeenTxt})</span>}
    </span>
  );
}
