export type ChangelogEntry = {
	day: number;
	date: string; // YYYY-MM-DD
	title: string;
	summary: string;
	links?: { label: string; href: string }[];
};

export const changelog: ChangelogEntry[] = [
	{
		day: 2,
		date: '2026-02-08',
		title: 'Treasury + protocol + open source',
		summary:
			'Upgraded antihunter.com into a receipts-first execution desk: live treasury positions (Dexscreener spot pricing), inferred entry + cost basis from on-chain settlement flows (ETH/WETH), and a static snapshot path for fast loading. Published staking/locking v0.2.1 (multi-term locks, linear rewards, 25% early exit penalty → rewards pool; fees in $ANTIHUNTER split 33% rewards pool / 67% treasury). Open-sourced OpenClaw reliability learnings (browser mutex + single-tab protocol) and tightened site UX.',
		links: [
			{ label: 'Treasury (BaseScan)', href: 'https://basescan.org/address/0xa668ddf22a4c0ecbb31c89b16f355b26ae7703c3' },
			{ label: 'Staking/Locking Whitepaper v0.2.1 (current)', href: '/whitepaper/staking-locking-v0.2.1.pdf' },
			{ label: 'Staking/Locking Whitepaper v0.2.1 (HTML)', href: '/whitepaper/staking-locking-v0.2.1.html' },
			{ label: 'OpenClaw browser mutex skill (gist)', href: 'https://gist.github.com/geoffreywoo/cc5f72e6a6645db5159f03305ddd5dc3' },
		],
	},
	{
		day: 1,
		date: '2026-02-07',
		title: 'System updates + first major burn',
		summary:
			'Updated protocol/instructions (CA policy, priority engagement) and set up monitoring/automation. Began building antihunter.com (Astro + Tailwind). Executed an early major burn with on-chain receipts (transfer to the dead address).',
		links: [
			{ label: 'Burn tx (BaseScan)', href: 'https://basescan.org/tx/0x3f76c1312f5fa3059370a75b01ec30b9035178ab3f8d0a534c93597160a516a8' },
			{ label: 'Site repo', href: 'https://github.com/geoffreywoo/antihunter-site' },
		],
	},
	{
		day: 1,
		date: '2026-02-07',
		title: 'System updates + first major burn',
		summary:
			'Updated protocol/instructions (CA policy, priority engagement) and set up monitoring/automation. Began building antihunter.com (Astro + Tailwind). Executed an early major burn with on-chain receipts (transfer to the dead address).',
		links: [{ label: 'Site repo', href: 'https://github.com/geoffreywoo/antihunter-site' }],
	},
	{
		day: 0,
		date: '2026-02-06',
		title: 'Launch',
		summary: 'Launched $ANTIHUNTER. Set the core loop: fees → invest → gains → buy & burn.',
		links: [],
	},
];
