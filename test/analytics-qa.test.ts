import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { excludeVerifiedQa, loadQaOffsets, validateQaLedger } from '../scripts/analytics-qa.mjs';

const entry = {
  day: '2026-09-21', campaignId: 'thirty-dollar-machine', episodeId: 'hidden-cost',
  verified: true, receipt: 'runs/2026-09-21-machine-production-qa.har',
  counts: { experience_view: 1, experience_complete: 1, share_intent: 1 },
};
const ledger = { version: 1, offsets: [entry] };

test('QA subtraction matches Pacific day, campaign, and episode; raw usage stays intact', () => {
  const row = { campaignId: entry.campaignId, episodeId: entry.episodeId, experience_view: 5, experience_complete: 3, share_intent: 2, token_info_view: 0 };
  const observation = { events: 12, spendUsd: .00036, campaigns: [row, { ...row, campaignId: 'another-campaign' }, { ...row, episodeId: 'token' }] };
  const original = structuredClone(observation);
  const result = { ...observation, campaigns: excludeVerifiedQa(observation.campaigns, entry.day, validateQaLedger(ledger)) };
  assert.deepEqual(result.campaigns[0], { ...row, experience_view: 4, experience_complete: 2, share_intent: 1 });
  assert.deepEqual(result.campaigns.slice(1), observation.campaigns.slice(1));
  assert.equal(result.events, 12);
  assert.equal(result.spendUsd, .00036);
  assert.deepEqual(observation, original);
  assert.deepEqual(excludeVerifiedQa(observation.campaigns, '2026-09-22', ledger.offsets), observation.campaigns);
});

test('lagging totals clamp at zero; null, missing fields, and absent episodes stay missing', () => {
  const rows = [{ campaignId: entry.campaignId, episodeId: entry.episodeId, experience_view: 0, experience_complete: null }];
  assert.deepEqual(excludeVerifiedQa(rows, entry.day, ledger.offsets), rows);
  assert.deepEqual(excludeVerifiedQa([], entry.day, ledger.offsets), []);
});

test('unverified, malformed, duplicate, and billing offsets cannot enter the ledger', () => {
  for (const bad of [
    { ...entry, verified: false }, { ...entry, receipt: '' }, { ...entry, day: '2026-02-30' },
    { ...entry, counts: { pageviews: 1 } }, { ...entry, counts: { experience_complete: -1 } },
    { ...entry, counts: { experience_complete: .5 } }, { ...entry, counts: { experience_complete: Number.MAX_SAFE_INTEGER + 1 } },
  ]) assert.throws(() => validateQaLedger({ version: 1, offsets: [bad] }));
  assert.throws(() => validateQaLedger({ version: 1, offsets: [entry, entry] }), /Duplicate/);
});

test('missing private file is optional, but corrupt records stop ingestion', () => {
  const dir = mkdtempSync(join(tmpdir(), 'antihunter-qa-test-'));
  const file = join(dir, 'analytics-qa.json');
  try {
    assert.deepEqual(loadQaOffsets(file), []);
    writeFileSync(file, JSON.stringify(ledger));
    assert.deepEqual(loadQaOffsets(file), ledger.offsets);
    writeFileSync(file, '{broken');
    assert.throws(() => loadQaOffsets(file));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
