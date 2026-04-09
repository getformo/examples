"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";
import { FormoAnalyticsProvider } from "@formo/analytics";

import { getConfig } from "@/wagmi";

// Demo write key - replace with your own from https://app.formo.so
const FORMO_WRITE_KEY = process.env.NEXT_PUBLIC_FORMO_WRITE_KEY || "demo-key";

export function Providers(props: { children: ReactNode; initialState?: State }) {
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config} initialState={props.initialState}>
      <QueryClientProvider client={queryClient}>
        <FormoAnalyticsProvider
          writeKey={FORMO_WRITE_KEY}
          options={{
            flushInterval: 5000,
            // Enable tracking on localhost for testing
            tracking: true,
            autocapture: {
              connect: true,
              disconnect: true,
              signature: true,
              transaction: true,
              chain: true,
            },
            wagmi: {
              config,
              queryClient,
            },
            logger: {
              enabled: true,
              levels: ["error", "warn", "info"],
            },
          }}
        >
          {props.children}
        </FormoAnalyticsProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
