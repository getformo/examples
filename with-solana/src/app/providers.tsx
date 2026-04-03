"use client";

import { ThemeProvider } from "next-themes";
import { SolanaProvider } from "@solana/react-hooks";
import { FormoAnalyticsProvider } from "@formo/analytics";
import { client } from "@/lib/solana";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <SolanaProvider client={client}>
        <FormoAnalyticsProvider
          writeKey={process.env.NEXT_PUBLIC_FORMO_WRITE_KEY!}
          options={{
            tracking: true,
            evm: false,
            solana: {
              store: client.store as any,
            },
            logger: {
              enabled: true,
              levels: ["debug", "info", "warn", "error"],
            },
          }}
        >
          {children}
        </FormoAnalyticsProvider>
      </SolanaProvider>
    </ThemeProvider>
  );
}
