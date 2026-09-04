"use client";

import { useState } from "react";
import { useDisconnect, useWalletStatus } from "@solana/kit-plugin-wallet/react";
import type { SolanaCluster } from "@formo/analytics";
import { useCurrentCluster } from "@/hooks/useCurrentCluster";
import { useSolanaApp } from "@/context/SolanaAppProvider";

const NETWORKS: { label: string; cluster: SolanaCluster }[] = [
  { label: "Devnet", cluster: "devnet" },
  { label: "Mainnet", cluster: "mainnet-beta" },
  { label: "Testnet", cluster: "testnet" },
];

export function NetworkSwitcher() {
  const { client } = useSolanaApp();
  const { cluster, setCluster } = useCurrentCluster();
  const status = useWalletStatus(client);
  const disconnect = useDisconnect(client);
  const [isSwitching, setIsSwitching] = useState(false);

  const onChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCluster = event.target.value as SolanaCluster;
    if (nextCluster === cluster) return;

    setIsSwitching(true);
    try {
      if (status === "connected" || status === "reconnecting") {
        await disconnect.dispatchAsync();
      }
      setCluster(nextCluster);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <select
      value={cluster}
      onChange={(event) => void onChange(event)}
      disabled={
        isSwitching || disconnect.isRunning || status === "connecting"
      }
      aria-busy={isSwitching}
      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {NETWORKS.map((network) => (
        <option key={network.cluster} value={network.cluster}>
          {network.label}
        </option>
      ))}
    </select>
  );
}
