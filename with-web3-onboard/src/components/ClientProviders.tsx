'use client'

import { ReactNode } from 'react'
import { FormoProvider } from '@/components/FormoProvider'
import { Web3Provider } from '@/components/Web3Provider'
import { Navigation } from '@/components/Navigation'
import { Web3OnboardProvider } from '@web3-onboard/react'
import { web3Onboard } from '@/lib/web3-onboard'

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <FormoProvider>
      <Web3OnboardProvider web3Onboard={web3Onboard}>
        <Web3Provider>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </Web3Provider>
      </Web3OnboardProvider>
    </FormoProvider>
  )
}
