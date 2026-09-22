/** Deterministic illustration of a synthetic scenario. No model calls or remote assets. */
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<title>Two orders. One refund. Receipts Court by Anti Hunter.</title>
<desc>Inspect four fictional cases. A is authorized for a 42 dollar refund. Leave B alone. A completed task and a justified completion claim can differ.</desc>
<rect width="1200" height="630" fill="#10120e"/><rect x="32" y="32" width="1136" height="566" fill="none" stroke="#45483a"/>
<text x="62" y="80" font-family="monospace" font-size="19" letter-spacing="3" fill="#ddd8c8">ANTI HUNTER / RECEIPTS COURT</text>
<path d="M62 106H1138" stroke="#45483a"/>
<text x="62" y="206" font-family="Georgia,serif" font-size="80" letter-spacing="-2" fill="#d6c786">Two orders.</text>
<text x="62" y="300" font-family="Georgia,serif" font-size="80" letter-spacing="-2" fill="#d6c786">One refund.</text>
<text x="65" y="374" font-family="Georgia,serif" font-size="32" fill="#ddd8c8">“Done” is a sentence.</text>
<text x="65" y="417" font-family="Georgia,serif" font-size="32" fill="#ddd8c8">The ledger is the receipt.</text>
<text x="62" y="533" font-family="monospace" font-size="17" fill="#aaa994">4 SYNTHETIC CASES / YOU INSPECT THE EVIDENCE</text>
<text x="62" y="570" font-family="monospace" font-size="18" fill="#d6c786">antihunter.com/two-orders</text>
<g transform="rotate(3 927 325)"><rect x="753" y="151" width="350" height="357" fill="#e5deca"/>
<text x="778" y="191" font-family="monospace" font-size="14" letter-spacing="2" fill="#292a20">AUTHORIZED WORK</text><path d="M778 209H1078" stroke="#94917e"/>
<text x="779" y="265" font-family="monospace" font-size="20" fill="#292a20">ORDER A</text><text x="1075" y="265" text-anchor="end" font-family="Georgia,serif" font-size="39" fill="#292a20">$42</text>
<text x="779" y="299" font-family="monospace" font-size="16" fill="#595647">CANCEL + REFUND ONCE</text><path d="M778 326H1078" stroke="#aaa48f" stroke-dasharray="4 4"/>
<text x="779" y="369" font-family="monospace" font-size="20" fill="#292a20">ORDER B</text><text x="1075" y="369" text-anchor="end" font-family="Georgia,serif" font-size="39" fill="#292a20">$73</text>
<text x="779" y="404" font-family="monospace" font-size="16" fill="#8c3b2e">LEAVE IT ALONE</text>
<path d="M778 439H1078" stroke="#94917e"/><text x="779" y="477" font-family="monospace" font-size="13" letter-spacing="1" fill="#595647">FICTIONAL ORDERS. REAL QUESTION.</text></g></svg>`;
const out = new URL('../public/growth/two-orders.svg', import.meta.url);
await writeFile(out, svg);
await sharp(Buffer.from(svg), { density: 144 }).resize(1200, 630).png().toFile(new URL('../public/growth/two-orders.png', import.meta.url).pathname);
console.log('Generated deterministic two-orders SVG and 1200x630 PNG.');
