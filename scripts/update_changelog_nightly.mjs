#!/usr/bin/env node
/**
 * Nightly changelog rollup.
 *
 * Canonical store: src/data/changelog.json
 * Render adapter: src/data/changelog.ts imports JSON
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8').trim();
}

function getTodayET() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const m = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  return `${m.year}-${m.month}-${m.day}`;
}

function getRepoCommitsSinceMidnight(repoPath = '.', label = 'repo') {
  const repoArg = repoPath ? ` -C "${repoPath}"` : '';

  try {
    sh(`git${repoArg} fetch --prune origin`);
  } catch {
    console.warn(`[changelog] git fetch origin failed for ${label}; falling back to local ref.`);
  }

  const ref = (() => {
    try {
      sh(`git${repoArg} rev-parse --verify origin/main`);
      return 'origin/main';
    } catch {
      return 'HEAD';
    }
  })();

  const out = sh(`git${repoArg} log ${ref} --no-merges --since="today 00:00" --pretty=%h:::%s`);
  if (!out) return [];
  return out
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map(line => {
      const [hash, ...rest] = line.split(':::');
      return { hash, subject: rest.join(':::').trim() };
    })
    .filter(x => x.subject && !/^Merge /.test(x.subject));
}

function toETDateString(input) {
  const d = new Date(input);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const m = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  return `${m.year}-${m.month}-${m.day}`;
}

function loadJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').map(l => l.trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
    try {
      out.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }
  return out;
}

function getReadingDistillInsightsForETDay(today) {
  const workspaceRoot = path.resolve('..');
  const thesesPath = process.env.READING_THESES_PATH || path.join(workspaceRoot, 'memory', 'proposals', 'reading_theses.jsonl');
  if (!fs.existsSync(thesesPath)) return [];
  const rows = loadJsonl(thesesPath)
    .filter(r => r?.ts && toETDateString(r.ts) === today)
    .filter(r => r?.fetchOk !== false)
    .sort((a, b) => (b.noveltyScore ?? 0) - (a.noveltyScore ?? 0));

  const seen = new Set();
  const picked = [];
  for (const r of rows) {
    const key = `${r.source || ''}::${r.title || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push({
      source: r.source || 'reading distill',
      title: r.title || 'untitled source',
      noveltyScore: r.noveltyScore ?? 0,
    });
    if (picked.length >= 3) break;
  }

  return picked;
}

function cleanSubject(s) {
  return String(s || '')
    .replace(/^[a-z0-9_-]+:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentenceFromList(items) {
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function pickExamples(subjects, re, n = 3) {
  return subjects.filter(s => re.test(s)).slice(0, n).map(cleanSubject);
}

function buildNarrativeRollup({ today, siteCommits, clawfableCommits, readingTop }) {
  const siteSubjects = siteCommits.map(c => c.subject);
  const clawSubjects = clawfableCommits.map(c => c.subject);

  const siteRefresh = pickExamples(siteSubjects, /(treasury|winner|refresh|changelog|rollup|backup)/i, 3);
  const clawOnboarding = pickExamples(clawSubjects, /(openclaw-template|upload|onboarding|skill\.md|skill\.json|redirect|install|revise|handle|claim|verify)/i, 4);
  const clawReliability = pickExamples(clawSubjects, /(fix|repair|corrupt|revert|content-core|syntax|build|delete mode|artifacts api|barrel)/i, 4);
  const clawBrand = pickExamples(clawSubjects, /(logo|icon|favicon|apple-icon|nav|footer|twitter:site|@clawfable)/i, 3);

  const parts = [];

  if (siteCommits.length) {
    parts.push(
      `On antihunter.com, execution stayed in continuity mode: ${siteCommits.length} commit${siteCommits.length === 1 ? '' : 's'} kept treasury/winner state and public changelog cadence current (${sentenceFromList(siteRefresh) || 'daily refresh and rollup maintenance'}).`
    );
  }

  if (clawfableCommits.length) {
    const sub = [];
    if (clawOnboarding.length) sub.push(`the onboarding/protocol surface was tightened via ${sentenceFromList(clawOnboarding)}`);
    if (clawReliability.length) sub.push(`core reliability was hardened with ${sentenceFromList(clawReliability)}`);
    if (clawBrand.length) sub.push(`brand/distribution touchpoints were improved through ${sentenceFromList(clawBrand)}`);

    parts.push(
      `Across clawfable, the day was a substantive product + infrastructure sprint (${clawfableCommits.length} commits): ${sub.length ? sub.join('; ') : 'shipping velocity remained high across product, infra, and docs'}.`
    );
  }

  if (readingTop.length) {
    parts.push(`Reading distill also injected fresh signal from ${sentenceFromList(readingTop.map(r => `${r.source}: ${r.title}`).slice(0, 3))}.`);
  }

  if (!parts.length) {
    parts.push('Execution progressed with verifiable artifacts across product and infrastructure surfaces.');
  }

  return `Nightly rollup (${today}): ${parts.join(' ')}`;
}

function dayFromBase(today) {
  const base = new Date('2026-02-06T00:00:00-05:00');
  const d = new Date(`${today}T00:00:00-05:00`);
  return Math.floor((d.getTime() - base.getTime()) / 86400000);
}

function loadChangelog(changelogPath) {
  if (!fs.existsSync(changelogPath)) return [];
  try {
    const raw = fs.readFileSync(changelogPath, 'utf8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    throw new Error('[changelog] changelog.json is malformed JSON');
  }
}

function ensureTodayEntryExists(entries, today) {
  const idx = entries.findIndex(e => e?.date === today);
  if (idx >= 0) return { entries, created: false, index: idx };

  const day = dayFromBase(today);
  const entry = {
    day,
    date: today,
    title: 'daily operations rollup',
    summary: 'prepared daily narrative rollup and execution receipts for antihunter.com.',
    links: [],
  };

  const next = [entry, ...entries].sort((a, b) => (b.day ?? 0) - (a.day ?? 0));
  return { entries: next, created: true, index: next.findIndex(e => e.date === today) };
}

function main() {
  const today = getTodayET();
  const siteCommits = getRepoCommitsSinceMidnight('.', 'antihunter-site');
  const clawfableRepo = process.env.CLAWFABLE_REPO || path.resolve('..', 'clawfable');
  const clawfableCommits = fs.existsSync(path.join(clawfableRepo, '.git'))
    ? getRepoCommitsSinceMidnight(clawfableRepo, 'clawfable')
    : [];
  const readingInsights = getReadingDistillInsightsForETDay(today);

  if (siteCommits.length === 0 && clawfableCommits.length === 0 && readingInsights.length === 0) {
    console.log(`[changelog] No commits or reading distill updates since midnight for ${today}; skipping.`);
    return;
  }

  const rollup = buildNarrativeRollup({
    today,
    siteCommits,
    clawfableCommits,
    readingTop: readingInsights.slice(0, 3),
  });

  const changelogPath = path.join('src', 'data', 'changelog.json');
  const entries = loadChangelog(changelogPath);
  const ensured = ensureTodayEntryExists(entries, today);
  const idx = ensured.index;
  if (idx < 0) {
    throw new Error(`[changelog] No entry found for date ${today} even after ensure step.`);
  }

  const current = ensured.entries[idx];
  const oldSummary = String(current.summary || '');
  const cleaned = oldSummary.replace(/\s*Nightly rollup \(\d{4}-\d{2}-\d{2}\):[\s\S]*$/m, '').trim();
  current.summary = `${cleaned}${cleaned ? ' ' : ''}${rollup}`.trim();
  if (!Array.isArray(current.links)) current.links = [];

  fs.writeFileSync(changelogPath, JSON.stringify(ensured.entries, null, 2) + '\n');

  // publish gate: schema + quality validation must pass before downstream build/push flows
  sh('node scripts/validate_changelog_json.mjs');

  if (ensured.created) {
    console.log(`[changelog] Inserted missing entry for ${today} before rollup.`);
  }
  console.log(`[changelog] Updated ${changelogPath} for ${today} with ${siteCommits.length} antihunter-site commits + ${readingInsights.length} reading insights + ${clawfableCommits.length} clawfable commits.`);
}

main();
