# Real wallets in a browser

Drives real wallets against the published `@formo/analytics`. The harness
lives in this repository, so none of its browser dependencies can enter an SDK
release.

Two kinds of test live here:

- `real-metamask.spec.ts` drives a real MetaMask extension against a harness
  page of our own, so the SDK is the only thing under test.
- `example-*.spec.ts` drive the **example apps** through their own UI, with the
  SDK configured the way each app configures it. `with-next-app-router` uses
  the real extension; the two Solana apps use a Wallet Standard wallet
  registered in the page (`solana-wallet.ts`), which is how Phantom and
  Solflare register themselves. The apps must already be served: see the
  ports in each spec, or the `sdk-e2e` workflow, which builds and serves them.

## Compatibility boundary

The harness pins Synpress's internal packages to 0.0.13 and runs their
compatible MetaMask 11.9.1 build on Chrome 130. Playwright itself remains at
security-patched 1.55.1.

Newer is not available, and the reason is worth writing down, because it also
says which examples this layer can cover. Synpress 0.0.14 targets MetaMask
13.13.1, which is Manifest V3. Tried on 2026-09-10:

- Onboarding needs one extra step. MetaMask 13 ends on a "Your wallet is
  ready!" screen with an "Open wallet" button that Synpress never clicks, so
  the wallet stays locked and every prompt redirects to unlock. Clicking it,
  once it is enabled, fixes that half.
- The confirmations never appear. With the wallet unlocked and the extension
  discovered over EIP-6963, `eth_requestAccounts` hangs and no notification
  window opens. Reproduced on Chrome 130 and on Chrome for Testing 153, with
  and without `--disable-background-networking`, with the extension's own tab
  open and parked. Service workers were running in both cases.

`with-metamask` therefore cannot be covered here: its `metaMask()` connector
(wagmi connectors 8, `@metamask/connect-evm`) does not resolve against
MetaMask 11.9.1, and MetaMask 13 does not surface confirmations under
automation. The example itself is fine, and was confirmed by hand against a
current MetaMask.

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
  pnpm test
```

To run one of the example-app specs, build and serve that example first, then
point the spec at it:

```sh
(cd ../../with-solana && NEXT_PUBLIC_FORMO_WRITE_KEY=e2e-write-key pnpm build && pnpm start -p 3008 &)
CHROME_PATH=/path/to/chrome \
  SDK_DIR=/path/to/node_modules/@formo/analytics \
  SOLANA_EXAMPLE_URL=http://127.0.0.1:3008 \
  pnpm exec playwright test tests/example-with-solana.spec.ts
```

The extension must run in headed mode because Chrome 130 does not reliably
create extension notification windows in headless mode. CI supplies an
isolated virtual display with `xvfb-run`; a local run uses the normal desktop
display.
