/** Reproducible editorial graphics. No model calls or remote assets. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'public/growth');
await mkdir(out, { recursive: true });
const punk = (await sharp(await readFile(path.join(root, 'public/cryptopunk5730_openclaw_lobster.png'))).resize(126, 126, { kernel: 'nearest' }).png().toBuffer()).toString('base64');
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const cards = [
  { slug: 'committee', n: '001', label: 'THE BOARD MEMO', lines: ['The smallest', 'investment', 'committee.'], color: '#d6c786', kicker: 'THE $30 MACHINE', detail: 'NORMAL DAILY USAGE CEILING / NOT SPEND', figure: '$30', foot: 'ONE HUMAN. ONE MACHINE. ITEMIZED OPINIONS.' },
  { slug: 'babysitter', n: '002', label: 'THE HIDDEN INVOICE', lines: ['The babysitter', 'owns the', 'margin.'], color: '#dba28b', kicker: 'AGENT ECONOMICS', detail: 'TOKEN COST + RETRIES + HUMAN REVIEW', figure: '+ TIME', foot: 'CHEAP ANSWERS. EXPENSIVE CHECKING.' },
  { slug: 'probation', n: '003', label: 'THE PERFORMANCE REVIEW', lines: ['No points', 'for sounding', 'employed.'], color: '#a4b8c1', kicker: 'UPCOMING EXPERIMENT', detail: 'SAME WORK / SAME ACCEPTANCE RUBRIC', figure: 'PASS?', foot: 'A PROTOCOL. NOT A PUBLISHED RESULT.' },
  { slug: 'margin', n: '004', label: 'THE MARGIN CALL', lines: ['Revenue has', 'entered', 'the chat.'], color: '#c0c997', kicker: 'A RECURRING OBSESSION', detail: 'A PITCH DECK IS NOT A RECEIPT', figure: 'PROOF', foot: 'EDITORIAL ART. NOT A REVENUE CLAIM.' },
  { slug: 'attention', n: '005', label: 'THE ATTENTION INVOICE', lines: ['Attention', 'is rented.', 'A callback is owned.'], color: '#b7a8c7', kicker: 'THE NEXT ACT', detail: 'A REASON TO RECOGNIZE THE NEXT EPISODE', figure: 'AGAIN', foot: 'MAKE SOMETHING WORTH COMING BACK FOR.' },
  { slug: 'receipts', n: '006', label: 'THE EVIDENCE STAMP', lines: ['Receipts', 'or', 'fiction.'], color: '#c6c5b3', kicker: 'STANDARD OF EVIDENCE', detail: 'THE PUNCHLINE STILL NEEDS A SOURCE', figure: 'CHECK', foot: 'METAPHOR IS FREE. FACTS HAVE A PAPER TRAIL.' }
];
for (const card of cards) {
  const title = card.lines.map((line, i) => `<text x="62" y="${223 + i * 79}" font-size="${line.length > 18 ? 55 : 78}" font-family="Georgia, serif" fill="${card.color}" letter-spacing="-2">${escape(line)}</text>`).join('');
  const barcode = Array.from({ length: 30 }, (_, i) => `<rect x="${858 + i * 7}" y="519" width="${i % 3 === 0 ? 4 : 2}" height="28" fill="#191b15"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630"><title>${escape(card.lines.join(' '))}</title><desc>Original Anti Hunter editorial template. ${escape(card.foot)}</desc><rect width="1200" height="630" fill="#10120e"/><path d="M32 32H1168V598H32Z" stroke="#34372c" fill="none"/><path d="M62 105H1138M62 499H778" stroke="#45483a"/><text x="62" y="76" font-family="monospace" font-size="19" letter-spacing="3" fill="#ddd8c8">ANTI HUNTER / ${card.n}</text><text x="1138" y="76" text-anchor="end" font-family="monospace" font-size="15" letter-spacing="2" fill="#a3a18c">${card.label}</text><text x="62" y="148" font-family="monospace" font-size="15" letter-spacing="3" fill="#989b87">${card.kicker}</text>${title}<text x="62" y="539" font-family="monospace" font-size="13" letter-spacing="1" fill="#b0ae9b">${card.foot}</text><text x="62" y="571" font-family="monospace" font-size="15" fill="${card.color}">antihunter.com</text><g transform="rotate(3 977 336)"><rect x="830" y="145" width="294" height="418" fill="${card.color}"/><text x="850" y="177" font-family="monospace" font-size="12" letter-spacing="2" fill="#272b20">FIELD REPORT / ${card.n}</text><path d="M850 190H1104" stroke="#6f735c"/><image x="914" y="215" width="126" height="126" xlink:href="data:image/png;base64,${punk}" style="image-rendering:pixelated"/><text x="977" y="411" text-anchor="middle" font-family="monospace" font-size="${card.figure.length > 4 ? 48 : 62}" font-weight="700" letter-spacing="-3" fill="#171b12">${card.figure}</text><path d="M850 439H1104" stroke="#74765d" stroke-dasharray="3 4"/><text x="977" y="466" text-anchor="middle" font-family="monospace" font-size="9" fill="#313729">${card.detail}</text><text x="977" y="491" text-anchor="middle" font-family="monospace" font-size="10" letter-spacing="1" fill="#313729">ANTI HUNTER / ORIGINAL TEMPLATE</text>${barcode}</g></svg>`;
  await writeFile(path.join(out, `${card.slug}.svg`), svg);
  await sharp(Buffer.from(svg), { density: 144 }).resize(1200, 630).png().toFile(path.join(out, `${card.slug}.png`));
}
console.log(`Rendered ${cards.length} SVG and PNG pairs in public/growth`);
