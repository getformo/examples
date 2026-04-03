import { createClient, autoDiscover } from "@solana/client";
import { SOLANA_CHAIN_IDS, type SolanaCluster } from "@formo/analytics";

/**
 * The configured cluster for this app.
 * Set via NEXT_PUBLIC_SOLANA_CLUSTER env var, defaults to "devnet".
 * When using a custom RPC (NEXT_PUBLIC_SOLANA_RPC_URL), set this env var
 * to match the cluster the RPC serves.
 */
export const configuredCluster: SolanaCluster =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as SolanaCluster) || "devnet";

const customEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;

export const client = createClient({
  ...(customEndpoint
    ? { endpoint: customEndpoint }
    : { cluster: configuredCluster === "mainnet-beta" ? "mainnet" : configuredCluster }),
  walletConnectors: autoDiscover(),
});

/**
 * The Formo chain ID for the configured cluster.
 */
export const configuredChainId: number = SOLANA_CHAIN_IDS[configuredCluster];

/**
 * Detect the cluster moniker from an RPC endpoint URL.
 * Falls back to `configuredCluster` when the endpoint is unrecognisable.
 */
export function clusterFromEndpoint(endpoint: string): SolanaCluster {
  const lower = endpoint.toLowerCase();
  if (lower.includes("devnet")) return "devnet";
  if (lower.includes("testnet")) return "testnet";
  if (lower.includes("mainnet")) return "mainnet-beta";
  return configuredCluster;
}
