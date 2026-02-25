'use client';

import { FormoAnalyticsProvider } from '@formo/analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

const formoWriteKey = process.env.NEXT_PUBLIC_FORMO_WRITE_KEY;

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  if (!formoWriteKey) {
    console.warn('NEXT_PUBLIC_FORMO_WRITE_KEY is not set');
    return <>{children}</>;
  }

  return (
    <FormoAnalyticsProvider
      writeKey={formoWriteKey}
      options={{
        tracking: true,
        flushInterval: 5000, // 5 seconds
        logger: {
          enabled: true,
          levels: ['error', 'warn', 'info'],
        },
      }}
    >
      {children}
    </FormoAnalyticsProvider>
  );
}
