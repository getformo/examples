# Formo + Openfort Example

This example demonstrates how to integrate the [Formo Analytics SDK](https://formo.so/) with [Openfort](https://www.openfort.io/) embedded wallets (Shield) and the [Aave](https://aave.com/) lending protocol.

It is based on the [Openfort Aave recipe](https://www.openfort.io/docs/recipes/aave) and adds Formo for automatic wallet-event analytics plus custom event tracking on Aave supply/withdraw actions.

## Features

- **Openfort Embedded Wallets**: Passwordless wallet creation and recovery powered by Openfort Shield
- **Aave Lending**: Supply and withdraw USDC to/from an Aave market
- **Formo Analytics with Wagmi**: Automatic tracking of wallet events via Openfort's wagmi bridge
- **All Formo event types**: `page`, `connect`, `disconnect`, `chain`, `signature`, `transaction`, `identify` and `track`
- **Formo Event Tester**: A UI panel to trigger `signature`, `transaction` and `track` events on demand
- **Custom Event Tracking**: `aave_supply` / `aave_withdraw` events tracked on successful Aave transactions
- **Sponsored Transactions**: Optional gas sponsorship via Openfort fee policies

## Tech Stack

- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) - UI framework and build tool
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [wagmi v2](https://wagmi.sh/) + [viem](https://viem.sh/) - Ethereum React hooks
- [@openfort/react](https://www.openfort.io/docs) - Embedded wallets and Shield
- [@aave/react](https://aave.com/docs) - Aave protocol interactions
- [Express](https://expressjs.com/) - Backend that mints Shield encryption sessions
- [Formo SDK 1.30.0](https://docs.formo.so/) - Web3 analytics

## Project Structure

```
with-openfort/
├── frontend/                   # Vite + React app
│   ├── src/
│   │   ├── components/         # UI cards, buttons, env validation
│   │   ├── hooks/              # useAaveOperations (custom Formo events here)
│   │   ├── lib/                # Aave client + helpers
│   │   ├── App.tsx             # Main demo screen
│   │   ├── Providers.tsx       # wagmi, Formo, Openfort & Aave providers
│   │   └── main.tsx            # Entry point
│   └── .env.example
└── backend/                    # Express server
    ├── src/app.ts              # POST /api/protected-create-encryption-session
    └── .env.example
```

## Prerequisites

1. **A crypto wallet** (e.g. [MetaMask](https://metamask.io/)) for wallet recovery
2. **Base Sepolia testnet tokens** for testing Aave transactions — get them from a [faucet](https://faucets.chain.link/base-sepolia)
3. **Openfort account**: Create a project at the [Openfort Dashboard](https://dashboard.openfort.io) and grab your Publishable Key, Secret Key, and Shield keys
4. **Formo account**: Get your write key at [app.formo.so](https://app.formo.so)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/getformo/examples.git
cd examples/with-openfort
```

### 2. Start the backend

The frontend needs a backend to create Openfort Shield encryption sessions.

```bash
cd backend
cp .env.example .env   # add your Openfort Secret Key and Shield keys
pnpm install
pnpm dev               # runs on http://localhost:3000
```

### 3. Start the frontend

In a separate terminal:

```bash
cd frontend
cp .env.example .env   # add your Openfort + Formo keys
pnpm install
pnpm dev               # runs on http://localhost:5173
```

Visit `http://localhost:5173` to see the app.

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_OPENFORT_PUBLISHABLE_KEY` | Openfort project publishable key (`pk_...`) | Yes |
| `VITE_OPENFORT_SHIELD_PUBLISHABLE_KEY` | Openfort Shield publishable key | Yes |
| `VITE_BACKEND_URL` | URL of the backend server | Yes |
| `VITE_FORMO_WRITE_KEY` | Your Formo Analytics write key | Yes |
| `VITE_OPENFORT_FEE_SPONSORSHIP_ID` | Fee sponsorship policy ID (`pol_...`) | No |
| `VITE_WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID | No |

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENFORT_SECRET_KEY` | Openfort project secret key (`sk_...`) | Yes |
| `SHIELD_API_KEY` | Openfort Shield API key | Yes |
| `SHIELD_SECRET_KEY` | Openfort Shield secret key | Yes |
| `SHIELD_ENCRYPTION_SHARE` | Openfort Shield encryption share | Yes |
| `PORT` | Port the backend listens on (defaults to `3000`) | No |

## How It Works

### Provider Setup (`frontend/src/Providers.tsx`)

The app nests providers so Formo can observe the wagmi config that Openfort drives:

```tsx
<QueryClientProvider client={queryClient}>
  <WagmiProvider config={wagmiConfig}>
    <FormoAnalyticsProvider ...>      {/* Formo analytics */}
      <OpenfortWagmiBridge>           {/* Syncs Openfort wallet state into wagmi */}
        <AaveProvider client={aaveClient}>
          <OpenfortProvider ...>      {/* Openfort embedded wallets / Shield */}
            <App />
          </OpenfortProvider>
        </AaveProvider>
      </OpenfortWagmiBridge>
    </FormoAnalyticsProvider>
  </WagmiProvider>
</QueryClientProvider>
```

### Formo Wagmi Integration

`FormoAnalyticsProvider` is given the wagmi config and React Query client so it can
auto-capture wallet events. Because `OpenfortWagmiBridge` syncs the Openfort embedded
wallet into wagmi, no additional wiring is needed:

```tsx
<FormoAnalyticsProvider
  writeKey={import.meta.env.VITE_FORMO_WRITE_KEY}
  options={{
    wagmi: {
      config: wagmiConfig,
      queryClient,        // required for signature/transaction tracking
    },
    autocapture: true,    // capture every wallet event type
    tracking: true,       // track on localhost too (off by default)
    logger: { enabled: true, levels: ["info", "warn", "error"] },
  }}
>
```

> `autocapture` also accepts an object (e.g. `{ chain: false }`) if you ever
> want to disable a specific wallet event.

### Events tracked in this example

This example exercises every Formo event type.

| Event | How it's tracked | Where |
|-------|------------------|-------|
| `page` | Automatic on page load | — |
| `connect` | Autocaptured on wallet connect | Openfort Connect button |
| `disconnect` | Autocaptured on wallet disconnect | Openfort Connect button |
| `chain` | Autocaptured on network switch | Wallet network change |
| `identify` | Manual — fires on connect with the wallet address | `App.tsx` |
| `signature` | Autocaptured from a wagmi `signMessage` call | Event Tester |
| `transaction` | Autocaptured from a wagmi `sendTransaction` call | Event Tester / Aave actions |
| `track` | Manual custom events | Event Tester + `useAaveOperations.ts` |

### Event Tester (`frontend/src/components/FormoEventTester.tsx`)

A UI panel (visible once a wallet is connected) with buttons to trigger events
on demand — useful for verifying the integration without needing any tokens:

- **Sign message** → `signature` event — free, signing costs no gas.
- **Send 0 ETH to self** → `transaction` event — a zero-value self-transfer, so
  no tokens are needed. It only requires gas, which is sponsored when an
  Openfort fee policy (`VITE_OPENFORT_FEE_SPONSORSHIP_ID`) is configured.
- **Track custom event** → `track` event — free.

### Custom Event Tracking

The `useFormo()` hook tracks custom `track` events. In
`frontend/src/hooks/useAaveOperations.ts`, events fire after a successful Aave
transaction:

```tsx
import { useFormo } from "@formo/analytics";

const formo = useFormo();

// After a successful supply
formo?.track("aave_supply", {
  asset: "USDC",
  amount: "0.1",
  market: usdcReserve.marketAddress,
  chainId: usdcReserve.chainId,
  txHash: transactionResult.value,
});
```

### Identify

`App.tsx` calls `formo.identify({ address })` whenever a wallet connects, tying
the visitor's session to their wallet address.

## Resources

- [Formo Documentation](https://docs.formo.so)
- [Formo SDK Installation](https://docs.formo.so/sdks/web#installation)
- [Openfort Documentation](https://www.openfort.io/docs)
- [Openfort Aave Recipe](https://www.openfort.io/docs/recipes/aave)
- [Aave Documentation](https://aave.com/docs)
- [wagmi Documentation](https://wagmi.sh)

## License

MIT
