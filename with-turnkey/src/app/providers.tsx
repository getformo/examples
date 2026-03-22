"use client";

// @ts-ignore — @turnkey/sdk-react is built for React 18; safe to use with React 19
import { TurnkeyProvider } from "@turnkey/sdk-react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FormoAnalyticsProvider } from "@formo/analytics";
import { ReactNode, useState } from "react";

import { wagmiConfig } from "@/config/wagmi";

export function Providers({ children }: { children: ReactNode }) {
  const turnkeyConfig = {
    apiBaseUrl: "https://api.turnkey.com",
    defaultOrganizationId: process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID ?? "",
    rpId: process.env.NEXT_PUBLIC_TURNKEY_RP_ID ?? "localhost",
    iframeUrl: "https://auth.turnkey.com",
    serverSignUrl: process.env.NEXT_PUBLIC_TURNKEY_SERVER_SIGN_URL,
  };
  const formoWriteKey = process.env.NEXT_PUBLIC_FORMO_WRITE_KEY;
  const [queryClient] = useState(() => new QueryClient());

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

  // Provider order: Turnkey -> Wagmi -> QueryClient -> Formo -> children
  return (
    // @ts-ignore — @turnkey/sdk-react is built for React 18
    <TurnkeyProvider config={turnkeyConfig}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {innerContent}
        </QueryClientProvider>
      </WagmiProvider>
    </TurnkeyProvider>
  );
}
