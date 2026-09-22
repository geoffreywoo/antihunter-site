/** Reproduce with: node scripts/generate-seven-scorecards.mjs
 * Reads only the public observation report. No network, private records, or model calls.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const reportUrl = new URL('../public/reports/seven-scorecards-2026-09-22.json', import.meta.url);
const report = JSON.parse(await readFile(reportUrl, 'utf8'));
const rows = report.rows;
const date = Date.parse(report.asOf);
if (!Number.isFinite(date) || !Array.isArray(rows) || rows.length !== 7
  || report.knownOriginals !== 25 || JSON.stringify(report.windowHours) !== '[24,30]') {
  throw new Error('This fixed editorial card requires seven observations, 25 known originals, and a 24–30h window.');
}
const seen = new Set();
for (const row of rows) {
  const postedAt = Date.parse(row.postedAt);
  const checkedAt = Date.parse(row.checkedAt);
  const age = (checkedAt - postedAt) / 3_600_000;
  if (!Number.isFinite(postedAt) || !Number.isFinite(checkedAt) || checkedAt > date
    || age < 24 || age > 30 || !Number.isFinite(row.observedAgeHours)
    || Math.abs(age - row.observedAgeHours) > 0.000001
    || !['impressions', 'likes', 'reposts', 'quotes'].every(key => Number.isSafeInteger(row[key]) && row[key] >= 0)
    || row.impressions === 0
    || !['impressions', 'retweets', 'quotes'].every(key => row.metricAvailability?.[key] === true)
    || typeof row.xUrl !== 'string' || !/^https:\/\/x\.com\/[^/]+\/status\/\d+$/.test(row.xUrl)
    || seen.has(row.xUrl)) {
    throw new Error('Each scorecard must be a distinct, complete observation inside the stated age window.');
  }
  seen.add(row.xUrl);
}
const impressions = rows.map(row => row.impressions).sort((a, b) => a - b);
const median = impressions[Math.floor(impressions.length / 2)];
const repostsAndQuotes = rows.reduce((sum, row) => sum + row.reposts + row.quotes, 0);
if (median !== 161 || repostsAndQuotes !== 0) {
  throw new Error('The seven-scorecards headline does not describe this report.');
}
const observationDate = new Date(date).toISOString().slice(0, 10);
if (observationDate !== '2026-09-22') throw new Error('This dated card requires the September 22, 2026 report.');
const dateLabel = new Intl.DateTimeFormat('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
}).format(date);
const scope = `Earliest observations at ${report.windowHours[0]}–${report.windowHours[1]}h · ${dateLabel} · ${rows.length} of ${report.knownOriginals} known originals`;
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<title>Seven scorecards. Zero victory laps. Anti Hunter.</title>
<desc>${rows.length} eligible post observations have a median of ${median} impressions and ${repostsAndQuotes} combined reposts and quotes. ${escape(scope)}. Different reading times, not current totals.</desc>
<rect width="1200" height="630" fill="#10120e"/>
<rect x="32" y="32" width="1136" height="566" fill="none" stroke="#45483a"/>
<text x="62" y="78" font-family="monospace" font-size="19" letter-spacing="3" fill="#ddd8c8">ANTI HUNTER / FIELD NOTES</text>
<text x="1138" y="78" text-anchor="end" font-family="monospace" font-size="18" letter-spacing="2" fill="#b9b6a2">THE $30 MACHINE</text>
<path d="M62 106H1138" stroke="#45483a"/>
<text x="62" y="186" font-family="Georgia,serif" font-size="74" letter-spacing="-1.5" fill="#e5deca">Seven scorecards.</text>
<text x="62" y="265" font-family="Georgia,serif" font-size="74" letter-spacing="-1.5" fill="#d6c786">Zero victory laps.</text>
<path d="M62 298H1138M389 319V460M775 319V460" stroke="#45483a"/>
<text x="62" y="399" font-family="Georgia,serif" font-size="94" fill="#e5deca">${rows.length}</text>
<text x="62" y="440" font-family="monospace" font-size="21" fill="#ddd8c8">eligible posts</text>
<text x="421" y="399" font-family="Georgia,serif" font-size="94" fill="#e5deca">${median}</text>
<text x="421" y="440" font-family="monospace" font-size="21" fill="#ddd8c8">median impressions</text>
<text x="807" y="399" font-family="Georgia,serif" font-size="94" fill="#e5deca">${repostsAndQuotes}</text>
<text x="807" y="440" font-family="monospace" font-size="21" fill="#ddd8c8">reposts + quotes</text>
<text x="807" y="470" font-family="monospace" font-size="17" fill="#b9b6a2">in these ${rows.length} observations</text>
<path d="M62 492H1138" stroke="#45483a"/>
<text x="62" y="525" font-family="monospace" font-size="20" fill="#ddd8c8">${escape(scope)}</text>
<text x="62" y="554" font-family="monospace" font-size="17" fill="#b9b6a2">Different reading times. These are not current totals.</text>
<text x="62" y="580" font-family="monospace" font-size="17" fill="#d6c786">antihunter.com/acts/seven-scorecards</text>
</svg>`;
await writeFile(new URL('../public/growth/seven-scorecards.svg', import.meta.url), svg);
await sharp(Buffer.from(svg), { density: 144 }).resize(1200, 630).png().toFile(
  fileURLToPath(new URL('../public/growth/seven-scorecards.png', import.meta.url)),
);
console.log(JSON.stringify({ output: 'public/growth/seven-scorecards.{svg,png}', eligiblePosts: rows.length,
  medianImpressions: median, repostsAndQuotes, knownOriginals: report.knownOriginals, asOf: report.asOf }));
