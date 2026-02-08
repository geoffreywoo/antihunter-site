export type JsonRpcResponse<T> = { jsonrpc: '2.0'; id: number; result?: T; error?: { code: number; message: string; data?: unknown } };

export function toHexBlock(blockNumber: number): string {
	if (!Number.isFinite(blockNumber) || blockNumber < 0) throw new Error(`invalid blockNumber: ${blockNumber}`);
	return '0x' + blockNumber.toString(16);
}

export async function rpcCall<T>(rpcUrl: string, method: string, params: unknown[], { timeoutMs = 20_000 }: { timeoutMs?: number } = {}): Promise<T> {
	const controller = new AbortController();
	const t = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(rpcUrl, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
			signal: controller.signal,
		});
		if (!res.ok) throw new Error(`rpc http ${res.status}: ${await res.text()}`);
		const json = (await res.json()) as JsonRpcResponse<T>;
		if (json.error) throw new Error(`rpc ${method} error ${json.error.code}: ${json.error.message}`);
		if (json.result === undefined) throw new Error(`rpc ${method} missing result`);
		return json.result;
	} finally {
		clearTimeout(t);
	}
}
