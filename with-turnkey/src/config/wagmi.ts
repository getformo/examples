"use client";

import { createConfig, http } from "wagmi";
import { mainnet, sepolia, polygon, arbitrum, optimism, base } from "viem/chains";

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum, optimism, base],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
});
