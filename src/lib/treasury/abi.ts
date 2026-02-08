export function strip0x(hex: string): string {
	return hex.startsWith('0x') ? hex.slice(2) : hex;
}

export function pad32(hexNo0x: string): string {
	return hexNo0x.padStart(64, '0');
}

export function padAddressTopic(address: string): string {
	const a = strip0x(address).toLowerCase();
	if (a.length !== 40) throw new Error(`invalid address: ${address}`);
	return '0x' + '0'.repeat(24) + a;
}

export function decodeAddressTopic(topic: string): string {
	const t = strip0x(topic);
	if (t.length !== 64) throw new Error(`invalid topic length: ${topic}`);
	return '0x' + t.slice(24).toLowerCase();
}

export function hexToBigInt(hex: string): bigint {
	const h = strip0x(hex);
	if (h === '') return 0n;
	return BigInt('0x' + h);
}

export function readUint256(hex: string, offsetBytes: number): bigint {
	const h = strip0x(hex);
	const start = offsetBytes * 2;
	const chunk = h.slice(start, start + 64);
	if (chunk.length !== 64) throw new Error('readUint256 out of range');
	return BigInt('0x' + chunk);
}

export function decodeAbiString(resultHex: string): string {
	// Standard ABI encoding for string:
	// 0x + 32 bytes offset + 32 bytes length + data
	// Some tokens return bytes32 instead; handle that too.
	const h = strip0x(resultHex);
	if (h.length === 64) {
		// bytes32, right-padded with zeros
		const bytes = Buffer.from(h, 'hex');
		return bytes.toString('utf8').replace(/\u0000+$/g, '').trim();
	}
	if (h.length < 128) return '';
	const offset = Number(readUint256('0x' + h, 0));
	const len = Number(readUint256('0x' + h, offset));
	const dataStart = (offset + 32) * 2;
	const dataHex = h.slice(dataStart, dataStart + len * 2);
	try {
		return Buffer.from(dataHex, 'hex').toString('utf8');
	} catch {
		return '';
	}
}

export function encodeDecimalsCall(): string {
	return '0x313ce567';
}

export function encodeSymbolCall(): string {
	return '0x95d89b41';
}

export function encodeNameCall(): string {
	return '0x06fdde03';
}

export function encodeBalanceOfCall(owner: string): string {
	const o = strip0x(owner).toLowerCase();
	return '0x70a08231' + pad32(o);
}
