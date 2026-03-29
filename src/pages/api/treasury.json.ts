import type { APIRoute } from 'astro';
import { getTreasurySnapshot } from '../../lib/treasury/baseTreasury.js';
import { decodeAbiString, encodeDecimalsCall, encodeSymbolCall, encodeNameCall, encodeBalanceOfCall, readUint256 } from '../../lib/treasury/abi.js';
import { fetchDexPairsForToken, parseUsdPrice, pickBestBasePair } from '../../lib/treasury/dexscreener.js';

// Public RPC fallbacks (override with BASE_RPC_URL)
const BASE_RPCS = [
	process.env.BASE_RPC_URL,
	process.env.BASE_RPC,
	'https://mainnet.base.org',
	'https://base.llamarpc.com',
	'https://base-rpc.publicnode.com',
].filter(Boolean) as string[];

// Ethereum mainnet RPC fallbacks (override with ETH_RPC_URL)
const ETH_RPCS = [
	process.env.ETH_RPC_URL,
	process.env.ETH_RPC,
	'https://cloudflare-eth.com',
	'https://eth.llamarpc.com',
	'https://rpc.ankr.com/eth',
].filter(Boolean) as string[];

async function rpcCall(rpcUrl: string, method: string, params: unknown[]) {
	const res = await fetch(rpcUrl, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
	});
	const j = (await res.json()) as any;
	if (!res.ok) throw new Error(`rpc http ${res.status}: ${JSON.stringify(j)}`);
	if (j?.error) throw new Error(JSON.stringify(j));
	return j.result;
}

function formatUnits(raw: bigint, decimals: number): string {
	const base = 10n ** BigInt(decimals);
	const i = raw / base;
	const f = raw % base;
	if (f === 0n) return i.toString();
	let frac = f.toString().padStart(decimals, '0').replace(/0+$/g, '');
	return `${i.toString()}.${frac}`;
}

async function erc20Meta(rpcUrl: string, token: string) {
	const [decHex, symHex, nameHex] = await Promise.all([
		rpcCall(rpcUrl, 'eth_call', [{ to: token, data: encodeDecimalsCall() }, 'latest']),
		rpcCall(rpcUrl, 'eth_call', [{ to: token, data: encodeSymbolCall() }, 'latest']).catch(() => null),
		rpcCall(rpcUrl, 'eth_call', [{ to: token, data: encodeNameCall() }, 'latest']).catch(() => null),
	]);
	const decimals = Number(readUint256(decHex as string, 0));
	const symbol = symHex ? decodeAbiString(symHex as string) : '';
	const name = nameHex ? decodeAbiString(nameHex as string) : '';
	return { decimals: Number.isFinite(decimals) ? decimals : 18, symbol: symbol || 'TOKEN', name: name || undefined };
}

async function erc20Balance(rpcUrl: string, token: string, owner: string): Promise<bigint> {
	const res = await rpcCall(rpcUrl, 'eth_call', [{ to: token, data: encodeBalanceOfCall(owner) }, 'latest']);
	return readUint256(res as string, 0);
}

async function dexscreenerPriceUsd(token: string): Promise<number | null> {
	try {
		const pairs = await fetchDexPairsForToken(token);
		const best = pickBestBasePair(pairs);
		return parseUsdPrice(best);
	} catch {
		return null;
	}
}

export const GET: APIRoute = async ({ url }) => {
	try {
		// Canonical wallet(s) (override via env)
		// TREASURY_WALLETS supports comma-separated wallets; the first is treated as the primary.
		const wallets = String(process.env.TREASURY_WALLETS ?? process.env.TREASURY_WALLET ?? '0xa668ddf22a4c0ecbb31c89b16f355b26ae7703c3')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.map((w) => w.toLowerCase());
		const wallet = wallets[0];

		// Optional knobs
		// Default startBlock chosen to cover earliest known BNKR/BIO receipts; override via env.
		let startBlock = Number(process.env.TREASURY_START_BLOCK ?? '41805000');
		if (!Number.isFinite(startBlock) || startBlock < 0) throw new Error('TREASURY_START_BLOCK must be a non-negative integer');
		const cacheTtlMs = Number(process.env.TREASURY_CACHE_TTL_MS ?? '60000');
		const refresh = url.searchParams.get('refresh');

		// Vercel serverless: project root may be read-only; use /tmp for cache
		const projectRoot = process.env.VERCEL ? '/tmp' : process.cwd();

		let lastErr: any = null;
		for (const rpcUrl of BASE_RPCS) {
			try {
				const effectiveStartBlock = startBlock;

				const tokenAllowlist = [
					// canonical tokens we care about today (Base)
					'0xe2f3fae4bc62e21826018364aa30ae45d430bb07', // ANTIHUNTER
					'0x4200000000000000000000000000000000000006', // WETH
					'0x22af33fe49fd1fa80c7149773dde5890d3c76f3b', // BNKR
					'0xf30bf00edd0c22db54c9274b90d2a4c21fc09b07', // FELIX
					'0xd655790b0486fa681c23b955f5ca7cd5f5c8cb07', // BIO
					'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
				].map((a) => a.toLowerCase());

				const FEE_ENTRY_DATE = '2026-02-06';
				const ETH_ENTRY_DATE = '2026-02-07';
				const ZERO_COST = new Set([
					'0xe2f3fae4bc62e21826018364aa30ae45d430bb07', // ANTIHUNTER
					'0x4200000000000000000000000000000000000006', // WETH
				].map((a) => a.toLowerCase()));

				// helper: add native ETH pseudo-position
				async function ethBalance(owner: string): Promise<number> {
					const hex = await rpcCall(rpcUrl, 'eth_getBalance', [owner, 'latest']);
					try {
						return Number(BigInt(hex)) / 1e18;
					} catch {
						return 0;
					}
				}

				// Fetch per-wallet snapshots and merge so the UI reflects the *total* treasury.
				const snaps = await Promise.all(
					wallets.map((w) =>
						getTreasurySnapshot({
							projectRoot,
							wallet: w,
							rpcUrl,
							startBlock: effectiveStartBlock,
							cacheTtlMs: refresh ? 0 : cacheTtlMs,
							tokenAllowlist,
						}),
					),
				);

				const snapshot = snaps[0];
				(snapshot as any).wallets = wallets;
				snapshot.wallet = wallet;

				// Merge positions by token across wallets (append lots).
				const byToken = new Map<string, any>();
				for (const s of snaps) {
					for (const p of (s.positions ?? [])) {
						const key = (p.token ?? 'NATIVE_BASE_ETH').toLowerCase();
						const cur = byToken.get(key);
						if (!cur) {
							byToken.set(key, { ...p, lots: Array.isArray(p.lots) ? [...p.lots] : [] });
							continue;
						}
						// sum numeric-ish fields
						for (const f of ['costUsd', 'fmvUsd', 'pnlUsd']) {
							if (typeof (p as any)[f] === 'number') (cur as any)[f] = ((cur as any)[f] ?? 0) + (p as any)[f];
						}
						// sum balances (best-effort)
						try {
							const a = Number(cur.balance ?? 0);
							const b = Number(p.balance ?? 0);
							cur.balance = String(a + b);
						} catch {}
						// keep earliest entry
						if (p.entryTimestamp && (!cur.entryTimestamp || p.entryTimestamp < cur.entryTimestamp)) cur.entryTimestamp = p.entryTimestamp;
						if (Array.isArray(p.lots) && p.lots.length) cur.lots = [...(cur.lots ?? []), ...p.lots];
					}
				}
				snapshot.positions = Array.from(byToken.values());

				// Ensure we show *current holdings* even if they were acquired before the scan window.
				// Cost basis/entry will be null until the scan range covers acquisition history.
				const existing = new Set((snapshot.positions ?? []).map((p: any) => (p.token ?? '').toLowerCase()));
				for (const token of tokenAllowlist) {
					if (existing.has(token)) continue;
					const [meta, balRaw, px] = await Promise.all([
						erc20Meta(rpcUrl, token),
						erc20Balance(rpcUrl, token, wallet),
						dexscreenerPriceUsd(token),
					]);
					if (balRaw <= 0n) continue;
					const balance = formatUnits(balRaw, meta.decimals);
					const balanceNum = Number(balance);
					const fmvUsd = px != null && Number.isFinite(balanceNum) ? balanceNum * px : undefined;
					const hardZero = ZERO_COST.has(token);
					snapshot.positions.push({
						token,
						symbol: meta.symbol,
						name: meta.name,
						decimals: meta.decimals,
						balance,
						balanceRaw: balRaw.toString(),
						entryTimestamp: hardZero ? Math.floor(new Date(FEE_ENTRY_DATE).getTime() / 1000) : undefined,
						costEth: hardZero ? '0' : '0',
						costEthWei: hardZero ? '0' : '0',
						costUsd: hardZero ? 0 : undefined,
						priceUsd: px ?? undefined,
						fmvUsd,
						pnlUsd: hardZero && fmvUsd != null ? fmvUsd : undefined,
					});
				}
				// Add native ETH pseudo-position (FMV derived from ETH price = WETH price)
				const ethQty = (await Promise.all(wallets.map((w) => ethBalance(w)))).reduce((a, b) => a + b, 0);
				const ethPx = await dexscreenerPriceUsd('0x4200000000000000000000000000000000000006');
				const ethFmvUsd = ethPx != null ? ethQty * ethPx : undefined;
				if ((ethFmvUsd ?? 0) >= 100) {
					const ethCostUsd = ethPx != null ? ethPx * 1 : undefined;
					snapshot.positions.push({
						token: null,
						symbol: 'ETH',
						name: 'Ethereum',
						decimals: 18,
						balance: String(ethQty),
						balanceRaw: '',
						entryTimestamp: Math.floor(new Date(ETH_ENTRY_DATE).getTime() / 1000),
						costEth: '1',
						costEthWei: '1000000000000000000',
						costUsd: ethCostUsd,
						priceUsd: ethPx ?? undefined,
						fmvUsd: ethFmvUsd,
						pnlUsd: ethCostUsd != null ? (ethFmvUsd - ethCostUsd) : undefined,
					});
				}

				// Add Ethereum mainnet native ETH from the same wallets (hard wallet accounting)
				let mainnetEthQty = 0;
				for (const ethRpc of ETH_RPCS) {
					try {
						const bals = await Promise.all(wallets.map((w) => rpcCall(ethRpc, 'eth_getBalance', [w, 'latest'])));
						mainnetEthQty = bals.reduce((s, hx) => {
							try {
								return s + Number(BigInt(hx)) / 1e18;
							} catch {
								return s;
							}
						}, 0);
						break;
					} catch {
						continue;
					}
				}
				if (mainnetEthQty > 0.0001) {
					const ethPxMainnet = await dexscreenerPriceUsd('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
					const ethFmvUsdMainnet = ethPxMainnet != null ? mainnetEthQty * ethPxMainnet : undefined;
					snapshot.positions.push({
						token: 'ethereum:eth',
						symbol: 'ETH',
						name: 'Ethereum (mainnet)',
						decimals: 18,
						balance: String(mainnetEthQty),
						balanceRaw: '',
						entryTimestamp: Math.floor(new Date(ETH_ENTRY_DATE).getTime() / 1000),
						costEth: '1',
						costEthWei: '1000000000000000000',
						costUsd: ethPxMainnet != null ? ethPxMainnet * 1 : undefined,
						priceUsd: ethPxMainnet ?? undefined,
						fmvUsd: ethFmvUsdMainnet,
						pnlUsd:
							ethPxMainnet != null && ethFmvUsdMainnet != null ? ethFmvUsdMainnet - ethPxMainnet : undefined,
					});
				}

				snapshot.positions.sort((a: any, b: any) => (b.fmvUsd ?? 0) - (a.fmvUsd ?? 0));

				return new Response(JSON.stringify(snapshot, null, 2) + '\n', {
					status: 200,
					headers: {
						'content-type': 'application/json; charset=utf-8',
						'cache-control': 'no-store',
					},
				});
			} catch (e: any) {
				lastErr = e;
				const msg = String(e?.message ?? e);
				// If we're rate-limited, try the next RPC immediately.
				if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.includes('over rate limit')) {
					continue;
				}
				// For other errors, still try next RPC but keep error.
				continue;
			}
		}

		throw lastErr ?? new Error('All RPC fallbacks failed');
	} catch (e: any) {
		return new Response(
			JSON.stringify(
				{
					error: e?.message ?? 'Unknown error',
					hint: 'Env: TREASURY_WALLET, TREASURY_START_BLOCK, BASE_RPC_URL, TREASURY_CACHE_TTL_MS. Add ?refresh=1 to force refresh. The API will fail over across multiple public Base RPCs when rate-limited.',
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
