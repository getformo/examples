import React from "react";
import { OpenfortProvider, RecoveryMethod } from "@openfort/react";
import { getDefaultConfig, OpenfortWagmiBridge } from "@openfort/react/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig } from "wagmi";
import { base, baseSepolia } from "viem/chains";
import { AaveProvider } from "@aave/react";
import { FormoAnalyticsProvider } from "@formo/analytics";
import { aaveClient } from "./lib/aave";
import { getEnvironmentStatus } from "./utils/envValidation";

const queryClient = new QueryClient();

const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "Openfort Wallet App",
    walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "demo",
    chains: [base, baseSepolia],
    ssr: false,
  })
);

export function Providers({ children }: { children: React.ReactNode }) {
  const envStatus = getEnvironmentStatus();

  // Only create config and render providers if environment is valid
  if (!envStatus.isValid) {
    return <>{children}</>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        {/*
          Formo Analytics Provider with wagmi integration.
          Openfort drives wagmi via OpenfortWagmiBridge, so all wallet events
          (connect, disconnect, chain, signature, transaction) are auto-captured.
        */}
        <FormoAnalyticsProvider
          writeKey={import.meta.env.VITE_FORMO_WRITE_KEY}
          options={{
            wagmi: {
              config: wagmiConfig,
              queryClient,
            },
            // Capture every wallet event type.
            autocapture: true,
            // Track on localhost too (the SDK skips localhost by default).
            tracking: true,
            // Log SDK activity to the console — handy while developing.
            logger: {
              enabled: true,
              levels: ["info", "warn", "error"],
            },
          }}
        >
          <OpenfortWagmiBridge>
            <AaveProvider client={aaveClient}>
              <OpenfortProvider
                publishableKey={import.meta.env.VITE_OPENFORT_PUBLISHABLE_KEY}
                walletConfig={{
                  shieldPublishableKey: import.meta.env.VITE_OPENFORT_SHIELD_PUBLISHABLE_KEY,
                  createEncryptedSessionEndpoint: `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}/api/protected-create-encryption-session`,
                  ethereum: {
                    ethereumFeeSponsorshipId: import.meta.env.VITE_OPENFORT_FEE_SPONSORSHIP_ID || undefined,
                  },
                }}
                uiConfig={{
                  walletRecovery: {
                    defaultMethod: RecoveryMethod.PASSWORD,
                  },
                }}
              >
                {children}
              </OpenfortProvider>
            </AaveProvider>
          </OpenfortWagmiBridge>
        </FormoAnalyticsProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
} 