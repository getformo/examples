"use client";

// @ts-ignore — @turnkey/sdk-react is built for React 18; safe to use with React 19
import { TurnkeyProvider } from "@turnkey/sdk-react";
import { FormoAnalyticsProvider } from "@formo/analytics";
import { ReactNode, createContext, useContext, useState, useMemo } from "react";

import type { EIP1193Provider } from "viem";

// Context to share the EIP-1193 provider across the app
type WalletContextType = {
  provider: EIP1193Provider | null;
  setProvider: (provider: EIP1193Provider | null) => void;
  walletState: WalletState;
  setWalletState: (state: WalletState) => void;
};

type WalletState = {
  address: string | null;
  chainId: number | null;
  organizationId: string | null;
  userId: string | null;
};

const WalletContext = createContext<WalletContextType>({
  provider: null,
  setProvider: () => {},
  walletState: { address: null, chainId: null, organizationId: null, userId: null },
  setWalletState: () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const turnkeyConfig = {
    apiBaseUrl: "https://api.turnkey.com",
    defaultOrganizationId: process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID ?? "",
    rpId: process.env.NEXT_PUBLIC_TURNKEY_RP_ID ?? "localhost",
    iframeUrl: "https://auth.turnkey.com",
  };
  const formoWriteKey = process.env.NEXT_PUBLIC_FORMO_WRITE_KEY;

  const [provider, setProvider] = useState<EIP1193Provider | null>(null);
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    chainId: null,
    organizationId: null,
    userId: null,
  });

  const walletContextValue = useMemo(
    () => ({ provider, setProvider, walletState, setWalletState }),
    [provider, walletState]
  );

  if (!turnkeyConfig.defaultOrganizationId) {
    console.error("Missing NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID environment variable");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-900/20 rounded-lg border border-red-500/50">
          <h2 className="text-xl font-bold text-red-400">Configuration Error</h2>
          <p className="mt-2 text-red-300">
            Missing NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID environment variable.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Copy .env.example to .env and add your Turnkey Organization ID.
          </p>
        </div>
      </div>
    );
  }

  if (!formoWriteKey) {
    console.warn("Missing NEXT_PUBLIC_FORMO_WRITE_KEY. Formo analytics will be disabled.");
  }

  // Formo options: when a provider is available, pass it for EIP-1193 autocapture.
  // When provider changes from null -> value, the optionsKey changes and Formo reinitializes.
  const formoOptions = {
    ...(provider ? { provider: provider as any } : {}),
    autocapture: true,
    tracking: true,
    logger: {
      enabled: true,
      levels: ["info", "warn", "error"] as ("info" | "warn" | "error")[],
    },
  };

  const innerContent = formoWriteKey ? (
    <FormoAnalyticsProvider writeKey={formoWriteKey} options={formoOptions}>
      {children}
    </FormoAnalyticsProvider>
  ) : (
    children
  );

  return (
    // @ts-ignore — @turnkey/sdk-react is built for React 18
    <TurnkeyProvider config={turnkeyConfig}>
      <WalletContext.Provider value={walletContextValue}>
        {innerContent}
      </WalletContext.Provider>
    </TurnkeyProvider>
  );
}
