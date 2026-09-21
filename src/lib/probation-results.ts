/** Presentation uses slot receipts, never a headline supplied without evidence. */
export const PROBATION_MANIFEST = '676af10773130f992f51875beb0419879bc98d0ec49e515f59ce28097d8f76f6';
export const CONFIGURATIONS = {
  sonnet: { label: 'Claude Sonnet 4.6', model: 'claude-sonnet-4-6' },
  fable: { label: 'Claude Fable 5', model: 'claude-fable-5' },
} as const;
type Configuration = keyof typeof CONFIGURATIONS;
type RecordValue = Record<string, unknown>;
type Spending = { state: string; reservedUsd: number; observedUsd: number | null };
type Score = { accepted: boolean; fieldsCorrect: number; reviewCorrect: boolean; schemaValid: boolean };
export type ResultRow = {
  caseId: string; configuration: Configuration; status: string; attempted: boolean | null;
  requestedModel: string; returnedModel: string | null; error: string | null; output: string | null;
  estimatedCostUsd: number | null; spending: Spending[]; score: Score;
};

function invalid(): never { throw new Error('Invalid probation-v1 results artifact'); }
function record(value: unknown): RecordValue {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : invalid();
}
function money(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : invalid();
}
function nullableMoney(value: unknown): number | null { return value === null ? null : money(value); }
function bool(value: unknown): boolean { return typeof value === 'boolean' ? value : invalid(); }
function nullableString(value: unknown): string | null { return value === null || typeof value === 'string' ? value : invalid(); }

function parseRow(input: unknown): ResultRow {
  const row = record(input), score = record(row.score);
  if (row.configuration !== 'sonnet' && row.configuration !== 'fable') invalid();
  const configuration = row.configuration as Configuration;
  if (typeof row.caseId !== 'string' || !/^(0[1-9]|10)$/.test(row.caseId)
    || !['completed', 'failed', 'blocked', 'uncertain', 'unattempted'].includes(String(row.status))
    || row.requestedModel !== CONFIGURATIONS[configuration].model || !Array.isArray(row.spending)) invalid();
  const attempted = row.attempted === null ? null : bool(row.attempted);
  const fieldsCorrect = money(score.fieldsCorrect);
  if (!Number.isInteger(fieldsCorrect) || fieldsCorrect > 6) invalid();
  const scored = { accepted: bool(score.accepted), fieldsCorrect, reviewCorrect: bool(score.reviewCorrect), schemaValid: bool(score.schemaValid) };
  if (scored.accepted && (fieldsCorrect !== 6 || !scored.reviewCorrect || !scored.schemaValid || score.reviewConsistent !== true)) invalid();
  const spending = row.spending.map((input) => {
    const value = record(input);
    if (!['reserved', 'dispatched', 'settled', 'released'].includes(String(value.state))) invalid();
    return { state: String(value.state), reservedUsd: money(value.reservedUsd), observedUsd: nullableMoney(value.observedUsd) };
  });
  const estimatedCostUsd = nullableMoney(row.estimatedCostUsd);
  // A known charge needs a matching settled receipt. An unresolved hold is never free.
  if (estimatedCostUsd !== null && (spending.length !== 1 || spending[0].state !== 'settled'
    || spending[0].observedUsd !== estimatedCostUsd)) invalid();
  if ((row.status === 'completed' && attempted !== true)
    || (row.status === 'unattempted' && (attempted !== false || spending.length))) invalid();
  return {
    caseId: row.caseId, configuration, status: String(row.status), attempted,
    requestedModel: String(row.requestedModel), returnedModel: nullableString(row.returnedModel),
    error: nullableString(row.error), output: nullableString(row.output), estimatedCostUsd, spending,
    score: scored,
  };
}

export function formatTrialUsd(value: number): string {
  return `$${value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}`;
}

function canScore(row: ResultRow): boolean {
  return row.status === 'completed' && row.error === null && row.returnedModel === row.requestedModel;
}

export function resultRowLabel(row: ResultRow): string {
  if (canScore(row)) return row.score.accepted ? 'Accepted' : 'Rejected by rubric';
  if (row.status === 'uncertain' || row.attempted === null) return 'Dispatch uncertain';
  if (row.attempted === false) return row.status === 'blocked' ? 'Unattempted · blocked' : 'Unattempted';
  return 'Failed attempt';
}

export function summarizeProbationResults(input: unknown) {
  const report = record(input);
  if (report.id !== 'probation-v1' || report.manifestSha256 !== PROBATION_MANIFEST
    || !Array.isArray(report.rows) || report.rows.length !== 20) invalid();
  const rows = report.rows.map(parseRow);
  if (new Set(rows.map(row => `${row.caseId}:${row.configuration}`)).size !== 20) invalid();
  const configurations = (Object.keys(CONFIGURATIONS) as Configuration[]).map((id) => {
    const selected = rows.filter(row => row.configuration === id);
    if (selected.length !== 10) invalid();
    const knownCostUsd = selected.flatMap(row => row.spending)
      .filter(receipt => receipt.state === 'settled' && receipt.observedUsd !== null)
      .reduce((sum, receipt) => sum + receipt.observedUsd!, 0);
    const unresolvedReservationUsd = selected.flatMap(row => row.spending)
      .filter(receipt => receipt.state !== 'released' && (receipt.state !== 'settled' || receipt.observedUsd === null))
      .reduce((sum, receipt) => sum + receipt.reservedUsd, 0);
    const costKnown = selected.every(row => row.status !== 'uncertain' && row.attempted !== null
      && !(row.attempted === true && row.estimatedCostUsd === null)
      && row.spending.every(receipt => receipt.state === 'released' || receipt.state === 'settled' && receipt.observedUsd !== null));
    // A matching JSON body from a failed or misrouted request does not pass the trial.
    const scored = selected.filter(canScore);
    const accepted = scored.filter(row => row.score.accepted).length;
    return { id, ...CONFIGURATIONS[id], planned: 10, accepted,
      attempted: selected.filter(row => row.attempted === true).length,
      unattempted: selected.filter(row => row.attempted === false).length,
      uncertain: selected.filter(row => row.attempted === null || row.status === 'uncertain').length,
      fieldsCorrect: scored.reduce((sum, row) => sum + row.score.fieldsCorrect, 0),
      reviewCorrect: scored.filter(row => row.score.reviewCorrect).length,
      schemaValid: scored.filter(row => row.score.schemaValid).length,
      knownCostUsd, unresolvedReservationUsd, costKnown,
      costPerAcceptedUsd: costKnown && accepted > 0 ? knownCostUsd / accepted : null,
    };
  });
  const complete = report.complete === true && configurations.every(configuration => configuration.costKnown)
    && rows.every(row => canScore(row) && row.attempted === true && row.estimatedCostUsd !== null);
  const [sonnet, fable] = configurations;
  let verdict = 'Incomplete run. No winner.';
  let winner: Configuration | null = null;
  if (complete) {
    if (!sonnet.accepted && !fable.accepted) verdict = 'Neither configuration produced an accepted result. No winner.';
    else if (!sonnet.accepted || !fable.accepted) {
      verdict = `${sonnet.accepted ? sonnet.label : fable.label} alone produced accepted results. The other configuration has no defined cost per acceptance.`;
    } else {
      const dominates = (a: typeof sonnet, b: typeof sonnet) => a.accepted >= b.accepted && a.costPerAcceptedUsd! < b.costPerAcceptedUsd!
        || a.accepted > b.accepted && a.costPerAcceptedUsd === b.costPerAcceptedUsd;
      winner = dominates(sonnet, fable) ? 'sonnet' : dominates(fable, sonnet) ? 'fable' : null;
      verdict = winner ? `${CONFIGURATIONS[winner].label} meets the preregistered dominance rule on these ten cases.`
        : sonnet.accepted === fable.accepted && sonnet.costPerAcceptedUsd === fable.costPerAcceptedUsd
          ? 'A tie under the preregistered rule. No winner.' : 'A cost–acceptance tradeoff under the preregistered rule. No winner.';
    }
  }
  return { rows, configurations, complete, winner, verdict };
}
