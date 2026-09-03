# Formo + Solana (framework-kit)

A Next.js app demonstrating the [Formo Analytics SDK](https://github.com/getformo/sdk) on Solana with [framework-kit](https://github.com/solana-foundation/framework-kit) (`@solana/client` + `@solana/react-hooks`).

> **Which Solana library does this cover?**
>
> This example uses **framework-kit**, not `@solana/wallet-adapter`. The SDK passes framework-kit's `client.store` in `options.solana.store`, so wallet and cluster changes are read from that store. The React transaction hooks used by the demos keep their state outside the store, so the demos report transaction events explicitly with `formo.transaction()`.
>
> Wallet `detect`, `connect`, and `disconnect` events do not need any of that. Since `@formo/analytics` 1.39.0 the SDK discovers Solana wallets through the [Wallet Standard](https://github.com/wallet-standard/wallet-standard), so they are autocaptured for `@solana/wallet-adapter`, Privy, Dynamic, Reown, and custom integrations too, with only `<FormoAnalyticsProvider writeKey=... />`. See the [Solana integration docs](https://docs.formo.so/sdks/web#solana-integration).

## Features

- **Modern UI**: Next.js 15 App Router, Tailwind CSS, and shadcn/ui components
- **Wallet discovery**: every Wallet Standard wallet on the page (Phantom, Solflare, Backpack, ...) via framework-kit's `autoDiscover()`
- **Network switching**: devnet and mainnet
- **Theme support**: dark/light mode with system detection
- **Demos**: send a legacy transaction, send a versioned (V0) transaction, fire custom events

## Formo SDK events

| Event | Source | Trigger |
|-------|--------|---------|
| `detect` | Wallet Standard discovery | A wallet registers with the page |
| `connect` | framework-kit store | Wallet connects, or a session is restored on load |
| `disconnect` | framework-kit store | Wallet disconnects |
| `chain` | framework-kit store | Cluster switches (detected from the RPC endpoint) |
| `transaction` started / confirmed / rejected | explicit | The demos call `formo.transaction()` around framework-kit's React transaction hooks |
| `track` | explicit | Custom events from the demos |

Signatures (`signMessage`, `signTransaction`) are not autocaptured on any Solana path; call `formo.signature()` yourself.

## Quick start

### Prerequisites

- Node.js 18+
- A Solana wallet browser extension (Phantom recommended)
- A Formo write key from [app.formo.so](https://app.formo.so)

### Installation

```bash
git clone https://github.com/getformo/examples.git
cd examples/with-solana

pnpm install

cp .env.example .env
# Edit .env and add your Formo write key

pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

Create a `.env` file with the following variables:

```env
# Required: Your Formo Analytics write key
NEXT_PUBLIC_FORMO_WRITE_KEY=your_write_key_here

# Optional: Custom Solana RPC endpoint (defaults to the public endpoint for the cluster)
# NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Optional: Solana cluster (devnet, mainnet-beta)
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
```

## How the SDK is wired

`src/app/providers.tsx` passes framework-kit's store to the SDK:

```tsx
<SolanaProvider client={client}>
  <FormoAnalyticsProvider
    writeKey={process.env.NEXT_PUBLIC_FORMO_WRITE_KEY!}
    options={{
      evm: false, // Solana-only app: skip EIP-1193 / EIP-6963 discovery
      solana: { store: client.store },
    }}
  >
    {children}
  </FormoAnalyticsProvider>
</SolanaProvider>
```

The SDK subscribes to the store as a read-only observer. It never wraps wallet methods. Transactions recorded in the store can be autocaptured, but the React hooks used in this example manage transaction state locally, so `SendTransaction.tsx` and `SendVersionedTransaction.tsx` emit their lifecycle explicitly.

## Testing with a local SDK build

```bash
# In the SDK repository
pnpm build
pnpm link --global

# In this directory
pnpm link --global @formo/analytics
pnpm dev
```

## Testing checklist

### Wallet events
- [ ] Load the page with a wallet installed → `detect`
- [ ] Connect → `connect`
- [ ] Disconnect → `disconnect`
- [ ] Switch wallets → `disconnect` then `connect`
- [ ] Reload with auto-connect → `connect`
- [ ] Switch network → `chain`

### Transaction events
- [ ] Send a legacy transaction → started, broadcasted, confirmed
- [ ] Send a versioned (V0) transaction → started, broadcasted, confirmed
- [ ] Reject in the wallet → rejected
- [ ] Transaction fails on-chain → reverted

## Project structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Demo page with tabs
│   ├── providers.tsx       # SolanaProvider + FormoAnalyticsProvider
│   └── globals.css
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Header, Footer, ThemeToggle
│   ├── wallet/             # WalletButton, NetworkSwitcher
│   ├── demos/              # SendTransaction, SendVersionedTransaction, CustomEvents
│   ├── FormoStatus.tsx     # SDK status indicator
│   └── WalletInfo.tsx      # Connected wallet details
├── hooks/
│   └── useCurrentCluster.ts # Cluster and Formo chain id from the live endpoint
└── lib/
    ├── solana.ts           # framework-kit client, cluster helpers
    └── utils.ts
```

## Tech stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Solana**: `@solana/kit`, `@solana/client`, `@solana/react-hooks`, `@solana-program/system`
- **Analytics**: `@formo/analytics`
- **Theme**: next-themes
- **Notifications**: Sonner

## Related links

- [Formo SDK repository](https://github.com/getformo/sdk)
- [Formo Solana integration docs](https://docs.formo.so/sdks/web#solana-integration)
- [framework-kit](https://github.com/solana-foundation/framework-kit)
- [Wallet Standard](https://github.com/wallet-standard/wallet-standard)
- [Solana Kit](https://github.com/anza-xyz/kit)

## License

MIT
