"use client";

import { createConfig } from "@privy-io/wagmi";
import { mainnet, sepolia, polygon, arbitrum, optimism, base } from "viem/chains";
import { http } from "wagmi";

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
