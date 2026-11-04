import { canon, episodes } from '../data/episodes';
import { scarcityEpisodes } from '../data/scarcity';
export const prerender = true;
const SITE_URL = 'https://antihunter.com';

const pages = [
  '/',
  '/scarcity',
  '/notes',
  '/notes/supply-timing',
  '/notes/majority-overlap',
  '/notes/outcome-coverage',
  '/notes/token-latency',
  '/notes/world-model-evaluation',
  '/notes/robot-assistance',
  '/notes/content-provenance',
  '/scarcity/corner-office',
  ...scarcityEpisodes.map(e => `/scarcity/${e.slug}`),
  '/treasury',
  '/treasury-methodology',
  '/pilgrimage',
  '/machine',
  '/two-orders',
  '/acts',
  '/canon',
  '/token',
  ...episodes.map(episode => `/acts/${episode.slug}`),
  ...canon.map(item => `/canon/${item.slug}`),
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
