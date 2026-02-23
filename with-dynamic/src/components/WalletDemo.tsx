import { DynamicWidget, useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useAccount, useBalance, useChainId, useSignMessage, useSendTransaction } from 'wagmi'
import { formatUnits } from 'viem'
import { useFormo } from '@formo/analytics'
import { useState } from 'react'

export function WalletDemo() {
  const { primaryWallet } = useDynamicContext()
  const { address, isConnected, connector } = useAccount()
  const chainId = useChainId()
  const formo = useFormo()

  const { data: balance } = useBalance({
    address,
    query: { enabled: !!address },
  })

  // Sign message hook
  const { signMessage, isPending: isSignPending } = useSignMessage()

  // Send transaction hook
  const { sendTransaction, isPending: isTxPending } = useSendTransaction()

  // Local state for custom event tracking
  const [customEventName, setCustomEventName] = useState('')
  const [customEventSent, setCustomEventSent] = useState(false)

  // Handle custom event tracking
  const handleTrackCustomEvent = async () => {
    if (!customEventName.trim()) return

    await formo.track(customEventName, {
      source: 'demo_app',
      walletConnected: isConnected,
      address: address || 'not_connected',
    })

    setCustomEventSent(true)
    setTimeout(() => setCustomEventSent(false), 2000)
    setCustomEventName('')
  }

  // Handle page view tracking
  const handleTrackPageView = async () => {
    await formo.page('demo', 'wallet_demo', {
      walletConnected: isConnected,
      address: address || 'not_connected',
    })
  }

  // Handle identify
  const handleIdentify = async () => {
    if (!address) return

    await formo.identify({
      address,
      providerName: connector?.name,
    })
  }

  // Handle sign message (Formo automatically tracks this via wagmi integration)
  const handleSignMessage = () => {
    signMessage({ message: 'Hello from Formo + Dynamic.xyz Demo!' })
  }

  // Handle send transaction (Formo automatically tracks this via wagmi integration)
  const handleSendTransaction = () => {
    if (!address) return

    // Send a minimal transaction (0 ETH to self for demo purposes)
    sendTransaction({
      to: address,
      value: 0n,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Formo + Dynamic.xyz Integration
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          This example demonstrates how to integrate{' '}
          <a href="https://formo.so" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
            Formo SDK 1.26.0
          </a>{' '}
          with{' '}
          <a href="https://dynamic.xyz" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
            Dynamic.xyz
          </a>{' '}
          wallet for web3 analytics.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Wallet Connection Card */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400 text-sm mb-4">
            Use Dynamic.xyz to connect your wallet. Formo will automatically track
            wallet events via wagmi integration.
          </p>
          <DynamicWidget />
        </div>

        {/* Wallet Status Card */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Wallet Status</h2>
          {isConnected ? (
            <div className="space-y-3">
              <div>
                <span className="text-gray-400 text-sm">Status:</span>
                <span className="ml-2 text-green-400 font-medium">Connected</span>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Address:</span>
                <p className="text-white font-mono text-sm break-all mt-1">
                  {address}
                </p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Chain ID:</span>
                <span className="ml-2 text-white">{chainId}</span>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Balance:</span>
                <span className="ml-2 text-white">
                  {balance ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}` : 'Loading...'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Connector:</span>
                <span className="ml-2 text-white">{connector?.name || 'Unknown'}</span>
              </div>
              {primaryWallet && (
                <div>
                  <span className="text-gray-400 text-sm">Dynamic Wallet:</span>
                  <span className="ml-2 text-white">{primaryWallet.connector.name}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400">No wallet connected</p>
          )}
        </div>

        {/* Formo Analytics Actions Card */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Manual Analytics</h2>
          <p className="text-gray-400 text-sm mb-4">
            Manually trigger Formo events. Wallet events are auto-tracked.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleTrackPageView}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Track Page View
            </button>

            <button
              onClick={handleIdentify}
              disabled={!isConnected}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Identify User
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                value={customEventName}
                onChange={(e) => setCustomEventName(e.target.value)}
                placeholder="Custom event name"
                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleTrackCustomEvent}
                disabled={!customEventName.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Track
              </button>
            </div>
            {customEventSent && (
              <p className="text-green-400 text-sm">Event sent!</p>
            )}
          </div>
        </div>

        {/* Wallet Actions Card (triggers auto-tracked events) */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Wallet Actions</h2>
          <p className="text-gray-400 text-sm mb-4">
            These actions are automatically tracked by Formo via wagmi integration.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleSignMessage}
              disabled={!isConnected || isSignPending}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isSignPending ? 'Signing...' : 'Sign Message'}
            </button>

            <button
              onClick={handleSendTransaction}
              disabled={!isConnected || isTxPending}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isTxPending ? 'Sending...' : 'Send Transaction (0 ETH)'}
            </button>

            <p className="text-gray-500 text-xs mt-2">
              Note: Transaction sends 0 ETH to yourself for demo purposes.
            </p>
          </div>
        </div>

        {/* Auto-tracked Events Info Card */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 md:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4">Auto-tracked Events</h2>
          <p className="text-gray-400 text-sm mb-4">
            The following events are automatically captured by Formo when using the wagmi integration:
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-gray-700/50 rounded-lg p-3">
              <h3 className="text-green-400 font-medium mb-1">Wallet Connect</h3>
              <p className="text-gray-400 text-sm">When a user connects their wallet</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <h3 className="text-red-400 font-medium mb-1">Wallet Disconnect</h3>
              <p className="text-gray-400 text-sm">When a user disconnects their wallet</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <h3 className="text-blue-400 font-medium mb-1">Chain Change</h3>
              <p className="text-gray-400 text-sm">When the user switches networks</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <h3 className="text-amber-400 font-medium mb-1">Signature Request</h3>
              <p className="text-gray-400 text-sm">When user signs a message</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <h3 className="text-purple-400 font-medium mb-1">Transaction</h3>
              <p className="text-gray-400 text-sm">When user sends a transaction</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <h3 className="text-cyan-400 font-medium mb-1">Page View</h3>
              <p className="text-gray-400 text-sm">Automatic page hit tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center">
        <div className="text-gray-400 text-sm">
          <p className="mb-2">
            Built with{' '}
            <a href="https://formo.so" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
              Formo SDK 1.26.0
            </a>
            {' • '}
            <a href="https://dynamic.xyz" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
              Dynamic.xyz
            </a>
            {' • '}
            <a href="https://wagmi.sh" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
              wagmi
            </a>
            {' • '}
            <a href="https://viem.sh" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
              viem
            </a>
          </p>
          <p>
            <a
              href="https://github.com/getformo/formo-example-dynamic"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
