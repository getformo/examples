import { createClient, autoDiscover } from "@solana/client";
import { SOLANA_CHAIN_IDS, type SolanaCluster } from "@formo/analytics";

const cluster = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as "devnet" | "mainnet" | "testnet" | "localnet") || "devnet";
const customEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;

export const client = createClient({
  ...(customEndpoint ? { endpoint: customEndpoint } : { cluster }),
  walletConnectors: autoDiscover(),
});

/**
 * Derive the Solana cluster name from an RPC endpoint URL.
 */
export function clusterFromEndpoint(endpoint: string): SolanaCluster {
  const lower = endpoint.toLowerCase();
  if (lower.includes("devnet")) return "devnet";
  if (lower.includes("testnet")) return "testnet";
  if (lower.includes("localhost") || lower.includes("127.0.0.1")) return "localnet";
  return "mainnet-beta";
}

/**
 * Derive the numeric Formo chain ID from an RPC endpoint URL.
 */
export function chainIdFromEndpoint(endpoint: string): number {
  return SOLANA_CHAIN_IDS[clusterFromEndpoint(endpoint)];
}

/**
 * Generate a random Solana-like base58 address for demo transactions.
 */
export function randomAddress(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return encodeBase58(bytes);
}

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase58(bytes: Uint8Array): string {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let str = "";
  for (const b of bytes) {
    if (b === 0) str += "1";
    else break;
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    str += BASE58_ALPHABET[digits[i]];
  }
  return str;
}
