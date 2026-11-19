import type { Options } from "@formo/analytics-react-native";
import Constants from "expo-constants";
import type { Config } from "wagmi";
import type { QueryClient } from "@tanstack/react-query";

// Get your write key from https://app.formo.so
export const FORMO_WRITE_KEY =
  process.env.EXPO_PUBLIC_FORMO_WRITE_KEY || "YOUR_FORMO_WRITE_KEY";

// Read app identity from the Expo config (app.json) rather than hardcoding it,
// so there is one source of truth. These reach Formo as `app_version` and as
// the mobile `origin`, which means a hardcoded value that drifts from app.json
// silently reports the wrong version on every event forever.
const expoConfig = Constants.expoConfig;

// Base Formo Analytics configuration (without wagmi)
export const baseFormoOptions: Omit<Options, "wagmi"> = {
  // App information for context enrichment.
  //
  // Worth setting explicitly even though the SDK can auto-detect: in Expo Go
  // the native modules report EXPO GO's identity (its bundle id and version),
  // not your app's, and on React Native Web nothing resolves a bundle id at
  // all. Configuring these keeps dev and web builds reporting the real app.
  app: {
    name: expoConfig?.name ?? "Formo Analytics Demo",
    version: expoConfig?.version ?? "0.0.0",
    bundleId:
      expoConfig?.ios?.bundleIdentifier ??
      expoConfig?.android?.package ??
      "com.formo.analytics.demo",
  },

  // Autocapture. Wallet and lifecycle events are on by default; these two are
  // opt-in because enabling them changes how an app behaves:
  //   foregrounded — emits Application Foregrounded on every background ->
  //     active transition, IN ADDITION to the Application Opened that already
  //     fires there. Doubles foreground volume; enable it if you consume the
  //     Segment spec name directly.
  //   crashes — installs a global JS error handler (ErrorUtils) to report
  //     Application Crashed. The previous handler always runs afterwards, so
  //     the redbox and any existing crash reporter keep working.
  // Both are enabled here so the demo exercises them.
  autocapture: {
    foregrounded: true,
    crashes: true,
  },

  // Keep sensitive values in deep links out of analytics. The SDK reads deep
  // links and the launch URL for attribution, reports them in Deep Link
  // Opened / Application Opened, and saves the last one as the referrer.
  //
  // tracking.excludeQueryParams strips query parameters by name (the same
  // option as the web SDK). privy_oauth_code, privy_oauth_state and
  // privy_oauth_provider are always stripped; these are added on top.
  // Requires @formo/analytics-react-native >= 1.5.0.
  tracking: {
    excludeQueryParams: ["token", "access_token", "code", "state"],
  },

  // sanitizeUrl is for what a list of names cannot do: drop a whole link.
  // Return the URL to use, or "" to drop it. It receives the URL as it
  // arrived, before the parameters above are stripped.
  //
  // The usual case is a sign-in redirect. Even with its code stripped, the
  // callback link would replace the campaign link as the referrer of every
  // later event. Dropping it keeps the campaign.
  // Requires @formo/analytics-react-native >= 1.4.0.
  sanitizeUrl: (url) =>
    /[?&](privy_oauth_code|code)=/.test(url) ? "" : url,

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
