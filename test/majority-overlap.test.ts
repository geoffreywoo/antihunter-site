import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize, scenario, independentExample } from '../src/lib/majority-overlap.mjs';

test('equal individual accuracy supports three different directly counted majority outcomes', () => {
  const expected = { shared: [80, 100, [80, 0, 0, 0, 0, 0, 0, 20]], separate: [100, 40, [40, 20, 20, 0, 20, 0, 0, 0]], paired: [70, 70, [70, 0, 0, 10, 0, 10, 10, 0]] };
  for (const [name, [majority, unanimity, patterns]] of Object.entries(expected)) {
    const rows = scenario(name), s = summarize(rows);
    assert.deepEqual(s.correctByVoter, [80, 80, 80]);
    assert.equal(s.tasks, 100); assert.equal(s.wrongVotes, 60);
    assert.equal(s.majorityCorrect, majority); assert.equal(s.unanimous, unanimity);
    assert.deepEqual(s.errorPatternCounts, patterns);
    assert.equal(new Set(rows.map(x => x.task)).size, 100);
    assert.deepEqual(rows.map(x => x.truth), scenario('shared').map(x => x.truth));
  }
});

test('exhaust all 91,125 placements of two errors per voter on ten shared tasks', () => {
  const masks = [];
  for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) masks.push((1 << i) | (1 << j));
  let seen = 0, min = Infinity, max = -Infinity;
  for (const a of masks) for (const b of masks) for (const c of masks) {
    const rows = Array.from({ length: 10 }, (_, i) => ({ truth: i % 2, predictions: [a, b, c].map(mask => (i % 2) ^ Number(Boolean(mask & (1 << i)))) }));
    const s = summarize(rows);
    // Separate bitset oracle: each bit with two or three errors is a majority failure.
    let failedBits = (a & b) | (a & c) | (b & c), failures = 0;
    while (failedBits) { failures += failedBits & 1; failedBits >>>= 1; }
    assert.equal(s.majorityCorrect, 10 - failures);
    assert.deepEqual(s.correctByVoter, [8, 8, 8]);
    min = Math.min(min, s.majorityCorrect); max = Math.max(max, s.majorityCorrect); seen++;
  }
  assert.equal(seen, 91125); assert.equal(min, 7); assert.equal(max, 10);
});

test('label complements and task order preserve every accuracy and error pattern', () => {
  for (const name of ['shared', 'separate', 'paired']) {
    const rows = scenario(name), expected = summarize(rows);
    assert.deepEqual(summarize([...rows].reverse()), expected);
    assert.deepEqual(summarize(rows.map(x => ({ ...x, truth: 1 - x.truth, predictions: x.predictions.map(v => 1 - v) }))), expected);
  }
});

test('independence illustration is exact probability arithmetic, separate from the 100-task fixtures', () => {
  assert.deepEqual(independentExample(), { favorableWeight: 112, totalWeight: 125 });
  assert.equal(112 / 125, .896);
});

test('invalid or missing binary observations fail rather than becoming incorrect votes', () => {
  for (const rows of [[], null, [{ truth: 0, predictions: [0, 0] }], [{ truth: null, predictions: [0, 0, 0] }], [{ truth: 0, predictions: [0, undefined, 0] }], [{ truth: 0, predictions: [0, 2, 0] }], [{ truth: 0, predictions: [false, 0, 0] }]]) assert.throws(() => summarize(rows));
  assert.throws(() => summarize([{ truth: 0, predictions: Array(3) }]));
  assert.throws(() => scenario('measured-provider'));
});

import { readFileSync } from 'node:fs';
const fixture=JSON.parse(readFileSync(new URL('../src/data/majority-overlap.json',import.meta.url),'utf8'));
test('published complete fixture matches every invented label and prediction',()=>{assert.equal(fixture.cases.length,3);for(const c of fixture.cases){assert.deepEqual(c.rows,scenario(c.id));assert.deepEqual(summarize(c.rows).correctByVoter,[80,80,80]);}assert.deepEqual(fixture.cases.map(c=>summarize(c.rows).majorityCorrect),[80,100,70]);});
