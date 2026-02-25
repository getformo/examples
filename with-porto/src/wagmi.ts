import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { baseSepolia, sepolia } from "wagmi/chains";
import { porto } from "porto/wagmi";

export function getConfig() {
  return createConfig({
    // Porto only supports specific chains - see https://porto.sh/sdk/api/chains
    // Supported: mainnet, sepolia, base, baseSepolia, arbitrum, arbitrumSepolia,
    // optimism, optimismSepolia, polygon, bsc, celo, gnosis, berachain, etc.
    chains: [baseSepolia, sepolia],
    connectors: [porto()],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [baseSepolia.id]: http(),
      [sepolia.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
