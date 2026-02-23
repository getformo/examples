# Formo Analytics React Native Example

This is an example React Native app demonstrating the [@formo/react-native-analytics](https://github.com/getformo/sdk-react-native) SDK.

## Features

- **Screen Tracking**: Track screen views for navigation analytics
- **Custom Event Tracking**: Send custom events with properties
- **Semantic Events**: Track revenue, points, and volume events
- **Automatic Wallet Event Tracking**: Wallet connect, disconnect, signatures, and transactions are automatically tracked via wagmi integration
- **Consent Management**: Built-in opt-out/opt-in functionality for GDPR compliance

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended), npm, or yarn
- Expo CLI (`npm install -g expo-cli`)
- Xcode (for iOS development)
- Android Studio (for Android development)
- iOS Simulator or Android Emulator (Expo Go does not support custom native modules)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/getformo/formo-examples-react-native.git
cd formo-examples-react-native
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

4. Start the development server:

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

## Local SDK Development

If you're developing the `@formo/react-native-analytics` SDK locally, this project is configured to use a linked local package.

### Setup for Local SDK Development

1. Ensure you have the SDK repository cloned as a sibling directory:

```
parent-directory/
├── formo-example-react-native/   # This project
└── sdk-react-native/             # The SDK (https://github.com/getformo/sdk-react-native)
```

2. Build the SDK first:

```bash
cd ../sdk-react-native
pnpm install
pnpm build
```

3. Install dependencies in this project (the link will resolve automatically):

```bash
cd ../formo-example-react-native
pnpm install
```

4. When you make changes to the SDK, rebuild it:

```bash
cd ../sdk-react-native
pnpm build
```

Then restart the Metro bundler in this project (press `r` in the terminal or restart with `pnpm start --clear`).

### Switching to Published Package

To use the published npm package instead of the local link, update `package.json`:

```diff
- "@formo/react-native-analytics": "link:../sdk-react-native",
+ "@formo/react-native-analytics": "^1.0.0",
```

Then reinstall dependencies:

```bash
pnpm install
```

## Troubleshooting

### Metro bundler can't find the linked package

If you see errors about the SDK not being found:

1. Make sure the SDK is built (`pnpm build` in the SDK directory)
2. Clear the Metro cache: `pnpm start --clear`
3. Delete `node_modules` and reinstall: `rm -rf node_modules && pnpm install`

### "Unable to resolve module" errors

This usually means the SDK hasn't been built. Run `pnpm build` in the SDK directory.

### iOS build fails

Make sure you have CocoaPods installed and run:

```bash
cd ios && pod install && cd ..
```

### Android build fails

Make sure you have the Android SDK installed and `ANDROID_HOME` environment variable set.

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
import { useFormo } from "@formo/react-native-analytics";
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
