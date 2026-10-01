/** Mini-only: read native Vercel aggregates, then save bounded observations in Clawfable. */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadQaOffsets } from './analytics-qa.mjs';
import { AGGREGATE_LIMIT, analyticsFailure, providerUntil, refreshAnalytics } from './analytics-collector.mjs';

const exec = promisify(execFile);
const SITES = { antihunter: { project: 'prj_9IG41BwQKCHdyZv31X9jaTwjpTXQ', campaign: 'thirty-dollar-machine' }, aimaxxi: { project: 'prj_PM6SpnhV8ZQQ3a3QuyzciUSCo1Tm', campaign: 'aimaxxi-movement' } };
let currentSite = 'antihunter';
const TEAM_ID = 'team_4LdhU9CgojF88iSArTiNSLVu';
const TEAM = 'geoffrey-woos-projects';
const OPERATOR = '/Users/gwbox2/Projects/clawfable-antihunter-operator';
const RUNTIME_ENV = '/Users/gwbox2/.config/antihunter/clawfable.production.env';
async function operator(args) {
  // Shared-state reads can complete slowly (52s for growth plus 17s for identity).
  // Allow bounded recovery without changing the 90-minute collection expiry.
  const { stdout } = await exec(process.execPath, [`--env-file=${RUNTIME_ENV}`, 'node_modules/tsx/dist/cli.mjs', 'scripts/operator-antihunter.ts', ...args], { cwd: OPERATOR, timeout: 180_000, maxBuffer: 2_000_000 });
  return JSON.parse(stdout);
}
async function query(dataset, range, options = {}) {
  const filter = options.filter ? `environment eq 'production' and (${options.filter})` : "environment eq 'production'";
  const params = new URLSearchParams({ projectId: SITES[currentSite].project, teamId: TEAM_ID, since: range.since, until: providerUntil(range), limit: String(AGGREGATE_LIMIT), ...options, filter });
  // Keep this exact project scoped. Query responses are validated before persistence.
  const { stdout } = await exec('vercel', ['api', `/v1/query/web-analytics/${dataset}/aggregate?${params}`, '--method', 'GET', '--scope', TEAM], { timeout: 30_000, maxBuffer: 2_000_000 });
  return JSON.parse(stdout);
}
async function save(observation) {
  const dir = mkdtempSync(join(tmpdir(), 'antihunter-analytics-'));
  try {
    const file = join(dir, 'observation.json');
    writeFileSync(file, JSON.stringify({ ...observation, site: currentSite }), { mode: 0o600 });
    return await operator(['analytics-observation', '--file', file]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
try {
  // All Mini checkouts use the same private evidence ledger, including dry runs.
  const qaOffsets = loadQaOffsets('/Users/gwbox2/Projects/antihunter/ops/analytics-qa.json');
  const results = {};
  for (const site of Object.keys(SITES)) {
    currentSite = site;
    try {
      results[site] = await refreshAnalytics({ readState: () => operator(['analytics-state', '--site', site]), query, save, qaOffsets: site === 'antihunter' ? qaOffsets : [], dryRun: process.argv.includes('--dry-run'), campaign: SITES[site].campaign });
      if (results[site].reconciliation.failures.length) process.exitCode = 1;
    } catch (error) { results[site] = { error: analyticsFailure(error), collection: 'existing observation expires; no manufactured zero' }; process.exitCode = 1; }
  }
  console.log(JSON.stringify(results, null, 2));
} catch (error) {
  // Never echo child-process environment or provider response bodies on failure.
  console.error(JSON.stringify({ error: analyticsFailure(error), action: 'Inspect current controls before retrying.' }));
  process.exitCode = 1;
}
