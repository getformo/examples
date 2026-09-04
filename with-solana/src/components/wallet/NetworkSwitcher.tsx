"use client";

import { useRef, useState } from "react";
import { useWalletActions } from "@solana/react-hooks";
import { resolveCluster } from "@solana/client";
import type { SolanaCluster } from "@formo/analytics";
import { useCurrentCluster } from "@/hooks/useCurrentCluster";
import { setWalletStandardCluster } from "@/lib/solana";

const NETWORKS = [
  { label: "Devnet", moniker: "devnet" as const },
  { label: "Mainnet", moniker: "mainnet" as const },
  { label: "Testnet", moniker: "testnet" as const },
];

export function NetworkSwitcher() {
  const actions = useWalletActions();
  const { explorerCluster } = useCurrentCluster();
  const latestSwitch = useRef(0);
  const [isSwitching, setIsSwitching] = useState(false);

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const switchId = ++latestSwitch.current;
    const moniker = e.target.value as (typeof NETWORKS)[number]["moniker"];
    const resolved = resolveCluster({ moniker });
    const cluster: SolanaCluster =
      moniker === "mainnet" ? "mainnet-beta" : moniker;

    setIsSwitching(true);
    try {
      // A Wallet Standard session captures its transaction chain when it is
      // created. Disconnect before switching so the next connection uses the
      // selected cluster instead of the wallet's first advertised chain.
      await actions.disconnectWallet();
      if (switchId !== latestSwitch.current) return;

      setWalletStandardCluster(cluster);
      await actions.setCluster(resolved.endpoint, {
        websocketEndpoint: resolved.websocketEndpoint,
      });
    } finally {
      if (switchId === latestSwitch.current) setIsSwitching(false);
    }
  };

  return (
    <select
      value={explorerCluster}
      onChange={onChange}
      disabled={isSwitching}
      aria-busy={isSwitching}
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
