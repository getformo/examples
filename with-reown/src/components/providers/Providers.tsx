'use client';

import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cookieToInitialState,
  WagmiProvider,
  useAccount,
  type Config,
} from 'wagmi';
import { FormoAnalyticsProvider, useFormo } from '@formo/analytics';
import { useAppKitState } from '@reown/appkit/react';
import { wagmiAdapter } from '~/config/wagmi';

// Import and initialize AppKit
import '~/config/appkit';

// Component to identify users in Formo by their wallet address
function FormoIdentify({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const formo = useFormo();

  useEffect(() => {
    if (address) {
      formo.identify({ address });
    }
  }, [address, formo]);

  return <>{children}</>;
}

// Inner component that waits for AppKit to be initialized
function AppKitReadyGate({ children }: { children: ReactNode }) {
  const { initialized } = useAppKitState();

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing AppKit...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

type ProvidersProps = {
  children: ReactNode;
  cookies: string | null;
};

export function Providers({ children, cookies }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  );

  // Memoize analytics options to prevent re-initialization
  const analyticsOptions = useMemo(
    () => ({
      wagmi: {
        config: wagmiAdapter.wagmiConfig,
        queryClient: queryClient,
      },
      tracking: true,
      flushInterval: 5000,
      logger: {
        enabled: true,
        levels: ['info', 'warn', 'error'] as ('info' | 'warn' | 'error')[],
      },
      autocapture: {
        connect: true,
        disconnect: true,
        chain: true,
        signature: true,
        transaction: true,
      },
    }),
    [queryClient]
  );

  const formoWriteKey =
    process.env.NEXT_PUBLIC_FORMO_WRITE_KEY || 'demo_write_key';

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>
        <FormoAnalyticsProvider writeKey={formoWriteKey} options={analyticsOptions}>
          <AppKitReadyGate>
            <FormoIdentify>{children}</FormoIdentify>
          </AppKitReadyGate>
        </FormoAnalyticsProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
