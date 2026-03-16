#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const fp = path.join(process.cwd(), 'src', 'data', 'changelog.json');

function fail(errors) {
  console.log(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}

if (!fs.existsSync(fp)) fail([{ code: 'missing_file', msg: `Missing ${fp}` }]);

let rows;
try {
  rows = JSON.parse(fs.readFileSync(fp, 'utf8'));
} catch (e) {
  fail([{ code: 'malformed_json', msg: String(e?.message || e) }]);
}

const errors = [];
if (!Array.isArray(rows)) errors.push({ code: 'invalid_root', msg: 'changelog.json must be an array' });

const seenDates = new Set();
let prevDay = Infinity;
(rows || []).forEach((r, i) => {
  const p = `entry[${i}]`;
  if (!Number.isInteger(r?.day)) errors.push({ code: 'invalid_day', msg: `${p}.day must be integer` });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(r?.date || ''))) errors.push({ code: 'invalid_date', msg: `${p}.date must be YYYY-MM-DD` });
  if (typeof r?.title !== 'string' || !r.title.trim()) errors.push({ code: 'invalid_title', msg: `${p}.title required` });
  if (typeof r?.summary !== 'string' || r.summary.trim().length < 40) errors.push({ code: 'invalid_summary', msg: `${p}.summary too short` });

  const date = String(r?.date || '');
  if (seenDates.has(date)) errors.push({ code: 'duplicate_date', msg: `${p}.date duplicate ${date}` });
  seenDates.add(date);

  if (Number.isInteger(r?.day)) {
    if (r.day > prevDay) errors.push({ code: 'non_monotonic_day', msg: `${p}.day should be descending` });
    prevDay = r.day;
  }

  if (r?.summary && /\b(TBD|lorem ipsum|placeholder)\b/i.test(r.summary)) {
    errors.push({ code: 'placeholder_summary', msg: `${p}.summary contains placeholder text` });
  }

  if (r?.links !== undefined && !Array.isArray(r.links)) {
    errors.push({ code: 'invalid_links', msg: `${p}.links must be array` });
  } else {
    (r?.links || []).forEach((l, j) => {
      if (typeof l?.label !== 'string' || !l.label.trim()) errors.push({ code: 'invalid_link_label', msg: `${p}.links[${j}].label required` });
      if (typeof l?.href !== 'string' || !(/^(https?:\/\/|\/)/i.test(l.href))) errors.push({ code: 'invalid_link_href', msg: `${p}.links[${j}].href must be absolute or site-relative URL` });
    });
  }
});

if (errors.length) fail(errors);
console.log(JSON.stringify({ ok: true, entries: rows.length }, null, 2));
