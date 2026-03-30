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

const TREASURY_WALLETS = String(
	process.env.TREASURY_WALLETS ??
		process.env.TREASURY_WALLET ??
		// default: primary hot + secondary hard wallet
		'0xa668ddf22a4c0ecbb31c89b16f355b26ae7703c3,0x30d8c9f8955e6453f6b471fb950ffd49c2e843d3',
)
	.split(',')
	.map((s) => s.trim().toLowerCase())
	.filter(Boolean);

const TREASURY_WALLET = TREASURY_WALLETS[0];
const BASE_RPCS = [
	process.env.BASE_RPC_URL,
	process.env.BASE_RPC,
	'https://mainnet.base.org',
	'https://base.llamarpc.com',
	'https://base-rpc.publicnode.com',
].filter(Boolean) as string[];

const ETHEREUM_RPCS = [
	process.env.ETHEREUM_RPC_URL,
	process.env.ETH_RPC_URL,
	process.env.ETHEREUM_RPC,
	process.env.ETH_RPC,
	'https://eth.llamarpc.com',
	'https://ethereum-rpc.publicnode.com',
	'https://cloudflare-eth.com',
].filter(Boolean) as string[];

function looksRateLimited(msg: string) {
	const m = msg.toLowerCase();
	return m.includes('429') || m.includes('rate limit') || m.includes('over rate limit');
}
// Start block for log-based lot attribution / cost basis.
// Default is set to cover the earliest known BNKR/BIO receipts into the treasury wallet.
const TREASURY_START_BLOCK = Number(process.env.TREASURY_START_BLOCK ?? '41805000');

// Canonical allowlist (Base)
const BNKR_TOKEN = '0x22af33fe49fd1fa80c7149773dde5890d3c76f3b';
const SBNKR_TOKEN = '0x019fd9abc9caeb476d7afa68bb675518c6be17b7';
const BNKR_PER_SBNKR = 1000;
const ORIGINAL_BNKR_SWAP_PRICE_USD = 0.0006680579695505442;
const CRYPTOPUNK_PURCHASE_TX = '0x897f01a5eedc7f6bcd580cbe1304d9e5f43d8e78784889a7dff448da49a25ca4';
const CRYPTOPUNK_ENTRY_DATE = '2026-02-15';
const CRYPTOPUNK_PURCHASE_ETH_PRICE_USD = 1965.61;

const BASE_TOKEN_ALLOWLIST = [
	'0xe2f3fae4bc62e21826018364aa30ae45d430bb07', // ANTIHUNTER
	'0x4200000000000000000000000000000000000006', // WETH
	BNKR_TOKEN, // BNKR
	SBNKR_TOKEN, // sBNKR (Staked Banker)
	'0xf30bf00edd0c22db54c9274b90d2a4c21fc09b07', // FELIX
	'0xd655790b0486fa681c23b955f5ca7cd5f5c8cb07', // BIO
	'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
].map((a) => a.toLowerCase());

const EXTRA_TOKENS = String(process.env.TREASURY_EXTRA_TOKENS ?? '')
	.split(',')
	.map((s) => s.trim().toLowerCase())
	.filter((s) => /^0x[a-f0-9]{40}$/.test(s));

const TOKEN_ALLOWLIST = Array.from(new Set([...BASE_TOKEN_ALLOWLIST, ...EXTRA_TOKENS]));

const FEE_ENTRY_DATE = '2026-02-06';
// ETH entry date + cost basis are not safely inferable without explicit transfer attribution.
// Keep entryDate null and cost basis null unless/until we implement lot attribution for native ETH.
const ETH_ENTRY_DATE: string | null = null;
const HARD_CODED_ZERO_COST_TOKENS = new Set([
	'0xe2f3fae4bc62e21826018364aa30ae45d430bb07', // ANTIHUNTER
	'0x4200000000000000000000000000000000000006', // WETH
].map((a) => a.toLowerCase()));

// Tokens where entry/cost/lot accounting should not silently disappear due transient RPC/log issues.
const ACCOUNTING_CRITICAL_TOKENS = new Set([
	'0xd655790b0486fa681c23b955f5ca7cd5f5c8cb07', // BIO
	'0xf30bf00edd0c22db54c9274b90d2a4c21fc09b07', // FELIX
]);

function withTimeout<T>(ms: number, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(new Error(`timeout after ${ms}ms`)), ms);
	return fn(ctrl.signal).finally(() => clearTimeout(t));
}

const RPC_TIMEOUT_MS = Number(process.env.TREASURY_RPC_TIMEOUT_MS ?? '20000');
const HTTP_TIMEOUT_MS = Number(process.env.TREASURY_HTTP_TIMEOUT_MS ?? '20000');

async function rpcCallFrom(rpcs: string[], method: string, params: unknown[]) {
	let lastErr: any = null;
	for (const rpcUrl of rpcs) {
		try {
			const res = await withTimeout(RPC_TIMEOUT_MS, (signal) =>
				fetch(rpcUrl, {
					method: 'POST',
					signal,
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
				}),
			);
			const j = (await res.json()) as any;
			if (!res.ok) throw new Error(`rpc http ${res.status}: ${JSON.stringify(j)}`);
			if (j?.error) throw new Error(JSON.stringify(j));
			if (method === 'eth_call' && (j.result == null || j.result === '0x' || j.result === '0x0')) {
				throw new Error(`rpc eth_call returned empty result`);
			}
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

async function rpcCall(method: string, params: unknown[]) {
	return rpcCallFrom(BASE_RPCS, method, params);
}

async function rpcCallEth(method: string, params: unknown[]) {
	return rpcCallFrom(ETHEREUM_RPCS, method, params);
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
	let decimals = 18;
	try {
		decimals = Number(readUint256(decHex, 0));
		if (!Number.isFinite(decimals) || decimals <= 0 || decimals > 255) decimals = 18;
	} catch {
		decimals = 18;
	}
	const symbol = symHex ? decodeAbiString(symHex) : '';
	const name = nameHex ? decodeAbiString(nameHex) : '';
	return { decimals, symbol: symbol || 'TOKEN', name: name || undefined };
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

// Chainlink ETH/USD feed on Base (fallback when Dexscreener is flaky)
const CHAINLINK_ETH_USD_FEED = '0x71041dddad3595f9ced3dccfbe3d1f4b0a16bb70';
const CHAINLINK_ETH_USD_FEED_ETH = '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419c';
const CHAINLINK_DECIMALS = '0x313ce567';
const CHAINLINK_LATEST_ROUND_DATA = '0xfeaf968c';

async function basescanTokenBalance(token: string, wallet: string, symbol: string): Promise<number | null> {
	try {
		const url = `https://basescan.org/token/${token}?a=${wallet}`;
		const res = await withTimeout(HTTP_TIMEOUT_MS, (signal) =>
			fetch(url, {
				signal,
				headers: {
					'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
				},
			}),
		);
		if (!res.ok) return null;
		const html = await res.text();
		// Heuristic: prefer the token-holder filtered section to avoid matching unrelated "Balance" occurrences.
		const re = new RegExp(`Filtered by Token Holder[\\s\\S]*?Balance[\\s\\S]*?([0-9,]+(?:\\.[0-9]+)?)\\s*${symbol}`, 'i');
		const m = html.match(re);
		if (!m) return null;
		const n = Number(String(m[1]).replace(/,/g, ''));
		return Number.isFinite(n) ? n : null;
	} catch {
		return null;
	}
}

async function chainlinkEthUsdLatest(): Promise<number | null> {
	try {
		const [decHex, roundHex] = await Promise.all([
			rpcCall('eth_call', [{ to: CHAINLINK_ETH_USD_FEED, data: CHAINLINK_DECIMALS }, 'latest']),
			rpcCall('eth_call', [{ to: CHAINLINK_ETH_USD_FEED, data: CHAINLINK_LATEST_ROUND_DATA }, 'latest']),
		]);
		let decimals = 8;
		try {
			decimals = Number(readUint256(decHex, 0));
			if (!Number.isFinite(decimals) || decimals <= 0 || decimals > 255) decimals = 8;
		} catch {
			decimals = 8;
		}
		// latestRoundData: roundId, answer, startedAt, updatedAt, answeredInRound
		const answer = readUint256(roundHex, 32);
		const px = Number(answer) / 10 ** decimals;
		return Number.isFinite(px) ? px : null;
	} catch {
		return null;
	}
}

async function chainlinkEthUsdAtBlock(blockNumber: number, rpc: 'base' | 'eth' = 'base'): Promise<number | null> {
	const feed = rpc === 'eth' ? CHAINLINK_ETH_USD_FEED_ETH : CHAINLINK_ETH_USD_FEED;
	const rpcCallForChain = rpc === 'eth' ? rpcCallEth : rpcCall;
	try {
		const [decHex, roundHex] = await Promise.all([
			rpcCallForChain('eth_call', [{ to: feed, data: CHAINLINK_DECIMALS }, toHex(blockNumber)]),
			rpcCallForChain('eth_call', [{ to: feed, data: CHAINLINK_LATEST_ROUND_DATA }, toHex(blockNumber)]),
		]);
		let decimals = 8;
		try {
			decimals = Number(readUint256(decHex, 0));
			if (!Number.isFinite(decimals) || decimals <= 0 || decimals > 255) decimals = 8;
		} catch {
			decimals = 8;
		}
		const answer = readUint256(roundHex, 32);
		const px = Number(answer) / 10 ** decimals;
		return Number.isFinite(px) ? px : null;
	} catch {
		return null;
	}
}

async function txBlockNumberByHash(txHash: string): Promise<number | null> {
	try {
		const tx = await rpcCall('eth_getTransactionByHash', [txHash]);
		if (!tx?.blockNumber) return null;
		return Number(BigInt(tx.blockNumber));
	} catch {
		return null;
	}
}

async function txBlockNumberByHashEthereum(txHash: string): Promise<number | null> {
	try {
		const tx = await rpcCallEth('eth_getTransactionByHash', [txHash]);
		if (!tx?.blockNumber) return null;
		return Number(BigInt(tx.blockNumber));
	} catch {
		return null;
	}
}

async function ethBalanceBase(owner: string): Promise<number> {
	const hex = await rpcCall('eth_getBalance', [owner, 'latest']);
	try {
		return Number(BigInt(hex)) / 1e18;
	} catch {
		return 0;
	}
}

async function erc20BalanceEthereum(token: string, owner: string): Promise<bigint> {
	const res = await rpcCallEth('eth_call', [{ to: token, data: encodeBalanceOfCall(owner) }, 'latest']);
	try {
		return readUint256(res, 0);
	} catch {
		return 0n;
	}
}

async function ethBalanceEthereum(owner: string): Promise<number> {
	const hex = await rpcCallEth('eth_getBalance', [owner, 'latest']);
	try {
		return Number(BigInt(hex)) / 1e18;
	} catch {
		return 0;
	}
}

function dayISO(ms: number) {
	return new Date(ms).toISOString().slice(0, 10);
}

function normalizeDisplaySymbol(symbol: string) {
	const s = (symbol || '').toUpperCase();
	if (s === 'SBNKR') return 'sBNKR';
	return symbol;
}

function fmtDateFromSec(ts?: number) {
	if (!ts) return null;
	return new Date(ts * 1000).toISOString().slice(0, 10);
}

const TRANSFER_TOPIC0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
function addrTopic(addr: string) {
	return '0x' + addr.toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

async function blockTimestampSec(blockNumber: number): Promise<number | null> {
	try {
		const hex = await rpcCall('eth_getBlockByNumber', [toHex(blockNumber), false]);
		const tsHex = (hex as any)?.timestamp;
		if (!tsHex) return null;
		return Number(BigInt(tsHex));
	} catch {
		return null;
	}
}

function toHex(n: number) {
	return '0x' + Math.max(0, Math.floor(n)).toString(16);
}

async function inboundErc20Lots(token: string, owner: string, { fromBlock, toBlock }: { fromBlock: number; toBlock: number }) {
	// best-effort: scan Transfer logs where `to == owner`
	const lots: { txHash: string; blockNumber: number; entryDate: string | null; qty: string }[] = [];
	const toTopic = addrTopic(owner);
	// keep small to satisfy strict public rpc limits (some cap eth_getLogs to ~1k blocks)
	const step = 900;
	for (let start = fromBlock; start <= toBlock; start += step + 1) {
		const end = Math.min(toBlock, start + step);
		const logs = await rpcCall('eth_getLogs', [
			{
				fromBlock: toHex(start),
				toBlock: toHex(end),
				address: token,
				topics: [TRANSFER_TOPIC0, null, toTopic],
			},
		]);
		for (const l of (logs as any[])) {
			const bn = Number(BigInt(l.blockNumber));
			const ts = await blockTimestampSec(bn);
			// ERC20 transfer amount is data uint256
			let raw = 0n;
			try {
				raw = BigInt(l.data);
			} catch {
				raw = 0n;
			}
			lots.push({
				txHash: l.transactionHash,
				blockNumber: bn,
				entryDate: ts ? fmtDateFromSec(ts) : null,
				qty: raw.toString(),
			});
		}
	}
	return lots;
}

type ArkhamTxArtifact = {
	updatedAt?: string;
	updatedAtMs?: number;
	source?: string;
	address?: string;
	view?: string;
	notes?: string;
	txs?: Array<{
		timestamp?: string; // as displayed by Arkham (human / ISO)
		timestampMs?: number;
		from?: string;
		to?: string;
		token?: string;
		amount?: string | number;
		usd?: string | number;
		txHash?: string;
	}>;
};

function parseLooseUsd(x: unknown): number | null {
	if (x == null) return null;
	if (typeof x === 'number') return Number.isFinite(x) ? x : null;
	const s = String(x).trim();
	if (!s) return null;
	// Accept "$1,234.56" or "-123.4".
	const n = Number(s.replace(/[^0-9.+-]/g, ''));
	return Number.isFinite(n) ? n : null;
}

function looksLikeTxHash(x: unknown): x is string {
	if (typeof x !== 'string') return false;
	return /^0x[0-9a-fA-F]{64}$/.test(x);
}

async function readArkhamTxArtifact(projectRoot: string): Promise<ArkhamTxArtifact | null> {
	// Prefer transfers/inflow/outflow scrape (more likely to be accessible without API).
	for (const filename of ['treasury.arkham.transfers.json', 'treasury.arkham.alltx.json']) {
		const p = path.join(projectRoot, 'public', filename);
		try {
			const raw = await fs.readFile(p, 'utf8');
			return JSON.parse(raw) as ArkhamTxArtifact;
		} catch {
			// keep trying
		}
	}
	return null;
}

async function applyArkhamLotCostBasisOverrides(projectRoot: string, wallet: string, rows: any[]) {
	const artifact = await readArkhamTxArtifact(projectRoot);
	const txs = artifact?.txs ?? [];
	if (!Array.isArray(txs) || txs.length === 0) return;

	const walletLc = wallet.toLowerCase();
	// Map txHash -> total USD outflow from the treasury wallet (Arkham row-level USD).
	const outUsdByHash = new Map<string, number>();
	for (const tx of txs) {
		const txHash = tx?.txHash;
		if (!looksLikeTxHash(txHash)) continue;
		const from = String(tx?.from ?? '').toLowerCase();
		if (from !== walletLc) continue;
		const token = String(tx?.token ?? '');
		// Only use outflows in the funding tokens we care about for cost-basis attribution.
		if (!/(^|\b)(weth|antihunter)(\b|$)/i.test(token)) continue;
		const usd = parseLooseUsd(tx?.usd);
		if (usd == null || !Number.isFinite(usd) || usd === 0) continue;
		const prev = outUsdByHash.get(txHash) ?? 0;
		outUsdByHash.set(txHash, prev + Math.abs(usd));
	}
	if (outUsdByHash.size === 0) return;

	// Build index: txHash -> the lots (across all tokens) that claim that txHash.
	const usage = new Map<string, Array<{ rowIdx: number; lotIdx: number; qty: number }>>();
	for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
		const row = rows[rowIdx];
		const lots = row?.lots;
		if (!Array.isArray(lots) || lots.length === 0) continue;
		for (let lotIdx = 0; lotIdx < lots.length; lotIdx++) {
			const lot = lots[lotIdx];
			const txHash = lot?.txHash;
			if (!looksLikeTxHash(txHash)) continue;
			const qty = Number(lot?.qty);
			if (!Number.isFinite(qty) || qty <= 0) continue;
			const arr = usage.get(txHash) ?? [];
			arr.push({ rowIdx, lotIdx, qty });
			usage.set(txHash, arr);
		}
	}

	for (const [txHash, outUsd] of outUsdByHash.entries()) {
		const u = usage.get(txHash);
		if (!u || u.length === 0) continue;
		// Avoid double-counting ambiguous txs that mint multiple tokens in our lots view.
		const distinctRows = new Set(u.map((x) => x.rowIdx));
		if (distinctRows.size !== 1) continue;
		const sumQty = u.reduce((s, x) => s + x.qty, 0);
		if (!Number.isFinite(sumQty) || sumQty <= 0) continue;
		for (const { rowIdx, lotIdx, qty } of u) {
			const row = rows[rowIdx];
			const lot = row?.lots?.[lotIdx];
			if (!lot) continue;
			lot.costBasisUsd = (outUsd * (qty / sumQty));
		}
		// If the row doesn't have a total cost basis, fill it from the lots.
		const rowIdx = u[0].rowIdx;
		const row = rows[rowIdx];
		if (row && (row.costBasisUsd == null || row.costBasisUsd === 0) && Array.isArray(row.lots)) {
			const all = row.lots.map((l: any) => (typeof l.costBasisUsd === 'number' ? l.costBasisUsd : null));
			if (all.every((x: any) => typeof x === 'number' && Number.isFinite(x))) {
				row.costBasisUsd = all.reduce((s: number, n: number) => s + n, 0);
			}
		}
	}
}

function applyPriorAccountingFallback(rows: any[], priorRows: any[]) {
	const priorByToken = new Map<string, any>();
	for (const r of priorRows ?? []) {
		const t = (r?.token ?? '').toLowerCase();
		if (t) priorByToken.set(t, r);
	}

	for (const r of rows) {
		const token = (r?.token ?? '').toLowerCase();
		if (!ACCOUNTING_CRITICAL_TOKENS.has(token)) continue;
		const prior = priorByToken.get(token);
		if (!prior) continue;
		const missingAccounting = (r.entryDate == null) && (r.costBasisUsd == null) && (!Array.isArray(r.lots) || r.lots.length === 0);
		if (!missingAccounting) continue;
		if (prior.entryDate != null) r.entryDate = prior.entryDate;
		if (prior.costBasisUsd != null) r.costBasisUsd = prior.costBasisUsd;
		if (prior.costBasisEth != null) r.costBasisEth = prior.costBasisEth;
		if (Array.isArray(prior.lots) && prior.lots.length > 0) r.lots = prior.lots;
		if (r.fmvUsd != null && r.costBasisUsd != null) r.pnlUsd = r.fmvUsd - r.costBasisUsd;
	}
}

async function main() {
	let startBlock = TREASURY_START_BLOCK;
	if (!Number.isFinite(startBlock) || startBlock < 0) throw new Error('TREASURY_START_BLOCK must be a non-negative integer');

	// startBlock defaults to a fixed value; override via TREASURY_START_BLOCK as needed.

	const projectRoot = process.cwd();
	let priorCryptopunkCostBasisUsd: number | null = null;
	try {
		const priorRaw = await fs.readFile(path.join(projectRoot, 'public', 'treasury.snapshot.json'), 'utf8');
		const prior = JSON.parse(priorRaw) as any;
		const priorRow = Array.isArray(prior?.rows) ? prior.rows.find((r: any) => String(r?.symbol ?? '').toLowerCase() === 'cryptopunk #5730') : null;
		const priorCost = priorRow?.costBasisUsd;
		if (typeof priorCost === 'number' && Number.isFinite(priorCost)) priorCryptopunkCostBasisUsd = priorCost;
	} catch {
		// no prior snapshot yet
	}
	const rpcUrl = BASE_RPCS[0] ?? 'https://mainnet.base.org';
	console.log(`[treasury:snapshot] wallets=${TREASURY_WALLETS.join(',')}`);
	console.log(`[treasury:snapshot] startBlock=${startBlock} rpc=${rpcUrl}`);
	const fastMode = String(process.env.TREASURY_FAST_MODE ?? '1') === '1';
	const t0 = Date.now();
	let snapshot: any;
	if (!fastMode) {
		snapshot = await getTreasurySnapshot({
			projectRoot,
			wallet: TREASURY_WALLET,
			rpcUrl,
			startBlock,
			cacheTtlMs: 0,
			tokenAllowlist: TOKEN_ALLOWLIST,
		});
		console.log(`[treasury:snapshot] log-scan positions=${(snapshot.positions ?? []).length} notes=${(snapshot.notes ?? []).length} (${Date.now() - t0}ms)`);
	} else {
		console.log(`[treasury:snapshot] fast_mode=1 (skip log scan; balances only)`);
		snapshot = { wallet: TREASURY_WALLET, positions: [], notes: ['fast_mode: balances-only (log scan skipped)'] };
		// note: we add native ETH rows later in the pipeline (by chain), so we don’t double-count here.
	}
	(snapshot as any).wallets = TREASURY_WALLETS;
	console.log(`[treasury:snapshot] fast mode init done, positions=${(snapshot.positions ?? []).length} (${Date.now() - t0}ms)`);

	// Ensure current balances are present even if acquired before the scan window (primary wallet)
	const existing = new Set((snapshot.positions ?? []).map((p) => (p.token ?? '').toLowerCase()));
	let primaryCount = 0;
	for (const token of TOKEN_ALLOWLIST) {
		if (existing.has(token)) continue;
		primaryCount++;
		console.log(`[treasury:snapshot] primary token ${primaryCount}/${TOKEN_ALLOWLIST.length}: ${token}`);
		const [meta, balRaw, px] = await Promise.all([erc20Meta(token), erc20Balance(token, TREASURY_WALLET), dexscreenerPriceUsd(token)]);
		if (balRaw <= 0n) continue;
		const balance = formatUnits(balRaw, meta.decimals);
		const balanceNum = Number(balance);
		const fmvUsd = px != null && Number.isFinite(balanceNum) ? balanceNum * px : undefined;
		snapshot.positions.push({
			token,
			symbol: normalizeDisplaySymbol(meta.symbol),
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

	// Add secondary wallets as balance-only overlays (keeps the primary wallet lot/accounting logic intact)
	const secondaryWallets = TREASURY_WALLETS.slice(1);
	console.log(`[treasury:snapshot] primary balances done, starting secondary overlay (${secondaryWallets.length} wallets)`);
	if (secondaryWallets.length) console.log(`[treasury:snapshot] overlay secondary wallets=${secondaryWallets.join(',')}`);
	let overlayCount = 0;
	for (const w of secondaryWallets) {
		console.log(`[treasury:snapshot] overlay wallet=${w}`);
		for (const token of TOKEN_ALLOWLIST) {
			overlayCount++;
			if (overlayCount % 5 === 0) console.log(`[treasury:snapshot] overlay progress ${overlayCount}/${secondaryWallets.length * TOKEN_ALLOWLIST.length}`);
			const [meta, balRaw, px] = await Promise.all([erc20Meta(token), erc20Balance(token, w), dexscreenerPriceUsd(token)]);
			if (balRaw <= 0n) continue;
			const bal = formatUnits(balRaw, meta.decimals);
			const balNum = Number(bal);
			const addFmv = px != null && Number.isFinite(balNum) ? balNum * px : undefined;
			const cur = (snapshot.positions ?? []).find((p: any) => (p.token ?? '').toLowerCase() === token.toLowerCase());
			if (cur) {
				try {
					cur.balance = String(Number(cur.balance ?? 0) + balNum);
				} catch {}
				if (typeof addFmv === 'number') cur.fmvUsd = (cur.fmvUsd ?? 0) + addFmv;
			} else {
				snapshot.positions.push({
					token,
					symbol: normalizeDisplaySymbol(meta.symbol),
					name: meta.name,
					decimals: meta.decimals,
					balance: bal,
					balanceRaw: balRaw.toString(),
					entryTimestamp: undefined,
					costEth: '0',
					costEthWei: '0',
					costUsd: undefined,
					priceUsd: px ?? undefined,
					fmvUsd: addFmv,
					pnlUsd: undefined,
				});
			}
		}
	}
	(snapshot.positions ?? []).sort((a: any, b: any) => (b.fmvUsd ?? 0) - (a.fmvUsd ?? 0));

	// Build rows (apply hard-coded rules for fee-derived assets)
	let rows = (snapshot.positions ?? [])
		.filter((p: any) => (p.token ?? '').toLowerCase() !== '0x4200000000000000000000000000000000000006') // avoid duplicate WETH row
		.filter((p: any) => (p.fmvUsd ?? 0) >= 100 || (p.token ?? '').toLowerCase() === SBNKR_TOKEN)
		.map((p: any) => {
			const token = (p.token ?? '').toLowerCase();
			p.chain = 'base';
			p.chainId = 8453;
			const hardZero = HARD_CODED_ZERO_COST_TOKENS.has(token);
			const entryDate = hardZero ? FEE_ENTRY_DATE : fmtDateFromSec(p.entryTimestamp);
			const costBasisUsd = hardZero ? 0 : (p.costUsd ?? null);
			const costBasisEth = hardZero ? '0' : (p.costEth ?? null);
			const pnlUsd = (p.fmvUsd ?? null) != null && costBasisUsd != null ? (p.fmvUsd - costBasisUsd) : (p.pnlUsd ?? null);
			const lots = !hardZero && Array.isArray(p.lots)
				? p.lots.map((l: any) => ({
					txHash: l.txHash,
					blockNumber: l.blockNumber,
					entryDate: l.timestamp ? fmtDateFromSec(l.timestamp) : null,
					qty: l.qty,
					costBasisEth: l.costEth ?? null,
					costBasisUsd: l.costUsd ?? null,
				}))
				: null;
			return {
				chain: p.chain ?? 'base',
				chainId: p.chainId ?? 8453,
				symbol: normalizeDisplaySymbol(p.symbol),
				token: p.token,
				balance: p.balance,
				entryDate,
				costBasisUsd,
				costBasisEth,
				fmvUsd: p.fmvUsd ?? null,
				pnlUsd,
				lots,
			};
		});

	// Optional: override lot-level cost basis using Arkham's per-transaction USD outflows.
	await applyArkhamLotCostBasisOverrides(projectRoot, TREASURY_WALLET, rows);

	// Ensure WETH is always computed from a reliable ETH/USD source
	const WETH = '0x4200000000000000000000000000000000000006';
	let wethBalRaw = 0n;
	for (const w of TREASURY_WALLETS) {
		wethBalRaw += await erc20Balance(WETH, w);
	}
	const wethMeta = await erc20Meta(WETH);
	let wethBal = wethBalRaw > 0n ? formatUnits(wethBalRaw, wethMeta.decimals) : '0';
	// Some public RPCs incorrectly return 0 for balanceOf under load; BaseScan is the fallback source of truth.
	if (wethBalRaw === 0n) {
		// fallback: sum balances across wallets via BaseScan
		let bsSum = 0;
		for (const w of TREASURY_WALLETS) {
			const bs = await basescanTokenBalance(WETH, w, 'WETH');
			if (bs != null) bsSum += bs;
		}
		const bs = bsSum;
		if (bs != null && bs > 0) {
			wethBal = String(bs);
			wethBalRaw = BigInt(Math.floor(bs * 1e6)) * 10n ** 12n; // approximate to 18 decimals
		}
	}
	const wethBalNum = Number(wethBal);
	let ethPx = await dexscreenerPriceUsd(WETH);
	if (ethPx == null) ethPx = await chainlinkEthUsdLatest();

	// manual: nft holdings (held at cost basis unless we add a pricing feed)
	// cryptopunks (ethereum mainnet)
	if (ethPx != null) {
		const cryptopunkTxBlock = await txBlockNumberByHashEthereum(CRYPTOPUNK_PURCHASE_TX);
		const cryptopunkEntryEthPx = cryptopunkTxBlock != null ? await chainlinkEthUsdAtBlock(cryptopunkTxBlock, 'eth') : null;
		const cryptopunkEntryDate = CRYPTOPUNK_ENTRY_DATE;
		const cryptopunkCostBasisEthUsd = cryptopunkEntryEthPx != null ? cryptopunkEntryEthPx : CRYPTOPUNK_PURCHASE_ETH_PRICE_USD;
		const cryptopunkCostBasisUsd = priorCryptopunkCostBasisUsd ?? (cryptopunkCostBasisEthUsd * 33);
		rows.push({
			chain: 'ethereum',
			chainId: 1,
			symbol: 'cryptopunk #5730',
			token: null,
			balance: '1',
			entryDate: cryptopunkEntryDate,
			costBasisUsd: cryptopunkCostBasisUsd,
			costBasisEth: '33',
			fmvUsd: ethPx * 33,
			pnlUsd: ethPx * 33 - cryptopunkCostBasisUsd,
			link: 'https://www.cryptopunks.app/cryptopunks/details/5730',
			entryLink: `https://etherscan.io/tx/${CRYPTOPUNK_PURCHASE_TX}`,
		});
	}

	if (wethBalRaw > 0n) {
		const wethFmvUsd = ethPx != null && Number.isFinite(wethBalNum) ? wethBalNum * ethPx : null;
		rows.push({
			chain: 'base',
			chainId: 8453,
			symbol: normalizeDisplaySymbol('WETH'),
			token: WETH,
			balance: wethBal,
			entryDate: FEE_ENTRY_DATE,
			costBasisUsd: 0,
			costBasisEth: '0',
			fmvUsd: wethFmvUsd,
			pnlUsd: wethFmvUsd,
		});
	}

	// Add native ETH rows by chain (FMV from current ETH/USD)
	const ethQtyBase = (await Promise.all(TREASURY_WALLETS.map((w) => ethBalanceBase(w)))).reduce((a, b) => a + b, 0);
	const ethFmvUsdBase = ethPx != null ? ethQtyBase * ethPx : null;
	if ((ethFmvUsdBase ?? 0) >= 100) {
		rows.push({
			chain: 'base',
			chainId: 8453,
			symbol: 'ETH',
			token: null,
			balance: String(ethQtyBase),
			entryDate: ETH_ENTRY_DATE,
			costBasisUsd: null,
			costBasisEth: null,
			fmvUsd: ethFmvUsdBase,
			pnlUsd: null,
		});
	}

	const ethQtyEthereum = (await Promise.all(TREASURY_WALLETS.map((w) => ethBalanceEthereum(w)))).reduce((a, b) => a + b, 0);
	const ethFmvUsdEthereum = ethPx != null ? ethQtyEthereum * ethPx : null;
	if ((ethFmvUsdEthereum ?? 0) >= 100) {
		rows.push({
			chain: 'ethereum',
			chainId: 1,
			symbol: 'ETH',
			token: null,
			balance: String(ethQtyEthereum),
			entryDate: ETH_ENTRY_DATE,
			costBasisUsd: null,
			costBasisEth: null,
			fmvUsd: ethFmvUsdEthereum,
			pnlUsd: null,
		});
	}

	// USDC on Ethereum mainnet (hard wallet)
	const USDC_ETH_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
	const USDC_DECIMALS = 6;
	const usdcRawEthereum = (await Promise.all(TREASURY_WALLETS.map((w) => erc20BalanceEthereum(USDC_ETH_MAINNET, w)))).reduce((a, b) => a + b, 0n);
	if (usdcRawEthereum > 0n) {
		const usdcBal = Number(usdcRawEthereum) / 10 ** USDC_DECIMALS;
		rows.push({
			chain: 'ethereum',
			chainId: 1,
			symbol: 'USDC',
			token: USDC_ETH_MAINNET.toLowerCase(),
			balance: String(usdcBal),
			entryDate: null,
			costBasisUsd: usdcBal, // USDC is 1:1 USD
			costBasisEth: null,
			fmvUsd: usdcBal,
			pnlUsd: 0,
			link: `https://etherscan.io/token/${USDC_ETH_MAINNET}`,
		});
	}

	// USDC on Base
	const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'.toLowerCase();
	const usdcRawBase = (await Promise.all(TREASURY_WALLETS.map((w) => erc20Balance(USDC_BASE, w)))).reduce((a, b) => a + b, 0n);
	if (usdcRawBase > 0n) {
		const usdcBalBase = Number(usdcRawBase) / 10 ** USDC_DECIMALS;
		rows.push({
			chain: 'base',
			chainId: 8453,
			symbol: 'USDC',
			token: USDC_BASE,
			balance: String(usdcBalBase),
			entryDate: null,
			costBasisUsd: usdcBalBase,
			costBasisEth: null,
			fmvUsd: usdcBalBase,
			pnlUsd: 0,
		});
	}

	// Price sBNKR as BNKR with a 1000:1 split (1 sBNKR = 1000 BNKR).
	let bnkrPriceUsd = (snapshot.positions ?? []).find((p: any) => (p.token ?? '').toLowerCase() === BNKR_TOKEN)?.priceUsd ?? null;
	if (bnkrPriceUsd == null) bnkrPriceUsd = await dexscreenerPriceUsd(BNKR_TOKEN);
	const bnkrUnitCostUsdFromRows = (() => {
		const bnkrRow = rows.find((r: any) => (r.token ?? '').toLowerCase() === BNKR_TOKEN);
		if (!bnkrRow) return null;
		const bal = Number(bnkrRow.balance);
		const cb = Number(bnkrRow.costBasisUsd);
		if (!Number.isFinite(bal) || bal <= 0 || !Number.isFinite(cb) || cb <= 0) return null;
		return cb / bal;
	})();
	const sbnkrUnitCostUsd = (bnkrUnitCostUsdFromRows ?? ORIGINAL_BNKR_SWAP_PRICE_USD) * BNKR_PER_SBNKR;
	for (const r of rows) {
		if ((r.token ?? '').toLowerCase() === SBNKR_TOKEN) {
			r.symbol = 'sBNKR';
			const bal = Number(r.balance);
			if (bnkrPriceUsd != null && Number.isFinite(bal)) {
				r.fmvUsd = (bal * BNKR_PER_SBNKR) * bnkrPriceUsd;
			}
			if ((r.costBasisUsd == null) && Number.isFinite(bal)) {
				r.costBasisUsd = bal * sbnkrUnitCostUsd;
			}
			if (r.fmvUsd != null && r.costBasisUsd != null) r.pnlUsd = r.fmvUsd - r.costBasisUsd;

			// Lots: sBNKR was staked in multiple lots. In fast_mode we intentionally skip large log scans.
			// Prefer (1) manual override, (2) prior snapshot lots, and only then (3) best-effort onchain log scan.
			if (!Array.isArray(r.lots) || r.lots.length === 0) {
				let derivedLots: any[] | null = null;

				// 1) Manual override file (cheap, deterministic)
				try {
					const overridePath = path.join(projectRoot, 'public', 'treasury.sbnkr-lots.json');
					const overrideRaw = await fs.readFile(overridePath, 'utf8');
					const override = JSON.parse(overrideRaw);
					if (Array.isArray(override.lots) && override.lots.length > 0) {
						console.log('sBNKR lots: using manual override');
						derivedLots = override.lots;
					}
				} catch {
					// no override file
				}

				// 2) Prior snapshot lots (avoid transient RPC/log issues)
				if (!derivedLots || derivedLots.length === 0) {
					try {
						const priorRaw = await fs.readFile(path.join(projectRoot, 'public', 'treasury.snapshot.json'), 'utf8');
						const prior = JSON.parse(priorRaw) as any;
						const priorRow = (prior?.rows ?? []).find((x: any) => (x?.token ?? '').toLowerCase() === SBNKR_TOKEN);
						if (Array.isArray(priorRow?.lots) && priorRow.lots.length > 0) {
							console.log('sBNKR lots: inherited from prior snapshot');
							derivedLots = priorRow.lots;
						}
					} catch {
						// no prior snapshot
					}
				}

				// 3) Onchain log scan (expensive). Skip when TREASURY_FAST_MODE=1.
				const fastModeNow = String(process.env.TREASURY_FAST_MODE ?? '1') === '1';
				if ((!derivedLots || derivedLots.length === 0) && !fastModeNow) {
					try {
						const latestHex = await rpcCall('eth_blockNumber', []);
						const latest = Number(BigInt(latestHex));
						const meta = await erc20Meta(SBNKR_TOKEN);
						const rawLots = await inboundErc20Lots(SBNKR_TOKEN, TREASURY_WALLET, { fromBlock: TREASURY_START_BLOCK, toBlock: latest });
						const qtys = rawLots.map((l) => ({ ...l, qtyDec: Number(formatUnits(BigInt(l.qty), meta.decimals)) }));
						const sumQty = qtys.reduce((s, l) => s + (Number.isFinite(l.qtyDec) ? l.qtyDec : 0), 0);
						const totalCb = typeof r.costBasisUsd === 'number' ? r.costBasisUsd : null;
						derivedLots = qtys
							.filter((l) => l.qtyDec > 0)
							.sort((a, b) => a.blockNumber - b.blockNumber)
							.map((l) => ({
								txHash: l.txHash,
								blockNumber: l.blockNumber,
								entryDate: l.entryDate,
								qty: String(l.qtyDec),
								costBasisUsd: totalCb != null && sumQty > 0 ? (totalCb * (l.qtyDec / sumQty)) : null,
								costBasisEth: null,
							}));
					} catch {
						// ignore log scan errors
					}
				}

				if (derivedLots && derivedLots.length > 0) {
					r.lots = derivedLots;
				}
			}
		}
	}

	// Consolidate multi-chain positions into single rows for a simpler dashboard.
	// ETH/WETH → single "ETH" row; USDC → single "USDC" row.
	function consolidateBySymbol(rows: any[], matchFn: (sym: string) => boolean, outputSymbol: string) {
		const matched = rows.filter((r: any) => matchFn(String(r.symbol ?? '').toLowerCase()));
		if (matched.length <= 1) return rows;
		const rest = rows.filter((r: any) => !matchFn(String(r.symbol ?? '').toLowerCase()));
		let totalBal = 0;
		let totalFmv = 0;
		let totalCost: number | null = null;
		let earliestEntry: string | null = null;
		for (const r of matched) {
			totalBal += Number(r.balance) || 0;
			totalFmv += r.fmvUsd ?? 0;
			if (r.costBasisUsd != null) totalCost = (totalCost ?? 0) + r.costBasisUsd;
			if (r.entryDate && (!earliestEntry || r.entryDate < earliestEntry)) earliestEntry = r.entryDate;
		}
		rest.push({
			chain: 'all',
			chainId: null,
			symbol: outputSymbol,
			token: null,
			balance: String(totalBal),
			entryDate: earliestEntry,
			costBasisUsd: totalCost,
			costBasisEth: totalCost != null ? '0' : null,
			fmvUsd: totalFmv,
			pnlUsd: totalCost != null ? totalFmv - totalCost : null,
		});
		return rest;
	}

	rows = consolidateBySymbol(rows, (s) => s === 'eth' || s === 'weth', 'ETH');
	rows = consolidateBySymbol(rows, (s) => s === 'usdc', 'USDC');

	// Guard against transient inference regressions by inheriting prior accounting fields
	// for critical tokens when current run drops them.
	try {
		const priorRaw = await fs.readFile(path.join(projectRoot, 'public', 'treasury.snapshot.json'), 'utf8');
		const prior = JSON.parse(priorRaw) as any;
		applyPriorAccountingFallback(rows, Array.isArray(prior?.rows) ? prior.rows : []);
	} catch {
		// no prior snapshot available; continue
	}

	rows = rows.sort((a: any, b: any) => (b.fmvUsd ?? 0) - (a.fmvUsd ?? 0));

	const totalUsd = rows.reduce((s: number, r: any) => s + (r.fmvUsd ?? 0), 0);

	const out = {
		updatedAtMs: Date.now(),
		updatedAt: new Date().toISOString(),
		date: dayISO(Date.now()),
		wallet: TREASURY_WALLET,
		wallets: TREASURY_WALLETS,
		basescan: `https://basescan.org/address/${TREASURY_WALLET}`,
		basescans: TREASURY_WALLETS.map((w) => `https://basescan.org/address/${w}`),
		etherscan: `https://etherscan.io/address/${TREASURY_WALLETS[TREASURY_WALLETS.length - 1]}`,
		rows,
		totalUsd,
		notes: snapshot.notes,
		method: {
			entryAndCostBasis:
				'derived-from-onchain-transfer-logs (token<->WETH pairing) with token allowlist; fee-derived $ANTIHUNTER and $WETH are hard-coded as entry=2026-02-06 and cost basis $0. Native ETH rows are balance-only (entry/cost basis not inferred) until we implement attribution. Optional override: if public/treasury.arkham.alltx.json OR public/treasury.arkham.transfers.json exists, lot-level costBasisUsd may be replaced using Arkham per-tx USD outflows (WETH/ANTIHUNTER) when the txHash maps unambiguously to a single token row.',
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
