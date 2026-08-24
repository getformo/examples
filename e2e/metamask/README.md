# Real MetaMask (layer 3) — scaffolded, not yet green

Drives a **real MetaMask extension** against the **published** `@formo/analytics`
with Synpress. It lives in this repo, not the SDK's, so its dependency tree can
never influence a release.

## Status

Installs, builds the wallet cache, launches the extension, and the SDK discovers
it over EIP-6963. **But `eth_requestAccounts` never opens the MetaMask prompt**
under Synpress 4.1.2 with the MetaMask build it bundles — headful or headless,
through the SDK wrapper or the raw provider. The `addNetwork` helper also broke
on a stale selector. This is Synpress/MetaMask UI drift, not the SDK.

Unblocking it is a version decision (newer Synpress, or a pinned older
MetaMask) that should be made deliberately rather than guessed at in CI. Until
then this job is `continue-on-error` and informational.

## Supply chain

- Every dependency installs with lifecycle scripts **disabled** except
  `esbuild` (it fetches its platform binary). See `pnpm-workspace.yaml`.
- The seed phrase is the public Hardhat/anvil test mnemonic. It controls
  nothing anywhere but a local dev chain. **Never replace it with a real one.**
- Events are intercepted in-page and never leave the machine.

## Run

```
anvil --port 8545 --chain-id 31337 &
pnpm install && npx playwright install chromium
npx synpress wallet-setup
SDK_DIR=/path/to/node_modules/@formo/analytics HEADLESS=1 npx playwright test
```
