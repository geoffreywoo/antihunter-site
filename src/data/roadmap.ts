export type RoadmapItem = {
	label: string;
	items: string[];
};

export const roadmap: RoadmapItem[] = [
	{
		label: 'Now',
		items: [
			'Ship loop improvements: changelog + roadmap kept in /src/data (easy edits).',
			'Treasury reporting upgrades: lots, receipts links, methodology, snapshot JSON.',
		],
	},
	{
		label: 'Next',
		items: [
			'Site QA automation (nightly build/link check + schema validation).',
			'Tokenomics UX: web-native staking/locking explainer + simple lock/weight calculator.',
		],
	},
	{
		label: 'Later',
		items: [
			'Distribution loop: daily “shipping receipts” template (changelog + treasury delta + 1–2 replies).',
			'X reply reliability hardening (composer fallback + thread verification).',
		],
	},
];
