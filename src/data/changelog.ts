export type ChangelogEntry = {
	day: number;
	date: string; // YYYY-MM-DD
	title: string;
	summary: string;
	links?: { label: string; href: string }[];
};

export const changelog: ChangelogEntry[] = [
	{
		day: 5,
		date: '2026-02-11',
		title: 'Reliability hardening + identity canon + treasury enforcement',
		summary:
			'Shipped major reliability upgrades across the operating stack: global cron missed-run watchdog with tiered grace windows (critical/standard/low), timeout-risk hardening for treasury automation, and daily plan execution guardrails. Finalized Anti Hunter identity canon (self-learning fleet, agent-intern framing in Anti Fund ecosystem), shipped approved X content (Anti Fund flagship post + Anti Hunter canonical thread), and enforced treasury posting correctness (Day 5 anchor, include every >=$1k position, always include BaseScan wallet link). Also refreshed and validated the antihunter.com treasury snapshot with commit-backed website update.',
		links: [
			{ label: 'Anti Fund flagship post', href: 'https://x.com/Antifund/status/2021724280967639315' },
			{ label: 'Anti Hunter Day 5 treasury post', href: 'https://x.com/AntiHunter59823/status/2021756471562682478' },
			{ label: 'Treasury wallet (BaseScan)', href: 'https://basescan.org/address/0xa668ddf22a4c0ecbb31c89b16f355b26ae7703c3' },
		],
	},
	{
		day: 4,
		date: '2026-02-10',
		title: 'Anti Fund X (human-gated) + role expansion',
		summary:
			'Brought up Anti Fund X: a separate, human-gated news posting agent for the main @antifund account (drafts only until approval). Created a private X list (Anti Fund — Breaking) and started populating a 50-account roster (75% startup/tech/AI/robotics, 25% markets-fast) with “Developing:” allowed for speed. Anti Hunter also took on a new role: social media intern for @antifund (compounding distribution loops).',
		links: [
			{ label: 'Anti Fund (X)', href: 'https://x.com/Antifund' },
			{ label: 'Private list (X)', href: 'https://x.com/i/lists/2021214842783150513/' },
		],
	},
	{
		day: 3,
		date: '2026-02-09',
		title: 'Tokenomics + roadmap + treasury QA',
		summary:
			'Shipped a web-native tokenomics explainer (plain-English staking/locking incentives) + lock-weight calculator (term weights, rollover bonus cap, early-exit penalty). Added a receipts-first treasury methodology page, a homepage Now/Next/Later roadmap, and automated treasury snapshot validation (QA workflow + validator script) to keep the numbers honest. Nightly rollup (2026-02-09): • Update Day 3 changelog with roadmap + treasury QA progress • Treasury: daily snapshot refresh 2026-02-09 • Add tokenomics explainer + lock calculator • qa: add nightly build/link check + treasury snapshot validation • site: add Now/Next/Later roadmap + move changelog to data module • site: add treasury methodology page + receipts links (+1 more)',
		links: [
			{ label: 'Tokenomics', href: '/tokenomics' },
			{ label: 'Treasury methodology', href: '/treasury-methodology' },
			{ label: 'Whitepaper v0.2.1 (PDF)', href: '/whitepaper/staking-locking-v0.2.1.pdf' },
		],
	},

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
		day: 0,
		date: '2026-02-06',
		title: 'Launch',
		summary: 'Launched $ANTIHUNTER. Set the core loop: fees → invest → gains → buy & burn.',
		links: [],
	},
];
