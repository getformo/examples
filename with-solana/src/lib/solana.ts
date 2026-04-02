import { createClient, autoDiscover } from "@solana/client";

const cluster = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as "devnet" | "mainnet" | "testnet" | "localnet") || "devnet";
const customEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;

export const client = createClient({
  ...(customEndpoint ? { endpoint: customEndpoint } : { cluster }),
  walletConnectors: autoDiscover(),
});
