import type { APIRoute } from 'astro';
import { getTreasurySnapshot } from '../../lib/treasury/baseTreasury.js';

export const GET: APIRoute = async ({ url }) => {
	try {
		// Canonical wallet (override via env)
		const wallet = (process.env.TREASURY_WALLET ?? '0xa668ddf22a4c0ecbb31c89b16f355b26ae7703c3').toLowerCase();
		const rpcUrl = process.env.BASE_RPC_URL ?? 'https://mainnet.base.org';
		let startBlock = Number(process.env.TREASURY_START_BLOCK ?? '0');
		if (!Number.isFinite(startBlock) || startBlock < 0) throw new Error('TREASURY_START_BLOCK must be a non-negative integer');
		const cacheTtlMs = Number(process.env.TREASURY_CACHE_TTL_MS ?? '30000');
		const refresh = url.searchParams.get('refresh');

		// If not configured, default to a recent window to avoid scanning from genesis.
		if (startBlock === 0) {
			const latestHex = await fetch(rpcUrl, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
			}).then((r) => r.json() as Promise<{ result?: string }>);
			const latest = latestHex.result ? Number(BigInt(latestHex.result)) : 0;
			startBlock = Math.max(0, latest - 200_000); // ~1-2 weeks on Base (approx)
		}

		const projectRoot = process.cwd();
		const snapshot = await getTreasurySnapshot({
			projectRoot,
			wallet,
			rpcUrl,
			startBlock,
			cacheTtlMs: refresh ? 0 : cacheTtlMs,
		});

		return new Response(JSON.stringify(snapshot, null, 2) + '\n', {
			status: 200,
			headers: {
				'content-type': 'application/json; charset=utf-8',
				'cache-control': 'no-store',
			},
		});
	} catch (e: any) {
		return new Response(
			JSON.stringify(
				{
					error: e?.message ?? 'Unknown error',
					hint: 'Optional env: TREASURY_WALLET, TREASURY_START_BLOCK, BASE_RPC_URL, TREASURY_CACHE_TTL_MS. If TREASURY_START_BLOCK is unset, the API defaults to scanning a recent window and then increments from cache.',
				},
				null,
				2,
			) + '\n',
			{
				status: 500,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			},
		);
	}
};
