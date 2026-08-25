# Real MetaMask (layer 3)

Drives a real MetaMask extension against the published `@formo/analytics`.
The harness lives in this repository, so none of its browser dependencies can
enter an SDK release.

## Compatibility boundary

Synpress 4.1.2 now resolves MetaMask 13.13.1, but that combination has known
onboarding and notification-selector regressions. The harness therefore pins
Synpress's internal packages to 0.0.13 and runs their compatible MetaMask
11.9.1 build on Chrome 130. Playwright itself remains at security-patched
1.55.1.

Each test creates and destroys a fresh browser profile instead of copying a
wallet cache. `prepare-metamask.mjs` downloads the exact official release and
rejects it unless its SHA-256 matches the checked-in digest.

## Security

- `pnpm audit --audit-level=high` is a required CI step.
- Lifecycle scripts are disabled except for `esbuild`'s platform-binary
  installer; see `pnpm-workspace.yaml`.
- Chrome background networking is disabled. The tested RPC and transaction
  use only Anvil on `127.0.0.1`.
- The seed phrase is the public Hardhat/Anvil mnemonic and the browser profile
  is disposable. Never replace it with a real phrase.
- Analytics events are intercepted in-page and never leave the harness.

## Run locally

Install Chrome 130 and set `CHROME_PATH` to its executable, then run:

```sh
anvil --port 8545 --chain-id 31337 &
pnpm install
node prepare-metamask.mjs
CHROME_PATH=/path/to/chrome-130 \
  SDK_DIR=/path/to/node_modules/@formo/analytics \
  HEADLESS=1 \
  pnpm test
```
