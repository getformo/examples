"use client";

import { useRef, useState } from "react";
import { useWalletActions, useWalletConnection } from "@solana/react-hooks";
import { resolveCluster } from "@solana/client";
import { useCurrentCluster } from "@/hooks/useCurrentCluster";

const NETWORKS = [
  { label: "Devnet", moniker: "devnet" as const },
  { label: "Mainnet", moniker: "mainnet" as const },
  { label: "Testnet", moniker: "testnet" as const },
];

export function NetworkSwitcher() {
  const actions = useWalletActions();
  const { isReady, status } = useWalletConnection();
  const { explorerCluster } = useCurrentCluster();
  const switchingRef = useRef(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const canSwitchNetwork = status === "disconnected" || status === "error";

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const moniker = e.target.value as (typeof NETWORKS)[number]["moniker"];
    if (moniker === explorerCluster || switchingRef.current) return;

    switchingRef.current = true;
    setIsSwitching(true);
    const resolved = resolveCluster({ moniker });
    try {
      await actions.setCluster(resolved.endpoint, {
        websocketEndpoint: resolved.websocketEndpoint,
      });
    } finally {
      switchingRef.current = false;
      setIsSwitching(false);
    }
  };

  return (
    <select
      value={explorerCluster}
      onChange={(event) => void onChange(event)}
      disabled={
        !isReady ||
        isSwitching ||
        !canSwitchNetwork
      }
      aria-busy={!isReady || isSwitching}
      title={
        status === "connected"
          ? "Disconnect your wallet before switching networks"
          : undefined
      }
      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {NETWORKS.map((n) => (
        <option key={n.moniker} value={n.moniker}>
          {n.label}
        </option>
      ))}
    </select>
  );
}
