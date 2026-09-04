"use client";

import { FormoAnalyticsProvider } from "@formo/analytics";
import { autoDiscover, createClient } from "@solana/client";
import { SolanaProvider } from "@solana/react-hooks";

export const client = createClient({
  cluster: "devnet",
  walletConnectors: autoDiscover(),
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SolanaProvider client={client}>
      <FormoAnalyticsProvider
        writeKey={process.env.NEXT_PUBLIC_FORMO_WRITE_KEY!}
        options={{
          evm: false,
          solana: { store: client.store as any },
        }}
      >
        {children}
      </FormoAnalyticsProvider>
    </SolanaProvider>
  );
}
