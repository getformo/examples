# Porto + Formo SDK Example

This is an example application demonstrating the integration of [Porto](https://porto.sh) wallet with [Formo Analytics SDK](https://formo.so) using [Wagmi](https://wagmi.sh).

## Features

- **Porto Wallet Integration** - Connect using Porto's next-gen account system with passkey authentication
- **Formo Analytics** - Automatic event tracking for wallet interactions
- **Full Event Coverage**:
  - Connect/Disconnect events
  - Signature events (personal_sign, eth_signTypedData)
  - Transaction events
  - Chain switch events
  - Custom events
  - Page view events
- **Consent Management** - Opt-in/opt-out tracking controls

## Getting Started

### Prerequisites

- Node.js 18.18+ or Bun
- A Formo account and write key from [app.formo.so](https://app.formo.so)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/getformo/formo-example-porto.git
cd formo-example-porto
```

2. Install dependencies:

```bash
bun install
# or
npm install
```

3. Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your Formo write key:

```
NEXT_PUBLIC_FORMO_WRITE_KEY=your-formo-write-key-here
```

4. Start the development server:

```bash
bun dev
# or
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles with Tailwind
│   ├── layout.tsx       # Root layout with providers
│   ├── page.tsx         # Main demo page with all components
│   └── providers.tsx    # Wagmi + Formo providers setup
└── wagmi.ts             # Wagmi configuration with Porto connector
```

## Formo SDK Integration

The Formo SDK is configured in `src/app/providers.tsx` with the following options:

```typescript
<FormoAnalyticsProvider
  writeKey={FORMO_WRITE_KEY}
  options={{
    flushInterval: 5000,
    autocapture: {
      connect: true,
      disconnect: true,
      signature: true,
      transaction: true,
      chain: true,
    },
    wagmi: {
      config,
      queryClient,
    },
    logger: {
      enabled: true,
      levels: ["error", "warn", "info"],
    },
  }}
>
```

### Automatic Event Tracking

When `autocapture` is enabled and `wagmi` config is provided, the SDK automatically tracks:

- **Connect events** - When a wallet connects
- **Disconnect events** - When a wallet disconnects
- **Signature events** - When a user signs a message or typed data
- **Transaction events** - When a transaction is sent
- **Chain events** - When the user switches chains

### Manual Event Tracking

Use the `useFormo` hook to track custom events:

```typescript
import { useFormo } from "@formo/analytics";

function MyComponent() {
  const formo = useFormo();

  // Track a page view
  await formo.page("Category", "Page Name", { custom: "property" });

  // Track a custom event
  await formo.track("button_clicked", { button: "cta" });

  // Identify a user
  await formo.identify({ address: "0x..." });
}
```

## Supported Chains

This example is configured for:

- **Odyssey Testnet** (Chain ID: 911867) - Porto's test network
- **Base Sepolia** (Chain ID: 84532) - Base's testnet

## Resources

- [Porto Documentation](https://porto.sh/sdk)
- [Formo Documentation](https://docs.formo.so)
- [Wagmi Documentation](https://wagmi.sh)

## License

MIT
