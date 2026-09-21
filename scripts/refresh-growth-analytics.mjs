/** Mini-only: read native Vercel aggregates, then save a bounded observation in Clawfable. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROJECT = 'prj_9IG41BwQKCHdyZv31X9jaTwjpTXQ';
const TEAM = 'geoffrey-woos-projects';
const CAMPAIGN = 'thirty-dollar-machine';
const OPERATOR = '/Users/gwbox2/Projects/clawfable-antihunter-operator';
const RUNTIME_ENV = '/Users/gwbox2/.config/antihunter/clawfable.production.env';
const now = new Date();
const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
// Resolve Pacific midnight without a fixed UTC offset (also works across DST transitions).
let midnight = new Date(`${day}T00:00:00Z`);
for (let i = 0; i < 3; i++) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(midnight).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  const localAsUtc = Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);
  midnight = new Date(midnight.getTime() + Date.parse(`${day}T00:00:00Z`) - localAsUtc);
}

function query(dataset, options = {}) {
  const params = new URLSearchParams({ projectId: PROJECT, since: midnight.toISOString(), until: now.toISOString(), limit: '100', ...options });
  const raw = execFileSync('vercel', ['api', `/v1/query/web-analytics/${dataset}/aggregate?${params}`, '--method', 'GET', '--scope', TEAM], { encoding: 'utf8', timeout: 30_000, maxBuffer: 2_000_000, stdio: ['ignore', 'pipe', 'pipe'] });
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.data)) throw new Error(`Invalid ${dataset} aggregate; keep analytics disabled when observation expires`);
  // Vercel rounds bounds to the selected granularity. Pacific midnight is an exact UTC hour.
  if (!Number.isFinite(Date.parse(parsed.query?.until))
      || Date.parse(parsed.query?.since) !== midnight.getTime()
      || Date.parse(parsed.query?.until) < now.getTime()
      || Date.parse(parsed.query?.until) > now.getTime() + 3_600_000) {
    throw new Error('Analytics query crossed the requested Pacific accounting boundary');
  }
  return parsed.data;
}
function count(rows, field) {
  return rows.reduce((sum, row) => {
    const value = row[field];
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid ${field} count`);
    return sum + value;
  }, 0);
}

const visits = query('visits', { by: 'hour' });
const custom = query('events', { by: 'eventName' });
const events = count(visits, 'pageviews') + count(custom, 'count');
const campaigns = new Map();
for (const name of ['experience_view', 'experience_complete', 'share_intent', 'token_info_view']) {
  const rows = query('events', { by: 'eventData/episode', filter: `eventData/campaign eq '${CAMPAIGN}' and eventName eq '${name}'` });
  for (const row of rows) {
    const episodeId = typeof row.eventData === 'string' ? row.eventData : row.eventData?.episode;
    if (typeof episodeId !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(episodeId)) continue;
    const value = count([row], 'count');
    if (!campaigns.has(episodeId)) campaigns.set(episodeId, { campaignId: CAMPAIGN, episodeId, experience_view: 0, experience_complete: 0, share_intent: 0, token_info_view: 0 });
    campaigns.get(episodeId)[name] = value;
  }
}
const observation = {
  day, observedAt: now.toISOString(), spendUsd: Number((events * 0.03 / 1000).toFixed(6)), events,
  campaigns: [...campaigns.values()],
  source: 'Vercel Web Analytics API production aggregates; $0.03/1000 collected events. Reporting may lag; sampled counts are not total traffic; share_intent is not a confirmed share.',
};
if (process.argv.includes('--dry-run')) {
  console.log(JSON.stringify(observation, null, 2));
} else {
  const dir = mkdtempSync(join(tmpdir(), 'antihunter-analytics-'));
  try {
    const file = join(dir, 'observation.json');
    writeFileSync(file, JSON.stringify(observation), { mode: 0o600 });
    execFileSync(process.execPath, [`--env-file=${RUNTIME_ENV}`, 'node_modules/tsx/dist/cli.mjs', 'scripts/operator-antihunter.ts', 'analytics-observation', '--file', file], { cwd: OPERATOR, encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'] });
    console.log(JSON.stringify({ stored: true, ...observation }, null, 2));
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
