"use client";

import { useClientStore } from "@solana/react-hooks";

export function NetworkSwitcher() {
  const endpoint = useClientStore((s) => s.cluster.endpoint);

  // Detect current cluster from endpoint
  const cluster = endpoint.includes("devnet")
    ? "Devnet"
    : endpoint.includes("testnet")
      ? "Testnet"
      : endpoint.includes("localhost") || endpoint.includes("127.0.0.1")
        ? "Localnet"
        : "Mainnet";

  return (
    <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
      {cluster}
    </div>
  );
}
