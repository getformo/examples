# Formo + Crossmint Example

This example demonstrates how to integrate the [Formo Analytics SDK](https://formo.so/) with [Crossmint](https://www.crossmint.com/products/wallet-infrastructure) embedded wallets.

It is based on the [Crossmint Wallets Quickstart](https://github.com/Crossmint/wallets-quickstart) and adds Formo for wallet-event analytics.

## Why this example is different

Crossmint embedded wallets are **smart wallets** created from an email or Google login. Unlike browser-extension wallets (MetaMask) or wagmi-based integrations (Privy, Openfort), they expose **no `window.ethereum` provider and no wagmi config**. That means Formo's automatic wallet-event capture has nothing to hook into.

So this example instruments **every wallet event manually** with Formo's event API — which is exactly the pattern you need for any embedded / smart-contract wallet:

- `formo.identify()` / `formo.connect()` when the wallet is ready
- `formo.disconnect()` on logout
- `formo.signature()` around a message signing
- `formo.transaction()` around a transfer
- `formo.track()` for custom events

Compare this with [`with-openfort`](../with-openfort) and [`with-privy`](../with-privy), where Openfort/Privy bridge their wallets into wagmi and Formo auto-captures those events for you.

## Features

- **Crossmint Embedded Wallets**: Passwordless smart wallets created via email or Google login
- **USDXM transfers**: Send Crossmint's test stablecoin on Base Sepolia
- **Manual Formo instrumentation**: Every wallet event wired by hand — the core of this example
- **Formo Event Tester**: A UI panel to trigger `signature` and `track` events on demand
- **Gas sponsored by Crossmint**: Transactions are gasless — no testnet ETH required

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/) + [Tailwind CSS](https://tailwindcss.com/)
- [@crossmint/client-sdk-react-ui](https://docs.crossmint.com/wallets/quickstarts/react) — embedded wallets
- [@formo/analytics](https://docs.formo.so/) — web3 analytics

## Project Structure

```
with-crossmint/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page / dashboard switch
│   └── providers.tsx           # Crossmint + Formo providers
├── components/
│   ├── formo-bridge.tsx        # Emits identify / connect / disconnect
│   ├── formo-event-tester.tsx  # Emits signature / track on demand
│   ├── transfer.tsx            # Emits transaction / track on a transfer
│   ├── dashboard.tsx           # Wallet dashboard
│   └── ...                     # balance, activity, landing-page, etc.
└── lib/
    └── chain.ts                # Base Sepolia chain ID for Formo events
```

## Prerequisites

1. **Crossmint account**: Create a project at the [Crossmint Dashboard](https://www.crossmint.com/console) and create a **client-side API key**. It needs these scopes:
   `users.create`, `users.read`, `wallets.read`, `wallets.create`, `wallets:transactions.create`, `wallets:transactions.sign`, `wallets:balance.read`, `wallets.fund`.
2. **Formo account**: Get your write key at [app.formo.so](https://app.formo.so).

> No crypto wallet or testnet tokens are required — the embedded wallet is created on login, USDXM is funded in-app, and Crossmint sponsors gas.

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/getformo/examples.git
cd examples/with-crossmint
```

### 2. Configure environment variables

```bash
cp .env.example .env   # then add your keys
```

### 3. Install and run

```bash
pnpm install
pnpm dev               # runs on http://localhost:3000
```

Visit `http://localhost:3000`, log in with email or Google, and a wallet is created for you.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CROSSMINT_API_KEY` | Crossmint client-side API key (see scopes above) | Yes |
| `NEXT_PUBLIC_CHAIN` | Chain the wallet is created on (`base-sepolia`) | Yes |
| `NEXT_PUBLIC_FORMO_WRITE_KEY` | Your Formo Analytics write key | No* |

\* If `NEXT_PUBLIC_FORMO_WRITE_KEY` is omitted the app still runs, just without analytics.

> **Changing the chain?** Update `NEXT_PUBLIC_CHAIN` **and** the `CHAIN_ID` in [`lib/chain.ts`](./lib/chain.ts) — Formo events need the numeric EVM chain ID.

## How It Works

### Provider setup (`app/providers.tsx`)

`FormoAnalyticsProvider` wraps the Crossmint providers. Because the embedded
wallet has no `window.ethereum` and no wagmi config, autocapture is turned
**off** — every wallet event is emitted by hand:

```tsx
<FormoAnalyticsProvider
  writeKey={formoWriteKey}
  options={{
    autocapture: false, // no wagmi / EIP-1193 — events are emitted manually
    evm: false,         // don't wrap an unrelated injected wallet
    tracking: true,     // track on localhost too
    logger: { enabled: true, levels: ["info", "warn", "error"] },
  }}
>
```

### Events in this example

This example covers every event type in the [Formo events spec](https://docs.formo.so/data/events/overview).

| Event | How it's tracked | Where |
|-------|------------------|-------|
| `page` | Automatic on page load | — |
| `identify` | Manual — on wallet ready, with the wallet address + Crossmint user id | `components/formo-bridge.tsx` |
| `connect` | Manual — on login when the embedded wallet is ready | `components/formo-bridge.tsx` |
| `disconnect` | Manual — on logout | `components/formo-bridge.tsx` |
| `signature` | Manual — around `wallet.signMessage()` | `components/formo-event-tester.tsx` |
| `transaction` | Manual — around `wallet.send()` (`started` → `broadcasted` / `rejected`) | `components/transfer.tsx` |
| `track` | Manual — `crossmint_transfer` + `event_tester_clicked` | `components/transfer.tsx`, `components/formo-event-tester.tsx` |
| `chain` | **N/A** — Crossmint embedded wallets are single-chain (fixed at `createOnLogin`); there is no network switch to capture | — |
| `detect` | **N/A** — `detect` identifies an injected wallet provider; a smart wallet exposes none | — |

### Lifecycle events (`components/formo-bridge.tsx`)

`FormoCrossmintBridge` is a render-less component mounted inside the providers.
It watches Crossmint's `useWallet()` and `useCrossmintAuth()` and emits
`identify` + `connect` once the wallet is ready, and `disconnect` on logout.

### Transaction events (`components/transfer.tsx`)

The Transfer card wraps `wallet.send(...)` with `formo.transaction()` calls
(`started` before, `broadcasted` with the tx hash after, `rejected` on error)
plus a custom `formo.track("crossmint_transfer", ...)` event.

### Event Tester (`components/formo-event-tester.tsx`)

A panel with buttons to fire events on demand:

- **Sign message** → `signature` event — signs a message with the embedded wallet (free, no gas).
- **Track custom event** → `track` event.

## Verifying it works

With the SDK logger enabled you'll see events in the browser console, and they
appear in your [Formo dashboard](https://app.formo.so):

1. Log in → `page`, `identify`, `connect`.
2. Add money (USDXM) then run a transfer → `transaction` + `crossmint_transfer`.
3. Event Tester → `signature`, `track`.
4. Log out → `disconnect`.

## Resources

- [Formo Documentation](https://docs.formo.so)
- [Formo SDK Installation](https://docs.formo.so/sdks/web#installation)
- [Formo Events Overview](https://docs.formo.so/data/events/overview)
- [Crossmint Wallets Documentation](https://docs.crossmint.com/wallets/quickstarts/react)
- [Crossmint Wallets Quickstart (base template)](https://github.com/Crossmint/wallets-quickstart)

## License

MIT
