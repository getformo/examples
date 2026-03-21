# Formo + Turnkey Example App

This is an example Next.js application demonstrating integration between [Turnkey](https://www.turnkey.com/) embedded wallets and the [Formo Analytics SDK](https://formo.so/).

## Features

- **Turnkey Authentication**: Login with passkeys to access embedded wallets — no browser extensions needed
- **Formo Analytics Integration**: Track wallet events and custom analytics
- **Wagmi Integration**: Custom wagmi connector wrapping Turnkey's `@turnkey/eip-1193-provider`
- **Event Testing UI**: Test all major Formo SDK event types:
  - Page events
  - Connect/Disconnect events (auto-captured)
  - Signature events (auto-captured)
  - Transaction events (auto-captured)
  - Custom events

## Prerequisites

- Node.js 18+ or pnpm 9.15+
- A [Turnkey](https://app.turnkey.com/) account and Organization ID
- A [Formo](https://app.formo.so/) account and Write Key

## Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/getformo/examples.git
   cd examples/with-turnkey
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables**

   Copy the example environment file and add your credentials:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:

   ```env
   NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID=your-turnkey-organization-id
   NEXT_PUBLIC_FORMO_WRITE_KEY=your-formo-write-key
   ```

4. **Run the development server**

   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── globals.css       # Global styles with Tailwind
│   ├── layout.tsx        # Root layout with providers
│   ├── page.tsx          # Main demo page with wallet UI and event testing
│   └── providers.tsx     # Turnkey, wagmi, and Formo providers
└── config/
    ├── turnkey-connector.ts  # Custom wagmi connector wrapping Turnkey
    └── wagmi.ts              # Wagmi chain and transport configuration
```

## How It Works

### Turnkey Authentication

Turnkey provides embedded wallets secured by passkeys. When a user authenticates:

1. The user authenticates via Turnkey's auth iframe (passkeys or email)
2. The app fetches the user's wallets from the Turnkey API
3. A wagmi connector is created wrapping `@turnkey/eip-1193-provider`, which handles signing, transactions, and chain switching per the [Turnkey wagmi integration guide](https://docs.turnkey.com/wallets/wagmi)
4. The connector is connected via wagmi, enabling standard hooks like `useAccount`, `useSignMessage`, etc.

### Formo Analytics

The Formo SDK automatically captures wallet events when `autocapture: true` is enabled:

| Event | Description | Auto-captured |
|-------|-------------|---------------|
| `page` | Page view events | Yes |
| `connect` | Wallet connected | Yes |
| `disconnect` | Wallet disconnected | Yes |
| `signature` | Message signing (personal_sign, signTypedData) | Yes |
| `transaction` | Transaction events (eth_sendTransaction) | Yes |
| `chain` | Chain/network changes | Yes |
| `track` | Custom events | No (manual) |

### Manual Event Tracking

```typescript
import { useFormo } from "@formo/analytics";

function MyComponent() {
  const formo = useFormo();

  // Track custom event
  await formo.track("button_clicked", {
    button_id: "cta-main",
    page: "home"
  });

  // Track page event
  await formo.page("category", "page-name", {
    custom_property: "value"
  });
}
```

## Wagmi Integration

This example uses a wagmi connector that wraps `@turnkey/eip-1193-provider`, following the [official Turnkey wagmi integration approach](https://docs.turnkey.com/wallets/wagmi). The key setup in `providers.tsx`:

```typescript
import { TurnkeyProvider } from "@turnkey/sdk-react";
import { WagmiProvider } from "wagmi";
import { FormoAnalyticsProvider } from "@formo/analytics";
import { wagmiConfig } from "@/config/wagmi";

// Provider nesting order:
// TurnkeyProvider > WagmiProvider > QueryClientProvider > FormoAnalyticsProvider
<FormoAnalyticsProvider
  writeKey={formoWriteKey}
  options={{
    wagmi: {
      config: wagmiConfig,
      queryClient,
    },
    autocapture: true,
    tracking: true,
  }}
>
  {children}
</FormoAnalyticsProvider>
```

The Formo SDK hooks into:
- `wagmiConfig.subscribe()` for wallet connect/disconnect/chain events
- `queryClient.getMutationCache().subscribe()` for signature and transaction events

## Supported Chains

The app is configured to support:

- Ethereum Mainnet
- Sepolia (testnet)
- Polygon
- Arbitrum
- Optimism
- Base

## Resources

- [Turnkey Documentation](https://docs.turnkey.com/)
- [Turnkey Embedded Wallet Quickstart](https://docs.turnkey.com/getting-started/embedded-wallet-quickstart)
- [Turnkey Wagmi Integration](https://docs.turnkey.com/wallets/wagmi)
- [Formo Documentation](https://docs.formo.so/)
- [Formo SDK Installation](https://docs.formo.so/install)

## License

MIT
