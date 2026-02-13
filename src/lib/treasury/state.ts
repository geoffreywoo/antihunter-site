import fs from 'node:fs/promises';
import path from 'node:path';

export type LotState = {
	txHash: string;
	blockNumber: number;
	timestamp?: number;
	qtyRaw: string; // bigint serialized
	costEthWei: string; // bigint serialized
};

export type TokenPositionState = {
	decimals?: number;
	symbol?: string;
	name?: string;
	qtyRaw: string; // bigint serialized (remaining qty inferred from scanned logs)
	costEthWei: string; // bigint serialized (remaining cost basis, ETH/WETH)
	entryBlock?: number;
	entryTimestamp?: number;
	lots?: LotState[]; // acquisition tranches (FIFO reduced on sells)
};

export type TreasuryCacheState = {
	version: 4;
	chainId: number;
	wallet: string;
	rpcUrl: string;
	startBlock: number;
	lastScannedBlock: number;
	updatedAtMs: number;
	positions: Record<string, TokenPositionState>; // tokenAddress -> state
	prices?: Record<string, { priceUsd: number; updatedAtMs: number }>; // tokenAddress -> cached price
	ethPriceUsd?: { priceUsd: number; updatedAtMs: number };
};

export async function ensureDir(dirPath: string) {
	await fs.mkdir(dirPath, { recursive: true });
}

export function defaultCachePath(projectRoot: string): string {
	return path.join(projectRoot, '.astro', 'treasury', 'cache.base.json');
}

export async function loadCache(cachePath: string): Promise<TreasuryCacheState | null> {
	try {
		const txt = await fs.readFile(cachePath, 'utf8');
		return JSON.parse(txt) as TreasuryCacheState;
	} catch {
		return null;
	}
}

export async function saveCache(cachePath: string, state: TreasuryCacheState) {
	await ensureDir(path.dirname(cachePath));
	await fs.writeFile(cachePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
}
