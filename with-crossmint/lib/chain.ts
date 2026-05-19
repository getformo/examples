/**
 * The chain this example's Crossmint embedded wallet is created on.
 *
 * It must match `NEXT_PUBLIC_CHAIN` in your `.env` (default: `base-sepolia`).
 * Crossmint's wallet object exposes the chain as a string (`wallet.chain`),
 * but Formo Analytics events expect a numeric EVM chain ID — so we keep the
 * mapping in one place here.
 */
export const CHAIN_NAME = "base-sepolia";

/** Base Sepolia testnet chain ID. */
export const CHAIN_ID = 84532;
