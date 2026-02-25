# Formo Web3 Onboard Example

This is an example application demonstrating the integration between [Formo Analytics](https://formo.so) and [Web3 Onboard](https://github.com/thirdweb-dev/web3-onboard), showcasing how to track various wallet and user events in a decentralized application.

## Features

- **Multi-Wallet Support**: Connect with MetaMask, Coinbase Wallet, WalletConnect, and other injected wallets
- **Automatic Event Tracking**: Page views, wallet connections, disconnections, and chain changes
- **Signature Testing**: Test message signing with automatic event tracking
- **Transaction Testing**: Send test transactions with tracking
- **Custom Events**: Track custom application-specific events
- **User Identification**: Automatic user identification when wallets connect
- **Multi-Chain Support**: Ethereum, Polygon, Optimism, and Base networks

## Technologies Used

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Web3 Onboard** for multi-wallet connections
- **Formo Analytics SDK** for Web3 analytics
- **Tailwind CSS v4** for styling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Formo Analytics account and write key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/getformo/formo-example-web3-onboard.git
cd formo-example-web3-onboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` and add your configuration:
```env
NEXT_PUBLIC_FORMO_WRITE_KEY=your_formo_write_key_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

### Formo Analytics

To get your Formo write key:

1. Sign up at [formo.so](https://formo.so)
2. Create a new project
3. Go to your project settings and copy the **SDK Write Key**
4. Add it to your `.env.local` file as `NEXT_PUBLIC_FORMO_WRITE_KEY`

**Important**: The SDK is configured with debug logging enabled. You should see:
- "Formo SDK loaded successfully" in the console
- Network requests to `raw_events` in the Network tab
- Console logs for all tracked events

For more details, see the [official Formo installation guide](https://docs.formo.so/install).

### WalletConnect (Optional)

For WalletConnect support:

1. Create a project at [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Get your project ID
3. Add it to your `.env.local` file

If not provided, the app will use a demo project ID with limited functionality.

## Event Tracking

### Automatic Events

The application automatically tracks the following events:

- `page_view`: Tracked on every page navigation
- `wallet_connect`: When a wallet is successfully connected
- `wallet_disconnect`: When a wallet is disconnected
- `chain_change`: When switching between blockchain networks
- `signature`: When signing messages or transactions
- `transaction`: When sending blockchain transactions

### User Identification

When a wallet connects, the Formo SDK automatically identifies the user with:

- Wallet address
- Wallet type (MetaMask, Coinbase, etc.)
- Current blockchain network
- Connection timestamp

### Custom Events

You can track custom events using the `track()` method:

```typescript
import { useFormo } from '@formo/analytics'

const analytics = useFormo()

// Track a custom event
analytics.track('custom_event', {
  action: 'button_click',
  value: 100,
  category: 'engagement'
})
```

## Project Structure

```
src/
├── app/
│   ├── about/
│   │   └── page.tsx          # About page with event tracking
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout with providers
│   └── page.tsx              # Main demo page
├── components/
│   ├── EventLogger.tsx       # Real-time event logging
│   ├── FormoProvider.tsx     # Formo Analytics provider
│   ├── Navigation.tsx        # Navigation component
│   └── Web3Provider.tsx      # Web3 Onboard provider with event tracking
└── lib/
    └── web3-onboard.ts       # Web3 Onboard configuration
```

## Testing the Integration

1. **Connect a Wallet**: Click "Connect Wallet" to test wallet connection events
2. **Switch Networks**: Test chain change event tracking
3. **Sign a Message**: Test signature event tracking
4. **Send a Transaction**: Test transaction event tracking (sends 0 ETH to yourself)
5. **Custom Events**: Use the JSON input to test custom event tracking
6. **Page Navigation**: Navigate between pages to test page view tracking

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:

```bash
npm run build
npm start
```

## Troubleshooting

### Common Issues

- **Wallet not connecting**: Make sure you have a Web3 wallet extension installed
- **Events not tracking**: Verify your Formo write key is correct
- **WalletConnect not working**: Check your WalletConnect project ID

### Debug Mode

To enable debug logging for Formo Analytics, update the provider configuration:

```typescript
<FormoAnalyticsProvider
  writeKey={writeKey}
  options={{
    tracking: true,
    logger: {
      enabled: true,
      levels: ['error', 'warn', 'info', 'debug'],
    },
  }}
>
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
