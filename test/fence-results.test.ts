import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { FENCE_MANIFEST, summarizeFenceResults } from '../src/lib/fence-results';

// Inspect the saved observation only. Do not import or execute the frozen runner.
const root = new URL('../public/experiments/fence-v1/', import.meta.url);
const result = JSON.parse(readFileSync(new URL('results.json', root), 'utf8'));
const corpus = JSON.parse(readFileSync(new URL('cases.json', root), 'utf8'));

test('the published follow-up keeps all observed cases, planned denominators and both pipeline outcomes', () => {
  const summary = summarizeFenceResults(result, corpus);
  assert.equal(summary.contractMet, true);
  assert.equal(summary.planned, 49);
  assert.equal(summary.expectationMatches, 49);
  assert.equal(summary.candidatePreserved, 49);
  assert.deepEqual(summary.strict, { allowedAccepted: 3, allowedPlanned: 11, prohibitedRejected: 38, prohibitedPlanned: 38, falseAccepts: 0 });
  assert.deepEqual(summary.singleFence, { allowedAccepted: 11, allowedPlanned: 11, prohibitedRejected: 38, prohibitedPlanned: 38, falseAccepts: 0 });
  assert.equal(createHash('sha256').update(readFileSync(new URL('manifest.json', root))).digest('hex'), FENCE_MANIFEST);
});

test('missing, duplicate, renamed and relabeled case evidence cannot produce a score table', () => {
  const missing = structuredClone(result); missing.rows.pop();
  const duplicate = structuredClone(result); duplicate.rows[0] = duplicate.rows[1];
  const renamed = structuredClone(result); renamed.rows[0].id = 'unfrozen-case';
  const relabeled = structuredClone(result); relabeled.rows[0].expectedAccepted = false;
  for (const input of [missing, duplicate, renamed, relabeled]) {
    assert.throws(() => summarizeFenceResults(input, corpus), /Invalid fence-v1 result evidence/);
  }
});

test('aggregate counts, preservation flags and declared pass must agree with the saved rows', () => {
  const wrongTotal = structuredClone(result); wrongTotal.strict.allowedAccepted = 11;
  const wrongText = structuredClone(result); wrongText.rows[0].candidate.text += ' ';
  const wrongOutcome = structuredClone(result); wrongOutcome.rows[0].normalized.accepted = false;
  const wrongManifest = structuredClone(result); wrongManifest.manifestSha256 = 'different';
  for (const input of [wrongTotal, wrongText, wrongOutcome, wrongManifest]) {
    assert.throws(() => summarizeFenceResults(input, corpus), /Invalid fence-v1 result evidence/);
  }
});

test('a recorded regression failure remains a failed contract, not a manufactured pass', () => {
  const failed = structuredClone(result);
  failed.rows[0].normalized.accepted = false;
  failed.rows[0].expectationMatched = false;
  failed.singleFence.allowedAccepted = 10;
  failed.expectationsMet = false;
  const summary = summarizeFenceResults(failed, corpus);
  assert.equal(summary.contractMet, false);
  assert.equal(summary.expectationMatches, 48);
  assert.equal(summary.singleFence.allowedAccepted, 10);
});
