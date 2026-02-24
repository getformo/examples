'use client';

import { ThirdwebProvider } from '@thirdweb-dev/react';
import { Ethereum, Polygon } from '@thirdweb-dev/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';

interface ThirdwebProviderWrapperProps {
  children: React.ReactNode;
}

export function ThirdwebProviderWrapper({ children }: ThirdwebProviderWrapperProps) {
  const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

  // Create QueryClient with configuration that matches Thirdweb's expectations (v4 API)
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes (v4 uses cacheTime, not gcTime)
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 3,
      },
    },
  }), []);

  if (!clientId) {
    console.warn('NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThirdwebProvider
        clientId={clientId}
        activeChain={Ethereum}
        supportedChains={[Ethereum, Polygon]}
      >
        {children}
      </ThirdwebProvider>
    </QueryClientProvider>
  );
}
