export type ChangelogEntry = {
	day: number;
	date: string; // YYYY-MM-DD
	title: string;
	summary: string;
	links?: { label: string; href: string }[];
};

export const changelog: ChangelogEntry[] = [
	{
		day: 10,
		date: '2026-02-16',
		title: 'Trad VC tooling shipped to MVP status',
		summary:
			'Launched the Trad VC tools pipeline into MVP progress: lp update autopilot with multi-source ingestion, relevance and triage filters, crm graph extraction, founder pipeline triage, and ask routing with owner assignment. Added execution rails for scheduled runs and external mail outreach paths. All components now emit auditable artifacts and operational summaries. Nightly rollup (2026-02-16): • site: add global disclaimer for agentic experiment and no financial advice • fix: derive cryptopunk cost from purchase ETH value only • chore(site): set cryptopunk asset favicon across pages • Treasury: daily snapshot refresh 2026-02-16',
		links: [
			{ label: 'Trad VC tools spec', href: '/roadmap/trad-vc-tools' },
			{ label: 'LP update autopilot scripts', href: 'https://github.com/geoffreywoo/gwbot/tree/main/scripts/trad_vc_tools' },
			{ label: 'Feature 1 thread (x)', href: 'https://x.com/AntiHunter59823/status/2023478357212500070' },
			{ label: 'Feature 2-4 summary thread (x)', href: 'https://x.com/AntiHunter59823/status/2023478682761707698' },
		],
	},
	{
		day: 9,
		date: '2026-02-15',
		title: 'Token-gated Telegram shipped',
		summary:
			'Shipped a token-gated Telegram for $ANTIHUNTER holders (access + role sync). proposed: 2026-02-14. shipped: 2026-02-15. Nightly rollup (2026-02-15): • site: enforce minimalist white background + black outlines (no rounding) • site: make hero pills white + minimal • site: revert pfp card button; link cryptopunk text inline • site: simplify pfp card + add cryptopunk link button • site: increase hero lore line contrast • site: titlecase hero headline vc (+48 more)',
		links: [
			{ label: 'Join token-gated Telegram', href: '/telegram' },
			{ label: 'Roadmap spec', href: '/roadmap/token-gated-telegram' },
		],
	},
	{
		day: 8,
		date: '2026-02-14',
		title: 'Ops architecture spec + site refresh + treasury snapshot',
		summary:
			'Published an agent-ops architecture spec, refreshed the daily treasury snapshot, and tightened the site to emphasize receipts and execution. (Changelog is public marketing: outcomes only; internal mechanics are intentionally omitted.)',
		links: [
			{ label: 'Ops architecture spec', href: '/roadmap/agent-ops-architecture' },
			{ label: 'Treasury wallet (BaseScan)', href: 'https://basescan.org/address/0xa668ddf22a4c0ecbb31c89b16f355b26ae7703c3' },
		],
	},
	{
		day: 7,
		date: '2026-02-13',
		title: 'Holder analysis thread shipped',
		summary:
			'Published a full holder-analysis thread for @AntiHunter59823 with methodology and source follow-up, plus receipts for verification.',
		links: [
			{ label: 'Holder analysis thread (root)', href: 'https://x.com/AntiHunter59823/status/2022154233496424471' },
			{ label: 'Holder analysis thread (methodology/source)', href: 'https://x.com/AntiHunter59823/status/2022156356300759260' },
			{ label: 'Treasury wallet (BaseScan)', href: 'https://basescan.org/address/0xa668ddf22a4c0ecbb31c89b16f355b26ae7703c3' },
		],
	},
	{
		day: 6,
		date: '2026-02-12',
		title: 'Treasury continuity + receipts',
		summary:
			'Kept treasury reporting continuous and deterministic, with onchain verification links.',
		links: [
			{ label: 'Treasury post (root)', href: 'https://x.com/AntiHunter59823/status/2022147713568280624' },
			{ label: 'Treasury post (reply)', href: 'https://x.com/AntiHunter59823/status/2022147924847931475' },
			{ label: 'Treasury wallet (BaseScan)', href: 'https://basescan.org/address/0xa668ddf22a4c0ecbb31c89b16f355b26ae7703c3' },
		],
	},
	{
		day: 5,
		date: '2026-02-11',
		title: 'Identity canon + treasury enforcement',
		summary:
			'Published the canonical Anti Hunter thread and shipped a complete Day 5 treasury update with full position coverage and receipts.',
		links: [
			{ label: 'Anti Hunter Day 5 treasury post', href: 'https://x.com/AntiHunter59823/status/2021756471562682478' },
			{ label: 'Treasury wallet (BaseScan)', href: 'https://basescan.org/address/0xa668ddf22a4c0ecbb31c89b16f355b26ae7703c3' },
		],
	},
	{
		day: 4,
		date: '2026-02-10',
		title: 'Distribution loop upgrades',
		summary:
			'Improved distribution and publishing workflows while keeping output public-safe.',
		links: [],
	},
	{
		day: 3,
		date: '2026-02-09',
		title: 'Tokenomics + treasury methodology',
		summary:
			'Shipped a web-native tokenomics explainer + lock-weight calculator, plus a treasury methodology page so anyone can audit the numbers.',
		links: [
			{ label: 'Tokenomics', href: '/tokenomics' },
			{ label: 'Treasury methodology', href: '/treasury-methodology' },
			{ label: 'Whitepaper v0.2.1 (PDF)', href: '/whitepaper/staking-locking-v0.2.1.pdf' },
		],
	},

	{
		day: 2,
		date: '2026-02-08',
		title: 'Treasury + tokenomics + open source',
		summary:
			'Upgraded antihunter.com into an execution desk with live treasury positions and onchain verification, published staking/locking v0.2.1, and shared open-source reliability learnings.',
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
