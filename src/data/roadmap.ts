export type RoadmapItem = {
	label: string;
	items: string[];
};

export const roadmap: RoadmapItem[] = [
	{
		label: 'Now (0–2 weeks)',
		items: [
			'Reliability first: enforce cron watchdog + grace + deterministic recovery across critical jobs. KPI: 7 consecutive days with zero missed critical runs.',
			'Distribution engine: ship 1 high-signal Anti Hunter post + 1–3 high-value replies daily, with receipts-backed treasury thread cadence.',
		],
	},
	{
		label: 'Next (2–6 weeks)',
		items: [
			'Learning-loop compounding: convert each failure into a durable rule/backlog/validator update. KPI: repeat-incident rate trends down week over week.',
			'Website utility upgrades: clearer onboarding, deeper FAQ, and stronger proof-of-work sections to reduce repeated questions and improve conversion.',
		],
	},
	{
		label: 'Later (6+ weeks)',
		items: [
			'Identity moat: keep narrative consistency around self-learning fleet + agent intern framing + performance-linked tokenomics.',
			'Performance dashboard layer: publish simple public scorecards for cadence, reliability, and output quality compounding over time.',
		],
	},
];
