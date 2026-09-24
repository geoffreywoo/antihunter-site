import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { episodes, performanceReview } from '../src/data/episodes';

const baseline = JSON.parse(readFileSync(new URL('../public/reports/performance-review-01-baseline.json', import.meta.url), 'utf8'));
test('the public baseline reproduces all 21 eligible readings without changing the earlier snapshot', () => {
  assert.equal(baseline.knownOriginals, 32);
  assert.equal(baseline.eligibleOriginals, 21);
  assert.equal(baseline.rows.length, baseline.eligibleOriginals);
  assert.equal(new Set(baseline.rows.map(row => row.xUrl)).size, baseline.rows.length);
  const impressions = baseline.rows.map(row => row.impressions).sort((a, b) => a - b);
  assert.equal(impressions[10], baseline.medianImpressions);
  assert.equal(baseline.medianImpressions, 146);
  assert.equal(baseline.rows.reduce((n, row) => n + row.reposts, 0), 2);
  assert.equal(baseline.rows.reduce((n, row) => n + row.quotes, 0), 0);
  for (const row of baseline.rows) {
    const age = (Date.parse(row.checkedAt) - Date.parse(row.postedAt)) / 3_600_000;
    assert.ok(age >= 24 && age <= 30);
    assert.ok(Math.abs(age - row.observedAgeHours) < 0.000001);
    assert.ok(Date.parse(row.checkedAt) <= Date.parse(baseline.asOf));
    assert.deepEqual(row.metricAvailability, { retweets: true, quotes: true, impressions: true });
    assert.match(row.xUrl, /^https:\/\/x\.com\/AntiHunterAI\/status\/\d+$/);
  }
  const old = readFileSync(new URL('../public/reports/seven-scorecards-2026-09-22.json', import.meta.url));
  assert.equal(createHash('sha256').update(old).digest('hex'), 'c7d417abd121e2baff70f6044663b0fc31b3aec267ed672361313c2fe01ff09b');
});

test('the assignment retains seven Pacific dates, its recorded opening and no future results', () => {
  assert.equal((Date.parse(performanceReview.endsAt) - Date.parse(performanceReview.startsAt)) / 86_400_000, 7);
  assert.equal(performanceReview.timezone, 'America/Los_Angeles');
  assert.equal(performanceReview.targetCompletions, 10);
  assert.equal(performanceReview.targetContributors, 3);
  assert.deepEqual(performanceReview.checkpoints.map(row => [row.date, row.status]), [
    ['2026-09-24', 'Opened September 24'], ['2026-09-27', 'Pending'], ['2026-10-01', 'Pending'],
  ]);
  const episode = episodes.find(row => row.slug === performanceReview.id);
  assert.ok(episode);
  assert.equal(episode.status, 'active');
  assert.equal(episode.resultsArtifact, undefined);
  assert.match(episode.image, /performance-review-01\.png$/);
  assert.ok(episode.paragraphs.some(text => text.includes('collection was unavailable')));
  assert.equal(baseline.websiteObservation.calculatorViews, 7);
  assert.equal(baseline.websiteObservation.calculatorCompletions, 0);
});
