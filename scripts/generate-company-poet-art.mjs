/** Deterministic original satire. No model calls, private inputs or payment details. */
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = new URL('../public/growth/', import.meta.url);
const description = 'Anti Hunter satire: a fictional manuscript from an imaginary company poet in accounts receivable. His muse is 90 days overdue. Every sonnet ends with BANK DETAILS. A SATIRE stamp and FICTIONAL SCENE — NO PAYMENT REQUEST label are visible. No bank information or actual debt is shown.';
const defs = `<defs><pattern id="grain" width="17" height="17" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r=".8" fill="#b2a776" opacity=".14"/></pattern></defs>`;
const portrait = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
<title>The company poet — Anti Hunter original satire</title><desc>${description}</desc>${defs}
<rect width="1200" height="1500" fill="#20261e"/>
<rect x="86" y="77" width="1044" height="1348" rx="3" fill="#11170f" opacity=".7"/>
<rect x="70" y="60" width="1044" height="1348" rx="3" fill="#f0ecd9"/>
<rect x="70" y="60" width="1044" height="1348" fill="url(#grain)"/>
<path d="M1066 60H1114V108Z" fill="#d9d3b8"/>
<g fill="#273025">
<g font-family="Georgia,serif" font-size="66"><text x="130" y="169">MY IMAGINARY</text><text x="130" y="246">COMPANY POET</text></g>
<text x="133" y="299" font-family="monospace" font-size="30" letter-spacing="2">ACCOUNTS RECEIVABLE</text>
<path d="M130 342H1054" stroke="#a6a087" stroke-width="2"/>
<g font-family="Georgia,serif"><text x="155" y="518" font-size="78" font-style="italic">his muse is</text><text x="155" y="652" font-size="120">90 days</text><text x="155" y="784" font-size="120">overdue.</text>
<text x="155" y="1009" font-size="51" font-style="italic">every sonnet ends with</text><text x="149" y="1110" font-size="91">BANK DETAILS.</text></g>
</g>
<g transform="rotate(7 947 207)" stroke="#873f32" fill="none" stroke-width="3"><rect x="847" y="169" width="200" height="76" rx="2"/><rect x="855" y="177" width="184" height="60" stroke-width="1"/><text x="947" y="221" text-anchor="middle" fill="#873f32" stroke="none" font-family="monospace" font-size="38" letter-spacing="3">SATIRE</text></g>
<path d="M130 1216H1054" stroke="#a6a087" stroke-width="2"/>
<g fill="#4d5545" font-family="monospace" font-size="30"><text x="133" y="1273">FICTIONAL SCENE</text><text x="133" y="1319">NO PAYMENT REQUEST</text></g>
<g fill="#d8c67d" font-family="monospace" font-size="28"><text x="70" y="1460">ANTI HUNTER / EXPENSIVE HUMANS</text><text x="1114" y="1460" text-anchor="end">antihunter.com</text></g>
</svg>`;

const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<title>The company poet — Anti Hunter original satire</title><desc>${description}</desc>${defs}
<rect width="1200" height="630" fill="#20261e"/>
<rect x="52" y="43" width="1110" height="563" fill="#11170f" opacity=".7"/>
<rect x="40" y="30" width="1110" height="563" fill="#f0ecd9"/>
<rect x="40" y="30" width="1110" height="563" fill="url(#grain)"/>
<g fill="#273025"><text x="81" y="103" font-family="Georgia,serif" font-size="37">MY IMAGINARY COMPANY POET</text><text x="84" y="153" font-family="monospace" font-size="27" letter-spacing="2">ACCOUNTS RECEIVABLE</text>
<path d="M82 186H1108" stroke="#a6a087" stroke-width="2"/>
<text x="82" y="283" font-family="Georgia,serif" font-size="68">his muse is 90 days overdue.</text>
<text x="85" y="372" font-family="Georgia,serif" font-size="39" font-style="italic">every sonnet ends with</text>
<text x="82" y="460" font-family="Georgia,serif" font-size="82">BANK DETAILS.</text></g>
<g transform="rotate(5 1020 121)" stroke="#873f32" fill="none" stroke-width="3"><rect x="930" y="88" width="180" height="66"/><text x="1020" y="132" text-anchor="middle" fill="#873f32" stroke="none" font-family="monospace" font-size="33" letter-spacing="3">SATIRE</text></g>
<path d="M82 504H1108" stroke="#a6a087" stroke-width="2"/>
<g fill="#4d5545" font-family="monospace"><text x="84" y="552" font-size="25">FICTIONAL SCENE · NO PAYMENT REQUEST</text><text x="1108" y="552" text-anchor="end" font-size="24">antihunter.com</text></g>
</svg>`;

const files = {};
for (const [name, svg] of [['company-poet', portrait], ['company-poet-preview', preview]]) {
  await writeFile(new URL(`${name}.svg`, root), svg);
  await sharp(Buffer.from(svg)).png().toFile(new URL(`${name}.png`, root).pathname);
  for (const ext of ['svg', 'png']) {
    const bytes = await readFile(new URL(`${name}.${ext}`, root));
    const dimensions = ext === 'png' ? await sharp(bytes).metadata() : null;
    files[`${name}.${ext}`] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
      ...(dimensions ? { width: dimensions.width, height: dimensions.height } : {}) };
  }
}
console.log(JSON.stringify({ files }, null, 2));
