// Exact possible-count bounds for a fixed cohort with one binary outcome rule.
export function summarizeCohort(cohort) {
  if (!cohort || typeof cohort !== 'object') throw new TypeError('A cohort is required.');
  const { total, passed, failed, unknown } = cohort;
  for (const n of [total, passed, failed, unknown]) {
    if (!Number.isSafeInteger(n) || n < 0) throw new TypeError('Counts must be nonnegative safe integers.');
  }
  if (passed > total || failed > total - passed || unknown !== total - passed - failed) {
    throw new RangeError('Pass, fail and missing counts must partition the fixed cohort.');
  }
  const known = passed + failed;
  return {
    total, passed, failed, unknown, known,
    observedPassRate: known ? passed / known : null,
    outcomeCoverage: total ? known / total : null,
    minimumPassRate: total ? passed / total : null,
    maximumPassRate: total ? (passed + unknown) / total : null,
  };
}

export function recordInventedResults(cohort, outcome, requested = 10) {
  const current = summarizeCohort(cohort);
  if (!['passed', 'failed'].includes(outcome)) throw new TypeError('Choose pass or fail.');
  if (!Number.isSafeInteger(requested) || requested <= 0) throw new TypeError('Record a positive integer count.');
  const count = Math.min(requested, current.unknown);
  return { ...cohort, [outcome]: cohort[outcome] + count, unknown: current.unknown - count };
}

export function compareCohorts(a, b) {
  const x = summarizeCohort(a), y = summarizeCohort(b);
  if (!x.total || !y.total) return 'undefined';
  // Compare integer fractions exactly, including near-equal large cohorts.
  const difference = (an, ad, bn, bd) => BigInt(an) * BigInt(bd) - BigInt(bn) * BigInt(ad);
  if (difference(x.passed, x.total, y.passed + y.unknown, y.total) > 0n) return 'a_strictly_higher';
  if (difference(y.passed, y.total, x.passed + x.unknown, x.total) > 0n) return 'b_strictly_higher';
  if (!x.unknown && !y.unknown && difference(x.passed, x.total, y.passed, y.total) === 0n) return 'equal';
  return 'unresolved';
}
