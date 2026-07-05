/**
 * Vercel Edge Middleware — SSR-lite dla crawlerów SEO.
 * Boty na /poradnik/*, /wykonawcy/*, /poradniki dostają gotowy HTML z API.
 */
const BOT_UA =
  /googlebot|google-inspectiontool|bingbot|yandex|baidu|duckduckbot|slurp|facebot|facebookexternalhit|twitterbot|linkedinbot|discordbot|slackbot|whatsapp|telegrambot|applebot|petalbot|semrushbot|ahrefsbot|mj12bot|rogerbot|embedly|pinterest|redditbot|quora link preview|vkshare|w3c_validator|bot|crawl|spider|preview/i;

const SEO_PATH =
  /^\/(|home|provider\/[^/]+|service\/[^/]+|poradnik\/[^/]+|poradniki|wykonawcy(\/[^/]+(\/[^/]+)?)?)\/?$/i;

const PRERENDER_API =
  process.env.PRERENDER_API_URL || 'https://api.helpfli.pl/api/seo/prerender';

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '') || '/';

  if (!BOT_UA.test(ua)) return;
  if (!SEO_PATH.test(path)) return;

  const prerenderUrl = `${PRERENDER_API}?path=${encodeURIComponent(path)}`;

  try {
    const res = await fetch(prerenderUrl, {
      headers: { Accept: 'text/html' }
    });
    if (!res.ok) return;
    const html = await res.text();
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
  matcher: [
    '/',
    '/home',
    '/provider/:id*',
    '/service/:slug*',
    '/poradnik/:slug*',
    '/poradniki',
    '/wykonawcy',
    '/wykonawcy/:path*'
  ]
};
