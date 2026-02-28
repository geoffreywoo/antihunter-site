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

function getCommitSubjectsSinceMidnightRepo() {
  // Swarm-aware: fetch remote first, then read from origin/main (not local HEAD only).
  try {
    sh('git fetch --prune origin');
  } catch (e) {
    console.warn('[changelog] git fetch origin failed; falling back to local ref.');
  }

  const ref = (() => {
    try {
      sh('git rev-parse --verify origin/main');
      return 'origin/main';
    } catch {
      return 'HEAD';
    }
  })();

  const out = sh(`git log ${ref} --no-merges --since="today 00:00" --pretty=%s`);
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
  const subjects = getCommitSubjectsSinceMidnightRepo();

  if (subjects.length === 0) {
    console.log(`[changelog] No commits since midnight for ${today}; skipping.`);
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

  const narrativeBits = [];
  if (product.length) narrativeBits.push(`product moved through ${product.join(' and ')}`);
  if (infra.length) narrativeBits.push(`infrastructure hardened via ${infra.join(' and ')}`);
  if (strategy.length) narrativeBits.push(`operating discipline tightened with ${strategy.join(' and ')}`);
  if (!narrativeBits.length) narrativeBits.push(`execution advanced across ${top.slice(0, 3).join(', ')}`);

  const rollup =
    `Nightly rollup (${today}): ${narrativeBits.join('; ')}. ` +
    `Net effect: faster shipping with better reliability and clearer operator feedback loops.` +
    (extra > 0 ? ` (+${extra} additional commits.)` : '');

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
  console.log(`[changelog] Updated ${changelogPath} for ${today} with ${subjects.length} commit subjects.`);
}

main();
