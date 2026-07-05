import { Helmet } from 'react-helmet-async';
import { absoluteUrl } from '@/utils/siteUrl';

/**
 * Unified SEO meta tags for Helpfli pages.
 * Sets title, description, canonical, robots, Open Graph and Twitter cards.
 */
export default function SEOHead({
  title,
  description,
  canonical,
  robots,
  ogTitle,
  ogDescription,
  ogUrl,
  ogImage,
  ogType = 'website',
  ogLocale = 'pl_PL',
  twitterCard = 'summary_large_image',
  children,
}) {
  const canonicalUrl = canonical ? absoluteUrl(canonical) : undefined;
  const resolvedOgUrl = ogUrl ? absoluteUrl(ogUrl) : canonicalUrl;
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;
  const resolvedOgImage = ogImage ? absoluteUrl(ogImage) : undefined;

  return (
    <Helmet>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {robots && <meta name="robots" content={robots} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {resolvedOgTitle && <meta property="og:title" content={resolvedOgTitle} />}
      {resolvedOgDescription && (
        <meta property="og:description" content={resolvedOgDescription} />
      )}
      {resolvedOgUrl && <meta property="og:url" content={resolvedOgUrl} />}
      {ogType && <meta property="og:type" content={ogType} />}
      {ogLocale && <meta property="og:locale" content={ogLocale} />}
      {resolvedOgImage && <meta property="og:image" content={resolvedOgImage} />}
      {twitterCard && <meta name="twitter:card" content={twitterCard} />}

      {children}
    </Helmet>
  );
}
