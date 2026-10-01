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

test('the assignment retains seven Pacific dates, its recorded opening and dated verdict', () => {
  assert.equal((Date.parse(performanceReview.endsAt) - Date.parse(performanceReview.startsAt)) / 86_400_000, 7);
  assert.equal(performanceReview.timezone, 'America/Los_Angeles');
  assert.equal(performanceReview.targetCompletions, 10);
  assert.equal(performanceReview.targetContributors, 3);
  assert.deepEqual(performanceReview.checkpoints.map(row => [row.date, row.status]), [
    ['2026-09-24', 'Opened September 24'], ['2026-09-27', 'Checkpoint recorded'], ['2026-10-01', 'Targets missed on observed evidence'],
  ]);
  const episode = episodes.find(row => row.slug === performanceReview.id);
  assert.ok(episode);
  assert.equal(episode.status, 'result');
  assert.equal(episode.resultsArtifact, undefined);
  assert.match(episode.image, /performance-review-01-verdict\.png$/);
  assert.ok(episode.paragraphs.some(text => text.includes('collection was unavailable')));
  assert.equal(baseline.websiteObservation.calculatorViews, 7);
  assert.equal(baseline.websiteObservation.calculatorCompletions, 0);
});


test('midpoint summaries reproduce dated readings and preserve unknown click counts', () => {
  const midpoint = JSON.parse(readFileSync(new URL('../public/reports/performance-review-01-midpoint.json', import.meta.url), 'utf8'));
  assert.equal(new Set(midpoint.comparisons.map(row => row.url)).size, midpoint.comparisons.length);
  for (const row of midpoint.comparisons) {
    const age = (Date.parse(row.observedAt) - Date.parse(row.publishedAt)) / 3_600_000;
    assert.ok(age >= 24 && age <= 30);
    assert.ok(Math.abs(age - row.ageHours) < 0.000001);
    if (!row.urlClicksAvailable) assert.equal(row.urlClicks, null);
  }
  for (const group of midpoint.variants) {
    const rows = midpoint.comparisons.filter(row => row.variant === group.variant);
    const values = rows.map(row => row.impressions).sort((a, b) => a - b);
    const middle = Math.floor(values.length / 2);
    const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
    assert.equal(group.count, rows.length);
    assert.equal(group.medianImpressions, median);
    assert.equal(group.sharingPosts, rows.filter(row => row.reposts + row.quotes > 0).length);
  }
  assert.equal(midpoint.calculator.uniquePeople, null);
  assert.equal(performanceReview.checkpoints.at(-1)?.status, 'Targets missed on observed evidence');
});

test('verdict reproduces raw eligible rows and counts each calculator day once', () => {
  const verdict = JSON.parse(readFileSync(new URL('../public/reports/performance-review-01-verdict.json', import.meta.url), 'utf8'));
  assert.ok(Date.parse(verdict.preparedAt) >= Date.parse(performanceReview.endsAt));
  const rows = verdict.distribution.rows;
  assert.equal(rows.length, 22);
  assert.equal(new Set(rows.map(row => row.url)).size, rows.length);
  for (const row of rows) {
    const age = (Date.parse(row.checkedAt) - Date.parse(row.postedAt)) / 3_600_000;
    assert.ok(row.eligible && age >= 24 && age <= 30);
    assert.ok(Date.parse(row.declaredAt) <= Date.parse(row.postedAt));
    assert.deepEqual(row.availability, { retweets: true, quotes: true, impressions: true });
  }
  const values = rows.map(row => row.impressions).sort((a,b) => a-b);
  assert.equal((values[10] + values[11])/2, verdict.distribution.medianImpressions);
  assert.equal(rows.filter(row => row.reposts+row.quotes>0).length, verdict.distribution.sharingPosts);
  const days=verdict.calculator.days;
  assert.equal(new Set(days.map(row=>row.day)).size,7);
  assert.equal(days.reduce((sum,row)=>sum+row.completions,0),verdict.calculator.completions);
  assert.equal(days.reduce((sum,row)=>sum+row.views,0),verdict.calculator.views);
  assert.equal(days.at(-1).range.until, performanceReview.endsAt.replace('Z','.000Z'));
  assert.equal(verdict.spend.xUnresolvedIncludedUsd,0.4);
  assert.equal(verdict.spend.xVerificationHeldSeparatelyUsd,0.03);
});
