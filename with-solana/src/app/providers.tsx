"use client";

import { ThemeProvider } from "next-themes";
import { WalletContextProvider } from "@/contexts/WalletContextProvider";
import { NetworkConfigurationProvider } from "@/contexts/NetworkConfigurationProvider";
import { FormoProvider } from "@/contexts/FormoProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <NetworkConfigurationProvider>
        <WalletContextProvider>
          <FormoProvider>
            {children}
          </FormoProvider>
        </WalletContextProvider>
      </NetworkConfigurationProvider>
    </ThemeProvider>
  );
}
