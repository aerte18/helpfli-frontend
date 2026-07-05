/**
 * Baner promo z WebP + fallback PNG (mniejszy LCP na landing).
 */
export default function PromoPicture({ pngSrc, alt, width, height, className, loading = 'lazy', fetchPriority }) {
  const webpSrc = pngSrc.replace(/\.png(\?.*)?$/i, (_, q) => `.webp${q || ''}`);

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
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
