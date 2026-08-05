"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FormoAnalyticsProvider } from "@formo/analytics";
import { sepolia, mainnet, polygon, arbitrum, optimism, base } from "viem/chains";
import { ReactNode, useState } from "react";

import { wagmiConfig } from "@/config/wagmi";
import { PRIVY_LOGIN_METHODS } from "@/config/privy";

const supportedChains = [mainnet, sepolia, polygon, arbitrum, optimism, base];

export function Providers({ children }: { children: ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const formoWriteKey = process.env.NEXT_PUBLIC_FORMO_WRITE_KEY;

  // Create query client once per component instance
  const [queryClient] = useState(() => new QueryClient());

  if (!privyAppId) {
    console.error("Missing NEXT_PUBLIC_PRIVY_APP_ID environment variable");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-900/20 rounded-lg border border-red-500/50">
          <h2 className="text-xl font-bold text-red-400">Configuration Error</h2>
          <p className="mt-2 text-red-300">
            Missing NEXT_PUBLIC_PRIVY_APP_ID environment variable.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Copy .env.example to .env and add your Privy App ID.
          </p>
        </div>
      </div>
    );
  }

  // Build the inner content (with or without Formo)
  const innerContent = formoWriteKey ? (
    <FormoAnalyticsProvider
      writeKey={formoWriteKey}
      options={{
        wagmi: {
          config: wagmiConfig,
          queryClient,
        },
        autocapture: true,
        tracking: true,
        logger: {
          enabled: true,
          levels: ["info", "warn", "error"],
        },
      }}
    >
      {children}
    </FormoAnalyticsProvider>
  ) : (
    children
  );

  // Provider order per Privy docs: Privy -> QueryClient -> Wagmi -> Formo -> children
  // Privy's WagmiProvider requires QueryClientProvider to be outside it
  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          // Match Formo's palette so Privy's own modals and the UserPill don't
          // read as a different product: lemon accent on Formo's near-black.
          // Values mirror --color-lemon-500 / --color-ink-500 in globals.css.
          theme: "#030712",
          accentColor: "#C1F005",
          showWalletLoginFirst: true,
        },
        // Single source of truth, shared with the account-linking UI so it only
        // offers providers this app actually has enabled.
        loginMethods: [...PRIVY_LOGIN_METHODS],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        supportedChains: supportedChains,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {innerContent}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
