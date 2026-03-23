# Formo + Turnkey Example App

This is an example Next.js application demonstrating integration between [Turnkey](https://www.turnkey.com/) embedded wallets and the [Formo Analytics SDK](https://formo.so/).

## Features

- **Turnkey Authentication**: Login with passkeys to access embedded wallets — no browser extensions needed
- **Formo Analytics Integration**: Track wallet events and custom analytics
- **EIP-1193 Provider**: Direct integration with Turnkey's `@turnkey/eip-1193-provider` for signing and transactions
- **Event Testing UI**: Test all major Formo SDK event types:
  - Page events
  - Connect/Disconnect events (auto-captured)
  - Signature events (auto-captured)
  - Transaction events (auto-captured)
  - Custom events

## Prerequisites

- Node.js 18+ and pnpm 9.15.4
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
   ```

3. **Configure environment variables**

   Copy the example environment file and add your credentials:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:

   ```env
   NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID=your-turnkey-organization-id
   NEXT_PUBLIC_TURNKEY_RP_ID=localhost
   TURNKEY_API_PUBLIC_KEY=your-turnkey-api-public-key
   TURNKEY_API_PRIVATE_KEY=your-turnkey-api-private-key
   NEXT_PUBLIC_FORMO_WRITE_KEY=your-formo-write-key
   ```

4. **Run the development server**

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── create-sub-org/
│   │       └── route.ts    # Server-side Turnkey sub-organization creation
│   ├── globals.css         # Global styles with Tailwind
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main demo page with wallet UI and event testing
│   └── providers.tsx       # Turnkey and Formo providers
```

## How It Works

### Turnkey Authentication

Turnkey provides embedded wallets secured by passkeys. When a user authenticates:

1. The user creates a passkey and a Turnkey sub-organization is created via the server-side API route
2. The user authenticates via passkeys using `@turnkey/sdk-react`
3. The app fetches the user's wallets from the Turnkey API
4. An EIP-1193 provider is created via `@turnkey/eip-1193-provider`, enabling signing, transactions, and chain switching

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

## Provider Setup

The key setup in `providers.tsx`:

```typescript
import { TurnkeyProvider } from "@turnkey/sdk-react";
import { FormoAnalyticsProvider } from "@formo/analytics";

// Provider nesting order:
// TurnkeyProvider > WalletContext > FormoAnalyticsProvider
<FormoAnalyticsProvider
  writeKey={formoWriteKey}
  options={{
    provider,       // EIP-1193 provider from Turnkey
    autocapture: true,
    tracking: true,
  }}
>
  {children}
</FormoAnalyticsProvider>
```

The Formo SDK hooks into the EIP-1193 provider to auto-capture wallet connect/disconnect, chain changes, signatures, and transactions.

## Supported Chains

The app is configured for Sepolia (testnet). To support additional chains, you would need to update the `chainParam` configuration in `page.tsx` and add a chain-switching UI along with dynamic provider configuration.

## Resources

- [Turnkey Documentation](https://docs.turnkey.com/)
- [Turnkey Embedded Wallet Quickstart](https://docs.turnkey.com/getting-started/embedded-wallet-quickstart)
- [Formo Documentation](https://docs.formo.so/)
- [Formo SDK Installation](https://docs.formo.so/install)

## License

MIT
