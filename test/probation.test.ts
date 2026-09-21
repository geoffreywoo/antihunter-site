import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { FIELDS, scoreResponse } from '../public/experiments/probation-v1/score.mjs';

const root = new URL('../public/experiments/probation-v1/', import.meta.url);
const dataset = JSON.parse(readFileSync(new URL('cases.json', root), 'utf8'));
const system = readFileSync(new URL('prompt.txt', root), 'utf8');
const first = dataset.cases[0].expected;

test('ten frozen cases have consistent gold answers, evidence, and bounded inputs', () => {
  assert.equal(dataset.cases.length, 10);
  assert.equal(new Set(dataset.cases.map(c => c.id)).size, 10);
  for (const c of dataset.cases) {
    assert.equal(scoreResponse(c.expected, JSON.stringify(c.expected)).accepted, true, c.id);
    assert.deepEqual(c.expected.review_fields, FIELDS.filter(key => c.expected[key] === null).sort());
    assert.ok([...FIELDS, 'review_fields'].every(key => typeof c.evidence[key] === 'string' && c.evidence[key].length > 0));
    assert.ok(Buffer.byteLength(JSON.stringify({ system, messages: [{ role: 'user', content: c.input }] }), 'utf8') <= 4096, c.id);
  }
});

test('reasonable supplier whitespace normalization does not forgive invoice errors', () => {
  assert.equal(scoreResponse(first, JSON.stringify({ ...first, supplier: '  North  Ledger Studio\n' })).accepted, true);
  const result = scoreResponse(first, JSON.stringify({ ...first, invoice_total: '1200.00' }));
  assert.equal(result.schemaValid, true);
  assert.equal(result.fieldsCorrect, 5);
  assert.equal(result.accepted, false);
  assert.equal(scoreResponse(first, JSON.stringify({ ...first, invoice_number: 'INV-1' })).accepted, false);
});

test('nonparseable, malformed, duplicated, and noncanonical responses earn no credit', () => {
  const gold = JSON.stringify(first);
  for (const raw of [
    '```json\n' + gold + '\n```', gold + '\nI checked this.', 'null', '[]',
    JSON.stringify({ ...first, invoice_total: 120 }), JSON.stringify({ ...first, due_date: '2026-02-30' }),
    JSON.stringify({ ...first, invoice_total: '0120.00' }), JSON.stringify({ ...first, currency: 'usd' }),
    JSON.stringify({ ...first, extra: true }), gold.replace('"supplier":', '"supplier":"old","supplier":'),
    gold.replace('"supplier":', '"suppli\\u0065r":"old","supplier":'),
  ]) {
    const scored = scoreResponse(first, raw);
    assert.equal(scored.accepted, false, raw);
    assert.equal(scored.schemaValid, false, raw);
    assert.equal(scored.fieldsCorrect, 0, raw);
  }
});

test('missing-value and ambiguity decisions require the exact review set', () => {
  const gold = dataset.cases[2].expected;
  const omitted = scoreResponse(gold, JSON.stringify({ ...gold, review_fields: [] }));
  assert.equal(omitted.fieldsCorrect, 6);
  assert.equal(omitted.reviewCorrect, false);
  assert.equal(omitted.accepted, false);
  assert.equal(scoreResponse(gold, JSON.stringify({ ...gold, review_fields: ['invoice_number', 'due_date'] })).schemaValid, false);
  assert.equal(scoreResponse(first, JSON.stringify({ ...first, supplier: 'A "supplier": example' })).schemaValid, true);
});

test('manifest identifies exact public artifacts before model outputs exist', () => {
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));
  assert.equal(manifest.status, 'preregistered-not-run');
  for (const file of manifest.files) {
    const bytes = readFileSync(new URL(file.path, root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
    assert.equal(bytes.length, file.bytes);
  }
  assert.deepEqual(manifest.files.map(f => f.path).sort(), ['cases.json', 'prompt.txt', 'protocol.json', 'score.mjs']);
});
