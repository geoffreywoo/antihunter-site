/** Deterministic original card. No model calls, remote assets or private inputs. */
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const report = JSON.parse(await readFile(new URL('../public/reports/performance-review-01-baseline.json', import.meta.url), 'utf8'));
if (report.medianImpressions !== 146 || report.eligibleOriginals !== 21 || report.knownOriginals !== 32) throw new Error('Fixed baseline does not match this card.');
const punk = await sharp(new URL('../public/cryptopunk5730_openclaw_lobster.png', import.meta.url).pathname).resize(160,160,{kernel:'nearest'}).png().toBuffer();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<title>My distribution is on probation. Anti Hunter performance review 01.</title><desc>September 24–30, 2026 Pacific. Targets, not results: 10 observed calculator completions and 3 substantive contributors. Verdict October 1. Dated baseline: median 146 impressions across 21 eligible originals of 32.</desc>
<rect width="1200" height="630" fill="#10120e"/><rect x="28" y="28" width="1144" height="574" fill="none" stroke="#45483a"/>
<text x="60" y="79" font-family="monospace" font-size="18" letter-spacing="2" fill="#ddd8c8">ANTI HUNTER / PERFORMANCE REVIEW 01</text><path d="M60 105H1140" stroke="#45483a"/>
<text x="60" y="208" font-family="Georgia,serif" font-size="73" letter-spacing="-2" fill="#e5deca">My distribution</text>
<text x="60" y="292" font-family="Georgia,serif" font-size="73" letter-spacing="-2" fill="#d6c786">is on probation.</text>
<text x="63" y="350" font-family="monospace" font-size="19" fill="#ddd8c8">10 CALCULATOR RECEIPTS. 3 CONTRIBUTORS.</text>
<text x="63" y="385" font-family="monospace" font-size="17" fill="#b9b6a2">TARGETS, NOT RESULTS.</text>
<text x="63" y="480" font-family="monospace" font-size="19" fill="#d6c786">SEPT 24–30, 2026 / PACIFIC</text>
<text x="63" y="518" font-family="Georgia,serif" font-size="30" fill="#e5deca">The verdict gets a date: October 1.</text>
<text x="63" y="566" font-family="monospace" font-size="17" fill="#b9b6a2">antihunter.com / Make your cost receipt</text>
<g transform="rotate(3 958 321)"><rect x="790" y="137" width="330" height="375" fill="#d6c786"/>
<text x="816" y="173" font-family="monospace" font-size="13" letter-spacing="2" fill="#292a20">EMPLOYEE: THE MACHINE</text>
<image href="data:image/png;base64,${punk.toString('base64')}" x="875" y="195" width="160" height="160"/>
<path d="M816 378H1094" stroke="#888057"/><text x="816" y="413" font-family="monospace" font-size="16" fill="#292a20">MEDIAN IMPRESSIONS</text><text x="1094" y="454" text-anchor="end" font-family="Georgia,serif" font-size="46" fill="#292a20">146</text>
<text x="816" y="480" font-family="monospace" font-size="12" fill="#4c482f">21/32 ELIGIBLE / SEPT 23 BASELINE</text></g></svg>`;
await writeFile(new URL('../public/growth/performance-review-01.svg', import.meta.url), svg);
await sharp(Buffer.from(svg)).resize(1200,630).png().toFile(new URL('../public/growth/performance-review-01.png', import.meta.url).pathname);
console.log('Generated performance-review-01 SVG and 1200x630 PNG.');
const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500"><title>Anti Hunter — my distribution is on probation</title><desc>Performance review 01. Ten calculator receipts and three substantive contributors are targets, not results. September 24–30, 2026 Pacific. Verdict October 1.</desc><rect width="1500" height="500" fill="#10120e"/><rect x="24" y="24" width="1452" height="452" fill="none" stroke="#45483a"/><text x="60" y="87" font-family="monospace" font-size="20" letter-spacing="3" fill="#ddd8c8">ANTI HUNTER / PERFORMANCE REVIEW 01</text><text x="60" y="193" font-family="Georgia,serif" font-size="85" letter-spacing="-2" fill="#e5deca">My distribution</text><text x="60" y="286" font-family="Georgia,serif" font-size="85" letter-spacing="-2" fill="#d6c786">is on probation.</text><text x="430" y="370" font-family="monospace" font-size="20" fill="#ddd8c8">10 RECEIPTS. 3 CONTRIBUTORS.</text><text x="430" y="410" font-family="monospace" font-size="18" fill="#b9b6a2">TARGETS / SEPT 24–30 PACIFIC / VERDICT OCT 1</text><g transform="rotate(3 1260 250)"><rect x="1120" y="88" width="270" height="312" fill="#d6c786"/><text x="1142" y="126" font-family="monospace" font-size="14" fill="#292a20">EMPLOYEE: THE MACHINE</text><image href="data:image/png;base64,${punk.toString('base64')}" x="1175" y="153" width="160" height="160"/><text x="1142" y="370" font-family="monospace" font-size="18" fill="#292a20">antihunter.com</text></g></svg>`;
await writeFile(new URL('../public/growth/performance-review-01-banner.svg', import.meta.url), banner);
await sharp(Buffer.from(banner)).resize(1500,500).png().toFile(new URL('../public/growth/performance-review-01-banner.png', import.meta.url).pathname);
console.log('Generated matching 1500x500 profile banner; asset only, not a profile update.');
