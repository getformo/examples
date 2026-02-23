# Formo + Dynamic.xyz Example

This example demonstrates how to integrate [Formo SDK 1.26.0](https://github.com/getformo/sdk) with [Dynamic.xyz](https://dynamic.xyz) wallet for comprehensive web3 analytics.

## Features

- **Dynamic.xyz Wallet Integration**: Connect any wallet using Dynamic's multi-chain wallet infrastructure
- **Formo Analytics with Wagmi**: Automatic tracking of wallet events via wagmi integration
- **Auto-captured Events**: Connect, disconnect, chain changes, signatures, and transactions
- **Custom Event Tracking**: Track custom events with properties
- **Page View Tracking**: Track page visits
- **User Identification**: Associate wallet addresses with user sessions

## Tech Stack

- [React 18](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [wagmi v2](https://wagmi.sh/) - React hooks for Ethereum
- [viem](https://viem.sh/) - TypeScript interface for Ethereum
- [Dynamic.xyz SDK](https://docs.dynamic.xyz/) - Wallet connection
- [Formo SDK 1.26.0](https://docs.formo.so/) - Web3 analytics

## Prerequisites

1. **Dynamic.xyz Account**: Get your environment ID at [app.dynamic.xyz](https://app.dynamic.xyz)
2. **Formo Account**: Get your write key at [app.formo.so](https://app.formo.so)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/getformo/formo-example-dynamic.git
cd formo-example-dynamic
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```env
VITE_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id_here
VITE_FORMO_WRITE_KEY=your_formo_write_key_here
```

### 4. Start development server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

## Project Structure

```
formo-example-dynamic/
├── src/
│   ├── components/
│   │   └── WalletDemo.tsx      # Main demo component with wallet actions
│   ├── config/
│   │   ├── dynamic.ts          # Dynamic.xyz configuration
│   │   ├── formo.ts            # Formo SDK configuration
│   │   └── wagmi.ts            # wagmi config with supported chains
│   ├── App.tsx                 # Main app with providers setup
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## How It Works

### Provider Setup (App.tsx)

The app uses a layered provider architecture:

```tsx
<DynamicContextProvider>      {/* Dynamic.xyz wallet provider */}
  <WagmiProvider>              {/* wagmi state management */}
    <QueryClientProvider>       {/* React Query for caching */}
      <FormoAnalyticsProvider>   {/* Formo analytics with wagmi integration */}
        <DynamicWagmiConnector>   {/* Connects Dynamic to wagmi */}
          <App />
        </DynamicWagmiConnector>
      </FormoAnalyticsProvider>
    </QueryClientProvider>
  </WagmiProvider>
</DynamicContextProvider>
```

### Formo Wagmi Integration

Formo SDK integrates with wagmi to automatically capture wallet events:

```tsx
<FormoAnalyticsProvider
  writeKey={FORMO_WRITE_KEY}
  options={{
    wagmi: {
      config: wagmiConfig,    // wagmi config instance
      queryClient,            // React Query client for mutation tracking
    },
    autocapture: true,        // Enable auto-capture of all wallet events
  }}
>
```

### Auto-captured Events

When `autocapture` is enabled, Formo automatically tracks:

| Event | Description |
|-------|-------------|
| `connect` | Wallet connection |
| `disconnect` | Wallet disconnection |
| `chain` | Network/chain changes |
| `signature` | Message signing (personal_sign, eth_signTypedData_v4) |
| `transaction` | Transaction sending (eth_sendTransaction) |
| `page` | Page views |

### Manual Event Tracking

You can also track custom events using the `useFormo` hook:

```tsx
import { useFormo } from '@formo/analytics'

function MyComponent() {
  const formo = useFormo()

  // Track custom event
  await formo.track('button_click', { buttonId: 'cta-main' })

  // Track page view
  await formo.page('category', 'page_name', { custom: 'properties' })

  // Identify user
  await formo.identify({ address: '0x...', userId: 'user123' })
}
```

## Formo SDK API

### `FormoAnalytics.init(writeKey, options)`

Initialize Formo analytics (automatically called by `FormoAnalyticsProvider`).

### `useFormo()` Hook

Access the Formo instance in React components.

#### Methods

| Method | Description |
|--------|-------------|
| `track(event, properties?)` | Track custom event |
| `page(category?, name?, properties?)` | Track page view |
| `identify(params)` | Identify user |
| `connect(params)` | Manually track wallet connect |
| `disconnect(params?)` | Manually track wallet disconnect |
| `chain(params)` | Manually track chain change |
| `signature(params)` | Manually track signature event |
| `transaction(params)` | Manually track transaction event |

### Options

```typescript
interface Options {
  wagmi?: {
    config: WagmiConfig;        // Required for wagmi integration
    queryClient?: QueryClient;   // Required for signature/transaction tracking
  };
  autocapture?: boolean | {
    connect?: boolean;
    disconnect?: boolean;
    signature?: boolean;
    transaction?: boolean;
    chain?: boolean;
  };
  tracking?: boolean | {
    excludeHosts?: string[];
    excludePaths?: string[];
    excludeChains?: number[];
  };
  logger?: {
    enabled?: boolean;
    levels?: ('info' | 'warn' | 'error')[];
  };
}
```

## Supported Chains

This example supports the following chains (configurable in `src/config/wagmi.ts`):

- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism
- Base
- Sepolia (testnet)

## Dynamic.xyz Configuration

Configure your Dynamic.xyz environment in their dashboard:

1. Create an account at [app.dynamic.xyz](https://app.dynamic.xyz)
2. Create a new project
3. Enable the chains you want to support
4. Copy your Environment ID to `.env`

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Resources

- [Formo Documentation](https://docs.formo.so)
- [Formo SDK GitHub](https://github.com/getformo/sdk)
- [Dynamic.xyz Documentation](https://docs.dynamic.xyz)
- [wagmi Documentation](https://wagmi.sh)
- [viem Documentation](https://viem.sh)

## License

MIT
