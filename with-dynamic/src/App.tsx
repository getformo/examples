import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { FormoAnalyticsProvider } from '@formo/analytics'

import { wagmiConfig } from './config/wagmi'
import { DYNAMIC_ENVIRONMENT_ID, walletConnectors } from './config/dynamic'
import { FORMO_WRITE_KEY } from './config/formo'
import { WalletDemo } from './components/WalletDemo'

// Create a query client for React Query (used by wagmi)
const queryClient = new QueryClient()

function App() {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: DYNAMIC_ENVIRONMENT_ID,
        walletConnectors,
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {/*
            Formo Analytics Provider with wagmi integration
            This enables automatic tracking of wallet events:
            - connect/disconnect
            - chain changes
            - signatures and transactions (when queryClient is provided)
          */}
          <FormoAnalyticsProvider
            writeKey={FORMO_WRITE_KEY}
            options={{
              wagmi: {
                config: wagmiConfig,
                queryClient,
              },
              // Enable all autocapture events
              autocapture: true,
              // Enable tracking on localhost for testing
              tracking: true,
              // Enable logging for debugging
              logger: {
                enabled: true,
                levels: ['info', 'warn', 'error'],
              },
            }}
          >
            <DynamicWagmiConnector>
              <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
                <WalletDemo />
              </main>
            </DynamicWagmiConnector>
          </FormoAnalyticsProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  )
}

export default App
