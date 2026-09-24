import test from 'node:test';
import assert from 'node:assert/strict';
import { pacificDay, shiftDay, pacificMidnight, dayRange, providerUntil, validateAggregate, countAggregate, parseTraffic, collectObservation, needsReconciliation, refreshAnalytics, analyticsFailure } from '../scripts/analytics-collector.mjs';

const now = new Date('2026-09-24T04:15:00Z');
const today = '2026-09-23';
function fakeQuery(dataset: string, range: { since: string; until: string }, options: Record<string, string>) {
  let data: unknown[] = [];
  if (dataset === 'visits') {
    data = options.by === 'hour' ? [{ pageviews: 4 }]
      : options.by === 'requestPath' ? [{ requestPath: '/machine', pageviews: 4 }]
        : [{ referrerHostname: 't.co', pageviews: 3 }, { referrerHostname: '', pageviews: 1 }];
  } else if (options.by === 'eventName') data = [{ count: 3 }];
  else if (options.filter.includes("eventName eq 'experience_view'")) data = [{ 'eventData/episode': 'hidden-cost', count: 3 }];
  return { query: range, data };
}
function fakeState() { return { currentDay: today, days: {}, controlHistory: [] }; }

test('Pacific midnight, leap dates and DST accounting use calendar days, not 24-hour subtraction', () => {
  assert.equal(pacificDay(new Date('2026-09-24T06:59:59Z')), '2026-09-23');
  assert.equal(pacificDay(new Date('2026-09-24T07:00:00Z')), '2026-09-24');
  assert.equal(pacificMidnight('2026-03-08'), '2026-03-08T08:00:00.000Z');
  assert.equal(pacificMidnight('2026-03-09'), '2026-03-09T07:00:00.000Z');
  assert.equal(pacificMidnight('2026-11-01'), '2026-11-01T07:00:00.000Z');
  assert.equal(pacificMidnight('2026-11-02'), '2026-11-02T08:00:00.000Z');
  assert.equal(shiftDay('2028-03-01', -1), '2028-02-29');
  assert.throws(() => shiftDay('2026-02-29', 1));
  const spring = dayRange('2026-03-08', now);
  assert.equal((Date.parse(spring.until) - Date.parse(spring.since)) / 3_600_000, 23);
  const autumn = dayRange('2026-11-01', new Date('2026-11-03T00:00:00Z'));
  assert.equal((Date.parse(autumn.until) - Date.parse(autumn.since)) / 3_600_000, 25);
});

test('hour rounding cannot pull the next Pacific day into a historical observation', () => {
  const range = dayRange('2026-09-22', now);
  assert.equal(providerUntil(range), '2026-09-23T06:59:59.999Z');
  assert.deepEqual(validateAggregate({ query: range, data: [] }, range, '2026-09-22'), []);
  assert.throws(() => validateAggregate({ query: { ...range, until: '2026-09-23T08:00:00Z' }, data: [] }, range, '2026-09-22'));
  assert.throws(() => validateAggregate({ query: { ...range, since: '2026-09-22T00:00:00Z' }, data: [] }, range, '2026-09-22'));
  assert.throws(() => validateAggregate({ query: { ...range, until: '2026-09-23T06:00:00Z' }, data: [] }, range, '2026-09-22'));
});

test('native traffic strips scenario data, merges cleaned paths and keeps absent referrer distinct', () => {
  assert.deepEqual(parseTraffic([
    { requestPath: '/machine?cost=40#scenario-secret', pageviews: 2 },
    { requestPath: '/machine#private-input', pageviews: 1 },
  ], 'requestPath'), [{ path: '/machine', pageviews: 3 }]);
  assert.deepEqual(parseTraffic([{ referrerHostname: '', pageviews: 2 }, { referrerHostname: 'T.CO', pageviews: 4 }], 'referrerHostname'), [{ host: null, pageviews: 2 }, { host: 't.co', pageviews: 4 }]);
  for (const requestPath of ['//host/private', '/machine/%23secret', '/a/../b', '/a b', '/a\\b']) assert.throws(() => parseTraffic([{ requestPath, pageviews: 1 }], 'requestPath'));
  for (const referrerHostname of ['https://x.com/path?secret=1', 'x.com#secret', 'user@x.com', 'x.com/path']) assert.throws(() => parseTraffic([{ referrerHostname, pageviews: 1 }], 'referrerHostname'));
});

test('QA offsets lower participation only; native traffic and billable counts stay separate', async () => {
  const observation = await collectObservation(today, now, fakeQuery, [{ day: today, campaignId: 'thirty-dollar-machine', episodeId: 'hidden-cost', counts: { experience_view: 1 } }]);
  assert.equal(observation.events, 7);
  assert.equal(observation.spendUsd, 0.00021);
  assert.equal(observation.campaigns[0].experience_view, 2);
  assert.equal(observation.campaigns[0].experience_complete, 0);
  assert.equal(observation.coverage.qaExcludedEvents, 1);
  assert.deepEqual(observation.traffic.landingPaths, [{ path: '/machine', pageviews: 4 }]);
});

test('known empty traffic differs from unavailable dimensions; failed core reads never become zero', async () => {
  const empty = await collectObservation(today, now, (_dataset: string, range: any) => ({ query: range, data: [] }));
  assert.equal(empty.events, 0);
  assert.deepEqual(empty.campaigns, []);
  assert.equal(empty.traffic.availability.landingPaths, 'available');
  const dimensionFailure = await collectObservation(today, now, (dataset: string, range: any, options: any) => {
    if (options.by === 'requestPath') throw new Error('Unsupported');
    return fakeQuery(dataset, range, options);
  });
  assert.equal(dimensionFailure.traffic.availability.landingPaths, 'unavailable');
  assert.deepEqual(dimensionFailure.traffic.landingPaths, []);
  await assert.rejects(() => collectObservation(today, now, () => { throw new Error('Unavailable'); }));
  assert.throws(() => countAggregate(Array.from({ length: 100 }, () => ({ count: 1 })), 'count'));
  assert.throws(() => countAggregate([{ count: null }], 'count'));
});

test('historical reads happen once per Pacific day only after full-day reconciliation is saved', () => {
  const day = '2026-09-22';
  const complete = { observedAt: now.toISOString(), range: dayRange(day, now) };
  assert.equal(needsReconciliation(complete, day, now), false);
  assert.equal(needsReconciliation({ ...complete, observedAt: '2026-09-23T06:59:59Z' }, day, now), true);
  assert.equal(needsReconciliation({ observedAt: now.toISOString() }, day, now), true);
  assert.equal(needsReconciliation(null, day, now), true);
});

test('dry-run reads current plus two previous days but never saves', async () => {
  let writes = 0;
  const result = await refreshAnalytics({ now, readState: fakeState, query: fakeQuery, save: () => { writes++; }, dryRun: true });
  assert.equal(writes, 0);
  assert.equal(result.stored, false);
  assert.deepEqual(result.reconciliation.observations.map((row: any) => row.day), ['2026-09-22', '2026-09-21']);
});

test('persist current before history, retry failed history without manufacturing counts or undoing current', async () => {
  const writes: string[] = [];
  const result = await refreshAnalytics({ now, readState: fakeState, query: (dataset: string, range: any, options: any) => {
    if (range.since === pacificMidnight('2026-09-22')) throw new Error('Delayed aggregate unavailable');
    return fakeQuery(dataset, range, options);
  }, save: (observation: any) => { writes.push(observation.day); } });
  assert.deepEqual(writes, ['2026-09-23', '2026-09-21']);
  assert.equal(result.stored, true);
  assert.deepEqual(result.reconciliation.failures, [{ day: '2026-09-22', stage: 'read', code: 'analytics_operation_failed' }]);
});

test('same-day rerun refreshes only current day after historical reconciliation', async () => {
  const saved: Record<string, any> = {};
  await refreshAnalytics({ now, readState: fakeState, query: fakeQuery, save: (row: any) => { saved[row.day] = row; } });
  const writes: string[] = [];
  const later = new Date(now.getTime() + 30 * 60_000);
  const result = await refreshAnalytics({ now: later, readState: () => ({ ...fakeState(), days: saved }), query: fakeQuery, save: (row: any) => { writes.push(row.day); } });
  assert.deepEqual(writes, [today]);
  assert.deepEqual(result.reconciliation.skipped, ['2026-09-22', '2026-09-21']);
});


test('provider and child-process failures never serialize arbitrary messages, stderr, or codes', async () => {
  const secret = 'FAKE_SECRET_MUST_NOT_APPEAR';
  const poisoned = Object.assign(new Error(`provider echoed ${secret}`), { stderr: secret, stdout: secret, code: secret });
  assert.deepEqual(analyticsFailure(poisoned), { stage: 'refresh', code: 'analytics_operation_failed' });
  assert.equal(JSON.stringify(analyticsFailure(poisoned)).includes(secret), false);
  for (const stage of ['read', 'save']) {
    const result = await refreshAnalytics({ now, readState: fakeState,
      query: (dataset: string, range: any, options: any) => {
        if (stage === 'read' && range.since === pacificMidnight('2026-09-22')) throw poisoned;
        return fakeQuery(dataset, range, options);
      }, save: (row: any) => { if (stage === 'save' && row.day === '2026-09-22') throw poisoned; return row; },
    });
    assert.deepEqual(result.reconciliation.failures, [{ day: '2026-09-22', stage, code: 'analytics_operation_failed' }]);
    assert.equal(JSON.stringify(result).includes(secret), false);
    assert.equal(result.stored, true);
  }
  assert.deepEqual(analyticsFailure(new Error('Analytics query crossed the requested Pacific accounting boundary'), 'read'),
    { stage: 'read', code: 'accounting_boundary_mismatch' });
  assert.deepEqual(analyticsFailure(Object.assign(new Error(secret), { code: 'ETIMEDOUT' }), 'save'),
    { stage: 'save', code: 'command_timeout' });
  assert.deepEqual(analyticsFailure(new SyntaxError(secret)), { stage: 'refresh', code: 'invalid_json_response' });
});
