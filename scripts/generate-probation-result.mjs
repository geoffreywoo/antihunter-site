/** Reproduce with: node --import tsx scripts/generate-probation-result.mjs
 * Uses the published, validated trial receipt. No model calls or remote assets.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { formatTrialUsd, summarizeProbationResults } from '../src/lib/probation-results.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const report = JSON.parse(await readFile(path.join(root, 'public/experiments/probation-v1/results.json'), 'utf8'));
const result = summarizeProbationResults(report);
if (!result.complete) throw new Error('The result card requires a complete, reconciled trial');
const [sonnet, fable] = result.configurations;
const fenced = result.rows.filter(row => row.configuration === 'sonnet' && !row.score.schemaValid
  && /^```[^\n]*\n[\s\S]*\n```$/.test(row.output ?? '')).length;
if (sonnet.accepted !== 0 || fable.accepted !== 10 || fenced !== 10) {
  throw new Error('This editorial headline does not describe the supplied evidence');
}
const total = formatTrialUsd(sonnet.knownCostUsd + fable.knownCostUsd);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const punk = (await sharp(await readFile(path.join(root, 'public/cryptopunk5730_openclaw_lobster.png')))
  .resize(76, 76, { kernel: 'nearest' }).png().toBuffer()).toString('base64');
const panels = [sonnet, fable].map((configuration, index) => {
  const x = 62 + index * 548;
  return `<g><rect x="${x}" y="261" width="528" height="211" fill="#181c17" stroke="#495344"/>
  <text x="${x + 24}" y="299" fill="#dcded1" font-family="monospace" font-size="22">${escape(configuration.label)}</text>
  <text x="${x + 24}" y="382" fill="${index ? '#d6c786' : '#a4b8c1'}" font-family="Georgia, serif" font-size="79">${configuration.accepted}<tspan font-size="38" fill="#a4a999"> / ${configuration.planned}</tspan></text>
  <text x="${x + 231}" y="356" fill="#dcded1" font-family="monospace" font-size="17">ACCEPTED</text>
  <text x="${x + 231}" y="384" fill="#a4a999" font-family="monospace" font-size="15">${index ? 'Bare JSON' : 'Markdown fences'}</text>
  <path d="M${x + 24} 409H${x + 504}" stroke="#41483b"/>
  <text x="${x + 24}" y="445" fill="#b9bfad" font-family="monospace" font-size="17">${formatTrialUsd(configuration.knownCostUsd)} estimated API cost</text></g>`;
}).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<title>The JSON was not optional. Anti Hunter experiment 003 results.</title>
<desc>Ten synthetic invoices per configuration, strict JSON without repair. Sonnet ${sonnet.accepted} of 10 accepted; Fable ${fable.accepted} of 10. Total estimated API cost ${total}. A small configured-service test, not a universal model verdict.</desc>
<rect width="1200" height="630" fill="#10120e"/><path d="M32 32H1168V598H32Z" stroke="#343b2f" fill="none"/>
<text x="62" y="78" font-family="monospace" font-size="19" letter-spacing="3" fill="#ddd8c8">ANTI HUNTER / ACT 003</text>
<text x="1138" y="78" text-anchor="end" font-family="monospace" font-size="15" letter-spacing="2" fill="#a3a18c">THE PERFORMANCE REVIEW</text>
<path d="M62 106H1138" stroke="#454b3c"/>
<text x="62" y="190" font-family="Georgia, serif" font-size="67" letter-spacing="-1.4" fill="#a4b8c1">The JSON was not optional.</text>
<text x="62" y="228" font-family="monospace" font-size="17" fill="#bdc2b2">10 SYNTHETIC INVOICES / STRICT JSON / NO REPAIR</text>
${panels}
<text x="62" y="518" font-family="monospace" font-size="21" fill="#d6c786">${total} TOTAL API ESTIMATE</text>
<text x="62" y="548" font-family="monospace" font-size="15" fill="#a4a999">One attempt each. Human review unmeasured. No universal model verdict.</text>
<text x="62" y="577" font-family="monospace" font-size="16" fill="#ddd8c8">antihunter.com/acts/probation-for-the-machines</text>
<image x="1061" y="495" width="76" height="76" href="data:image/png;base64,${punk}" style="image-rendering:pixelated"/>
</svg>`;
await writeFile(path.join(root, 'public/growth/probation-result.svg'), svg);
await sharp(Buffer.from(svg), { density: 144 }).resize(1200, 630).png().toFile(path.join(root, 'public/growth/probation-result.png'));
console.log(JSON.stringify({ output: 'public/growth/probation-result.{svg,png}', totalApiEstimate: total,
  sonnetAccepted: sonnet.accepted, fableAccepted: fable.accepted, plannedEach: 10 }));
