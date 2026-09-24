/** Mini-only: read native Vercel aggregates, then save bounded observations in Clawfable. */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadQaOffsets } from './analytics-qa.mjs';
import { AGGREGATE_LIMIT, providerUntil, refreshAnalytics } from './analytics-collector.mjs';

const exec = promisify(execFile);
const PROJECT = 'prj_9IG41BwQKCHdyZv31X9jaTwjpTXQ';
const TEAM_ID = 'team_4LdhU9CgojF88iSArTiNSLVu';
const TEAM = 'geoffrey-woos-projects';
const OPERATOR = '/Users/gwbox2/Projects/clawfable-antihunter-operator';
const RUNTIME_ENV = '/Users/gwbox2/.config/antihunter/clawfable.production.env';
// All Mini checkouts use the same private evidence ledger, including dry runs.
const qaOffsets = loadQaOffsets('/Users/gwbox2/Projects/antihunter/ops/analytics-qa.json');
async function operator(args) {
  const { stdout } = await exec(process.execPath, [`--env-file=${RUNTIME_ENV}`, 'node_modules/tsx/dist/cli.mjs', 'scripts/operator-antihunter.ts', ...args], { cwd: OPERATOR, timeout: 60_000, maxBuffer: 2_000_000 });
  return JSON.parse(stdout);
}
async function query(dataset, range, options = {}) {
  const filter = options.filter ? `environment eq 'production' and (${options.filter})` : "environment eq 'production'";
  const params = new URLSearchParams({ projectId: PROJECT, teamId: TEAM_ID, since: range.since, until: providerUntil(range), limit: String(AGGREGATE_LIMIT), ...options, filter });
  // Keep this exact project scoped. Query responses are validated before persistence.
  const { stdout } = await exec('vercel', ['api', `/v1/query/web-analytics/${dataset}/aggregate?${params}`, '--method', 'GET', '--scope', TEAM], { timeout: 30_000, maxBuffer: 2_000_000 });
  return JSON.parse(stdout);
}
async function save(observation) {
  const dir = mkdtempSync(join(tmpdir(), 'antihunter-analytics-'));
  try {
    const file = join(dir, 'observation.json');
    writeFileSync(file, JSON.stringify(observation), { mode: 0o600 });
    return await operator(['analytics-observation', '--file', file]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
try {
  const result = await refreshAnalytics({ readState: () => operator(['analytics-state']), query, save, qaOffsets, dryRun: process.argv.includes('--dry-run') });
  console.log(JSON.stringify(result, null, 2));
  if (result.reconciliation.failures.length) process.exitCode = 1;
} catch (error) {
  // Never echo child-process environment or provider response bodies on failure.
  console.error(error?.code ? `Analytics refresh failed (${error.code}); retained prior controls.` : `Analytics refresh failed: ${error.message}`);
  process.exitCode = 1;
}
