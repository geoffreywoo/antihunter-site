import { parseEpisodeAggregate } from './analytics-aggregate.mjs';
import { excludeVerifiedQa } from './analytics-qa.mjs';

export const CAMPAIGN = 'thirty-dollar-machine';
export const EVENT_NAMES = ['experience_view', 'experience_complete', 'share_intent', 'token_info_view'];
export const AGGREGATE_LIMIT = 100;
const PACIFIC = 'America/Los_Angeles';

export function pacificDay(now) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: PACIFIC, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function shiftDay(day, offset) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day) throw new Error('Invalid Pacific day');
  const result = new Date(`${day}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + offset);
  return result.toISOString().slice(0, 10);
}
export function pacificMidnight(day) {
  shiftDay(day, 0);
  const target = Date.parse(`${day}T00:00:00Z`);
  let midnight = target;
  const format = new Intl.DateTimeFormat('en-US', { timeZone: PACIFIC, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(format.formatToParts(new Date(midnight)).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    const localAsUtc = Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);
    midnight += target - localAsUtc;
  }
  return new Date(midnight).toISOString();
}
export function dayRange(day, now) {
  const since = pacificMidnight(day);
  const until = new Date(Math.min(now.getTime(), Date.parse(pacificMidnight(shiftDay(day, 1))))).toISOString();
  if (Date.parse(until) <= Date.parse(since)) throw new Error('No elapsed analytics interval for requested Pacific day');
  return { since, until };
}

/** Native Vercel queries round the upper boundary forward, even on an exact hour. */
export function providerUntil(range) {
  return new Date(Date.parse(range.until) - 1).toISOString();
}
export function validateAggregate(response, range, day) {
  if (!Array.isArray(response?.data)) throw new Error('Invalid native analytics aggregate');
  const until = Date.parse(response.query?.until);
  const dayEnd = Date.parse(pacificMidnight(shiftDay(day, 1)));
  if (Date.parse(response.query?.since) !== Date.parse(range.since)
      || !Number.isFinite(until) || until < Date.parse(range.until)
      || until > Math.min(dayEnd, Date.parse(range.until) + 3_600_000)) {
    throw new Error('Analytics query crossed the requested Pacific accounting boundary');
  }
  return response.data;
}
export function countAggregate(rows, field, complete = true) {
  if (!Array.isArray(rows) || (complete && rows.length >= AGGREGATE_LIMIT)) throw new Error('Aggregate may be truncated; total remains unknown');
  const count = rows.reduce((sum, row) => {
    const value = row?.[field];
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid ${field} count`);
    return sum + value;
  }, 0);
  if (!Number.isSafeInteger(count)) throw new Error('Aggregate count exceeds safe integer range');
  return count;
}

/** URL parameters, fragments, credentials and referrer paths never enter the saved aggregate. */
export function parseTraffic(rows, dimension) {
  const totals = new Map();
  for (const row of rows) {
    countAggregate([row], 'pageviews');
    const raw = row[dimension];
    if (typeof raw !== 'string') throw new Error(`Unavailable ${dimension} dimension`);
    let key;
    if (dimension === 'requestPath') {
      if (!raw.startsWith('/') || raw.startsWith('//')) throw new Error('Invalid native request path');
      key = raw.split(/[?#]/, 1)[0];
      if (key.length > 200 || !/^\/[a-zA-Z0-9/_.-]*$/.test(key) || key.split('/').some(part => part === '.' || part === '..')) throw new Error('Invalid native request path');
    } else if (dimension === 'referrerHostname') {
      key = raw === '' ? null : raw.toLowerCase();
      if (key !== null && (key.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(key))) throw new Error('Invalid native referrer host');
    } else throw new Error('Unknown traffic dimension');
    totals.set(key, (totals.get(key) || 0) + row.pageviews);
    if (!Number.isSafeInteger(totals.get(key))) throw new Error('Traffic count exceeds safe integer range');
  }
  return [...totals].map(([key, pageviews]) => ({ [dimension === 'requestPath' ? 'path' : 'host']: key, pageviews }));
}

export function needsReconciliation(saved, day, now) {
  const readAt = Date.parse(saved?.observedAt);
  const expected = dayRange(day, now);
  return !Number.isFinite(readAt) || pacificDay(new Date(readAt)) !== pacificDay(now)
    || saved?.range?.since !== expected.since || saved?.range?.until !== expected.until;
}

export async function collectObservation(day, now, query, qaOffsets = []) {
  const range = dayRange(day, now);
  const read = async (dataset, options) => validateAggregate(await query(dataset, range, options), range, day);
  // Optional traffic dimensions must not stop a valid accounting/control refresh.
  const optionalTraffic = async (dimension) => {
    try { return { rows: parseTraffic(await read('visits', { by: dimension }), dimension), available: true }; }
    catch { return { rows: [], available: false }; }
  };
  const [visits, custom, episodeRows, paths, referrers] = await Promise.all([
    read('visits', { by: 'hour' }), read('events', { by: 'eventName' }),
    Promise.all(EVENT_NAMES.map(name => read('events', { by: 'eventData/episode', filter: `eventData/campaign eq '${CAMPAIGN}' and eventName eq '${name}'` }))),
    optionalTraffic('requestPath'), optionalTraffic('referrerHostname'),
  ]);
  const events = countAggregate(visits, 'pageviews') + countAggregate(custom, 'count');
  if (!Number.isSafeInteger(events)) throw new Error('Billable event count exceeds safe integer range');
  const rawCampaigns = new Map();
  for (const [index, rows] of episodeRows.entries()) {
    countAggregate(rows, 'count');
    for (const { episodeId, count } of parseEpisodeAggregate(rows)) {
      if (!rawCampaigns.has(episodeId)) rawCampaigns.set(episodeId, { campaignId: CAMPAIGN, episodeId, ...Object.fromEntries(EVENT_NAMES.map(name => [name, 0])) });
      rawCampaigns.get(episodeId)[EVENT_NAMES[index]] = count;
    }
  }
  const raw = [...rawCampaigns.values()];
  const campaigns = excludeVerifiedQa(raw, day, qaOffsets);
  const campaignCount = rows => rows.reduce((sum, row) => sum + EVENT_NAMES.reduce((subtotal, name) => subtotal + row[name], 0), 0);
  return {
    day, observedAt: now.toISOString(), range, events, spendUsd: Number((events * 0.03 / 1000).toFixed(6)), campaigns,
    traffic: {
      landingPaths: paths.rows, referrers: referrers.rows,
      availability: { landingPaths: paths.available ? 'available' : 'unavailable', referrers: referrers.available ? 'available' : 'unavailable' },
      scope: 'Top 100 native request-path and referrer-host groups; pageviews, not unique or first landings. Separate from billable events. Includes unexcluded QA. Null host means no recorded referrer.',
    },
    coverage: { aggregateRead: 'available', qaExcludedEvents: campaignCount(raw) - campaignCount(campaigns), notes: 'Control authorization history is stored separately; it does not prove browser collection. Reporting may lag. Sampling cannot reconstruct total traffic.' },
    source: 'Vercel production aggregates; $0.03/1000 events including QA. Verified QA excluded from campaign counts only. Reporting can lag; no sampled extrapolation. share_intent is not confirmed sharing.',
  };
}

/** Only allowlisted reason codes may cross the process/provider error boundary. */
export function analyticsFailure(error, stage = 'refresh') {
  const reasons = new Map([
    ['Analytics state does not match the current Pacific day', 'state_day_mismatch'],
    ['Analytics query crossed the requested Pacific accounting boundary', 'accounting_boundary_mismatch'],
    ['Invalid native analytics aggregate', 'invalid_aggregate'],
    ['Aggregate may be truncated; total remains unknown', 'possibly_truncated_aggregate'],
    ['No elapsed analytics interval for requested Pacific day', 'empty_accounting_interval'],
    ['Invalid pageviews count', 'invalid_aggregate_count'],
    ['Invalid count count', 'invalid_aggregate_count'],
    ['Aggregate count exceeds safe integer range', 'invalid_aggregate_count'],
    ['Billable event count exceeds safe integer range', 'invalid_aggregate_count'],
  ]);
  let code = reasons.get(error?.message) || 'analytics_operation_failed';
  if (error instanceof SyntaxError) code = 'invalid_json_response';
  else if (error?.code === 'ETIMEDOUT') code = 'command_timeout';
  else if (error?.code === 'ENOENT') code = 'required_resource_missing';
  else if (error?.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') code = 'command_output_limit';
  else if (error?.code === 'ABORT_ERR' || error?.killed === true) code = 'command_terminated';
  else if (typeof error?.code === 'number') code = 'external_command_failed';
  return { stage: ['read', 'save', 'refresh'].includes(stage) ? stage : 'refresh', code };
}

/** Current control refresh succeeds independently of delayed-history reconciliation. */
export async function refreshAnalytics({ now = new Date(), readState, query, save, qaOffsets = [], dryRun = false }) {
  const state = await readState();
  const today = pacificDay(now);
  if (state.currentDay !== today || !state.days || typeof state.days !== 'object') throw new Error('Analytics state does not match the current Pacific day');
  const current = await collectObservation(today, now, query, qaOffsets);
  const savedCurrent = dryRun ? null : await save(current);
  const observations = [];
  const failures = [];
  const skipped = [];
  for (const delta of [-1, -2]) {
    const day = shiftDay(today, delta);
    if (!needsReconciliation(state.days[day], day, now)) { skipped.push(day); continue; }
    let stage = 'read';
    try {
      const historical = await collectObservation(day, now, query, qaOffsets);
      stage = 'save';
      if (!dryRun) await save(historical);
      observations.push(historical);
    } catch (error) { failures.push({ day, ...analyticsFailure(error, stage) }); }
  }
  return { ...current, stored: !dryRun, committedSpendUsd: savedCurrent?.spendUsd ?? null, reconciliation: { observations, skipped, failures }, controlHistory: state.controlHistory || [] };
}
