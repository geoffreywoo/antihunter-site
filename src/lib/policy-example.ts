// Three deliberately invented policies. No model measurements enter this toy.
export const physicalPercent = [20, 40, 60] as const;
export const policyNames = ['A', 'B', 'C'] as const;

export function summarizePolicyExample(estimates: readonly number[]) {
  if (estimates.length !== 3 || estimates.some(n => !Number.isFinite(n) || n < 0 || n > 100)) {
    throw new RangeError('Expected three percentages between 0 and 100.');
  }
  const mean = estimates.reduce((sum, n) => sum + n, 0) / 3;
  const spread = estimates.reduce((sum, n) => sum + (n - mean) ** 2, 0);
  const covariance = estimates.reduce((sum, n, i) => sum + (physicalPercent[i] - 40) * (n - mean), 0);
  const correlation = spread === 0 ? null : Math.max(-1, Math.min(1, covariance / Math.sqrt(800 * spread)));
  const hasTie = new Set(estimates).size !== 3;
  const order = hasTie ? 'Tied' : estimates[0] < estimates[1] && estimates[1] < estimates[2] ? 'Preserved' : 'Changed';
  const top = Math.max(...estimates);
  return {
    correlation,
    order,
    selected: policyNames.filter((_, i) => estimates[i] === top).join(' / '),
    meanSignedError: estimates.reduce((sum, n, i) => sum + n - physicalPercent[i], 0) / 3,
    meanAbsoluteError: estimates.reduce((sum, n, i) => sum + Math.abs(n - physicalPercent[i]), 0) / 3,
  };
}
