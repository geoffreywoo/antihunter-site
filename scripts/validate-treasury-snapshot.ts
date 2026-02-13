import fs from 'node:fs/promises';
import path from 'node:path';

type SnapshotRow = {
  symbol: string;
  token: string | null;
  balance: string;
  entryDate?: string | null;
  costBasisUsd?: number | null;
  costBasisEth?: string | null;
  fmvUsd?: number | null;
  pnlUsd?: number | null;
  lots?: any;
};

type Snapshot = {
  updatedAtMs: number;
  updatedAt: string;
  date: string;
  wallet: string;
  basescan?: string;
  rows: SnapshotRow[];
  totalUsd: number;
  notes?: any;
  method?: any;
};

function isIsoDate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function finiteNum(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}

function approxEqual(a: number, b: number, eps = 1e-6) {
  return Math.abs(a - b) <= eps;
}

async function main() {
  const projectRoot = process.cwd();
  const p = path.join(projectRoot, 'public', 'treasury.snapshot.json');
  const raw = await fs.readFile(p, 'utf8');
  const j = JSON.parse(raw) as Snapshot;

  const errs: string[] = [];

  if (!finiteNum(j.updatedAtMs) || j.updatedAtMs <= 0) errs.push('updatedAtMs missing/invalid');
  if (typeof j.updatedAt !== 'string' || !j.updatedAt.includes('T')) errs.push('updatedAt missing/invalid');
  if (!isIsoDate(j.date)) errs.push('date missing/invalid (YYYY-MM-DD)');
  if (typeof j.wallet !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(j.wallet)) errs.push('wallet missing/invalid');
  if (!Array.isArray(j.rows) || j.rows.length === 0) errs.push('rows missing/empty');
  if (!finiteNum(j.totalUsd) || j.totalUsd < 0) errs.push('totalUsd missing/invalid');

  // Staleness guardrail (snapshot should be reasonably fresh)
  const ageHours = finiteNum(j.updatedAtMs) ? (Date.now() - j.updatedAtMs) / 36e5 : null;
  if (ageHours != null && ageHours > 72) errs.push(`snapshot is stale: ageHours=${ageHours.toFixed(1)} (>72h)`);

  // Row-level sanity
  let sum = 0;
  for (let i = 0; i < (j.rows?.length ?? 0); i++) {
    const r = j.rows[i];
    if (!r || typeof r !== 'object') {
      errs.push(`row[${i}] not an object`);
      continue;
    }
    if (typeof r.symbol !== 'string' || !r.symbol.trim()) errs.push(`row[${i}].symbol missing/invalid`);
    if (!(r.token === null || (typeof r.token === 'string' && /^0x[0-9a-fA-F]{40}$/.test(r.token)))) {
      errs.push(`row[${i}].token missing/invalid (must be 0x..40 or null)`);
    }
    if (typeof r.balance !== 'string' || !r.balance.trim() || Number.isNaN(Number(r.balance))) {
      errs.push(`row[${i}].balance missing/invalid (string numeric)`);
    }
    if (r.entryDate != null && !isIsoDate(r.entryDate)) errs.push(`row[${i}].entryDate invalid (YYYY-MM-DD or null)`);

    if (r.fmvUsd != null) {
      if (!finiteNum(r.fmvUsd) || r.fmvUsd < 0) errs.push(`row[${i}].fmvUsd invalid`);
      else sum += r.fmvUsd;
    }
    if (r.costBasisUsd != null && (!finiteNum(r.costBasisUsd) || r.costBasisUsd < 0)) errs.push(`row[${i}].costBasisUsd invalid`);
    if (r.pnlUsd != null && (!finiteNum(r.pnlUsd))) errs.push(`row[${i}].pnlUsd invalid`);

    // Guardrail against absurd numbers (fat-finger / parse bugs)
    if (r.fmvUsd != null && r.fmvUsd > 1e9) errs.push(`row[${i}].fmvUsd too large (>1e9)`);
  }

  if (finiteNum(j.totalUsd)) {
    // allow a tiny epsilon for float sums
    if (!approxEqual(j.totalUsd, sum, 1e-2)) {
      errs.push(`totalUsd mismatch: totalUsd=${j.totalUsd} sum(rows.fmvUsd)=${sum}`);
    }
  }

  // Sorted-by-fmv guardrail (descending). Not fatal if missing fmvUsd.
  const fmvSeq = (j.rows ?? []).map((r) => (typeof r?.fmvUsd === 'number' ? r.fmvUsd : null)).filter((x): x is number => x != null);
  for (let i = 1; i < fmvSeq.length; i++) {
    if (fmvSeq[i] > fmvSeq[i - 1] + 1e-6) {
      errs.push('rows not sorted by fmvUsd desc (guardrail)');
      break;
    }
  }

  if (errs.length) {
    console.error(`treasury.snapshot.json validation FAILED (${errs.length} issues):`);
    for (const e of errs) console.error(`- ${e}`);
    process.exit(1);
  }

  console.log(`treasury.snapshot.json validation OK (rows=${j.rows.length}, totalUsd=${j.totalUsd})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
