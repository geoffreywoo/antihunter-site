import { e as createComponent, r as renderTemplate, g as addAttribute, k as renderHead, h as createAstro } from '../chunks/astro/server_Db_MQuyy.mjs';
import 'piccolore';
import 'clsx';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Tokenomics = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Tokenomics;
  const TERMS = [
    { days: 30, weight: 1 },
    { days: 60, weight: 1.4 },
    { days: 90, weight: 1.9 },
    { days: 120, weight: 2.5 }
  ];
  const WEIGHT_CAP = 3;
  const ROLLOVER_BONUS = 0.2;
  const EARLY_EXIT_PENALTY_PCT = 25;
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="generator"', '><title>Anti Hunter \u2014 Tokenomics</title><meta name="description" content="Staking/locking incentives: multi-term locks, linear rewards streaming, early exit penalties, rollover bonus, and deterministic buyback guardrails."><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="icon" type="image/svg+xml" href="/mark.svg">', '</head> <body class="min-h-screen bg-zinc-950 text-zinc-100 antialiased"> <div class="pointer-events-none fixed inset-0 -z-10"> <div class="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(244,244,245,0.12),rgba(9,9,11,0))]"></div> <div class="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(244,244,245,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(244,244,245,0.25)_1px,transparent_1px)] [background-size:48px_48px]"></div> <div class="absolute -top-24 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl"></div> </div> <div class="mx-auto max-w-4xl px-6 py-14 sm:py-20"> <header class="space-y-6"> <a class="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200" href="/">\u2190 Back to antihunter.com</a> <div class="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur sm:p-10"> <div class="text-xs uppercase tracking-[0.22em] text-zinc-400">Tokenomics</div> <h1 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Staking / locking incentives (web-native)</h1> <p class="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300">\nThis is the plain-English view of the staking/locking spec.\n<span class="text-zinc-400"> It is not financial advice; verify everything against the contract + whitepaper.</span> </p> <div class="mt-6 flex flex-wrap gap-3"> <a class="rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow hover:bg-white" href="/whitepaper/staking-locking-v0.2.1.pdf" target="_blank" rel="noreferrer">\nWhitepaper PDF (v0.2.1)\n</a> <a class="rounded-xl border border-zinc-700 bg-zinc-900/30 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:border-zinc-500" href="/whitepaper/staking-locking-v0.2.1.html" target="_blank" rel="noreferrer">\nWhitepaper HTML\n</a> </div> </div> </header> <main class="mt-12 space-y-14"> <section class="space-y-6"> <h2 class="text-xl font-semibold">The loop (why locks exist)</h2> <div class="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 backdrop-blur"> <ul class="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-300"> <li><strong>Fees settle in $ANTIHUNTER</strong> and are routed into the system (Rewards Pool / Treasury).</li> <li><strong>Locking</strong> is how you earn a share of Rewards Pool emissions over time.</li> <li>Rewards stream <strong>linearly</strong> across your chosen term (no fake APY guarantees).</li> <li><strong>Early exit</strong> is allowed but penalized to subsidize long-term lockers.</li> <li>Separately: realized PnL can trigger <strong>deterministic on-market buys</strong> (rule-based, can be 0).</li> </ul> </div> </section> <section class="space-y-6"> <div class="flex flex-wrap items-end justify-between gap-3"> <h2 class="text-xl font-semibold">Lock terms and bonus weights</h2> <div class="text-xs uppercase tracking-[0.22em] text-zinc-500">weights \u2260 APY</div> </div> <div class="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 backdrop-blur"> <div class="overflow-x-auto"> <table class="min-w-full text-left text-sm"> <thead class="text-xs uppercase tracking-[0.18em] text-zinc-500"> <tr> <th class="py-2 pr-4">Term</th> <th class="py-2 pr-4">Base weight</th> <th class="py-2">Notes</th> </tr> </thead> <tbody class="divide-y divide-zinc-800/70 text-zinc-200"> ', ' </tbody> </table> </div> <div class="mt-4 text-xs leading-relaxed text-zinc-500">\nRollover incentive: re-lock within ~24h of maturity \u2192 <strong>+', "\xD7</strong> (next term only). Cap: <strong>", '\xD7</strong> effective weight.\n</div> </div> </section> <section class="space-y-6"> <h2 class="text-xl font-semibold">Early exit penalty</h2> <div class="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 backdrop-blur"> <p class="text-sm leading-relaxed text-zinc-300">\nYou can exit early, but you pay a <strong>', '% principal penalty</strong>.\n<span class="text-zinc-400"> Penalties route to the Rewards Pool (paper hands subsidize diamond hands).</span> </p> <div class="mt-4 text-xs leading-relaxed text-zinc-500">\nImplementation note: exact mechanics are defined by the contract/whitepaper; this page is a UX explainer.\n</div> </div> </section> <section class="space-y-6"> <div class="flex flex-wrap items-end justify-between gap-3"> <h2 class="text-xl font-semibold">Lock weight calculator</h2> <div class="text-xs uppercase tracking-[0.22em] text-zinc-500">simple + transparent</div> </div> <div class="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 backdrop-blur"> <div class="grid gap-5 sm:grid-cols-2"> <div class="space-y-3"> <label class="block text-xs uppercase tracking-[0.22em] text-zinc-500">Amount ($ANTIHUNTER)</label> <input id="calc-amount" type="number" min="0" step="any" value="1000000" class="w-full rounded-xl border border-zinc-800 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"> <label class="mt-4 block text-xs uppercase tracking-[0.22em] text-zinc-500">Term</label> <select id="calc-term" class="w-full rounded-xl border border-zinc-800 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"> ', ' </select> <label class="mt-4 flex items-center gap-3 text-sm text-zinc-300"> <input id="calc-rollover" type="checkbox" class="h-4 w-4 rounded border-zinc-700 bg-black/30">\nRollover bonus (+', '\xD7 next term only)\n</label> </div> <div class="space-y-4"> <div class="rounded-xl border border-zinc-800 bg-black/20 p-4"> <div class="text-xs uppercase tracking-[0.22em] text-zinc-500">Effective weight</div> <div id="calc-weight" class="mt-2 text-2xl font-semibold">\u2014</div> <div class="mt-2 text-xs text-zinc-500">Cap: ', `\xD7</div> </div> <div class="rounded-xl border border-zinc-800 bg-black/20 p-4"> <div class="text-xs uppercase tracking-[0.22em] text-zinc-500">Weight units (amount \xD7 weight)</div> <div id="calc-units" class="mt-2 text-xl font-semibold">\u2014</div> <div class="mt-2 text-xs text-zinc-500">Your share of emissions is proportional to weight units.</div> </div> <div class="rounded-xl border border-zinc-800 bg-black/20 p-4"> <div class="text-xs uppercase tracking-[0.22em] text-zinc-500">If you exit early</div> <div id="calc-penalty" class="mt-2 text-sm text-zinc-300">\u2014</div> </div> </div> </div> <div class="mt-5 text-xs leading-relaxed text-zinc-500">
This calculator intentionally avoids promising APY.
							Rewards can be 0; emissions depend on system activity and governance.
</div> </div> </section> <script type="module">
					const TERMS = new Map([
						[30, 1.0],
						[60, 1.4],
						[90, 1.9],
						[120, 2.5],
					]);
					const WEIGHT_CAP = 3.0;
					const ROLLOVER_BONUS = 0.2;
					const EARLY_EXIT_PENALTY_PCT = 25;

					const amountEl = document.getElementById('calc-amount');
					const termEl = document.getElementById('calc-term');
					const rolloverEl = document.getElementById('calc-rollover');
					const weightEl = document.getElementById('calc-weight');
					const unitsEl = document.getElementById('calc-units');
					const penaltyEl = document.getElementById('calc-penalty');

					const fmt = (n, dp = 2) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: dp }) : '\u2014');

					function recalc() {
						const amt = Number(amountEl.value);
						const days = Number(termEl.value);
						const base = TERMS.get(days) ?? 1.0;
						const rollover = rolloverEl.checked ? ROLLOVER_BONUS : 0;
						const eff = Math.min(WEIGHT_CAP, base + rollover);
						const units = Number.isFinite(amt) ? amt * eff : NaN;
						const penalty = Number.isFinite(amt) ? (amt * EARLY_EXIT_PENALTY_PCT) / 100 : NaN;
						const receive = Number.isFinite(amt) ? amt - penalty : NaN;

						weightEl.textContent = \`\${eff.toFixed(1)}\xD7\`;
						unitsEl.textContent = fmt(units, 2);
						penaltyEl.innerHTML = Number.isFinite(amt)
							? \`Penalty: <strong>\${fmt(penalty, 2)}</strong> $ANTIHUNTER \xB7 You receive: <strong>\${fmt(receive, 2)}</strong> $ANTIHUNTER\`
							: '\u2014';
					}

					amountEl.addEventListener('input', recalc);
					termEl.addEventListener('change', recalc);
					rolloverEl.addEventListener('change', recalc);
					recalc();
				<\/script> </main> <footer class="mt-16 border-t border-zinc-900/80 pt-10 text-sm text-zinc-500"> <div class="flex flex-wrap items-center justify-between gap-3"> <div>\xA9 `, ' Anti Hunter</div> <div class="flex items-center gap-4"> <a class="hover:text-zinc-300" href="/">Home</a> <a class="hover:text-zinc-300" href="/treasury-methodology">Treasury methodology</a> <a class="hover:text-zinc-300" href="https://x.com/AntiHunter59823" target="_blank" rel="noreferrer">X</a> </div> </div> </footer> </div> </body></html>'], ['<html lang="en"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="generator"', '><title>Anti Hunter \u2014 Tokenomics</title><meta name="description" content="Staking/locking incentives: multi-term locks, linear rewards streaming, early exit penalties, rollover bonus, and deterministic buyback guardrails."><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="icon" type="image/svg+xml" href="/mark.svg">', '</head> <body class="min-h-screen bg-zinc-950 text-zinc-100 antialiased"> <div class="pointer-events-none fixed inset-0 -z-10"> <div class="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(244,244,245,0.12),rgba(9,9,11,0))]"></div> <div class="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(244,244,245,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(244,244,245,0.25)_1px,transparent_1px)] [background-size:48px_48px]"></div> <div class="absolute -top-24 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl"></div> </div> <div class="mx-auto max-w-4xl px-6 py-14 sm:py-20"> <header class="space-y-6"> <a class="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200" href="/">\u2190 Back to antihunter.com</a> <div class="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur sm:p-10"> <div class="text-xs uppercase tracking-[0.22em] text-zinc-400">Tokenomics</div> <h1 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Staking / locking incentives (web-native)</h1> <p class="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300">\nThis is the plain-English view of the staking/locking spec.\n<span class="text-zinc-400"> It is not financial advice; verify everything against the contract + whitepaper.</span> </p> <div class="mt-6 flex flex-wrap gap-3"> <a class="rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow hover:bg-white" href="/whitepaper/staking-locking-v0.2.1.pdf" target="_blank" rel="noreferrer">\nWhitepaper PDF (v0.2.1)\n</a> <a class="rounded-xl border border-zinc-700 bg-zinc-900/30 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:border-zinc-500" href="/whitepaper/staking-locking-v0.2.1.html" target="_blank" rel="noreferrer">\nWhitepaper HTML\n</a> </div> </div> </header> <main class="mt-12 space-y-14"> <section class="space-y-6"> <h2 class="text-xl font-semibold">The loop (why locks exist)</h2> <div class="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 backdrop-blur"> <ul class="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-300"> <li><strong>Fees settle in $ANTIHUNTER</strong> and are routed into the system (Rewards Pool / Treasury).</li> <li><strong>Locking</strong> is how you earn a share of Rewards Pool emissions over time.</li> <li>Rewards stream <strong>linearly</strong> across your chosen term (no fake APY guarantees).</li> <li><strong>Early exit</strong> is allowed but penalized to subsidize long-term lockers.</li> <li>Separately: realized PnL can trigger <strong>deterministic on-market buys</strong> (rule-based, can be 0).</li> </ul> </div> </section> <section class="space-y-6"> <div class="flex flex-wrap items-end justify-between gap-3"> <h2 class="text-xl font-semibold">Lock terms and bonus weights</h2> <div class="text-xs uppercase tracking-[0.22em] text-zinc-500">weights \u2260 APY</div> </div> <div class="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 backdrop-blur"> <div class="overflow-x-auto"> <table class="min-w-full text-left text-sm"> <thead class="text-xs uppercase tracking-[0.18em] text-zinc-500"> <tr> <th class="py-2 pr-4">Term</th> <th class="py-2 pr-4">Base weight</th> <th class="py-2">Notes</th> </tr> </thead> <tbody class="divide-y divide-zinc-800/70 text-zinc-200"> ', ' </tbody> </table> </div> <div class="mt-4 text-xs leading-relaxed text-zinc-500">\nRollover incentive: re-lock within ~24h of maturity \u2192 <strong>+', "\xD7</strong> (next term only). Cap: <strong>", '\xD7</strong> effective weight.\n</div> </div> </section> <section class="space-y-6"> <h2 class="text-xl font-semibold">Early exit penalty</h2> <div class="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 backdrop-blur"> <p class="text-sm leading-relaxed text-zinc-300">\nYou can exit early, but you pay a <strong>', '% principal penalty</strong>.\n<span class="text-zinc-400"> Penalties route to the Rewards Pool (paper hands subsidize diamond hands).</span> </p> <div class="mt-4 text-xs leading-relaxed text-zinc-500">\nImplementation note: exact mechanics are defined by the contract/whitepaper; this page is a UX explainer.\n</div> </div> </section> <section class="space-y-6"> <div class="flex flex-wrap items-end justify-between gap-3"> <h2 class="text-xl font-semibold">Lock weight calculator</h2> <div class="text-xs uppercase tracking-[0.22em] text-zinc-500">simple + transparent</div> </div> <div class="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 backdrop-blur"> <div class="grid gap-5 sm:grid-cols-2"> <div class="space-y-3"> <label class="block text-xs uppercase tracking-[0.22em] text-zinc-500">Amount ($ANTIHUNTER)</label> <input id="calc-amount" type="number" min="0" step="any" value="1000000" class="w-full rounded-xl border border-zinc-800 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"> <label class="mt-4 block text-xs uppercase tracking-[0.22em] text-zinc-500">Term</label> <select id="calc-term" class="w-full rounded-xl border border-zinc-800 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"> ', ' </select> <label class="mt-4 flex items-center gap-3 text-sm text-zinc-300"> <input id="calc-rollover" type="checkbox" class="h-4 w-4 rounded border-zinc-700 bg-black/30">\nRollover bonus (+', '\xD7 next term only)\n</label> </div> <div class="space-y-4"> <div class="rounded-xl border border-zinc-800 bg-black/20 p-4"> <div class="text-xs uppercase tracking-[0.22em] text-zinc-500">Effective weight</div> <div id="calc-weight" class="mt-2 text-2xl font-semibold">\u2014</div> <div class="mt-2 text-xs text-zinc-500">Cap: ', `\xD7</div> </div> <div class="rounded-xl border border-zinc-800 bg-black/20 p-4"> <div class="text-xs uppercase tracking-[0.22em] text-zinc-500">Weight units (amount \xD7 weight)</div> <div id="calc-units" class="mt-2 text-xl font-semibold">\u2014</div> <div class="mt-2 text-xs text-zinc-500">Your share of emissions is proportional to weight units.</div> </div> <div class="rounded-xl border border-zinc-800 bg-black/20 p-4"> <div class="text-xs uppercase tracking-[0.22em] text-zinc-500">If you exit early</div> <div id="calc-penalty" class="mt-2 text-sm text-zinc-300">\u2014</div> </div> </div> </div> <div class="mt-5 text-xs leading-relaxed text-zinc-500">
This calculator intentionally avoids promising APY.
							Rewards can be 0; emissions depend on system activity and governance.
</div> </div> </section> <script type="module">
					const TERMS = new Map([
						[30, 1.0],
						[60, 1.4],
						[90, 1.9],
						[120, 2.5],
					]);
					const WEIGHT_CAP = 3.0;
					const ROLLOVER_BONUS = 0.2;
					const EARLY_EXIT_PENALTY_PCT = 25;

					const amountEl = document.getElementById('calc-amount');
					const termEl = document.getElementById('calc-term');
					const rolloverEl = document.getElementById('calc-rollover');
					const weightEl = document.getElementById('calc-weight');
					const unitsEl = document.getElementById('calc-units');
					const penaltyEl = document.getElementById('calc-penalty');

					const fmt = (n, dp = 2) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: dp }) : '\u2014');

					function recalc() {
						const amt = Number(amountEl.value);
						const days = Number(termEl.value);
						const base = TERMS.get(days) ?? 1.0;
						const rollover = rolloverEl.checked ? ROLLOVER_BONUS : 0;
						const eff = Math.min(WEIGHT_CAP, base + rollover);
						const units = Number.isFinite(amt) ? amt * eff : NaN;
						const penalty = Number.isFinite(amt) ? (amt * EARLY_EXIT_PENALTY_PCT) / 100 : NaN;
						const receive = Number.isFinite(amt) ? amt - penalty : NaN;

						weightEl.textContent = \\\`\\\${eff.toFixed(1)}\xD7\\\`;
						unitsEl.textContent = fmt(units, 2);
						penaltyEl.innerHTML = Number.isFinite(amt)
							? \\\`Penalty: <strong>\\\${fmt(penalty, 2)}</strong> $ANTIHUNTER \xB7 You receive: <strong>\\\${fmt(receive, 2)}</strong> $ANTIHUNTER\\\`
							: '\u2014';
					}

					amountEl.addEventListener('input', recalc);
					termEl.addEventListener('change', recalc);
					rolloverEl.addEventListener('change', recalc);
					recalc();
				<\/script> </main> <footer class="mt-16 border-t border-zinc-900/80 pt-10 text-sm text-zinc-500"> <div class="flex flex-wrap items-center justify-between gap-3"> <div>\xA9 `, ' Anti Hunter</div> <div class="flex items-center gap-4"> <a class="hover:text-zinc-300" href="/">Home</a> <a class="hover:text-zinc-300" href="/treasury-methodology">Treasury methodology</a> <a class="hover:text-zinc-300" href="https://x.com/AntiHunter59823" target="_blank" rel="noreferrer">X</a> </div> </div> </footer> </div> </body></html>'])), addAttribute(Astro2.generator, "content"), renderHead(), TERMS.map((t) => renderTemplate`<tr> <td class="py-3 pr-4 font-medium">${t.days} days</td> <td class="py-3 pr-4">${t.weight.toFixed(1)}×</td> <td class="py-3 text-zinc-400">Share of Rewards Pool emissions is proportional to your effective weight.</td> </tr>`), ROLLOVER_BONUS.toFixed(1), WEIGHT_CAP.toFixed(1), EARLY_EXIT_PENALTY_PCT, TERMS.map((t) => renderTemplate`<option${addAttribute(t.days, "value")}>${t.days} days (${t.weight.toFixed(1)}×)</option>`), ROLLOVER_BONUS.toFixed(1), WEIGHT_CAP.toFixed(1), (/* @__PURE__ */ new Date()).getFullYear());
}, "/Users/gwbox/.openclaw/workspace/antihunter-site/src/pages/tokenomics.astro", void 0);

const $$file = "/Users/gwbox/.openclaw/workspace/antihunter-site/src/pages/tokenomics.astro";
const $$url = "/tokenomics";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Tokenomics,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
