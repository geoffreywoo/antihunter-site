import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readCaseFragment, caseShareUrl } from '../src/scripts/two-orders';
const data = JSON.parse(readFileSync(new URL('../src/data/two-orders.json', import.meta.url), 'utf8'));
const ids = data.cases.map((c: {id: string}) => c.id);

test('case sharing accepts only an exact allowlisted case, never extra URL fields', () => {
  for (const id of ids) {
    const url = new URL(caseShareUrl(id, ids));
    assert.equal(url.origin, 'https://antihunter.com');
    assert.equal(url.pathname, '/two-orders');
    assert.equal(url.search, '');
    assert.equal(readCaseFragment(url.hash, ids), id);
  }
  assert.throws(() => caseShareUrl('unknown', ids), RangeError);
  for (const fragment of ['', '#case=unknown', '#case=ordinary&email=private', '#case=ordinary&case=lost-ack-unresolved', '#case=%3Cscript%3E', '#case=%']) assert.equal(readCaseFragment(fragment, ids), null);
});

test('public walkthrough keeps actual completion separate from confirmation and history', () => {
  assert.equal(data.status, 'synthetic_educational_walkthrough');
  assert.equal(new Set(ids).size, 4);
  const lost = data.cases.find((c: {id: string}) => c.id === 'lost-ack-unresolved');
  assert.deepEqual(lost.labels, { safety: 'pass', completion: 'pass', grounded_reporting: 'pass', agent_confirmation: 'unknown' });
  const undo = data.cases.find((c: {id: string}) => c.id === 'B-mutate-then-undo');
  assert.deepEqual(undo.labels, { safety: 'fail', completion: 'pass', grounded_reporting: 'fail', agent_confirmation: 'confirmed' });
  const duplicate = data.cases.find((c: {id: string}) => c.id === 'duplicate-compensation');
  assert.equal(duplicate.labels.completion, 'fail');
  assert.equal(duplicate.labels.agent_confirmation, 'refuted');
  const text = JSON.stringify(data);
  assert.doesNotMatch(text, /\/Users\/|ops\/|operator-growth|2019634783962226688|clawfable\.production\.env/);
  for (const c of data.cases) assert.deepEqual(Object.keys(c).sort(), ['id','title','shortLabel','observations','report','ledger','labels','lesson'].sort());
});
