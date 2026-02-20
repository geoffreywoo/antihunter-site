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

function main() {
  const today = getTodayET();
  const subjects = getCommitSubjectsSinceMidnightRepo();

  if (subjects.length === 0) {
    console.log(`[changelog] No commits since midnight for ${today}; skipping.`);
    return;
  }

  const top = subjects.slice(0, 6);
  const extra = subjects.length - top.length;

  const rollup =
    `Nightly rollup (${today}): ` +
    top.map(s => `• ${s}`).join(' ') +
    (extra > 0 ? ` (+${extra} more)` : '');

  const changelogPath = path.join('src', 'data', 'changelog.ts');
  const src = fs.readFileSync(changelogPath, 'utf8');

  // Find the entry with date: 'YYYY-MM-DD' and patch its summary string.
  // Assumptions (current file style): summary is a single-quoted string on its own line.
  const entryRe = new RegExp(
    `(\\{[\\s\\S]*?date:\\s*'${today}'[\\s\\S]*?summary:\\s*\\n\\s*)'([^']*)'`,
    'm'
  );

  const m = src.match(entryRe);
  if (!m) {
    throw new Error(`[changelog] No entry found for date ${today}. Create it manually (or extend this script).`);
  }

  const prefix = m[1];
  const oldSummary = m[2];

  // If we already appended a rollup for today, replace it.
  const cleaned = oldSummary.replace(/\s*Nightly rollup \(\d{4}-\d{2}-\d{2}\):[\s\S]*$/m, '').trim();
  const newSummary = `${cleaned}${cleaned ? ' ' : ''}${rollup}`.trim();

  const patched = src.replace(entryRe, `${prefix}'${escapeSingleQuotes(newSummary)}'`);
  fs.writeFileSync(changelogPath, patched);

  console.log(`[changelog] Updated ${changelogPath} for ${today} with ${subjects.length} commit subjects.`);
}

main();
