# Formo Analytics React Native Example

This is an example React Native app demonstrating the [@formo/analytics-react-native](https://github.com/getformo/sdk-react-native) SDK.

## Features

- **Screen Tracking**: Track screen views for navigation analytics
- **Custom Event Tracking**: Send custom events with properties
- **Semantic Events**: Track revenue, points, and volume events
- **Automatic Wallet Event Tracking**: Wallet connect, disconnect, signatures, and transactions are automatically tracked via wagmi integration
- **Consent Management**: Built-in opt-out/opt-in functionality for GDPR compliance
- **Android Install Attribution**: `react-native-play-install-referrer` is installed so the SDK can read the Play Store install referrer. Real referrer data only comes back for installs that actually came from the Play Store — a dev build or sideload reports an organic install.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended), npm, or yarn
- Expo CLI (`npm install -g expo-cli`)
- Xcode (for iOS development)
- Android Studio (for Android development)
- iOS Simulator or Android Emulator (Expo Go does not support custom native modules)
- [Foundry](https://getfoundry.sh) — optional, only for the Mock Wallet buttons (see step 4)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/getformo/examples.git
cd examples/with-react-native
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file with your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your Formo write key:

```
EXPO_PUBLIC_FORMO_WRITE_KEY=your_formo_write_key
```

You can get your Formo write key from [app.formo.so](https://app.formo.so).

4. (Optional) Start local chains for the Mock Wallet:

The **Mock Wallet** buttons — Send Tx and Sign Message — need an RPC node that has
the test account unlocked. wagmi's `mock` connector only intercepts a handful of
methods and proxies the rest (`eth_sendTransaction`, `eth_sign`) straight to the
transport. Public RPCs hold no keys, so against them Send Tx fails with
`-32601 rpc method is unsupported` and Sign Message with `unknown account`.

Start an [anvil](https://getfoundry.sh) node on the chain you want to test:

Install Foundry first if you don't have it — see the
[installation guide](https://getfoundry.sh/introduction/installation). Then:

```bash
anvil --chain-id 84532                    # Base Sepolia  → localhost:8545
anvil --chain-id 11155420 --port 8546     # OP Sepolia    → localhost:8546
```

Anvil pre-funds and unlocks `0xf39Fd6e5...fFb92266` — the same address the mock
connector is configured with. Chain state is in-memory and resets whenever anvil
restarts.

There is nothing to configure: `config/wagmi.ts` derives the RPC host from
Expo's dev-server address, which is the machine running Metro — the same one
running anvil. That matters because `localhost` only reaches the dev machine
from the iOS simulator; an Android emulator resolves it to the emulator itself,
and a physical device to the device.

The second node is only needed if you want to send or sign **while on OP
Sepolia** — switching chains itself works without any node, since the mock
connector handles `wallet_switchEthereumChain` internally.

You can skip this step entirely if you only need the **Direct SDK Testing**
buttons, which call the SDK directly with no chain involved.

5. Start the development server:

```bash
pnpm start
```

### Running on Web

Press `w` in the terminal to open the app in your web browser.

### Running on Simulator/Emulator

Since this app uses native modules (AsyncStorage, etc.), you need to run it on a simulator/emulator or physical device:

- **iOS Simulator**: Press `i` in the terminal (requires Xcode)
- **Android Emulator**: Press `a` in the terminal (requires Android Studio)

> **Note**: Expo Go is not supported for this project due to native module dependencies. You must use the development build or run on a simulator.

### Running on Physical Device

For physical devices, you'll need to create a development build:

```bash
# iOS
pnpm ios

# Android
pnpm android
```

## Troubleshooting

### iOS build fails

Make sure you have CocoaPods installed and run:

```bash
cd ios && pod install && cd ..
```

### Android build fails

Make sure you have the Android SDK installed and `ANDROID_HOME` environment variable set.

### Send Tx or Sign Message fails

A connection error means anvil isn't running — start it as described in
[step 4](#installation). Nothing else needs configuring.

`-32601 rpc method is unsupported` or `unknown account` means the Mock Wallet
reached a public RPC instead of a local node. Check that `config/wagmi.ts` still
overrides `rpcUrls` on the chain objects — overriding `transports` alone has no
effect, since the mock connector reads the URL off the chain.

## Project Structure

```
├── app/
│   ├── _layout.tsx      # Root layout with FormoAnalyticsProvider and wagmi
│   ├── index.tsx        # Home screen
│   ├── wallet.tsx       # Wallet connection, signing, and transactions
│   ├── events.tsx       # Custom event tracking demo screen
│   └── settings.tsx     # Privacy settings screen
├── config/
│   ├── formo.ts         # Formo Analytics configuration
│   └── wagmi.ts         # wagmi configuration for wallet integration
└── assets/              # App assets (icons, images)
```

## Configuration

### Formo Analytics

Edit `config/formo.ts` to customize the SDK configuration:

```typescript
export const formoOptions: Options = {
  // App information
  app: {
    name: "Your App Name",
    version: "1.0.0",
  },

  // Event batching
  flushAt: 10,
  flushInterval: 15000,

  // Logging
  logger: {
    enabled: __DEV__,
    levels: ["debug", "info", "warn", "error"],
  },
};
```

## Usage Examples

### Track Screen Views

```typescript
import { useFormo } from "@formo/analytics-react-native";
import { useEffect } from "react";

function MyScreen() {
  const formo = useFormo();

  useEffect(() => {
    formo.screen("MyScreen", {
      category: "main",
      source: "navigation",
    });
  }, [formo]);

  return <View>...</View>;
}
```

### Track Custom Events

```typescript
const formo = useFormo();

// Simple event
formo.track("button_pressed", {
  buttonName: "signup",
  screen: "home",
});

// Revenue event
formo.track("purchase_completed", {
  revenue: 99.99,
  currency: "USD",
  productId: "nft-001",
});

// Points event
formo.track("achievement_unlocked", {
  points: 500,
  achievementId: "first_tx",
});
```

### Automatic Wallet Event Tracking (wagmi)

When using wagmi, wallet events are automatically tracked by the SDK. Just pass your wagmi config and query client to the Formo options:

```typescript
import { createConfig } from "wagmi";
import { QueryClient } from "@tanstack/react-query";

const wagmiConfig = createConfig({ /* ... */ });
const queryClient = new QueryClient();

const formoOptions = {
  // ... other options
  wagmi: {
    config: wagmiConfig,
    queryClient,
  },
};
```

The SDK will automatically track:
- **Connect events** when a wallet connects
- **Disconnect events** when a wallet disconnects
- **Signature events** when messages are signed (requested, confirmed, rejected)
- **Transaction events** when transactions are sent (started, broadcasted, confirmed, rejected)
- **Chain change events** when the user switches networks

No manual tracking code is needed for wallet interactions.

### Consent Management

```typescript
const formo = useFormo();

// Check if user has opted out
const isOptedOut = formo.hasOptedOutTracking();

// Opt out of tracking
formo.optOutTracking();

// Opt back in
formo.optInTracking();
```

## Resources

- [Formo Documentation](https://docs.formo.so)
- [Formo React Native SDK](https://github.com/getformo/sdk-react-native)
- [Expo Documentation](https://docs.expo.dev)

## License

MIT
