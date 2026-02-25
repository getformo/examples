"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type Network = "devnet" | "mainnet-beta";

interface NetworkConfigurationContextState {
  networkConfiguration: Network;
  setNetworkConfiguration: (network: Network) => void;
}

const NetworkConfigurationContext = createContext<NetworkConfigurationContextState>({
  networkConfiguration: "devnet",
  setNetworkConfiguration: () => {},
});

export function useNetworkConfiguration() {
  return useContext(NetworkConfigurationContext);
}

const VALID_NETWORKS: Network[] = ["devnet", "mainnet-beta"];

export function isValidNetwork(value: string | undefined): value is Network {
  return VALID_NETWORKS.includes(value as Network);
}

export function NetworkConfigurationProvider({ children }: { children: ReactNode }) {
  const envCluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER;
  const [networkConfiguration, setNetworkConfiguration] = useState<Network>(
    isValidNetwork(envCluster) ? envCluster : "devnet"
  );

  return (
    <NetworkConfigurationContext.Provider
      value={{ networkConfiguration, setNetworkConfiguration }}
    >
      {children}
    </NetworkConfigurationContext.Provider>
  );
}
