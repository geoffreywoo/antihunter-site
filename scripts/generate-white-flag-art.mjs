/**
 * Reproduce: node scripts/generate-white-flag-art.mjs
 * The reviewed, committed portrait SVG is the editable source of truth. This script
 * renders it without modifying it and creates a separate landscape composition.
 * No private files, network, model calls, or claimed sponsorships. PNG rendering
 * uses sharp and the host's generic serif/monospace fonts, as the other art scripts do.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = new URL('../public/growth/', import.meta.url);
const portrait = await readFile(new URL('white-flag.svg', root));
const source = portrait.toString('utf8');
if (!source.includes('width="1200" height="1500"')
  || !source.includes('SPONSORSHIP') || !source.includes('AVAILABLE') || !source.includes('SATIRE')) {
  throw new Error('The portrait source must retain its reviewed dimensions, headline and satire label.');
}
await sharp(portrait).png().toFile(new URL('white-flag.png', root).pathname);

const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<title>The sponsored white flag — Anti Hunter original satire</title>
<desc>A complete white flag reads SPONSORSHIP AVAILABLE. Beside it: Concede the argument. Retain the inventory. A visible SATIRE stamp identifies this fictional scene; no sponsor, price or actual advertising sale is depicted.</desc>
<defs><pattern id="grain" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.7" fill="#d8c67d" opacity=".13"/></pattern></defs>
<rect width="1200" height="630" fill="#1c2018"/><rect width="1200" height="630" fill="url(#grain)"/>
<g fill="#d8c67d" font-family="monospace"><text x="54" y="63" font-size="23" letter-spacing="3">ANTI HUNTER / EXPENSIVE HUMANS</text><rect x="984" y="30" width="162" height="48" fill="none" stroke="#d8c67d" stroke-width="2"/><text x="1065" y="61" text-anchor="middle" font-size="22" letter-spacing="2">SATIRE</text><path d="M54 103H1146" stroke="#70694b"/></g>
<g><ellipse cx="349" cy="531" rx="262" ry="18" fill="#11150f" opacity=".85"/><path d="M108 152V526" stroke="#b19b55" stroke-width="12"/><circle cx="108" cy="141" r="13" fill="#dac987"/>
<path d="M116 164C273 129 426 195 625 153L607 430C429 478 279 413 116 451Z" fill="#ede9d8"/>
<path d="M608 171L625 153L607 430L589 445Z" fill="#cac4aa"/>
<path d="M133 184C280 156 440 214 603 180M133 430C298 400 446 459 586 430" fill="none" stroke="#c9c3aa" stroke-width="2"/>
<g fill="#24291e" font-family="monospace" font-weight="bold" text-anchor="middle" transform="rotate(2 365 290)"><text x="365" y="265" font-size="43" letter-spacing="-1">SPONSORSHIP</text><text x="365" y="321" font-size="43" letter-spacing="-1">AVAILABLE</text><path d="M225 351H505" stroke="#b4ac8d" stroke-width="2"/><text x="365" y="384" font-size="15" font-weight="normal" letter-spacing="3">UNSOLD PRINCIPLE</text></g></g>
<g fill="#ede7cb" font-family="Georgia,serif" font-size="54"><text x="681" y="238">Concede the</text><text x="681" y="299">argument.</text><text x="681" y="397" font-style="italic">Retain the</text><text x="681" y="458" font-style="italic">inventory.</text></g>
<path d="M54 567H1146" stroke="#70694b"/><g font-family="monospace" fill="#d8c67d" font-size="18"><text x="54" y="604">ORIGINAL SATIRE / IMAGINED SCENE</text><text x="1146" y="604" text-anchor="end">antihunter.com</text></g>
</svg>`;
await writeFile(new URL('white-flag-preview.svg', root), preview);
await sharp(Buffer.from(preview)).png().toFile(new URL('white-flag-preview.png', root).pathname);
const files = {};
for (const name of ['white-flag.svg', 'white-flag.png', 'white-flag-preview.svg', 'white-flag-preview.png']) {
  const bytes = await readFile(new URL(name, root));
  const dimensions = name.endsWith('.png') ? await sharp(bytes).metadata() : null;
  files[name] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
    ...(dimensions ? { width: dimensions.width, height: dimensions.height } : {}) };
}
console.log(JSON.stringify({ files }, null, 2));
