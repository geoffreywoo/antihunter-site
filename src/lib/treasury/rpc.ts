export type JsonRpcResponse<T> = { jsonrpc: '2.0'; id: number; result?: T; error?: { code: number; message: string; data?: unknown } };

export function toHexBlock(blockNumber: number): string {
	if (!Number.isFinite(blockNumber) || blockNumber < 0) throw new Error(`invalid blockNumber: ${blockNumber}`);
	return '0x' + blockNumber.toString(16);
}

export async function rpcCall<T>(
	rpcUrl: string,
	method: string,
	params: unknown[],
	{ timeoutMs = 20_000, retries = 3 }: { timeoutMs?: number; retries?: number } = {},
): Promise<T> {
	let lastErr: any = null;
	for (let attempt = 0; attempt <= retries; attempt++) {
		const controller = new AbortController();
		const t = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const res = await fetch(rpcUrl, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
				signal: controller.signal,
			});
			const text = await res.text();
			if (!res.ok) {
				lastErr = new Error(`rpc http ${res.status}: ${text}`);
				if (res.status === 429 && attempt < retries) {
					await new Promise((r) => setTimeout(r, 250 * (attempt + 1) ** 2));
					continue;
				}
				throw lastErr;
			}
			const json = JSON.parse(text) as JsonRpcResponse<T>;
			if (json.error) {
				lastErr = new Error(`rpc ${method} error ${json.error.code}: ${json.error.message}`);
				const msg = `${json.error.code}:${json.error.message}`.toLowerCase();
				if ((msg.includes('rate') || msg.includes('over')) && attempt < retries) {
					await new Promise((r) => setTimeout(r, 250 * (attempt + 1) ** 2));
					continue;
				}
				throw lastErr;
			}
			if (json.result === undefined) throw new Error(`rpc ${method} missing result`);
			return json.result;
		} catch (e) {
			lastErr = e;
			if (attempt < retries) {
				await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
				continue;
			}
			throw e;
		} finally {
			clearTimeout(t);
		}
	}
	throw lastErr;
}
