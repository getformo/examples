import { createClient } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";
import type { SolanaCluster } from "@formo/analytics";

/**
 * The configured cluster for this app.
 * Set via NEXT_PUBLIC_SOLANA_CLUSTER, and keep it aligned with a custom RPC.
 */
export const configuredCluster: SolanaCluster =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as SolanaCluster) || "devnet";

const customEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;

const RPC_ENDPOINTS: Record<SolanaCluster, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
  localnet: "http://localhost:8899",
};

function toWalletStandardChain(cluster: SolanaCluster): `solana:${string}` {
  return `solana:${cluster === "mainnet-beta" ? "mainnet" : cluster}`;
}

/** Build a Kit client whose wallet chain and RPC always use the same cluster. */
export function createSolanaClient(cluster: SolanaCluster) {
  const rpcUrl =
    cluster === configuredCluster && customEndpoint
      ? customEndpoint
      : RPC_ENDPOINTS[cluster];

  return createClient()
    .use(walletSigner({ chain: toWalletStandardChain(cluster) }))
    .use(solanaRpc({ rpcUrl }));
}

export type AppClient = ReturnType<typeof createSolanaClient>;
