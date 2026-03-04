#!/usr/bin/env node
/**
 * Nightly changelog rollup.
 *
 * Goal: keep src/data/changelog.ts' entry for today's date aligned with what shipped today.
 * Strategy: append a compact commit-subject rollup to the existing summary.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8').trim();
}

function getTodayET() {
  // Format YYYY-MM-DD in America/New_York without pulling in extra deps.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const m = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  return `${m.year}-${m.month}-${m.day}`;
}

function getCommitSubjectsSinceMidnightRepo(repoPath = '.', label = 'antihunter-site') {
  const repoArg = repoPath ? ` -C "${repoPath}"` : '';

  // Swarm-aware: fetch remote first, then read from origin/main (not local HEAD only).
  try {
    sh(`git${repoArg} fetch --prune origin`);
  } catch (e) {
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

  const out = sh(`git${repoArg} log ${ref} --no-merges --since="today 00:00" --pretty=%s`);
  if (!out) return [];
  return out
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => !/^Merge /.test(s));
}

function escapeSingleQuotes(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
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
  const thesesPath = path.resolve('..', 'memory', 'proposals', 'reading_theses.jsonl');
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

    const thesis = Array.isArray(r.thesisCandidates)
      ? r.thesisCandidates[r.selectedIndex ?? 0] || r.thesisCandidates[0]
      : null;
    picked.push({
      source: r.source || 'reading distill',
      title: r.title || 'untitled source',
      thesis,
      noveltyScore: r.noveltyScore ?? 0,
    });
    if (picked.length >= 2) break;
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

function buildNarrativeRollup({ today, product, infra, strategy, readingTop, clawTop, extra }) {
  const productLine = product.length
    ? `On product, we shipped ${sentenceFromList(product.map(cleanSubject).slice(0, 3))}.`
    : '';

  const infraLine = infra.length
    ? `On infrastructure, we hardened reliability through ${sentenceFromList(infra.map(cleanSubject).slice(0, 2))}.`
    : '';

  const strategyLine = strategy.length
    ? `On operating strategy, we tightened execution discipline via ${sentenceFromList(strategy.map(cleanSubject).slice(0, 2))}.`
    : '';

  const readingLine = readingTop.length
    ? `Reading distill added fresh signal from ${sentenceFromList(readingTop.map(r => `${r.source}: ${r.title}`).slice(0, 2))}.`
    : '';

  const ecosystemLine = clawTop.length
    ? `Parallel ecosystem progress continued in clawfable with ${sentenceFromList(clawTop.map(cleanSubject).slice(0, 2))}.`
    : '';

  const lines = [productLine, infraLine, strategyLine, readingLine, ecosystemLine].filter(Boolean);
  const fallback = 'Execution progressed across product, infra, and signal loops with public artifacts.';

  return (
    `Nightly rollup (${today}): ` +
    `${lines.length ? lines.join(' ') : fallback} ` +
    `Net effect: clearer narrative continuity, stronger execution trust, and a faster learning loop.` +
    (extra > 0 ? ` (+${extra} additional antihunter-site commits.)` : '')
  );
}

function dayFromBase(today) {
  const base = new Date('2026-02-06T00:00:00-05:00');
  const d = new Date(`${today}T00:00:00-05:00`);
  return Math.floor((d.getTime() - base.getTime()) / 86400000);
}

function ensureTodayEntryExists(src, today) {
  const hasToday = new RegExp(`date:\\s*'${today}'`).test(src);
  if (hasToday) return { src, created: false };

  const day = dayFromBase(today);
  const entry =
`\t{\n\t\tday: ${day},\n\t\tdate: '${today}',\n\t\ttitle: 'daily operations rollup',\n\t\tsummary:\n\t\t\t'prepared daily narrative rollup and execution receipts for antihunter.com.',\n\t\tlinks: [],\n\t},\n`;

  const marker = 'export const changelog: ChangelogEntry[] = [\n';
  if (!src.includes(marker)) {
    throw new Error('[changelog] Could not find changelog array marker to insert today entry.');
  }

  return {
    src: src.replace(marker, marker + entry),
    created: true,
  };
}

function main() {
  const today = getTodayET();
  const subjects = getCommitSubjectsSinceMidnightRepo('.', 'antihunter-site');
  const clawfableRepo = path.resolve('..', 'clawfable');
  const clawfableSubjects = fs.existsSync(path.join(clawfableRepo, '.git'))
    ? getCommitSubjectsSinceMidnightRepo(clawfableRepo, 'clawfable')
    : [];
  const readingInsights = getReadingDistillInsightsForETDay(today);

  if (subjects.length === 0 && clawfableSubjects.length === 0 && readingInsights.length === 0) {
    console.log(`[changelog] No commits or reading distill updates since midnight for ${today}; skipping.`);
    return;
  }

  const top = subjects.slice(0, 10);
  const extra = subjects.length - top.length;

  const infraKw = /(infra|gateway|cron|watchdog|mutex|sync|mission control|node|orchestrat|reliab|failover|deploy|build)/i;
  const productKw = /(ui|ux|site|changelog|snapshot|report|post|publish|thread|queue|reply|quote|engagement)/i;
  const strategyKw = /(policy|rule|guard|risk|quality|priority|thesis|strategy|learn|feedback)/i;

  const infra = top.filter(s => infraKw.test(s)).slice(0, 2);
  const product = top.filter(s => productKw.test(s)).slice(0, 2);
  const strategy = top.filter(s => strategyKw.test(s)).slice(0, 2);

  const clawTop = clawfableSubjects.slice(0, 2);
  const readingTop = readingInsights.slice(0, 2);

  const rollup = buildNarrativeRollup({
    today,
    product,
    infra,
    strategy,
    readingTop,
    clawTop,
    extra,
  });

  const changelogPath = path.join('src', 'data', 'changelog.ts');
  let src = fs.readFileSync(changelogPath, 'utf8');

  const ensured = ensureTodayEntryExists(src, today);
  src = ensured.src;

  // Find the entry with date: 'YYYY-MM-DD' and patch its summary string.
  // Assumptions (current file style): summary is a single-quoted string on its own line.
  const entryRe = new RegExp(
    `(\\{[\\s\\S]*?date:\\s*'${today}'[\\s\\S]*?summary:\\s*\\n\\s*)'([^']*)'`,
    'm'
  );

  const m = src.match(entryRe);
  if (!m) {
    throw new Error(`[changelog] No entry found for date ${today} even after ensure step.`);
  }

  const prefix = m[1];
  const oldSummary = m[2];

  // If we already appended a rollup for today, replace it.
  const cleaned = oldSummary.replace(/\s*Nightly rollup \(\d{4}-\d{2}-\d{2}\):[\s\S]*$/m, '').trim();
  const newSummary = `${cleaned}${cleaned ? ' ' : ''}${rollup}`.trim();

  const patched = src.replace(entryRe, `${prefix}'${escapeSingleQuotes(newSummary)}'`);
  fs.writeFileSync(changelogPath, patched);

  if (ensured.created) {
    console.log(`[changelog] Inserted missing entry for ${today} before rollup.`);
  }
  console.log(`[changelog] Updated ${changelogPath} for ${today} with ${subjects.length} antihunter-site subjects + ${readingInsights.length} reading insights + ${clawfableSubjects.length} clawfable subjects.`);
}

main();
