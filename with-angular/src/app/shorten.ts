/** Truncate a wallet address for display, e.g. `0x1234…abcd`. */
export function shortAddress(address: string | null): string {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
