import {
  createClient,
  autoDiscover,
  type WalletConnector,
  type WalletSession,
} from "@solana/client";
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

function toWalletStandardChain(cluster: SolanaCluster): `solana:${string}` {
  return `solana:${cluster === "mainnet-beta" ? "mainnet" : cluster}`;
}

let walletStandardChain = toWalletStandardChain(configuredCluster);

/**
 * Keep newly-created Wallet Standard sessions on the same cluster as the RPC.
 * The connector reads this value when a wallet connects.
 */
export function setWalletStandardCluster(cluster: SolanaCluster): void {
  walletStandardChain = toWalletStandardChain(cluster);
}

/**
 * MetaMask currently uses its existing session scope for `signTransaction`,
 * which defaults to mainnet even when the Wallet Standard input names devnet.
 * Its `signAndSendTransaction` path does honor the requested chain, so expose
 * that path to framework-kit until MetaMask's signing path does the same.
 */
function preferChainAwareMetaMaskSession(
  connector: WalletConnector
): WalletConnector {
  if (!connector.name.toLowerCase().includes("metamask")) return connector;

  const descriptors = Object.getOwnPropertyDescriptors(connector);
  descriptors.connect = {
    ...descriptors.connect,
    value: async (options): Promise<WalletSession> => {
      const session = await connector.connect(options);
      if (!session.signTransaction || !session.sendTransaction) return session;

      const chainAwareSession = { ...session } as {
        -readonly [Key in keyof WalletSession]: WalletSession[Key];
      };
      delete chainAwareSession.signTransaction;
      return chainAwareSession;
    },
  };

  // Preserve live getters such as defaultChain instead of snapshotting them
  // through object spread when wrapping the connector.
  return Object.create(Object.getPrototypeOf(connector), descriptors);
}

const walletConnectors = autoDiscover({
  overrides: () => ({
    get defaultChain() {
      return walletStandardChain;
    },
  }),
}).map(preferChainAwareMetaMaskSession);

export const client = createClient({
  ...(customEndpoint
    ? { endpoint: customEndpoint }
    : {
        cluster:
          configuredCluster === "mainnet-beta" ? "mainnet" : configuredCluster,
      }),
  walletConnectors,
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
