import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { Buffer } from "buffer";

// Polyfill Buffer for browser compatibility
(window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

import App from "./App.tsx";
import { config } from "./wagmi.ts";

import { FormoAnalyticsProvider } from "@formo/analytics";

import "./index.css";

const queryClient = new QueryClient();

const WRITE_KEY = import.meta.env.VITE_FORMO_ANALYTICS_WRITE_KEY || "demo_key";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FormoAnalyticsProvider
          writeKey={WRITE_KEY}
          options={{
            tracking: true,
            flushInterval: 500 * 10, // 5 secs
            autocapture: true,
            wagmi: {
              config,
              queryClient,
            },
            logger: {
              enabled: true,
              levels: ["error", "warn", "info"],
            },
          }}
        >
          <App />
        </FormoAnalyticsProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
