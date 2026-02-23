"use client";

import { FC, ReactNode, useMemo } from "react";
import { FormoAnalyticsProvider } from "@formo/analytics";
import { QueryClient } from "@tanstack/react-query";
import { Config } from "wagmi";

type AnalyticsProviderProps = {
  writeKey: string;
  wagmiConfig: Config;
  queryClient: QueryClient;
  children: ReactNode;
};

export const AnalyticsProvider: FC<AnalyticsProviderProps> = ({
  writeKey,
  wagmiConfig,
  queryClient,
  children,
}) => {
  const options = useMemo(
    () => ({
      wagmi: {
        config: wagmiConfig,
        queryClient: queryClient,
      },
      tracking: true,
      flushInterval: 5000, // 5 secs
      logger: {
        enabled: true,
        levels: ["debug", "info", "error", "warn"] as ("debug" | "info" | "error" | "warn" | "trace")[],
      },
      autocapture: {
        connect: true,
        disconnect: true,
        chain: true,
        signature: true,
        transaction: true,
      },
    }),
    [wagmiConfig, queryClient]
  );

  return (
    <FormoAnalyticsProvider writeKey={writeKey} options={options}>
      {children}
    </FormoAnalyticsProvider>
  );
};

export default AnalyticsProvider;
