import { http, createConfig } from "wagmi";
import { baseSepolia, optimismSepolia } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";

// Get projectId from https://cloud.reown.com
const projectId = process.env.EXPO_PUBLIC_REOWN_PROJECT_ID || "YOUR_PROJECT_ID";

const metadata = {
  name: "Formo Analytics Demo",
  description: "Example React Native app demonstrating Formo Analytics SDK",
  url: "https://formo.so",
  icons: ["https://formo.so/icon.png"],
};

export const chains = [baseSepolia, optimismSepolia] as const;

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    walletConnect({
      projectId,
      metadata,
      showQrModal: true,
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [optimismSepolia.id]: http(),
  },
});
