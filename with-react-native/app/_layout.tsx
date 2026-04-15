// WalletConnect compat must be imported before wagmi
import "@walletconnect/react-native-compat";
import "react-native-get-random-values";

// Polyfill window.matchMedia for WalletConnect modal (browser API not in RN)
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

import { Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FormoAnalyticsProvider, useFormo } from "@formo/analytics-react-native";
import { FORMO_WRITE_KEY, createFormoOptions } from "@/config/formo";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/config/wagmi";

// Create query client for React Query
const queryClient = new QueryClient();

// Auto-fire formo.screen() whenever the active route changes.
function ScreenTracker() {
  const formo = useFormo();
  const segments = useSegments();

  useEffect(() => {
    const leaf = (segments as string[]).filter((s) => !s.startsWith("(")).pop();
    const name = !leaf || leaf === "index" ? "Home" : leaf.charAt(0).toUpperCase() + leaf.slice(1);
    formo.screen(name);
  }, [formo, segments]);

  return null;
}

export default function RootLayout() {
  // Create Formo options with wagmi integration for automatic event tracking
  const formoOptions = useMemo(
    () => createFormoOptions(wagmiConfig, queryClient),
    []
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <FormoAnalyticsProvider
            writeKey={FORMO_WRITE_KEY}
            asyncStorage={AsyncStorage}
            options={formoOptions}
          >
            <ScreenTracker />
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: "#1a1a2e",
                },
                headerTintColor: "#fff",
                contentStyle: {
                  backgroundColor: "#1a1a2e",
                },
              }}
            >
              <Stack.Screen
                name="index"
                options={{
                  title: "Formo Analytics Demo",
                }}
              />
              <Stack.Screen
                name="wallet"
                options={{
                  title: "Wallet",
                }}
              />
              <Stack.Screen
                name="events"
                options={{
                  title: "Track Events",
                }}
              />
              <Stack.Screen
                name="settings"
                options={{
                  title: "Settings",
                }}
              />
            </Stack>
          </FormoAnalyticsProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
