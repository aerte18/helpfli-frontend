/**
 * Baner promo z opcjonalnym WebP + fallback PNG.
 */
export default function PromoPicture({
  pngSrc,
  webpSrc,
  alt,
  width,
  height,
  className,
  loading = "lazy",
  fetchPriority,
}) {
  const resolvedWebpSrc =
    webpSrc === undefined
      ? pngSrc.replace(/\.png(\?.*)?$/i, (_, q) => `.webp${q || ""}`)
      : webpSrc;

  return (
    <picture>
      {resolvedWebpSrc ? <source srcSet={resolvedWebpSrc} type="image/webp" /> : null}
      <img
        src={pngSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
      />
    </picture>
  );
}
