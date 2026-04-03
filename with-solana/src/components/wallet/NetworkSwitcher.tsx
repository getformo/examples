"use client";

import { useClientStore, useWalletActions } from "@solana/react-hooks";
import { resolveCluster } from "@solana/client";
import { configuredCluster } from "@/lib/solana";

const NETWORKS = [
  { label: "Devnet", moniker: "devnet" as const },
  { label: "Mainnet", moniker: "mainnet" as const },
  { label: "Testnet", moniker: "testnet" as const },
];

/** Map well-known RPC endpoints back to a moniker for display. */
function detectMoniker(endpoint: string): string {
  const lower = endpoint.toLowerCase();
  if (lower.includes("devnet")) return "devnet";
  if (lower.includes("testnet")) return "testnet";
  if (lower.includes("localhost") || lower.includes("127.0.0.1")) return "localnet";
  if (lower.includes("mainnet")) return "mainnet";
  // Unknown endpoint — fall back to the configured cluster
  return configuredCluster === "mainnet-beta" ? "mainnet" : configuredCluster;
}

export function NetworkSwitcher() {
  const endpoint = useClientStore((s) => s.cluster.endpoint);
  const actions = useWalletActions();
  const current = detectMoniker(endpoint);

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const moniker = e.target.value as (typeof NETWORKS)[number]["moniker"];
    const resolved = resolveCluster({ moniker });
    await actions.setCluster(resolved.endpoint, {
      websocketEndpoint: resolved.websocketEndpoint,
    });
  };

  return (
    <select
      value={current}
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
