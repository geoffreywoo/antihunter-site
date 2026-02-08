import fs from 'node:fs/promises';
import path from 'node:path';

import { getTreasurySnapshot } from '../src/lib/treasury/baseTreasury';
import {
	decodeAbiString,
	encodeBalanceOfCall,
	encodeDecimalsCall,
	encodeNameCall,
	encodeSymbolCall,
	readUint256,
} from '../src/lib/treasury/abi';
import { fetchDexPairsForToken, parseUsdPrice, pickBestBasePair } from '../src/lib/treasury/dexscreener';

const TREASURY_WALLET = (process.env.TREASURY_WALLET ?? '0xa668ddf22a4c0ecbb31c89b16f355b26ae7703c3').toLowerCase();
const BASE_RPCS = [
	process.env.BASE_RPC_URL,
	process.env.BASE_RPC,
	'https://mainnet.base.org',
	'https://base.llamarpc.com',
	'https://base-rpc.publicnode.com',
].filter(Boolean) as string[];

function looksRateLimited(msg: string) {
	const m = msg.toLowerCase();
	return m.includes('429') || m.includes('rate limit') || m.includes('over rate limit');
}
const TREASURY_START_BLOCK = Number(process.env.TREASURY_START_BLOCK ?? '0');

// Canonical allowlist (Base)
const TOKEN_ALLOWLIST = [
	'0xe2f3fae4bc62e21826018364aa30ae45d430bb07', // ANTIHUNTER
	'0x4200000000000000000000000000000000000006', // WETH
	'0x22af33fe49fd1fa80c7149773dde5890d3c76f3b', // BNKR
	'0xf30bf00edd0c22db54c9274b90d2a4c21fc09b07', // FELIX
	'0xd655790b0486fa681c23b955f5ca7cd5f5c8cb07', // BIO
].map((a) => a.toLowerCase());

const HARD_CODED_ENTRY_DATE = '2026-02-06';
const HARD_CODED_ZERO_COST_TOKENS = new Set([
	'0xe2f3fae4bc62e21826018364aa30ae45d430bb07', // ANTIHUNTER
	'0x4200000000000000000000000000000000000006', // WETH
].map((a) => a.toLowerCase()));

async function rpcCall(method: string, params: unknown[]) {
	let lastErr: any = null;
	for (const rpcUrl of BASE_RPCS) {
		try {
			const res = await fetch(rpcUrl, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
			});
			const j = (await res.json()) as any;
			if (!res.ok) throw new Error(`rpc http ${res.status}: ${JSON.stringify(j)}`);
			if (j?.error) throw new Error(JSON.stringify(j));
			return j.result as string;
		} catch (e: any) {
			lastErr = e;
			const msg = String(e?.message ?? e);
			if (looksRateLimited(msg)) continue;
			continue;
		}
	}
	throw lastErr ?? new Error('All RPC fallbacks failed');
}

function formatUnits(raw: bigint, decimals: number): string {
	const base = 10n ** BigInt(decimals);
	const i = raw / base;
	const f = raw % base;
	if (f === 0n) return i.toString();
	let frac = f.toString().padStart(decimals, '0').replace(/0+$/g, '');
	return `${i.toString()}.${frac}`;
}

async function erc20Meta(token: string) {
	const [decHex, symHex, nameHex] = await Promise.all([
		rpcCall('eth_call', [{ to: token, data: encodeDecimalsCall() }, 'latest']),
		rpcCall('eth_call', [{ to: token, data: encodeSymbolCall() }, 'latest']).catch(() => null),
		rpcCall('eth_call', [{ to: token, data: encodeNameCall() }, 'latest']).catch(() => null),
	]);
	const decimals = Number(readUint256(decHex, 0));
	const symbol = symHex ? decodeAbiString(symHex) : '';
	const name = nameHex ? decodeAbiString(nameHex) : '';
	return { decimals: Number.isFinite(decimals) ? decimals : 18, symbol: symbol || 'TOKEN', name: name || undefined };
}

async function erc20Balance(token: string, owner: string): Promise<bigint> {
	const res = await rpcCall('eth_call', [{ to: token, data: encodeBalanceOfCall(owner) }, 'latest']);
	try {
		return readUint256(res, 0);
	} catch {
		// Some RPCs may return 0x on failure; treat as 0.
		return 0n;
	}
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

async function ethBalance(owner: string): Promise<number> {
	const hex = await rpcCall('eth_getBalance', [owner, 'latest']);
	try {
		return Number(BigInt(hex)) / 1e18;
	} catch {
		return 0;
	}
}

function dayISO(ms: number) {
	return new Date(ms).toISOString().slice(0, 10);
}

function fmtDateFromSec(ts?: number) {
	if (!ts) return null;
	return new Date(ts * 1000).toISOString().slice(0, 10);
}

async function main() {
	let startBlock = TREASURY_START_BLOCK;
	if (!Number.isFinite(startBlock) || startBlock < 0) throw new Error('TREASURY_START_BLOCK must be a non-negative integer');

	// If unset, scan a recent window (fast). For full cost basis, set TREASURY_START_BLOCK explicitly.
	if (startBlock === 0) {
		const latestHex = await rpcCall('eth_blockNumber', []);
		const latest = latestHex ? Number(BigInt(latestHex)) : 0;
		startBlock = Math.max(0, latest - 200_000);
	}

	const projectRoot = process.cwd();
	const rpcUrl = BASE_RPCS[0] ?? 'https://mainnet.base.org';
	const snapshot = await getTreasurySnapshot({
		projectRoot,
		wallet: TREASURY_WALLET,
		rpcUrl,
		startBlock,
		cacheTtlMs: 0,
		tokenAllowlist: TOKEN_ALLOWLIST,
	});

	// Ensure current balances are present even if acquired before the scan window
	const existing = new Set((snapshot.positions ?? []).map((p) => (p.token ?? '').toLowerCase()));
	for (const token of TOKEN_ALLOWLIST) {
		if (existing.has(token)) continue;
		const [meta, balRaw, px] = await Promise.all([erc20Meta(token), erc20Balance(token, TREASURY_WALLET), dexscreenerPriceUsd(token)]);
		if (balRaw <= 0n) continue;
		const balance = formatUnits(balRaw, meta.decimals);
		const balanceNum = Number(balance);
		const fmvUsd = px != null && Number.isFinite(balanceNum) ? balanceNum * px : undefined;
		snapshot.positions.push({
			token,
			symbol: meta.symbol,
			name: meta.name,
			decimals: meta.decimals,
			balance,
			balanceRaw: balRaw.toString(),
			entryTimestamp: undefined,
			costEth: '0',
			costEthWei: '0',
			costUsd: undefined,
			priceUsd: px ?? undefined,
			fmvUsd,
			pnlUsd: undefined,
		});
	}
	(snapshot.positions ?? []).sort((a: any, b: any) => (b.fmvUsd ?? 0) - (a.fmvUsd ?? 0));

	// Build rows (apply hard-coded rules for fee-derived assets)
	let rows = (snapshot.positions ?? [])
		.filter((p: any) => (p.fmvUsd ?? 0) >= 100)
		.map((p: any) => {
			const token = (p.token ?? '').toLowerCase();
			const hardZero = HARD_CODED_ZERO_COST_TOKENS.has(token);
			const entryDate = hardZero ? HARD_CODED_ENTRY_DATE : fmtDateFromSec(p.entryTimestamp);
			const costBasisUsd = hardZero ? 0 : (p.costUsd ?? null);
			const costBasisEth = hardZero ? '0' : (p.costEth ?? null);
			const pnlUsd = (p.fmvUsd ?? null) != null && costBasisUsd != null ? (p.fmvUsd - costBasisUsd) : (p.pnlUsd ?? null);
			return {
				symbol: p.symbol,
				token: p.token,
				balance: p.balance,
				entryDate,
				costBasisUsd,
				costBasisEth,
				fmvUsd: p.fmvUsd ?? null,
				pnlUsd,
			};
		});

	// Add native ETH as a row (FMV from current ETH/USD)
	const ethQty = await ethBalance(TREASURY_WALLET);
	const ethPx = await dexscreenerPriceUsd('0x4200000000000000000000000000000000000006'); // WETH
	const ethFmvUsd = ethPx != null ? ethQty * ethPx : null;
	if ((ethFmvUsd ?? 0) >= 100) {
		const ethCostUsd = ethPx != null ? ethPx * 1 : null;
		rows.push({
			symbol: 'ETH',
			token: null,
			balance: String(ethQty),
			entryDate: HARD_CODED_ENTRY_DATE,
			costBasisUsd: ethCostUsd,
			costBasisEth: '1',
			fmvUsd: ethFmvUsd,
			pnlUsd: ethFmvUsd != null && ethCostUsd != null ? (ethFmvUsd - ethCostUsd) : null,
		});
	}

	rows = rows.sort((a: any, b: any) => (b.fmvUsd ?? 0) - (a.fmvUsd ?? 0));

	const totalUsd = rows.reduce((s: number, r: any) => s + (r.fmvUsd ?? 0), 0);

	const out = {
		updatedAtMs: Date.now(),
		updatedAt: new Date().toISOString(),
		date: dayISO(Date.now()),
		wallet: TREASURY_WALLET,
		basescan: `https://basescan.org/address/${TREASURY_WALLET}`,
		rows,
		totalUsd,
		notes: snapshot.notes,
		method: {
			entryAndCostBasis: 'derived-from-onchain-transfer-logs (token<->WETH pairing) with token allowlist; fee-derived $ANTIHUNTER and $WETH are hard-coded as entry=2026-02-06 and cost basis $0.',
		},
	};

	const outPath = path.join(projectRoot, 'public', 'treasury.snapshot.json');
	await fs.writeFile(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
	console.log(`wrote ${outPath} (${rows.length} rows)`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
