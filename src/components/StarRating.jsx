import { useId } from "react";

export default function StarRating({
  value = 0,
  size = 16,
  showValue = true,
  valueClassName = "text-xs text-gray-500 ml-1",
}) {
  const numericValue = Number(value) || 0;
  const uid = useId();

  // Zaokrąglij do najbliższego kroku co 0.5 (żeby 4.5 pokazało 4.0 i pół 5-tej)
  const ratingHalf = Math.min(5, Math.max(0, Math.round(numericValue * 2) / 2));
  const stars = Array.from({ length: 5 }).map((_, i) => i + 1);

  const starPath = "M10 15.27 15.18 18l-1.64-5.03L18 9.24l-5.19-.03L10 4 7.19 9.21 2 9.24l4.46 3.73L4.82 18z";

  return (
    <div className="inline-flex items-center gap-1" aria-label={`Ocena ${numericValue}`}>
      {stars.map((s) => {
        const fillPercent =
          ratingHalf >= s ? 100 : ratingHalf >= s - 0.5 ? 50 : 0;

        return (
          <span
            key={`${uid}-${s}`}
            style={{ position: "relative", width: size, height: size, display: "inline-block" }}
          >
            <svg width={size} height={size} viewBox="0 0 20 20" className="fill-gray-300" style={{ display: "block" }}>
              <path d={starPath} />
            </svg>

            {fillPercent > 0 && (
              <span style={{ position: "absolute", inset: 0, overflow: "hidden", width: `${fillPercent}%` }}>
                <svg width={size} height={size} viewBox="0 0 20 20" className="fill-yellow-400" style={{ display: "block" }}>
                  <path d={starPath} />
                </svg>
              </span>
            )}
          </span>
        );
      })}

      {showValue && <span className={valueClassName}>{ratingHalf.toFixed(1)}</span>}
    </div>
  );
}