# Formo + WalletConnect (plain EIP-1193)

WalletConnect and Ledger providers are **constructed** by the app, so the
SDK's wallet discovery (EIP-6963 announcements plus `window.ethereum`) can
never see them. Before `@formo/analytics` 1.38.0 that meant a whole
WalletConnect session produced no analytics at all: no connect, no
signatures, no transactions, silently.

This example shows the fix, which is one line:

```ts
const provider = await EthereumProvider.init({ projectId, chains });
formo.registerProvider(provider);
```

- Call it as soon as the provider exists. Order does not matter: a session
  that already exists at registration is adopted on the spot, with no RPC
  ever issued on the wallet transport.
- Events name the **real wallet behind the transport** (Ledger Live,
  MetaMask Mobile, Safe, ...) from the session's peer metadata, resolved
  live per event - so a session swap renames correctly.
- The call returns `false` when it refuses: in wagmi mode (connectors are
  already tracked there; use the wagmi integration instead), when EVM
  tracking is disabled, or when the object is not a valid provider.

## Run it

```sh
cp .env.example .env   # fill in both values
pnpm install
pnpm dev               # http://localhost:3004
```

- `VITE_WC_PROJECT_ID`: a WalletConnect Cloud project id (free at
  https://cloud.reown.com).
- `VITE_FORMO_WRITE_KEY`: your Formo write key. With a placeholder key the
  ingestion API answers 403, but the event payloads in the network tab show
  exactly what would be recorded.

The demo pins **Sepolia**; the transaction button sends 0 ETH to yourself.

## When you do NOT need this

If your app uses wagmi (RainbowKit, ConnectKit, AppKit, Privy, and most
React dapps), WalletConnect sessions are already tracked through the wagmi
integration - `registerProvider` refuses there on purpose, because wrapping
the same provider twice would double-report. This API exists for apps that
drive `@walletconnect/ethereum-provider` (or any constructed EIP-1193
provider) directly.
