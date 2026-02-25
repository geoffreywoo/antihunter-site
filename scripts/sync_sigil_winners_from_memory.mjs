#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const workspaceRoot = path.resolve(siteRoot, '..');
const sourcePath = path.join(workspaceRoot, 'memory', 'x_self_posts.jsonl');
const outPath = path.join(siteRoot, 'src', 'data', 'sigil-winners.json');
const queueStatePath = path.join(workspaceRoot, 'memory', 'x_post_queue_state.json');

function safeJson(line) {
  try { return JSON.parse(line); } catch { return null; }
}

function isWinnerRow(r) {
  const text = String(r?.text || '').toLowerCase();
  const url = String(r?.anchorUrl || r?.url || '');
  if (!url.includes('/status/')) return false;
  if (!text.includes('sigil')) return false;
  const rewardSignals = [
    'bestow',
    'awarded',
    'reward',
    'verified irl',
    'irl sigil contribution',
    'performance-based',
    'likes + views',
    '100,000,000',
    '100000000'
  ];
  const denySignals = [
    'cannot grant',
    'cannot award',
    'cannot verify',
    'no image/video proof',
    'no proof attached',
    'cannot grant irl credit'
  ];
  if (denySignals.some((k) => text.includes(k))) return false;
  return rewardSignals.some((k) => text.includes(k));
}

function main() {
  if (!fs.existsSync(sourcePath)) {
    console.error(`missing source: ${sourcePath}`);
    process.exit(1);
  }

  const lines = fs.readFileSync(sourcePath, 'utf8').split('\n').filter(Boolean);
  const rows = lines.map(safeJson).filter(Boolean);

  let postedByUrl = {};
  if (fs.existsSync(queueStatePath)) {
    try {
      const st = JSON.parse(fs.readFileSync(queueStatePath, 'utf8'));
      const posted = st?.posted || {};
      for (const v of Object.values(posted)) {
        const u = String(v?.url || '').trim();
        if (u) postedByUrl[u] = v;
      }
    } catch {}
  }

  const winners = [];
  const seen = new Set();

  for (const r of rows) {
    if (!isWinnerRow(r)) continue;
    const postedUrl = String(r.anchorUrl || r.url || '').trim();
    if (!postedUrl) continue;

    // Prefer underlying media post for embeds (parent of our QT/reply), fallback to our post.
    const postedMeta = postedByUrl[postedUrl] || {};
    const parentTweetId = String(r.parentTweetId || postedMeta.parentTweetId || '').trim();
    const url = parentTweetId ? `https://x.com/i/web/status/${parentTweetId}` : postedUrl;

    if (!url || seen.has(url)) continue;
    seen.add(url);
    winners.push({
      url,
      sourcePostUrl: postedUrl,
      parentTweetId: parentTweetId || null,
      tsEt: r.tsEt || postedMeta.postedAtEt || null,
      kind: r.kind || null,
      label: `winner #${winners.length + 1}`
    });
  }

  // newest first
  winners.sort((a, b) => String(b.tsEt || '').localeCompare(String(a.tsEt || '')));

  fs.writeFileSync(outPath, JSON.stringify(winners, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ status: 'ok', sourcePath, outPath, winners: winners.length }));
}

main();
