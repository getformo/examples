/**
 * Chains this example supports, mapped to their numeric EVM chain IDs.
 *
 * Keys must be valid Crossmint `EVMSmartWalletChain` values — see:
 * https://docs.crossmint.com/introduction/supported-chains
 *
 * Set `NEXT_PUBLIC_CHAIN` in your `.env` to one of these keys (default:
 * `base-sepolia`). The matching `CHAIN_ID` is used for all Formo event
 * payloads.
 */
export const SUPPORTED_CHAINS = {
  "base-sepolia": 84532,
  base: 8453,
  polygon: 137,
  optimism: 10,
} as const satisfies Record<string, number>;

export type SupportedChain = keyof typeof SUPPORTED_CHAINS;

/** The chain this example is configured to use (from NEXT_PUBLIC_CHAIN). */
export const CHAIN_NAME: SupportedChain =
  (process.env.NEXT_PUBLIC_CHAIN ?? "base-sepolia") as SupportedChain;

/** Numeric EVM chain ID for Formo events. Falls back to Base Sepolia. */
export const CHAIN_ID: number =
  SUPPORTED_CHAINS[CHAIN_NAME] ?? SUPPORTED_CHAINS["base-sepolia"];
