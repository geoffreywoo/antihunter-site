import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsEpisode, canCollect, cleanAnalyticsUrl, eventKey, pacificDay, safeEpisode } from '../src/lib/growth-analytics';
const now = new Date('2026-09-21T15:00:00Z');
const control = { day: '2026-09-21', sampleRate: 1, expiresAt: '2026-09-21T16:00:00Z' };
test('collection fails closed on missing, stale, wrong-day, and disabled controls', () => {
  for (const bad of [null, {}, { ...control, day: '2026-09-20' }, { ...control, expiresAt: '2026-09-21T14:00:00Z' }, { ...control, sampleRate: 0 }, { ...control, sampleRate: 2 }]) assert.equal(canCollect(bad, .2, now), false);
  assert.equal(canCollect(control, .2, now), true);
});
test('reduced sample is a stable cohort and stops at expiration', () => {
  assert.equal(canCollect({ ...control, sampleRate: .1 }, .05, now), true);
  assert.equal(canCollect({ ...control, sampleRate: .1 }, .2, now), false);
  assert.equal(canCollect(control, .2, new Date(control.expiresAt)), false);
});
test('Pacific midnight and URL redaction protect accounting and calculator inputs', () => {
  assert.equal(pacificDay(new Date('2026-09-21T06:59:59Z')), '2026-09-20');
  assert.equal(pacificDay(new Date('2026-09-21T07:00:00Z')), '2026-09-21');
  assert.equal(cleanAnalyticsUrl('https://antihunter.com/machine?secret=x#c=300'), 'https://antihunter.com/machine');
  assert.equal(safeEpisode('private@example.com'), 'launch');
  assert.notEqual(eventKey('2026-09-21', 'share_intent', 'hidden-cost'), eventKey('2026-09-22', 'share_intent', 'hidden-cost'));
});

test('walkthrough attribution stays separate from calculator and strips scenario fragments', () => {
  assert.equal(analyticsEpisode('/two-orders'), 'two-orders');
  assert.equal(analyticsEpisode('/two-orders/'), 'two-orders');
  assert.equal(analyticsEpisode('/machine'), 'hidden-cost');
  assert.equal(cleanAnalyticsUrl('https://antihunter.com/two-orders#case=lost-ack-unresolved'), 'https://antihunter.com/two-orders');
  assert.notEqual(eventKey('2026-09-21', 'experience_complete', 'two-orders'), eventKey('2026-09-21', 'experience_complete', 'hidden-cost'));
});
