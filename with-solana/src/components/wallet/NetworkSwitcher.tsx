"use client";

import { useWalletActions } from "@solana/react-hooks";
import { resolveCluster } from "@solana/client";
import { useCurrentCluster } from "@/hooks/useCurrentCluster";

const NETWORKS = [
  { label: "Devnet", moniker: "devnet" as const },
  { label: "Mainnet", moniker: "mainnet" as const },
  { label: "Testnet", moniker: "testnet" as const },
];

export function NetworkSwitcher() {
  const actions = useWalletActions();
  const { explorerCluster } = useCurrentCluster();

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const moniker = e.target.value as (typeof NETWORKS)[number]["moniker"];
    const resolved = resolveCluster({ moniker });
    await actions.setCluster(resolved.endpoint, {
      websocketEndpoint: resolved.websocketEndpoint,
    });
  };

  return (
    <select
      value={explorerCluster}
      onChange={onChange}
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
