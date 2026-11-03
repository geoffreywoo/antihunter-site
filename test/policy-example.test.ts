import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizePolicyExample } from '../src/lib/policy-example';

test('perfect correlation can coexist with 20 percentage points of optimistic error', () => {
  assert.deepEqual(summarizePolicyExample([40, 60, 80]), {
    correlation: 1, order: 'Preserved', selected: 'C', meanSignedError: 20, meanAbsoluteError: 20,
  });
  const exact = summarizePolicyExample([20, 40, 60]);
  assert.equal(exact.correlation, 1);
  assert.equal(exact.meanAbsoluteError, 0);
});

test('signed errors can cancel while ranking and individual estimates are wrong', () => {
  const reverse = summarizePolicyExample([60, 40, 20]);
  assert.equal(reverse.correlation, -1);
  assert.equal(reverse.order, 'Changed');
  assert.equal(reverse.selected, 'A');
  assert.equal(reverse.meanSignedError, 0);
  assert(Math.abs(reverse.meanAbsoluteError - 80 / 3) < 1e-10);
});

test('constant estimates have undefined Pearson correlation and tied selection', () => {
  const flat = summarizePolicyExample([40, 40, 40]);
  assert.equal(flat.correlation, null);
  assert.equal(flat.order, 'Tied');
  assert.equal(flat.selected, 'A / B / C');
  assert.equal(flat.meanSignedError, 0);
  assert(Math.abs(flat.meanAbsoluteError - 40 / 3) < 1e-10);
  assert.equal(summarizePolicyExample([20, 60, 60]).selected, 'B / C');
});

test('invalid or incomplete percentages fail explicitly rather than producing NaN', () => {
  for (const values of [[], [20, 40], [20, 40, 60, 80], [NaN, 40, 60], [Infinity, 40, 60], [-1, 40, 60], [101, 40, 60]]) {
    assert.throws(() => summarizePolicyExample(values), RangeError);
  }
});
