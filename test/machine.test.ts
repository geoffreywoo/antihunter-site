import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateScenario, EXAMPLE_SCENARIO, MACHINE_FIELDS, parseScenarioFragment, scenarioFragment, validateScenario } from '../src/lib/machine.ts';

test('includes failed attempts and review time once per accepted result', () => {
  const result = calculateScenario(EXAMPLE_SCENARIO);
  assert.equal(result.inference, 0.06);
  assert.equal(result.review, 6);
  assert.equal(result.total, 6.06);
  assert.ok(Math.abs(result.contribution - -1.06) < 1e-12);
  assert.equal(result.driver, 'review');
  assert.ok(Math.abs(result.reviewShare + result.inferenceShare - 1) < 1e-12);
});

test('zero cost and revenue have no invented margin or dominant driver', () => {
  const result = calculateScenario({ costPerAttempt: 0, attempts: 1, reviewMinutes: 0, hourlyRate: 0, revenue: 0 });
  assert.equal(result.total, 0);
  assert.equal(result.contribution, 0);
  assert.equal(result.contributionRate, null);
  assert.equal(result.driver, 'none');
  assert.equal(result.reviewShare, 0);
});

test('average fractional attempts and equal cost drivers are supported', () => {
  const result = calculateScenario({ costPerAttempt: 2, attempts: 1.5, reviewMinutes: 3, hourlyRate: 60, revenue: 10 });
  assert.equal(result.total, 6);
  assert.equal(result.contribution, 4);
  assert.equal(result.contributionRate, 0.4);
  assert.equal(result.driver, 'equal');
  assert.equal(calculateScenario({ ...EXAMPLE_SCENARIO, reviewMinutes: 0 }).driver, 'inference');
});

test('every field rejects blanks, coercions, negatives, nonfinite values, and overflow', () => {
  for (const field of Object.keys(MACHINE_FIELDS)) {
    for (const value of ['', ' ', null, undefined, true, [], {}, '-1', -1, Infinity, NaN, '1e309', '1e-400', '1e-10', '1000001', '0x10', '<script>']) {
      assert.equal(validateScenario({ ...EXAMPLE_SCENARIO, [field]: value }).ok, false, `${field}: ${String(value)}`);
    }
  }
  assert.equal(validateScenario({ ...EXAMPLE_SCENARIO, attempts: 0 }).ok, false);
  assert.throws(() => calculateScenario({ ...EXAMPLE_SCENARIO, costPerAttempt: Infinity }), RangeError);
});

test('large valid scenarios remain finite and tiny inputs survive sharing', () => {
  const largest = { costPerAttempt: 1e6, attempts: 1e6, reviewMinutes: 1e6, hourlyRate: 1e6, revenue: 1e6 };
  const result = calculateScenario(largest);
  assert.ok(Number.isFinite(result.total));
  assert.ok(Number.isFinite(result.contribution));
  assert.deepEqual(parseScenarioFragment(scenarioFragment(largest)), largest);
  const tiny = { ...EXAMPLE_SCENARIO, costPerAttempt: 0.000000001 };
  assert.deepEqual(parseScenarioFragment(scenarioFragment(tiny)), tiny);
  const tinyReview = calculateScenario({ costPerAttempt: 0, attempts: 1, reviewMinutes: 1e-9, hourlyRate: 1e-9, revenue: 0 });
  assert.equal(tinyReview.driver, 'review');
  assert.ok(tinyReview.total > 0);
});

test('scenario fragment round-trips all five inputs without a query string', () => {
  const fragment = scenarioFragment(EXAMPLE_SCENARIO);
  assert.equal(fragment, '#v=1&c=0.02&a=3&m=4&h=90&r=5');
  assert.deepEqual(parseScenarioFragment(fragment), EXAMPLE_SCENARIO);
});

test('shared scenarios reject missing, duplicate, unexpected, invalid, and oversized fields', () => {
  for (const fragment of [
    '', 'v=1&c=0.02&a=3&m=4&h=90&r=5', '#v=2&c=0.02&a=3&m=4&h=90&r=5',
    '#v=1&c=0.02&a=3&m=4&h=90', '#v=1&c=0.02&a=3&m=4&h=90&r=5&r=6',
    '#v=1&c=0.02&a=3&m=4&h=90&r=5&extra=true', '#v=1&c=NaN&a=3&m=4&h=90&r=5',
    '#v=1&c=0.02&a=0&m=4&h=90&r=5', '#v=1&c=0.02&a=3&m=4&h=90&r=%20',
    '#v=1&c=1e309&a=3&m=4&h=90&r=5', '#'.padEnd(514, 'x'),
  ]) assert.equal(parseScenarioFragment(fragment), null, fragment);
});
