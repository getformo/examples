'use client'

import { FormoAnalyticsProvider, useFormo as useFormoSDK } from '@formo/analytics'
import { ReactNode } from 'react'

interface FormoProviderProps {
  children: ReactNode
}

export function FormoProvider({ children }: FormoProviderProps) {
  const writeKey = process.env.NEXT_PUBLIC_FORMO_WRITE_KEY

  if (!writeKey) {
    console.warn('NEXT_PUBLIC_FORMO_WRITE_KEY is not set. Analytics will not work.')
    return <>{children}</>
  }

  return (
    <FormoAnalyticsProvider
      writeKey={writeKey}
      options={{
        tracking: true, // Enable automatic event tracking
        logger: {
          enabled: process.env.NODE_ENV === 'development',
          levels: ['error', 'warn', 'info', 'debug'],
        },
      }}
    >
      {children}
    </FormoAnalyticsProvider>
  )
}

// Re-export the useFormo hook from the SDK
export const useFormo = useFormoSDK
