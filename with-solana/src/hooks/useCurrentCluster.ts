import { SOLANA_CHAIN_IDS } from "@formo/analytics";
import { useSolanaApp } from "@/context/SolanaAppProvider";

/**
 * Returns the selected cluster and its corresponding Formo chain ID.
 */
export function useCurrentCluster() {
  const { cluster, setCluster } = useSolanaApp();
  const chainId: number = SOLANA_CHAIN_IDS[cluster];
  const explorerCluster = cluster === "mainnet-beta" ? "mainnet" : cluster;
  return { cluster, chainId, explorerCluster, setCluster };
}
