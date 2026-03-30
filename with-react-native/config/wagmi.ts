import { http, createConfig } from "wagmi";
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

export const chains = [baseSepolia, optimismSepolia] as const;

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
