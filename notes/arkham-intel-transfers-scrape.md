# Arkham Intel — Transfers/Inflow/Outflow scrape (no API key)

Source UI:
- https://intel.arkm.com/explorer/address/0xa668DDf22a4C0Ecbb31c89b16f355B26AE7703c3

We scrape the **TRANSFERS** module (tabs: `TRANSFERS`, `INFLOW`, `OUTFLOW`) and page through the visible pages (currently `1 / 4`).

## Why
Arkham annotates each movement with a **USD value**. We use these rows as receipts to override parts of cost basis math and reduce reliance on spot-price estimates.

## Artifact
- `public/treasury.arkham.transfers.json`

Shape:
```json
{
  "updatedAt": "ISO",
  "updatedAtMs": 0,
  "source": "https://intel.arkm.com/explorer/address/<addr>",
  "address": "0x...",
  "pages": {"transfers": 4, "inflow": 4, "outflow": 4},
  "rows": [
    {"tab":"transfers|inflow|outflow", "page": 1, "txHash": "0x...", "summary": "..."}
  ]
}
```

## Caching / dedupe
- Dedupe key: `(txHash, tab)`.
- Future runs should only append rows not already present.
- Stop early when a page yields 100% already-cached txHashes.

## Limitations
- UI/DOM is fragile; selectors may break.
- `summary` is a normalized text line; it is not a fully structured schema.
- If Arkham changes the pagination control, we may have to rework navigation.
