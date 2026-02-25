'use client'

import { useState } from 'react'
import { useWeb3Analytics } from '@/components/Web3Provider'
import { useFormo } from '@formo/analytics'

export default function HomePage() {
  const {
    wallet,
    connecting,
    connectedChain,
    settingChain,
    chains,
    connectWallet,
    disconnectWallet,
    switchChain,
    signMessage,
    sendTransaction,
  } = useWeb3Analytics()
  
  const analytics = useFormo()
  
  const [message, setMessage] = useState('Hello from Formo Analytics!')
  const [signature, setSignature] = useState('')
  const [txHash, setTxHash] = useState('')
  const [customEventData, setCustomEventData] = useState('{"action": "test", "value": 123}')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignMessage = async () => {
    if (!wallet) return
    
    setIsLoading(true)
    try {
      const sig = await signMessage(message)
      setSignature(sig || '')
    } catch (error) {
      console.error('Error signing message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendTransaction = async () => {
    if (!wallet) return
    
    setIsLoading(true)
    try {
      // Send 0 ETH to self for testing
      const tx = await sendTransaction(wallet.accounts[0].address, '0x0')
      setTxHash(typeof tx?.hash === 'string' ? tx.hash : '')
    } catch (error) {
      console.error('Error sending transaction:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomEvent = () => {
    try {
      const eventData = JSON.parse(customEventData)
      analytics.track('custom_event', eventData)
    } catch (error) {
      console.error('Invalid JSON:', error)
    }
  }

  const handleChainSwitch = async (chainId: string) => {
    await switchChain(chainId)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Formo × Web3 Onboard Example
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          This example demonstrates the integration between Formo Analytics and Web3 Onboard.
          Connect your wallet and test various events to see how they are tracked.
        </p>
      </div>

      {/* Wallet Connection Status */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Wallet Connection</h2>
        </div>
        
        <div className="space-y-4">
          {/* Connect/Disconnect Buttons */}
          <div className="flex flex-wrap gap-3">
            {!wallet && (
              <button
                onClick={async () => {
                  const walletsConnected = await connectWallet()
                  console.log('connected wallets: ', walletsConnected)
                }}
                disabled={connecting || isLoading}
                className="btn-primary"
              >
                {connecting ? 'Connecting...' : 'Select a Wallet'}
              </button>
            )}

            {wallet && (
              <>
                <button
                  onClick={async () => {
                    const walletsConnected = await connectWallet()
                    console.log('connected wallets: ', walletsConnected)
                  }}
                  disabled={isLoading}
                  className="btn-primary"
                >
                  Connect Another Wallet
                </button>
                
                <button 
                  onClick={disconnectWallet} 
                  disabled={isLoading}
                  className="btn-danger"
                >
                  Reset Wallet State
                </button>
              </>
            )}
          </div>

          {/* Wallet Info Display */}
          {wallet && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="status-connected">✓ Connected</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Wallet:</strong> {wallet.label}
                </div>
                <div>
                  <strong>Address:</strong> {wallet.accounts[0].address.slice(0, 6)}...{wallet.accounts[0].address.slice(-4)}
                </div>
                <div>
                  <strong>Chain:</strong> {chains.find(c => c.id === connectedChain?.id)?.label || 'Unknown'}
                </div>
                <div>
                  <strong>Chain ID:</strong> {connectedChain?.id || 'Unknown'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chain Switching */}
      {wallet && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Chain Switching</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {chains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleChainSwitch(chain.id)}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  connectedChain?.id === chain.id
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                disabled={settingChain || connectedChain?.id === chain.id}
              >
                {chain.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Signing */}
      {wallet && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Message Signing</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">Message to Sign</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="form-input"
                placeholder="Enter message to sign"
              />
            </div>
            
            <button
              onClick={handleSignMessage}
              className="btn-primary"
              disabled={isLoading || !message}
            >
              {isLoading ? 'Signing...' : 'Sign Message'}
            </button>
            
            {signature && (
              <div>
                <label className="form-label">Signature</label>
                <textarea
                  value={signature}
                  readOnly
                  className="form-input h-20 font-mono text-xs"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction Testing */}
      {wallet && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Transaction Testing</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will send 0 ETH to your own address for testing purposes.
            </p>
            
            <button
              onClick={handleSendTransaction}
              className="btn-success"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Test Transaction'}
            </button>
            
            {txHash && (
              <div>
                <label className="form-label">Transaction Hash</label>
                <input
                  type="text"
                  value={txHash}
                  readOnly
                  className="form-input font-mono text-xs"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Events */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Custom Events</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="form-label">Event Data (JSON)</label>
            <textarea
              value={customEventData}
              onChange={(e) => setCustomEventData(e.target.value)}
              className="form-input h-20 font-mono text-sm"
              placeholder='{"action": "test", "value": 123}'
            />
          </div>
          
          <button
            onClick={handleCustomEvent}
            className="btn-secondary"
          >
            Track Custom Event
          </button>
        </div>
      </div>

      {/* Event Information */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Tracked Events</h2>
        </div>
        
        <div className="space-y-3 text-sm">
          <p><strong>Automatic Events (tracked by Formo SDK):</strong></p>
          <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
            <li><code>page</code> - Tracked automatically on page navigation</li>
            <li><code>wallet_connect</code> - When wallet connects</li>
            <li><code>wallet_disconnect</code> - When wallet disconnects</li>
            <li><code>chain_change</code> - When switching chains</li>
            <li><code>signature</code> - When signing messages</li>
            <li><code>transaction</code> - When sending transactions</li>
          </ul>
          
          <p className="pt-2"><strong>Custom Events:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
            <li><code>custom_event</code> - User-defined events with custom data</li>
          </ul>
          
          <p className="pt-2 text-blue-600">
            💡 Check your browser&apos;s developer console and network tab to see real-time events!
          </p>
        </div>
      </div>
    </div>
  )
}
