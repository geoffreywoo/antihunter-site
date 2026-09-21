import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_INPUT_BYTES, normalizeCandidate } from '../public/experiments/fence-v1/normalize.mjs';
import { scoreResponse } from '../public/experiments/probation-v1/score.mjs';

const gold = { supplier: 'Example Studio', invoice_number: 'TEST-1', invoice_date: '2026-09-21',
  due_date: '2026-09-30', currency: 'USD', invoice_total: '12.00', review_fields: [] };
const valid = JSON.stringify(gold);
const fenced = (body: string, opening = '\n', closing = '\n', final = '') => '```json' + opening + body + closing + '```' + final;
const rejected = (input: unknown, reason?: string) => {
  const result = normalizeCandidate(input);
  assert.equal(result.ok, false);
  assert.equal(result.mode, null);
  assert.equal(result.text, null);
  if (reason) assert.equal(result.reason, reason);
};

test('bare object candidates preserve every original character, including ASCII JSON whitespace', () => {
  for (const text of [valid, ' \t\r\n' + valid + '\r\n\t ', '{\r\n "nested": [{"a": 1}]\r\n}', '{}']) {
    assert.deepEqual(normalizeCandidate(text), { ok: true, mode: 'bare', text, reason: null });
  }
});

test('fence boundaries allow LF and CRLF independently and preserve every body character', () => {
  const body = ' \t\r\n' + valid + '\r\n\t ';
  for (const opening of ['\n', '\r\n']) for (const closing of ['\n', '\r\n']) for (const final of ['', '\n', '\r\n']) {
    assert.deepEqual(normalizeCandidate(fenced(body, opening, closing, final)), { ok: true, mode: 'single-fence', text: body, reason: null });
    assert.equal(normalizeCandidate('```' + opening + body + closing + '```' + final).text, body);
  }
});

test('only string inputs are accepted, without coercion or property inspection', () => {
  for (const input of [null, undefined, 0, true, [], {}, new String(valid), { toString() { throw new Error('must not run'); } }]) rejected(input, 'not_string');
});

test('the inclusive size limit counts original UTF8 bytes, including the removed wrapper', () => {
  const exactAscii = '{"x":"' + 'a'.repeat(MAX_INPUT_BYTES - 8) + '"}';
  const exactUnicode = '{"x":"' + 'é'.repeat((MAX_INPUT_BYTES - 8) / 2) + '"}';
  assert.equal(new TextEncoder().encode(exactAscii).byteLength, 8192);
  assert.equal(new TextEncoder().encode(exactUnicode).byteLength, 8192);
  assert.equal(normalizeCandidate(exactAscii).ok, true);
  assert.equal(normalizeCandidate(exactUnicode).ok, true);
  rejected(exactAscii + ' ', 'too_large');
  rejected(exactUnicode + ' ', 'too_large');
  rejected(fenced(exactAscii), 'too_large');
  const exactFenced = fenced('{"x":"' + 'a'.repeat(MAX_INPUT_BYTES - 8 - 12) + '"}');
  assert.equal(new TextEncoder().encode(exactFenced).byteLength, 8192);
  assert.equal(normalizeCandidate(exactFenced).ok, true);
});

test('extra final newlines are rejected with exact end consumption', () => {
  for (const ending of ['\n\n', '\r\n\r\n', '\n\r\n', '\r\n\n', '\r', '\t', ' ']) rejected(fenced(valid) + ending, 'invalid_fence');
});

test('fences have exact case-sensitive opening and closing lines and no outside prose', () => {
  for (const input of [
    ' ```json\n' + valid + '\n```', '\n```json\n' + valid + '\n```',
    'Here is JSON:\n' + fenced(valid), fenced(valid) + '\nExplanation.',
    '```JSON\n' + valid + '\n```', '```javascript\n' + valid + '\n```',
    '```json \n' + valid + '\n```', '```json\t\n' + valid + '\n```',
    '```json\r' + valid + '\r```', '````json\n' + valid + '\n````',
    '```json\n' + valid + '\n ```', '```json\n' + valid + '\n````',
    '~~~json\n' + valid + '\n~~~', '```json ' + valid + '```',
  ]) rejected(input);
});

test('arrays, scalars, multiple objects, multiple envelopes and nested envelopes are rejected', () => {
  for (const body of ['', '[]', 'null', 'true', '1', '"string"', '{}{}', '{}\n{}', '{} trailing', 'prefix {}']) {
    rejected(body);
    rejected(fenced(body));
  }
  rejected(fenced(valid) + '\n' + fenced(valid));
  rejected(fenced(fenced(valid)));
  rejected('```\n```', 'invalid_fence');
});

test('backticks, braces and escaped quote sequences inside strings are preserved as data', () => {
  for (const supplier of ['Backtick ``` Workshop', 'Braces }{ Studio', 'Escaped "quoted" \\ supplier', 'Line\n```\nBreak']) {
    const body = JSON.stringify({ ...gold, supplier });
    assert.equal(normalizeCandidate(body).text, body);
    assert.equal(normalizeCandidate(fenced(body)).text, body);
    assert.equal(scoreResponse({ ...gold, supplier }, body).accepted, true);
  }
});

test('Unicode whitespace outside the object is not silently trimmed', () => {
  for (const space of ['\u00a0', '\u2003', '\ufeff', '\u2028', '\u2029', '\u200b']) {
    rejected(space + valid);
    rejected(valid + space);
    rejected(fenced(space + valid));
    rejected(fenced(valid + space));
  }
});

test('normalization never repairs grammar, duplicate keys, types, extra fields or wrong answers', () => {
  const invalid = [
    valid.replace(/}$/, ',}'),
    valid.replace('"supplier":', '"supplier":"old","supplier":'),
    valid.replace('"supplier":', '"suppli\\u0065r":"old","supplier":'),
    JSON.stringify({ ...gold, invoice_total: 12 }), JSON.stringify({ ...gold, extra: 'do not drop me' }),
    JSON.stringify({ ...gold, invoice_total: '999.00' }), JSON.stringify({ ...gold, due_date: '2026-02-30' }),
    '{"__proto__":{"polluted":true},"x":1}',
  ];
  for (const body of invalid) {
    assert.equal(normalizeCandidate(body).text, body);
    assert.equal(normalizeCandidate(fenced(body)).text, body);
    assert.equal(scoreResponse(gold, body).accepted, false);
  }
  assert.equal(({} as any).polluted, undefined);
});

test('original strict scoring remains separate from candidate framing', () => {
  const raw = fenced(valid);
  assert.equal(scoreResponse(gold, raw).accepted, false);
  const candidate = normalizeCandidate(raw);
  assert.equal(candidate.ok, true);
  assert.equal(scoreResponse(gold, candidate.text).accepted, true);
  assert.equal(scoreResponse(gold, raw).accepted, false);
});
