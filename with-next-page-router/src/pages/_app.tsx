import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { AppProps } from "next/app";
import { Montserrat } from "next/font/google";
import { useEffect } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useAccount } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
  RainbowKitSiweNextAuthProvider,
  GetSiweMessageOptions,
} from "@rainbow-me/rainbowkit-siwe-next-auth";
import { SessionProvider } from "next-auth/react";
import { useFormo } from "@formo/analytics";

import { config } from "../wagmi";

import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/footer";
import AnalyticsProvider from "@/providers/AnalyticsProvider";

const queryClient = new QueryClient();

const getSiweMessageOptions: GetSiweMessageOptions = () => ({
  statement: "Sign in to Rainbowkit with Ethereum",
});

export const monsterrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: "500",
});

// Component to handle user identification with Formo
function FormoIdentify({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const formo = useFormo();

  useEffect(() => {
    if (address && formo) {
      formo.identify({ address });
    }
  }, [address, formo]);

  return <>{children}</>;
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <SessionProvider session={pageProps.session}>
        <QueryClientProvider client={queryClient}>
          <AnalyticsProvider
            writeKey={process.env.NEXT_PUBLIC_FORMO_WRITE_KEY || "YOUR_WRITE_KEY"}
            wagmiConfig={config}
            queryClient={queryClient}
          >
            <RainbowKitSiweNextAuthProvider
              getSiweMessageOptions={getSiweMessageOptions}
            >
              <RainbowKitProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  <FormoIdentify>
                    <Layout>
                      <Component {...pageProps} />
                    </Layout>
                  </FormoIdentify>
                </ThemeProvider>
              </RainbowKitProvider>
            </RainbowKitSiweNextAuthProvider>
          </AnalyticsProvider>
        </QueryClientProvider>
      </SessionProvider>
    </WagmiProvider>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={monsterrat.className}>
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

export default MyApp;
