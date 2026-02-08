const DEX_TOKEN_URL = 'https://api.dexscreener.com/latest/dex/tokens/';

export type DexPair = {
	chainId?: string;
	dexId?: string;
	url?: string;
	liquidity?: { usd?: number };
	priceUsd?: string;
	baseToken?: { address?: string; symbol?: string; name?: string };
	quoteToken?: { address?: string; symbol?: string; name?: string };
};

export async function fetchDexPairsForToken(tokenAddress: string): Promise<DexPair[]> {
	const url = `${DEX_TOKEN_URL}${tokenAddress}`;
	const res = await fetch(url, { headers: { accept: 'application/json' } });
	if (!res.ok) throw new Error(`dexscreener http ${res.status}: ${await res.text()}`);
	const json = (await res.json()) as { pairs?: DexPair[] };
	return json.pairs ?? [];
}

export function pickBestBasePair(pairs: DexPair[]): DexPair | null {
	const basePairs = pairs.filter((p) => (p.chainId ?? '').toLowerCase() === 'base');
	if (!basePairs.length) return null;
	basePairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
	return basePairs[0] ?? null;
}

export function parseUsdPrice(p: DexPair | null): number | null {
	if (!p?.priceUsd) return null;
	const n = Number(p.priceUsd);
	return Number.isFinite(n) ? n : null;
}
