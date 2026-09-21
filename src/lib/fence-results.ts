/** Validate an observed artifact; never execute the parser or regrade model output. */
export const FENCE_MANIFEST = '9fd718f1bd98439a035cf3555c86002e7debe2bb3cebe757515b05e63ca3fb71';
type ObjectValue = Record<string, any>;
function invalid(): never { throw new Error('Invalid fence-v1 result evidence'); }
function object(value: unknown): ObjectValue {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as ObjectValue : invalid();
}
function boolean(value: unknown): boolean { return typeof value === 'boolean' ? value : invalid(); }

export function summarizeFenceResults(input: unknown, corpusInput: unknown) {
  const report = object(input), corpus = object(corpusInput);
  if (report.id !== 'fence-v1' || report.manifestSha256 !== FENCE_MANIFEST || report.complete !== true
    || report.modelCalls !== 0 || report.paidApiUsageUsd !== 0 || !Number.isFinite(Date.parse(report.ranAt))
    || corpus.id !== 'fence-v1' || !Array.isArray(corpus.cases) || corpus.cases.length !== 49
    || !Array.isArray(report.rows) || report.rows.length !== 49) invalid();
  const expected = new Map(corpus.cases.map((entry: unknown) => { const row = object(entry); return [row.id, row]; }));
  if (expected.size !== 49 || new Set(report.rows.map((row: ObjectValue) => row.id)).size !== 49) invalid();
  const rows = report.rows.map((entry: unknown) => {
    const row = object(entry), declared = expected.get(row.id);
    if (!declared || row.expectedAccepted !== declared.expectedAccepted
      || row.expectedStrictAccepted !== declared.expectedStrictAccepted) invalid();
    const strictAccepted = boolean(object(row.strict).accepted);
    const normalizedAccepted = boolean(object(row.normalized).accepted);
    const candidate = object(row.candidate);
    const preserved = candidate.ok === (declared.expectedMode !== null)
      && candidate.text === declared.expectedCandidate && candidate.mode === declared.expectedMode;
    const matched = normalizedAccepted === declared.expectedAccepted && strictAccepted === declared.expectedStrictAccepted;
    if (boolean(row.candidateUnchanged) !== preserved || boolean(row.expectationMatched) !== matched) invalid();
    return { allowed: boolean(declared.expectedAccepted), strictAccepted, normalizedAccepted, preserved, matched };
  });
  const allowedPlanned = rows.filter(row => row.allowed).length;
  const prohibitedPlanned = rows.length - allowedPlanned;
  if (allowedPlanned !== 11 || prohibitedPlanned !== 38) invalid();
  const summarize = (key: 'strictAccepted' | 'normalizedAccepted') => ({
    allowedAccepted: rows.filter(row => row.allowed && row[key]).length, allowedPlanned,
    prohibitedRejected: rows.filter(row => !row.allowed && !row[key]).length, prohibitedPlanned,
    falseAccepts: rows.filter(row => !row.allowed && row[key]).length,
  });
  const strict = summarize('strictAccepted'), singleFence = summarize('normalizedAccepted');
  for (const [key, computed] of [['strict', strict], ['singleFence', singleFence]] as const) {
    const recorded = object(report[key]);
    if (Object.entries(computed).some(([field, value]) => recorded[field] !== value)) invalid();
  }
  const expectationMatches = rows.filter(row => row.matched).length;
  const candidatePreserved = rows.filter(row => row.preserved).length;
  const contractMet = expectationMatches === 49 && candidatePreserved === 49 && singleFence.falseAccepts === 0;
  if (boolean(report.expectationsMet) !== contractMet) invalid();
  return { ranAt: report.ranAt as string, strict, singleFence, expectationMatches, candidatePreserved, planned: 49, contractMet };
}
