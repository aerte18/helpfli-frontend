/**
 * Vercel Edge Middleware — prerender indeksowalnych tras i prawdziwe 404.
 * Publiczne strony SEO są renderowane z backendu dla crawlerów. Pozostałe
 * znane trasy przechodzą do SPA, a nieznane adresy nie wpadają w soft 404.
 */
const BOT_UA =
  /googlebot|google-inspectiontool|bingbot|yandex|baidu|duckduckbot|slurp|facebot|facebookexternalhit|twitterbot|linkedinbot|discordbot|slackbot|whatsapp|telegrambot|applebot|petalbot|semrushbot|ahrefsbot|mj12bot|rogerbot|embedly|pinterest|redditbot|quora link preview|vkshare|w3c_validator|bot|crawl|spider|preview/i;

const SEO_PATH =
  /^\/(?:|provider\/(?!sponsored(?:\/|$)|quotes(?:\/|$))[^/]+|service\/[^/]+|poradnik\/[^/]+|poradniki|wykonawcy(?:\/[^/]+\/[^/]+)?|providers|services|about|help|contact|why-pro|regulamin|prywatnosc|cennik|dane-firmy|cooperation|reviews)\/?$/i;

const KNOWN_APP_PATH =
  /^\/(?:|login|register|forgot-password|reset-password|verify-email|onboarding(?:\/provider)?|privacy|home|search|concierge|ai-public|account(?:\/(?:company|subscriptions|boosts|wallet|whitelabel))?|integrations\/calendar\/callback|wallet|billing|subscriptions|why-pro|providers|provider(?:\/[^/]+)?|service\/[^/]+|regulamin|prywatnosc|cennik|dane-firmy|contact|about|services|cooperation|reviews|help|poradniki|poradnik\/[^/]+|wykonawcy(?:\/[^/]+\/[^/]+)?|uslugi(?:\/miasto\/[^/]+|\/[^/]+(?:\/[^/]+)?)?|create-order|my-orders|orders(?:\/[^/]+(?:\/[^/]+)?)?|rate-user\/[^/]+|user-ratings\/[^/]+|nearby-providers|inbox|messages|notifications|ai|checkout(?:\/[^/]+)?|payment-result|kyc|dashboard|client-dashboard|manage-services|available-orders|verification|provider-home|company\/(?:dashboard|create|join|[^/]+\/settings)|admin(?:\/.*)?)\/?$/i;

const VALIDATED_DYNAMIC_PATH =
  /^\/(?:provider\/(?!sponsored(?:\/|$)|quotes(?:\/|$))[^/]+|service\/[^/]+|poradnik\/[^/]+|wykonawcy\/[^/]+\/[^/]+)\/?$/i;

const PRERENDER_API =
  process.env.PRERENDER_API_URL || 'https://api.helpfli.pl/api/seo/prerender';

function shouldBypass(path) {
  return (
    path === '/api' ||
    path.startsWith('/api/') ||
    path === '/socket.io' ||
    path.startsWith('/socket.io/') ||
    path.startsWith('/.well-known/') ||
    path === '/robots.txt' ||
    path === '/sitemap.xml' ||
    /\.[a-z0-9]{2,8}$/i.test(path)
  );
}

export function isKnownAppPath(path) {
  return KNOWN_APP_PATH.test(String(path || ''));
}

function notFoundResponse() {
  return new Response(
    '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Nie znaleziono strony | Helpfli</title></head><body><main><h1>404</h1><p>Nie znaleziono strony.</p><p><a href="/">Wróć do Helpfli</a></p></main></body></html>',
    {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=60',
        'X-Robots-Tag': 'noindex, follow'
      }
    }
  );
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '') || '/';

  if (shouldBypass(path)) return;
  if (!isKnownAppPath(path)) return notFoundResponse();
  const isBot = BOT_UA.test(ua);
  const isSeoPath = SEO_PATH.test(path);
  if (!isSeoPath) return;
  if (!isBot && !VALIDATED_DYNAMIC_PATH.test(path)) return;

  const prerenderUrl = `${PRERENDER_API}?path=${encodeURIComponent(path)}`;

  try {
    const res = await fetch(prerenderUrl, {
      headers: { Accept: 'text/html' }
    });
    if (res.status === 404) return notFoundResponse();
    if (!res.ok) return;
    const html = await res.text();
    const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
    if (canonicalMatch?.[1]) {
      const canonical = new URL(canonicalMatch[1], url.origin);
      const canonicalPath = canonical.pathname.replace(/\/+$/, '') || '/';
      if (canonicalPath !== path) {
        return Response.redirect(canonical.toString(), 308);
      }
    }
    // Dla zwykłego użytkownika ten request służy tylko walidacji statusu
    // dynamicznej encji; właściwy interfejs nadal renderuje aplikacja SPA.
    if (!isBot) return;
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=3600',
        'X-Helpfli-Prerender': '1'
      }
    });
  } catch {
    return;
  }
}

export const config = {
  matcher: ['/:path*']
};
