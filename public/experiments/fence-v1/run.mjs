/** Reproducible local regression run. No model calls or execution of input text. */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const names = ['cases.json', 'normalize.mjs', 'score.mjs', 'protocol.json', 'run.mjs'];
const origin = 'https://antihunter.com/experiments/fence-v1/';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const local = name => new URL(name, import.meta.url);

export async function verifyBundle(verifyLive = false) {
  const manifestBytes = await readFile(local('manifest.json'));
  const manifest = JSON.parse(manifestBytes);
  if (manifest.id !== 'fence-v1' || JSON.stringify(manifest.files.map(f => f.path).sort()) !== JSON.stringify([...names].sort())) throw Error('Unexpected manifest');
  const remote = async name => {
    const response = await fetch(new URL(name, origin), { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw Error('Live artifact unavailable');
    return Buffer.from(await response.arrayBuffer());
  };
  if (verifyLive && !manifestBytes.equals(await remote('manifest.json'))) throw Error('Live manifest differs');
  for (const file of manifest.files) {
    const bytes = await readFile(local(file.path));
    if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) throw Error('Local artifact differs: ' + file.path);
    if (verifyLive && !bytes.equals(await remote(file.path))) throw Error('Live artifact differs: ' + file.path);
  }
  const corpus = JSON.parse(await readFile(local('cases.json')));
  if (corpus.id !== 'fence-v1' || corpus.cases.length !== 49 || new Set(corpus.cases.map(row => row.id)).size !== 49) throw Error('Unexpected corpus');
  return { manifestSha256: hash(manifestBytes), corpus };
}

export async function runRegression(bundle) {
  const { normalizeCandidate, MAX_INPUT_BYTES } = await import('./normalize.mjs');
  const { scoreResponse } = await import('./score.mjs');
  const rows = bundle.corpus.cases.map(row => {
    const eligible = typeof row.raw === 'string' && row.raw.length <= MAX_INPUT_BYTES
      && Buffer.byteLength(row.raw, 'utf8') <= MAX_INPUT_BYTES;
    const strict = scoreResponse(row.expected, eligible ? row.raw : null);
    const candidate = normalizeCandidate(row.raw);
    const normalized = scoreResponse(row.expected, candidate.ok ? candidate.text : null);
    return { id: row.id, category: row.category, expectedAccepted: row.expectedAccepted,
      expectedStrictAccepted: row.expectedStrictAccepted, rawEligible: eligible,
      candidate, strict, normalized,
      candidateUnchanged: candidate.ok === (row.expectedMode !== null)
        && candidate.text === row.expectedCandidate && candidate.mode === row.expectedMode,
      expectationMatched: normalized.accepted === row.expectedAccepted && strict.accepted === row.expectedStrictAccepted };
  });
  const summarize = key => ({
    allowedAccepted: rows.filter(row => row.expectedAccepted && row[key].accepted).length, allowedPlanned: 11,
    prohibitedRejected: rows.filter(row => !row.expectedAccepted && !row[key].accepted).length, prohibitedPlanned: 38,
    falseAccepts: rows.filter(row => !row.expectedAccepted && row[key].accepted).length,
  });
  return { id: 'fence-v1', kind: 'post-observation deterministic regression',
    ranAt: new Date().toISOString(), manifestSha256: bundle.manifestSha256,
    complete: true, expectationsMet: rows.every(row => row.expectationMatched && row.candidateUnchanged),
    strict: summarize('strict'), singleFence: summarize('normalized'),
    modelCalls: 0, paidApiUsageUsd: 0,
    limitations: ['Hand-authored after seeing an earlier formatting failure; no held-out or production-robustness claim.',
      'This does not regrade probation-v1, measure human review, or establish production cost savings.'], rows };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (JSON.stringify(args) === JSON.stringify(['--check-only'])) {
    const bundle = await verifyBundle(false);
    console.log(JSON.stringify({ verified: true, executedCorpus: false, cases: bundle.corpus.cases.length, manifestSha256: bundle.manifestSha256 }));
  } else if (args.length === 3 && args[0] === '--verify-live' && args[1] === '--output' && path.isAbsolute(args[2])) {
    const bundle = await verifyBundle(true);
    const result = await runRegression(bundle);
    await writeFile(args[2], JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ complete: true, expectationsMet: result.expectationsMet, strict: result.strict, singleFence: result.singleFence }));
    if (!result.expectationsMet) process.exitCode = 2;
  } else throw Error('Use --check-only, or --verify-live --output /absolute/new-results.json');
}
