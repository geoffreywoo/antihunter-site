#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const workspaceRoot = path.resolve(siteRoot, '..');

const sourcePath = path.join(workspaceRoot, 'memory', 'x_self_posts.jsonl');
const queueStatePath = path.join(workspaceRoot, 'memory', 'x_post_queue_state.json');
const decisionsPath = path.join(workspaceRoot, 'memory', 'x_engagement_policy_decisions.jsonl');
const contextPath = path.join(workspaceRoot, 'memory', 'x_engagement_context.jsonl');
const outPath = path.join(siteRoot, 'src', 'data', 'sigil-winners.json');
const manualPath = path.join(siteRoot, 'src', 'data', 'sigil-winners-manual.json');

const CLAIM_SCAM_TERMS = [
  'claim now', 'claim link', 'airdrop', 'holders only', 'connect wallet', 'verify wallet', 'mint now', 'drop is live', 'antihunterevent.org'
];

function safeJson(line) {
  try { return JSON.parse(line); } catch { return null; }
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(safeJson).filter(Boolean);
}

function tweetIdFromUrl(url) {
  const m = String(url || '').match(/\/status\/(\d+)/i);
  return m?.[1] ?? null;
}

function parseTs(v) {
  const t = Date.parse(String(v || ''));
  return Number.isFinite(t) ? t : 0;
}

function isSelfWinnerPost(row) {
  const text = String(row?.text || '').toLowerCase();
  const url = String(row?.anchorUrl || row?.url || '');
  if (!url.includes('/status/')) return false;
  if (!text.includes('sigil')) return false;
  if (text.includes('cannot grant') || text.includes('cannot award') || text.includes('no image/video proof')) return false;
  return (
    text.includes('verified irl') ||
    text.includes('irl sigil contribution') ||
    text.includes('bestow') ||
    text.includes('awarded') ||
    text.includes('performance-based')
  );
}

function containsScamTerms(text) {
  const t = String(text || '').toLowerCase();
  return CLAIM_SCAM_TERMS.some((k) => t.includes(k));
}

function canonicalUrlFor(tweetId, authorUsername) {
  if (!tweetId) return null;
  if (authorUsername) return `https://x.com/${authorUsername}/status/${tweetId}`;
  return `https://x.com/i/web/status/${tweetId}`;
}

function main() {
  const selfPosts = readJsonl(sourcePath);
  const decisions = readJsonl(decisionsPath);
  const contexts = readJsonl(contextPath);

  const postedByUrl = {};
  if (fs.existsSync(queueStatePath)) {
    try {
      const state = JSON.parse(fs.readFileSync(queueStatePath, 'utf8'));
      for (const v of Object.values(state?.posted || {})) {
        const u = String(v?.url || '').trim();
        if (u) postedByUrl[u] = v;
      }
    } catch {}
  }

  const latestDecisionByParent = {};
  for (const d of decisions) {
    const id = String(d?.parentTweetId || '').trim();
    if (!id) continue;
    const prev = latestDecisionByParent[id];
    if (!prev || parseTs(d.tsEt) >= parseTs(prev.tsEt)) latestDecisionByParent[id] = d;
  }

  const latestContextByTweet = {};
  for (const c of contexts) {
    const id = tweetIdFromUrl(c?.anchorUrl || '');
    if (!id) continue;
    const prev = latestContextByTweet[id];
    if (!prev || parseTs(c.tsEt) >= parseTs(prev.tsEt)) latestContextByTweet[id] = c;
  }

  // flush and rebuild from first principles
  const winners = [];
  const seen = new Set();

  for (const row of selfPosts) {
    if (!isSelfWinnerPost(row)) continue;

    const sourcePostUrl = String(row.anchorUrl || row.url || '').trim();
    const sourceMeta = postedByUrl[sourcePostUrl] || {};
    const parentTweetId = String(row.parentTweetId || sourceMeta.parentTweetId || '').trim();
    if (!parentTweetId) continue;

    const decision = latestDecisionByParent[parentTweetId] || {};
    const context = latestContextByTweet[parentTweetId] || {};

    // First-principles filter:
    // 1) must be sigil-themed and non-scam
    const parentText = String(context.text || decision.contextText || '');
    const sigilByDecision = decision.sigilDetected === true;
    const sigilByText = parentText.toLowerCase().includes('sigil');
    if (!sigilByDecision && !sigilByText) continue;
    if (decision.scamSuspected === true) continue;
    if (containsScamTerms(parentText)) continue;

    // 2) must include media (video/photo/gif)
    const mediaTypes = (context.mediaTypes || decision.mediaTypes || []).map((x) => String(x).toLowerCase());
    const hasMedia = Boolean(context.hasMedia ?? decision.hasMedia ?? mediaTypes.length);
    const hasVisualMedia = mediaTypes.some((t) => ['video', 'photo', 'animated_gif'].includes(t));
    if (!hasMedia || !hasVisualMedia) continue;

    // 3) reject synthetic flags when known
    const mediaAuth = String(decision.mediaAuthenticity || '').toLowerCase();
    if (mediaAuth === 'synthetic') continue;

    const authorUsername = String(context.authorUsername || decision.authorUsername || '').trim();
    const url = canonicalUrlFor(parentTweetId, authorUsername);
    if (!url || seen.has(url)) continue;

    seen.add(url);
    winners.push({
      url,
      sourcePostUrl,
      parentTweetId,
      authorUsername: authorUsername || null,
      mediaTypes,
      tsEt: row.tsEt || sourceMeta.postedAtEt || null,
      label: `winner #${winners.length + 1}`,
    });
  }

  // merge explicit manual includes (human-curated)
  if (fs.existsSync(manualPath)) {
    try {
      const manual = JSON.parse(fs.readFileSync(manualPath, 'utf8'));
      for (const m of Array.isArray(manual) ? manual : []) {
        const url = String(m?.url || '').trim().split('?')[0];
        if (!url || seen.has(url)) continue;
        seen.add(url);
        winners.push({
          url,
          source: 'manual_include',
          parentTweetId: tweetIdFromUrl(url),
          authorUsername: null,
          mediaTypes: [],
          tsEt: null,
          label: `winner #${winners.length + 1}`,
        });
      }
    } catch {}
  }

  winners.sort((a, b) => parseTs(b.tsEt) - parseTs(a.tsEt));
  winners.forEach((w, i) => { w.label = `winner #${i + 1}`; });

  fs.writeFileSync(outPath, JSON.stringify(winners, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ status: 'ok', outPath, winners: winners.length }));
}

main();
