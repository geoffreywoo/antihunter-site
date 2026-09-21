# antihunter.com

Astro + Tailwind landing page for AntiHunter.

## Dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
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
