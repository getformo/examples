import type { Options } from "@formo/react-native-analytics";
import type { Config } from "wagmi";
import type { QueryClient } from "@tanstack/react-query";

// Get your write key from https://app.formo.so
export const FORMO_WRITE_KEY =
  process.env.EXPO_PUBLIC_FORMO_WRITE_KEY || "YOUR_FORMO_WRITE_KEY";

// Base Formo Analytics configuration (without wagmi)
const baseFormoOptions: Omit<Options, "wagmi"> = {
  // App information for context enrichment
  app: {
    name: "Formo Analytics Demo",
    version: "1.0.0",
    bundleId: "com.formo.analytics.demo",
  },

  // Event batching configuration
  flushAt: 10, // Flush after 10 events
  flushInterval: 15000, // Flush every 15 seconds

  // Enable logging in development
  logger: {
    enabled: __DEV__,
    levels: ["debug", "info", "warn", "error", "log"],
  },

  // Ready callback
  ready: (formo) => {
    console.log("Formo Analytics initialized successfully!");
  },
};

// Create Formo options with wagmi integration
export const createFormoOptions = (
  wagmiConfig: Config,
  queryClient: QueryClient
): Options => ({
  ...baseFormoOptions,
  wagmi: {
    config: wagmiConfig,
    queryClient,
  },
});
