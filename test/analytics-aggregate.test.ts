import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEpisodeAggregate } from '../scripts/analytics-aggregate.mjs';
import { excludeVerifiedQa, validateQaLedger } from '../scripts/analytics-qa.mjs';

test('observed Vercel grouped response retains counts and excludes verified QA', () => {
  // Actual response shape from the production eventData/episode aggregate query.
  const rows = parseEpisodeAggregate([{ 'eventData/episode': 'hidden-cost', visitors: 2, count: 2 }]);
  assert.deepEqual(rows, [{ episodeId: 'hidden-cost', count: 2 }]);
  const offsets = validateQaLedger({ version: 1, offsets: [{
    day: '2026-09-21', campaignId: 'thirty-dollar-machine', episodeId: 'hidden-cost', verified: true,
    receipt: 'runs/2026-09-21-machine-production-qa.har', counts: { experience_view: 1 },
  }] });
  const campaigns = rows.map(row => ({ campaignId: 'thirty-dollar-machine', episodeId: row.episodeId, experience_view: row.count }));
  assert.equal(excludeVerifiedQa(campaigns, '2026-09-21', offsets)[0].experience_view, 1);
});

test('empty aggregates remain empty; unrecognized nonempty responses stop ingestion', () => {
  assert.deepEqual(parseEpisodeAggregate([]), []);
  for (const rows of [null, [null], [{ eventData: { episode: 'hidden-cost' }, count: 2 }], [{ 'eventData/episode': null, count: 2 }], [{ 'eventData/episode': 'hidden-cost', count: -1 }], [{ 'eventData/episode': 'hidden-cost', count: 1.5 }]]) {
    assert.throws(() => parseEpisodeAggregate(rows));
  }
});
