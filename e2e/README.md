# SDK end-to-end

Three layers. Each installs the **published** `@formo/analytics` the way a
consumer does, so nothing here can influence what gets released.

| Layer | What it proves | Status |
|---|---|---|
| `sweep.mjs` | **Compatibility.** Against each example's **own** wagmi/viem versions, the SDK emits exactly one event per action | green, 12 examples |
| `behaviours.mjs` + `scenarios.mjs` | **Behaviour.** 26 named scenarios covering every autocaptured event, every `tracking` and `autocapture` option, the public API (`identify`, `track`, `page`), consent, `reset`, cookie restore, and the regressions from 1.35.x by issue number | green on main and 1.35.2; **fails 7 rows on 1.35.1**, exactly the bugs that release had |
| `browser/` | A real browser running the real bundle, wallets announced over **EIP-6963**, real anvil receipts, exact event lists | green; **fails 4 checks on 1.35.2**, which is the point |
| `metamask/` | A real MetaMask extension via Synpress | scaffolded, blocked on Synpress/MetaMask UI drift |

```
pnpm install
mkdir -p /tmp/sdk && (cd /tmp/sdk && npm init -y && npm i @formo/analytics@latest react react-dom @tanstack/react-query viem wagmi)
node sweep.mjs /tmp/sdk/node_modules/@formo/analytics
node behaviours.mjs /tmp/sdk/node_modules/@formo/analytics      # add a filter word to run a subset
anvil --port 8545 --chain-id 31337 &
node browser/run.mjs /tmp/sdk/node_modules/@formo/analytics
```

The first run of the browser layer against the published 1.35.2 showed
`sign (A)`, `reject sign (A)` and `sign on B` all returning `[]`: every
`personal_sign` in every real browser was being dropped, because the message
was decoded with Node's `Buffer`. No Node-based test can see that. 1.36.0
fixes it, and this layer is what proves it.
