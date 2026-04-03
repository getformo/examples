"use client";

import { useMemo } from "react";
import { useClientStore } from "@solana/react-hooks";
import { SOLANA_CHAIN_IDS, type SolanaCluster } from "@formo/analytics";
import { clusterFromEndpoint } from "@/lib/solana";

/**
 * Returns the current cluster and Formo chain ID derived from
 * the live RPC endpoint, so they stay in sync after a network switch.
 */
export function useCurrentCluster() {
  const endpoint = useClientStore((s) => s.cluster.endpoint);

  return useMemo(() => {
    const cluster: SolanaCluster = clusterFromEndpoint(endpoint);
    const chainId: number = SOLANA_CHAIN_IDS[cluster];
    const explorerCluster = cluster === "mainnet-beta" ? "mainnet" : cluster;
    return { cluster, chainId, explorerCluster };
  }, [endpoint]);
}
