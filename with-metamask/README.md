# Formo Analytics + MetaMask Wagmi Example

This example application demonstrates how to integrate **Formo Analytics SDK** with a **Next.js** application using **wagmi** and **MetaMask SDK**. It showcases automatic tracking of wallet connections, signatures, and transactions.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Testing the Integration](#testing-the-integration)

## Introduction

This app demonstrates how Formo Analytics automatically tracks wallet events when integrated with Wagmi:

- **Connection Events**: Wallet connect, disconnect, and chain switches
- **Signature Events**: Message signing and typed data signing (EIP-712)
- **Transaction Events**: Transaction submissions and confirmations

## Features

- **Wallet Connection**: Connect to MetaMask wallet seamlessly
- **Network Switching**: Switch between Ethereum networks (Linea Sepolia, Linea, Mainnet)
- **Message Signing**: Test signing messages and typed data
- **Transaction Testing**: Send test transactions (0 ETH to self)
- **Automatic Analytics**: All wallet events are automatically tracked by Formo SDK

## Getting Started

### 1. Install dependencies

```bash
npm install
# or
pnpm install
```

### 2. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Formo Analytics write key:

```env
NEXT_PUBLIC_FORMO_WRITE_KEY=your_write_key_here
```

You can get your write key from [https://app.formo.so](https://app.formo.so).

### 3. Run the development server

```bash
npm run dev
# or
pnpm dev
```

### 4. Open your browser

Visit [http://localhost:3000](http://localhost:3000) to see the application running.

## Environment Setup

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FORMO_WRITE_KEY` | Your Formo Analytics write key | Yes |

## Project Structure

```
├── app/
│   ├── layout.tsx       # Root layout with providers
│   ├── page.tsx         # Main page with wallet actions
│   └── providers.tsx    # Wagmi + Formo Analytics providers
├── components/
│   ├── navbar.tsx       # Wallet connection UI
│   └── WalletActions.tsx # Test signing & transactions
├── wagmi.config.ts      # Wagmi configuration
└── .env.example         # Environment template
```

### Key Files

- **`app/providers.tsx`** - Sets up the Formo Analytics provider with Wagmi integration
- **`components/WalletActions.tsx`** - UI for testing signatures and transactions

## Technologies Used

- **Next.js 15** - React framework
- **wagmi v2** - React hooks for Ethereum
- **MetaMask SDK** - MetaMask wallet connector
- **Formo Analytics SDK** - Wallet event tracking
- **TanStack Query** - Data fetching and mutation tracking
- **Tailwind CSS** - Styling

## Testing the Integration

1. **Connect Wallet** - Click "Connect Wallet" in the navbar
2. **Check Console** - Open browser DevTools and look for `[Formo SDK]` logs:
   - `FormoAnalytics: Initializing in Wagmi mode`
   - `WagmiEventHandler: Connection listeners set up successfully`
   - `WagmiEventHandler: Status changed`

3. **Test Actions** - Use the "Test Wallet Actions" card to:
   - **Sign Message** - Signs a text message
   - **Sign Typed Data** - Signs EIP-712 structured data
   - **Send 0 ETH** - Sends a zero-value transaction to yourself

4. **Verify Events** - Check the console for mutation tracking:
   - `WagmiEventHandler: Mutation success` for signatures
   - Transaction events for sends

## Formo Analytics Integration

The SDK is configured in `app/providers.tsx`:

```tsx
<FormoAnalyticsProvider
  writeKey={process.env.NEXT_PUBLIC_FORMO_WRITE_KEY}
  options={{
    wagmi: {
      config: config,        // Wagmi config
      queryClient: queryClient, // For mutation tracking
    },
    autocapture: {
      connect: true,
      disconnect: true,
      chain: true,
      signature: true,
      transaction: true,
    },
  }}
>
```

This automatically tracks:
- Wallet connections and disconnections
- Chain/network switches
- Message and typed data signatures
- Transaction submissions
