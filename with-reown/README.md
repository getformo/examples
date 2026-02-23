# Formo Analytics - Reown AppKit Integration Example

This example application demonstrates the integration between [Formo Analytics SDK](https://formo.so) and [Reown AppKit](https://reown.com/appkit) for comprehensive wallet analytics tracking.

## Features

This example showcases the following key features:

### Wallet Integration
- **Connect/Disconnect**: Wallet connection management with Reown AppKit
- **Network Switching**: Multi-chain support with network selection
- **Wallet Information**: Display connected wallet details

### Analytics Tracking
- **Page Events**: Automatic page view tracking
- **Wallet Events**: Connect/disconnect event tracking
- **Signature Events**: Message signing tracking with success/failure states
- **Transaction Events**: Transaction attempt and result tracking
- **Custom Events**: Application-specific event tracking with custom properties

### Supported Networks
- Ethereum Mainnet
- Arbitrum
- Polygon
- Base
- Optimism

## Setup Instructions

### 1. Environment Variables

Copy the environment example file and configure your keys:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Get your Reown Project ID from https://cloud.reown.com
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here

# Get your Formo Analytics Write Key from your dashboard
NEXT_PUBLIC_FORMO_WRITE_KEY=your_formo_write_key_here
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Testing the Integration

The example includes several test components to verify the integration:

### 1. Wallet Connection Tests
- Connect wallet using various providers
- Test network switching
- Manual disconnect functionality

### 2. Signature Tests
- Sign test messages
- Track successful signatures
- Handle signature errors

### 3. Transaction Tests
- Send test transactions (small amounts to self)
- Track transaction attempts
- Handle transaction failures

### 4. Custom Event Tests
- Track button clicks
- Track feature usage
- Track user interactions
- Track performance metrics

## Event Tracking Details

The integration automatically tracks the following events:

### Automatic Events
- `page`: Page views with URL and referrer
- `Wallet Connected`: When user connects wallet
- `Wallet Disconnected`: When user disconnects wallet
- `Network Changed`: When user switches networks

### Manual Events
- `Message Signed`: When user signs messages
- `Signature Failed`: When signature fails
- `Transaction Sent`: When transactions are sent
- `Transaction Failed`: When transactions fail
- Custom application events

### Event Properties

All events include relevant metadata:
- `address`: Connected wallet address
- `chainId`: Current network chain ID
- `timestamp`: ISO timestamp of the event
- `connector`: Wallet connector name
- Additional context-specific properties

## Architecture

### Components Structure
```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles
├── components/
│   ├── providers/
│   │   ├── AppKitProvider.tsx    # Reown AppKit provider
│   │   └── FormoProvider.tsx     # Formo Analytics provider
│   ├── ui/                       # UI components
│   ├── WalletComponents.tsx      # Wallet interaction components
│   ├── CustomEventTest.tsx      # Custom event testing
│   └── WalletInfo.tsx           # Wallet information display
├── config/
│   ├── wagmi.ts            # Wagmi configuration
│   └── appkit.ts           # AppKit configuration
└── lib/
    └── utils.ts            # Utility functions
```

### Provider Hierarchy
```
FormoProvider
  └── AppKitProvider (WagmiProvider + QueryClientProvider)
      └── App Components
```

## Customization

### Adding New Networks

Edit `src/config/wagmi.ts` to add new networks:

```typescript
import { mainnet, arbitrum, polygon, base, optimism, yourNetwork } from '@reown/appkit/networks';

export const networks = [mainnet, arbitrum, polygon, base, optimism, yourNetwork];
```

### Custom Event Tracking

Add custom events anywhere in your application:

```typescript
import { useFormo } from '@formo/analytics';

function YourComponent() {
  const formo = useFormo();
  
  const trackCustomEvent = () => {
    formo?.track('Custom Event', {
      property1: 'value1',
      property2: 'value2',
      timestamp: new Date().toISOString(),
    });
  };
}
```

### Styling

The application uses Tailwind CSS with a custom design system. Modify `src/app/globals.css` and `tailwind.config.ts` to customize the appearance.

## Resources

- [Formo Analytics Documentation](https://docs.formo.so)
- [Reown AppKit Documentation](https://docs.reown.com/appkit)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)

## License

This example is provided as-is for demonstration purposes.