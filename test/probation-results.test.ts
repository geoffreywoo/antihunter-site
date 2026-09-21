import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIGURATIONS, PROBATION_MANIFEST, formatTrialUsd, resultRowLabel, summarizeProbationResults } from '../src/lib/probation-results';

// Synthetic UI fixtures only. They are never included in a public result artifact.
function receipt() {
  return {
    id: 'probation-v1', manifestSha256: PROBATION_MANIFEST, complete: true,
    rows: Array.from({ length: 10 }, (_, index) => (['sonnet', 'fable'] as const).map(configuration => {
      const charge = configuration === 'sonnet' ? .001 : .004;
      return {
        caseId: String(index + 1).padStart(2, '0'), configuration, status: 'completed', attempted: true as boolean | null,
        requestedModel: CONFIGURATIONS[configuration].model, returnedModel: CONFIGURATIONS[configuration].model as string | null,
        error: null as string | null, output: '{}', estimatedCostUsd: charge as number | null,
        spending: [{ state: 'settled', reservedUsd: .1, observedUsd: charge as number | null }],
        score: { accepted: true, fieldsCorrect: 6, reviewCorrect: true, schemaValid: true, reviewConsistent: true },
      };
    })).flat(),
  };
}

test('reconciled results retain planned denominators and apply the frozen dominance rule', () => {
  const result = summarizeProbationResults(receipt());
  assert.equal(result.complete, true);
  assert.equal(result.winner, 'sonnet');
  for (const configuration of result.configurations) {
    assert.equal(configuration.accepted, 10);
    assert.equal(configuration.planned, 10);
    assert.equal(configuration.fieldsCorrect, 60);
    assert.equal(configuration.unattempted, 0);
    assert.equal(configuration.uncertain, 0);
    assert.ok(configuration.costPerAcceptedUsd! > 0);
  }
});

test('unattempted slots remain visible and an optimistic headline cannot turn an incomplete run into a winner', () => {
  const input = receipt();
  Object.assign(input, { headlineWinner: 'sonnet', outcome: 'dominant' });
  for (const row of input.rows.slice(2)) Object.assign(row, {
    status: 'unattempted', attempted: false, returnedModel: null, estimatedCostUsd: null, spending: [],
    score: { accepted: false, fieldsCorrect: 0, reviewCorrect: false, schemaValid: false },
  });
  const result = summarizeProbationResults(input);
  assert.equal(result.complete, false);
  assert.equal(result.winner, null);
  assert.match(result.verdict, /Incomplete run. No winner/);
  assert.equal(result.configurations[0].attempted, 1);
  assert.equal(result.configurations[0].unattempted, 9);
  assert.equal(result.configurations[0].accepted, 1);
  assert.equal(result.configurations[0].planned, 10);
  assert.equal(resultRowLabel(result.rows[2]), 'Unattempted');
});

test('unknown charges keep full reservations separate from known cost and suppress cost per accepted', () => {
  const input = receipt();
  Object.assign(input.rows[0], { status: 'uncertain', attempted: null, estimatedCostUsd: null,
    spending: [{ state: 'dispatched', reservedUsd: .12144, observedUsd: null }] });
  const result = summarizeProbationResults(input);
  const sonnet = result.configurations[0];
  assert.equal(result.winner, null);
  assert.equal(sonnet.costKnown, false);
  assert.equal(sonnet.costPerAcceptedUsd, null);
  assert.equal(sonnet.unresolvedReservationUsd, .12144);
  assert.ok(Math.abs(sonnet.knownCostUsd - .009) < 1e-12);
  assert.equal(sonnet.attempted + sonnet.unattempted + sonnet.uncertain, 10);
  assert.equal(resultRowLabel(result.rows[0]), 'Dispatch uncertain');
});

test('an uncertain dispatch without a visible reservation remains unknown, not free', () => {
  const input = receipt();
  Object.assign(input.rows[0], { status: 'uncertain', attempted: null, estimatedCostUsd: null, spending: [] });
  const sonnet = summarizeProbationResults(input).configurations[0];
  assert.equal(sonnet.unresolvedReservationUsd, 0);
  assert.equal(sonnet.costKnown, false);
  assert.equal(sonnet.costPerAcceptedUsd, null);
});

test('a confirmed dispatch with no durable outcome still counts as an unresolved slot', () => {
  const input = receipt();
  Object.assign(input.rows[0], { status: 'uncertain', attempted: true, estimatedCostUsd: null,
    spending: [{ state: 'dispatched', reservedUsd: .12144, observedUsd: null }] });
  const result = summarizeProbationResults(input);
  assert.equal(result.configurations[0].attempted, 10);
  assert.equal(result.configurations[0].uncertain, 1);
  assert.equal(result.configurations[0].accepted, 9);
  assert.equal(result.complete, false);
});

test('a failed or misrouted request cannot earn accepted credit from a matching JSON body', () => {
  const input = receipt();
  Object.assign(input.rows[0], { status: 'failed', error: 'route_mismatch' });
  const result = summarizeProbationResults(input);
  assert.equal(result.configurations[0].accepted, 9);
  assert.equal(result.configurations[0].attempted, 10);
  assert.equal(result.configurations[0].fieldsCorrect, 54);
  assert.equal(result.complete, false);
  assert.equal(resultRowLabel(result.rows[0]), 'Failed attempt');
});

test('zero accepted results have undefined cost per acceptance, including when only the other configuration passes', () => {
  const input = receipt();
  input.rows.filter(row => row.configuration === 'sonnet').forEach(row => { row.score.accepted = false; });
  const onePasses = summarizeProbationResults(input);
  assert.equal(onePasses.configurations[0].costPerAcceptedUsd, null);
  assert.equal(onePasses.winner, null);
  assert.match(onePasses.verdict, /alone produced accepted results/);
  input.rows.forEach(row => { row.score.accepted = false; });
  const nonePass = summarizeProbationResults(input);
  assert.equal(nonePass.winner, null);
  assert.match(nonePass.verdict, /Neither configuration/);
});

test('missing, duplicated, wrong-manifest and unreconciled cost evidence fail validation', () => {
  const missing = receipt(); missing.rows.pop();
  const duplicate = receipt(); duplicate.rows[0] = duplicate.rows[2];
  const wrongHash = receipt(); wrongHash.manifestSha256 = 'different';
  const wrongCost = receipt(); wrongCost.rows[0].spending[0].observedUsd = null;
  const wrongModel = receipt(); wrongModel.rows[0].requestedModel = 'claude-other' as never;
  for (const input of [missing, duplicate, wrongHash, wrongCost, wrongModel]) {
    assert.throws(() => summarizeProbationResults(input), /Invalid probation-v1 results artifact/);
  }
});

test('a returned model mismatch prevents a winner even when summary claims complete', () => {
  const input = receipt(); input.rows[0].returnedModel = 'claude-other';
  assert.equal(summarizeProbationResults(input).complete, false);
  assert.equal(summarizeProbationResults(input).winner, null);
});

test('errors cannot be hidden by a completed status, and accepted scores must agree with the rubric', () => {
  const errored = receipt(); errored.rows[0].error = 'ledger_mismatch';
  const result = summarizeProbationResults(errored);
  assert.equal(result.complete, false);
  assert.equal(result.winner, null);
  assert.equal(result.configurations[0].accepted, 9);
  const wrongScore = receipt(); wrongScore.rows[0].score.fieldsCorrect = 5;
  assert.throws(() => summarizeProbationResults(wrongScore), /Invalid probation-v1 results artifact/);
});

test('small real costs retain precision instead of being formatted as free', () => {
  assert.equal(formatTrialUsd(.000031), '$0.000031');
  assert.equal(formatTrialUsd(.12144), '$0.12144');
  assert.equal(formatTrialUsd(0), '$0');
});
