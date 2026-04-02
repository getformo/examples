"use client";

import { ThemeProvider } from "next-themes";
import { SolanaProvider } from "@solana/react-hooks";
import { FormoProvider } from "@/contexts/FormoProvider";
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
        <FormoProvider>
          {children}
        </FormoProvider>
      </SolanaProvider>
    </ThemeProvider>
  );
}
