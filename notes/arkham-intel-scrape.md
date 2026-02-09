# Arkham Intel ALL TX scrape (treasury)

This repo optionally consumes a best-effort scrape of Arkham Intel’s **ALL TX** table for the Anti Hunter treasury address:

- https://intel.arkm.com/explorer/address/0xa668DDf22a4C0Ecbb31c89b16f355B26AE7703c3

## Output artifact

Nightly automation writes:

- `public/treasury.arkham.alltx.json`

Schema (loosely):

```json
{
  "updatedAt": "...",
  "updatedAtMs": 0,
  "source": "arkham-intel",
  "address": "0x…",
  "view": "ALL_TX",
  "txs": [
    {
      "timestamp": "…",
      "timestampMs": 0,
      "from": "0x…",
      "to": "0x…",
      "token": "WETH",
      "amount": "-0.123",
      "usd": "-$456.78",
      "txHash": "0x…"
    }
  ]
}
```

## How it is used

`scripts/update-treasury-snapshot.ts` will **optionally** override `lot.costBasisUsd` when:

- Arkham shows a **USD outflow** in the same `txHash` from the treasury wallet
- The outflow token is **WETH** or **ANTIHUNTER**
- The `txHash` maps unambiguously to a single token row’s lots in `treasury.snapshot.json`

When those conditions are met, the total USD outflow is allocated across that row’s lots in the tx **pro-rata by lot qty**.

## Limitations / fragility

- Arkham is a third-party UI: selectors/tabs can change without notice.
- Some tx rows may not include a tx hash in the table view; those cannot be joined.
- USD values are Arkham’s estimates (timing/pricing model may differ from DEX execution).
- Multi-asset txs are intentionally skipped for cost-basis override to avoid double-counting.
- The scrape is best-effort: on failure, the site still builds and uses the on-chain log-derived method.
