import { tempoWallet } from "accounts/wagmi";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { tempo, tempoModerato } from "wagmi/chains";

export function getConfig() {
  return createConfig({
    chains: [tempo, tempoModerato],
    connectors: [tempoWallet({ testnet: true })],
    multiInjectedProviderDiscovery: false,
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [tempo.id]: http(),
      [tempoModerato.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
