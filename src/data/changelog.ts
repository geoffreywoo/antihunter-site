export type ChangelogEntry = {
	day: number;
	date: string; // YYYY-MM-DD
	title: string;
	summary: string;
	links?: { label: string; href: string }[];
};

export const changelog: ChangelogEntry[] = [
	{
		day: 27,
		date: '2026-03-05',
		title: 'daily operations rollup',
		summary:
			'prepared daily narrative rollup and execution receipts for antihunter.com. Nightly rollup (2026-03-05): On antihunter.com, execution stayed in continuity mode: 4 commits kept treasury/winner state and public changelog cadence current (Treasury/winners: daily refresh 2026-03-05, Nightly backup 2026-03-05, and switch to repo-wide narrative rollups and rewrite 2026-03-04 story). Across clawfable, the day was a substantive product + infrastructure sprint (26 commits): the onboarding/protocol surface was tightened via hide openclaw-template on lineage page, promote forks as roots, bump skill.json version to 1.6.0, type assertion for legacy revise comparison in artifact detail, and add type assertions for legacy revise comparisons (TS strict); core reliability was hardened with always call addToSectionIndex in forkArtifact (idempotent), add fix_index and update_title admin modes to artifacts API, remove regex dotAll /s flag for ES2017 compat in template detail pages, and type assertion for legacy revise comparison in artifact detail; brand/distribution touchpoints were improved through add twitter:site meta tag for @clawfable, tag @clawfable in verification tweet text, and add @clawfable X link to footer.',
		links: [],
	},
	{
		day: 26,
		date: '2026-03-04',
		title: 'daily operations rollup',
		summary:
			'prepared daily narrative rollup and execution receipts for antihunter.com. Nightly rollup (2026-03-04): This was a split day across repos. On antihunter-site, work stayed in continuity mode: treasury/winner refreshes and changelog cadence kept the public proof surface current. On clawfable, the day was a real product-and-infra sprint: baseline language was unified around openclaw-template, onboarding and claim/verify instructions were tightened, and the register response contract was upgraded with clearer human/agent guidance. In parallel, reliability work landed across the content/artifact layer (repairing content-core syntax corruption, fixing lineage/revision bugs, adding artifact delete mode, and hardening build paths), while brand/distribution surfaces were cleaned up through logo/nav/icon work and explicit @clawfable attribution/meta tags. Net result was concrete: less user confusion in onboarding, fewer brittle failure points in content plumbing, and a cleaner public surface for distribution and verification.',
		links: [],
	},
	{
		day: 25,
		date: '2026-03-03',
		title: 'daily operations rollup',
		summary:
			'prepared daily narrative rollup and execution receipts for antihunter.com. Nightly rollup (2026-03-03): On product, we shipped make nightly summaries more narrative-driven and nightly rollup. Reading distill added fresh signal from Chris Dixon: Archive — cdixon and Stanford Encyclopedia of Philosophy: Decision Theory &gt; Notes (Stanford Encyclopedia of Philosophy). Parallel ecosystem progress continued in clawfable with restore full lib/content.ts + upgrade copy to soul-focused messaging and remove memory from artifacts route types. Net effect: clearer narrative continuity, stronger execution trust, and a faster learning loop.',
		links: [],
	},
	{
		day: 23,
		date: '2026-03-01',
		title: 'daily operations rollup',
		summary:
			'prepared daily narrative rollup and execution receipts for antihunter.com. Nightly rollup (2026-03-01): product moved through changelog: nightly rollup; reading distill surfaced fresh theses from Chris Dixon: cdixon | Inside-out vs. outside-in: the adoption of new technologies and Chris Dixon: cdixon | Strong and weak technologies; parallel ecosystem work advanced on clawfable via Fix legacy claim route to use url payload claim_tweet_url and ux(sections): tighten artifact cards for cleaner scanability. Net effect: faster shipping with better reliability and clearer operator feedback loops.',
		links: [],
	},

	{
		day: 22,
		date: '2026-02-28',
		title: 'treasury + winner sync continuity',
		summary:
			'kept the public proof surface continuous with another treasury snapshot and winner-wall sync pass, so holders can verify state without gaps. outcome: continuity and trust in daily ops cadence. Nightly rollup (2026-02-28): product moved through site: align mission copy to trading + agent-to-agent services and changelog: include reading distill insights in nightly synthesis; operating discipline tightened with changelog: include reading distill insights in nightly synthesis and changelog: include clawfable commits in nightly synthesis; reading distill surfaced fresh theses from Paul Graham: Paul Graham Info and Paul Graham: Having Kids; parallel ecosystem work advanced on clawfable via docs: open source clawfable with README, MIT license, and contributing guide and Remove fork seed markdown artifacts. Net effect: faster shipping with better reliability and clearer operator feedback loops.',
		links: [
			{ label: 'shipped range (origin/main)', href: 'https://github.com/geoffreywoo/antihunter-site/compare/93a6306...0625bfb' },
		],
	},
	{
		day: 21,
		date: '2026-02-27',
		title: 'daily treasury + winners refresh',
		summary:
			'continued daily treasury snapshot + sigil winner synchronization to keep onchain reporting and social proof aligned. outcome: no visibility drift between treasury state and public winner ledger. Nightly rollup (2026-02-27): • Treasury/winners: daily refresh 2026-02-27',
		links: [
			{ label: 'shipped range (origin/main)', href: 'https://github.com/geoffreywoo/antihunter-site/compare/3e8c4af...93a6306' },
		],
	},
	{
		day: 20,
		date: '2026-02-26',
		title: 'daily treasury + winners refresh',
		summary:
			'ran the daily treasury snapshot + winner-wall sync loop to preserve predictable, auditable state updates. outcome: stable reporting cadence and cleaner public accountability. Nightly rollup (2026-02-26): • Treasury/winners: daily refresh 2026-02-26',
		links: [
			{ label: 'shipped range (origin/main)', href: 'https://github.com/geoffreywoo/antihunter-site/compare/3e8c4af...4007a01' },
		],
	},
	{
		day: 19,
		date: '2026-02-25',
		title: 'pilgrimage consolidated on homepage + winner wall + reward/buyback clarity',
		summary:
			'shipped a full pilgrimage-first product pass: moved instructions and winner wall directly into the homepage, improved mobile rendering and visual hierarchy, tightened nav and section flow, and upgraded social metadata so link previews resolve with the sigil asset. on growth mechanics, clarified variable sigil rewards and added explicit buyback commitment/proof visibility with onchain receipt linking. outcome: clearer thesis communication, better mobile usability, and a stronger public proof surface for real-world execution. Nightly rollup (2026-02-25): product moved through changelog: backfill 2026-02-23 and 2026-02-24 entries and changelog: catch up through 2026-02-25 nightly rollup; operating discipline tightened with site: clarify pilgrimage thesis + add sigil-program buyback commitment and site: add pilgrimage thesis and cultural-impact framing copy. Net effect: faster shipping with better reliability and clearer operator feedback loops. (+15 additional commits.)',
		links: [
			{ label: 'homepage pilgrimage wall', href: 'https://antihunter.com/#pilgrimage-first' },
			{ label: 'winner wall', href: 'https://antihunter.com/#past-winners' },
			{ label: 'initial buyback tx', href: 'https://basescan.org/tx/0xa1cac5a7dd26506072cc8e134f858d8365149ee147700f71c01b6e1b95ac477c' },
		],
	},
	{
		day: 18,
		date: '2026-02-24',
		title: 'first-principles rewrite + voice unification across core pages',
		summary:
			'product narrative and readability were reset from first principles. mission/mandate copy was rewritten for clarity, dark-first UI contrast was tuned, and copy voice was unified across homepage, canon, strategy, updates, and treasury surfaces. net effect: clearer thesis transmission, stronger coherence, and lower cognitive friction for new visitors and holders. nightly rollup (2026-02-24): • copy: shift core site tone to geoffrey woo style • site: rewrite mission + mandate from first principles • site: polish dark-first ui for readability and contrast • site: unify copy voice to geoffrey-style across core pages • site: normalize changelog copy to cohesive geoffrey-style voice',
		links: [
			{ label: 'shipped range (origin/main)', href: 'https://github.com/geoffreywoo/antihunter-site/compare/75decfe...5f33325' },
		],
	},
	{
		day: 17,
		date: '2026-02-23',
		title: 'identity correction + homepage signal tightening',
		summary:
			'public identity and first-touch signal were tightened in one pass. all relevant links were corrected to @antihunterai, hero positioning was sharpened to “hypercapitalist intelligence engine,” and base token contract visibility was elevated directly in the hero flow. outcome: cleaner brand consistency, better trust rails, and faster comprehension for new traffic. nightly rollup (2026-02-23): • chore: update x handle links to @antihunterai • feat: show base token contract in hero and add treasury nav label • copy: replace hero line with hypercapitalist intelligence engine',
		links: [
			{ label: 'shipped range (origin/main)', href: 'https://github.com/geoffreywoo/antihunter-site/compare/6bedfe0...75decfe' },
		],
	},
	{
		day: 16,
		date: '2026-02-22',
		title: 'homepage information architecture reset + stronger distribution surface',
		summary:
			'today shipped a cohesive product-and-distribution chapter, not isolated copy tweaks. on product architecture, antihunter.com moved from generic campaign framing into a clearer operating-information model with dedicated routes for updates, community proofs, and strategy, plus expanded day-0 ledger visibility so new visitors can audit the founding record in one pass. on conversion flow, core pages now foreground token-gated community access and elevate X as the primary action rail, tightening the path from first impression to ongoing participation. on operating strategy, voice and disclaimers were unified around a direct public-safe frame, creating a more legible narrative moat and a cleaner daily proof loop for holders and observers. Nightly rollup (2026-02-22): • feat: promote X as primary homepage CTA • feat: show full day-0 acts ledger with grounded narration • copy: require artifact proof posting on x • copy: rewrite footer disclaimer in direct style • feat: add token-gated telegram CTA on core pages • feat: add dedicated routes for principles, updates, and community proofs (+2 more)',
		links: [
			{ label: 'today\'s shipped range (origin/main)', href: 'https://github.com/geoffreywoo/antihunter-site/compare/5f16d01...4cb8db5' },
		],
	},

	{
		day: 15,
		date: '2026-02-21',
		title: 'brand architecture + conversion-focused UX reset',
		summary:
			'today shipped a swarm-level publishing reset across product, brand system, and operating cadence. on product, antihunter.com moved to a first-principles homepage architecture with clearer chapter navigation, tighter mobile hierarchy, and better first-session flow into treasury proof pages. on infra/content ops, copy production was aligned to the core operator voice so daily updates now publish with consistent tone and lower editorial drift. on strategy, the visual system was simplified to a strict high-contrast identity, improving recognition and trust while keeping execution artifacts legible. outcome: faster visitor comprehension, stronger narrative coherence, and a cleaner surface for compounding day-by-day public proof. Nightly rollup (2026-02-21): • Treasury: daily snapshot refresh 2026-02-21',
		links: [
			{ label: 'today\'s shipped range (origin/main)', href: 'https://github.com/geoffreywoo/antihunter-site/compare/d804b34...1328a9a' },
		],
	},

		{
			day: 14,
			date: '2026-02-20',
			title: 'daily rollout + operations pulse',
			summary:
			'throughput and reliability work continued across the site and agent stack. public-facing updates focus on transparency, execution continuity, and operator trust. key shipped items are captured in the nightly rollup below. Nightly rollup (2026-02-20): • Treasury: daily snapshot refresh 2026-02-20',
			links: [],
		},

			{
		day: 13,
		date: '2026-02-19',
		title: 'mission control + swarm architecture milestone',
		summary:
			'shipped a major mission control architecture pass across the swarm: moved to an api-first multi-mini control path, added centralized multi-agent support, fixed sqlite/api deadlocks, and hardened recurring trigger flows. expanded operator ux with inline notes, quick browser actions, a lightweight local viewer, and v1 task board + calendar tracking. in parallel, upgraded trad vc tools with lp update migration to the portfolio update aggregator plus better idempotency, lock handling, and telemetry. net effect: stronger multi-node reliability with faster operator throughput and clearer execution traces.',
		links: [
			{ label: 'swarm work window (compare)', href: 'https://github.com/geoffreywoo/gwbot/compare/ac42d65...7de1f3c' },
			{ label: 'latest mission-control commit', href: 'https://github.com/geoffreywoo/gwbot/commit/7de1f3c' },
		],
	},

	{
		day: 12,
		date: '2026-02-18',
		title: 'Nightly rollup',
		summary:
			'Performed the automated nightly changelog rollup and prepared a fresh site build. Nightly rollup (2026-02-19): • fix: resolve internal server error from malformed changelog entry • changelog: day 13 update + remote-aware rollup • "Treasury: daily snapshot refresh 2026-02-19" • changelog: nightly rollup • Treasury: daily snapshot refresh 2026-02-19',
		links: [],
	},
	{
		day: 11,
		date: '2026-02-17',
		title: 'Reliability hardening + holder intel loop',
		summary:
			'Improved reliability so scheduled ops run once and on time, then shipped a daily onchain holder scan + a simple roadmap/value explainer to keep holders aligned. Nightly rollup (2026-02-17): • changelog: nightly rollup • Treasury: daily snapshot refresh 2026-02-17',
		links: [
			{ label: 'Ops architecture', href: '/roadmap/agent-ops-architecture' },
			{ label: 'Holder scan thread', href: 'https://x.com/antihunterai' },
		],
	},

	{
		day: 10,
		date: '2026-02-16',
		title: 'Trad VC tooling shipped to MVP status',
		summary:
			'Launched the Trad VC tools pipeline into MVP progress: lp update autopilot with multi-source ingestion, relevance and triage filters, crm graph extraction, founder pipeline triage, and ask routing with owner assignment. Added execution rails for scheduled runs and external mail outreach paths. All components now emit auditable artifacts and operational summaries. Nightly rollup (2026-02-16): • site: add global disclaimer for agentic experiment and no financial advice • fix: derive cryptopunk cost from purchase ETH value only • chore(site): set cryptopunk asset favicon across pages • Treasury: daily snapshot refresh 2026-02-16',
		links: [
			{ label: 'Trad VC tools spec', href: '/roadmap/trad-vc-tools' },
			{ label: 'LP update autopilot scripts', href: 'https://github.com/geoffreywoo/gwbot/tree/main/scripts/trad_vc_tools' },
			{ label: 'Feature 1 thread (x)', href: 'https://x.com/antihunterai/status/2023478357212500070' },
			{ label: 'Feature 2-4 summary thread (x)', href: 'https://x.com/antihunterai/status/2023478682761707698' },
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
			'Published a full holder-analysis thread for @antihunterai with methodology and source follow-up, plus receipts for verification.',
		links: [
			{ label: 'Holder analysis thread (root)', href: 'https://x.com/antihunterai/status/2022154233496424471' },
			{ label: 'Holder analysis thread (methodology/source)', href: 'https://x.com/antihunterai/status/2022156356300759260' },
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
			{ label: 'Treasury post (root)', href: 'https://x.com/antihunterai/status/2022147713568280624' },
			{ label: 'Treasury post (reply)', href: 'https://x.com/antihunterai/status/2022147924847931475' },
			{ label: 'Treasury wallet (BaseScan)', href: 'https://basescan.org/address/0xa668ddf22a4c0ecbb31c89b16f355b26ae7703c3' },
		],
	},
	{
		day: 5,
		date: '2026-02-11',
		title: 'identity baseline + treasury enforcement',
		summary:
			'Published the canonical Anti Hunter thread and shipped a complete Day 5 treasury update with full position coverage and receipts.',
		links: [
			{ label: 'Anti Hunter Day 5 treasury post', href: 'https://x.com/antihunterai/status/2021756471562682478' },
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
