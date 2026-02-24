# Formo Analytics x Thirdweb Integration Example

A comprehensive example application demonstrating the integration of [Formo Analytics](https://formo.ai) with [Thirdweb](https://thirdweb.com) wallet connectivity. This project showcases automatic event tracking for wallet interactions, signatures, transactions, and custom events.

## 🚀 Features

### Automatic Event Tracking
- **Wallet Connection/Disconnection**: Automatically tracks when users connect or disconnect their wallets
- **Page View Events**: Tracks page navigation and user sessions
- **User Identification**: Links wallet addresses to user sessions
- **Error Tracking**: Captures and reports connection and transaction errors

### Manual Testing Interface
- **Message Signing**: Test signature events with custom messages
- **Transaction Testing**: Send test transactions and track events
- **Custom Events**: Fire custom events with configurable data
- **Page Events**: Manually trigger page view events

### Supported Wallets
- MetaMask
- Coinbase Wallet
- WalletConnect
- And more through Thirdweb's wallet infrastructure

## 🛠️ Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- A Thirdweb Client ID
- A Formo Analytics Write Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd formo-example-thirdweb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here
   NEXT_PUBLIC_FORMO_WRITE_KEY=your_formo_write_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Getting API Keys

#### Thirdweb Client ID
1. Visit [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Create a new project or select an existing one
3. Copy your Client ID from the project settings

#### Formo Analytics Write Key
1. Visit [Formo Analytics Dashboard](https://app.formo.ai)
2. Create a new project or select an existing one
3. Navigate to Settings > API Keys
4. Copy your Write Key

## 📱 Usage

### Connecting a Wallet
1. Click on any of the wallet connection buttons
2. Follow the wallet-specific connection flow
3. Once connected, the app will automatically track the connection event

### Testing Events

#### Signature Testing
1. Enter a custom message in the signature testing section
2. Click "Sign Message"
3. Approve the signature in your wallet
4. The signature event will be tracked automatically

#### Transaction Testing
1. Click "Send Test Transaction"
2. This sends 0 ETH to your own address (safe test transaction)
3. Approve the transaction in your wallet
4. The transaction event will be tracked

#### Custom Events
1. Enter a custom event name
2. Modify the JSON data as needed
3. Click "Send Custom Event"
4. The event will be sent to Formo Analytics

## 🏗️ Project Structure

```
formo-example-thirdweb/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Main application page
│   │   └── globals.css         # Global styles
│   └── components/
│       ├── analytics-provider.tsx  # Formo Analytics wrapper
│       ├── connect-wallet.tsx      # Wallet connection UI
│       ├── event-tester.tsx        # Event testing interface
│       ├── formo-analytics.tsx     # Analytics status display
│       └── thirdweb-provider.tsx   # Thirdweb configuration
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## 🔍 Event Types Tracked

### Automatic Events
- `Page View` - Tracked on page load and navigation
- `Wallet Connected` - When a wallet is successfully connected
- `Wallet Disconnected` - When a wallet is disconnected
- `Wallet Connection Attempted` - When connection is initiated
- `Wallet Connection Failed` - When connection fails

### Manual Events
- `Message Signed` - When a message is successfully signed
- `Signature Failed` - When message signing fails
- `Transaction Sent` - When a transaction is successfully sent
- `Transaction Failed` - When transaction submission fails
- `Custom Test Event` - User-defined custom events
- `Page Event Triggered` - Manually triggered page events

## 🧪 Testing the Integration

1. **Connect your wallet** and verify the connection event is tracked
2. **Sign a message** to test signature event tracking
3. **Send a test transaction** to verify transaction events
4. **Create custom events** to test flexible event tracking
5. **Check the analytics dashboard** to see all tracked events

## 🔧 Customization

### Adding New Wallets
Edit `src/components/connect-wallet.tsx` and add new wallet instances to the `wallets` array:

```typescript
import { NewWallet } from '@thirdweb-dev/wallets';

const wallets = [
  new MetaMaskWallet(),
  new CoinbaseWallet(),
  new WalletConnect(),
  new NewWallet(), // Add your new wallet here
];
```

### Custom Event Properties
Modify the event data in any component by updating the analytics tracking calls:

```typescript
analytics.track('Your Event Name', {
  custom_property: 'custom_value',
  wallet_address: address,
  timestamp: new Date().toISOString(),
  // Add any custom properties here
});
```

### Styling
This project uses Tailwind CSS. Modify the classes in any component file to customize the appearance.

## 📊 Analytics Dashboard

After running the application and generating events, you can view them in your Formo Analytics dashboard:

1. Log in to [Formo Analytics](https://app.formo.ai)
2. Navigate to your project
3. View real-time events in the Events tab
4. Create custom dashboards and funnels based on the tracked events

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy

### Other Platforms
This is a standard Next.js application and can be deployed to any platform that supports Node.js:
- Netlify
- Railway
- Heroku
- AWS
- Google Cloud Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- [Thirdweb Documentation](https://portal.thirdweb.com/)
- [Formo Analytics Documentation](https://docs.formo.ai/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🔗 Links

- [Thirdweb](https://thirdweb.com)
- [Formo Analytics](https://formo.ai)
- [Next.js](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)