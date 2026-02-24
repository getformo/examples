"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState, useMemo, useEffect } from "react";
import { type State, WagmiProvider, useAccount } from "wagmi";
import { FormoAnalyticsProvider, useFormo } from "@formo/analytics";

import { getConfig } from "../wagmi.config";

function FormoIdentify({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const formo = useFormo();

  useEffect(() => {
    if (address) {
      formo.identify({ address });
    }
  }, [address, formo]);

  return <>{children}</>;
}

type Props = {
  children: ReactNode;
  initialState: State | undefined;
};

export function Providers({ children, initialState }: Props) {
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(() => new QueryClient());

  // Memoize analytics options to prevent re-initialization
  const analyticsOptions = useMemo(
    () => ({
      wagmi: {
        config: config,
        queryClient: queryClient,
      },
      tracking: true,
      flushInterval: 5000,
      logger: {
        enabled: true,
        levels: ["debug", "info", "error", "warn"] as ("debug" | "info" | "error" | "warn")[],
      },
      autocapture: {
        connect: true,
        disconnect: true,
        chain: true,
        signature: true,
        transaction: true,
      },
    }),
    [config, queryClient]
  );

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <FormoAnalyticsProvider
          writeKey={process.env.NEXT_PUBLIC_FORMO_WRITE_KEY || "test_write_key"}
          options={analyticsOptions}
        >
          <FormoIdentify>{children}</FormoIdentify>
        </FormoAnalyticsProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
