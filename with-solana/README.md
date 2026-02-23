# Formo Solana dApp Scaffold

A modern Solana dApp scaffold demonstrating the [Formo Analytics SDK](https://github.com/getformo/sdk) integration with Solana wallet adapter. Based on [builderz-solana-dapp-scaffold](https://github.com/builderz-labs/builderz-solana-dapp-scaffold) with comprehensive transaction examples from [solana-labs/dapp-scaffold](https://github.com/solana-labs/dapp-scaffold).

This app tests the Solana support added in [PR #157](https://github.com/getformo/sdk/pull/157).

## Features

- **Modern UI**: Built with Next.js 14, Tailwind CSS, and shadcn/ui components
- **Multi-Wallet Support**: Phantom, Solflare, Torus, Ledger, Coinbase
- **Network Switching**: Easy switching between Devnet and Mainnet
- **Theme Support**: Dark/light mode with system detection
- **Comprehensive Demos**:
  - Request Airdrop (devnet)
  - Send Legacy Transaction
  - Send Versioned Transaction (V0)
  - Sign Message
  - Sign Transaction (without broadcast)
  - Sign All Transactions (batch)

## Formo SDK Events Tracked

The Formo SDK automatically tracks these Solana events:

| Event Type | Trigger |
|------------|---------|
| `wallet_connect` | Wallet successfully connected |
| `wallet_disconnect` | Wallet disconnected |
| `signature_requested` | Message/transaction signing initiated |
| `signature_confirmed` | User approved signature |
| `signature_rejected` | User rejected signature |
| `transaction_started` | Transaction creation initiated |
| `transaction_broadcasted` | Transaction submitted to network |
| `transaction_confirmed` | Transaction confirmed on-chain |
| `transaction_reverted` | Transaction failed on-chain |

## Quick Start

### Prerequisites

- Node.js 18+
- A Solana wallet browser extension (Phantom recommended)
- Formo write key from [app.formo.so](https://app.formo.so)

### Installation

```bash
# Clone the repository
git clone https://github.com/getformo/formo-example-solana.git
cd formo-example-solana

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Formo write key

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

Create a `.env` file with the following variables:

```env
# Required: Your Formo Analytics write key
NEXT_PUBLIC_FORMO_WRITE_KEY=your_write_key_here

# Optional: Custom Solana RPC endpoint (defaults to public devnet)
# NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Optional: Solana cluster (devnet, mainnet-beta)
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
```

## Testing with Local SDK

To test with a local development version of the Formo SDK:

```bash
# In the SDK directory
cd /path/to/formo-sdk
npm run build
npm link

# In this example app directory
cd /path/to/formo-example-solana
npm link @formo/analytics

# Run the app
npm run dev
```

## Testing Checklist

Use this checklist to verify Formo SDK Solana integration:

### Wallet Events
- [ ] Connect wallet → verify `wallet_connect` event fires
- [ ] Disconnect wallet → verify `wallet_disconnect` event fires
- [ ] Switch wallets → verify connect/disconnect events fire correctly
- [ ] Auto-connect on page reload → verify event tracking

### Signature Events
- [ ] Sign a message → verify `signature_requested` → `signature_confirmed`
- [ ] Reject message signing → verify `signature_requested` → `signature_rejected`
- [ ] Sign transaction (no send) → verify signature events
- [ ] Sign all transactions (batch) → verify events for each

### Transaction Events
- [ ] Send legacy transaction → verify full lifecycle
- [ ] Send versioned (V0) transaction → verify full lifecycle
- [ ] Cancel transaction → verify proper event handling
- [ ] Transaction fails → verify `transaction_reverted` event

### Edge Cases
- [ ] Rapid connect/disconnect cycles
- [ ] Multiple signatures in sequence
- [ ] Network switching mid-session
- [ ] Batch transaction signing

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main demo page with tabs
│   ├── providers.tsx       # Provider hierarchy
│   └── globals.css         # Global styles + shadcn theme
├── components/
│   ├── ui/                 # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── switch.tsx
│   │   └── tabs.tsx
│   ├── layout/             # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ThemeToggle.tsx
│   ├── wallet/             # Wallet components
│   │   ├── WalletButton.tsx
│   │   ├── NetworkSwitcher.tsx
│   │   └── AutoConnect.tsx
│   ├── demos/              # Demo components
│   │   ├── RequestAirdrop.tsx
│   │   ├── SendTransaction.tsx
│   │   ├── SendVersionedTransaction.tsx
│   │   ├── SignMessage.tsx
│   │   ├── SignTransaction.tsx
│   │   └── SignAllTransactions.tsx
│   ├── FormoStatus.tsx     # SDK connection indicator
│   └── WalletInfo.tsx      # Wallet info display
├── contexts/
│   ├── NetworkConfigurationProvider.tsx
│   ├── AutoConnectProvider.tsx
│   ├── WalletContextProvider.tsx
│   └── FormoProvider.tsx
├── stores/
│   ├── useNotificationStore.ts
│   └── useUserSOLBalanceStore.ts
└── lib/
    └── utils.ts            # Utility functions
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Blockchain**: Solana Web3.js 1.98
- **Wallet Adapter**: @solana/wallet-adapter-react
- **Analytics**: @formo/analytics (Solana branch)
- **Theme**: next-themes
- **Notifications**: Sonner

## Related Links

- [Formo SDK Repository](https://github.com/getformo/sdk)
- [Solana Support PR #157](https://github.com/getformo/sdk/pull/157)
- [builderz-solana-dapp-scaffold](https://github.com/builderz-labs/builderz-solana-dapp-scaffold)
- [solana-labs/dapp-scaffold](https://github.com/solana-labs/dapp-scaffold)
- [Solana Wallet Adapter Docs](https://github.com/solana-labs/wallet-adapter)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)

## License

MIT
