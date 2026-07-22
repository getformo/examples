import { http, createConfig } from "wagmi";
import type { Chain } from "viem";
import Constants from "expo-constants";
import { baseSepolia, optimismSepolia } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";
import { mock } from "@wagmi/core";

// Get projectId from https://cloud.reown.com
const projectId = process.env.EXPO_PUBLIC_REOWN_PROJECT_ID || "YOUR_PROJECT_ID";

const metadata = {
  name: "Formo Analytics Demo",
  description: "Example React Native app demonstrating Formo Analytics SDK",
  url: "https://formo.so",
  icons: ["https://formo.so/icon.png"],
};

// Mock wallet address for testing (Hardhat default account #0)
const MOCK_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as const;

// The `mock` connector only intercepts a few RPC methods; everything else —
// including eth_sendTransaction and eth_sign — is forwarded to a real node.
// Public RPCs hold no keys, so against them "Send Tx" fails with -32601 (viem
// then retries as wallet_sendTransaction, also unsupported) and "Sign Message"
// fails with "unknown account". Pointing at a local anvil that has MOCK_ADDRESS
// unlocked fixes both:
//
//   anvil --chain-id 84532                  # Base Sepolia
//   anvil --chain-id 11155420 --port 8546   # OP Sepolia
//
// The override has to happen on the CHAIN, not on `transports`. The mock
// connector never reads wagmi's transports — it takes the URL straight off
// `chain.rpcUrls.default.http[0]` (see @wagmi/core/src/connectors/mock.ts,
// `getProvider`). Overriding only the transport silently leaves the mock wallet
// pointed at the public endpoint.
//
// These are derived rather than env-configured because pointing at a local node
// costs nothing when one isn't running: no hook in this app reads chain state,
// so the only calls that reach these URLs are the Mock Wallet's Send Tx and
// Sign Message — which don't work without a local node either way. Without
// anvil you get a connection error instead of -32601; both mean "start anvil".
//
// The host cannot be hardcoded to localhost: that only resolves to the dev
// machine on the iOS simulator. An Android emulator resolves localhost to
// itself (the host is reachable at 10.0.2.2), and a physical device resolves it
// to the device. Expo reports the machine serving the JS bundle in `hostUri` —
// necessarily the same machine the README says to run anvil on — so use that
// and every target reaches the right host. Falls back to localhost when
// hostUri is absent (production builds, where none of this applies anyway).
const devHost = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
const localRpc = (port: number) => `http://${devHost}:${port}`;
const withRpcUrl = <T extends Chain>(chain: T, url: string): T => ({
  ...chain,
  rpcUrls: {
    ...chain.rpcUrls,
    default: { ...chain.rpcUrls.default, http: [url] },
  },
});

export const chains = [
  withRpcUrl(baseSepolia, localRpc(8545)),
  withRpcUrl(optimismSepolia, localRpc(8546)),
] as const;

export const wagmiConfig = createConfig({
  chains,
  // Disable Multi-Injected Provider Discovery (EIP-6963) — it's browser-only
  // and calls window.addEventListener which doesn't exist in React Native
  multiInjectedProviderDiscovery: false,
  connectors: [
    // Mock connector for testing wallet events without a real wallet
    mock({
      accounts: [MOCK_ADDRESS],
    }),
    walletConnect({
      projectId,
      metadata,
      // Disable WalletConnect's built-in QR modal — it uses Lit web components
      // (HTMLElement, customElements) that don't exist in React Native.
      showQrModal: false,
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [optimismSepolia.id]: http(),
  },
});
