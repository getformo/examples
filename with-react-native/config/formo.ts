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

  // Filter the URLs the SDK stores or reports (deep links, the launch URL,
  // the saved referrer, and the `url` property of events). Return the URL to
  // use, or "" to drop it.
  //
  // The usual reason is a sign-in redirect: an OAuth provider returns to the
  // app through a deep link that carries a one-time code. Without a filter
  // that link is reported in Deep Link Opened, and it replaces the campaign
  // link as the referrer of every later event.
  //
  // Requires @formo/analytics-react-native >= 1.4.0.
  sanitizeUrl: (url) => {
    // Drop OAuth callbacks. The link is ignored and the campaign that came
    // before it stays.
    if (/[?&](code|state|privy_oauth_code|privy_oauth_state)=/.test(url)) {
      return "";
    }
    // Keep other links, without parameters that must stay private.
    return url.replace(/([?&])(token|access_token)=[^&#]*&?/g, "$1");
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
