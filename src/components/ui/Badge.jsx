export default function Badge({ color = "indigo", icon: Icon, children }) {
  const map = {
    indigo: "badge-indigo",
    purple: "badge-purple",
    outline: "badge-outline",
  };
  return (
    <span className={map[color] ?? "badge"}>
      {Icon ? <Icon /> : null}
      {children}
    </span>
  );
}



























