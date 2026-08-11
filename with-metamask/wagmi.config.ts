import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { metaMask } from "@wagmi/connectors";
import { defineChain } from "viem";

// Define only the chains this example uses. Importing the aggregate
// `wagmi/chains` barrel makes webpack traverse every Viem chain—including
// Tempo's dynamic WASM loader—and produces a critical-dependency warning.
const lineaSepolia = defineChain({
  id: 59_141,
  name: "Linea Sepolia Testnet",
  nativeCurrency: { name: "Linea Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.sepolia.linea.build"] } },
  blockExplorers: {
    default: { name: "LineaScan", url: "https://sepolia.lineascan.build" },
  },
  testnet: true,
});

const linea = defineChain({
  id: 59_144,
  name: "Linea Mainnet",
  nativeCurrency: { name: "Linea Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.linea.build"] } },
  blockExplorers: {
    default: { name: "LineaScan", url: "https://lineascan.build" },
  },
});

const mainnet = defineChain({
  id: 1,
  name: "Ethereum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://ethereum.reth.rs/rpc"] } },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://etherscan.io" },
  },
});

export function getConfig() {
  return createConfig({
    chains: [lineaSepolia, linea, mainnet],
    connectors: [metaMask()],
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [lineaSepolia.id]: http(),
      [linea.id]: http(),
      [mainnet.id]: http(),
    },
  });
}
