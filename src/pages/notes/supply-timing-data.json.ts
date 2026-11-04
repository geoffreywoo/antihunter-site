import fixture from '../../data/supply-timing.json';
export const prerender = true;
export function GET() {
  return new Response(JSON.stringify(fixture, null, 2) + '\n', { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
