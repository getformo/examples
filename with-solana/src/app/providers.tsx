"use client";

import { ThemeProvider } from "next-themes";
import { FormoAnalyticsProvider } from "@formo/analytics";
import { SolanaAppProvider, useSolanaApp } from "@/context/SolanaAppProvider";

function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { cluster } = useSolanaApp();
  const options = {
    tracking: true,
    evm: false,
    solana: { cluster },
    logger: {
      enabled: true,
      levels: ["debug", "info", "warn", "error"] as Array<
        "debug" | "info" | "warn" | "error"
      >,
    },
  };

  return (
    <FormoAnalyticsProvider
      writeKey={process.env.NEXT_PUBLIC_FORMO_WRITE_KEY!}
      options={options}
    >
      {children}
    </FormoAnalyticsProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <SolanaAppProvider>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </SolanaAppProvider>
    </ThemeProvider>
  );
}
