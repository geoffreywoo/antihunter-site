# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Local dev server with hot reload
npm run build            # Production build (SSR via Vercel adapter)
npm run preview          # Preview production build locally

npm run treasury:snapshot   # Generate treasury snapshot (requires RPC env vars)
npm run treasury:validate   # Validate treasury snapshot schema
npm run changelog:nightly   # Regenerate changelog.json from git log
npm run changelog:validate  # Validate changelog JSON structure
npm run winners:sync        # Sync pilgrimage winners from external store
```

`npm test` uses the Node test runner through tsx for calculator arithmetic,
scenario validation, and analytics admission. CI runs tests, `build`,
`treasury:validate`, and a link check (Lychee) via `.github/workflows/qa.yml`.

## Architecture

**Astro 7 site** deployed on Vercel, using Node 22. Tailwind CSS 4 for styling (via `@tailwindcss/vite` plugin). Growth pages and the calculator are prerendered; the calculator computes and renders receipts in the browser. Existing treasury pages retain their rendering behavior.

### Treasury System (`src/lib/treasury/`)

The core feature — transparent on-chain treasury with FIFO cost-basis accounting:

- **baseTreasury.ts**: Scans ERC20 Transfer logs from a start block, groups by tx hash, infers cost basis by matching token flows with WETH/ETH/ANTIHUNTER flows in the same transaction. Supports incremental scanning (tracks `lastScannedBlock`).
- **rpc.ts**: JSON-RPC client with multi-endpoint fallback, rate-limit detection, exponential backoff, and block range bisection for oversized log responses.
- **dexscreener.ts**: Token price fetching via DexScreener API (best Base pair by liquidity).
- **state.ts**: Cache state management. Persists to `.astro/treasury/cache.base.json`.
- **abi.ts**: Minimal ERC20 ABI encoding/decoding (no ethers.js dependency).

Data flows: RPC logs → cost-basis inference → snapshot JSON → API endpoint (`/api/treasury.json`) and static file (`public/treasury.snapshot.json`).

### Data Layer (`src/data/`)

- **changelog.json**: Historical automatic commit rollups. Kept separate from current editorial stories.
- **episodes.ts**: Current /acts episodes, factual status labels, evidence, and canon artwork metadata. Homepage features these stories.
- **roadmap.ts**: Roadmap phases and items.
- **sigil-winners.json**: Pilgrimage winner records.

### Pages (`src/pages/`)

Astro file-based routing. Dynamic route at `/acts/[date].astro`. Prerendered snapshot API at `src/pages/api/treasury.json.ts`; it serves the same dated `rows` schema as the public snapshot, without request-time RPC calls. Treasury dashboard (`treasury.astro`) fetches snapshot client-side with inline `<script>`.

### Key Environment Variables

Treasury scripts need RPC access:
- `BASE_RPC_URL` / `BASE_RPC`: Base chain RPC endpoint(s)
- `ETHEREUM_RPC_URL` / `ETH_RPC_URL`: Ethereum mainnet RPC
- `TREASURY_WALLETS`: Comma-separated wallet addresses (default: hardcoded primary + hard wallet)
- `TREASURY_START_BLOCK`: Log scanning start block (default: 41805000)

## Voice & Copy

All public-facing copy must match the Anti Hunter persona defined in `VOICE.md`. Read it before editing any user-visible text. See `CONTRIBUTING.md` for the PR checklist.
