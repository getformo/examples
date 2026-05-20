import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  linea,
  lineaSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  sepolia,
} from 'viem/chains';

/** A small set of common EVM chains, enough to name the network in this demo. */
const KNOWN_CHAINS = [
  mainnet,
  sepolia,
  base,
  baseSepolia,
  optimism,
  optimismSepolia,
  arbitrum,
  arbitrumSepolia,
  polygon,
  polygonAmoy,
  linea,
  lineaSepolia,
];

/** Human-readable network name for a chain id, with a numeric fallback. */
export function chainName(id: number | null): string {
  if (id == null) return '';
  return KNOWN_CHAINS.find((chain) => chain.id === id)?.name ?? `Unknown network (${id})`;
}
