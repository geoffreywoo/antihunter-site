import changelog from '../data/changelog.json';

const SITE_URL = 'https://antihunter.com';

const pages = [
  '/',
  '/acts',
  '/agent-to-agent-services',
  '/canon',
  '/dev',
  '/pilgrimage',
  '/trading',
  '/tokenomics',
  '/treasury',
  '/treasury-methodology',
  '/treasury-policy',
  '/roadmap',
  '/roadmap/agent-ops-architecture',
  '/roadmap/token-gated-telegram',
  '/roadmap/trad-vc-tools',
  ...(changelog || []).map((e) => `/acts/${e.date}`),
];

export function GET() {
  const now = new Date().toISOString();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${now}</lastmod></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
