// WalletConnect compat must be imported before wagmi
import "@walletconnect/react-native-compat";
import "react-native-get-random-values";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FormoAnalyticsProvider } from "@formo/react-native-analytics";
import { FORMO_WRITE_KEY, createFormoOptions } from "@/config/formo";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/config/wagmi";

// Create query client for React Query
const queryClient = new QueryClient();

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
