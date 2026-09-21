import type { APIRoute } from 'astro';
import snapshot from '../../../public/treasury.snapshot.json';

// Publish the same dated data as the treasury dashboard at build time.
// Blockchain scans belong in the scheduled snapshot job, not public requests.
export const prerender = true;

export const GET: APIRoute = () => new Response(
	JSON.stringify(snapshot, null, 2) + '\n',
	{ headers: { 'content-type': 'application/json; charset=utf-8' } },
);
