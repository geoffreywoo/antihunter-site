# antihunter.com

Astro 7 + Tailwind 4 website for Anti Hunter. Use Node 22.12 or newer in the Node 22 release line.

## Dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
npm test
```

## Canonical voice (required)

All public copy must follow the unified Anti Hunter persona/voice file. Before editing homepage or public copy, read `VOICE.md` first.

## Deploy (Vercel)

1) Push this repo to GitHub.
2) Import into Vercel.
3) Set the project domain to `antihunter.com`.
4) Update DNS per Vercel instructions.


## Treasury data

`/api/treasury.json` and `/treasury.snapshot.json` serve the same published
snapshot used by the dashboard. The API is prerendered at build time and performs
no request-time blockchain scan. Read `updatedAt` / `updatedAtMs` for freshness;
opening the endpoint (including `?refresh=1`) does not trigger an update.

The Treasury snapshot GitHub workflow is scheduled twice daily and can also be
run manually. It generates and validates the snapshot, then commits it for a new
deployment. Failed or delayed jobs leave the previous timestamped data in place.

API migration: the former live endpoint returned a `positions` array. It now
uses the dashboard snapshot schema (`rows`, `totalUsd`, `wallets`, and timestamps).
Consumers must use `rows`; live scan details such as `lastScannedBlock` are no
longer part of this endpoint. Accounting calculations remain in the snapshot job.

## The $30 Machine

`/machine` is a browser-only cost calculator. Its five assumptions never enter
application telemetry. Scenario sharing is opt-in and uses a URL fragment;
downloaded PNG receipts label the numbers as user assumptions. Arithmetic and
scenario-validation tests run with `npm test`.

Editorial episodes live in `src/data/episodes.ts`, separately from the historical
automatic changelog. `/acts`, `/canon`, `/pilgrimage`, and `/token` are prerendered.
Artwork can be regenerated with `node scripts/generate-growth-art.mjs`.
All future result claims require evidence; the opening comparison is explicitly
a protocol announcement until a measured trial replaces it.

### Analytics controls

Native Vercel Web Analytics runs only on the production domain, and only with a
fresh, allowlisted Clawfable control response. It tracks page views and four
events: `experience_view`, `experience_complete`, `share_intent`, and
`token_info_view`, with campaign and episode properties. It strips the current
URL query/fragment; Vercel may also collect referring origins/URLs according to
browser referrer policy. Sharing intent is not evidence of a completed share.

On the designated Mini, `node scripts/refresh-growth-analytics.mjs` queries native
production aggregates and stores an observation through the Clawfable operator.
`--dry-run` prints the observation without saving it. This runs each 30-minute
cycle. Below $0.50 estimated daily collection cost, sampling is 100%; at $0.50
it becomes 10%; at $0.80 it stops. Missing or 90-minute-old observations stop
collection. Midnight uses America/Los_Angeles, including DST. Counts are sampled,
provider reporting can lag, and these controls are not an invoice guarantee.
No public event collector or new database is introduced.

Dependency overrides pin patched compatible `path-to-regexp` and `esbuild`
versions while their upstream packages still request vulnerable releases.
