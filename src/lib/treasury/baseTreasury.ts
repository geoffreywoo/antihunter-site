import { rpcCall, toHexBlock } from './rpc.js';
import {
	decodeAddressTopic,
	decodeAbiString,
	encodeDecimalsCall,
	encodeNameCall,
	encodeSymbolCall,
	hexToBigInt,
	padAddressTopic,
	readUint256,
} from './abi.js';
import { defaultCachePath, loadCache, saveCache, type TreasuryCacheState } from './state.js';
import { fetchDexPairsForToken, parseUsdPrice, pickBestBasePair } from './dexscreener.js';

// Base canonical WETH address
export const BASE_WETH = '0x4200000000000000000000000000000000000006';

// keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

type RpcLog = {
	address: string;
	topics: string[];
	data: string;
	blockNumber: string;
	transactionHash: string;
	logIndex: string;
};

type TokenPosition = {
	token: string;
	symbol: string;
	name?: string;
	decimals: number;
	balance: string;
	balanceRaw: string;
	entryTimestamp?: number;
	costEth: string;
	costEthWei: string;
	costUsd?: number;
	priceUsd?: number;
	fmvUsd?: number;
	pnlUsd?: number;
};

export type TreasuryResponse = {
	chainId: number;
	wallet: string;
	lastScannedBlock: number;
	updatedAtMs: number;
	wethAddress: string;
	ethPriceUsd?: number;
	positions: TokenPosition[];
	notes: string[];
};

function formatUnits(raw: bigint, decimals: number): string {
	const neg = raw < 0n;
	const v = neg ? -raw : raw;
	const base = 10n ** BigInt(decimals);
	const i = v / base;
	const f = v % base;
	if (f === 0n) return (neg ? '-' : '') + i.toString();
	let frac = f.toString().padStart(decimals, '0');
	frac = frac.replace(/0+$/g, '');
	return (neg ? '-' : '') + i.toString() + '.' + frac;
}

function toNumberSafe(x: string): number {
	const n = Number(x);
	return Number.isFinite(n) ? n : 0;
}

async function getChainId(rpcUrl: string): Promise<number> {
	const hex = await rpcCall<string>(rpcUrl, 'eth_chainId', []);
	return Number(BigInt(hex));
}

async function getLatestBlockNumber(rpcUrl: string): Promise<number> {
	const hex = await rpcCall<string>(rpcUrl, 'eth_blockNumber', []);
	return Number(BigInt(hex));
}

async function getBlockTimestamp(rpcUrl: string, blockNumber: number): Promise<number> {
	const block = await rpcCall<{ timestamp: string }>(rpcUrl, 'eth_getBlockByNumber', [toHexBlock(blockNumber), false]);
	return Number(BigInt(block.timestamp));
}

async function ethCall(rpcUrl: string, to: string, data: string): Promise<string> {
	return rpcCall<string>(rpcUrl, 'eth_call', [{ to, data }, 'latest']);
}

async function getErc20Decimals(rpcUrl: string, token: string): Promise<number> {
	const res = await ethCall(rpcUrl, token, encodeDecimalsCall());
	return Number(readUint256(res, 0));
}

async function getErc20Symbol(rpcUrl: string, token: string): Promise<string> {
	try {
		const res = await ethCall(rpcUrl, token, encodeSymbolCall());
		const s = decodeAbiString(res);
		return s || 'TOKEN';
	} catch {
		return 'TOKEN';
	}
}

async function getErc20Name(rpcUrl: string, token: string): Promise<string | undefined> {
	try {
		const res = await ethCall(rpcUrl, token, encodeNameCall());
		const s = decodeAbiString(res);
		return s || undefined;
	} catch {
		return undefined;
	}
}

function normalizeWeight(qtyRawAbs: bigint, decimals: number): bigint {
	// normalize to 18 decimals for weighting allocations.
	if (decimals === 18) return qtyRawAbs;
	if (decimals < 18) return qtyRawAbs * 10n ** BigInt(18 - decimals);
	// decimals > 18: downscale (lossy). Rare.
	return qtyRawAbs / 10n ** BigInt(decimals - 18);
}

async function getLogsChunk(rpcUrl: string, fromBlock: number, toBlock: number, topics: (string | null)[]): Promise<RpcLog[]> {
	try {
		return await rpcCall<RpcLog[]>(rpcUrl, 'eth_getLogs', [
			{
				fromBlock: toHexBlock(fromBlock),
				toBlock: toHexBlock(toBlock),
				topics,
			},
		]);
	} catch (e) {
		// If the range is too big, caller can bisect.
		throw e;
	}
}

async function scanTransfersIncremental(state: TreasuryCacheState, { maxChunkBlocks = 2000 }: { maxChunkBlocks?: number } = {}) {
	const wallet = state.wallet.toLowerCase();
	const walletTopic = padAddressTopic(wallet);
	const latest = await getLatestBlockNumber(state.rpcUrl);

	if (state.lastScannedBlock >= latest) return;

	let from = state.lastScannedBlock + 1;
	while (from <= latest) {
		let to = Math.min(latest, from + maxChunkBlocks - 1);
		let ok = false;
		while (!ok) {
			try {
				const [incoming, outgoing] = await Promise.all([
					getLogsChunk(state.rpcUrl, from, to, [TRANSFER_TOPIC0, null, walletTopic]),
					getLogsChunk(state.rpcUrl, from, to, [TRANSFER_TOPIC0, walletTopic, null]),
				]);
				await processTransferLogs(state, [...incoming, ...outgoing]);
				state.lastScannedBlock = to;
				ok = true;
			} catch (e: any) {
				const span = to - from;
				if (span <= 10) throw e;
				// bisect if provider complains about response size/timeouts
				to = from + Math.max(10, Math.floor(span / 2));
			}
		}
		from = state.lastScannedBlock + 1;
	}
}

async function processTransferLogs(state: TreasuryCacheState, logs: RpcLog[]) {
	if (!logs.length) return;
	logs.sort((a, b) => Number(BigInt(a.blockNumber) - BigInt(b.blockNumber)) || Number(BigInt(a.logIndex) - BigInt(b.logIndex)));

	// group by tx hash
	const byTx = new Map<string, RpcLog[]>();
	for (const l of logs) {
		const h = l.transactionHash;
		const arr = byTx.get(h);
		if (arr) arr.push(l);
		else byTx.set(h, [l]);
	}

	for (const [txHash, txLogs] of byTx.entries()) {
		// aggregate deltas per token
		const deltas = new Map<string, bigint>();
		let blockNum = 0;
		for (const l of txLogs) {
			blockNum = Number(BigInt(l.blockNumber));
			if (l.topics[0]?.toLowerCase() !== TRANSFER_TOPIC0) continue;
			if (l.topics.length < 3) continue;
			const from = decodeAddressTopic(l.topics[1]);
			const to = decodeAddressTopic(l.topics[2]);
			const value = hexToBigInt(l.data);
			if (value === 0n) continue;
			let delta = 0n;
			if (to.toLowerCase() === state.wallet.toLowerCase()) delta += value;
			if (from.toLowerCase() === state.wallet.toLowerCase()) delta -= value;
			if (delta === 0n) continue;
			const token = l.address.toLowerCase();
			deltas.set(token, (deltas.get(token) ?? 0n) + delta);
		}

		if (!deltas.size) continue;
		const wethDelta = deltas.get(BASE_WETH.toLowerCase()) ?? 0n;
		// Also incorporate ETH spent via tx.value if any and it looks like a buy.
		let txValueWei = 0n;
		try {
			const tx = await rpcCall<{ value: string }>(state.rpcUrl, 'eth_getTransactionByHash', [txHash]);
			txValueWei = tx?.value ? BigInt(tx.value) : 0n;
		} catch {
			// ignore
		}

		// Candidate tokens (exclude WETH and zero deltas)
		const tokenDeltas = [...deltas.entries()]
			.filter(([token, d]) => token !== BASE_WETH.toLowerCase() && d !== 0n)
			.map(([token, d]) => ({ token, delta: d }));
		if (!tokenDeltas.length) continue;

		// Ensure decimals/symbol for any newly seen token
		for (const t of tokenDeltas) {
			const p = state.positions[t.token];
			if (!p || p.decimals === undefined) {
				const decimals = await getErc20Decimals(state.rpcUrl, t.token);
				const symbol = await getErc20Symbol(state.rpcUrl, t.token);
				const name = await getErc20Name(state.rpcUrl, t.token);
				state.positions[t.token] = {
					...(p ?? { qtyRaw: '0', costEthWei: '0' }),
					decimals,
					symbol,
					name,
				};
			}
		}

		// Determine if tx is a buy or sell using WETH delta (or ETH tx.value as fallback for buys)
		const ethSpentWei = wethDelta < 0n ? -wethDelta : 0n;
		const ethReceivedWei = wethDelta > 0n ? wethDelta : 0n;

		const hasBuy = tokenDeltas.some((t) => t.delta > 0n);
		const hasSell = tokenDeltas.some((t) => t.delta < 0n);

		// Fetch block timestamp once if needed
		let ts: number | undefined;
		if (hasBuy) {
			try {
				ts = await getBlockTimestamp(state.rpcUrl, blockNum);
			} catch {
				// ignore
			}
		}

		if (ethSpentWei > 0n && hasBuy) {
			// Allocate ETH cost across tokens received proportional to normalized received amount
			const received = tokenDeltas.filter((t) => t.delta > 0n);
			let totalWeight = 0n;
			for (const r of received) {
				const dec = state.positions[r.token]!.decimals ?? 18;
				totalWeight += normalizeWeight(r.delta, dec);
			}
			for (const r of received) {
				const st = state.positions[r.token]!;
				const dec = st.decimals ?? 18;
				const w = normalizeWeight(r.delta, dec);
				const alloc = totalWeight > 0n ? (ethSpentWei * w) / totalWeight : 0n;
				const prevQty = BigInt(st.qtyRaw);
				const prevCost = BigInt(st.costEthWei);
				st.qtyRaw = (prevQty + r.delta).toString();
				st.costEthWei = (prevCost + alloc).toString();
				if (!st.entryTimestamp && ts) {
					st.entryTimestamp = ts;
					st.entryBlock = blockNum;
				}
			}
		}

		// ETH buys where router spends native ETH (no WETH delta); use tx.value as approximate cost.
		if (ethSpentWei === 0n && txValueWei > 0n && hasBuy) {
			const received = tokenDeltas.filter((t) => t.delta > 0n);
			let totalWeight = 0n;
			for (const r of received) {
				const dec = state.positions[r.token]!.decimals ?? 18;
				totalWeight += normalizeWeight(r.delta, dec);
			}
			for (const r of received) {
				const st = state.positions[r.token]!;
				const dec = st.decimals ?? 18;
				const w = normalizeWeight(r.delta, dec);
				const alloc = totalWeight > 0n ? (txValueWei * w) / totalWeight : 0n;
				const prevQty = BigInt(st.qtyRaw);
				const prevCost = BigInt(st.costEthWei);
				st.qtyRaw = (prevQty + r.delta).toString();
				st.costEthWei = (prevCost + alloc).toString();
				if (!st.entryTimestamp && ts) {
					st.entryTimestamp = ts;
					st.entryBlock = blockNum;
				}
			}
		}

		if (ethReceivedWei > 0n && hasSell) {
			// Allocate proceeds across tokens sold by proportional normalized sold amount, but we only need to reduce cost basis.
			for (const s of tokenDeltas.filter((t) => t.delta < 0n)) {
				const st = state.positions[s.token]!;
				const prevQty = BigInt(st.qtyRaw);
				const prevCost = BigInt(st.costEthWei);
				const soldAbs = -s.delta;
				if (prevQty <= 0n) continue;
				const newQty = prevQty - soldAbs;
				// reduce cost basis proportionally (avg cost)
				const costReduction = (prevCost * soldAbs) / prevQty;
				const newCost = prevCost - costReduction;
				st.qtyRaw = (newQty < 0n ? 0n : newQty).toString();
				st.costEthWei = (newCost < 0n ? 0n : newCost).toString();
				// If fully exited, reset entry markers (optional)
				if (newQty <= 0n) {
					st.entryTimestamp = undefined;
					st.entryBlock = undefined;
				}
			}
		}
	}
}

async function getEthPriceUsd(state: TreasuryCacheState): Promise<number | undefined> {
	const now = Date.now();
	if (state.ethPriceUsd && now - state.ethPriceUsd.updatedAtMs < 60_000) return state.ethPriceUsd.priceUsd;
	try {
		const pairs = await fetchDexPairsForToken(BASE_WETH);
		const best = pickBestBasePair(pairs);
		const px = parseUsdPrice(best);
		if (px !== null) {
			state.ethPriceUsd = { priceUsd: px, updatedAtMs: now };
			return px;
		}
	} catch {
		// ignore
	}
	return state.ethPriceUsd?.priceUsd;
}

async function getTokenPriceUsd(state: TreasuryCacheState, token: string): Promise<number | undefined> {
	const now = Date.now();
	state.prices ??= {};
	const cached = state.prices[token];
	if (cached && now - cached.updatedAtMs < 60_000) return cached.priceUsd;
	try {
		const pairs = await fetchDexPairsForToken(token);
		const best = pickBestBasePair(pairs);
		const px = parseUsdPrice(best);
		if (px !== null) {
			state.prices[token] = { priceUsd: px, updatedAtMs: now };
			// also hydrate symbol/name opportunistically
			const base = best?.baseToken?.address?.toLowerCase();
			if (base && state.positions[base]) {
				state.positions[base].symbol ||= best?.baseToken?.symbol;
				state.positions[base].name ||= best?.baseToken?.name;
			}
			return px;
		}
	} catch {
		// ignore
	}
	return cached?.priceUsd;
}

export async function getTreasurySnapshot({
	projectRoot,
	wallet,
	rpcUrl,
	startBlock,
	cacheTtlMs = 30_000,
}: {
	projectRoot: string;
	wallet: string;
	rpcUrl: string;
	startBlock: number;
	cacheTtlMs?: number;
}): Promise<TreasuryResponse> {
	const cachePath = defaultCachePath(projectRoot);
	const chainId = await getChainId(rpcUrl);
	const now = Date.now();
	let state = await loadCache(cachePath);

	if (!state || state.version !== 1 || state.chainId !== chainId || state.wallet.toLowerCase() !== wallet.toLowerCase() || state.rpcUrl !== rpcUrl) {
		state = {
			version: 1,
			chainId,
			wallet: wallet.toLowerCase(),
			rpcUrl,
			startBlock,
			lastScannedBlock: startBlock - 1,
			updatedAtMs: 0,
			positions: {},
		};
	}

	// return cached response if still fresh AND already caught up
	const latest = await getLatestBlockNumber(rpcUrl);
	if (state.updatedAtMs && now - state.updatedAtMs < cacheTtlMs && state.lastScannedBlock >= latest) {
		const response = await buildResponseFromState(state);
		return response;
	}

	await scanTransfersIncremental(state);
	state.updatedAtMs = now;
	await saveCache(cachePath, state);

	return buildResponseFromState(state);
}

async function buildResponseFromState(state: TreasuryCacheState): Promise<TreasuryResponse> {
	const notes: string[] = [];
	notes.push('Cost basis is inferred from on-chain ERC20 Transfer logs by pairing token in/out with WETH in/out within the same transaction.');
	notes.push('Native ETH swaps are partially inferred via tx.value only (internal ETH transfers are not captured).');
	notes.push('Airdrops/transfers without WETH/ETH flow are ignored for cost basis.');

	const ethPriceUsd = await getEthPriceUsd(state);
	const positions: TokenPosition[] = [];

	for (const [token, st] of Object.entries(state.positions)) {
		if (token === BASE_WETH.toLowerCase()) continue;
		const qty = BigInt(st.qtyRaw);
		if (qty <= 0n) continue;
		const decimals = st.decimals ?? 18;
		const symbol = st.symbol ?? 'TOKEN';
		const name = st.name;
		const balance = formatUnits(qty, decimals);
		const costEthWei = BigInt(st.costEthWei);
		const costEth = formatUnits(costEthWei, 18);

		const priceUsd = await getTokenPriceUsd(state, token);
		const balanceNum = toNumberSafe(balance);
		const fmvUsd = priceUsd !== undefined ? balanceNum * priceUsd : undefined;
		const costUsd = ethPriceUsd !== undefined ? toNumberSafe(costEth) * ethPriceUsd : undefined;
		const pnlUsd = fmvUsd !== undefined && costUsd !== undefined ? fmvUsd - costUsd : undefined;

		positions.push({
			token,
			symbol,
			name,
			decimals,
			balance,
			balanceRaw: st.qtyRaw,
			entryTimestamp: st.entryTimestamp,
			costEth,
			costEthWei: st.costEthWei,
			costUsd,
			priceUsd,
			fmvUsd,
			pnlUsd,
		});
	}

	positions.sort((a, b) => (b.fmvUsd ?? 0) - (a.fmvUsd ?? 0));

	return {
		chainId: state.chainId,
		wallet: state.wallet,
		lastScannedBlock: state.lastScannedBlock,
		updatedAtMs: state.updatedAtMs,
		wethAddress: BASE_WETH,
		ethPriceUsd,
		positions,
		notes,
	};
}
