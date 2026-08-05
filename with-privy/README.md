# Formo + Privy Example App

This is an example Next.js application demonstrating integration between [Privy](https://www.privy.io/) embedded wallets and the [Formo Analytics SDK](https://formo.so/).

## Features

- **Privy Authentication**: Login with external wallets or email to create embedded wallets
- **Account Linking**: Link and unlink email, phone, wallets, passkeys, and socials via [`useLinkAccount`](https://docs.privy.io/user-management/users/linking-accounts)
- **Identity Clustering**: Every linked wallet is identified under one Privy DID, so a multi-wallet user is a single Formo user
- **Formo Analytics Integration**: Track wallet events and custom analytics
- **Wallet Connection**: View connected wallets (embedded and external)
- **Event Testing UI**: Test all major Formo SDK event types:
  - Page events
  - Connect/Disconnect events (auto-captured)
  - Signature events (auto-captured)
  - Transaction events (auto-captured)
  - Custom events

## Prerequisites

- Node.js 18+ or pnpm 9.15+
- A [Privy](https://dashboard.privy.io/) account and App ID
- A [Formo](https://app.formo.so/) account and Write Key

## Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/getformo/examples.git
   cd examples/with-privy
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
   NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
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
│   └── providers.tsx     # Privy, wagmi, and Formo providers
├── components/
│   └── LinkedAccounts.tsx # Account linking/unlinking + identify() payload preview
└── config/
    └── wagmi.ts          # Wagmi configuration for Privy
```

## Account Linking & Identity Clustering

A Privy user is **one account (a DID) with many linked accounts** — an embedded
wallet, external wallets they connect over time, an email, socials, passkeys.
Without help, each wallet address looks like a separate Formo user, so an
8-wallet Privy user fragments into 8 users.

The SDK solves this in one call. Pass the `usePrivy()` user straight to
`identify()` and it identifies **every** linked wallet under that user's DID,
so Formo clusters them server-side:

```typescript
import { useFormo } from "@formo/analytics";
import { usePrivy, useWallets } from "@privy-io/react-auth";

const { user } = usePrivy();
const { wallets } = useWallets();
const formo = useFormo();

// Depend on the address string, not the `wallets` array: useWallets() returns
// a new array reference on many renders, which would re-run this every render.
const activeWalletAddress = wallets[0]?.address;

useEffect(() => {
  if (!user || !formo) return;

  // activeAddress is optional: it pins event attribution to the wallet
  // active in wagmi. Other linked wallets are recorded for clustering only.
  formo.identify(user, { activeAddress: activeWalletAddress });
}, [user, formo, activeWalletAddress]);
```

`user` is reactive, so this effect re-runs automatically on login and on every
`link`/`unlink`, keeping the identity graph current.

### What gets sent

The SDK parses `user.linkedAccounts` and sends, with **each** wallet's identify:

| Property | Source |
| --- | --- |
| `privyDid`, `privyCreatedAt` | The Privy user |
| `email`, `phone` | Linked email / phone account |
| `google`, `twitter`, `discord`, `github`, `farcaster`, `telegram`, `apple`, `linkedin`, `spotify`, `tiktok`, `instagram`, `twitch`, `line` | Linked social accounts |
| `customUserId` | A linked `custom_auth` account |
| `wallet_client`, `chain_type`, `is_embedded` | Per-wallet metadata |

Linked wallets include `wallet` and `smart_wallet` accounts plus the
`embeddedWallets`/`smartWallets` of a `cross_app` account, deduplicated by
address. The **Linked Accounts** card in the demo renders this exact payload
live via `parsePrivyProperties(user)`.

### Linking accounts

The demo uses Privy's [`useLinkAccount`](https://docs.privy.io/user-management/users/linking-accounts)
hook, which opens Privy's UI for each method and reports the result:

```typescript
const { linkWallet, linkEmail, linkGoogle, linkPasskey /* … */ } = useLinkAccount({
  onSuccess: ({ user, linkMethod, linkedAccount }) => {
    // Surface the result only. Don't re-identify here: the reactive `user`
    // already re-runs the effect above, so identifying from this callback just
    // emits a redundant, out-of-order identify against a possibly pre-link
    // `user` right before the effect emits the correct one.
  },
  onError: (error) => console.error(error),
});
```

Unlinking uses the matching `usePrivy()` methods (`unlinkWallet`,
`unlinkEmail`, `unlinkOAuth`, …). Privy requires a user to keep at least one
linked account, so the demo disables unlink when only one remains.

## Formo SDK Events

The Formo SDK automatically captures the following wallet events when `autocapture: true` is enabled:

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

This example uses Privy's wagmi integration (`@privy-io/wagmi`) to enable automatic event tracking by the Formo SDK. The key setup in `providers.tsx`:

```typescript
import { WagmiProvider } from "@privy-io/wagmi";
import { FormoAnalyticsProvider } from "@formo/analytics";
import { wagmiConfig } from "@/config/wagmi";

// Provider nesting order is important:
// PrivyProvider > QueryClientProvider > WagmiProvider > FormoAnalyticsProvider
<FormoAnalyticsProvider
  writeKey={formoWriteKey}
  options={{
    wagmi: {
      config: wagmiConfig,
      queryClient,  // Required for signature/transaction tracking
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

**Note:** Privy's logout doesn't trigger wagmi's disconnect status, so the demo includes a `useEffect` that manually tracks disconnect events when `authenticated` changes from true to false.

## Supported Chains

The app is configured to support:

- Ethereum Mainnet
- Sepolia (testnet)
- Polygon
- Arbitrum
- Optimism
- Base

## Resources

- [Privy Documentation](https://docs.privy.io/)
- [Privy React SDK](https://docs.privy.io/guide/react/quickstart)
- [Formo Documentation](https://docs.formo.so/)
- [Formo SDK Installation](https://docs.formo.so/install)

## License

MIT
